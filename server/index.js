import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");
const distDir = path.join(baseDir, "dist");
const profilesDir = path.join(baseDir, "profiles");
const port = process.env.PORT || 8000;
const safeProfileName = /^[\w\- ]+$/;

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

app.get("/data.json", async (_req, res, next) => {
  try {
    res.type("json").send(await fs.readFile(path.join(baseDir, "data.json"), "utf8"));
  } catch (error) {
    next(error);
  }
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
