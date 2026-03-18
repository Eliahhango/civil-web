/**
 * EliTechWiz Admin Panel - Main Dashboard Controller
 * Handles UI interactions, authentication state, and dashboard navigation
 */

class CMSAdmin {
  constructor() {
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.loginView = document.getElementById("login-view");
    this.dashboardView = document.getElementById("dashboard-view");
    this.statusEl = document.getElementById("status");
    this.userEmailEl = document.getElementById("user-email");
    this.logoutBtn = document.getElementById("btn-logout");
    this.navButtons = document.querySelectorAll(".nav-btn");
    this.tabPanels = document.querySelectorAll(".tab-panel");
    
    this.initializationComplete = false;
  }

  /**
   * Initialize admin panel on page load
   */
  async init() {
    console.log("[Admin] Initializing admin panel...");
    
    // Set up navigation
    this.setupNavigation();
    
    // Set up logout button
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Wait a moment for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mark initialization complete
    this.initializationComplete = true;
    console.log("[Admin] Admin panel ready");
  }

  /**
   * Called by firebase-email-auth.js when authentication state changes
   */
  setAuthState(isAuthenticated, email) {
    console.log(`[Admin] Auth state changed: ${isAuthenticated ? "authenticated" : "not authenticated"} - ${email}`);
    
    if (isAuthenticated && email) {
      this.userEmailEl.textContent = email;
    }
  }

  /**
   * Called by firebase-email-auth.js to show login view
   */
  showLoginView() {
    console.log("[Admin] Showing login view");
    
    if (this.loginView) {
      this.loginView.classList.add("is-active");
      this.loginView.style.display = "flex";
    }
    
    if (this.dashboardView) {
      this.dashboardView.style.display = "none";
    }
    
    this.hideLoadingOverlay();
  }

  /**
   * Called by firebase-email-auth.js after successful authorization
   */
  enterDashboard() {
    console.log("[Admin] Entering dashboard");
    
    if (this.loginView) {
      this.loginView.classList.remove("is-active");
      this.loginView.style.display = "none";
    }
    
    if (this.dashboardView) {
      this.dashboardView.style.display = "flex";
    }
    
    this.hideLoadingOverlay();
    
    // Load initial data
    this.loadDashboardData();
  }

  /**
   * Set status message (error or success)
   */
  setStatus(message, isError) {
    if (!this.statusEl) return;
    
    this.statusEl.textContent = message;
    if (message && message.trim()) {
      this.statusEl.style.display = "block";
      this.statusEl.className = isError ? "auth-status error" : "auth-status success";
    } else {
      this.statusEl.style.display = "none";
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    // Clear the safety timeout
    if (window.hideLoadingOverlayTimer) {
      clearTimeout(window.hideLoadingOverlayTimer);
    }
    
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
      this.loadingOverlay.style.pointerEvents = "none";
      this.loadingOverlay.style.opacity = "0";
      this.loadingOverlay.style.display = "none";
    }
  }

  /**
   * Setup navigation tab switching
   */
  setupNavigation() {
    this.navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabName = btn.getAttribute("data-tab");
        this.switchTab(tabName);
      });
    });
  }

  /**
   * Switch active tab
   */
  switchTab(tabName) {
    console.log(`[Admin] Switching to tab: ${tabName}`);
    
    // Update nav buttons
    this.navButtons.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update tab panels
    this.tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}`) {
        panel.classList.add("active");
        panel.style.display = "block";
      } else {
        panel.classList.remove("active");
        panel.style.display = "none";
      }
    });

    // Load tab-specific data
    if (tabName === "users") {
      this.loadUsers();
    } else if (tabName === "logs") {
      this.loadAuditLogs();
    }
  }

  /**
   * Load initial dashboard data
   */
  async loadDashboardData() {
    console.log("[Admin] Loading dashboard data");
    // Can load KPI data, recent activity, etc.
  }

  /**
   * Load users list (if tab is accessed)
   */
  async loadUsers() {
    console.log("[Admin] Loading users list");
    const usersList = document.getElementById("admin-users-list");
    if (!usersList) return;

    try {
      const token = await window.CMSFirebaseAuth.getIdToken();
      if (!token) {
        console.error("[Admin] No auth token available");
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Admin] Users list:", data);

      if (data.users && data.users.length > 0) {
        usersList.innerHTML = data.users.map(user => `
          <tr>
            <td>${user.email}</td>
            <td><span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
            <td><span style="color: #059669;">Active</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join("");
      } else {
        usersList.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No administrators found</td></tr>`;
      }
    } catch (error) {
      console.error("[Admin] Failed to load users:", error);
      usersList.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Failed to load users</td></tr>`;
    }
  }

  /**
   * Load audit logs (if tab is accessed)
   */
  async loadAuditLogs() {
    console.log("[Admin] Loading audit logs");
    const logsContainer = document.getElementById("logs-container");
    if (!logsContainer) return;

    try {
      logsContainer.innerHTML = '<p class="text-muted">Audit logs are managed in Firestore console</p>';
    } catch (error) {
      console.error("[Admin] Failed to load audit logs:", error);
      logsContainer.innerHTML = '<p class="text-muted">Failed to load audit logs</p>';
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    console.log("[Admin] Logging out...");
    await window.CMSFirebaseAuth.logout();
    this.showLoginView();
    this.setStatus("Signed out successfully", false);
  }
}

// Initialize admin panel when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Admin] DOM Content Loaded - starting initialization");
  window.CMSAdmin = new CMSAdmin();
  await window.CMSAdmin.init();
});
