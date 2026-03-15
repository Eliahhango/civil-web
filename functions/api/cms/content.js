const fs = require("fs");
const path = require("path");
const { applyCors } = require("./_cors");
const { getFirestore, getFirebaseAuth } = require("./firebase");

const FALLBACK_CONTENT_PATH = path.join(__dirname, "default-content.json");
const TEMP_CONTENT_PATH = "/tmp/elitech-cms-content.json";
const CONTENT_KEY = "elitech_cms_content";
const FIRESTORE_COLLECTION = "cms";
const FIRESTORE_DOC_ID = "content";

function readJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function normalizeConfig(data) {
  const value = data && typeof data === "object" ? data : {};
  return {
    site: value.site && typeof value.site === "object" ? value.site : {},
    seo: value.seo && typeof value.seo === "object" ? value.seo : {},
    globalReplacements: Array.isArray(value.globalReplacements) ? value.globalReplacements : [],
    rules: Array.isArray(value.rules) ? value.rules : []
  };
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
    if (!decoded || !decoded.email || decoded.email_verified === false) {
      return { ok: false, status: 403, error: "Verified Firebase email required" };
    }

    return { ok: true, user: decoded };
  } catch (_error) {
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
  return normalizeConfig(readJsonSafe(fs.readFileSync(TEMP_CONTENT_PATH, "utf8")));
}

function writeToTmpFile(data) {
  fs.writeFileSync(TEMP_CONTENT_PATH, JSON.stringify(data, null, 2), "utf8");
}

function readFromFallbackFile() {
  if (!fs.existsSync(FALLBACK_CONTENT_PATH)) {
    return normalizeConfig({});
  }
  return normalizeConfig(readJsonSafe(fs.readFileSync(FALLBACK_CONTENT_PATH, "utf8")));
}

async function getCurrentContent() {
  try {
    const firestoreValue = await readFromFirestore();
    if (firestoreValue) {
      return firestoreValue;
    }
  } catch (_error) {}

  try {
    const kvValue = await readFromVercelKV();
    if (kvValue) {
      return kvValue;
    }
  } catch (_error) {}

  try {
    const tmpValue = readFromTmpFile();
    if (tmpValue) {
      return tmpValue;
    }
  } catch (_error) {}

  return readFromFallbackFile();
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const data = await getCurrentContent();
      return res.status(200).send(JSON.stringify(data));
    } catch (_error) {
      return res.status(500).send(JSON.stringify({ error: "Failed to read CMS content" }));
    }
  }

  if (req.method === "PUT") {
    const authResult = await verifyAuthorizedUser(req);
    if (!authResult.ok) {
      return res.status(authResult.status).send(JSON.stringify({ error: authResult.error }));
    }

    const payload = normalizeConfig(req.body);

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
    } catch (_error) {
      try {
        writeToTmpFile(payload);
        return res.status(200).send(JSON.stringify({ ok: true, warning: "Saved in temporary storage only", storage: "tmp" }));
      } catch (_tmpError) {
        return res.status(500).send(JSON.stringify({ error: "Failed to save CMS content" }));
      }
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
};
