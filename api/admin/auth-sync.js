const admin = require("firebase-admin");
const {
  getClientIP,
  getUserAgent,
  logAuditEvent,
  verifyAdminRequest
} = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authResult = await verifyAdminRequest(req);
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  if (!authResult.ok) {
    if (authResult.db && authResult.decodedToken) {
      await logAuditEvent(authResult.db, {
        uid: authResult.decodedToken.uid,
        email: authResult.decodedToken.email,
        eventType: "admin.auth.denied",
        status: authResult.status,
        reason: authResult.error,
        ipAddress: clientIP,
        userAgent
      });
    }

    return res.status(authResult.status).json({
      success: false,
      error: authResult.error
    });
  }

  const { db, auth, decodedToken, adminUserRef, role } = authResult;

  try {
    await auth.setCustomUserClaims(decodedToken.uid, {
      role,
      authorizedAt: new Date().toISOString()
    });

    await adminUserRef.set({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await logAuditEvent(db, {
      uid: decodedToken.uid,
      email: decodedToken.email,
      eventType: "admin.auth.success",
      status: 200,
      role,
      reason: `Authorized with role: ${role}`,
      ipAddress: clientIP,
      userAgent
    });

    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role
    });
  } catch (error) {
    console.error("[Auth Sync] Failed to authorize admin:", error.message || error);

    await logAuditEvent(db, {
      uid: decodedToken.uid,
      email: decodedToken.email,
      eventType: "admin.auth.error",
      status: 500,
      role,
      reason: error.message || "Unknown authorization error",
      ipAddress: clientIP,
      userAgent
    });

    return res.status(500).json({
      success: false,
      error: "Failed to synchronize admin authorization"
    });
  }
};
