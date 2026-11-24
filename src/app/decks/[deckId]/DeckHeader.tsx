"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteDeck, renameDeck, type FormState } from "../actions";

type Props = {
  deckId: number;
  name: string;
  cardCount: number;
};

const plural = (n: number) => `${n} ${n === 1 ? "card" : "cards"}`;

/** Deck title with Review, Rename, and Delete controls. */
export function DeckHeader({ deckId, name, cardCount }: Props) {
  // One piece of state decides what the header shows. Only one mode at a time.
  const [mode, setMode] = useState<"view" | "rename" | "confirmDelete">("view");

  const [renameState, renameAction, renaming] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await renameDeck(deckId, prev, formData);
      if (!result.error) setMode("view");
      return result;
    },
    {},
  );

  if (mode === "rename") {
    return (
      <form
        action={renameAction}
        onKeyDown={(e) => e.key === "Escape" && setMode("view")}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <input
            name="name"
            defaultValue={name}
            required
            maxLength={100}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Deck name"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1 text-2xl font-bold dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            disabled={renaming}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {renaming ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
        {renameState.error && (
          <p className="text-sm text-red-600">{renameState.error}</p>
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{name}</h1>
        {cardCount > 0 && (
          <Link
            href={`/decks/${deckId}/review`}
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Review {plural(cardCount)} →
          </Link>
        )}
      </div>

      {mode === "confirmDelete" ? (
        // Deleting is permanent and takes the cards with it, so it takes two clicks.
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
          <span className="text-sm">
            Delete this deck{cardCount > 0 && <> and its <strong>{plural(cardCount)}</strong></>}?
            This can&apos;t be undone.
          </span>
          <form action={deleteDeck.bind(null, deckId)}>
            <button className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700">
              Yes, delete
            </button>
          </form>
          <button
            autoFocus // the safe choice gets focus, so a stray Enter cancels
            onClick={() => setMode("view")}
            className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-4 text-sm">
          <button onClick={() => setMode("rename")} className="text-zinc-500 hover:text-blue-600">
            Rename
          </button>
          <button
            onClick={() => setMode("confirmDelete")}
            className="text-zinc-500 hover:text-red-600"
          >
            Delete deck
          </button>
        </div>
      )}
    </div>
  );
}
