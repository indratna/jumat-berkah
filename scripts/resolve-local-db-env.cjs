/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");

const envPath = ".env.local";

function parseEnvLine(line) {
  const index = line.indexOf("=");
  if (index === -1) {
    return null;
  }

  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function readDatabaseUrl() {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const entry = parseEnvLine(trimmed);
    if (entry && entry[0] === "DATABASE_URL") {
      return entry[1];
    }
  }

  return null;
}

const databaseUrl = readDatabaseUrl();

if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL belum ada di .env.local.");
  process.exit(1);
}

let url;
try {
  url = new URL(databaseUrl);
} catch {
  console.error("ERROR: DATABASE_URL di .env.local tidak valid.");
  process.exit(1);
}

if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
  console.error("ERROR: DATABASE_URL harus memakai postgres/postgresql.");
  process.exit(1);
}

const dbName = url.pathname.replace(/^\//, "");
const dbUser = decodeURIComponent(url.username);
const dbPassword = decodeURIComponent(url.password);
const dbPort = url.port || "5432";

if (!dbName || !dbUser || !dbPassword) {
  console.error(
    "ERROR: DATABASE_URL harus berisi database, user, dan password.",
  );
  process.exit(1);
}

console.log(`set "LOCAL_DB_NAME=${dbName}"`);
console.log(`set "LOCAL_DB_USER=${dbUser}"`);
console.log(`set "LOCAL_DB_PASSWORD=${dbPassword}"`);
console.log(`set "LOCAL_DB_PORT=${dbPort}"`);
