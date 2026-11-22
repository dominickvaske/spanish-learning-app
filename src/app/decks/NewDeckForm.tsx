"use client";

import { useActionState } from "react";
import { createDeck, type FormState } from "./actions";

export function NewDeckForm() {
  // useActionState wires a server action to a form and gives us back
  // the action's latest return value (state) and whether it's running (pending).
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createDeck,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          required
          maxLength={100}
          placeholder="e.g. Babbel Unit 1, Lesson 3"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "New deck"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
