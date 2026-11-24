import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeck, listCards } from "@/db/queries";
import { createCard } from "../actions";
import { CardForm } from "./CardForm";
import { CardItem } from "./CardItem";
import { DeckHeader } from "./DeckHeader";

// The [deckId] folder name makes this a dynamic route: /decks/7 → deckId = "7".
export default async function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id)) notFound(); // e.g. /decks/banana

  const deck = await getDeck(id);
  if (!deck) notFound();
  const cards = await listCards(id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <Link href="/decks" className="text-sm text-blue-600 hover:underline">
          ← All decks
        </Link>
        <DeckHeader deckId={deck.id} name={deck.name} cardCount={cards.length} />
      </div>

      {/* .bind fills in the first argument (deck.id) ahead of time */}
      <CardForm
        action={createCard.bind(null, deck.id)}
        submitLabel="Add card"
        resetOnSave
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </h2>
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </ul>
      </section>
    </main>
  );
}
