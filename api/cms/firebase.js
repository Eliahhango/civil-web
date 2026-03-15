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

module.exports = {
  getFirestore,
  getFirebaseAuth
};
