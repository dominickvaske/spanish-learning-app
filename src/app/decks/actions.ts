"use server";

// Server Actions: functions that run on the server but can be called from a
// <form> in the browser. Next.js turns each call into a POST request.
// TODO(M7): once there are user accounts, every action must check that the
// signed-in user owns the deck/card it touches.

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { parseCardInput, parseDeckName } from "@/lib/cardInput";

/** What a form gets back: an error message, or a marker that it saved. */
export type FormState = { error?: string; savedAt?: number };

export async function createDeck(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseDeckName(formData.get("name"));
  if (!parsed.ok) return { error: parsed.error };

  const [deck] = await db
    .insert(decks)
    .values({ name: parsed.value })
    .returning({ id: decks.id });

  revalidatePath("/decks", "layout"); // refresh /decks and every page under it
  redirect(`/decks/${deck.id}`);
}

function parseCardForm(formData: FormData) {
  return parseCardInput({
    english: formData.get("english"),
    spanish: formData.get("spanish"),
    alternatives: formData.get("alternatives"),
    notes: formData.get("notes"),
  });
}

export async function createCard(
  deckId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCardForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await db.insert(cards).values({ deckId, ...parsed.value });
  } catch {
    // Most likely the deck was deleted in the meantime (foreign key failure).
    return { error: "Couldn't save the card. Does this deck still exist?" };
  }

  revalidatePath("/decks", "layout");
  return { savedAt: Date.now() };
}

export async function updateCard(
  cardId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCardForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const updated = await db
    .update(cards)
    .set(parsed.value)
    .where(eq(cards.id, cardId))
    .returning({ id: cards.id });
  if (updated.length === 0) return { error: "This card no longer exists." };

  revalidatePath("/decks", "layout");
  return { savedAt: Date.now() };
}

export async function deleteCard(cardId: number) {
  await db.delete(cards).where(eq(cards.id, cardId));
  revalidatePath("/decks", "layout");
}
