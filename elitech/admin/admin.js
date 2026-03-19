/* ====================================================================
   Admin UI State Manager
   Handles login/dashboard visibility, website content, users, and logs
   ==================================================================== */

import { AdminContentEditor } from "./content-editor.js";

class CMSAdmin {
  constructor() {
    this.currentUser = null;
    this.currentUserRole = null;
    this.currentTab = "dashboard";
    this.currentNavKey = "dashboard";
    this.currentContentSection = "about";
    this.currentLogsPage = 1;
    this.currentLogsFilters = {};
    this.contentConfig = null;
    this.init();
  }

  init() {
    console.log("[Admin] Initializing UI manager");

    this.loginView = document.getElementById("login-view");
    this.dashboardView = document.getElementById("dashboard-view");
    this.navButtons = Array.from(document.querySelectorAll(".nav-btn"));
    this.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
    this.btnLogout = document.getElementById("btn-logout");
    this.userEmail = document.getElementById("user-email");
    this.statusEl = document.getElementById("status");
    this.btnOpenContent = document.getElementById("btn-open-content");

    this.contentLoadingEl = document.getElementById("content-loading");
    this.contentErrorEl = document.getElementById("content-error");
    this.contentEditorEl = document.getElementById("content-editor");
    this.contentErrorMessageEl = this.contentErrorEl ? this.contentErrorEl.querySelector(".error-message") : null;
    this.btnRetryContent = document.getElementById("btn-retry-content");
    this.formContentEditor = document.getElementById("form-content-editor");
    this.btnReloadContent = document.getElementById("btn-reload-content");
    this.btnSaveContent = document.getElementById("btn-save-content");
    this.contentStatusEl = document.getElementById("content-status");
    this.contentPanelKickerEl = document.getElementById("content-panel-kicker");
    this.contentPanelTitleEl = document.getElementById("content-panel-title");
    this.contentPanelDescriptionEl = document.getElementById("content-panel-description");
    this.contentSummaryEl = document.getElementById("content-summary");
    this.contentFieldsEl = document.getElementById("content-fields");
    this.contentEditor = new AdminContentEditor({
      navEl: null,
      summaryEl: this.contentSummaryEl,
      fieldsEl: this.contentFieldsEl
    });

    this.usersLoadingEl = document.getElementById("users-loading");
    this.usersErrorEl = document.getElementById("users-error");
    this.usersEmptyEl = document.getElementById("users-empty");
    this.usersListContainerEl = document.getElementById("users-list-container");
    this.adminUsersListEl = document.getElementById("admin-users-list");
    this.usersErrorMessageEl = this.usersErrorEl ? this.usersErrorEl.querySelector(".error-message") : null;
    this.btnRetryUsers = document.getElementById("btn-retry-users");
    this.createAdminSectionEl = document.getElementById("create-admin-section");
    this.formCreateAdmin = document.getElementById("form-create-admin");
    this.inputNewAdminEmail = document.getElementById("input-new-admin-email");
    this.inputNewAdminRole = document.getElementById("input-new-admin-role");
    this.btnCreateAdmin = document.getElementById("btn-create-admin");
    this.createAdminStatusEl = document.getElementById("create-admin-status");

    this.logsFilterEl = document.getElementById("logs-filters");
    this.logsLoadingEl = document.getElementById("logs-loading");
    this.logsErrorEl = document.getElementById("logs-error");
    this.logsEmptyEl = document.getElementById("logs-empty");
    this.logsListContainerEl = document.getElementById("logs-list-container");
    this.auditLogsListEl = document.getElementById("audit-logs-list");
    this.logsErrorMessageEl = this.logsErrorEl ? this.logsErrorEl.querySelector(".error-message") : null;
    this.btnRetryLogs = document.getElementById("btn-retry-logs");
    this.logsFilterEventType = document.getElementById("filter-event-type");
    this.logsFilterEmail = document.getElementById("filter-email");
    this.btnApplyFilters = document.getElementById("btn-apply-filters");
    this.btnClearFilters = document.getElementById("btn-clear-filters");
    this.logsPaginationEl = document.getElementById("logs-pagination");

    if (this.btnLogout) {
      this.btnLogout.addEventListener("click", () => this.handleLogout());
    }

    if (this.btnOpenContent) {
      this.btnOpenContent.addEventListener("click", () => this.switchTab("content", {
        contentSection: this.currentContentSection,
        navKey: `content:${this.currentContentSection}`
      }));
    }

    this.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.dataset.tab || "";
        const contentSection = button.dataset.contentSection || "";
        this.switchTab(tabName, {
          navKey: this.getNavKey(button),
          contentSection
        });
      });
    });

    if (this.btnRetryContent) {
      this.btnRetryContent.addEventListener("click", () => this.loadContent(true));
    }

    if (this.btnReloadContent) {
      this.btnReloadContent.addEventListener("click", () => this.loadContent(true));
    }

    if (this.formContentEditor) {
      this.formContentEditor.addEventListener("submit", (event) => this.handleSaveContent(event));
    }

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
          eventType: this.logsFilterEventType ? this.logsFilterEventType.value : "",
          email: this.logsFilterEmail ? this.logsFilterEmail.value.trim() : ""
        };
        this.loadLogs();
      });
    }

    if (this.btnClearFilters) {
      this.btnClearFilters.addEventListener("click", () => {
        if (this.logsFilterEventType) {
          this.logsFilterEventType.value = "";
        }
        if (this.logsFilterEmail) {
          this.logsFilterEmail.value = "";
        }
        this.currentLogsPage = 1;
        this.currentLogsFilters = {};
        this.loadLogs();
      });
    }

    if (this.formCreateAdmin) {
      this.formCreateAdmin.addEventListener("submit", (event) => this.handleCreateAdmin(event));
    }
  }

  showLoginView() {
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
    this.currentUser = email || "";

    if (this.userEmail) {
      this.userEmail.textContent = email || "";
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

  getNavKey(button) {
    if (!button) {
      return "";
    }

    const explicitKey = button.dataset.navKey || "";
    if (explicitKey) {
      return explicitKey;
    }

    const tabName = button.dataset.tab || "";
    const contentSection = button.dataset.contentSection || "";
    return contentSection ? `${tabName}:${contentSection}` : tabName;
  }

  updateContentPanelHeader(sectionMeta = null) {
    const activeSection = sectionMeta || this.contentEditor.getActiveSectionMeta();
    if (!activeSection) {
      return;
    }

    if (this.contentPanelKickerEl) {
      this.contentPanelKickerEl.textContent = "Website Content";
    }

    if (this.contentPanelTitleEl) {
      this.contentPanelTitleEl.textContent = activeSection.label;
    }

    if (this.contentPanelDescriptionEl) {
      this.contentPanelDescriptionEl.textContent = activeSection.description;
    }
  }

  switchTab(tabName, options = {}) {
    if (!tabName) {
      return;
    }

    this.currentTab = tabName;
    const requestedContentSection = tabName === "content"
      ? (options.contentSection || this.currentContentSection || "about")
      : "";

    if (requestedContentSection) {
      const sectionMeta = this.contentEditor.setActiveSection(requestedContentSection);
      this.currentContentSection = sectionMeta.id;
      this.updateContentPanelHeader(sectionMeta);
    }

    this.currentNavKey = options.navKey
      || (tabName === "content" ? `content:${this.currentContentSection}` : tabName);

    this.navButtons.forEach((button) => {
      button.classList.toggle("active", this.getNavKey(button) === this.currentNavKey);
    });

    this.tabPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === tabName);
    });

    if (tabName === "content") {
      this.loadContent();
    }

    if (tabName === "users") {
      this.loadUsers();
    }

    if (tabName === "logs") {
      this.currentLogsPage = 1;
      this.loadLogs();
    }
  }

  setStatus(message, type = "error") {
    if (!this.statusEl) {
      return;
    }

    this.statusEl.textContent = message;
    this.statusEl.className = "auth-status";
    this.statusEl.classList.add(type === "success" ? "success" : "error");
    this.statusEl.style.display = "block";

    if (type === "success") {
      window.setTimeout(() => {
        if (this.statusEl) {
          this.statusEl.style.display = "none";
        }
      }, 3000);
    }
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  normalizeContentConfig(data) {
    return data && typeof data === "object" ? data : {};
  }

  async loadContent(force = false) {
    if (!force && this.contentConfig) {
      this.populateContentForm(this.contentConfig);
      this.showContentState("editor");
      return;
    }

    this.showContentState("loading");
    this.showContentStatus("", "success", true);

    try {
      const response = await fetch("/api/cms/content", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store"
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      this.contentConfig = this.normalizeContentConfig(data);
      this.populateContentForm(this.contentConfig);
      this.showContentState("editor");
    } catch (error) {
      console.error("[Admin] Failed to load website content:", error);
      this.showContentState("error", error.message || "Failed to load website content.");
    }
  }

  showContentState(state, errorMessage = "") {
    if (this.contentLoadingEl) this.contentLoadingEl.style.display = "none";
    if (this.contentErrorEl) this.contentErrorEl.style.display = "none";
    if (this.contentEditorEl) this.contentEditorEl.style.display = "none";

    if (state === "loading" && this.contentLoadingEl) {
      this.contentLoadingEl.style.display = "block";
    }

    if (state === "error" && this.contentErrorEl) {
      if (this.contentErrorMessageEl) {
        this.contentErrorMessageEl.textContent = errorMessage;
      }
      this.contentErrorEl.style.display = "block";
    }

    if (state === "editor" && this.contentEditorEl) {
      this.contentEditorEl.style.display = "block";
    }
  }

  populateContentForm(data) {
    this.contentEditor.setData(data || {});
    this.updateContentPanelHeader();
  }

  buildContentPayload() {
    return this.contentEditor.getData();
  }

  async handleSaveContent(event) {
    event.preventDefault();

    try {
      if (this.btnSaveContent) {
        this.btnSaveContent.disabled = true;
      }

      this.showContentStatus("Saving website content...", "loading");
      const payload = this.buildContentPayload();

      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/cms/content", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      this.contentConfig = this.normalizeContentConfig(payload);
      this.populateContentForm(this.contentConfig);
      this.showContentStatus("Website content saved. Refresh the public page to verify the change.", "success");
    } catch (error) {
      console.error("[Admin] Failed to save website content:", error);
      this.showContentStatus(error.message || "Failed to save website content.", "error");
    } finally {
      if (this.btnSaveContent) {
        this.btnSaveContent.disabled = false;
      }
    }
  }

  showContentStatus(message, type = "error", hide = false) {
    if (!this.contentStatusEl) {
      return;
    }

    if (hide || !message) {
      this.contentStatusEl.style.display = "none";
      this.contentStatusEl.textContent = "";
      this.contentStatusEl.className = "status-message";
      return;
    }

    this.contentStatusEl.textContent = message;
    this.contentStatusEl.className = `status-message status-${type}`;
    this.contentStatusEl.style.display = "block";

    if (type === "success") {
      window.setTimeout(() => {
        if (this.contentStatusEl) {
          this.contentStatusEl.style.display = "none";
        }
      }, 4000);
    }
  }

  async loadUsers() {
    this.showUsersState("loading");
    this.showCreateAdminForm(false);

    try {
      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      this.currentUserRole = data.currentUserRole || null;
      this.showCreateAdminForm(this.currentUserRole === "super_admin");

      if (!Array.isArray(data.users) || data.users.length === 0) {
        this.showUsersState("empty");
        return;
      }

      this.renderUsers(data.users);
      this.showUsersState("list");
    } catch (error) {
      console.error("[Admin] Failed to load users:", error);
      this.currentUserRole = null;
      this.showUsersState("error", error.message || "Failed to load users.");
    }
  }

  showUsersState(state, errorMessage = "") {
    if (this.usersLoadingEl) this.usersLoadingEl.style.display = "none";
    if (this.usersErrorEl) this.usersErrorEl.style.display = "none";
    if (this.usersEmptyEl) this.usersEmptyEl.style.display = "none";
    if (this.usersListContainerEl) this.usersListContainerEl.style.display = "none";

    if (state === "loading" && this.usersLoadingEl) {
      this.usersLoadingEl.style.display = "block";
    }

    if (state === "error" && this.usersErrorEl) {
      if (this.usersErrorMessageEl) {
        this.usersErrorMessageEl.textContent = errorMessage;
      }
      this.usersErrorEl.style.display = "block";
    }

    if (state === "empty" && this.usersEmptyEl) {
      this.usersEmptyEl.style.display = "block";
    }

    if (state === "list" && this.usersListContainerEl) {
      this.usersListContainerEl.style.display = "block";
    }
  }

  renderUsers(users) {
    if (!this.adminUsersListEl) {
      return;
    }

    const rows = users.map((user) => `
      <div class="user-row">
        <div class="user-email">${this.escapeHtml(user.email)}</div>
        <div class="user-role">
          <span class="role-badge role-${this.escapeHtml(user.role)}">${this.escapeHtml(user.role)}</span>
        </div>
        <div class="user-created">${this.formatDate(user.createdAt)}</div>
      </div>
    `);

    this.adminUsersListEl.innerHTML = rows.join("");
  }

  showCreateAdminForm(isVisible) {
    if (!this.createAdminSectionEl) {
      return;
    }

    this.createAdminSectionEl.style.display = isVisible ? "block" : "none";
  }

  async handleCreateAdmin(event) {
    event.preventDefault();

    if (!this.inputNewAdminEmail || !this.inputNewAdminRole) {
      return;
    }

    const email = this.inputNewAdminEmail.value.trim();
    const role = this.inputNewAdminRole.value;

    if (!email || !role) {
      this.showCreateAdminStatus("Email and role are required.", "error");
      return;
    }

    try {
      if (this.btnCreateAdmin) {
        this.btnCreateAdmin.disabled = true;
      }

      this.showCreateAdminStatus("Creating admin...", "loading");

      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, role })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (this.formCreateAdmin) {
        this.formCreateAdmin.reset();
      }

      this.showCreateAdminStatus(data.message || "Admin created successfully.", "success");
      window.setTimeout(() => this.loadUsers(), 1000);
    } catch (error) {
      console.error("[Admin] Failed to create admin:", error);
      this.showCreateAdminStatus(error.message || "Failed to create admin.", "error");
    } finally {
      if (this.btnCreateAdmin) {
        this.btnCreateAdmin.disabled = false;
      }
    }
  }

  showCreateAdminStatus(message, type = "error") {
    if (!this.createAdminStatusEl) {
      return;
    }

    this.createAdminStatusEl.textContent = message;
    this.createAdminStatusEl.className = `status-message status-${type}`;
    this.createAdminStatusEl.style.display = "block";

    if (type === "success") {
      window.setTimeout(() => {
        if (this.createAdminStatusEl) {
          this.createAdminStatusEl.style.display = "none";
        }
      }, 4000);
    }
  }

  async loadLogs() {
    this.showLogsState("loading");

    try {
      const { getIdToken } = await import("./firebase-email-auth.js");
      const token = await getIdToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      const params = new URLSearchParams();
      params.set("pageNumber", String(this.currentLogsPage));
      params.set("pageSize", "25");

      if (this.currentLogsFilters.eventType) {
        params.set("eventType", this.currentLogsFilters.eventType);
      }

      if (this.currentLogsFilters.email) {
        params.set("email", this.currentLogsFilters.email);
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (this.logsFilterEl) {
        this.logsFilterEl.style.display = "flex";
      }

      if (!Array.isArray(data.logs) || data.logs.length === 0) {
        this.showLogsState("empty");
        this.renderLogsPagination(null);
        return;
      }

      this.renderLogs(data.logs);
      this.renderLogsPagination(data.pagination || null);
      this.showLogsState("list");
    } catch (error) {
      console.error("[Admin] Failed to load logs:", error);
      this.renderLogsPagination(null);
      this.showLogsState("error", error.message || "Failed to load logs.");
    }
  }

  showLogsState(state, errorMessage = "") {
    if (this.logsLoadingEl) this.logsLoadingEl.style.display = "none";
    if (this.logsErrorEl) this.logsErrorEl.style.display = "none";
    if (this.logsEmptyEl) this.logsEmptyEl.style.display = "none";
    if (this.logsListContainerEl) this.logsListContainerEl.style.display = "none";

    if (state === "loading" && this.logsLoadingEl) {
      this.logsLoadingEl.style.display = "block";
    }

    if (state === "error" && this.logsErrorEl) {
      if (this.logsErrorMessageEl) {
        this.logsErrorMessageEl.textContent = errorMessage;
      }
      this.logsErrorEl.style.display = "block";
    }

    if (state === "empty" && this.logsEmptyEl) {
      this.logsEmptyEl.style.display = "block";
    }

    if (state === "list" && this.logsListContainerEl) {
      this.logsListContainerEl.style.display = "block";
    }
  }

  renderLogs(logs) {
    if (!this.auditLogsListEl) {
      return;
    }

    const rows = logs.map((log) => `
      <div class="log-row">
        <div class="log-timestamp">${this.formatDate(log.timestamp)}</div>
        <div class="log-event">
          <span class="event-badge ${this.getEventBadgeClass(log.eventType)}">${this.getEventTypeLabel(log.eventType)}</span>
        </div>
        <div class="log-actor">${this.escapeHtml(log.email || "Unknown")}</div>
        <div class="log-target">${this.escapeHtml(log.targetEmail || "None")}</div>
        <div class="log-ip">${this.escapeHtml(log.ipAddress || "unknown")}</div>
      </div>
    `);

    this.auditLogsListEl.innerHTML = rows.join("");
  }

  renderLogsPagination(pagination) {
    if (!this.logsPaginationEl) {
      return;
    }

    if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
      this.logsPaginationEl.innerHTML = "";
      return;
    }

    const pageNumber = Number(pagination.pageNumber || 1);
    const totalPages = Number(pagination.totalPages || 1);
    const totalCount = Number(pagination.totalCount || 0);
    const buttons = [];

    if (pageNumber > 1) {
      buttons.push(`<button class="btn-small" type="button" data-page="${pageNumber - 1}">Previous</button>`);
    }

    if (pageNumber < totalPages) {
      buttons.push(`<button class="btn-small" type="button" data-page="${pageNumber + 1}">Next</button>`);
    }

    this.logsPaginationEl.innerHTML = `
      <div class="pagination">
        <p>Page ${pageNumber} of ${totalPages} (${totalCount} total)</p>
        <div class="pagination-buttons">${buttons.join("")}</div>
      </div>
    `;

    this.logsPaginationEl.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPage = Number.parseInt(button.dataset.page || "", 10);
        if (Number.isFinite(nextPage)) {
          this.goToLogsPage(nextPage);
        }
      });
    });
  }

  goToLogsPage(pageNumber) {
    this.currentLogsPage = pageNumber;
    this.loadLogs();
  }

  getEventTypeLabel(eventType) {
    const labels = {
      "admin.auth.success": "Auth Success",
      "admin.auth.success.degraded": "Auth Success",
      "admin.auth.denied": "Auth Denied",
      "admin.auth.error": "Auth Error",
      "admin.user.created": "User Created",
      "admin.user.creation.rollback.failed": "Rollback Failed",
      "admin.user.create.denied": "Create Denied",
      "admin.user.bootstrap.created": "Bootstrap Created",
      "admin.user.bootstrap.updated": "Bootstrap Updated"
    };

    return labels[eventType] || eventType || "Unknown";
  }

  getEventBadgeClass(eventType) {
    const value = String(eventType || "");

    if (value.includes("denied") || value.includes("error")) {
      return "event-error";
    }

    if (value.includes("rollback") || value.includes("degraded")) {
      return "event-warning";
    }

    if (value.includes("created") || value.includes("bootstrap") || value.includes("updated")) {
      return "event-info";
    }

    return "event-success";
  }

  escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }

  formatDate(value) {
    if (!value) {
      return "Unknown";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  handleLogout() {
    import("./firebase-email-auth.js").then((module) => {
      module.logout();
    });
  }
}

let adminUI = null;

function bootstrapAdminUI() {
  adminUI = new CMSAdmin();
  window.adminUI = adminUI;

  import("./firebase-email-auth.js").then((module) => {
    module.registerUIManager(adminUI);
    module.syncAdminAuthState();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapAdminUI);
} else {
  bootstrapAdminUI();
}
