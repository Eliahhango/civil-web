import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const EMAIL_STORAGE_KEY = "emailForSignIn";
const BACKEND_CONFIG_URL = "/elitech/cms/backend.json";
const FIREBASE_LOGIN_PATH = "/api/cms/firebase-login";
const FIREBASE_WEB_CONFIG_PATH = "/api/cms/firebase-web-config";

var auth = null;
var apiBaseUrl = null;

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function resolveApiUrl(path) {
  var base = trimTrailingSlash(apiBaseUrl || "");
  if (!base) {
    return path;
  }
  return base + path;
}

async function loadBackendConfig() {
  if (apiBaseUrl !== null) {
    return apiBaseUrl;
  }

  var response = await fetch(BACKEND_CONFIG_URL, {
    method: "GET",
    cache: "no-cache"
  });

  if (!response.ok) {
    apiBaseUrl = "";
    return apiBaseUrl;
  }

  var payload = await response.json().catch(function () {
    return {};
  });
  apiBaseUrl = trimTrailingSlash(payload && payload.apiBaseUrl || "");
  return apiBaseUrl;
}

function setStatus(message, isError) {
  if (window.CMSAdmin && typeof window.CMSAdmin.setStatus === "function") {
    window.CMSAdmin.setStatus(message, isError);
    return;
  }

  const statusNode = document.getElementById("status");
  if (!statusNode) {
    return;
  }

  statusNode.textContent = message;
  statusNode.style.color = isError ? "#ff8c95" : "#94a9bf";
}

function getActionCodeSettings() {
  return {
    url: `${window.location.origin}/elitech/admin/`,
    handleCodeInApp: true
  };
}

async function ensureAuth() {
  if (auth) {
    return auth;
  }

  await loadBackendConfig();

  var response = await fetch(resolveApiUrl(FIREBASE_WEB_CONFIG_PATH), {
    method: "GET",
    credentials: "include",
    cache: "no-cache"
  });

  var config = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    throw new Error(config.error || "Failed to load Firebase config");
  }

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase web config is missing in server environment");
  }

  auth = getAuth(initializeApp(config));
  return auth;
}

async function sendLink() {
  var authInstance = await ensureAuth();
  const emailNode = document.getElementById("email-link-input");
  const email = String((emailNode && emailNode.value) || "").trim();

  if (!email) {
    setStatus("Enter your admin email before sending link.", true);
    return;
  }

  try {
    await sendSignInLinkToEmail(authInstance, email, getActionCodeSettings());
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    setStatus("Sign-in link sent. Check your email and open the link.", false);
  } catch (error) {
    if (error && error.code === "auth/unauthorized-continue-uri") {
      setStatus("Domain not allowlisted in Firebase Auth. Add this domain in Firebase Console > Authentication > Settings > Authorized domains.", true);
      return;
    }
    setStatus(error.message || "Failed to send sign-in link.", true);
  }
}

async function exchangeFirebaseSession() {
  var authInstance = await ensureAuth();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error("No authenticated Firebase user.");
  }

  const idToken = await user.getIdToken(true);
  const response = await fetch(resolveApiUrl(FIREBASE_LOGIN_PATH), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Backend session setup failed");
  }

  if (window.CMSAdmin && typeof window.CMSAdmin.refreshSession === "function") {
    await window.CMSAdmin.refreshSession();
  }

  if (window.CMSAdmin && typeof window.CMSAdmin.enterDashboard === "function") {
    await window.CMSAdmin.enterDashboard();
  }

  setStatus("Email link verified and admin session started.", false);
}

async function completeSignInFromLink() {
  var authInstance = await ensureAuth();
  if (!isSignInWithEmailLink(authInstance, window.location.href)) {
    setStatus("Current URL is not a Firebase email sign-in link.", true);
    return;
  }

  let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
  }

  email = String(email || "").trim();
  if (!email) {
    setStatus("Email is required to complete sign-in.", true);
    return;
  }

  try {
    await signInWithEmailLink(authInstance, email, window.location.href);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);

    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);

    await exchangeFirebaseSession();
  } catch (error) {
    setStatus(error.message || "Failed to complete email link sign-in.", true);
  }
}

function bindAuthButtons() {
  const sendBtn = document.getElementById("btn-send-email-link");
  const completeBtn = document.getElementById("btn-complete-email-link");

  if (sendBtn) {
    sendBtn.addEventListener("click", sendLink);
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", completeSignInFromLink);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bindAuthButtons();
  ensureAuth().then(function (authInstance) {
    if (isSignInWithEmailLink(authInstance, window.location.href)) {
      completeSignInFromLink();
    }
  }).catch(function (error) {
    setStatus(error.message || "Failed to initialize Firebase auth.", true);
  });
});
