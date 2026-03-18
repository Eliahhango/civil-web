const { getFirestore } = require("../cms/firebase");

module.exports = async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const tokenPart = authHeader.split("Bearer ")[1];
    const adminAuth = require("firebase-admin").auth();
    const decodedToken = await adminAuth.verifyIdToken(tokenPart);

    if (decodedToken.super_admin !== true) {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }

    const db = getFirestore();

    if (req.method === "GET") {
      // List users
      const usersSnapshot = await db.collection("adminUsers").get();
      const users = [];
      usersSnapshot.forEach(doc => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      return res.status(200).json({ users });
    }

    if (req.method === "POST") {
      // Create user
      const { email, password, role } = req.body;
      if (!email || !password || !role) {
         return res.status(400).json({ error: "Missing email, password, or role" });
      }

      // Create in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: email,
        password: password,
        emailVerified: true
      });

      // Set Claims
      if (role === 'super_admin') {
         await adminAuth.setCustomUserClaims(userRecord.uid, { super_admin: true, admin: true });
      } else {
         await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
      }

      // Create in Firestore
      await db.collection("adminUsers").doc(userRecord.uid).set({
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid
      });

       // Log audit
      await db.collection("adminAuditLogs").add({
        email: decodedToken.email,
        eventType: "admin.user.create",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
        metadata: {
          targetEmail: email,
          targetRole: role
        },
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({ success: true, uid: userRecord.uid });
    }

    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (error) {
    console.error("Users API error:", error);
    return res.status(500).json({ error: error.message });
  }
};
