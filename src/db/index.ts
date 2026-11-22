import "server-only"; // build fails if browser code ever imports the database
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
});

export const db = drizzle(client, { schema });
