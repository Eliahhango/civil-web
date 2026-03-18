/* ====================================================================
   Firebase Authentication - Email/Password + Google OAuth
   Admin Panel Security - No Magic Links
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

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA-3-4hbUe3eNr",
  authDomain: "civil-web-34b1f.firebaseapp.com",
  projectId: "civil-web-34b1f",
  storageBucket: "civil-web-34b1f.appspot.com",
  messagingSenderId: "505938938",
  appId: "1:505938938:web:7f8d97c89eb4b50d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Global UI reference (set by admin.js)
let uiManager = null;

// Status message handler
function setStatus(message, type = "error") {
  console.log(`[Auth Status] ${message}`);
  if (uiManager) {
    uiManager.setStatus(message, type);
  }
}

// Sync admin authorization with backend
async function syncAdminAuth(user) {
  if (!user) return false;

  try {
    console.log("[Auth Sync] Starting admin authorization for:", user.email);
    const token = await user.getIdToken();

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

    if (response.status === 403) {
      console.warn("[Auth Sync] User not authorized (403)");
      await signOut(auth);
      setStatus("Access denied. Contact administrator.", "error");
      return false;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[Auth Sync] Admin authorization successful");

    // Force refresh token to include custom claims
    await user.getIdToken(true);
    return data.success === true;
  } catch (error) {
    console.error("[Auth Sync Error]", error);
    setStatus("Authorization check failed. Please try again.", "error");
    await signOut(auth);
    return false;
  }
}

// Google Sign In
export async function signInWithGoogle() {
  try {
    console.log("[Google Auth] Starting Google sign-in flow");
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
  } catch (error) {
    console.error("[Google Auth Error]", error.code, error.message);

    if (error.code === "auth/popup-closed-by-user") {
      setStatus("Sign-in cancelled.", "error");
    } else if (error.code === "auth/popup-blocked") {
      setStatus("Sign-in popup blocked. Please allow popups.", "error");
    } else {
      setStatus("Google sign-in failed. Please try again.", "error");
    }
  }
}

// Email/Password Sign In
export async function signInWithPassword(email, password) {
  try {
    console.log("[Email Auth] Starting email/password sign-in");
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    console.log("[Email Auth] Successfully signed in with email:", user.email);
    const authorized = await syncAdminAuth(user);

    if (authorized) {
      setStatus("Welcome!", "success");
      if (uiManager) {
        uiManager.enterDashboard(user.email);
      }
    }
  } catch (error) {
    console.error("[Email Auth Error]", error.code, error.message);

    if (error.code === "auth/invalid-email") {
      setStatus("Invalid email address.", "error");
    } else if (error.code === "auth/user-disabled") {
      setStatus("Access denied.", "error");
    } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      setStatus("Invalid email or password.", "error");
    } else if (error.code === "auth/too-many-requests") {
      setStatus("Too many attempts. Try again later.", "error");
    } else {
      setStatus("Sign-in failed. Please try again.", "error");
    }
  }
}

// Password Reset
export async function sendPasswordReset(email) {
  try {
    console.log("[Password Reset] Sending reset email to:", email);
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
    await signOut(auth);
    if (uiManager) {
      uiManager.showLoginView();
    }
  } catch (error) {
    console.error("[Logout Error]", error);
  }
}

// Sync auth state with UI
export function syncAdminAuthState() {
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
}

// UI Manager registration (called by admin.js)
export function registerUIManager(manager) {
  uiManager = manager;
}

// Initialize on DOM load
let initTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Init] Admin panel initialization started");

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
  const btnForgotPassword = document.getElementById("btn-forgot-password");
  const emailPasswordForm = document.getElementById("email-password-form");

  if (btnGoogle) {
    btnGoogle.addEventListener("click", signInWithGoogle);
  }

  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("email-input").value.trim();
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
      const email = document.getElementById("email-input").value.trim();
      const password = document.getElementById("password-input").value;

      if (!email || !password) {
        setStatus("Enter email and password.", "error");
        return;
      }

      signInWithPassword(email, password);
    });
  }
});
