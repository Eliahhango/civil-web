const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");

const content = require("./api/cms/content");
const login = require("./api/cms/login");
const logout = require("./api/cms/logout");
const session = require("./api/cms/session");
const firebaseLogin = require("./api/cms/firebase-login");
const firebaseWebConfig = require("./api/cms/firebase-web-config");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.all("/api/cms/content", content);
app.all("/api/cms/login", login);
app.all("/api/cms/logout", logout);
app.all("/api/cms/session", session);
app.all("/api/cms/firebase-login", firebaseLogin);
app.all("/api/cms/firebase-web-config", firebaseWebConfig);

app.use(function (_req, res) {
  return res.status(404).json({ error: "Not found" });
});

exports.api = onRequest({ region: "us-central1" }, app);
