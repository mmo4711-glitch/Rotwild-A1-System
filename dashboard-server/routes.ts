import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHarvestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Harvest (Strecke) routes
  app.get("/api/harvests", async (_req, res) => {
    const harvests = await storage.getHarvests();
    res.json(harvests);
  });

  app.post("/api/harvests", async (req, res) => {
    const parsed = insertHarvestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const harvest = await storage.createHarvest(parsed.data);
    res.status(201).json(harvest);
  });

  app.delete("/api/harvests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await storage.deleteHarvest(id);
    res.status(204).send();
  });

  return httpServer;
}
