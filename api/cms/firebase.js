const admin = require("firebase-admin");

function getRequiredEnv(name) {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : "";
}

function getFirebaseCredentials() {
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

function initializeFirebase() {
  const existing = admin.apps.length ? admin.app() : null;
  if (existing) {
    return existing;
  }

  const credentials = getFirebaseCredentials();
  if (!credentials) {
    return null;
  }

  const storageBucket = getRequiredEnv("FIREBASE_STORAGE_BUCKET");
  const databaseURL = getRequiredEnv("FIREBASE_DATABASE_URL");

  const options = {
    credential: admin.credential.cert(credentials)
  };

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

  if (decodedToken.uid === "0wirGG8qA3XjkMby3eX62ScE9Ku1") {
    return { ok: true, mode: "hardcoded-uid" };
  }

  if (decodedToken.admin === true) {
    return { ok: true, mode: "custom-claim" };
  }

  if (!canUseEmailFallback()) {
    return { ok: false, reason: "admin-claim-required" };
  }

  const email = String(decodedToken.email || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, reason: "missing-email" };
  }

  const allowlist = getAdminEmailAllowlist();
  if (!allowlist.length) {
    return { ok: false, reason: "allowlist-empty" };
  }

  if (!allowlist.includes(email)) {
    return { ok: false, reason: "email-not-allowed" };
  }

  return { ok: true, mode: "email-allowlist" };
}

module.exports = {
  getFirestore,
  getFirebaseAuth,
  isAdminUser
};

