const { getFirestore } = require("../cms/firebase");
const admin = require("firebase-admin");

/**
 * Admin Users Management Endpoint
 * 
 * GET: List all admin users (requires admin role)
 * POST: Create new admin user (requires super_admin role)
 *   - Accepts { email, role } only
 *   - Validates role against ['admin', 'super_admin']
 *   - Normalizes email (lowercase, trim)
 *   - Creates or reuses Firebase Auth user safely with temp password
 *   - Writes adminUsers and adminAuditLogs transactionally
 *   - Rolls back Auth user creation on Firestore failure
 */

module.exports = async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const tokenPart = authHeader.split("Bearer ")[1];
  let decodedToken;
  
  try {
    decodedToken = await admin.auth().verifyIdToken(tokenPart);
  } catch (error) {
    console.error("[Users] Token verification failed:", error.code);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const userRole = decodedToken.role; // Standardized custom claim
  console.log(`[Users] Request from ${decodedToken.email} with role: ${userRole}`);

  // GET: List users
  if (req.method === "GET") {
    try {
      // Require admin or super_admin role
      if (!userRole || !["admin", "super_admin"].includes(userRole)) {
        console.warn(`[Users] Unauthorized GET from: ${decodedToken.email} (role: ${userRole})`);
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const db = getFirestore();
      const usersSnapshot = await db.collection("adminUsers").get();
      
      const users = [];
      usersSnapshot.forEach(doc => {
        users.push({
          uid: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          createdAt: doc.data().createdAt,
        });
      });

      return res.status(200).json({
        users,
        currentUserRole: userRole,
        success: true
      });
    } catch (error) {
      console.error("[Users] GET error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  // POST: Create new admin user
  if (req.method === "POST") {
    try {
      // Require super_admin role
      if (userRole !== "super_admin") {
        console.warn(`[Users] Unauthorized POST from: ${decodedToken.email} (role: ${userRole})`);
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }

      const { email, role } = req.body;

      // Validate inputs
      if (!email || typeof email !== "string" || !role || typeof role !== "string") {
        return res.status(400).json({ error: "Missing or invalid email/role" });
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Validate email format
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate role
      if (!["admin", "super_admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role: must be 'admin' or 'super_admin'" });
      }

      const db = getFirestore();
      const authService = admin.auth();
      let newAuthUserUid = null;
      let isNewAuthUser = false;

      // Start transaction for adminUsers + adminAuditLogs
      try {
        // Check for duplicate email in adminUsers
        const existingQuery = await db.collection("adminUsers")
          .where("email", "==", normalizedEmail)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          return res.status(409).json({ error: "Email already exists in admin users" });
        }

        // Try to get or create Auth user
        let authUser;
        try {
          authUser = await authService.getUserByEmail(normalizedEmail);
          console.log(`[Users] Reusing existing Auth user: ${normalizedEmail}`);
        } catch (getUserError) {
          if (getUserError.code !== "auth/user-not-found") {
            throw getUserError;
          }
          // User doesn't exist, create with temporary password
          const tempPassword = generateTempPassword();
          authUser = await authService.createUser({
            email: normalizedEmail,
            password: tempPassword,
            emailVerified: false
          });
          isNewAuthUser = true;
          newAuthUserUid = authUser.uid;
          console.log(`[Users] Created new Auth user: ${normalizedEmail}`);
        }

        const authUserUid = authUser.uid;

        // Check if Auth user already has adminUsers entry
        const authUserDocSnap = await db.collection("adminUsers").doc(authUserUid).get();
        if (authUserDocSnap.exists) {
          // Auth user already has an admin entry, this is an error
          if (isNewAuthUser) {
            // Rollback: delete the newly created Auth user
            try {
              await authService.deleteUser(authUserUid);
              console.log(`[Users] Rolled back Auth user creation for: ${normalizedEmail}`);
            } catch (rollbackError) {
              console.error(`[Users] CRITICAL: Failed to rollback Auth user ${authUserUid}:`, rollbackError);
              // Log for manual cleanup
              await logAuditEvent(db, {
                uid: decodedToken.uid,
                email: decodedToken.email,
                eventType: "admin.user.creation.rollback.failed",
                targetEmail: normalizedEmail,
                reason: `Failed to delete Auth user on duplicate check: ${rollbackError.message}`,
              });
            }
          }
          return res.status(409).json({ error: "Email already exists in admin users" });
        }

        // Transactional write: adminUsers + adminAuditLogs
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const now = new Date().toISOString();

        await db.runTransaction(async (transaction) => {
          // Write to adminUsers
          transaction.set(db.collection("adminUsers").doc(authUserUid), {
            email: normalizedEmail,
            role: role,
            createdAt: timestamp,
            createdBy: decodedToken.uid,
            authUserCreatedAt: isNewAuthUser ? now : null,
          });

          // Write to adminAuditLogs
          transaction.set(db.collection("adminAuditLogs").doc(), {
            uid: decodedToken.uid,
            email: decodedToken.email,
            eventType: "admin.user.created",
            targetEmail: normalizedEmail,
            targetRole: role,
            targetUid: authUserUid,
            targetAuthUserCreatedNow: isNewAuthUser,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            timestamp: timestamp,
          });
        });

        // Set custom claims for the Auth user (role claim for new or existing)
        const customClaims = { role: role };
        await authService.setCustomUserClaims(authUserUid, customClaims);
        console.log(`[Users] Custom claims set for ${normalizedEmail}:`, customClaims);

        return res.status(201).json({
          success: true,
          uid: authUserUid,
          email: normalizedEmail,
          role: role,
          message: isNewAuthUser ? "Admin user created" : "Admin user associated with existing Auth user"
        });

      } catch (transactionError) {
        console.error("[Users] Transaction error:", transactionError);

        // Rollback Auth user if we created it
        if (isNewAuthUser && newAuthUserUid) {
          try {
            await authService.deleteUser(newAuthUserUid);
            console.log(`[Users] Rolled back Auth user creation for: ${normalizedEmail}`);
          } catch (rollbackError) {
            console.error(`[Users] CRITICAL: Failed to rollback Auth user ${newAuthUserUid}:`, rollbackError);
            // Log for manual cleanup
            await logAuditEvent(db, {
              uid: decodedToken.uid,
              email: decodedToken.email,
              eventType: "admin.user.creation.rollback.failed",
              targetEmail: normalizedEmail,
              reason: `Failed to delete Auth user after transaction failure: ${rollbackError.message}`,
            }).catch(logErr => {
              console.error("[Users] Failed to log rollback failure:", logErr);
            });
          }
        }
        
        throw transactionError;
      }

    } catch (error) {
      console.error("[Users] POST error:", error);
      if (error.code === "PERMISSION_DENIED") {
        return res.status(403).json({ error: "Firestore permission denied" });
      }
      return res.status(500).json({ error: error.message || "Failed to create admin user" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
};

/**
 * Helper: Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Helper: Generate temporary password
 */
function generateTempPassword() {
  // Generate a secure temp password: 16 chars with mixed case, numbers, and special chars
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Helper: Log audit events
 */
async function logAuditEvent(db, event) {
  try {
    const admin = require("firebase-admin");
    await db.collection("adminAuditLogs").add({
      uid: event.uid,
      email: event.email,
      eventType: event.eventType,
      targetEmail: event.targetEmail,
      reason: event.reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[Users] Logged audit event: ${event.eventType}`);
  } catch (logError) {
    console.error("[Users] Failed to write audit log:", logError);
    // Don't throw - audit failures shouldn't block the response
  }
}
