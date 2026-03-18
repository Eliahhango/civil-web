import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signOut,
  signInWithEmailAndPassword,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const EMAIL_STORAGE_KEY = "emailForSignIn";
const BACKEND_CONFIG_URL = "/elitech/cms/backend.json";
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

function getSafeAuthMessage(error, fallbackMessage) {
  const code = String(error && error.code || "").toLowerCase();

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password.";
  }
  if (code === "auth/invalid-email") {
    return "Enter a valid email address.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }
  if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
    return "This sign-in link is invalid or expired. Request a new one.";
  }
  if (code === "auth/user-disabled") {
    return "This account is disabled. Contact support.";
  }

  return fallbackMessage;
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
    cache: "no-cache"
  });

  var config = await response.json().catch(function () {
    return {
      apiKey: "AIzaSyB1IjyCGvZsiIuBxkNk6iNQFpTVtEDEq9A",
      authDomain: "studio-2814354733-befba.firebaseapp.com",
      projectId: "studio-2814354733-befba",
      storageBucket: "studio-2814354733-befba.firebasestorage.app",
      messagingSenderId: "40795501345",
      appId: "1:40795501345:web:54b0c690b892fd72d68460"
    };
  });

  if (!config.apiKey && !response.ok) {
    throw new Error("Sign-in configuration is unavailable right now.");
  }

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Sign-in configuration is incomplete.");
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
      setStatus("This domain is not authorized for email links.", true);
      return;
    }
    setStatus(getSafeAuthMessage(error, "Failed to send sign-in link."), true);
  }
}

async function signInWithPassword() {
  var authInstance = await ensureAuth();
  const emailNode = document.getElementById("email-password-input");
  const passwordNode = document.getElementById("password-input");

  const email = String((emailNode && emailNode.value) || "").trim();
  const password = String((passwordNode && passwordNode.value) || "");

  if (!email || !password) {
    setStatus("Enter your email and password to sign in.", true);
    return;
  }

  try {
    await signInWithEmailAndPassword(authInstance, email, password);
    if (passwordNode) {
      passwordNode.value = "";
    }
    setStatus("Signed in with email and password.", false);
  } catch (error) {
    setStatus(getSafeAuthMessage(error, "Sign-in failed."), true);
  }
}

async function sendPasswordReset() {
  var authInstance = await ensureAuth();
  const emailPasswordNode = document.getElementById("email-password-input");
  const emailLinkNode = document.getElementById("email-link-input");
  const email = String(
    (emailPasswordNode && emailPasswordNode.value) ||
    (emailLinkNode && emailLinkNode.value) ||
    ""
  ).trim();

  if (!email) {
    setStatus("Enter your email first, then click Forgot Password.", true);
    return;
  }

  try {
    await sendPasswordResetEmail(authInstance, email);
    setStatus("Password reset email sent. Check your inbox.", false);
  } catch (error) {
    setStatus(getSafeAuthMessage(error, "Could not send reset email."), true);
  }
}

async function getIdToken() {
  var authInstance = await ensureAuth();
  const user = authInstance.currentUser;
  if (!user) {
    return "";
  }

  return user.getIdToken(true);
}

async function logout() {
  var authInstance = await ensureAuth();
  await signOut(authInstance);
  setStatus("Signed out successfully.", false);
}

function syncAdminAuthState(user) {
  if (!window.CMSAdmin) {
    return;
  }

  if (typeof window.CMSAdmin.setAuthState === "function") {
    window.CMSAdmin.setAuthState(Boolean(user), user && user.email ? user.email : "");
  }

  if (user) {
    if (typeof window.CMSAdmin.enterDashboard === "function") {
      window.CMSAdmin.enterDashboard();
    }
      setStatus("Sign-in active. Syncing admin permissions...", false);
      user.getIdToken().then(function(token) {
        fetch("/api/admin/auth-sync", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        }).then(res => res.json()).then(data => {
            console.log("Auth sync complete", data);
            if(data.success) {
               setStatus("Sign-in active. Super Admin synced.", false);
            }
        }).catch(err => console.error("Sync error", err));
      });
    window.CMSAdmin.showLoginView();
  }
  setStatus("Please sign in to access the dashboard.", false);
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
    setStatus("Email link verified. Loading dashboard.", false);
  } catch (error) {
    setStatus(getSafeAuthMessage(error, "Failed to complete email link sign-in."), true);
  }
}

function bindAuthButtons() {
  const sendBtn = document.getElementById("btn-send-email-link");
  const completeBtn = document.getElementById("btn-complete-email-link");
  const passwordBtn = document.getElementById("btn-login-password");
  const forgotPasswordBtn = document.getElementById("btn-forgot-password");

  if (sendBtn) {
    sendBtn.addEventListener("click", sendLink);
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", completeSignInFromLink);
  }

  if (passwordBtn) {
    passwordBtn.addEventListener("click", signInWithPassword);
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", sendPasswordReset);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.CMSFirebaseAuth = {
    getIdToken: getIdToken,
    logout: logout
  };

  bindAuthButtons();
  ensureAuth().then(function (authInstance) {
    onAuthStateChanged(authInstance, function (user) {
      syncAdminAuthState(user);
    });

    if (isSignInWithEmailLink(authInstance, window.location.href)) {
      completeSignInFromLink();
    }
  }).catch(function (_error) {
    setStatus("Failed to initialize sign-in.", true);
  });
});

