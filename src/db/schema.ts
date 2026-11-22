import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// Shared column: creation time, stored as Unix milliseconds (SQLite has no
// date type), but read and written as a JS Date in our code.
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`);

/** Where cards came from, e.g. "Babbel Unit 3, Lesson 2". */
export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey(),
  deckId: integer("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  english: text("english").notNull(),
  spanish: text("spanish").notNull(),
  /** Other known-good answers. Stored as a JSON array string; hints for the AI grader. */
  alternatives: text("alternatives", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  /** Optional context, e.g. "formal (usted)" or "Spain only". */
  notes: text("notes"),
  createdAt: createdAt(),
});

/** What a card is about, e.g. "ser_vs_estar". */
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const cardTags = sqliteTable(
  "card_tags",
  {
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.tagId] })],
);

// TypeScript types derived from the tables, for use elsewhere in the app.
export type Deck = typeof decks.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Tag = typeof tags.$inferSelect;
