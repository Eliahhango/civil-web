const admin = require("firebase-admin");
const {
  isValidEmail,
  isValidRole,
  normalizeEmail,
  serializeDateValue,
  getClientIP,
  getUserAgent,
  logAuditEvent,
  verifyAdminRequest
} = require("./_shared");

function createTemporaryPassword() {
  return `Tmp-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-6)}`;
}

function isAuthPermissionError(error) {
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

async function createUserViaIdentityToolkit(email, password) {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY is required for Auth REST fallback");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && payload.error && payload.error.message ? payload.error.message : `HTTP ${response.status}`;
    const error = new Error(`Firebase Auth REST signup failed: ${message}`);
    error.code = payload && payload.error && payload.error.message === "EMAIL_EXISTS" ? "auth/email-already-exists" : "";
    throw error;
  }

  return {
    uid: String(payload.localId || ""),
    email: String(payload.email || email),
    idToken: String(payload.idToken || "")
  };
}

async function deleteUserViaIdentityToolkit(idToken) {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey || !idToken) {
    return;
  }

  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  });
}

async function handleGet(req, res) {
  const authResult = await verifyAdminRequest(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({
      success: false,
      error: authResult.error
    });
  }

  try {
    const snapshot = await authResult.db.collection("adminUsers").orderBy("email", "asc").get();
    const users = snapshot.docs.map((doc) => {
      const value = doc.data() || {};
      return {
        uid: doc.id,
        email: String(value.email || ""),
        role: String(value.role || "admin"),
        createdAt: serializeDateValue(value.createdAt),
        lastLogin: serializeDateValue(value.lastLogin),
        createdBy: String(value.createdBy || "")
      };
    });

    return res.status(200).json({
      success: true,
      users,
      currentUserRole: authResult.role,
      currentUserEmail: String(authResult.decodedToken.email || authResult.adminUser.email || "")
    });
  } catch (error) {
    console.error("[Admin Users] Failed to fetch users:", error.message || error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin users"
    });
  }
}

async function handlePost(req, res) {
  const authResult = await verifyAdminRequest(req, { requireSuperAdmin: true });
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  if (!authResult.ok) {
    if (authResult.db && authResult.decodedToken) {
      await logAuditEvent(authResult.db, {
        uid: authResult.decodedToken.uid,
        email: authResult.decodedToken.email,
        eventType: "admin.user.create.denied",
        status: authResult.status,
        role: authResult.role || "",
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

  const email = normalizeEmail(req.body && req.body.email);
  const role = String(req.body && req.body.role || "").trim();

  if (!email || !role) {
    return res.status(400).json({
      success: false,
      error: "Email and role are required"
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format"
    });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({
      success: false,
      error: "Role must be either admin or super_admin"
    });
  }

  const { db, auth, decodedToken } = authResult;
  let targetUser = null;
  let createdAuthUser = false;
  let createdViaRest = false;
  let createdRestIdToken = "";
  let authLookupBlocked = false;

  try {
    const existingAdminByEmail = await db.collection("adminUsers").where("email", "==", email).limit(1).get();
    if (!existingAdminByEmail.empty) {
      return res.status(409).json({
        success: false,
        error: "That email is already an admin user"
      });
    }

    try {
      targetUser = await auth.getUserByEmail(email);
    } catch (error) {
      if (String(error && error.code || "") === "auth/user-not-found") {
        targetUser = null;
      } else if (isAuthPermissionError(error)) {
        authLookupBlocked = true;
      } else {
        throw error;
      }
    }

    if (!targetUser) {
      const temporaryPassword = createTemporaryPassword();

      try {
        if (authLookupBlocked) {
          throw Object.assign(new Error("Firebase Auth Admin permissions unavailable"), {
            code: "auth/internal-error"
          });
        }

        targetUser = await auth.createUser({
          email,
          password: temporaryPassword,
          emailVerified: true
        });
      } catch (error) {
        if (!isAuthPermissionError(error)) {
          throw error;
        }

        const restUser = await createUserViaIdentityToolkit(email, temporaryPassword);
        if (!restUser.uid) {
          throw new Error("Firebase Auth REST signup did not return a user ID.");
        }

        targetUser = {
          uid: restUser.uid,
          email: restUser.email
        };
        createdViaRest = true;
        createdRestIdToken = restUser.idToken;
      }
      createdAuthUser = true;
    }

    const targetRef = db.collection("adminUsers").doc(targetUser.uid);
    const targetSnap = await targetRef.get();
    if (targetSnap.exists) {
      return res.status(409).json({
        success: false,
        error: "That account already has admin access"
      });
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(targetRef, {
        uid: targetUser.uid,
        email,
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
        createdBy: decodedToken.uid
      });

      transaction.set(db.collection("adminAuditLogs").doc(), {
        uid: decodedToken.uid,
        email: normalizeEmail(decodedToken.email || ""),
        targetUid: targetUser.uid,
        targetEmail: email,
        eventType: "admin.user.created",
        action: "created",
        targetRole: role,
        ipAddress: clientIP,
        userAgent,
        role: authResult.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return res.status(201).json({
      success: true,
      user: {
        uid: targetUser.uid,
        email,
        role
      },
      message: "Admin created. They can use Forgot Password on the admin login page to set their password."
    });
  } catch (error) {
    console.error("[Admin Users] Failed to create admin user:", error.message || error);

    if (createdAuthUser && targetUser) {
      try {
        if (createdViaRest) {
          await deleteUserViaIdentityToolkit(createdRestIdToken);
        } else {
          await auth.deleteUser(targetUser.uid);
        }
      } catch (rollbackError) {
        console.error("[Admin Users] Failed to roll back Auth user:", rollbackError.message || rollbackError);

        await logAuditEvent(db, {
          uid: decodedToken.uid,
          email: decodedToken.email,
          targetUid: targetUser.uid,
          targetEmail: email,
          eventType: "admin.user.creation.rollback.failed",
          status: 500,
          role: authResult.role,
          reason: rollbackError.message || "Failed to delete partially created auth user",
          ipAddress: clientIP,
          userAgent
        });
      }
    }

    if (String(error && error.code || "") === "auth/email-already-exists") {
      return res.status(409).json({
        success: false,
        error: "That email already exists in Firebase Auth"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create admin user"
    });
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "POST") {
    return handlePost(req, res);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({
    success: false,
    error: "Method not allowed"
  });
};
