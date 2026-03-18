/* ====================================================================
   Admin UI State Manager
   Handles login/dashboard visibility and navigation
   ==================================================================== */

class CMSAdmin {
  constructor() {
    this.currentUser = null;
    this.currentTab = "dashboard";
    this.safetyTimeout = null;
    this.init();
  }

  init() {
    console.log("[Admin] Initializing UI manager");
    this.loginView = document.getElementById("login-view");
    this.dashboardView = document.getElementById("dashboard-view");
    this.navButtons = document.querySelectorAll(".nav-btn");
    this.tabPanels = document.querySelectorAll(".tab-panel");
    this.btnLogout = document.getElementById("btn-logout");
    this.userEmail = document.getElementById("user-email");
    this.statusEl = document.getElementById("status");

    if (this.btnLogout) {
      this.btnLogout.addEventListener("click", () => this.handleLogout());
    }

    this.navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchTab(e.currentTarget.dataset.tab));
    });
  }

  showLoginView() {
    console.log("[Admin] Showing login view");
    if (this.loginView) {
      this.loginView.classList.add("is-active");
      this.loginView.style.display = "flex";
    }
    if (this.dashboardView) {
      this.dashboardView.classList.remove("is-active");
      this.dashboardView.style.display = "none";
    }
  }

  enterDashboard(email) {
    console.log("[Admin] Entering dashboard for:", email);
    this.currentUser = email;
    if (this.userEmail) {
      this.userEmail.textContent = email;
    }
    if (this.dashboardView) {
      this.dashboardView.classList.add("is-active");
      this.dashboardView.style.display = "flex";
    }
    if (this.loginView) {
      this.loginView.classList.remove("is-active");
      this.loginView.style.display = "none";
    }
    this.switchTab("dashboard");
  }

  switchTab(tabName) {
    console.log("[Admin] Switching to tab:", tabName);
    this.currentTab = tabName;

    // Update nav buttons
    this.navButtons.forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update tab panels
    this.tabPanels.forEach((panel) => {
      if (panel.dataset.panel === tabName) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });
  }

  setStatus(message, type = "error") {
    console.log(`[Admin Status] ${type}: ${message}`);
    if (!this.statusEl) return;

    this.statusEl.textContent = message;
    this.statusEl.className = "auth-status";

    if (type === "error") {
      this.statusEl.classList.add("error");
      this.statusEl.classList.remove("success");
    } else if (type === "success") {
      this.statusEl.classList.add("success");
      this.statusEl.classList.remove("error");
    }

    this.statusEl.style.display = "block";

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        this.statusEl.style.display = "none";
      }, 3000);
    }
  }

  hideLoadingOverlay() {
    console.log("[Admin] Hiding loading overlay");
    const overlay = document.querySelector(".admin-loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
  }

  handleLogout() {
    console.log("[Admin] Logout clicked");
    // Import dynamically to avoid circular dependency
    import("./firebase-email-auth.js").then((module) => {
      module.logout();
    });
  }
}

// Initialize when DOM is ready
let adminUI = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[Admin] DOM ready, initializing");
    adminUI = new CMSAdmin();
    // Register with auth module
    import("./firebase-email-auth.js").then((module) => {
      module.registerUIManager(adminUI);
      module.syncAdminAuthState();
    });
  });
} else {
  console.log("[Admin] DOM already loaded, initializing");
  adminUI = new CMSAdmin();
  import("./firebase-email-auth.js").then((module) => {
    module.registerUIManager(adminUI);
    module.syncAdminAuthState();
  });
}
