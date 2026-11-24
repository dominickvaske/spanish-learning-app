"use client";

import {
  useActionState,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { SpanishInput } from "@/components/SpanishInput";
import type { FormState } from "../actions";

export type CardFields = {
  english: string;
  spanish: string;
  alternatives: string; // "a; b; c", as typed in the box
  notes: string;
};

export const EMPTY_CARD: CardFields = {
  english: "",
  spanish: "",
  alternatives: "",
  notes: "",
};

const inputClass =
  "rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900";

type Props = {
  /** A server action with its first argument (deck id or card id) already bound. */
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: CardFields;
  submitLabel: string;
  /** Called after a successful save. */
  onSaved?: () => void;
  /** If given, shows a Cancel button (and Escape cancels). */
  onCancel?: () => void;
  /** Clear the fields after saving (for "add another card" flow). */
  resetOnSave?: boolean;
  autoFocus?: boolean;
};

/** The add-card and edit-card form. One component so the two can't drift apart. */
export function CardForm({
  action,
  initial = EMPTY_CARD,
  submitLabel,
  onSaved,
  onCancel,
  resetOnSave = false,
  autoFocus = false,
}: Props) {
  // Controlled fields: values live in React state, so they survive a
  // validation error and we decide exactly when to clear them.
  const [fields, setFields] = useState(initial);
  const englishRef = useRef<HTMLInputElement>(null);
  // Unique ids per form instance. Several forms can be on the page at once
  // (add form + an edit form), and HTML ids must be unique for labels to work.
  const uid = useId();

  const set = (key: keyof CardFields) => (value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (!result.error) {
        if (resetOnSave) {
          setFields(EMPTY_CARD);
          englishRef.current?.focus();
        }
        onSaved?.();
      }
      return result;
    },
    {},
  );

  // Enter moves to the next field instead of saving a half-finished card.
  // Enter in the last field, or Ctrl/Cmd+Enter anywhere, saves.
  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return; // e.g. Enter on a button

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
      return;
    }
    const inputs = Array.from(
      e.currentTarget.querySelectorAll<HTMLInputElement>("input[name]"),
    );
    const next = inputs[inputs.indexOf(target) + 1];
    if (next) {
      e.preventDefault();
      next.focus();
    }
    // No next field: let the browser submit the form as usual.
  }

  return (
    <form
      action={formAction}
      onKeyDown={handleKeyDown}
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
          autoFocus={autoFocus}
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-spanish`} className="text-sm font-medium">
          Spanish
        </label>
        <SpanishInput
          id={`${uid}-spanish`}
          name="spanish"
          value={fields.spanish}
          onChange={set("spanish")}
          placeholder="??Que' hora es?"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-alternatives`} className="text-sm font-medium">
          Other acceptable answers{" "}
          <span className="font-normal text-zinc-500">
            (optional, separate with ;)
          </span>
        </label>
        <SpanishInput
          id={`${uid}-alternatives`}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        )}
        <span className="text-xs text-zinc-500">
          Enter → next field · Ctrl+Enter → save
          {onCancel && " · Esc → cancel"}
        </span>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
