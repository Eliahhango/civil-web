(function () {
  "use strict";

  var BACKEND_CONFIG_URL = "/elitech/cms/backend.json";
  var CONFIG_PATH = "/api/cms/content";
  var STATIC_CONFIG_URL = "/elitech/cms/content.json";
  var STORAGE_KEY = "elitech.cms.content";
  var apiBaseUrl = null;
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
  var ALLOWED_ATTRS = {
    href: true,
    src: true,
    alt: true,
    title: true
  };
  var ALLOWED_STYLE_PROPS = {
    color: true,
    "background-color": true,
    "font-weight": true,
    "text-decoration": true,
    opacity: true
  };

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

  function normalizePath(path) {
    if (!path) {
      return "/";
    }
    var clean = path.replace(/\\+/g, "/");
    if (!clean.startsWith("/")) {
      clean = "/" + clean;
    }
    return clean.endsWith("/") ? clean : clean + "/";
  }

  function ensureMeta(selector, attrName) {
    var node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attrName, selector.indexOf("property=") >= 0 ? selector.match(/property=\"([^\"]+)\"/)[1] : selector.match(/name=\"([^\"]+)\"/)[1]);
      document.head.appendChild(node);
    }
    return node;
  }

  function setSeo(seo, path) {
    if (!seo) {
      return;
    }
    if (seo.title) {
      document.title = seo.title;
      var ogTitle = ensureMeta('meta[property="og:title"]', "property");
      var twTitle = ensureMeta('meta[name="twitter:title"]', "name");
      ogTitle.setAttribute("content", seo.title);
      twTitle.setAttribute("content", seo.title);
    }
    if (seo.description) {
      var desc = ensureMeta('meta[name="description"]', "name");
      var ogDesc = ensureMeta('meta[property="og:description"]', "property");
      var twDesc = ensureMeta('meta[name="twitter:description"]', "name");
      desc.setAttribute("content", seo.description);
      ogDesc.setAttribute("content", seo.description);
      twDesc.setAttribute("content", seo.description);
    }
    if (seo.image) {
      var ogImage = ensureMeta('meta[property="og:image"]', "property");
      var twImage = ensureMeta('meta[name="twitter:image"]', "name");
      ogImage.setAttribute("content", seo.image);
      twImage.setAttribute("content", seo.image);
    }
    if (seo.url) {
      var ogUrl = ensureMeta('meta[property="og:url"]', "property");
      ogUrl.setAttribute("content", seo.url);
    } else {
      var current = window.location.origin + path;
      var og = ensureMeta('meta[property="og:url"]', "property");
      og.setAttribute("content", current);
    }
    if (seo.twitterCard) {
      var twCard = ensureMeta('meta[name="twitter:card"]', "name");
      twCard.setAttribute("content", seo.twitterCard);
    }
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildRegex(replacement) {
    var pattern = escapeRegExp(String(replacement.from || ""));
    if (!pattern) {
      return null;
    }
    if (replacement.wholeWord) {
      pattern = "\\b" + pattern + "\\b";
    }
    var flags = replacement.caseSensitive ? "g" : "gi";
    return new RegExp(pattern, flags);
  }

  function replaceTextInNode(node, replacements) {
    var original = node.nodeValue;
    var next = original;

    for (var i = 0; i < replacements.length; i += 1) {
      var item = replacements[i];
      if (!item || !item.from || typeof item.to !== "string") {
        continue;
      }
      var regex = buildRegex(item);
      if (!regex) {
        continue;
      }
      next = next.replace(regex, item.to);
    }

    if (next !== original) {
      node.nodeValue = next;
    }
  }

  function replaceTextGlobally(replacements) {
    if (!Array.isArray(replacements) || replacements.length === 0) {
      return;
    }

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.parentElement) {
          return NodeFilter.FILTER_REJECT;
        }
        var tag = node.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var current;
    while ((current = walker.nextNode())) {
      replaceTextInNode(current, replacements);
    }
  }

  function pathMatches(path, patterns) {
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return true;
    }

    var normalizedPath = normalizePath(path);

    for (var i = 0; i < patterns.length; i += 1) {
      var pattern = String(patterns[i] || "").trim();
      if (!pattern) {
        continue;
      }

      if (pattern === "*") {
        return true;
      }

      if (pattern.endsWith("*")) {
        var prefix = normalizePath(pattern.slice(0, -1));
        if (normalizedPath.indexOf(prefix) === 0) {
          return true;
        }
      } else if (normalizePath(pattern) === normalizedPath) {
        return true;
      }
    }

    return false;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function mergeAny(baseValue, overrideValue) {
    if (Array.isArray(baseValue)) {
      return Array.isArray(overrideValue) ? overrideValue.slice() : baseValue.slice();
    }

    if (isPlainObject(baseValue)) {
      var output = {};
      var override = isPlainObject(overrideValue) ? overrideValue : {};
      Object.keys(baseValue).forEach(function (key) {
        output[key] = mergeAny(baseValue[key], override[key]);
      });
      Object.keys(override).forEach(function (key) {
        if (!(key in output)) {
          output[key] = override[key];
        }
      });
      return output;
    }

    return overrideValue === undefined || overrideValue === null ? baseValue : overrideValue;
  }

  function applyRule(rule) {
    if (!rule || !rule.selector || !rule.action) {
      return;
    }

    if (!ALLOWED_RULE_ACTIONS[rule.action]) {
      return;
    }

    var elements = [];
    try {
      elements = document.querySelectorAll(rule.selector);
    } catch (_error) {
      return;
    }

    if (!elements.length) {
      return;
    }

    function isSafeUrl(value) {
      var urlValue = String(value || "").trim();
      if (!urlValue) {
        return true;
      }

      if (/^javascript:/i.test(urlValue)) {
        return false;
      }

      if (/^[/?#]|^\.\.?\//.test(urlValue)) {
        return true;
      }

      try {
        var parsed = new URL(urlValue, window.location.origin);
        return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:";
      } catch (_error) {
        return false;
      }
    }

    function isSafeStyleValue(value) {
      var styleValue = String(value || "");
      if (styleValue.length > 256) {
        return false;
      }
      return !/(expression\s*\(|javascript:|url\s*\()/i.test(styleValue);
    }

    elements.forEach(function (el) {
      if (rule.action === "text") {
        el.textContent = rule.value || "";
        return;
      }

      if (rule.action.indexOf("attr:") === 0) {
        var attr = rule.action.split(":")[1];
        if (attr && ALLOWED_ATTRS[attr]) {
          var nextValue = String(rule.value || "");
          if ((attr === "href" || attr === "src") && !isSafeUrl(nextValue)) {
            return;
          }
          el.setAttribute(attr, nextValue);
        }
        return;
      }

      if (rule.action.indexOf("style:") === 0) {
        var styleProp = rule.action.split(":")[1];
        if (styleProp && ALLOWED_STYLE_PROPS[styleProp] && isSafeStyleValue(rule.value)) {
          el.style.setProperty(styleProp, String(rule.value || ""));
        }
        return;
      }

      if (rule.action === "addClass" && rule.value) {
        var classes = String(rule.value || "").split(/\s+/).filter(Boolean);
        classes.forEach(function (token) {
          if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(token)) {
            el.classList.add(token);
          }
        });
        return;
      }

      if (rule.action === "remove") {
        el.remove();
      }
    });
  }

  function applyRules(data, path) {
    if (!data || !Array.isArray(data.rules)) {
      return;
    }

    data.rules.forEach(function (rule) {
      if (pathMatches(path, rule.paths)) {
        applyRule(rule);
      }
    });
  }

  function mergeConfig(base, override) {
    if (!override || typeof override !== "object") {
      return base;
    }

    return mergeAny(base || {}, override || {});
  }

  function getLocalOverride() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return null;
      }
      return JSON.parse(saved);
    } catch (error) {
      return null;
    }
  }

  function applyConfig(data) {
    var path = normalizePath(window.location.pathname);
    window.__ELITECH_CMS_DATA__ = data;
    setSeo(data.seo, path);
    applyRules(data, path);
    replaceTextGlobally(data.globalReplacements || []);
  }

  function fetchConfigWithFallback() {
    return loadBackendConfig()
      .then(function () {
        return fetch(resolveApiUrl(CONFIG_PATH), {
          cache: "no-cache"
        });
      })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        return fetch(STATIC_CONFIG_URL, { cache: "no-cache" }).then(function (staticResponse) {
          if (!staticResponse.ok) {
            throw new Error("Failed to load CMS config");
          }
          return staticResponse.json();
        });
      })
      .catch(function () {
        return fetch(STATIC_CONFIG_URL, { cache: "no-cache" }).then(function (staticResponse) {
          if (!staticResponse.ok) {
            throw new Error("Failed to load CMS config");
          }
          return staticResponse.json();
        });
      });
  }

  function bootstrap() {
    fetchConfigWithFallback()
      .then(function (base) {
        var merged = mergeConfig(base || {}, getLocalOverride());
        applyConfig(merged);

        window.addEventListener("load", function () {
          applyConfig(merged);
        });
      })
      .catch(function () {
        var localOnly = getLocalOverride();
        if (localOnly) {
          applyConfig(localOnly);
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
