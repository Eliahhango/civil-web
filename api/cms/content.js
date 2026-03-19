const fs = require("fs");
const path = require("path");
const { getFirestore, getFirebaseAuth, isAdminUser } = require("./firebase");
const { validateAndNormalizePayload } = require("./payload-validation");

const DEFAULT_CONTENT_PATH = path.join(process.cwd(), "api", "cms", "default-content.json");
const FALLBACK_CONTENT_PATH = path.join(process.cwd(), "elitech", "cms", "content.json");
const TEMP_CONTENT_PATH = "/tmp/elitech-cms-content.json";
const CONTENT_KEY = "elitech_cms_content";
const FIRESTORE_COLLECTION = "cms";
const FIRESTORE_DOC_ID = "content";
const ALLOWED_ADMIN_ROLES = new Set(["admin", "super_admin"]);

function readJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadDefaultContent() {
  if (!fs.existsSync(DEFAULT_CONTENT_PATH)) {
    return {};
  }

  const raw = fs.readFileSync(DEFAULT_CONTENT_PATH, "utf8");
  return readJsonSafe(raw) || {};
}

function mergeContent(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? deepClone(overrideValue) : deepClone(baseValue);
  }

  if (isPlainObject(baseValue)) {
    const output = {};
    const override = isPlainObject(overrideValue) ? overrideValue : {};
    const keys = Object.keys(baseValue);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      output[key] = mergeContent(baseValue[key], override[key]);
    }

    return output;
  }

  if (overrideValue === undefined || overrideValue === null) {
    return baseValue;
  }

  return overrideValue;
}

function normalizeConfig(data) {
  const defaults = loadDefaultContent();
  const value = isPlainObject(data) ? data : {};
  return mergeContent(defaults, value);
}

function getBearerToken(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== "string") {
    return "";
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function verifyAuthorizedUser(req) {
  const idToken = getBearerToken(req);
  if (!idToken) {
    return { ok: false, status: 401, error: "Missing Firebase ID token" };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return { ok: false, status: 500, error: "Firebase Auth is not configured" };
  }

  try {
    const decoded = await auth.verifyIdToken(idToken, true);
    if (!decoded || decoded.email_verified === false) {
      return { ok: false, status: 403, error: "Verified Firebase account required" };
    }

    const adminResult = isAdminUser(decoded);
    if (adminResult.ok) {
      return { ok: true, user: decoded, role: adminResult.role || "" };
    }

    const db = getFirestore();
    if (!db) {
      return { ok: false, status: 500, error: "Firestore is not configured" };
    }

    const adminDoc = await db.collection("adminUsers").doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return { ok: false, status: 403, error: "Forbidden: admin access required" };
    }

    const adminData = adminDoc.data() || {};
    const role = String(adminData.role || "").trim();
    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      return { ok: false, status: 403, error: "Forbidden: admin access required" };
    }

    return { ok: true, user: decoded, role };
  } catch (error) {
    return { ok: false, status: 401, error: "Invalid Firebase ID token" };
  }
}

async function readFromVercelKV() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return null;
  }

  const response = await fetch(`${kvUrl}/get/${CONTENT_KEY}`, {
    headers: {
      Authorization: `Bearer ${kvToken}`
    }
  });

  if (!response.ok) {
    throw new Error("KV read failed");
  }

  const payload = await response.json();
  if (!payload || payload.result === null || payload.result === undefined) {
    return null;
  }

  const parsed = typeof payload.result === "string" ? readJsonSafe(payload.result) : payload.result;
  return normalizeConfig(parsed);
}

async function readFromFirestore() {
  const db = getFirestore();
  if (!db) {
    return null;
  }

  const doc = await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data() || {};
  return normalizeConfig(data.payload || data);
}

async function writeToFirestore(data) {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set({
    payload: data,
    updatedAt: Date.now()
  }, { merge: true });

  return true;
}

async function writeToVercelKV(data) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return false;
  }

  const response = await fetch(`${kvUrl}/set/${CONTENT_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value: JSON.stringify(data) })
  });

  if (!response.ok) {
    throw new Error("KV write failed");
  }

  return true;
}

function readFromTmpFile() {
  if (!fs.existsSync(TEMP_CONTENT_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(TEMP_CONTENT_PATH, "utf8");
  return normalizeConfig(readJsonSafe(raw));
}

function writeToTmpFile(data) {
  fs.writeFileSync(TEMP_CONTENT_PATH, JSON.stringify(data, null, 2), "utf8");
}

function readFromFallbackFile() {
  if (!fs.existsSync(FALLBACK_CONTENT_PATH)) {
    return normalizeConfig({});
  }
  const raw = fs.readFileSync(FALLBACK_CONTENT_PATH, "utf8");
  return normalizeConfig(readJsonSafe(raw));
}

async function getCurrentContent() {
  try {
    const firestoreValue = await readFromFirestore();
    if (firestoreValue) {
      return firestoreValue;
    }
  } catch (error) {
    // Ignore Firestore errors and continue with fallback sources.
  }

  try {
    const kvValue = await readFromVercelKV();
    if (kvValue) {
      return kvValue;
    }
  } catch (error) {
    // Ignore KV errors and continue with file fallback.
  }

  try {
    const tmpValue = readFromTmpFile();
    if (tmpValue) {
      return tmpValue;
    }
  } catch (error) {
    // Ignore tmp read errors and continue with static fallback.
  }

  return readFromFallbackFile();
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "GET") {
    try {
      const data = await getCurrentContent();
      return res.status(200).send(JSON.stringify(data));
    } catch (error) {
      return res.status(500).send(JSON.stringify({ error: "Failed to read CMS content" }));
    }
  }

  if (req.method === "PUT") {
    const authResult = await verifyAuthorizedUser(req);
    if (!authResult.ok) {
      return res.status(authResult.status).send(JSON.stringify({ error: authResult.error }));
    }

    const payloadResult = validateAndNormalizePayload(req);
    if (!payloadResult.ok) {
      return res.status(payloadResult.status).send(JSON.stringify({ error: payloadResult.error }));
    }

    const payload = payloadResult.data;

    try {
      const savedInFirestore = await writeToFirestore(payload);
      if (savedInFirestore) {
        return res.status(200).send(JSON.stringify({ ok: true, storage: "firestore" }));
      }

      const savedInKv = await writeToVercelKV(payload);
      if (savedInKv) {
        return res.status(200).send(JSON.stringify({ ok: true, storage: "vercel-kv" }));
      }

      writeToTmpFile(payload);
      return res.status(200).send(JSON.stringify({ ok: true, warning: "Saved in temporary storage only", storage: "tmp" }));
    } catch (error) {
      try {
        writeToTmpFile(payload);
        return res.status(200).send(JSON.stringify({ ok: true, warning: "Saved in temporary storage only", storage: "tmp" }));
      } catch (tmpError) {
        return res.status(500).send(JSON.stringify({ error: "Failed to save CMS content" }));
      }
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
};
