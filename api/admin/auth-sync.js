const { getFirestore } = require("../cms/firebase");

/**
 * CRITICAL SECURITY: This endpoint enforces admin authorization
 * - ONLY pre-authorized admins (in Firestore adminUsers collection) can access
 * - NO automatic user creation
 * - NO automatic role assignment
 * - SERVER-SIDE VERIFICATION ONLY
 * Audit logs all attempts (success and denied) for security monitoring
 */
module.exports = async function handler(req, res) {
  const admin = require("firebase-admin");
  const db = getFirestore();
  const adminAuth = admin.auth();
  
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      console.warn("[Auth Sync] Missing or invalid authorization header");
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const tokenPart = authHeader.split("Bearer ")[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(tokenPart);
    } catch (tokenError) {
      console.error("[Auth Sync] Token verification failed:", tokenError.code);
      
      // Log denied attempt for invalid token
      await logAuditEvent(db, {
        uid: "unknown",
        email: "unknown",
        eventType: "admin.auth.denied",
        reason: "Invalid or expired token",
        status: 401,
        ip: ipAddress,
        userAgent: userAgent
      });
      
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    console.log(`[Auth Sync] Token verified for: ${decodedToken.email} (${decodedToken.uid})`);

    // CRITICAL: Check if user is pre-authorized in adminUsers collection
    const db_instance = getFirestore();
    const userRef = db_instance.collection("adminUsers").doc(decodedToken.uid);
    const userDoc = await userRef.get();

    // User MUST exist in adminUsers to be authorized
    if (!userDoc.exists) {
      console.warn(`[Auth Sync] Unauthorized access attempt from: ${decodedToken.email} (${decodedToken.uid})`);
      
      // Log denied attempt for unauthorized user
      await logAuditEvent(db, {
        uid: decodedToken.uid,
        email: decodedToken.email,
        eventType: "admin.auth.denied",
        reason: "User not in adminUsers collection",
        status: 403,
        ip: ipAddress,
        userAgent: userAgent
      });
      
      // Security note: Do NOT reveal whether email exists in system
      return res.status(403).json({ 
        success: false,
        error: "You are not authorized to access the admin dashboard" 
      });
    }

    const userRole = userDoc.data().role;
    console.log(`[Auth Sync] User authorized with role: ${userRole}`);

    // User is authorized! Update last login and set custom claims
    await userRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    // Set custom claims based on role
    const customClaims = {
      admin: true,
      super_admin: userRole === "super_admin"
    };
    await adminAuth.setCustomUserClaims(decodedToken.uid, customClaims);
    console.log(`[Auth Sync] Custom claims set for ${decodedToken.email}:`, customClaims);

    // Log successful auth
    await logAuditEvent(db, {
      uid: decodedToken.uid,
      email: decodedToken.email,
      eventType: "admin.auth.success",
      reason: `Authorized with role: ${userRole}`,
      status: 200,
      ip: ipAddress,
      userAgent: userAgent
    });

    return res.status(200).json({ 
      success: true,
      role: userRole,
      uid: decodedToken.uid,
      customClaims: customClaims
    });

  } catch (error) {
    console.error("[Auth Sync] Unexpected error:", error);
    
    // Log unexpected error
    await logAuditEvent(db, {
      uid: "unknown",
      email: "unknown",
      eventType: "admin.auth.error",
      reason: error.message || "Unknown error",
      status: 500,
      ip: ipAddress,
      userAgent: userAgent
    }).catch(logErr => {
      console.error("[Auth Sync] Failed to log error event:", logErr);
    });
    
    return res.status(500).json({ 
      success: false,
      error: "Server error during authorization check" 
    });
  }
};

/**
 * Helper: Log auth attempts (both success and denied) for security audit trail
 */
async function logAuditEvent(db, event) {
  try {
    const admin = require("firebase-admin");
    await db.collection("adminAuditLogs").add({
      uid: event.uid,
      email: event.email,
      eventType: event.eventType, // "admin.auth.success", "admin.auth.denied", "admin.auth.error"
      reason: event.reason,
      status: event.status,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[Auth Sync] Logged audit event: ${event.eventType} for ${event.email}`);
  } catch (logError) {
    console.error("[Auth Sync] Failed to write audit log:", logError);
    // Don't throw - audit failures shouldn't block auth
  }
}
