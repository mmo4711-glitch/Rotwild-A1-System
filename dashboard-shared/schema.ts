import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const harvests = sqliteTable("harvests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  species: text("species").notNull(),
  sex: text("sex").notNull(),
  ageClass: text("age_class").notNull(),
  weight: real("weight"),
  sector: text("sector").notNull(),
  stand: text("stand"),
  notes: text("notes"),
});

export const insertHarvestSchema = createInsertSchema(harvests).omit({
  id: true,
});

export type InsertHarvest = z.infer<typeof insertHarvestSchema>;
export type Harvest = typeof harvests.$inferSelect;

// ── Camera Sightings (Wildkamera) ────────────────────────────
export const cameraSightings = sqliteTable("camera_sightings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  time: text("time").notNull(),
  camera: text("camera").notNull(),
  species: text("species"),
  count: integer("count"),
  sex: text("sex"),
  ageClass: text("age_class"),
  behavior: text("behavior"),
  notes: text("notes"),
  temperature: real("temperature"),
  moonPhase: text("moon_phase"),
});

export const insertCameraSightingSchema = createInsertSchema(cameraSightings).omit({
  id: true,
});

export type InsertCameraSighting = z.infer<typeof insertCameraSightingSchema>;
export type CameraSighting = typeof cameraSightings.$inferSelect;

// ── Log Entries (Reviertagebuch) ─────────────────────────────
export const logEntries = sqliteTable("log_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  time: text("time"),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sector: text("sector"),
  weather: text("weather"),
  priority: text("priority"),
});

export const insertLogEntrySchema = createInsertSchema(logEntries).omit({
  id: true,
});

export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type LogEntry = typeof logEntries.$inferSelect;
