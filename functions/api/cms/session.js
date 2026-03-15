const { hasSession } = require("./_auth");

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  return res.status(200).send(JSON.stringify({ authenticated: hasSession(req) }));
};
