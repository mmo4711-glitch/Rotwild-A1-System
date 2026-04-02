import { type User, type InsertUser, users, type Harvest, type InsertHarvest, harvests } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Ensure harvests table exists
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

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHarvests(): Promise<Harvest[]>;
  createHarvest(harvest: InsertHarvest): Promise<Harvest>;
  deleteHarvest(id: number): Promise<void>;
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
}

export const storage = new DatabaseStorage();
