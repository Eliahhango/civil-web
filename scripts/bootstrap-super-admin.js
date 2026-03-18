const path = require("path");
const admin = require("firebase-admin");
const { loadEnvFiles } = require("./load-env");

const rootDir = path.resolve(__dirname, "..");
loadEnvFiles(rootDir);

const {
  getFirebaseAdminConfigState,
  getFirebaseAuth,
  getFirestore
} = require("../api/cms/firebase");

const ALLOWED_ROLES = ["admin", "super_admin"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

async function createUserViaIdentityToolkit(email, password, displayName) {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY is required for Auth REST bootstrap fallback.");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      displayName: displayName || undefined,
      returnSecureToken: true
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && payload.error && payload.error.message ? payload.error.message : `HTTP ${response.status}`;
    throw new Error(`Firebase Auth REST signup failed: ${message}`);
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

function parseArgs(argv) {
  const options = {
    email: "",
    password: "",
    role: "super_admin",
    name: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = argv[index + 1];

    if (arg === "--email") {
      options.email = nextValue || "";
      index += 1;
    } else if (arg === "--password") {
      options.password = nextValue || "";
      index += 1;
    } else if (arg === "--role") {
      options.role = nextValue || "";
      index += 1;
    } else if (arg === "--name") {
      options.name = nextValue || "";
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run bootstrap:super-admin -- --email you@example.com [--password YourPassword123] [--name \"Your Name\"] [--role super_admin]");
  console.log("");
  console.log("Notes:");
  console.log("  - The default role is super_admin.");
  console.log("  - If the Firebase Auth user does not exist and no password is provided, a temporary password is generated.");
  console.log("  - The script writes adminUsers/{uid} and sets the Firebase custom claim role.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const email = normalizeEmail(options.email);
  const role = String(options.role || "").trim() || "super_admin";

  if (!email || !isValidEmail(email)) {
    console.error("A valid --email value is required.");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    console.error(`--role must be one of: ${ALLOWED_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const configState = getFirebaseAdminConfigState();
  if (!configState.ready || configState.serviceAccountJsonError) {
    console.error("Firebase Admin SDK is not configured.");
    if (configState.serviceAccountJsonError) {
      console.error(configState.serviceAccountJsonError);
    }
    if (!configState.ready) {
      console.error(`Missing credentials. Still needed: ${configState.missingExplicitEnv.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  const auth = getFirebaseAuth();
  const db = getFirestore();
  if (!auth || !db) {
    console.error("Firebase Admin SDK failed to initialize.");
    process.exitCode = 1;
    return;
  }

  let userRecord = null;
  let createdAuthUser = false;
  let generatedPassword = "";
  let createdViaRest = false;
  let createdRestIdToken = "";
  let claimsSynced = false;

  try {
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      if (String(error && error.code || "") !== "auth/user-not-found" && !isAuthPermissionError(error)) {
        throw error;
      }
    }

    if (!userRecord) {
      generatedPassword = options.password || createTemporaryPassword();
      try {
        userRecord = await auth.createUser({
          email,
          password: generatedPassword,
          displayName: options.name || undefined,
          emailVerified: true
        });
      } catch (error) {
        if (!isAuthPermissionError(error)) {
          throw error;
        }

        const restUser = await createUserViaIdentityToolkit(email, generatedPassword, options.name);
        if (!restUser.uid) {
          throw new Error("Firebase Auth REST signup did not return a user ID.");
        }

        userRecord = {
          uid: restUser.uid,
          email: restUser.email,
          displayName: options.name || null
        };
        createdViaRest = true;
        createdRestIdToken = restUser.idToken;
      }
      createdAuthUser = true;
    }

    const adminRef = db.collection("adminUsers").doc(userRecord.uid);
    const auditRef = db.collection("adminAuditLogs").doc();

    await db.runTransaction(async (transaction) => {
      const adminSnap = await transaction.get(adminRef);
      const existing = adminSnap.exists ? adminSnap.data() || {} : {};

      transaction.set(adminRef, {
        uid: userRecord.uid,
        email,
        role,
        createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: existing.lastLogin || null,
        createdBy: existing.createdBy || "bootstrap-script",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      transaction.set(auditRef, {
        uid: "bootstrap-script",
        email: "bootstrap-script",
        targetUid: userRecord.uid,
        targetEmail: email,
        eventType: adminSnap.exists ? "admin.user.bootstrap.updated" : "admin.user.bootstrap.created",
        action: adminSnap.exists ? "updated" : "created",
        targetRole: role,
        ipAddress: "local-script",
        userAgent: "node-bootstrap-script",
        role,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    try {
      await auth.setCustomUserClaims(userRecord.uid, {
        role,
        authorizedAt: new Date().toISOString()
      });
      claimsSynced = true;
    } catch (error) {
      if (!isAuthPermissionError(error)) {
        throw error;
      }
    }

    console.log("Bootstrap complete.");
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log(`Claims synced: ${claimsSynced ? "yes" : "no"}`);
    if (createdAuthUser) {
      console.log("Firebase Auth user: created");
      console.log(`Creation method: ${createdViaRest ? "Identity Toolkit REST fallback" : "Firebase Admin SDK"}`);
      if (generatedPassword) {
        console.log(`Temporary password: ${generatedPassword}`);
        console.log("Use the admin login page or the Forgot Password flow to set a permanent password.");
      }
    } else {
      console.log("Firebase Auth user: already existed");
    }
    if (!claimsSynced) {
      console.log("Warning: custom claims could not be written yet. Dashboard API access will work via Firestore adminUsers, but claim-based checks will stay degraded until Firebase Auth Admin permissions are fixed.");
    }
  } catch (error) {
    console.error("Failed to bootstrap super admin:", error.message || error);

    if (createdAuthUser && userRecord) {
      try {
        if (createdViaRest) {
          await deleteUserViaIdentityToolkit(createdRestIdToken);
        } else {
          await auth.deleteUser(userRecord.uid);
        }
        console.error("Rolled back the newly created Firebase Auth user.");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message || rollbackError);
      }
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
