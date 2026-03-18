/* ====================================================================
   Backend Authorization Endpoint - /api/admin/auth-sync
   Enforces pre-authorization: Only Firestore-listed users can enter
   No auto-creation, no defaults, no implicit elevation
   ==================================================================== */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK (uses FIREBASE_ADMIN_CREDENTIALS from environment)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Helper: Get client IP address
function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
  return ip || "unknown";
}

// Helper: Get user agent
function getUserAgent(req) {
  return req.headers["user-agent"] || "unknown";
}

// Main handler
export default async function handler(req, res) {
  console.log("[Auth Sync] Request initiated");

  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require Bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    console.warn("[Auth Sync] Missing authorization token");
    return res.status(401).json({ error: "Unauthorized - missing token" });
  }

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    // Verify Firebase ID token
    console.log("[Auth Sync] Verifying Firebase token");
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    console.log(`[Auth Sync] Token verified for uid: ${uid}, email: ${email}`);

    // Check if user exists in adminUsers collection
    console.log(`[Auth Sync] Checking Firestore adminUsers collection`);
    const adminUserRef = db.collection("adminUsers").doc(uid);
    const adminUserSnap = await adminUserRef.get();

    if (!adminUserSnap.exists) {
      // User NOT authorized - never auto-create
      console.warn(
        `[Auth Sync] User NOT authorized (uid: ${uid}, email: ${email})`
      );

      // Log denied attempt
      await db.collection("adminAuditLogs").add({
        uid: uid,
        email: email,
        eventType: "admin.auth.denied",
        ipAddress: clientIP,
        userAgent: userAgent,
        reason: "User not found in adminUsers collection",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(403).json({
        error: "Access denied",
        success: false,
      });
    }

    // User IS authorized
    const userData = adminUserSnap.data();
    const userRole = userData.role || "admin";
    console.log(
      `[Auth Sync] User authorized with role: ${userRole}`
    );

    // Set custom claims for role-based access control
    // Claims are available in Firebase ID token and can be used by other services
    await admin.auth().setCustomUserClaims(uid, {
      role: userRole,
      authorizedAt: new Date().toISOString(),
    });

    // Update lastLogin timestamp
    await adminUserRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log successful auth
    await db.collection("adminAuditLogs").add({
      uid: uid,
      email: email,
      eventType: "admin.auth.success",
      ipAddress: clientIP,
      userAgent: userAgent,
      role: userRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Auth Sync] Authorization successful for ${email}`);

    return res.status(200).json({
      success: true,
      uid: uid,
      email: email,
      role: userRole,
    });
  } catch (error) {
    // Token verification error
    if (
      error.code === "auth/argument-error" ||
      error.code === "auth/invalid-credential"
    ) {
      console.warn("[Auth Sync] Invalid/expired token");
      return res.status(401).json({
        error: "Unauthorized - invalid token",
        success: false,
      });
    }

    // Other errors
    console.error("[Auth Sync Error]", error.code || error.message);

    // Log error attempt
    const email = req.body?.email || "unknown";
    await db.collection("adminAuditLogs").add({
      email: email,
      eventType: "admin.auth.error",
      ipAddress: clientIP,
      userAgent: userAgent,
      error: error.message || "Unknown error",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(500).json({
      error: "Authorization check failed",
      success: false,
    });
  }
}
