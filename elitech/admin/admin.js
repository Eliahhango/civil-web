;(function () {
  "use strict";

  var STORAGE_KEY = "elitech.cms.content";
  var BACKEND_CONFIG_URL = "/elitech/cms/backend.json";
  var CMS_API_PATH = "/api/cms/content";
  var STATIC_CMS_URL = "/elitech/cms/content.json";

  var state = null;
  var dashboardInitialized = false;
  var apiBaseUrl = null;
  var statusTimer = null;

  function logActivity(action, message) {
    if (!state) return;
    if (!state.sysLogs) state.sysLogs = [];
    var now = new Date();
    var formattedDate = now.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    state.sysLogs.unshift({
      date: formattedDate,
      action: action,
      message: message
    });
    if (state.sysLogs.length > 50) {
      state.sysLogs = state.sysLogs.slice(0, 50);
    }
    renderLogs();
    renderDashboardLogs();
  }

  var ALLOWED_RULE_ACTIONS = {
    "text": true,
    "addClass": true,
    "remove": true,
    "attr:href": true,
    "attr:src": true,
    "attr:alt": true,
    "attr:title": true,
    "style:color": true,
    "style:background-color": true,
    "style:font-weight": true,
    "style:text-decoration": true,
    "style:opacity": true
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

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

  function loadBackendConfig() {
    if (apiBaseUrl !== null) {
      return Promise.resolve(apiBaseUrl);
    }

    return fetch(BACKEND_CONFIG_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) {
          apiBaseUrl = "";
          return apiBaseUrl;
        }

        return response.json().then(function (payload) {
          apiBaseUrl = trimTrailingSlash(payload && payload.apiBaseUrl || "");
          return apiBaseUrl;
        });
      })
      .catch(function () {
        apiBaseUrl = "";
        return apiBaseUrl;
      });
  }

  function setStatus(message, error) {
    ["status", "login-status"].forEach(function (id) {
      var node = $(id);
      if (!node) {
        return;
      }
      node.textContent = message;
      if (!node.classList.contains('hidden')) {
          node.style.color = error ? "#ff8c95" : "#94a9bf";
          node.classList.remove("status-success", "status-error", "status-pulse");
          node.classList.add(error ? "status-error" : "status-success", "status-pulse");
      }
    });

    var toastContainer = $("toast-container");
    if (toastContainer && message && message !== "Ready." && message !== "Please sign in with Firebase to access the dashboard.") {
      var toast = document.createElement("div");
      toast.className = "admin-toast" + (error ? " error-toast" : "");
      
      var icon = document.createElement("i");
      icon.className = error ? "fas fa-exclamation-circle" : "fas fa-check-circle";
      
      var text = document.createElement("span");
      text.textContent = message;

      toast.appendChild(icon);
      toast.appendChild(text);
      toastContainer.appendChild(toast);

      setTimeout(function() {
        toast.style.animation = "toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        setTimeout(function() {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, 4000);
    }

    if (statusTimer) {
      clearTimeout(statusTimer);
    }

    statusTimer = setTimeout(function () {
      ["status", "login-status"].forEach(function (id) {
        var node = $(id);
        if (node) {
          node.classList.remove("status-pulse");
        }
      });
    }, 360);
  }

  function setAuthState(authenticated, email) {
    ["auth-state", "login-auth-state"].forEach(function (id) {
      var stateNode = $(id);
      if (!stateNode) {
        return;
      }

      stateNode.textContent = authenticated
        ? "Signed in as " + (email || "Admin user")
        : "Not authenticated";
      stateNode.style.color = authenticated ? "#7ce9b8" : "#94a9bf";
    });
  }

  function hideAdminPreloader() {
    var preloader = document.querySelector(".theme-preloader");
    if (!preloader) {
      document.body.classList.remove("admin-loading");
      return;
    }

    preloader.style.transition = "opacity 420ms ease";
    preloader.style.opacity = "0";
    document.body.classList.remove("admin-loading");

    setTimeout(function () {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 460);
  }

  function showLoginView() {
    var loginView = $("login-view");
    var dashboardView = $("dashboard-view");

    if (loginView) {
      loginView.setAttribute("aria-hidden", "false");
      loginView.classList.remove("hidden");
      requestAnimationFrame(function () {
        loginView.classList.add("is-active");
      });
    }

    if (dashboardView) {
      dashboardView.setAttribute("aria-hidden", "true");
      dashboardView.classList.remove("is-active");
      setTimeout(function () {
        dashboardView.classList.add("hidden");
      }, 170);
    }
  }

  function showDashboardView() {
    var loginView = $("login-view");
    var dashboardView = $("dashboard-view");

    if (dashboardView) {
      dashboardView.setAttribute("aria-hidden", "false");
      dashboardView.classList.remove("hidden");
      requestAnimationFrame(function () {
        dashboardView.classList.add("is-active");
      });
    }

    if (loginView) {
      loginView.setAttribute("aria-hidden", "true");
      loginView.classList.remove("is-active");
      setTimeout(function () {
        loginView.classList.add("hidden");
      }, 170);
    }
  }

  function parseResponseJson(res) {
    return res.json().catch(function () {
      return {};
    });
  }

  function toSafeString(value, maxLen) {
    if (typeof value !== "string") {
      return "";
    }
    return value.slice(0, maxLen);
  }

  function normalizePath(path) {
    var p = String(path || "").trim();
    if (!p) {
      return "";
    }
    if (!p.startsWith("/")) {
      p = "/" + p;
    }
    if (!p.endsWith("/") && !p.endsWith("*")) {
      p += "/";
    }
    return p;
  }

  function normalizeImportedState(raw) {
    var value = raw && typeof raw === "object" ? raw : {};

    var next = {
      site: {},
      seo: {},
      globalReplacements: [],
      rules: [],
      media: [],
      blogs: [],
      projects: [],
      services: [],
      sysLogs: Array.isArray(value.sysLogs) ? value.sysLogs.slice(0, 100) : []
    };

    if (value.site && typeof value.site === "object" && !Array.isArray(value.site)) {
      Object.keys(value.site).forEach(function (key) {
        if (key && key.length <= 80) {
          next.site[key] = toSafeString(value.site[key], 2048);
        }
      });
    }

    if (value.seo && typeof value.seo === "object" && !Array.isArray(value.seo)) {
      Object.keys(value.seo).forEach(function (key) {
        if (key && key.length <= 80) {
          next.seo[key] = toSafeString(value.seo[key], 2048);
        }
      });
    }

    if (Array.isArray(value.globalReplacements)) {
      next.globalReplacements = value.globalReplacements.slice(0, 300).map(function (item) {
        return {
          from: toSafeString(item && item.from, 400),
          to: toSafeString(item && item.to, 2048),
          wholeWord: Boolean(item && item.wholeWord),
          caseSensitive: Boolean(item && item.caseSensitive)
        };
      }).filter(function (item) {
        return item.from;
      });
    }

    if (Array.isArray(value.rules)) {
      next.rules = value.rules.slice(0, 300).map(function (item) {
        var action = toSafeString(item && item.action, 64);
        var rawPaths = Array.isArray(item && item.paths) ? item.paths : [];
        var paths = rawPaths.map(function (p) {
          return normalizePath(toSafeString(p, 240));
        }).filter(Boolean).slice(0, 20);

        return {
          paths: paths.length ? paths : ["/elitech/*"],
          selector: toSafeString(item && item.selector, 256),
          action: ALLOWED_RULE_ACTIONS[action] ? action : "text",
          value: toSafeString(item && item.value, 2048)
        };
      }).filter(function (item) {
        return item.selector;
      });
    }

    var parseCollection = function(arr) {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, 300).map(function(item) {
        return {
          title: toSafeString(item && item.title, 256),
          category: toSafeString(item && item.category, 128),
          image: toSafeString(item && item.image, 1024),
          url: toSafeString(item && item.url, 1024),
          excerpt: toSafeString(item && item.excerpt, 2048),
          date: toSafeString(item && item.date, 64)
        };
      }).filter(function(item) { return item.title; });
    };

    var parseMedia = function(arr) {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, 500).map(function(item) {
        return {
          id: toSafeString(item && item.id, 64),
          url: toSafeString(item && item.url, 1024),
          name: toSafeString(item && item.name, 256),
          size: toSafeString(item && item.size, 64),
          date: toSafeString(item && item.date, 64)
        };
      }).filter(function(item) { return item.url; });
    };

    next.media = parseMedia(value.media);
    next.blogs = parseCollection(value.blogs);
    next.projects = parseCollection(value.projects);
    next.services = parseCollection(value.services);

    return next;
  }

  function renderTabs() {
    var buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        var tab = btn.getAttribute("data-tab");
        document.querySelectorAll(".tab-panel").forEach(function (panel) {
          panel.classList.remove("active");
        });

        var target = $("tab-" + tab);
        if (target) {
          target.classList.add("active");
        }
        
        // Don't override title if it's the dashboard with icons
        var titleText = btn.textContent.trim();
        $("tab-title").textContent = titleText;
      });
    });
  }

  function renderDashboardLogs() {
    var timeline = document.querySelector(".activity-timeline");
    if (!timeline) return;
    timeline.replaceChildren();

    var recentLogs = (state.sysLogs || []).slice(0, 5);
    if (recentLogs.length === 0) {
      timeline.innerHTML = '<p class="hint">No recent activity.</p>';
      return;
    }

    recentLogs.forEach(function(log) {
      var item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = '<div class="activity-dot"></div><div class="activity-content"><p><strong>' + toSafeString(log.action, 50) + '</strong> ' + toSafeString(log.message, 200) + '</p><span>' + toSafeString(log.date, 50) + '</span></div>';
      timeline.appendChild(item);
    });
  }

  function renderLogs() {
    var tbody = document.getElementById("logs-tbody");
    if (!tbody) return;
    tbody.replaceChildren();
    
    var logs = state.sysLogs || [];
    if (logs.length === 0) {
      tbody.innerHTML = '<div class="audit-line empty"><span class="audit-time">--:--</span><span class="audit-msg">No system logs recorded in the current session.</span></div>';
      return;
    }

    logs.forEach(function(log) {
      var lineEl = document.createElement("div");
      lineEl.className = "audit-line";
      
      var timeEl = document.createElement("span");
      timeEl.className = "audit-time";
      timeEl.textContent = "[" + log.date + "]";
      
      var actionEl = document.createElement("span");
      actionEl.className = "audit-action";
      actionEl.textContent = log.action.toUpperCase();
      
      var msgEl = document.createElement("span");
      msgEl.className = "audit-msg";
      msgEl.textContent = log.message;

      lineEl.appendChild(timeEl);
      lineEl.appendChild(actionEl);
      lineEl.appendChild(msgEl);
      tbody.appendChild(lineEl);
    });
  }

  function renderDashboard() {
    if ($("kpi-projects-count") && state.projects) {
      $("kpi-projects-count").textContent = state.projects.length;
    }
    if ($("kpi-blogs-count") && state.blogs) {
      $("kpi-blogs-count").textContent = state.blogs.length;
    }
    if ($("kpi-media-count") && state.media) {
      $("kpi-media-count").textContent = state.media.length;
    }
    if ($("kpi-rules-count")) {
      var activeRules = (state.rules || []).length + (state.globalReplacements || []).length;
      $("kpi-rules-count").textContent = activeRules;
    }
    
    if ($("kpi-seo-warnings-badge")) {
      var warnings = 0;
      if (!state.seo.title || state.seo.title.length > 60) warnings++;
      if (!state.seo.description || state.seo.description.length > 160) warnings++;
      $("kpi-seo-warnings-badge").textContent = warnings + (warnings === 1 ? " Warning" : " Warnings");
      $("kpi-seo-warnings-badge").className = "badge " + (warnings > 0 ? "warn" : "ok");
      
      if ($("kpi-seo-bar")) {
        $("kpi-seo-bar").style.width = (warnings > 0 ? (warnings * 20) : 100) + "%";
        $("kpi-seo-bar").className = "fill " + (warnings > 0 ? "warn" : "ok");
      }
    }
    
    if ($("kpi-payload-size")) {
      var sizeBytes = new Blob([JSON.stringify(state)]).size;
      var sizeKB = (sizeBytes / 1024).toFixed(1);
      $("kpi-payload-size").textContent = sizeKB + " KB";
      
      if ($("kpi-payload-bar")) {
        var percentage = Math.min((sizeBytes / (500 * 1024)) * 100, 100); 
        $("kpi-payload-bar").style.width = Math.max(percentage, 2) + "%";
      }
    }
  }

  function renderBasics() {
    $("site-name").value = state.site && state.site.name || "";
    $("site-tagline").value = state.site && state.site.tagline || "";
    $("site-logo").value = state.site && state.site.logo || "";
    $("site-phone").value = state.site && state.site.phone || "";
    $("site-email").value = state.site && state.site.email || "";
    $("site-address").value = state.site && state.site.address || "";
    $("site-social-linkedin").value = state.site && state.site.socialLinkedin || "";
    $("site-social-twitter").value = state.site && state.site.socialTwitter || "";
    $("site-social-facebook").value = state.site && state.site.socialFacebook || "";

    $("seo-title").value = state.seo && state.seo.title || "";
    $("seo-description").value = state.seo && state.seo.description || "";
    $("seo-image").value = state.seo && state.seo.image || "";
    $("seo-url").value = state.seo && state.seo.url || "";
    $("seo-twitter-card").value = state.seo && state.seo.twitterCard || "summary_large_image";
    updateSEOPreviews();
  }

  function updateSEOPreviews() {
    var title = $("seo-title") ? $("seo-title").value.trim() : "";
    var desc = $("seo-description") ? $("seo-description").value.trim() : "";
    var url = $("seo-url") ? $("seo-url").value.trim() : "";
    var img = $("seo-image") ? $("seo-image").value.trim() : "";

    var baseDomain = "elitechwiz.com";
    if (url) {
      try { baseDomain = new URL(url).hostname; } catch(e) {}
    }

    if ($("gp-title")) $("gp-title").textContent = title || "EliTechWiz | Civil Engineering";
    if ($("gp-desc")) $("gp-desc").textContent = desc || "Providing structural scaling and premium industrial planning...";
    if ($("gp-url")) $("gp-url").textContent = url || baseDomain;

    if ($("sp-title")) $("sp-title").textContent = title || "EliTechWiz | Civil Engineering";
    if ($("sp-desc")) $("sp-desc").textContent = desc || "Providing structural scaling and premium industrial planning...";
    if ($("sp-domain")) $("sp-domain").textContent = baseDomain;

    if ($("sp-image-el")) {
      var imgEl = $("sp-image-el");
      var plcEl = $("sp-placeholder");
      if (img) {
        imgEl.src = img;
        imgEl.style.display = "block";
        if (plcEl) plcEl.style.display = "none";
      } else {
        imgEl.src = "";
        imgEl.style.display = "none";
        if (plcEl) plcEl.style.display = "flex";
      }
    }

    var titleCount = title.length;
    if ($("seo-title-count")) {
      $("seo-title-count").textContent = titleCount + " / 60";
      $("seo-title-count").className = "char-counter " + (titleCount > 60 ? "error" : (titleCount > 50 ? "warn" : "success"));
      if (titleCount === 0) $("seo-title-count").className = "char-counter default";
    }

    var descCount = desc.length;
    if ($("seo-desc-count")) {
      $("seo-desc-count").textContent = descCount + " / 160";
      $("seo-desc-count").className = "char-counter " + (descCount > 160 ? "error" : (descCount > 140 ? "warn" : "success"));
      if (descCount === 0) $("seo-desc-count").className = "char-counter default";
    }
  }

  function readBasics() {
    state.site = state.site || {};
    state.seo = state.seo || {};

    state.site.name = $("site-name").value.trim();
    state.site.tagline = $("site-tagline").value.trim();
    state.site.logo = $("site-logo").value.trim();
    state.site.phone = $("site-phone").value.trim();
    state.site.email = $("site-email").value.trim();
    state.site.address = $("site-address").value.trim();
    state.site.socialLinkedin = $("site-social-linkedin").value.trim();
    state.site.socialTwitter = $("site-social-twitter").value.trim();
    state.site.socialFacebook = $("site-social-facebook").value.trim();

    state.seo.title = $("seo-title").value.trim();
    state.seo.description = $("seo-description").value.trim();
    state.seo.image = $("seo-image").value.trim();
    state.seo.url = $("seo-url").value.trim();
    state.seo.twitterCard = $("seo-twitter-card").value;
  }

  function createLabelWithInput(labelText, kind, value, placeholder) {
    var label = document.createElement("label");
    label.appendChild(document.createTextNode(labelText));

    var input = document.createElement("input");
    input.setAttribute("data-kind", kind);
    input.value = toSafeString(value || "", 2048);
    if (placeholder) {
      input.placeholder = placeholder;
    }

    label.appendChild(input);
    return label;
  }

  function createLabelWithBooleanSelect(labelText, kind, boolValue) {
    var label = document.createElement("label");
    label.appendChild(document.createTextNode(labelText));

    var select = document.createElement("select");
    select.setAttribute("data-kind", kind);

    var noOpt = document.createElement("option");
    noOpt.value = "false";
    noOpt.textContent = "No";
    select.appendChild(noOpt);

    var yesOpt = document.createElement("option");
    yesOpt.value = "true";
    yesOpt.textContent = "Yes";
    select.appendChild(yesOpt);

    select.value = String(Boolean(boolValue));
    label.appendChild(select);
    return label;
  }

  function createLabelWithActionSelect(actionValue) {
    var label = document.createElement("label");
    label.appendChild(document.createTextNode("Action"));

    var select = document.createElement("select");
    select.setAttribute("data-kind", "action");

    [
      "text",
      "attr:href",
      "attr:src",
      "attr:alt",
      "attr:title",
      "style:color",
      "style:background-color",
      "style:font-weight",
      "style:text-decoration",
      "style:opacity",
      "addClass",
      "remove"
    ].forEach(function (action) {
      var option = document.createElement("option");
      option.value = action;
      option.textContent = action;
      select.appendChild(option);
    });

    select.value = ALLOWED_RULE_ACTIONS[actionValue] ? actionValue : "text";
    label.appendChild(select);
    return label;
  }

  function createRemoveButton(index, type) {
    var removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.type = "button";
    removeBtn.setAttribute("data-index", String(index));
    removeBtn.setAttribute("data-type", type);
    removeBtn.textContent = "Remove";
    return removeBtn;
  }

  function replacementRow(item, index) {
    var wrapper = document.createElement("div");
    wrapper.className = "engine-node replacement-node";

    var mainRow = document.createElement("div");
    mainRow.className = "node-main";
    mainRow.appendChild(createLabelWithInput("Find String", "find", item.from));
    
    var arrow = document.createElement("div");
    arrow.className = "node-arrow";
    arrow.innerHTML = "<i class='fas fa-arrow-right'></i>";
    mainRow.appendChild(arrow);
    
    mainRow.appendChild(createLabelWithInput("Replace With", "replace", item.to));

    var footRow = document.createElement("div");
    footRow.className = "node-foot";
    footRow.appendChild(createLabelWithBooleanSelect("Whole Word", "whole", item.wholeWord));
    footRow.appendChild(createLabelWithBooleanSelect("Case Sensitive", "case", item.caseSensitive));

    var rmv = createRemoveButton(index, "replacement");
    rmv.className = "btn-default btn-outline btn-sm remove-btn node-rmv";
    rmv.innerHTML = "<i class='fas fa-trash'></i> Remove";
    footRow.appendChild(rmv);

    wrapper.appendChild(mainRow);
    wrapper.appendChild(footRow);

    return wrapper;
  }

  function ruleRow(item, index) {
    var wrapper = document.createElement("div");
    wrapper.className = "engine-node rule-node";
    var joinedPaths = Array.isArray(item.paths) ? item.paths.join(", ") : "";

    var mainRow = document.createElement("div");
    mainRow.className = "node-main-rules";
    mainRow.appendChild(createLabelWithInput("Target Routes", "paths", joinedPaths, "/elitech/*, /elitech/home-version-2/"));
    mainRow.appendChild(createLabelWithInput("CSS Selector", "selector", item.selector || "", ".class-name h1"));
    mainRow.appendChild(createLabelWithActionSelect(item.action || "text"));
    mainRow.appendChild(createLabelWithInput("New Value", "value", item.value || ""));

    var footRow = document.createElement("div");
    footRow.className = "node-foot";
    var info = document.createElement("span");
    info.className = "node-hint";
    info.textContent = "Specify the DOM target and paths to apply this rule dynamically.";
    footRow.appendChild(info);

    var rmv = createRemoveButton(index, "rule");
    rmv.className = "btn-default btn-outline btn-sm remove-btn node-rmv";
    rmv.innerHTML = "<i class='fas fa-trash'></i> Remove Rule";
    footRow.appendChild(rmv);

    wrapper.appendChild(mainRow);
    wrapper.appendChild(footRow);

    return wrapper;
  }

  function collectionCard(item, index, type) {
    var card = document.createElement("div");
    card.className = "collection-card " + type; 

    var imgWrap = document.createElement("div");
    imgWrap.className = "collection-card-img";
    if (item.image) {
      imgWrap.innerHTML = "<img src='" + toSafeString(item.image) + "' alt=''><span class='card-badge'>" + (item.category || "Uncategorized") + "</span>";
    } else {
      imgWrap.innerHTML = "<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e5e7eb;color:#9ca3af;'><i class='fas fa-image' style='font-size:2rem;'></i></div><span class='card-badge'>" + (item.category || "Uncategorized") + "</span>";
    }

    var bodyWrap = document.createElement("div");
    bodyWrap.className = "collection-card-body";

    var titleEl = document.createElement("h4");
    titleEl.className = "collection-card-title";
    titleEl.textContent = item.title || "(Untitled)";

    var excerptEl = document.createElement("p");
    excerptEl.className = "collection-card-excerpt";
    excerptEl.textContent = item.excerpt || "No excerpt provided.";

    var metaWrap = document.createElement("div");
    metaWrap.className = "collection-card-meta";
    metaWrap.innerHTML = "<span><i class='far fa-calendar-alt'></i> " + (item.date || "-") + "</span>";

    bodyWrap.appendChild(titleEl);
    bodyWrap.appendChild(excerptEl);
    bodyWrap.appendChild(metaWrap);

    var actionsWrap = document.createElement("div");
    actionsWrap.className = "collection-card-actions";

    var editBtn = document.createElement("button");
    editBtn.innerHTML = "<i class='fas fa-edit'></i> Edit";
    editBtn.type = "button";
    editBtn.addEventListener("click", function() {
      openEditorModal(type, index);
    });

    var removeBtn = createRemoveButton(index, type);
    removeBtn.innerHTML = "<i class='fas fa-trash-alt'></i> Delete";
    removeBtn.className = "remove-btn btn-danger-action";

    actionsWrap.appendChild(editBtn);
    actionsWrap.appendChild(removeBtn);

    // Hidden inputs
    var hiddenDiv = document.createElement("div");
    hiddenDiv.style.display = "none";

    function addHidden(kind, val) {
       var inp = document.createElement("input");
       inp.setAttribute("data-kind", kind);
       inp.value = val || "";
       hiddenDiv.appendChild(inp);
    }
    addHidden("title", item.title);
    addHidden("category", item.category);
    addHidden("image", item.image);
    addHidden("url", item.url);
    addHidden("date", item.date);

    var txt = document.createElement("textarea");
    txt.setAttribute("data-kind", "excerpt");
    txt.value = item.excerpt || "";
    hiddenDiv.appendChild(txt);

    card.appendChild(imgWrap);
    card.appendChild(bodyWrap);
    card.appendChild(actionsWrap);
    card.appendChild(hiddenDiv);
    return card;
  }

  var currentModalType = null;
  var currentModalIndex = -1;

  function openEditorModal(type, index) {
    readFormIntoState(); // ensure we don't lose pending changes elsewhere
    currentModalType = type;
    currentModalIndex = index;
    var item = state[type + "s"][index];

    $("editor-modal-title").textContent = "Edit " + type.charAt(0).toUpperCase() + type.slice(1);
    $("modal-title-input").value = item.title || "";
    $("modal-category-input").value = item.category || "";
    $("modal-image-input").value = item.image || "";
    $("modal-url-input").value = item.url || "";
    $("modal-date-input").value = item.date || "";
    $("modal-excerpt-input").value = item.excerpt || "";

    $("editor-modal").classList.add("active");
  }

  function closeEditorModal() {
    $("editor-modal").classList.remove("active");
    currentModalType = null;
    currentModalIndex = -1;
  }

  function saveEditorModal() {
    if (!currentModalType || currentModalIndex < 0) return;
    
    var item = state[currentModalType + "s"][currentModalIndex];
    var oldTitle = item.title;
    item.title = $("modal-title-input").value.trim();
    item.category = $("modal-category-input").value.trim();
    item.image = $("modal-image-input").value.trim();
    item.url = $("modal-url-input").value.trim();
    item.date = $("modal-date-input").value.trim();
    item.excerpt = $("modal-excerpt-input").value.trim();

    logActivity("Edit " + currentModalType, "Modified '" + (item.title || "Untitled") + "'");

    renderCollection(currentModalType);
    syncRawJson();
    closeEditorModal();
    setStatus("Changes applied temporarily. Save to Server to publish.", false);
  }

  function renderReplacements() {
    var list = $("replacements-list");
    list.replaceChildren();

    (state.globalReplacements || []).forEach(function (item, index) {
      list.appendChild(replacementRow(item, index));
    });
  }

  function renderRules() {
    var list = $("rules-list");
    list.replaceChildren();

    (state.rules || []).forEach(function (item, index) {
      list.appendChild(ruleRow(item, index));
    });
  }

  function renderCollection(type) {
    var listName = type + "s-list";
    var stateName = type + "s";
    var list = $(listName);
    if (!list) return;
    list.replaceChildren();

    var grid = document.createElement("div");
    grid.className = "collection-grid";

    (state[stateName] || []).forEach(function (item, index) {
      grid.appendChild(collectionCard(item, index, type));
    });

    list.appendChild(grid);
  }

  function renderMedia(searchQuery) {
    var grid = $("media-grid");
    if (!grid) return;
    grid.replaceChildren();

    var mediaList = state.media || [];
    if (searchQuery) {
      var lowerQuery = searchQuery.toLowerCase();
      mediaList = mediaList.filter(function(m) {
        return (m.name || "").toLowerCase().indexOf(lowerQuery) !== -1 || 
               (m.url || "").toLowerCase().indexOf(lowerQuery) !== -1;
      });
    }

    if (mediaList.length === 0) {
      grid.innerHTML = '<div class="media-empty"><i class="fas fa-folder-open" style="font-size:3rem; margin-bottom:14px; opacity:0.3;"></i><p>No media files found.</p></div>';
      return;
    }

    mediaList.forEach(function (item, index) {
      var card = document.createElement("div");
      card.className = "media-card";

      var isImage = item.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;

      var preview = document.createElement("div");
      preview.className = "media-preview";
      if (isImage) {
        preview.innerHTML = '<img src="' + toSafeString(item.url, 1024) + '" alt="' + toSafeString(item.name, 100) + '">';
      } else {
        preview.innerHTML = '<i class="fas fa-file-alt"></i>';
      }

      var info = document.createElement("div");
      info.className = "media-info";
      
      var title = document.createElement("div");
      title.className = "media-title";
      title.textContent = item.name || "Untitled";

      var meta = document.createElement("div");
      meta.className = "media-meta";
      meta.textContent = (item.date || "") + (item.size ? " · " + item.size : "");

      var actions = document.createElement("div");
      actions.className = "media-actions";

      var copyBtn = document.createElement("button");
      copyBtn.className = "btn-default btn-outline btn-sm";
      copyBtn.textContent = "Copy URL";
      copyBtn.style.flex = "1";
      copyBtn.type = "button";
      copyBtn.onclick = function() {
        navigator.clipboard.writeText(item.url).then(function() {
          setStatus("Copied to clipboard.", false);
        });
      };

      var delBtn = document.createElement("button");
      delBtn.className = "btn-default btn-outline btn-sm remove-btn";
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.type = "button";
      delBtn.onclick = function() {
        if (confirm("Remove this media item from references?")) {
          // Find actual index in state.media to remove
          var originalIndex = state.media.findIndex(function(m) { return m.id === item.id; });
          if(originalIndex > -1) {
            state.media.splice(originalIndex, 1);
            renderMedia($("media-search") ? $("media-search").value : "");
            syncRawJson();
            logActivity("Delete Media", "Removed media file: " + item.name);
          }
        }
      };

      actions.appendChild(copyBtn);
      actions.appendChild(delBtn);

      info.appendChild(title);
      info.appendChild(meta);
      info.appendChild(actions);

      card.appendChild(preview);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }

  function readReplacements() {
    var rows = document.querySelectorAll("#replacements-list .replacement-node");
    state.globalReplacements = Array.from(rows).map(function (row) {
      return {
        from: row.querySelector('[data-kind="find"]').value,
        to: row.querySelector('[data-kind="replace"]').value,
        wholeWord: row.querySelector('[data-kind="whole"]').value === "true",
        caseSensitive: row.querySelector('[data-kind="case"]').value === "true"
      };
    }).filter(function (item) { return item.from; });
  }

  function readRules() {
    var rows = document.querySelectorAll("#rules-list .rule-node");
    state.rules = Array.from(rows).map(function (row) {
      var rawPaths = row.querySelector('[data-kind="paths"]').value;
      var paths = rawPaths.split(",").map(function (p) {
        return normalizePath(p.trim());
      }).filter(Boolean);

      var action = row.querySelector('[data-kind="action"]').value;
      if (!ALLOWED_RULE_ACTIONS[action]) {
        action = "text";
      }

      return {
        paths: paths,
        selector: row.querySelector('[data-kind="selector"]').value.trim(),
        action: action,
        value: row.querySelector('[data-kind="value"]').value
      };
    }).filter(function (item) {
      return item.selector && item.action;
    });
  }

  function readCollection(type) {
    var rows = document.querySelectorAll("#" + type + "s-list .collection-card." + type);
    state[type + "s"] = Array.from(rows).map(function (row) {
      return {
        title: row.querySelector('[data-kind="title"]').value.trim(),
        category: row.querySelector('[data-kind="category"]').value.trim(),
        image: row.querySelector('[data-kind="image"]').value.trim(),
        url: row.querySelector('[data-kind="url"]').value.trim(),
        date: row.querySelector('[data-kind="date"]').value.trim(),
        excerpt: row.querySelector('[data-kind="excerpt"]').value.trim()
      };
    }).filter(function (item) {
      return item.title;
    });
  }

  function readFormIntoState() {
    readBasics();
    readReplacements();
    readRules();
    readCollection("blog");
    readCollection("project");
    readCollection("service");
  }

  function syncRawJson() {
    $("raw-json").value = JSON.stringify(state, null, 2);
  }

  function applyLocal() {
    readFormIntoState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncRawJson();
    logActivity("Apply Preview", "Applied local preview to state.");
    setStatus("Preview applied locally. Open the website in this browser to see updates.", false);
  }

  function resetLocal() {
    logActivity("Reset", "Cleared local un-saved state.");
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function saveToServer() {
    readFormIntoState();
    syncRawJson();
    logActivity("Save", "Attempting backend save...");

    Promise.resolve().then(function () {
      if (!window.CMSFirebaseAuth || typeof window.CMSFirebaseAuth.getIdToken !== "function") {
        throw new Error("Firebase auth is not ready.");
      }
      return window.CMSFirebaseAuth.getIdToken();
    }).then(function (idToken) {
      if (!idToken) {
        throw new Error("Sign in with Firebase before saving.");
      }

      return loadBackendConfig().then(function () {
        return fetch(resolveApiUrl(CMS_API_PATH), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + idToken
          },
          body: JSON.stringify(state)
        });
      });
    }).then(function (res) {
      return parseResponseJson(res).then(function (payload) {
        if (!res.ok) {
          throw new Error(payload.error || "Failed to save on server");
        }
        localStorage.removeItem(STORAGE_KEY);
        logActivity("Deploy Success", "Saved live updates to backend database.");
        setStatus("Saved to backend successfully. Live site will use latest content.", false);
      });
    }).catch(function (error) {
      logActivity("Deploy Error", error.message || "Could not save to server.");
      setStatus(error.message || "Could not save to server.", true);
    });
  }

  function bindActions() {
    $("btn-apply").addEventListener("click", applyLocal);
    $("btn-reset").addEventListener("click", resetLocal);
    $("btn-save-server").addEventListener("click", saveToServer);
    
    // SEO Live preview bindings
    ["seo-title", "seo-description", "seo-image", "seo-url"].forEach(function(id) {
      if ($(id)) {
        $(id).addEventListener("input", updateSEOPreviews);
      }
    });

    $("btn-logout").addEventListener("click", function () {
      if (!window.CMSFirebaseAuth || typeof window.CMSFirebaseAuth.logout !== "function") {
        setStatus("Firebase auth is not ready.", true);
        return;
      }

      window.CMSFirebaseAuth.logout().catch(function (error) {
        setStatus(error.message || "Could not sign out.", true);
      });
    });

    if ($("editor-modal-close")) $("editor-modal-close").addEventListener("click", closeEditorModal);
    if ($("editor-modal-cancel")) $("editor-modal-cancel").addEventListener("click", closeEditorModal);
    if ($("editor-modal-save")) $("editor-modal-save").addEventListener("click", saveEditorModal);

    if ($("clear-logs")) $("clear-logs").addEventListener("click", function() {
      if (confirm("Are you sure you want to clear all activity logs?")) {
        state.sysLogs = [];
        renderLogs();
        renderDashboardLogs();
        syncRawJson();
        setStatus("Logs cleared.", false);
      }
    });

    $("add-replacement").addEventListener("click", function () {
      readFormIntoState();
      state.globalReplacements.push({ from: "", to: "", wholeWord: false, caseSensitive: false });
      renderReplacements();
      syncRawJson();
    });

    $("add-rule").addEventListener("click", function () {
      readFormIntoState();
      state.rules.push({ paths: ["/elitech/*"], selector: "", action: "text", value: "" });
      renderRules();
        renderMedia();
      syncRawJson();
    });

    var bindAddCollection = function(type) {
      var btn = $("add-" + type);
      if (!btn) return;
      btn.addEventListener("click", function () {
        readFormIntoState();
        var arr = state[type + "s"] || [];
        arr.push({ title: "New " + type, category: "", image: "", url: "", date: "", excerpt: "" });
        state[type + "s"] = arr;
        renderCollection(type);
        syncRawJson();
        logActivity("Create " + type, "Added an empty placeholder for a new " + type + ".");
        // Open it immediately to edit
        openEditorModal(type, arr.length - 1);
      });
    };

    bindAddCollection("blog");
    bindAddCollection("project");
    bindAddCollection("service");

    var mediaSearch = $("media-search");
    if (mediaSearch) {
      mediaSearch.addEventListener("input", function(e) {
        renderMedia(e.target.value);
      });
    }

    var btnUploadMedia = $("btn-upload-media");
    if (btnUploadMedia) {
      btnUploadMedia.addEventListener("click", function() {
        var dummyUrl = prompt("Enter media URL (e.g. /elitech/wp-content/uploads/...):");
        if (!dummyUrl) return;
        var dummyName = dummyUrl.split("/").pop() || "uploaded-file.jpg";
        
        state.media = state.media || [];
        state.media.unshift({
          id: Date.now().toString(),
          url: dummyUrl,
          name: dummyName,
          size: "Unknown Size",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        });
        renderMedia(mediaSearch ? mediaSearch.value : "");
        syncRawJson();
        logActivity("Upload Media", "Added new media asset: " + dummyName);
        setStatus("Media asset added successfully.", false);
      });
    }

    document.body.addEventListener("click", function (event) {
      var target = event.target;
      if (!target.classList.contains("remove-btn")) {
        return;
      }

      var index = Number(target.getAttribute("data-index"));
      var type = target.getAttribute("data-type");

      if (type === "replacement") {
        state.globalReplacements.splice(index, 1);
        renderReplacements();
        logActivity("Remove", "Deleted a global replacement rule.");
      } else if (type === "rule") {
        state.rules.splice(index, 1);
        renderRules();
        renderMedia();
        logActivity("Remove", "Deleted a custom formatting rule.");
      } else if (type === "blog" || type === "project" || type === "service") {
        var stateName = type + "s";
        if (state[stateName]) {
          var removed = state[stateName].splice(index, 1)[0];
          renderCollection(type);
          logActivity("Delete " + type, "Removed '" + (removed.title || "Untitled") + "'");
        }
      }

      syncRawJson();
    });

    $("btn-load-json").addEventListener("click", function () {
      try {
        state = normalizeImportedState(JSON.parse($("raw-json").value));
        renderBasics();
        renderReplacements();
        renderRules();
        renderMedia();
        renderCollection("blog");
        renderCollection("project");
        renderCollection("service");
        syncRawJson();
        setStatus("Raw JSON loaded into form.", false);
      } catch (_error) {
        setStatus("Invalid JSON. Fix syntax and try again.", true);
      }
    });

    $("btn-export").addEventListener("click", function () {
      readFormIntoState();
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "content.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("content.json downloaded.", false);
    });

    $("file-import").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }

      file.text().then(function (txt) {
        try {
          state = normalizeImportedState(JSON.parse(txt));
          renderBasics();
          renderReplacements();
          renderRules();
        renderMedia();
          renderCollection("blog");
          renderCollection("project");
          renderCollection("service");
          syncRawJson();
          setStatus("JSON imported.", false);
        } catch (_error) {
          setStatus("Imported file is not valid JSON.", true);
        }
      });
    });
  }

  function loadState() {
    return loadBackendConfig()
      .then(function () {
        return fetch(resolveApiUrl(CMS_API_PATH), { cache: "no-cache" });
      })
      .then(function (res) {
        if (res.ok) {
          return res.json();
        }
        return fetch(STATIC_CMS_URL, { cache: "no-cache" }).then(function (staticRes) {
          if (!staticRes.ok) {
            throw new Error("Failed to load CMS data");
          }
          return staticRes.json();
        });
      })
      .then(function (base) {
        var normalizedBase = normalizeImportedState(base || {});
        var local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            return normalizeImportedState(JSON.parse(local));
          } catch (_error) {
            return normalizedBase;
          }
        }
        return normalizedBase;
      });
  }

  function initializeDashboard() {
    if (dashboardInitialized) {
      return Promise.resolve();
    }

    renderTabs();
    bindActions();

    return loadState().then(function (data) {
      state = clone(normalizeImportedState(data));
      state.globalReplacements = state.globalReplacements || [];
      state.rules = state.rules || [];

      renderBasics();
      renderReplacements();
      renderRules();
        renderMedia();
      renderCollection("blog");
      renderCollection("project");
      renderCollection("service");
      renderDashboard();
      renderLogs();
      renderDashboardLogs();
      syncRawJson();
      dashboardInitialized = true;
      setStatus("Loaded configuration.", false);
      if (state.sysLogs && state.sysLogs.length === 0) {
        logActivity("System Init", "Admin dashboard initialized and data mapped.");
      }
    }).catch(function () {
      state = { site: {}, seo: {}, globalReplacements: [], rules: [], media: [], blogs: [], projects: [], services: [], sysLogs: [] };
      renderBasics();
      renderReplacements();
      renderRules();
        renderMedia();
      renderCollection("blog");
      renderCollection("project");
      renderCollection("service");
      renderDashboard();
      renderLogs();
      renderDashboardLogs();
      syncRawJson();
      dashboardInitialized = true;
      setStatus("Could not load CMS data from API or static file. You can still build config here.", true);
      logActivity("System Error", "Failed to load base user configuration");
    });
  }

  function enterDashboard() {
    return initializeDashboard().then(function () {
      showDashboardView();
      return true;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    showLoginView();
    setAuthState(false);
    setStatus("Please sign in with Firebase to access the dashboard.", false);

    setTimeout(hideAdminPreloader, 2000);

    window.addEventListener("load", hideAdminPreloader, { once: true });

    window.CMSAdmin = {
      setStatus: setStatus,
      setAuthState: setAuthState,
      showLoginView: showLoginView,
      enterDashboard: enterDashboard
    };
  });
})();

