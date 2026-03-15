const { buildExpiredSessionCookie } = require("./_auth");
const { applyCors } = require("./_cors");

module.exports = function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  res.setHeader("Set-Cookie", buildExpiredSessionCookie());
  return res.status(200).send(JSON.stringify({ ok: true }));
};
