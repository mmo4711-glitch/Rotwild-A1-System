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

// ── Hunters (Jagdschein-Verifizierung) ───────────────────────
export const hunters = sqliteTable("hunters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jagdscheinNr: text("jagdschein_nr").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date"),
  validFrom: text("valid_from").notNull(),
  validUntil: text("valid_until").notNull(),
  issuer: text("issuer").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  revier: text("revier"),
  role: text("role"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
});

export const insertHunterSchema = createInsertSchema(hunters).omit({
  id: true,
});

export type InsertHunter = z.infer<typeof insertHunterSchema>;
export type Hunter = typeof hunters.$inferSelect;
