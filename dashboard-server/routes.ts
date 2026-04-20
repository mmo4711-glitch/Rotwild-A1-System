import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, sha256 } from "./storage";
import { insertHarvestSchema, insertCameraSightingSchema, insertLogEntrySchema, insertHunterSchema } from "@shared/schema";
import { z } from "zod";

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

  // ── Hunters: Admin registration & list ──────────────────
  // Schema where the admin sends the plain password; server hashes it.
  const registerHunterSchema = insertHunterSchema
    .omit({ passwordHash: true })
    .extend({ password: z.string().min(3) });

  app.get("/api/hunters", async (_req, res) => {
    const all = await storage.getHunters();
    // Don't leak password hashes
    res.json(all.map(({ passwordHash, ...rest }) => rest));
  });

  app.post("/api/hunters", async (req, res) => {
    const parsed = registerHunterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { password, ...data } = parsed.data;
    try {
      const hunter = await storage.createHunter({
        ...data,
        passwordHash: sha256(password),
      });
      const { passwordHash: _ph, ...safe } = hunter;
      res.status(201).json(safe);
    } catch (err: any) {
      if (String(err?.message || "").includes("UNIQUE")) {
        return res.status(409).json({ error: "Jagdschein-Nr bereits vergeben" });
      }
      res.status(500).json({ error: "Fehler beim Anlegen des J\u00e4gers" });
    }
  });

  app.delete("/api/hunters/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await storage.deleteHunter(id);
    res.status(204).send();
  });

  // ── Verification: full (password required) ───────────────
  // Client may send either plain password (fallback) or already-hashed (preferred).
  const verifySchema = z.object({
    jagdscheinNr: z.string().min(1),
    password: z.string().min(1).optional(),
    passwordHash: z.string().min(1).optional(),
  });

  app.post("/api/verify", async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ valid: false, reason: "invalid_request" });
    }
    const { jagdscheinNr, password, passwordHash } = parsed.data;
    const hunter = await storage.getHunterByNr(jagdscheinNr.trim());
    if (!hunter) {
      return res.json({ valid: false, reason: "unknown_nr", message: "Jagdschein-Nr nicht gefunden." });
    }
    const sentHash = passwordHash ?? (password ? sha256(password) : "");
    if (!sentHash || sentHash !== hunter.passwordHash) {
      return res.json({ valid: false, reason: "wrong_password", message: "Falsches Passwort." });
    }

    // Check status / expiry
    const today = new Date().toISOString().slice(0, 10);
    const expired = hunter.validUntil < today;
    const effectiveStatus = expired ? "abgelaufen" : hunter.status;

    const valid = effectiveStatus === "aktiv";
    res.json({
      valid,
      reason: valid ? null : effectiveStatus,
      jagdscheinNr: hunter.jagdscheinNr,
      firstName: hunter.firstName,
      lastName: hunter.lastName,
      name: `${hunter.firstName} ${hunter.lastName}`,
      validFrom: hunter.validFrom,
      validUntil: hunter.validUntil,
      issuer: hunter.issuer,
      type: hunter.type,
      status: effectiveStatus,
      revier: hunter.revier,
      role: hunter.role,
    });
  });

  // ── Public status check (no password) ───────────────────
  // Returns ONLY status & expiry. No personal data.
  app.get("/api/verify/:nr", async (req, res) => {
    const nr = req.params.nr.trim();
    const hunter = await storage.getHunterByNr(nr);
    if (!hunter) {
      return res.json({ valid: false, reason: "unknown_nr", jagdscheinNr: nr });
    }
    const today = new Date().toISOString().slice(0, 10);
    const expired = hunter.validUntil < today;
    const effectiveStatus = expired ? "abgelaufen" : hunter.status;
    res.json({
      valid: effectiveStatus === "aktiv",
      jagdscheinNr: hunter.jagdscheinNr,
      status: effectiveStatus,
      validUntil: hunter.validUntil,
    });
  });

  // ── Wallet pass data (full personal info, for display in a pass) ──
  app.get("/api/wallet/:nr", async (req, res) => {
    const nr = req.params.nr.trim();
    const hunter = await storage.getHunterByNr(nr);
    if (!hunter) return res.status(404).json({ error: "Nicht gefunden" });
    const today = new Date().toISOString().slice(0, 10);
    const expired = hunter.validUntil < today;
    const effectiveStatus = expired ? "abgelaufen" : hunter.status;
    res.json({
      passType: "jagdschein",
      organization: "Eigenjagdbezirk Merschbach",
      jagdscheinNr: hunter.jagdscheinNr,
      firstName: hunter.firstName,
      lastName: hunter.lastName,
      name: `${hunter.firstName} ${hunter.lastName}`,
      validFrom: hunter.validFrom,
      validUntil: hunter.validUntil,
      issuer: hunter.issuer,
      type: hunter.type,
      status: effectiveStatus,
      revier: hunter.revier,
      role: hunter.role,
      // Simulated barcode payload (for QR)
      qrPayload: `JAGDSCHEIN:${hunter.jagdscheinNr}|${hunter.validUntil}|${effectiveStatus}`,
    });
  });

  return httpServer;
}
