module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  return res.status(200).send(JSON.stringify({
    apiKey: process.env.FIREBASE_WEB_API_KEY || "",
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_WEB_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_WEB_APP_ID || ""
  }));
};
