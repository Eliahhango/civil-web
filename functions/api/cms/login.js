const { buildSessionCookie, createSessionToken, getExpectedAdminToken } = require("./_auth");

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

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  const expected = getExpectedAdminToken();
  if (!expected) {
    return res.status(500).send(JSON.stringify({ error: "CMS_ADMIN_TOKEN is not configured" }));
  }

  const token = String(readBody(req).token || "").trim();
  if (!token || token !== expected) {
    return res.status(401).send(JSON.stringify({ error: "Invalid admin token" }));
  }

  const sessionToken = createSessionToken();
  if (!sessionToken) {
    return res.status(500).send(JSON.stringify({ error: "Session secret is not configured" }));
  }

  res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
  return res.status(200).send(JSON.stringify({ ok: true }));
};
