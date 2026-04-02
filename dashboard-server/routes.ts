import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHarvestSchema, insertCameraSightingSchema, insertLogEntrySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ── Harvest (Strecke) routes ─────────────────────────────────
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

  // ── Weather (proxy to Open-Meteo) ───────────────────────────
  app.get("/api/weather", async (_req, res) => {
    try {
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=49.803&longitude=7.006&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,pressure_msl&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,weather_code&timezone=Europe/Berlin&forecast_days=7";
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(502).json({ error: "Open-Meteo API error" });
      }
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // ── Camera Sightings (Wildkamera) ───────────────────────────
  app.get("/api/camera-sightings", async (_req, res) => {
    const sightings = await storage.getCameraSightings();
    res.json(sightings);
  });

  app.post("/api/camera-sightings", async (req, res) => {
    const parsed = insertCameraSightingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const sighting = await storage.createCameraSighting(parsed.data);
    res.status(201).json(sighting);
  });

  // ── Log Entries (Reviertagebuch) ────────────────────────────
  app.get("/api/log", async (_req, res) => {
    const entries = await storage.getLogEntries();
    res.json(entries);
  });

  app.post("/api/log", async (req, res) => {
    const parsed = insertLogEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const entry = await storage.createLogEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.delete("/api/log/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await storage.deleteLogEntry(id);
    res.status(204).send();
  });

  return httpServer;
}
