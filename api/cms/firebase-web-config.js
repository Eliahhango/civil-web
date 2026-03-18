module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Required Firebase Web Configuration Environment Variables
  const requiredEnvVars = [
    "FIREBASE_WEB_API_KEY",
    "FIREBASE_WEB_AUTH_DOMAIN",
    "FIREBASE_WEB_PROJECT_ID",
    "FIREBASE_WEB_STORAGE_BUCKET",
    "FIREBASE_WEB_MESSAGING_SENDER_ID",
    "FIREBASE_WEB_APP_ID"
  ];

  // Check for missing required environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("[Config Error] Missing required Firebase Web config environment variables:", missingVars);
    return res.status(500).json({
      error: "Firebase Web configuration is incomplete",
      missing: missingVars,
      detail: "Admin panel cannot initialize without proper Firebase configuration"
    });
  }

  const payload = {
    apiKey: process.env.FIREBASE_WEB_API_KEY,
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_WEB_PROJECT_ID,
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_WEB_APP_ID
  };

  return res.status(200).json(payload);
};
