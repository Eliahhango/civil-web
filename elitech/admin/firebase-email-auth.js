/* ====================================================================
   Firebase Authentication - Email/Password + Google OAuth
   Admin Panel Security - No Magic Links
   Configuration fetched from API endpoint for consistency
   ==================================================================== */

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Firebase initialization state
let app = null;
let auth = null;
let googleProvider = null;
let initPromise = null;

// Global UI reference (set by admin.js)
let uiManager = null;

// Status message handler
function setStatus(message, type = "error") {
  console.log(`[Auth Status] ${message}`);
  if (uiManager) {
    uiManager.setStatus(message, type);
  }
}

// Fetch Firebase configuration from API endpoint
async function fetchFirebaseConfig() {
  try {
    console.log("[Config] Fetching Firebase Web configuration from API");
    const response = await fetch("/api/cms/firebase-web-config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Config Error]", response.status, errorData);

      if (response.status === 500) {
        const missingVars = errorData.missing || [];
        const config = [
          "FIREBASE_WEB_API_KEY",
          "FIREBASE_WEB_AUTH_DOMAIN",
          "FIREBASE_WEB_PROJECT_ID",
          "FIREBASE_WEB_STORAGE_BUCKET",
          "FIREBASE_WEB_MESSAGING_SENDER_ID",
          "FIREBASE_WEB_APP_ID"
        ];

        throw new Error(
          `Firebase configuration incomplete. Missing environment variables:\n${config.join(", ")}\n\n` +
          `Please ensure all Firebase Web configuration environment variables are set ` +
          `in your deployment environment.`
        );
      }

      throw new Error(
        `Failed to load Firebase configuration (HTTP ${response.status}). ` +
        `Admin panel cannot initialize.`
      );
    }

    const config = await response.json();

    // Validate config has required fields
    const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Firebase configuration missing required fields: ${missingFields.join(", ")}. ` +
        `Please verify environment variables are properly set.`
      );
    }

    console.log("[Config] Firebase Web configuration loaded successfully");
    return config;
  } catch (error) {
    console.error("[Config Error]", error.message);
    throw new Error(
      `Configuration Error: ${error.message}\n\n` +
      `The admin panel requires a properly configured Firebase project. ` +
      `Check console for details.`
    );
  }
}

// Initialize Firebase with configuration
async function initializeFirebase() {
  if (initPromise) {
    return initPromise; // Return existing promise if already initializing
  }

  initPromise = (async () => {
    try {
      const firebaseConfig = await fetchFirebaseConfig();

      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();

      console.log("[Firebase] Firebase initialized successfully");
      return true;
    } catch (error) {
      console.error("[Firebase Init Error]", error.message);
      setStatus(error.message, "error");
      
      // Show error clearly in the UI
      const loginView = document.getElementById("login-view");
      if (loginView) {
        loginView.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #ef4444;">
            <h2 style="margin-bottom: 16px;">Configuration Error</h2>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
              The admin panel cannot initialize due to a configuration error.
            </p>
            <p style="font-size: 12px; color: #6b7280; white-space: pre-wrap; text-align: left; 
                      background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace;">
              ${error.message}
            </p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">
              Please contact your administrator.
            </p>
          </div>
        `;
      }
      
      throw error;
    }
  })();

  return initPromise;
}

// Ensure Firebase is initialized before using
function ensureInitialized() {
  if (!auth) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return auth;
}

// Sync admin authorization with backend
async function syncAdminAuth(user) {
  if (!user) {
    console.error("[Auth Sync] No user provided");
    setStatus("User authentication failed. Please try again.", "error");
    return false;
  }

  try {
    console.log("[Auth Sync] Starting admin authorization for:", user.email);
    let token;
    try {
      token = await user.getIdToken();
    } catch (tokenError) {
      console.error("[Auth Sync] Failed to get ID token:", tokenError);
      setStatus("Failed to get authentication token. Please try again.", "error");
      await signOut(auth);
      return false;
    }

    const response = await fetch("/api/admin/auth-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
      }),
    });

    if (response.status === 401) {
      console.warn("[Auth Sync] Invalid or expired token (401)");
      await signOut(auth);
      setStatus("Your authentication token is invalid. Please try again.", "error");
      return false;
    }

    if (response.status === 403) {
      console.warn("[Auth Sync] User not authorized (403) -", user.email);
      await signOut(auth);
      setStatus("Access denied. Your account is not registered as an admin. Contact administrator.", "error");
      return false;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Auth Sync] HTTP error:", response.status, errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.error || "Auth sync failed"}`);
    }

    const data = await response.json();
    console.log("[Auth Sync] Admin authorization successful");

    // Force refresh token to include custom claims
    try {
      await user.getIdToken(true);
    } catch (refreshError) {
      console.warn("[Auth Sync] Token refresh failed (non-critical):", refreshError);
    }
    
    return data.success === true;
  } catch (error) {
    console.error("[Auth Sync Error]", error);
    setStatus("Authorization check failed. Please try again or contact support.", "error");
    await signOut(auth).catch(() => {});
    return false;
  }
}

