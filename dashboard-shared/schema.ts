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
