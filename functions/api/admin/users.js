/* ====================================================================
   Admin Users Management - GET and POST endpoints
   - GET: List all admin users
   - POST: Create new admin user (super_admin only)
   ==================================================================== */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Allowed roles
const ALLOWED_ROLES = ["admin", "super_admin"];

// Helper: Get client IP
function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
}

// Helper: Get user agent
function getUserAgent(req) {
  return req.headers["user-agent"] || "unknown";
}

// Helper: Normalize email (lowercase, trim)
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// Helper: Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Validate role
function validateRole(role) {
  return ALLOWED_ROLES.includes(role);
}

// GET handler: List all admin users
async function handleGetUsers(req, res) {
  console.log("[Users GET] Request started");

  // Verify Bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    console.warn("[Users GET] Missing authorization token");
    return res.status(401).json({ error: "Unauthorized - missing token" });
  }

  try {
    // Verify token and get user info
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    console.log(`[Users GET] Verified token for uid: ${uid}`);

    // Check if user is authorized (must be in adminUsers)
    const adminUserRef = db.collection("adminUsers").doc(uid);
    const adminUserSnap = await adminUserRef.get();

    if (!adminUserSnap.exists) {
      console.warn(`[Users GET] User not authorized (uid: ${uid})`);
      return res.status(403).json({
        error: "Not authorized to view users",
        success: false,
      });
    }

    const userData = adminUserSnap.data();
    const userRole = userData.role || "admin";

    console.log(`[Users GET] User authorized with role: ${userRole}`);

    // Fetch all admin users
    const usersSnapshot = await db.collection("adminUsers").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      users.push({
        uid: doc.id,
        email: user.email,
        role: user.role || "admin",
        createdAt: user.createdAt ? user.createdAt.toDate().toISOString() : null,
        lastLogin: user.lastLogin ? user.lastLogin.toDate().toISOString() : null,
      });
    });

    console.log(`[Users GET] Returning ${users.length} users`);

    return res.status(200).json({
      success: true,
      users: users.sort((a, b) => (a.email || "").localeCompare(b.email || "")),
      currentUserRole: userRole,
      currentUserEmail: email,
    });
  } catch (error) {
    console.error("[Users GET Error]", error.code || error.message);

    if (error.code === "auth/argument-error" || error.code === "auth/invalid-credential") {
      return res.status(401).json({
        error: "Invalid or expired token",
        success: false,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch users",
      success: false,
    });
  }
}

