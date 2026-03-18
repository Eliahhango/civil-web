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

    // Users tab elements
    this.usersLoadingEl = document.getElementById("users-loading");
    this.usersErrorEl = document.getElementById("users-error");
    this.usersEmptyEl = document.getElementById("users-empty");
    this.usersListContainerEl = document.getElementById("users-list-container");
    this.adminUsersListEl = document.getElementById("admin-users-list");
    this.usersErrorMessageEl = this.usersErrorEl?.querySelector(".error-message");
    this.btnRetryUsers = document.getElementById("btn-retry-users");
    this.createAdminSectionEl = document.getElementById("create-admin-section");
    this.formCreateAdmin = document.getElementById("form-create-admin");
    this.inputNewAdminEmail = document.getElementById("input-new-admin-email");
    this.inputNewAdminRole = document.getElementById("input-new-admin-role");
    this.btnCreateAdmin = document.getElementById("btn-create-admin");
    this.createAdminStatusEl = document.getElementById("create-admin-status");

    // Logs tab elements
    this.logsFilterEl = document.getElementById("logs-filters");
    this.logsLoadingEl = document.getElementById("logs-loading");
    this.logsErrorEl = document.getElementById("logs-error");
    this.logsEmptyEl = document.getElementById("logs-empty");
    this.logsListContainerEl = document.getElementById("logs-list-container");
    this.auditLogsListEl = document.getElementById("audit-logs-list");
    this.logsErrorMessageEl = this.logsErrorEl?.querySelector(".error-message");
    this.btnRetryLogs = document.getElementById("btn-retry-logs");
    this.logsFilterEventType = document.getElementById("filter-event-type");
    this.logsFilterEmail = document.getElementById("filter-email");
    this.btnApplyFilters = document.getElementById("btn-apply-filters");
    this.btnClearFilters = document.getElementById("btn-clear-filters");
    this.logsPaginationEl = document.getElementById("logs-pagination");

    // Store user role for permission checks
    this.currentUserRole = null;
    
    // Store current logs page and filters
    this.currentLogsPage = 1;
    this.currentLogsFilters = {};

    if (this.btnLogout) {
      this.btnLogout.addEventListener("click", () => this.handleLogout());
    }

    this.navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
        // Load data when switching to users tab
        if (tabName === "users") {
          this.loadUsers();
        }
        // Load data when switching to logs tab
        if (tabName === "logs") {
          this.currentLogsPage = 1;
          this.loadLogs();
        }
      });
    });

    if (this.btnRetryUsers) {
      this.btnRetryUsers.addEventListener("click", () => this.loadUsers());
    }

    if (this.btnRetryLogs) {
      this.btnRetryLogs.addEventListener("click", () => this.loadLogs());
    }

    if (this.btnApplyFilters) {
      this.btnApplyFilters.addEventListener("click", () => {
        this.currentLogsPage = 1;
        this.currentLogsFilters = {
          eventType: this.logsFilterEventType?.value || "",
          email: this.logsFilterEmail?.value || "",
        };
        this.loadLogs();
      });
    }

    if (this.btnClearFilters) {
      this.btnClearFilters.addEventListener("click", () => {
        if (this.logsFilterEventType) this.logsFilterEventType.value = "";
        if (this.logsFilterEmail) this.logsFilterEmail.value = "";
        this.currentLogsPage = 1;
        this.currentLogsFilters = {};
        this.loadLogs();
      });
    }

    if (this.formCreateAdmin) {
      this.formCreateAdmin.addEventListener("submit", (e) => this.handleCreateAdmin(e));
    }
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
    // Validate tab name
    if (!tabName || typeof tabName !== "string") {
      console.warn("[Admin] Invalid tab name:", tabName);
      return;
    }

    console.log("[Admin] Switching to tab:", tabName);
    this.currentTab = tabName;

    // Update nav buttons - only in dashboard view
    this.navButtons.forEach((btn) => {
      const btnTab = btn.dataset.tab;
      if (!btnTab) return;

      if (btnTab === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update tab panels - ensure only one is active
    this.tabPanels.forEach((panel) => {
      const panelTab = panel.dataset.panel;
      if (!panelTab) {
        console.warn("[Admin] Panel missing data-panel attribute:", panel.id);
        return;
      }

      if (panelTab === tabName) {
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

  // Load users from API
  async loadUsers() {
    console.log("[Admin] Loading users list");
    
    // Show loading state
    this.showUsersState("loading");

    try {
      // Import Firebase auth to get token
      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        console.error("[Admin] No ID token available - user may not be logged in");
        this.showUsersState("error", "Authentication token missing. Please log in again.");
        return;
      }

      // Fetch users from API
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.warn("[Admin] Invalid or expired token (401)");
        this.showUsersState("error", "Your session has expired. Please log in again.");
        // Trigger logout to clear auth state
        setTimeout(() => {
          import("./firebase-email-auth.js").then((module) => {
            module.logout();
          });
        }, 2000);
        return;
      }

      if (response.status === 403) {
        console.warn("[Admin] User not authorized to view users (403)");
        this.showUsersState("error", "You don't have permission to view users. Contact administrator.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Admin] Users loaded successfully:", data.users?.length || 0);

      // Store current user role for permission checks
      if (data.currentUserRole) {
        this.currentUserRole = data.currentUserRole;
      }

      // Render users or show empty state
      if (!data.users || data.users.length === 0) {
        this.showUsersState("empty");
      } else {
        this.renderUsers(data.users);
        this.showUsersState("list");
      }

      // Show create admin form only to super_admin
      this.showCreateAdminForm(this.currentUserRole === "super_admin");
    } catch (error) {
      console.error("[Admin] Failed to load users:", error);
      this.showUsersState("error", "Failed to load users. Please try again.");
    }
  }

  // Show/hide users state containers
  showUsersState(state, errorMessage = "") {
    // Hide all states
    if (this.usersLoadingEl) this.usersLoadingEl.style.display = "none";
    if (this.usersErrorEl) this.usersErrorEl.style.display = "none";
    if (this.usersEmptyEl) this.usersEmptyEl.style.display = "none";
    if (this.usersListContainerEl) this.usersListContainerEl.style.display = "none";

    // Show requested state
    if (state === "loading" && this.usersLoadingEl) {
      this.usersLoadingEl.style.display = "block";
    } else if (state === "error" && this.usersErrorEl) {
      if (this.usersErrorMessageEl) {
        this.usersErrorMessageEl.textContent = errorMessage;
      }
      this.usersErrorEl.style.display = "block";
    } else if (state === "empty" && this.usersEmptyEl) {
      this.usersEmptyEl.style.display = "block";
    } else if (state === "list" && this.usersListContainerEl) {
      this.usersListContainerEl.style.display = "block";
    }
  }

  // Render users list
  renderUsers(users) {
    if (!this.adminUsersListEl) return;

    const html = users.map((user) => `
      <div class="user-row">
        <div class="user-email">${this.escapeHtml(user.email)}</div>
        <div class="user-role">
          <span class="role-badge role-${this.escapeHtml(user.role)}">${this.escapeHtml(user.role)}</span>
        </div>
        <div class="user-created">${this.formatDate(user.createdAt)}</div>
      </div>
    `).join("");

    this.adminUsersListEl.innerHTML = html;
  }

  // Show/hide create admin form based on user role
  showCreateAdminForm(isVisible) {
    if (!this.createAdminSectionEl) return;

    if (isVisible) {
      this.createAdminSectionEl.style.display = "block";
    } else {
      this.createAdminSectionEl.style.display = "none";
    }
  }

  // Handle create admin form submission
  async handleCreateAdmin(e) {
    e.preventDefault();

    if (!this.inputNewAdminEmail || !this.inputNewAdminRole) {
      console.error("[Admin] Missing form inputs");
      return;
    }

    const email = this.inputNewAdminEmail.value.trim();
    const role = this.inputNewAdminRole.value;

    if (!email || !role) {
      this.showCreateAdminStatus("Please fill in all fields", "error");
      return;
    }

    try {
      // Disable button during submission
      if (this.btnCreateAdmin) {
        this.btnCreateAdmin.disabled = true;
      }

      this.showCreateAdminStatus("Creating admin...", "loading");

      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You must be a Super Admin to create new admins.");
      }

      if (response.status === 409) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Email already exists in admin users.");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Server error (HTTP ${response.status})`);
      }

      console.log("[Admin] Admin created successfully");
      this.showCreateAdminStatus("Admin created successfully!", "success");

      // Clear form
      if (this.formCreateAdmin) {
        this.formCreateAdmin.reset();
      }

      // Reload users list
      setTimeout(() => this.loadUsers(), 1000);
    } catch (error) {
      console.error("[Admin] Failed to create admin:", error);
      this.showCreateAdminStatus(error.message || "Failed to create admin", "error");
    } finally {
      if (this.btnCreateAdmin) {
        this.btnCreateAdmin.disabled = false;
      }
    }
  }

  // Show status message in create admin form
  showCreateAdminStatus(message, type = "error") {
    if (!this.createAdminStatusEl) return;

    this.createAdminStatusEl.textContent = message;
    this.createAdminStatusEl.className = `status-message status-${type}`;
    this.createAdminStatusEl.style.display = "block";

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        this.createAdminStatusEl.style.display = "none";
      }, 3000);
    }
  }

  // Utility: escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: format timestamp
  formatDate(timestamp) {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  // Load audit logs from API
  async loadLogs() {
    console.log("[Admin] Loading audit logs");
    
    // Show loading state
    this.showLogsState("loading");

    try {
      // Import Firebase auth to get token
      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        console.error("[Admin] No ID token available - user may not be logged in");
        this.showLogsState("error", "Authentication token missing. Please log in again.");
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      params.append("pageNumber", this.currentLogsPage);
      params.append("pageSize", "25");
      
      if (this.currentLogsFilters.eventType) {
        params.append("eventType", this.currentLogsFilters.eventType);
      }
      
      if (this.currentLogsFilters.email) {
        params.append("email", this.currentLogsFilters.email);
      }

      // Fetch logs from API
      const response = await fetch(`/api/admin/logs?${params}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.warn("[Admin] Invalid or expired token (401)");
        this.showLogsState("error", "Your session has expired. Please log in again.");
        // Trigger logout to clear auth state
        setTimeout(() => {
          import("./firebase-email-auth.js").then((module) => {
            module.logout();
          });
        }, 2000);
        return;
      }

      if (response.status === 403) {
        console.warn("[Admin] User not authorized to view logs (403)");
        this.showLogsState("error", "You don't have permission to view logs. Contact administrator.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Admin] Logs loaded successfully:", data.logs?.length || 0);

      // Show filters
      if (this.logsFilterEl) {
        this.logsFilterEl.style.display = "flex";
      }

      // Render logs or show empty state
      if (!data.logs || data.logs.length === 0) {
        this.showLogsState("empty");
      } else {
        this.renderLogs(data.logs);
        this.renderLogsPagination(data.pagination);
        this.showLogsState("list");
      }
    } catch (error) {
      console.error("[Admin] Failed to load logs:", error);
      this.showLogsState("error", "Failed to load logs. Please try again.");
    }
  }

  // Show/hide logs state containers
  showLogsState(state, errorMessage = "") {
    // Hide all states
    if (this.logsLoadingEl) this.logsLoadingEl.style.display = "none";
    if (this.logsErrorEl) this.logsErrorEl.style.display = "none";
    if (this.logsEmptyEl) this.logsEmptyEl.style.display = "none";
    if (this.logsListContainerEl) this.logsListContainerEl.style.display = "none";

    // Show requested state
    if (state === "loading" && this.logsLoadingEl) {
      this.logsLoadingEl.style.display = "block";
    } else if (state === "error" && this.logsErrorEl) {
      if (this.logsErrorMessageEl) {
        this.logsErrorMessageEl.textContent = errorMessage;
      }
      this.logsErrorEl.style.display = "block";
    } else if (state === "empty" && this.logsEmptyEl) {
      this.logsEmptyEl.style.display = "block";
    } else if (state === "list" && this.logsListContainerEl) {
      this.logsListContainerEl.style.display = "block";
    }
  }

  // Render audit logs list
  renderLogs(logs) {
    if (!this.auditLogsListEl) return;

    const html = logs.map((log) => {
      const eventLabel = this.getEventTypeLabel(log.eventType);
      const actor = this.escapeHtml(log.email || "Unknown");
      const target = log.targetEmail ? ` → ${this.escapeHtml(log.targetEmail)}` : "";
      
      return `
        <div class="log-row">
          <div class="log-timestamp">${this.formatDate(log.timestamp)}</div>
          <div class="log-event">
            <span class="event-badge event-${this.escapeHtml(log.eventType)}">${eventLabel}</span>
          </div>
          <div class="log-actor">${actor}</div>
          <div class="log-target">${target}</div>
          <div class="log-ip">${this.escapeHtml(log.ipAddress)}</div>
        </div>
      `;
    }).join("");

    this.auditLogsListEl.innerHTML = html;
  }

  // Render pagination controls
  renderLogsPagination(pagination) {
    if (!this.logsPaginationEl) return;

    const { pageNumber, pageSize, totalPages, totalCount } = pagination;

    if (totalPages <= 1) {
      this.logsPaginationEl.innerHTML = "";
      return;
    }

    let html = `<div class="pagination"><p>Page ${pageNumber} of ${totalPages} (${totalCount} total)</p><div class="pagination-buttons">`;

    if (pageNumber > 1) {
      html += `<button class="btn-small" onclick="adminUI.goToLogsPage(${pageNumber - 1})">← Previous</button>`;
    }

    if (pageNumber < totalPages) {
      html += `<button class="btn-small" onclick="adminUI.goToLogsPage(${pageNumber + 1})">Next →</button>`;
    }

    html += `</div></div>`;
    this.logsPaginationEl.innerHTML = html;
  }

  // Navigate to specific logs page
  goToLogsPage(pageNumber) {
    this.currentLogsPage = pageNumber;
    this.loadLogs();
  }

  // Get human-readable event type label
  getEventTypeLabel(eventType) {
    const labels = {
      "admin.auth.success": "Auth Success",
      "admin.auth.denied": "Auth Denied",
      "admin.user.created": "User Created",
      "admin.user.creation.rollback.failed": "Creation Rollback Failed",
    };
    return labels[eventType] || eventType || "Unknown";
  }

  handleLogout() {
    console.log("[Admin] Logout clicked");
    // Import dynamically to avoid circular dependency
    import("./firebase-email-auth.js").then((module) => {
      module.logout();
    });
  }

  // Debug helper: verify tab navigation setup
  verifyTabMapping() {
    console.group("[Admin] Tab Navigation Mapping");
    console.log("Current tab:", this.currentTab);
    console.log("Nav buttons found:", this.navButtons.length);
    this.navButtons.forEach((btn, idx) => {
      console.log(`  Button ${idx}:`, {
        tab: btn.dataset.tab,
        active: btn.classList.contains("active"),
      });
    });
    console.log("Tab panels found:", this.tabPanels.length);
    this.tabPanels.forEach((panel, idx) => {
      console.log(`  Panel ${idx}:`, {
        id: panel.id,
        dataPanel: panel.dataset.panel,
        active: panel.classList.contains("active"),
      });
    });
    console.groupEnd();
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
