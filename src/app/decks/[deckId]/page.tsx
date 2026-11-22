import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeck, listCards } from "@/db/queries";
import { createCard, deleteCard } from "../actions";
import { NewCardForm } from "./NewCardForm";

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
        <h1 className="text-3xl font-bold">{deck.name}</h1>
      </div>

      {/* .bind fills in the first argument (deck.id) ahead of time */}
      <NewCardForm action={createCard.bind(null, deck.id)} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </h2>
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div className="flex flex-col">
                <span>{card.english}</span>
                <span lang="es" className="text-lg font-medium">
                  {card.spanish}
                </span>
                {card.alternatives.length > 0 && (
                  <span lang="es" className="text-sm text-zinc-500">
                    Also: {card.alternatives.join(" · ")}
                  </span>
                )}
                {card.notes && (
                  <span className="text-sm italic text-zinc-500">
                    {card.notes}
                  </span>
                )}
              </div>
              {/* A plain form posting to a server action: works without client JS */}
              <form action={deleteCard.bind(null, card.id)}>
                <button className="text-sm text-zinc-400 hover:text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
