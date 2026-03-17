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
      node.style.color = error ? "#ff8c95" : "#94a9bf";
      node.classList.remove("status-success", "status-error", "status-pulse");
      node.classList.add(error ? "status-error" : "status-success", "status-pulse");
    });

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
      blogs: [],
      projects: [],
      services: []
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
        $("tab-title").textContent = btn.textContent.trim();
      });
    });
  }

  function renderBasics() {
    $("site-name").value = state.site && state.site.name || "";
    $("site-tagline").value = state.site && state.site.tagline || "";

    $("seo-title").value = state.seo && state.seo.title || "";
    $("seo-description").value = state.seo && state.seo.description || "";
    $("seo-image").value = state.seo && state.seo.image || "";
    $("seo-url").value = state.seo && state.seo.url || "";
    $("seo-twitter-card").value = state.seo && state.seo.twitterCard || "summary_large_image";
  }

  function readBasics() {
    state.site = state.site || {};
    state.seo = state.seo || {};

    state.site.name = $("site-name").value.trim();
    state.site.tagline = $("site-tagline").value.trim();

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
    wrapper.className = "row-box";

    wrapper.appendChild(createLabelWithInput("Find", "find", item.from));
    wrapper.appendChild(createLabelWithInput("Replace With", "replace", item.to));
    wrapper.appendChild(createLabelWithBooleanSelect("Whole Word", "whole", item.wholeWord));
    wrapper.appendChild(createLabelWithBooleanSelect("Case Sensitive", "case", item.caseSensitive));
    wrapper.appendChild(createRemoveButton(index, "replacement"));

    return wrapper;
  }

  function ruleRow(item, index) {
      var wrapper = document.createElement("div");
      wrapper.className = "row-box rule";
      var joinedPaths = Array.isArray(item.paths) ? item.paths.join(", ") : "";

      wrapper.appendChild(createLabelWithInput("Paths", "paths", joinedPaths, "/elitech/, /elitech/home-version-2/"));
      wrapper.appendChild(createLabelWithInput("Selector", "selector", item.selector || "", ".class-name h1"));
      wrapper.appendChild(createLabelWithActionSelect(item.action || "text"));
      wrapper.appendChild(createLabelWithInput("Value", "value", item.value || ""));
      wrapper.appendChild(createRemoveButton(index, "rule"));

      return wrapper;
    }

  function collectionRow(item, index, type) {
    var wrapper = document.createElement("div");
    wrapper.className = "row-box " + type;

    wrapper.appendChild(createLabelWithInput("Title", "title", item.title));
    wrapper.appendChild(createLabelWithInput("Category", "category", item.category));
    wrapper.appendChild(createLabelWithInput("Image URL", "image", item.image));
    wrapper.appendChild(createLabelWithInput("Link URL", "url", item.url));
    wrapper.appendChild(createLabelWithInput("Date", "date", item.date));
    
    var excerptLabel = document.createElement("label");
    excerptLabel.appendChild(document.createTextNode("Excerpt/Content"));
    var excerptInput = document.createElement("textarea");
    excerptInput.setAttribute("data-kind", "excerpt");
    excerptInput.rows = 2;
    excerptInput.value = item.excerpt || "";
    excerptLabel.appendChild(excerptInput);
    wrapper.appendChild(excerptLabel);

    wrapper.appendChild(createRemoveButton(index, type));

    return wrapper;
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

    (state[stateName] || []).forEach(function (item, index) {
      list.appendChild(collectionRow(item, index, type));
    });
  }

  function readReplacements() {
    var rows = document.querySelectorAll("#replacements-list .row-box");
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
    var rows = document.querySelectorAll("#rules-list .row-box.rule");
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
    var rows = document.querySelectorAll("#" + type + "s-list .row-box." + type);
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
    setStatus("Preview applied locally. Open the website in this browser to see updates.", false);
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function saveToServer() {
    readFormIntoState();
    syncRawJson();

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
        setStatus("Saved to backend successfully. Live site will use latest content.", false);
      });
    }).catch(function (error) {
      setStatus(error.message || "Could not save to server.", true);
    });
  }

  function bindActions() {
    $("btn-apply").addEventListener("click", applyLocal);
    $("btn-reset").addEventListener("click", resetLocal);
    $("btn-save-server").addEventListener("click", saveToServer);
    $("btn-logout").addEventListener("click", function () {
      if (!window.CMSFirebaseAuth || typeof window.CMSFirebaseAuth.logout !== "function") {
        setStatus("Firebase auth is not ready.", true);
        return;
      }

      window.CMSFirebaseAuth.logout().catch(function (error) {
        setStatus(error.message || "Could not sign out.", true);
      });
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
      syncRawJson();
    });

    var bindAddCollection = function(type) {
      var btn = $("add-" + type);
      if (!btn) return;
      btn.addEventListener("click", function () {
        readFormIntoState();
        var arr = state[type + "s"] || [];
        arr.push({ title: "", category: "", image: "", url: "", date: "", excerpt: "" });
        state[type + "s"] = arr;
        renderCollection(type);
        syncRawJson();
      });
    };

    bindAddCollection("blog");
    bindAddCollection("project");
    bindAddCollection("service");

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
      } else if (type === "rule") {
        state.rules.splice(index, 1);
        renderRules();
      } else if (type === "blog" || type === "project" || type === "service") {
        var stateName = type + "s";
        if (state[stateName]) {
          state[stateName].splice(index, 1);
          renderCollection(type);
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
      renderCollection("blog");
      renderCollection("project");
      renderCollection("service");
      syncRawJson();
      dashboardInitialized = true;
      setStatus("Loaded configuration.", false);
    }).catch(function () {
      state = { site: {}, seo: {}, globalReplacements: [], rules: [], blogs: [], projects: [], services: [] };
      renderBasics();
      renderReplacements();
      renderRules();
      renderCollection("blog");
      renderCollection("project");
      renderCollection("service");
      syncRawJson();
      dashboardInitialized = true;
      setStatus("Could not load CMS data from API or static file. You can still build config here.", true);
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
