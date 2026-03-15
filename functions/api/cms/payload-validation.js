const MAX_PAYLOAD_BYTES_DEFAULT = 256 * 1024;
const MAX_STRING_LENGTH = 2048;
const MAX_SELECTOR_LENGTH = 256;
const MAX_PATHS_PER_RULE = 20;
const MAX_REPLACEMENTS = 300;
const MAX_RULES = 300;

const ALLOWED_RULE_ACTIONS = new Set([
  "text",
  "addClass",
  "remove",
  "attr:href",
  "attr:src",
  "attr:alt",
  "attr:title",
  "style:color",
  "style:background-color",
  "style:font-weight",
  "style:text-decoration",
  "style:opacity"
]);

const URL_PROTOCOL_ALLOWLIST = new Set(["http:", "https:", "mailto:", "tel:"]);
const CLASS_TOKEN_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getMaxPayloadBytes() {
  const raw = Number(process.env.CMS_MAX_PAYLOAD_BYTES || MAX_PAYLOAD_BYTES_DEFAULT);
  if (!Number.isFinite(raw) || raw <= 0) {
    return MAX_PAYLOAD_BYTES_DEFAULT;
  }
  return Math.floor(raw);
}

function fail(status, error) {
  return { ok: false, status, error };
}

function ok(data) {
  return { ok: true, data };
}

function safeString(value, fieldName, maxLength) {
  if (typeof value !== "string") {
    return fail(400, `Invalid ${fieldName}: expected string`);
  }

  if (value.length > maxLength) {
    return fail(400, `Invalid ${fieldName}: too long`);
  }

  return ok(value);
}

function validateStringMap(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}: expected object`);
  }

  const output = {};
  const keys = Object.keys(value);
  if (keys.length > 100) {
    return fail(400, `Invalid ${fieldName}: too many keys`);
  }

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!key || key.length > 80) {
      return fail(400, `Invalid ${fieldName}: invalid key`);
    }

    const stringResult = safeString(value[key], `${fieldName}.${key}`, MAX_STRING_LENGTH);
    if (!stringResult.ok) {
      return stringResult;
    }

    output[key] = stringResult.data;
  }

  return ok(output);
}

function isSafeUrl(value) {
  const urlValue = String(value || "").trim();
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
    const parsed = new URL(urlValue);
    return URL_PROTOCOL_ALLOWLIST.has(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function validateReplacement(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid globalReplacements[${index}]`);
  }

  const allowedKeys = ["from", "to", "wholeWord", "caseSensitive"];
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    if (!allowedKeys.includes(keys[i])) {
      return fail(400, `Invalid globalReplacements[${index}]: unexpected field`);
    }
  }

  const from = safeString(value.from, `globalReplacements[${index}].from`, 400);
  if (!from.ok) {
    return from;
  }

  const to = safeString(value.to, `globalReplacements[${index}].to`, MAX_STRING_LENGTH);
  if (!to.ok) {
    return to;
  }

  const wholeWord = value.wholeWord === true;
  const caseSensitive = value.caseSensitive === true;

  return ok({
    from: from.data,
    to: to.data,
    wholeWord,
    caseSensitive
  });
}

