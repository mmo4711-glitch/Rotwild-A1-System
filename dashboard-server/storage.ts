import {
  type User, type InsertUser, users,
  type Harvest, type InsertHarvest, harvests,
  type CameraSighting, type InsertCameraSighting, cameraSightings,
  type LogEntry, type InsertLogEntry, logEntries,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
