import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",   // relative to project root, not this file
  out: "./drizzle/migrations",    // where migrations will be generated
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
