import { pgTable, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  text: varchar("text", { length: 255 }).default("no_text"),
  fullName: varchar("full_name", { length: 255 }).default("whatsapp_user"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