// POST handler: Create new admin user
async function handleCreateUser(req, res) {
  console.log("[Users POST] Request started");

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  // Verify Bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    console.warn("[Users POST] Missing authorization token");
    return res.status(401).json({ error: "Unauthorized - missing token" });
  }

  // Parse request body
  const { email, role } = req.body || {};

  try {
    // Validate inputs
    if (!email || !role) {
      console.warn("[Users POST] Missing required fields");
      return res.status(400).json({
        error: "Email and role are required",
        success: false,
      });
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Validate email format
    if (!validateEmail(normalizedEmail)) {
      console.warn(`[Users POST] Invalid email format: ${normalizedEmail}`);
      return res.status(400).json({
        error: "Invalid email format",
        success: false,
      });
    }

    // Validate role
    if (!validateRole(role)) {
      console.warn(`[Users POST] Invalid role: ${role}`);
      return res.status(400).json({
        error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}`,
        success: false,
      });
    }

    // Verify token and check super_admin permission
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const creatorEmail = decodedToken.email || "";

    console.log(`[Users POST] Verified token for uid: ${uid}`);

    // Only super_admin can create new admins
    const creatorRef = db.collection("adminUsers").doc(uid);
    const creatorSnap = await creatorRef.get();

    if (!creatorSnap.exists || creatorSnap.data().role !== "super_admin") {
      console.warn(`[Users POST] User not super_admin (uid: ${uid})`);
      return res.status(403).json({
        error: "Only super_admin users can create new admins",
        success: false,
      });
    }

    console.log(`[Users POST] Creator is super_admin, proceeding to create user`);

    // Check if user already exists in adminUsers
    const existingAdmin = await db
      .collection("adminUsers")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      console.warn(`[Users POST] Email already registered: ${normalizedEmail}`);
      return res.status(409).json({
        error: "Email already registered as admin user",
        success: false,
      });
    }

    // Check if user exists in Firebase Auth
    let existingAuthUser = null;
    try {
      existingAuthUser = await auth.getUserByEmail(normalizedEmail);
      console.log(`[Users POST] User exists in Auth: ${normalizedEmail}`);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error; // Re-throw unexpected errors
      }
      // User doesn't exist, which is expected for new admins
      console.log(`[Users POST] User not in Auth (new user), will create`);
    }

    let newUser = null;
    let newAuthUserCreated = false;

    try {
      // Create user in Firebase Auth if not exists
      if (!existingAuthUser) {
        // Generate temporary random password
        const tempPassword = Math.random().toString(36).slice(-12);

        console.log(`[Users POST] Creating Auth user with email: ${normalizedEmail}`);
        newUser = await auth.createUser({
          email: normalizedEmail,
          password: tempPassword,
          emailVerified: false,
        });

        newAuthUserCreated = true;
        console.log(`[Users POST] Auth user created: ${newUser.uid}`);
      } else {
        newUser = existingAuthUser;
        console.log(`[Users POST] Using existing Auth user: ${newUser.uid}`);
      }

      // Now create admin record in Firestore with transaction
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("adminUsers").doc(newUser.uid);

        // Check again for race condition (another process might have created it)
        const snap = await transaction.get(userRef);
        if (snap.exists) {
          throw new Error("Admin user already exists (race condition)");
        }

        // Create admin user record
        transaction.set(userRef, {
          uid: newUser.uid,
          email: normalizedEmail,
          role: role,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null,
          createdBy: uid,
        });

        // Create audit log entry
        const auditLogRef = db.collection("adminAuditLogs").doc();
        transaction.set(auditLogRef, {
          uid: uid,
          email: creatorEmail,
          targetUid: newUser.uid,
          targetEmail: normalizedEmail,
          eventType: "admin.user.created",
          action: "created",
          targetRole: role,
          ipAddress: clientIP,
          userAgent: userAgent,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`[Users POST] Admin user created successfully: ${newUser.uid}`);

      return res.status(201).json({
        success: true,
        user: {
          uid: newUser.uid,
          email: normalizedEmail,
          role: role,
        },
      });
    } catch (error) {
      console.error("[Users POST Error]", error.message);

      // ROLLBACK: Delete Auth user if we created one and Firestore/audit failed
      if (newAuthUserCreated && newUser) {
        try {
          console.warn(`[Users POST] Rolling back Auth user: ${newUser.uid}`);
          await auth.deleteUser(newUser.uid);
          console.log(`[Users POST] Auth user deleted (rollback successful)`);
        } catch (deleteError) {
          console.error("[Users POST Rollback Error] Failed to delete Auth user:", deleteError.message);
          // Log this critical error for manual cleanup
          try {
            await db.collection("adminAuditLogs").add({
              eventType: "admin.user.creation.rollback.failed",
              failedRollbackUid: newUser.uid,
              failedRollbackEmail: normalizedEmail,
              reason: deleteError.message,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          } catch (auditError) {
            console.error("Failed to log rollback failure:", auditError.message);
          }
        }
      }

      // Return appropriate error response
      if (error.message.includes("race condition")) {
        return res.status(409).json({
          error: "Admin user already exists",
          success: false,
        });
      }

      return res.status(500).json({
        error: "Failed to create admin user",
        success: false,
      });
    }
  } catch (error) {
    console.error("[Users POST Error]", error.code || error.message);

    if (error.code === "auth/argument-error" || error.code === "auth/invalid-credential") {
      return res.status(401).json({
        error: "Invalid or expired token",
        success: false,
      });
    }

    return res.status(500).json({
      error: "Failed to process request",
      success: false,
    });
  }
}

// Main handler
export default async function handler(req, res) {
  console.log(`[Users API] ${req.method} request`);

  if (req.method === "GET") {
    return await handleGetUsers(req, res);
  } else if (req.method === "POST") {
    return await handleCreateUser(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
