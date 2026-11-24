import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDeck, listCards } from "@/db/queries";
import type { ReviewCard } from "@/lib/review";
import { shuffle } from "@/lib/shuffle";
import { ReviewSession } from "./ReviewSession";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  await connection(); // fresh data and a fresh shuffle on every visit
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id)) notFound();

  const deck = await getDeck(id);
  if (!deck) notFound();

  // Send the browser only the fields the review screen needs.
  const cards: ReviewCard[] = (await listCards(id)).map((c) => ({
    id: c.id,
    english: c.english,
    spanish: c.spanish,
    alternatives: c.alternatives,
    notes: c.notes,
  }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <Link href={`/decks/${id}`} className="text-sm text-blue-600 hover:underline">
          ← {deck.name}
        </Link>
        <h1 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Review
        </h1>
      </div>
      {cards.length === 0 ? (
        <p className="text-zinc-500">This deck has no cards yet.</p>
      ) : (
        // Shuffled here on the server, so the server-rendered HTML and the
        // browser agree on the order (shuffling in the browser during the
        // first render would make them disagree).
        <ReviewSession deckId={id} cards={shuffle(cards)} />
      )}
    </main>
  );
}
