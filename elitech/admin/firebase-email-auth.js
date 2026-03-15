import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const EMAIL_STORAGE_KEY = "emailForSignIn";
const FIREBASE_LOGIN_API = "/api/cms/firebase-login";

const firebaseConfig = {
  apiKey: "replace-with-web-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-firebase-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "replace-with-messaging-sender-id",
  appId: "replace-with-web-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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

async function sendLink() {
  const emailNode = document.getElementById("email-link-input");
  const email = String((emailNode && emailNode.value) || "").trim();

  if (!email) {
    setStatus("Enter your admin email before sending link.", true);
    return;
  }

  try {
    await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    setStatus("Sign-in link sent. Check your email and open the link.", false);
  } catch (error) {
    setStatus(error.message || "Failed to send sign-in link.", true);
  }
}

async function exchangeFirebaseSession() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated Firebase user.");
  }

  const idToken = await user.getIdToken(true);
  const response = await fetch(FIREBASE_LOGIN_API, {
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

  setStatus("Email link verified and admin session started.", false);
}

async function completeSignInFromLink() {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
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
    await signInWithEmailLink(auth, email, window.location.href);
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

  if (isSignInWithEmailLink(auth, window.location.href)) {
    completeSignInFromLink();
  }
});