// Google Sign In
export async function signInWithGoogle() {
  try {
    console.log("[Google Auth] Starting Google sign-in flow");
    ensureInitialized();
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("[Google Auth] Successfully signed in with Google:", user.email);
    const authorized = await syncAdminAuth(user);

    if (authorized) {
      setStatus("Welcome!", "success");
      if (uiManager) {
        uiManager.enterDashboard(user.email);
      }
    }
    // syncAdminAuth handles unauthorized case with detailed error message
  } catch (error) {
    console.error("[Google Auth Error]", error.code, error.message);

    if (error.code === "auth/popup-closed-by-user") {
      setStatus("Sign-in cancelled.", "error");
    } else if (error.code === "auth/popup-blocked") {
      setStatus("Sign-in popup blocked. Please allow popups.", "error");
    } else if (error.code === "auth/network-request-failed") {
      setStatus("Network error. Please check your connection.", "error");
    } else {
      setStatus("Google sign-in failed. Please try again or use email/password.", "error");
    }
  }
}

// Email/Password Sign In
export async function signInWithPassword(email, password) {
  const btnLoginPassword = document.getElementById("btn-login-password");
  const btnText = btnLoginPassword?.querySelector(".btn-text");
  const btnLoader = btnLoginPassword?.querySelector(".btn-loader");

  try {
    // Show loading state
    if (btnLoginPassword) {
      btnLoginPassword.disabled = true;
    }
    if (btnText) {
      btnText.style.display = "none";
    }
    if (btnLoader) {
      btnLoader.style.display = "inline-block";
    }

    console.log("[Email Auth] Starting email/password sign-in");
    ensureInitialized();
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    console.log("[Email Auth] Successfully signed in with email:", user.email);
    const authorized = await syncAdminAuth(user);

    if (authorized) {
      console.log("[Email Auth] Authorization successful");
      setStatus("Welcome!", "success");
      if (uiManager) {
        uiManager.enterDashboard(user.email);
      }
    }
    // syncAdminAuth handles unauthorized case with detailed error message
  } catch (error) {
    console.error("[Email Auth Error]", error.code, error.message);

    if (error.code === "auth/invalid-email") {
      setStatus("Invalid email address.", "error");
    } else if (error.code === "auth/user-disabled") {
      setStatus("This account has been disabled. Contact administrator.", "error");
    } else if (error.code === "auth/user-not-found") {
      setStatus("Invalid email or password.", "error");
    } else if (error.code === "auth/wrong-password") {
      setStatus("Invalid email or password.", "error");
    } else if (error.code === "auth/too-many-requests") {
      setStatus("Too many failed attempts. Try again in a few minutes.", "error");
    } else if (error.code === "auth/network-request-failed") {
      setStatus("Network error. Please check your connection.", "error");
    } else if (error.message?.includes("Email and password are required")) {
      setStatus("Please enter both email and password.", "error");
    } else {
      setStatus("Sign-in failed. Please try again.", "error");
    }
  } finally {
    // Hide loading state
    if (btnLoginPassword) {
      btnLoginPassword.disabled = false;
    }
    if (btnText) {
      btnText.style.display = "inline";
    }
    if (btnLoader) {
      btnLoader.style.display = "none";
    }
  }
}

