const { getFirestore, getFirebaseAuth } = require("../cms/firebase");

const ALLOWED_ROLES = ["admin", "super_admin"];
const MAX_LOG_SCAN = 1000;

function getAdminServices() {
  const db = getFirestore();
  const auth = getFirebaseAuth();

  if (!db || !auth) {
    return {
      ok: false,
      status: 500,
      error: "Firebase Admin SDK is not configured on the server."
    };
  }

  return {
    ok: true,
    db,
    auth
  };
}

function getBearerToken(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== "string") {
    return "";
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function getClientIP(req) {
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function getUserAgent(req) {
  return (req.headers && req.headers["user-agent"]) || "unknown";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidRole(role) {
  return ALLOWED_ROLES.includes(role);
}

function serializeDateValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  return null;
}

function normalizeEventType(eventType) {
  if (eventType === "admin.user.create") {
    return "admin.user.created";
  }

  return String(eventType || "");
}

function mapAuditLog(doc) {
  const value = doc.data() || {};
  const metadata = value.metadata && typeof value.metadata === "object" ? value.metadata : {};

  return {
    id: doc.id,
    uid: String(value.uid || ""),
    email: normalizeEmail(value.email || ""),
    targetUid: String(value.targetUid || ""),
    targetEmail: normalizeEmail(value.targetEmail || metadata.targetEmail || ""),
    eventType: normalizeEventType(value.eventType),
    action: String(value.action || ""),
    targetRole: String(value.targetRole || metadata.targetRole || ""),
    ipAddress: String(value.ipAddress || value.ip || "unknown"),
    userAgent: String(value.userAgent || "unknown"),
    status: typeof value.status === "number" ? value.status : null,
    reason: String(value.reason || value.error || ""),
    role: String(value.role || ""),
    timestamp: serializeDateValue(value.timestamp)
  };
}

async function logAuditEvent(db, event) {
  try {
    await db.collection("adminAuditLogs").add({
      uid: event.uid || "",
      email: normalizeEmail(event.email || ""),
      targetUid: event.targetUid || "",
      targetEmail: normalizeEmail(event.targetEmail || ""),
      eventType: normalizeEventType(event.eventType),
      action: event.action || "",
      targetRole: event.targetRole || "",
      ipAddress: event.ipAddress || "unknown",
      userAgent: event.userAgent || "unknown",
      role: event.role || "",
      status: typeof event.status === "number" ? event.status : null,
      reason: event.reason || "",
      timestamp: require("firebase-admin").firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("[Admin Audit] Failed to write audit log:", error.message || error);
  }
}

async function verifyAdminRequest(req, options = {}) {
  const requireSuperAdmin = options.requireSuperAdmin === true;
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
    const adminUserRef = services.db.collection("adminUsers").doc(decodedToken.uid);
    const adminUserSnap = await adminUserRef.get();

    if (!adminUserSnap.exists) {
      return {
        ok: false,
        status: 403,
        error: "Not authorized to access admin resources",
        decodedToken,
        db: services.db,
        auth: services.auth
      };
    }

    const adminUser = adminUserSnap.data() || {};
    const role = String(adminUser.role || "");
    if (!isValidRole(role)) {
      return {
        ok: false,
        status: 403,
        error: "Admin role is invalid",
        decodedToken,
        db: services.db,
        auth: services.auth
      };
    }

    if (requireSuperAdmin && role !== "super_admin") {
      return {
        ok: false,
        status: 403,
        error: "Super admin access required",
        decodedToken,
        db: services.db,
        auth: services.auth,
        role
      };
    }

    return {
      ok: true,
      db: services.db,
      auth: services.auth,
      decodedToken,
      adminUserRef,
      adminUserSnap,
      adminUser,
      role
    };
  } catch (error) {
    const code = String(error && error.code || "");
    if (code === "auth/argument-error" || code === "auth/id-token-expired" || code === "auth/invalid-id-token" || code === "auth/invalid-credential") {
      return {
        ok: false,
        status: 401,
        error: "Invalid or expired Firebase ID token"
      };
    }

    console.error("[Admin Auth] Failed to verify request:", error.message || error);
    return {
      ok: false,
      status: 500,
      error: "Failed to verify admin session"
    };
  }
}

module.exports = {
  ALLOWED_ROLES,
  MAX_LOG_SCAN,
  getAdminServices,
  getBearerToken,
  getClientIP,
  getUserAgent,
  normalizeEmail,
  isValidEmail,
  isValidRole,
  serializeDateValue,
  normalizeEventType,
  mapAuditLog,
  logAuditEvent,
  verifyAdminRequest
};
