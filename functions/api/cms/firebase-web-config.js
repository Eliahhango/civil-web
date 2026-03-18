const { applyCors } = require("./_cors");

module.exports = function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
  }

  return res.status(200).send(JSON.stringify({
    apiKey: process.env.FIREBASE_WEB_API_KEY || "AIzaSyB1IjyCGvZsiIuBxkNk6iNQFpTVtEDEq9A",
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || "studio-2814354733-befba.firebaseapp.com",
    projectId: process.env.FIREBASE_WEB_PROJECT_ID || "studio-2814354733-befba",
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || "studio-2814354733-befba.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "40795501345",
    appId: process.env.FIREBASE_WEB_APP_ID || "1:40795501345:web:54b0c690b892fd72d68460"
  }));
};

