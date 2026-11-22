import { asc, count, desc, eq } from "drizzle-orm";
import { db } from ".";
import { cards, decks } from "./schema";

/** All decks, newest first, with how many cards each has. */
export function listDecks() {
  return db
    .select({
      id: decks.id,
      name: decks.name,
      createdAt: decks.createdAt,
      cardCount: count(cards.id),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt));
}

export async function getDeck(id: number) {
  const [deck] = await db.select().from(decks).where(eq(decks.id, id));
  return deck ?? null;
}

/** A deck's cards in the order they were added. */
export function listCards(deckId: number) {
  return db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(asc(cards.createdAt), asc(cards.id));
}
