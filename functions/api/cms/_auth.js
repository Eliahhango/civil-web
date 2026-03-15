const crypto = require("crypto");

const SESSION_COOKIE_NAME = "elitech_cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.CMS_SESSION_SECRET || process.env.CMS_ADMIN_TOKEN || "";
}

function getExpectedAdminToken() {
  return process.env.CMS_ADMIN_TOKEN || "";
}

function readCookie(req, name) {
  const header = (req.headers && req.headers.cookie) || "";
  if (!header) {
    return "";
  }

  const pairs = header.split(";");
  for (let i = 0; i < pairs.length; i += 1) {
    const part = pairs[i].trim();
    if (!part) {
      continue;
    }
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return "";
}

function createSignature(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function createSessionToken() {
  const secret = getSecret();
  if (!secret) {
    return "";
  }

  const payload = {
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createSignature(encoded, secret);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token) {
  const secret = getSecret();
  if (!secret || !token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const encoded = parts[0];
  const signature = parts[1];
  const expected = createSignature(encoded, secret);

  if (signature !== expected) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload || typeof payload.exp !== "number") {
      return false;
    }
    return payload.exp > Date.now();
  } catch (error) {
    return false;
  }
}

function buildSessionCookie(token) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

function buildExpiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function hasSession(req) {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

function hasBearerToken(req) {
  const expectedToken = getExpectedAdminToken();
  if (!expectedToken) {
    return false;
  }

  const authHeader = (req.headers && req.headers.authorization) || "";
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return false;
  }

  const provided = authHeader.slice(prefix.length).trim();
  return Boolean(provided) && provided === expectedToken;
}

function isAuthorized(req) {
  return hasSession(req) || hasBearerToken(req);
}

module.exports = {
  buildExpiredSessionCookie,
  buildSessionCookie,
  createSessionToken,
  getExpectedAdminToken,
  hasSession,
  isAuthorized
};
