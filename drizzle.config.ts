import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle", // generated migration SQL files (commit these)
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
  },
});