function validateRule(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid rules[${index}]`);
  }

  const allowedKeys = ["paths", "selector", "action", "value"];
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    if (!allowedKeys.includes(keys[i])) {
      return fail(400, `Invalid rules[${index}]: unexpected field`);
    }
  }

  if (!Array.isArray(value.paths) || value.paths.length === 0 || value.paths.length > MAX_PATHS_PER_RULE) {
    return fail(400, `Invalid rules[${index}].paths`);
  }

  const normalizedPaths = [];
  for (let i = 0; i < value.paths.length; i += 1) {
    const pathValueResult = safeString(value.paths[i], `rules[${index}].paths[${i}]`, 240);
    if (!pathValueResult.ok) {
      return pathValueResult;
    }
    const pathValue = pathValueResult.data.trim();
    if (!pathValue || (!pathValue.startsWith("/") && pathValue !== "*")) {
      return fail(400, `Invalid rules[${index}].paths[${i}]`);
    }
    normalizedPaths.push(pathValue);
  }

  const selectorResult = safeString(value.selector, `rules[${index}].selector`, MAX_SELECTOR_LENGTH);
  if (!selectorResult.ok) {
    return selectorResult;
  }

  const actionResult = safeString(value.action, `rules[${index}].action`, 64);
  if (!actionResult.ok) {
    return actionResult;
  }

  const action = actionResult.data;
  if (!ALLOWED_RULE_ACTIONS.has(action)) {
    return fail(400, `Invalid rules[${index}].action`);
  }

  const valueResult = safeString(value.value || "", `rules[${index}].value`, MAX_STRING_LENGTH);
  if (!valueResult.ok) {
    return valueResult;
  }

  const ruleValue = valueResult.data;
  if ((action === "attr:href" || action === "attr:src") && !isSafeUrl(ruleValue)) {
    return fail(400, `Invalid rules[${index}].value URL`);
  }

  if (action === "addClass") {
    const tokens = ruleValue.split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return fail(400, `Invalid rules[${index}].value class list`);
    }

    for (let i = 0; i < tokens.length; i += 1) {
      if (!CLASS_TOKEN_PATTERN.test(tokens[i])) {
        return fail(400, `Invalid rules[${index}].value class token`);
      }
    }
  }

  if (action.indexOf("style:") === 0 && /(expression\s*\(|javascript:|url\s*\()/i.test(ruleValue)) {
    return fail(400, `Invalid rules[${index}].value style`);
  }

  return ok({
    paths: normalizedPaths,
    selector: selectorResult.data,
    action,
    value: ruleValue
  });
}

function parseBody(req, maxBytes) {
  const contentLength = Number((req.headers && req.headers["content-length"]) || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return fail(413, "Payload too large");
  }

  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body, "utf8") > maxBytes) {
      return fail(413, "Payload too large");
    }

    try {
      return ok(JSON.parse(req.body));
    } catch (_error) {
      return fail(400, "Malformed JSON payload");
    }
  }

  if (!isPlainObject(req.body)) {
    return fail(400, "Invalid payload object");
  }

  const serialized = JSON.stringify(req.body);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) {
    return fail(413, "Payload too large");
  }

  return ok(req.body);
}

function validateAndNormalizePayload(req) {
  const maxBytes = getMaxPayloadBytes();
  const parsedBodyResult = parseBody(req, maxBytes);
  if (!parsedBodyResult.ok) {
    return parsedBodyResult;
  }

  const body = parsedBodyResult.data;
  const bodyKeys = Object.keys(body || {});
  const allowedTopLevelKeys = ["site", "seo", "globalReplacements", "rules"];

  for (let i = 0; i < bodyKeys.length; i += 1) {
    if (!allowedTopLevelKeys.includes(bodyKeys[i])) {
      return fail(400, `Invalid payload field: ${bodyKeys[i]}`);
    }
  }

  const siteResult = validateStringMap(body.site || {}, "site");
  if (!siteResult.ok) {
    return siteResult;
  }

  const seoResult = validateStringMap(body.seo || {}, "seo");
  if (!seoResult.ok) {
    return seoResult;
  }

  if (!Array.isArray(body.globalReplacements)) {
    return fail(400, "Invalid globalReplacements: expected array");
  }
  if (body.globalReplacements.length > MAX_REPLACEMENTS) {
    return fail(400, "Too many global replacements");
  }

  const globalReplacements = [];
  for (let i = 0; i < body.globalReplacements.length; i += 1) {
    const replacementResult = validateReplacement(body.globalReplacements[i], i);
    if (!replacementResult.ok) {
      return replacementResult;
    }
    globalReplacements.push(replacementResult.data);
  }

  if (!Array.isArray(body.rules)) {
    return fail(400, "Invalid rules: expected array");
  }
  if (body.rules.length > MAX_RULES) {
    return fail(400, "Too many rules");
  }

  const rules = [];
  for (let i = 0; i < body.rules.length; i += 1) {
    const ruleResult = validateRule(body.rules[i], i);
    if (!ruleResult.ok) {
      return ruleResult;
    }
    rules.push(ruleResult.data);
  }

  return ok({
    site: siteResult.data,
    seo: seoResult.data,
    globalReplacements,
    rules
  });
}

module.exports = {
  ALLOWED_RULE_ACTIONS,
  validateAndNormalizePayload
};