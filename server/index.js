import express from "express";
import databricksSql from "@databricks/sql";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_SOURCE } from "../data-source.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");
const distDir = path.join(baseDir, "dist");
const profilesDir = path.join(baseDir, "profiles");
const port = process.env.PORT || 8000;
const safeProfileName = /^[\w\- ]+$/;
const { DBSQLClient } = databricksSql;

await fs.mkdir(profilesDir, { recursive: true });

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

function profilePath(name) {
  const decoded = decodeURIComponent(name).replace(/\.json$/, "").trim();
  if (!decoded || !safeProfileName.test(decoded)) return null;
  return path.join(profilesDir, `${decoded}.json`);
}

function quoteIdentifier(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Databricks catalog, schema, table, and column names must be non-empty strings");
  }
  return `\`${value.replaceAll("`", "``")}\``;
}

function buildTableName({ catalog, schema, table }) {
  return [catalog, schema, table].map(quoteIdentifier).join(".");
}

function buildColumnList(columns) {
  if (!Array.isArray(columns) || columns.length === 0 || columns.includes("*")) return "*";
  return columns.map(quoteIdentifier).join(", ");
}

function buildDatabricksQuery(config) {
  const tableName = buildTableName(config);
  const columns = buildColumnList(config.columns);
  const limit = Number.isInteger(config.limit) && config.limit > 0 ? config.limit : 5000;
  const where = config.where?.trim() ? `\nWHERE ${config.where.trim()}` : "";
  const orderBy = config.orderBy?.trim() ? `\nORDER BY ${config.orderBy.trim()}` : "";

  return `SELECT ${columns}\nFROM ${tableName}${where}${orderBy}\nLIMIT ${limit}`;
}

function assertDatabricksConfig(config) {
  const missing = ["host", "token", "httpPath", "catalog", "schema", "table"].filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Databricks data source settings: ${missing.join(", ")}`);
  }
}

async function readLocalData() {
  const configuredFile = DATA_SOURCE.local?.file || "data.json";
  const dataPath = path.resolve(baseDir, configuredFile);
  if (!dataPath.startsWith(`${baseDir}${path.sep}`) && dataPath !== baseDir) {
    throw new Error("Local data file must be inside the project directory");
  }
  return fs.readFile(dataPath, "utf8");
}

async function readDatabricksData() {
  const config = DATA_SOURCE.databricks || {};
  assertDatabricksConfig(config);

  const client = new DBSQLClient();
  let session;
  let operation;

  try {
    await client.connect({
      host: config.host,
      path: config.httpPath,
      token: config.token,
    });

    session = await client.openSession({
      initialCatalog: config.catalog,
      initialSchema: config.schema,
    });

    operation = await session.executeStatement(buildDatabricksQuery(config));
    await operation.finished();
    const rows = await operation.fetchAll();
    return JSON.stringify(rows, null, 2);
  } finally {
    if (operation) await operation.close().catch(() => {});
    if (session) await session.close().catch(() => {});
    await client.close().catch(() => {});
  }
}

async function readBoardData() {
  if (DATA_SOURCE.source === "databricks") return readDatabricksData();
  if (DATA_SOURCE.source === "local") return readLocalData();
  throw new Error(`Unsupported DATA_SOURCE.source "${DATA_SOURCE.source}"`);
}

app.get("/data.json", async (_req, res, next) => {
  try {
    res.type("json").send(await readBoardData());
  } catch (error) {
    next(error);
  }
});

app.get("/data-source", (_req, res) => {
  const source = DATA_SOURCE.source;
  const databricks = DATA_SOURCE.databricks || {};

  res.json({
    source,
    localFile: source === "local" ? DATA_SOURCE.local?.file || "data.json" : undefined,
    databricks: source === "databricks" ? {
      host: databricks.host,
      httpPath: databricks.httpPath,
      catalog: databricks.catalog,
      schema: databricks.schema,
      table: databricks.table,
      columns: databricks.columns,
      where: databricks.where,
      orderBy: databricks.orderBy,
      limit: databricks.limit,
      hasToken: Boolean(databricks.token),
    } : undefined,
  });
});

app.get("/profiles", async (_req, res, next) => {
  try {
    const files = await fs.readdir(profilesDir);
    res.json(files.filter(file => file.endsWith(".json")).map(file => path.basename(file, ".json")).sort());
  } catch (error) {
    next(error);
  }
});

app.get("/profiles/:name", async (req, res, next) => {
  try {
    const file = profilePath(req.params.name);
    if (!file) return res.status(400).json({ error: "Invalid profile name" });
    res.json(JSON.parse(await fs.readFile(file, "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return res.status(404).json({ error: "Profile not found" });
    next(error);
  }
});

app.post("/profiles/:name", async (req, res, next) => {
  try {
    const file = profilePath(req.params.name);
    if (!file) return res.status(400).json({ error: "Invalid profile name" });
    await fs.writeFile(file, `${JSON.stringify(req.body, null, 2)}\n`);
    res.json({ ok: true, name: path.basename(file, ".json") });
  } catch (error) {
    next(error);
  }
});

app.delete("/profiles/:name", async (req, res, next) => {
  try {
    const file = profilePath(req.params.name);
    if (file) await fs.rm(file, { force: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Requests Kanban listening on http://0.0.0.0:${port}`);
});
