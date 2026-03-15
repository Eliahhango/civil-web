;(function () {
  "use strict";

  var STORAGE_KEY = "elitech.cms.content";
  var BACKEND_CONFIG_URL = "/elitech/cms/backend.json";
  var CMS_API_PATH = "/api/cms/content";
  var STATIC_CMS_URL = "/elitech/cms/content.json";

  var state = null;
  var dashboardInitialized = false;
  var apiBaseUrl = null;

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
    });
  }

  function setAuthState(authenticated, email) {
    ["auth-state", "login-auth-state"].forEach(function (id) {
      var stateNode = $(id);
      if (!stateNode) {
        return;
      }

      stateNode.textContent = authenticated
        ? "Signed in as " + (email || "Firebase user")
        : "Not authenticated";
      stateNode.style.color = authenticated ? "#7ce9b8" : "#94a9bf";
    });
  }

  function showLoginView() {
    var loginView = $("login-view");
    var dashboardView = $("dashboard-view");

    if (loginView) {
      loginView.classList.remove("hidden");
    }
    if (dashboardView) {
      dashboardView.classList.add("hidden");
    }
  }

  function showDashboardView() {
    var loginView = $("login-view");
    var dashboardView = $("dashboard-view");

    if (loginView) {
      loginView.classList.add("hidden");
    }
    if (dashboardView) {
      dashboardView.classList.remove("hidden");
    }
  }

  function parseResponseJson(res) {
    return res.json().catch(function () {
      return {};
    });
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
        $("tab-" + tab).classList.add("active");
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

  function replacementRow(item, index) {
    var wrapper = document.createElement("div");
    wrapper.className = "row-box";

    wrapper.innerHTML = '' +
      '<label>Find<input data-kind="find" value="' + (item.from || "") + '"></label>' +
      '<label>Replace With<input data-kind="replace" value="' + (item.to || "") + '"></label>' +
      '<label>Whole Word<select data-kind="whole"><option value="false">No</option><option value="true">Yes</option></select></label>' +
      '<label>Case Sensitive<select data-kind="case"><option value="false">No</option><option value="true">Yes</option></select></label>' +
      '<button class="remove-btn" data-index="' + index + '" data-type="replacement">Remove</button>';

    wrapper.querySelector('[data-kind="whole"]').value = String(Boolean(item.wholeWord));
    wrapper.querySelector('[data-kind="case"]').value = String(Boolean(item.caseSensitive));
    return wrapper;
  }

  function ruleRow(item, index) {
    var wrapper = document.createElement("div");
    wrapper.className = "row-box rule";

    var joinedPaths = Array.isArray(item.paths) ? item.paths.join(", ") : "";
    wrapper.innerHTML = '' +
      '<label>Paths<input data-kind="paths" value="' + joinedPaths + '" placeholder="/elitech/, /elitech/home-version-2/"></label>' +
      '<label>Selector<input data-kind="selector" value="' + (item.selector || "") + '" placeholder=".class-name h1"></label>' +
      '<label>Action<select data-kind="action">' +
        '<option value="text">text</option>' +
        '<option value="html">html</option>' +
        '<option value="attr:href">attr:href</option>' +
        '<option value="attr:src">attr:src</option>' +
        '<option value="addClass">addClass</option>' +
        '<option value="remove">remove</option>' +
      '</select></label>' +
      '<label>Value<input data-kind="value" value="' + (item.value || "") + '"></label>' +
      '<button class="remove-btn" data-index="' + index + '" data-type="rule">Remove</button>';

    wrapper.querySelector('[data-kind="action"]').value = item.action || "text";
    return wrapper;
  }

  function renderReplacements() {
    var list = $("replacements-list");
    list.innerHTML = "";

    (state.globalReplacements || []).forEach(function (item, index) {
      list.appendChild(replacementRow(item, index));
    });
  }

  function renderRules() {
    var list = $("rules-list");
    list.innerHTML = "";

    (state.rules || []).forEach(function (item, index) {
      list.appendChild(ruleRow(item, index));
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

      return {
        paths: paths,
        selector: row.querySelector('[data-kind="selector"]').value.trim(),
        action: row.querySelector('[data-kind="action"]').value,
        value: row.querySelector('[data-kind="value"]').value
      };
    }).filter(function (item) {
      return item.selector && item.action;
    });
  }

  function readFormIntoState() {
    readBasics();
    readReplacements();
    readRules();
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
      }

      syncRawJson();
    });

    $("btn-load-json").addEventListener("click", function () {
      try {
        state = JSON.parse($("raw-json").value);
        renderBasics();
        renderReplacements();
        renderRules();
        setStatus("Raw JSON loaded into form.", false);
      } catch (error) {
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
          state = JSON.parse(txt);
          renderBasics();
          renderReplacements();
          renderRules();
          syncRawJson();
          setStatus("JSON imported.", false);
        } catch (error) {
          setStatus("Imported file is not valid JSON.", true);
        }
      });
    });
  }

  function loadState() {
    return loadBackendConfig()
      .then(function () {
        return fetch(resolveApiUrl(CMS_API_PATH), {
          cache: "no-cache",
          credentials: "include"
        });
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
        var local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            return JSON.parse(local);
          } catch (error) {
            return base;
          }
        }
        return base;
      });
  }

  function initializeDashboard() {
    if (dashboardInitialized) {
      return Promise.resolve();
    }

    renderTabs();
    bindActions();

    return loadState().then(function (data) {
      state = clone(data);
      state.globalReplacements = state.globalReplacements || [];
      state.rules = state.rules || [];

      renderBasics();
      renderReplacements();
      renderRules();
      syncRawJson();
      dashboardInitialized = true;
      setStatus("Loaded configuration.", false);
    }).catch(function () {
      state = { site: {}, seo: {}, globalReplacements: [], rules: [] };
      renderBasics();
      renderReplacements();
      renderRules();
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

    window.CMSAdmin = {
      setStatus: setStatus,
      setAuthState: setAuthState,
      showLoginView: showLoginView,
      enterDashboard: enterDashboard
    };
  });
})();