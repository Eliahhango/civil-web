const fs = require("fs");
const path = require("path");
const { isAuthorized } = require("./_auth");
const { getFirestore } = require("./firebase");

const FALLBACK_CONTENT_PATH = path.join(process.cwd(), "elitech", "cms", "content.json");
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

  if (req.method === "GET") {
    try {
      const data = await getCurrentContent();
      return res.status(200).send(JSON.stringify(data));
    } catch (error) {
      return res.status(500).send(JSON.stringify({ error: "Failed to read CMS content" }));
    }
  }

  if (req.method === "PUT") {
    if (!isAuthorized(req)) {
      return res.status(401).send(JSON.stringify({ error: "Unauthorized" }));
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
