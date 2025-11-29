import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userFname: varchar("user_fname", { length: 255 }).notNull(),
  userLname: varchar("user_lname", { length: 255 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),
});
