import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "./schema";
import { cards, cardTags, decks, tags } from "./schema";

// Each test gets a fresh in-memory database built from our real migrations,
// so these tests also check that the migration files are correct.
async function freshDb() {
  const db = drizzle(createClient({ url: ":memory:" }), { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db;
}

let db: Awaited<ReturnType<typeof freshDb>>;

beforeEach(async () => {
  db = await freshDb();
});

async function seed() {
  const [deck] = await db
    .insert(decks)
    .values({ name: "Babbel U1 L2" })
    .returning();
  const [card] = await db
    .insert(cards)
    .values({
      deckId: deck.id,
      english: "What time is it?",
      spanish: "¿Qué hora es?",
    })
    .returning();
  const [tag] = await db
    .insert(tags)
    .values({ name: "asking_for_time" })
    .returning();
  await db.insert(cardTags).values({ cardId: card.id, tagId: tag.id });
  return { deck, card, tag };
}

describe("schema", () => {
  it("fills in defaults: empty alternatives and a created_at date", async () => {
    const { card } = await seed();
    expect(card.alternatives).toEqual([]);
    expect(card.createdAt).toBeInstanceOf(Date);
    expect(Date.now() - card.createdAt.getTime()).toBeLessThan(5000);
  });

  it("round-trips alternatives as a real array", async () => {
    const { card } = await seed();
    await db
      .update(cards)
      .set({ alternatives: ["¿Qué horas son?"] })
      .where(eq(cards.id, card.id));
    const [row] = await db.select().from(cards).where(eq(cards.id, card.id));
    expect(row.alternatives).toEqual(["¿Qué horas son?"]);
  });

  it("deleting a deck deletes its cards and their tag links", async () => {
    const { deck } = await seed();
    await db.delete(decks).where(eq(decks.id, deck.id));
    expect(await db.select().from(cards)).toHaveLength(0);
    expect(await db.select().from(cardTags)).toHaveLength(0);
    expect(await db.select().from(tags)).toHaveLength(1); // tags themselves survive
  });

  it("rejects a card pointing at a deck that doesn't exist", async () => {
    await expect(
      db.insert(cards).values({ deckId: 999, english: "x", spanish: "x" }),
    ).rejects.toThrow();
  });

  it("rejects duplicate tag names", async () => {
    await seed();
    await expect(
      db.insert(tags).values({ name: "asking_for_time" }),
    ).rejects.toThrow();
  });

  it("rejects attaching the same tag to a card twice", async () => {
    const { card, tag } = await seed();
    await expect(
      db.insert(cardTags).values({ cardId: card.id, tagId: tag.id }),
    ).rejects.toThrow();
  });
});
