const admin = require("firebase-admin");
const {
  getAdminServices,
  getBearerToken,
  getClientIP,
  getUserAgent,
  logAuditEvent,
  normalizeEmail,
  verifyAdminRequest
} = require("./_shared");

function isCustomClaimsPermissionError(error) {
  const message = String((error && error.message) || error || "").toLowerCase();
  const code = String((error && error.code) || "").toLowerCase();

  return (
    code === "auth/internal-error" &&
    (
      message.includes("serviceusage.serviceusageconsumer") ||
      message.includes("serviceusage.services.use") ||
      message.includes("permission_denied") ||
      message.includes("caller does not have required permission")
    )
  );
}

function getBootstrapEmails() {
  return String(process.env.ADMIN_BOOTSTRAP_EMAILS || "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

async function bootstrapFirstSuperAdmin(req) {
  const services = getAdminServices();
  if (!services.ok) {
    return services;
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing Firebase ID token"
    };
  }

  try {
    const decodedToken = await services.auth.verifyIdToken(token);
    const email = normalizeEmail(decodedToken.email || "");
    const bootstrapEmails = getBootstrapEmails();

    if (!email || !bootstrapEmails.includes(email)) {
      return {
        ok: false,
        status: 403,
        error: "Not authorized to access admin resources",
        decodedToken,
        db: services.db,
        auth: services.auth
      };
    }

    const existingAdmins = await services.db.collection("adminUsers").limit(1).get();
    if (!existingAdmins.empty) {
      return {
        ok: false,
        status: 403,
        error: "Not authorized to access admin resources",
        decodedToken,
        db: services.db,
        auth: services.auth
      };
    }

    const adminUserRef = services.db.collection("adminUsers").doc(decodedToken.uid);
    await adminUserRef.set({
      uid: decodedToken.uid,
      email,
      role: "super_admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "bootstrap-auth-sync"
    }, { merge: true });

    await logAuditEvent(services.db, {
      uid: decodedToken.uid,
      email,
      eventType: "admin.user.bootstrap.created",
      status: 201,
      role: "super_admin",
      reason: "First super admin created during login bootstrap",
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });

    return {
      ok: true,
      bootstrapped: true
    };
  } catch (error) {
    console.error("[Auth Sync] Bootstrap failed:", error.message || error);
    return {
      ok: false,
      status: 500,
      error: "Failed to bootstrap first admin user"
    };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let authResult = await verifyAdminRequest(req);
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  if (!authResult.ok && authResult.status === 403) {
    const bootstrapResult = await bootstrapFirstSuperAdmin(req);
    if (bootstrapResult.ok) {
      authResult = await verifyAdminRequest(req);
    }
  }

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
    let claimsSynced = true;
    let warning = "";

    try {
      await auth.setCustomUserClaims(decodedToken.uid, {
        role,
        authorizedAt: new Date().toISOString()
      });
    } catch (error) {
      if (!isCustomClaimsPermissionError(error)) {
        throw error;
      }

      claimsSynced = false;
      warning = "Custom claims were not updated because Firebase Auth Admin permissions are still incomplete.";
      console.warn("[Auth Sync] Continuing without custom claims:", error.message || error);
    }

    await adminUserRef.set({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await logAuditEvent(db, {
      uid: decodedToken.uid,
      email: decodedToken.email,
      eventType: claimsSynced ? "admin.auth.success" : "admin.auth.success.degraded",
      status: 200,
      role,
      reason: claimsSynced ? `Authorized with role: ${role}` : warning,
      ipAddress: clientIP,
      userAgent
    });

    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role,
      claimsSynced,
      warning: warning || null
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
