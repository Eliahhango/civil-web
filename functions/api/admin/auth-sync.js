const { getFirestore, isAdminUser } = require("../cms/firebase");

module.exports = async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const tokenPart = authHeader.split("Bearer ")[1];
    const adminAuth = require("firebase-admin").auth();
    const decodedToken = await adminAuth.verifyIdToken(tokenPart);

    // Any valid Auth token logs them in, but we'll sync them now
    const db = getFirestore();
    const userRef = db.collection("adminUsers").doc(decodedToken.uid);
    const userDoc = await userRef.get();

    let role = "super_admin"; // Default missing users to super_admin (assume manually added via Firebase Console)
    
    if (!userDoc.exists) {
      await userRef.set({
        email: decodedToken.email,
        role: "super_admin",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      // Set custom claim so the rules work
      await adminAuth.setCustomUserClaims(decodedToken.uid, { super_admin: true, admin: true });
    } else {
      role = userDoc.data().role;
      await userRef.update({
        lastLogin: new Date().toISOString()
      });
      if (role === 'super_admin') {
         await adminAuth.setCustomUserClaims(decodedToken.uid, { super_admin: true, admin: true });
      } else {
         await adminAuth.setCustomUserClaims(decodedToken.uid, { admin: true });
      }
    }

    // Write audit log securely
    await db.collection("adminAuditLogs").add({
      email: decodedToken.email,
      eventType: "admin.api.success",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      metadata: {
        method: req.method,
        path: req.originalUrl,
        reason: "",
        severity: "info",
        status: 200,
        uid: decodedToken.uid,
        userAgent: req.headers["user-agent"]
      },
      timestamp: adminAuth.app.options ? require("firebase-admin").firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    });

    return res.status(200).json({ success: true, role, uid: decodedToken.uid });
  } catch (error) {
    console.error("Auth sync error:", error);
    return res.status(500).json({ error: "Failed to sync auth" });
  }
};
