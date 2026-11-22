"use client";

import { useActionState, useRef, useState } from "react";
import { SpanishInput } from "@/components/SpanishInput";
import type { FormState } from "../actions";

const EMPTY = { english: "", spanish: "", alternatives: "", notes: "" };

const inputClass =
  "rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900";

type Props = {
  /** The createCard server action, with this deck's id already filled in. */
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function NewCardForm({ action }: Props) {
  // Every field is "controlled" (its value lives in React state). That way the
  // text survives a validation error, and we decide exactly when to clear it.
  const [fields, setFields] = useState(EMPTY);
  const englishRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (!result.error) {
        setFields(EMPTY); // ready for the next card
        englishRef.current?.focus();
      }
      return result;
    },
    {},
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">English</span>
        <input
          ref={englishRef}
          name="english"
          value={fields.english}
          onChange={(e) => set("english")(e.target.value)}
          placeholder="What time is it?"
          autoComplete="off"
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="spanish" className="text-sm font-medium">
          Spanish
        </label>
        <SpanishInput
          id="spanish"
          name="spanish"
          value={fields.spanish}
          onChange={set("spanish")}
          placeholder="??Que' hora es?"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="alternatives" className="text-sm font-medium">
          Other acceptable answers{" "}
          <span className="font-normal text-zinc-500">
            (optional, separate with ;)
          </span>
        </label>
        <SpanishInput
          id="alternatives"
          name="alternatives"
          value={fields.alternatives}
          onChange={set("alternatives")}
          hideButtons
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          Notes <span className="font-normal text-zinc-500">(optional)</span>
        </span>
        <input
          name="notes"
          value={fields.notes}
          onChange={(e) => set("notes")(e.target.value)}
          placeholder="e.g. formal (usted)"
          autoComplete="off"
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add card"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
