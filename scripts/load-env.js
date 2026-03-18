const fs = require("fs");
const path = require("path");

const DEFAULT_ENV_FILES = [".env.local", ".env"];

function parseEnvValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));

    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    process.env[key] = value;
  }

  return true;
}

function loadEnvFiles(rootDir) {
  const loadedFiles = [];

  for (const fileName of DEFAULT_ENV_FILES) {
    const filePath = path.join(rootDir, fileName);
    if (loadEnvFile(filePath)) {
      loadedFiles.push(filePath);
    }
  }

  return loadedFiles;
}

module.exports = {
  loadEnvFiles
};
