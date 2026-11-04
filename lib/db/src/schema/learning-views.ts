import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { portalUsers, portalResources } from "./portal";

/** One page-open event; the client visit ID makes transport retries idempotent. */
export const learningViews = pgTable("portal_learning_views", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => portalUsers.id),
  resourceId: text("resource_id").notNull().references(() => portalResources.id),
  deviceId: text("device_id").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("learning_views_person_module_idx").on(table.userId, table.resourceId, table.deviceId),
]);
export const insertLearningViewSchema = createInsertSchema(learningViews);