// Password Reset
export async function sendPasswordReset(email) {
  try {
    console.log("[Password Reset] Sending reset email to:", email);
    ensureInitialized();
    await sendPasswordResetEmail(auth, email);
    setStatus("Check your email for reset instructions.", "success");
  } catch (error) {
    console.error("[Password Reset Error]", error.code, error.message);

    if (error.code === "auth/user-not-found") {
      setStatus("Check your email for reset instructions.", "success");
    } else if (error.code === "auth/invalid-email") {
      setStatus("Invalid email address.", "error");
    } else {
      setStatus("Could not send reset email. Try again.", "error");
    }
  }
}

// Logout
export async function logout() {
  try {
    console.log("[Logout] Signing out user");
    ensureInitialized();
    await signOut(auth);
    if (uiManager) {
      uiManager.showLoginView();
    }
  } catch (error) {
    console.error("[Logout Error]", error);
  }
}

// Sync auth state with UI
export async function syncAdminAuthState() {
  try {
    ensureInitialized();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("[Auth State] No authenticated user");
        if (uiManager) {
          uiManager.showLoginView();
        }
      } else {
        console.log("[Auth State] User authenticated:", user.email);
      }
    });
  } catch (error) {
    console.error("[Auth State Error]", error.message);
  }
}

// UI Manager registration (called by admin.js)
export function registerUIManager(manager) {
  uiManager = manager;
}

// Get current Firebase user
export function getCurrentUser() {
  if (!auth) return null;
  return auth.currentUser;
}

// Get current user's ID token
export async function getIdToken() {
  const user = getCurrentUser();
  if (!user) {
    console.error("[Auth] No user currently logged in");
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("[Auth] Failed to get ID token:", error);
    return null;
  }
}

// Initialize on DOM load
let initTimeout = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Init] Admin panel initialization started");

  try {
    // Initialize Firebase first (fetch config from API)
    console.log("[Init] Initializing Firebase...");
    await initializeFirebase();
  } catch (error) {
    console.error("[Init] Failed to initialize Firebase:", error.message);
    // Error message already displayed by initializeFirebase()
    return;
  }

  // Safety timeout: hide loader after 15 seconds
  initTimeout = setTimeout(() => {
    console.warn("[Init] Initialization timeout - hiding loader");
    if (uiManager) {
      uiManager.hideLoadingOverlay();
    }
  }, 15000);

  // Check current auth state
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    clearTimeout(initTimeout);

    if (user) {
      console.log("[Init] User found, syncing authorization");
      const authorized = await syncAdminAuth(user);
      if (authorized) {
        if (uiManager) {
          uiManager.enterDashboard(user.email);
          uiManager.hideLoadingOverlay();
        }
      } else {
        if (uiManager) {
          uiManager.hideLoadingOverlay();
          uiManager.showLoginView();
        }
      }
    } else {
      console.log("[Init] No user found, showing login");
      if (uiManager) {
        uiManager.hideLoadingOverlay();
        uiManager.showLoginView();
      }
    }

    unsubscribe();
  });

  // Register event listeners
  const btnGoogle = document.getElementById("btn-google-signin");
  const btnLoginPassword = document.getElementById("btn-login-password");
  const btnForgotPassword = document.getElementById("btn-forgot-password");
  const emailPasswordForm = document.getElementById("email-password-form");
  const emailInput = document.getElementById("email-password-input");
  const passwordInput = document.getElementById("password-input");

  if (btnGoogle) {
    btnGoogle.addEventListener("click", signInWithGoogle);
  }

  if (btnLoginPassword) {
    btnLoginPassword.addEventListener("click", (e) => {
      e.preventDefault();
      if (!emailInput || !passwordInput) {
        console.error("[Email Auth] Missing email or password input elements");
        setStatus("Form elements not found. Please refresh the page.", "error");
        return;
      }
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        setStatus("Enter email and password.", "error");
        return;
      }

      signInWithPassword(email, password);
    });
  }

  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      if (!emailInput) {
        console.error("[Password Reset] Missing email input element");
        setStatus("Email input not found. Please refresh the page.", "error");
        return;
      }
      const email = emailInput.value.trim();
      if (email) {
        sendPasswordReset(email);
      } else {
        setStatus("Enter your email address.", "error");
      }
    });
  }

  if (emailPasswordForm) {
    emailPasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!emailInput || !passwordInput) {
        console.error("[Email Auth] Missing email or password input elements");
        setStatus("Form elements not found. Please refresh the page.", "error");
        return;
      }
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        setStatus("Enter email and password.", "error");
        return;
      }

      signInWithPassword(email, password);
    });
  }
});
