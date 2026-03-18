import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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
  console.log(`[Status] ${isError ? "ERROR" : "INFO"}: ${message}`);
  
  // Try the CMS callback if available
  if (window.CMSAdmin && typeof window.CMSAdmin.setStatus === "function") {
    window.CMSAdmin.setStatus(message, isError);
    return;
  }

  // Otherwise, show in login view status message
  const statusNode = document.getElementById("status");
  if (!statusNode) {
    console.warn("[Status] Status element not found in DOM");
    return;
  }

  statusNode.textContent = message;
  
  // Show/hide and style the status message
  if (message && message.trim()) {
    statusNode.style.display = "block";
    statusNode.className = isError ? "auth-status error" : "auth-status success";
  } else {
    statusNode.style.display = "none";
  }
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

async function signInWithGoogle() {
  try {
    const authInstance = await ensureAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    console.log("[Google Auth] Starting sign-in...");
    const result = await signInWithPopup(authInstance, provider);
    const user = result.user;
    
    console.log("[Google Auth] Sign-in successful for:", user.email);
    setStatus("Google sign-in successful. Checking authorization...", false);
    
    // After successful Google signin, sync with backend to verify authorization
    try {
      const token = await user.getIdToken(true); // Force refresh to ensure token is fresh
      const response = await fetch("/api/admin/auth-sync", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      
      const data = await response.json();
      console.log("[Google Auth] Auth sync response:", data);
      
      if (response.status === 403) {
        console.error("[Google Auth] User not authorized (403)");
        await signOut(authInstance);
        setStatus("You are not authorized to access the admin dashboard.", true);
        return;
      }
      
      if (!data.success) {
        console.error("[Google Auth] Auth sync failed:", data.error);
        await signOut(authInstance);
        setStatus("Authorization check failed. " + (data.error || "Please contact support."), true);
        return;
      }
      
      console.log("[Google Auth] User authorized - entering dashboard");
      // Force token refresh to get custom claims
      await user.getIdToken(true);
      setStatus("Authenticated and authorized. Welcome!", false);
      if (window.CMSAdmin && typeof window.CMSAdmin.enterDashboard === "function") {
        window.CMSAdmin.enterDashboard();
      }
    } catch (syncError) {
      console.error("[Google Auth] Sync error:", syncError);
      await signOut(authInstance);
      setStatus("Failed to verify authorization. Please try again.", true);
    }
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("[Google Auth] Sign-in popup was closed by user");
      setStatus("Sign-in cancelled.", false);
      return;
    }
    if (error.code === "auth/popup-blocked") {
      setStatus("Pop-up was blocked. Please allow pop-ups for this site.", true);
      return;
    }
    console.error("[Google Auth] Sign-in error:", error);
    setStatus(getSafeAuthMessage(error, "Google sign-in failed. Please try again."), true);
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
    console.log("[Email Auth] Signing in with email:", email);
    const result = await signInWithEmailAndPassword(authInstance, email, password);
    const user = result.user;
    
    if (passwordNode) {
      passwordNode.value = "";
    }
    
    setStatus("Email sign-in successful. Checking authorization...", false);
    
    // After successful email signin, sync with backend to verify authorization
    try {
      const token = await user.getIdToken(true); // Force refresh to ensure token is fresh
      const response = await fetch("/api/admin/auth-sync", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      
      const data = await response.json();
      console.log("[Email Auth] Auth sync response:", data);
      
      if (response.status === 403) {
        console.error("[Email Auth] User not authorized (403)");
        await signOut(authInstance);
        setStatus("You are not authorized to access the admin dashboard.", true);
        return;
      }
      
      if (!data.success) {
        console.error("[Email Auth] Auth sync failed:", data.error);
        await signOut(authInstance);
        setStatus("Authorization check failed. " + (data.error || "Please contact support."), true);
        return;
      }
      
      console.log("[Email Auth] User authorized - entering dashboard");
      // Force token refresh to get custom claims
      await user.getIdToken(true);
      setStatus("Authenticated and authorized. Welcome!", false);
      if (window.CMSAdmin && typeof window.CMSAdmin.enterDashboard === "function") {
        window.CMSAdmin.enterDashboard();
      }
    } catch (syncError) {
      console.error("[Email Auth] Sync error:", syncError);
      await signOut(authInstance);
      setStatus("Failed to verify authorization. Please try again.", true);
    }
  } catch (error) {
    setStatus(getSafeAuthMessage(error, "Email sign-in failed."), true);
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
    // User is signed in, but authorization is checked during the signin process
    // This function is called by onAuthStateChanged to maintain state
    console.log("[Auth State] User authenticated:", user.email);
    setStatus("Authenticated. Dashboard is ready.", false);
    return;
  }

  // User is not signed in
  if (typeof window.CMSAdmin.showLoginView === "function") {
    window.CMSAdmin.showLoginView();
  }
  setStatus("Please sign in to access the dashboard.", false);
}


function bindAuthButtons() {
  const googleBtn = document.getElementById("btn-google-signin");
  const passwordBtn = document.getElementById("btn-login-password");
  const forgotPasswordBtn = document.getElementById("btn-forgot-password");

  if (googleBtn) {
    googleBtn.addEventListener("click", signInWithGoogle);
  }

  if (passwordBtn) {
    passwordBtn.addEventListener("click", signInWithPassword);
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", sendPasswordReset);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("[Auth] DOMContentLoaded fired - initializing auth system");
  
  window.CMSFirebaseAuth = {
    getIdToken: getIdToken,
    logout: logout
  };

  bindAuthButtons();
  
  // Initialize Firebase with timeout
  const initTimeout = setTimeout(() => {
    console.error("[Auth] Initialization timeout - hiding loading overlay");
    if (window.CMSAdmin && typeof window.CMSAdmin.hideLoadingOverlay === "function") {
      window.CMSAdmin.hideLoadingOverlay();
    }
    if (window.CMSAdmin && typeof window.CMSAdmin.showLoginView === "function") {
      window.CMSAdmin.showLoginView();
    }
    setStatus("Connection timeout. Please refresh the page.", true);
  }, 10000); // 10 second timeout

  ensureAuth().then(function (authInstance) {
    clearTimeout(initTimeout);
    console.log("[Auth] Firebase initialized successfully");
    
    onAuthStateChanged(authInstance, function (user) {
      console.log(`[Auth] Auth state changed - user: ${user ? user.email : "none"}`);
      syncAdminAuthState(user);
    });
  }).catch(function (error) {
    clearTimeout(initTimeout);
    console.error("[Auth] Firebase initialization error:", error);
    setStatus("Failed to initialize authentication. Please refresh the page.", true);
    
    // Make sure loading overlay is hidden even on error
    if (window.CMSAdmin && typeof window.CMSAdmin.hideLoadingOverlay === "function") {
      window.CMSAdmin.hideLoadingOverlay();
    }
    if (window.CMSAdmin && typeof window.CMSAdmin.showLoginView === "function") {
      window.CMSAdmin.showLoginView();
    }
  });
});



