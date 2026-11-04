import { pgTable, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const portalUsers = pgTable("portal_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  area: text("area").notNull(),
  role: text("role").notNull(),
  editor: boolean("editor").notNull().default(false),
});
export const portalResources = pgTable("portal_resources", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
});
export const portalSessions = pgTable("portal_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => portalUsers.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const portalCodes = pgTable("portal_codes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => portalUsers.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const insertPortalUserSchema = createInsertSchema(portalUsers);
export const insertPortalResourceSchema = createInsertSchema(portalResources);
