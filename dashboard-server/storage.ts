import {
  type User, type InsertUser, users,
  type Harvest, type InsertHarvest, harvests,
  type CameraSighting, type InsertCameraSighting, cameraSightings,
  type LogEntry, type InsertLogEntry, logEntries,
  type Hunter, type InsertHunter, hunters,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Ensure tables exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS harvests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    species TEXT NOT NULL,
    sex TEXT NOT NULL,
    age_class TEXT NOT NULL,
    weight REAL,
    sector TEXT NOT NULL,
    stand TEXT,
    notes TEXT
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS camera_sightings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    camera TEXT NOT NULL,
    species TEXT,
    count INTEGER,
    sex TEXT,
    age_class TEXT,
    behavior TEXT,
    notes TEXT,
    temperature REAL,
    moon_phase TEXT
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS log_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    weather TEXT,
    priority TEXT
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS hunters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jagdschein_nr TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TEXT,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    issuer TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    revier TEXT,
    role TEXT,
    photo_url TEXT,
    notes TEXT
  )
`);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHarvests(): Promise<Harvest[]>;
  createHarvest(harvest: InsertHarvest): Promise<Harvest>;
  deleteHarvest(id: number): Promise<void>;
  getCameraSightings(): Promise<CameraSighting[]>;
  createCameraSighting(sighting: InsertCameraSighting): Promise<CameraSighting>;
  getLogEntries(): Promise<LogEntry[]>;
  createLogEntry(entry: InsertLogEntry): Promise<LogEntry>;
  deleteLogEntry(id: number): Promise<void>;
  getHunters(): Promise<Hunter[]>;
  getHunterByNr(nr: string): Promise<Hunter | undefined>;
  createHunter(hunter: InsertHunter): Promise<Hunter>;
  deleteHunter(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async getHarvests(): Promise<Harvest[]> {
    return db.select().from(harvests).orderBy(desc(harvests.date)).all();
  }

  async createHarvest(insertHarvest: InsertHarvest): Promise<Harvest> {
    return db.insert(harvests).values(insertHarvest).returning().get();
  }

  async deleteHarvest(id: number): Promise<void> {
    db.delete(harvests).where(eq(harvests.id, id)).run();
  }

  async getCameraSightings(): Promise<CameraSighting[]> {
    return db.select().from(cameraSightings).orderBy(desc(cameraSightings.date)).all();
  }

  async createCameraSighting(sighting: InsertCameraSighting): Promise<CameraSighting> {
    return db.insert(cameraSightings).values(sighting).returning().get();
  }

  async getLogEntries(): Promise<LogEntry[]> {
    return db.select().from(logEntries).orderBy(desc(logEntries.date)).all();
  }

  async createLogEntry(entry: InsertLogEntry): Promise<LogEntry> {
    return db.insert(logEntries).values(entry).returning().get();
  }

  async deleteLogEntry(id: number): Promise<void> {
    db.delete(logEntries).where(eq(logEntries.id, id)).run();
  }

  async getHunters(): Promise<Hunter[]> {
    return db.select().from(hunters).orderBy(desc(hunters.id)).all();
  }

  async getHunterByNr(nr: string): Promise<Hunter | undefined> {
    return db.select().from(hunters).where(eq(hunters.jagdscheinNr, nr)).get();
  }

  async createHunter(hunter: InsertHunter): Promise<Hunter> {
    return db.insert(hunters).values(hunter).returning().get();
  }

  async deleteHunter(id: number): Promise<void> {
    db.delete(hunters).where(eq(hunters.id, id)).run();
  }
}

export const storage = new DatabaseStorage();

// ── Seed demo hunters on server start (only if table is empty) ──
export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function seedHunters() {
  const count = db.select({ c: sql<number>`count(*)` }).from(hunters).get();
  if (count && count.c > 0) return;

  const demoHunters: InsertHunter[] = [
    {
      jagdscheinNr: "RLP-BKS-2026-0001",
      passwordHash: sha256("waidmannsheil"),
      firstName: "Max",
      lastName: "Mustermann",
      birthDate: "1978-05-14",
      validFrom: "2026-04-01",
      validUntil: "2027-03-31",
      issuer: "LK Bernkastel-Wittlich",
      type: "Jahresjagdschein",
      status: "aktiv",
      revier: "EJB Merschbach",
      role: "P\u00e4chter",
      photoUrl: null,
      notes: null,
    },
    {
      jagdscheinNr: "RLP-BKS-2026-0002",
      passwordHash: sha256("hirsch2026"),
      firstName: "Anna",
      lastName: "J\u00e4gerin",
      birthDate: "1985-09-22",
      validFrom: "2026-04-01",
      validUntil: "2027-03-31",
      issuer: "LK Bernkastel-Wittlich",
      type: "Jahresjagdschein",
      status: "aktiv",
      revier: "EJB Merschbach",
      role: "Begehungsscheininhaber",
      photoUrl: null,
      notes: null,
    },
    {
      jagdscheinNr: "RLP-BKS-2026-0003",
      passwordHash: sha256("jagd123"),
      firstName: "Peter",
      lastName: "Gast",
      birthDate: "1962-11-03",
      validFrom: "2025-04-01",
      validUntil: "2026-04-15",
      issuer: "LK Bernkastel-Wittlich",
      type: "Tagesjagdschein",
      status: "abgelaufen",
      revier: "EJB Merschbach",
      role: "Gast",
      photoUrl: null,
      notes: null,
    },
  ];

  for (const h of demoHunters) {
    db.insert(hunters).values(h).run();
  }
  console.log("[seed] Seeded 3 demo hunters");
}

seedHunters();
