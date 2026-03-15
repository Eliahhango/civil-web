function getAllowedOrigins() {
  const raw = process.env.CMS_ALLOWED_ORIGINS || "https://civil-web.vercel.app";
  return raw.split(",").map((value) => String(value || "").trim()).filter(Boolean);
}

function applyCors(req, res) {
  const origin = (req.headers && req.headers.origin) || "";
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = {
  applyCors
};
