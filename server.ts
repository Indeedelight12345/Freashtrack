import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

async function startServer() {
  await ensureDataFile();
  const app = express();
  const PORT = 3000; // Hardcoded per platform requirements

  app.use(express.json());

  // API Routes
  app.get("/api/items", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const { name, category, expiryDate } = req.body;
      if (!name || !category || !expiryDate) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const data = await fs.readFile(DATA_FILE, "utf-8");
      const items = JSON.parse(data);
      
      const newItem = {
        id: Date.now().toString(),
        name,
        category,
        expiryDate,
        createdAt: new Date().toISOString()
      };

      items.push(newItem);
      await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fs.readFile(DATA_FILE, "utf-8");
      let items = JSON.parse(data);
      items = items.filter((item: any) => item.id !== id);
      await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FreshTrack server running on http://localhost:${PORT}`);
  });
}

startServer();
