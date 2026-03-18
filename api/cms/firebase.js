const admin = require("firebase-admin");

function getRequiredEnv(name) {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : "";
}

function getFirebaseCredentialsFromEnv() {
  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = getRequiredEnv("FIREBASE_PRIVATE_KEY");

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n")
  };
}

function getFirebaseCredentialsFromJson() {
  const raw = getRequiredEnv("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    return { credentials: null, error: "" };
  }

  try {
    const parsed = JSON.parse(raw);
    const projectId = String(parsed.project_id || parsed.projectId || "").trim();
    const clientEmail = String(parsed.client_email || parsed.clientEmail || "").trim();
    const privateKey = String(parsed.private_key || parsed.privateKey || "").replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return {
        credentials: null,
        error: "FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key"
      };
    }

    return {
      credentials: {
        projectId,
        clientEmail,
        privateKey
      },
      error: ""
    };
  } catch (error) {
    return {
      credentials: null,
      error: `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message || error}`
    };
  }
}

function canUseApplicationDefault() {
  const flag = getRequiredEnv("FIREBASE_USE_APPLICATION_DEFAULT").toLowerCase() === "true";
  const googleCredentialsPath = getRequiredEnv("GOOGLE_APPLICATION_CREDENTIALS");
  return flag || Boolean(googleCredentialsPath);
}

function getFirebaseAdminConfigState() {
  const explicitCredentials = getFirebaseCredentialsFromEnv();
  const jsonCredentialsResult = getFirebaseCredentialsFromJson();
  const projectId =
    getRequiredEnv("FIREBASE_PROJECT_ID") ||
    (explicitCredentials && explicitCredentials.projectId) ||
    (jsonCredentialsResult.credentials && jsonCredentialsResult.credentials.projectId) ||
    getRequiredEnv("FIREBASE_WEB_PROJECT_ID");
  const storageBucket = getRequiredEnv("FIREBASE_STORAGE_BUCKET") || getRequiredEnv("FIREBASE_WEB_STORAGE_BUCKET");

  return {
    projectId,
    storageBucket,
    hasExplicitCredentials: Boolean(explicitCredentials),
    missingExplicitEnv: [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY"
    ].filter((name) => !getRequiredEnv(name)),
    hasServiceAccountJson: Boolean(jsonCredentialsResult.credentials),
    serviceAccountJsonError: jsonCredentialsResult.error,
    canUseApplicationDefault: canUseApplicationDefault(),
    ready: Boolean(explicitCredentials || jsonCredentialsResult.credentials || canUseApplicationDefault())
  };
}

function initializeFirebase() {
  const existing = admin.apps.length ? admin.app() : null;
  if (existing) {
    return existing;
  }

  const explicitCredentials = getFirebaseCredentialsFromEnv();
  const jsonCredentialsResult = getFirebaseCredentialsFromJson();
  const configState = getFirebaseAdminConfigState();

  if (!configState.ready) {
    return null;
  }

  const storageBucket = configState.storageBucket;
  const databaseURL = getRequiredEnv("FIREBASE_DATABASE_URL");
  const options = {};

  if (explicitCredentials) {
    options.credential = admin.credential.cert(explicitCredentials);
  } else if (jsonCredentialsResult.credentials) {
    options.credential = admin.credential.cert(jsonCredentialsResult.credentials);
  } else if (canUseApplicationDefault()) {
    options.credential = admin.credential.applicationDefault();
  } else {
    return null;
  }

  if (configState.projectId) {
    options.projectId = configState.projectId;
  }

  if (storageBucket) {
    options.storageBucket = storageBucket;
  }

  if (databaseURL) {
    options.databaseURL = databaseURL;
  }

  return admin.initializeApp(options);
}

function getFirestore() {
  const app = initializeFirebase();
  if (!app) {
    return null;
  }
  return app.firestore();
}

function getFirebaseAuth() {
  const app = initializeFirebase();
  if (!app) {
    return null;
  }
  return app.auth();
}

function getAdminEmailAllowlist() {
  const raw = getRequiredEnv("CMS_ADMIN_EMAILS");
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

function canUseEmailFallback() {
  return getRequiredEnv("CMS_ENABLE_EMAIL_ADMIN_FALLBACK").toLowerCase() === "true";
}

function isAdminUser(decodedToken) {
  if (!decodedToken || typeof decodedToken !== "object") {
    return { ok: false, reason: "invalid-token" };
  }

  // Check for role custom claim set by auth-sync endpoint
  // Role values: "admin" or "super_admin"
  const role = decodedToken.role;
  if (role === "admin" || role === "super_admin") {
    return { ok: true, mode: "role-claim", role: role };
  }

  // No valid admin claim found
  return { ok: false, reason: "missing-role-claim" };
}

module.exports = {
  getFirestore,
  getFirebaseAuth,
  isAdminUser,
  getFirebaseAdminConfigState
};