/* --- User Management Tab Logic (Serverless API) --- */
document.addEventListener("DOMContentLoaded", function () {
  const usersTabBtn = document.querySelector('[data-tab="users"]');
  const addAdminBtn = document.getElementById("add-admin-user");
  const emailInput = document.getElementById("new-user-email");
  const passwordInput = document.getElementById("new-user-password");
  const roleInput = document.getElementById("new-user-role");
  const listContainer = document.getElementById("admin-users-list");
  const errorDiv = document.getElementById("add-user-error");

  if (!usersTabBtn || !listContainer) return;

  function fetchUsers() {
    console.log("[Users Tab] fetchUsers called");
    const user = firebase.auth().currentUser;
    
    if (!user) {
      console.error("[Users Tab] No user logged in");
      listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Not authenticated. Please log in.</td></tr>`;
      return;
    }

    console.log("[Users Tab] User:", user.email);
    
    // Force refresh token to ensure latest custom claims are included
    user.getIdToken(true).then(token => {
      console.log("[Users Tab] Token refreshed, fetching users...");
      
      // Show loading state
      listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading users...</td></tr>`;
      
      fetch("/api/admin/users", {
        method: "GET",
        headers: { 
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      })
      .then(r => {
        console.log("[Users Tab] Response status:", r.status);
        return r.json().then(data => ({
          status: r.status,
          data: data
        }));
      })
      .then(({status, data}) => {
        console.log("[Users Tab] Response data:", data);
        
        if (status === 403) {
          listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Access denied. You must be a Super Admin to view users.</td></tr>`;
          return;
        }
        
        if (status === 401) {
          listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Authentication failed. Please log in again.</td></tr>`;
          return;
        }
        
        if (status !== 200) {
          listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Server error: ${data.error || 'Unknown error'}</td></tr>`;
          return;
        }
        
        if (data.users && data.users.length > 0) {
          let html = "";
          data.users.forEach(u => {
            const isSelf = u.email === user.email;
            const roleLabel = u.role === "super_admin" ? "Super Admin" : "Content Admin";
            const statusClass = u.active !== false ? "text-emerald-700" : "text-gray-500";
            const statusText = u.active !== false ? "Active" : "Disabled";

            html += `
              <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                          <div class="font-medium text-gray-900">${u.email}</div>
                          ${isSelf ? '<span class="ml-2 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">You</span>' : ''}
                          ${u.role === "super_admin" ? '<span class="ml-2 rounded bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">Primary</span>' : ''}
                      </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${roleLabel}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusClass}">
                          ${statusText}
                      </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-left">
                     ${!isSelf ? '<button class="text-blue-600 hover:text-blue-900 mx-1 border-0 bg-transparent cursor-pointer">Edit</button>' : '<span class="text-gray-400">Current</span>'}
                  </td>
              </tr>
            `;
          });
          listContainer.innerHTML = html;
          console.log("[Users Tab] Rendered", data.users.length, "users");
        } else if (data.error) {
           listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">${data.error}</td></tr>`;
        } else {
           listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No users found. Create one to get started.</td></tr>`;
        }
      })
      .catch(err => {
        console.error("[Users Tab] Fetch error:", err);
        listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Error loading users: ${err.message}</td></tr>`;
      });
    }).catch(err => {
      console.error("[Users Tab] Token refresh error:", err);
      listContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Failed to refresh authentication token.</td></tr>`;
    });
  }

  usersTabBtn.addEventListener("click", () => {
    fetchUsers();
  });

  if (addAdminBtn) {
    addAdminBtn.addEventListener("click", () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const role = roleInput.value;

      if (!email || !password) {
        if(errorDiv) {
           errorDiv.innerText = "Email and temporary password are required.";
           errorDiv.classList.remove("hidden");
           errorDiv.style.display = "block";
        }
        return;
      }
      
      if(errorDiv) {
         errorDiv.classList.add("hidden");
         errorDiv.style.display = "none";
      }

      addAdminBtn.innerText = "Saving...";
      addAdminBtn.disabled = true;

      const user = firebase.auth().currentUser;
      if (!user) {
        addAdminBtn.innerText = "Save Admin";
        addAdminBtn.disabled = false;
        if(errorDiv) {
           errorDiv.innerText = "Not authenticated. Please log in again.";
           errorDiv.classList.remove("hidden");
           errorDiv.style.display = "block";
        }
        return;
      }

      // Force refresh token to include latest claims
      user.getIdToken(true).then(token => {
        console.log("[Add Admin] Creating new admin with email:", email);
        
        fetch("/api/admin/users", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token 
          },
          body: JSON.stringify({ email, password, role })
        })
        .then(r => {
          return r.json().then(data => ({
            status: r.status,
            data: data
          }));
        })
        .then(({status, data}) => {
          addAdminBtn.innerText = "Save Admin";
          addAdminBtn.disabled = false;
          
          console.log("[Add Admin] Response status:", status, "data:", data);
          
          if (status === 403) {
            if(errorDiv) {
               errorDiv.innerText = "Access denied. You must be a Super Admin to create users.";
               errorDiv.classList.remove("hidden");
               errorDiv.style.display = "block";
            }
            return;
          }
          
          if (status !== 200) {
            if(errorDiv) {
               errorDiv.innerText = "Error: " + (data.error || "Failed to create user");
               errorDiv.classList.remove("hidden");
               errorDiv.style.display = "block";
            }
            return;
          }
          
          if (data.success || data.uid) {
            emailInput.value = "";
            passwordInput.value = "";
            if(errorDiv) {
               errorDiv.classList.add("hidden");
               errorDiv.style.display = "none";
            }
            console.log("[Add Admin] User created successfully");
            fetchUsers();
          } else {
            if(errorDiv) {
               errorDiv.innerText = "Error: " + (data.error || "Failed to create user");
               errorDiv.classList.remove("hidden");
               errorDiv.style.display = "block";
            }
          }
        })
        .catch(err => {
          addAdminBtn.innerText = "Save Admin";
          addAdminBtn.disabled = false;
          console.error("[Add Admin] Fetch error:", err);
          if(errorDiv) {
             errorDiv.innerText = "Error: " + err.message;
             errorDiv.classList.remove("hidden");
             errorDiv.style.display = "block";
          }
        });
      }).catch(err => {
        addAdminBtn.innerText = "Save Admin";
        addAdminBtn.disabled = false;
        console.error("[Add Admin] Token refresh error:", err);
        if(errorDiv) {
           errorDiv.innerText = "Failed to refresh authentication token.";
           errorDiv.classList.remove("hidden");
           errorDiv.style.display = "block";
        }
      });
    });
  }
});
