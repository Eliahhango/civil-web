const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");

const content = require("./api/cms/content");
const firebaseWebConfig = require("./api/cms/firebase-web-config");
const adminAuthSync = require("./api/admin/auth-sync");
const adminUsers = require("./api/admin/users");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.all("/api/cms/content", content);
app.all("/api/cms/firebase-web-config", firebaseWebConfig);

// Admin Routes
app.all("/api/admin/auth-sync", adminAuthSync);
app.all("/api/admin/users", adminUsers);

app.use(function (_req, res) {
  return res.status(404).json({ error: "Not found" });
});

exports.api = onRequest({ region: "us-central1" }, app);
