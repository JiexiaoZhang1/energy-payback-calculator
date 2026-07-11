import cors from "cors";
import express from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { calculateSavings } from "./calculations.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const dataDir = resolve(projectRoot, "data");
const distDir = resolve(projectRoot, "dist");
const port = Number(process.env.PORT ?? 8787);

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "energy-payback-api" });
});

app.post("/api/calculate", (req, res) => {
  try {
    const state = req.body?.state;
    if (!state) {
      res.status(400).json({ error: "state is required" });
      return;
    }
    res.json({ result: calculateSavings(state), source: "server" });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "invalid request" });
  }
});

app.post("/api/scenarios", (req, res) => {
  try {
    const state = req.body?.state;
    if (!state) {
      res.status(400).json({ error: "state is required" });
      return;
    }
    const result = req.body?.result ?? calculateSavings(state);
    const id = randomUUID().slice(0, 8);
    const scenario = {
      id,
      createdAt: new Date().toISOString(),
      state,
      result,
    };
    writeFileSync(scenarioPath(id), JSON.stringify(scenario, null, 2));
    res.status(201).json({ scenario, id });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "invalid request" });
  }
});

app.get("/api/scenarios/:id", (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "invalid scenario id" });
    return;
  }
  const path = scenarioPath(id);
  if (!existsSync(path)) {
    res.status(404).json({ error: "scenario not found" });
    return;
  }
  res.json({ scenario: JSON.parse(readFileSync(path, "utf8")) });
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Energy payback API running on http://localhost:${port}`);
});

function safeId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{6,48}$/.test(value) ? value : "";
}

function scenarioPath(id) {
  return join(dataDir, `${id}.json`);
}
