import { pgTable, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  text: varchar("text", { length: 255 }).default("nil"),
  fullName: varchar("full_name", { length: 255 }).default("whatsapp_user"),
  type: varchar("type", { length: 20 }).default("nil"),
  file: varchar("file", { length: 255 }).default("nil"),
  mobileNumber: varchar("mobile_number", { length: 255 }).default("0000"),
  // embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
