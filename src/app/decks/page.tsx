import Link from "next/link";
import { connection } from "next/server";
import { listDecks } from "@/db/queries";
import { NewDeckForm } from "./NewDeckForm";

// A Server Component: this runs on the server, can query the database
// directly, and sends finished HTML to the browser.
export default async function DecksPage() {
  // "Wait for a real request." Without this, the local database answers so
  // fast that Next.js would bake the deck list into the build as a frozen
  // snapshot. loading.tsx is shown in the meantime.
  await connection();
  const decks = await listDecks();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">Decks</h1>
      <NewDeckForm />

      {decks.length === 0 ? (
        <p className="text-zinc-500">
          No decks yet. Create one for the Babbel lesson you just finished.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/decks/${deck.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="font-medium">{deck.name}</span>
                <span className="text-sm text-zinc-500">
                  {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
