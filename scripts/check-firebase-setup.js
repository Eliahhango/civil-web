const path = require("path");
const { loadEnvFiles } = require("./load-env");

const rootDir = path.resolve(__dirname, "..");
const loadedEnvFiles = loadEnvFiles(rootDir);
const {
  getFirebaseAdminConfigState,
  getFirebaseAuth,
  getFirestore
} = require("../api/cms/firebase");

const REQUIRED_WEB_ENV = [
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_WEB_AUTH_DOMAIN",
  "FIREBASE_WEB_PROJECT_ID",
  "FIREBASE_WEB_STORAGE_BUCKET",
  "FIREBASE_WEB_MESSAGING_SENDER_ID",
  "FIREBASE_WEB_APP_ID"
];

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function printStatus(label, ok, detail) {
  const prefix = ok ? "[OK]" : "[FAIL]";
  console.log(`${prefix} ${label}${detail ? `: ${detail}` : ""}`);
}

function formatAdminError(error) {
  const message = String((error && error.message) || error || "");

  if (message.includes("serviceusage.serviceUsageConsumer")) {
    return [
      "The Firebase service account is missing the Google Cloud permission serviceusage.services.use.",
      "Open Google Cloud IAM for project studio-oo462 and grant the service account the role Service Usage Consumer.",
      "Service account: firebase-adminsdk-fbsvc@studio-oo462.iam.gserviceaccount.com"
    ].join(" ");
  }

  return message;
}

function formatFirestoreError(error) {
  const message = String((error && error.message) || error || "");

  if (message.includes("5 NOT_FOUND")) {
    return [
      "Firestore is not ready for this project.",
      "Create the Firestore database in Firebase Console for project studio-oo462, then re-run this check."
    ].join(" ");
  }

  return message;
}

async function main() {
  printHeader("Environment Files");
  if (loadedEnvFiles.length === 0) {
    printStatus("Loaded env files", false, "No .env or .env.local file found");
  } else {
    printStatus("Loaded env files", true, loadedEnvFiles.join(", "));
  }

  printHeader("Firebase Web Config");
  const missingWebEnv = REQUIRED_WEB_ENV.filter((name) => !String(process.env[name] || "").trim());
  if (missingWebEnv.length > 0) {
    printStatus("Web SDK env vars", false, `Missing ${missingWebEnv.join(", ")}`);
  } else {
    printStatus("Web SDK env vars", true, "All required FIREBASE_WEB_* values are present");
  }

  printHeader("Firebase Admin SDK");
  const adminState = getFirebaseAdminConfigState();

  if (adminState.hasExplicitCredentials) {
    printStatus("Admin auth source", true, "Using FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
  } else if (adminState.hasServiceAccountJson) {
    printStatus("Admin auth source", true, "Using FIREBASE_SERVICE_ACCOUNT_JSON");
  } else if (adminState.canUseApplicationDefault) {
    printStatus("Admin auth source", true, "Using application default credentials");
  } else {
    printStatus(
      "Admin auth source",
      false,
      `Missing Firebase Admin credentials. Required env vars: ${adminState.missingExplicitEnv.join(", ")}`
    );
  }

  if (adminState.serviceAccountJsonError) {
    printStatus("Service account JSON", false, adminState.serviceAccountJsonError);
  }

  if (adminState.projectId) {
    printStatus("Firebase project", true, adminState.projectId);
  } else {
    printStatus("Firebase project", false, "No project ID resolved from env");
  }

  let hasFailures = missingWebEnv.length > 0 || !adminState.ready || Boolean(adminState.serviceAccountJsonError);
  if (hasFailures) {
    process.exitCode = 1;
    return;
  }

  const auth = getFirebaseAuth();
  const db = getFirestore();

  if (!auth || !db) {
    printStatus("Firebase Admin initialization", false, "Admin SDK could not initialize");
    process.exitCode = 1;
    return;
  }

  try {
    await auth.listUsers(1);
    printStatus("Firebase Auth Admin access", true, "Auth API reachable");
  } catch (error) {
    printStatus("Firebase Auth Admin access", false, formatAdminError(error));
    hasFailures = true;
  }

  try {
    await db.collection("adminUsers").limit(1).get();
    printStatus("Firestore access", true, "Firestore is reachable");
  } catch (error) {
    printStatus("Firestore access", false, formatFirestoreError(error));
    hasFailures = true;
  }

  printHeader("Admin Login Setup");
  if (!hasFailures) {
    printStatus("Setup check", true, "Firebase backend and admin login prerequisites are in place");
  } else {
    printStatus("Setup check", false, "Resolve the failed checks above");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[FATAL] Firebase setup check failed:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
