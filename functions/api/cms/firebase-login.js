const { buildSessionCookie, createSessionToken } = require("./_auth");
const { applyCors } = require("./_cors");
const { getFirebaseAuth } = require("./firebase");

function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return req.body && typeof req.body === "object" ? req.body : {};
}

function parseAllowedEmails() {
  const raw = process.env.CMS_ALLOWED_EMAILS || process.env.CMS_ADMIN_EMAIL || "";
  return raw.split(",").map(function (value) {
    return String(value || "").trim().toLowerCase();
  }).filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return res.status(500).send(JSON.stringify({ error: "Firebase Admin is not configured" }));
  }

  const allowedEmails = parseAllowedEmails();
  if (!allowedEmails.length) {
    return res.status(500).send(JSON.stringify({ error: "CMS_ALLOWED_EMAILS is not configured" }));
  }

  const idToken = String(readBody(req).idToken || "").trim();
  if (!idToken) {
    return res.status(400).send(JSON.stringify({ error: "Missing idToken" }));
  }

  try {
    const decoded = await auth.verifyIdToken(idToken, true);
    const userEmail = String(decoded.email || "").trim().toLowerCase();

    if (!decoded.email_verified || !userEmail) {
      return res.status(403).send(JSON.stringify({ error: "Email is not verified" }));
    }

    if (!allowedEmails.includes(userEmail)) {
      return res.status(403).send(JSON.stringify({ error: "Email is not allowed for CMS admin" }));
    }

    const sessionToken = createSessionToken();
    if (!sessionToken) {
      return res.status(500).send(JSON.stringify({ error: "Session secret is not configured" }));
    }

    res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
    return res.status(200).send(JSON.stringify({ ok: true, email: userEmail }));
  } catch (_error) {
    return res.status(401).send(JSON.stringify({ error: "Invalid Firebase token" }));
  }
};
