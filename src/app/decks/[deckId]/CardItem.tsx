"use client";

import { useState } from "react";
import type { Card } from "@/db/schema";
import { deleteCard, updateCard } from "../actions";
import { CardForm } from "./CardForm";

/** One card in the deck's list: shows the card, or an edit form for it. */
export function CardItem({ card }: { card: Card }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <CardForm
          action={updateCard.bind(null, card.id)}
          initial={{
            english: card.english,
            spanish: card.spanish,
            alternatives: card.alternatives.join("; "),
            notes: card.notes ?? "",
          }}
          submitLabel="Save changes"
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          autoFocus
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
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
          <span className="text-sm italic text-zinc-500">{card.notes}</span>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-zinc-400 hover:text-blue-600"
        >
          Edit
        </button>
        <form action={deleteCard.bind(null, card.id)}>
          <button className="text-sm text-zinc-400 hover:text-red-600">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
