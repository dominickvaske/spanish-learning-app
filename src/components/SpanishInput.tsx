"use client";

import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { findAccentReplacement, type AccentMatch } from "@/lib/accents";

const BUTTON_CHARS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

/** The conversion that just happened, so Backspace can undo it. */
type LastConversion = AccentMatch & { end: number };

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Form field name, so the value is included when a form is submitted. */
  name?: string;
  id?: string;
  /** Hide the á é í … buttons (e.g. for secondary fields). */
  hideButtons?: boolean;
  autoFocus?: boolean;
};

/**
 * A text input that turns typed sequences (n~, e', ??) into Spanish
 * characters as you type. Pressing Backspace right after a conversion
 * restores the literal sequence instead.
 */
export function SpanishInput({
  value,
  onChange,
  placeholder,
  name,
  id,
  hideButtons = false,
  autoFocus = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Where to put the cursor after React re-renders with the new text.
  const pendingCursor = useRef<number | null>(null);
  const lastConversion = useRef<LastConversion | null>(null);

  // Without this, changing the text from code would jump the cursor to the end.
  useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      const pos = pendingCursor.current;
      inputRef.current.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  });

  function setText(text: string, cursor: number) {
    pendingCursor.current = cursor;
    onChange(text);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    lastConversion.current = null;

    // Only convert when a character was typed. Deleting text to leave
    // "n~" behind (or pasting) should not trigger a conversion.
    const inputType = (e.nativeEvent as InputEvent).inputType;
    const match =
      inputType === "insertText"
        ? findAccentReplacement(text.slice(0, cursor))
        : null;

    if (!match) {
      onChange(text);
      return;
    }

    const start = cursor - match.sequence.length;
    const end = start + match.replacement.length;
    lastConversion.current = { ...match, end };
    setText(text.slice(0, start) + match.replacement + text.slice(cursor), end);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const conv = lastConversion.current;
    if (e.key !== "Backspace" || !conv) return;

    const input = e.currentTarget;
    const start = conv.end - conv.replacement.length;
    const cursorRightAfterConversion =
      input.selectionStart === conv.end && input.selectionEnd === conv.end;
    if (!cursorRightAfterConversion) return;

    e.preventDefault(); // stop the browser's normal delete
    lastConversion.current = null;
    setText(
      value.slice(0, start) + conv.sequence + value.slice(conv.end),
      start + conv.sequence.length,
    );
  }

  function insertChar(char: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    lastConversion.current = null;
    setText(value.slice(0, start) + char + value.slice(end), start + char.length);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        name={name}
        lang="es"
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="rounded-lg border border-zinc-300 px-4 py-3 text-xl dark:border-zinc-700 dark:bg-zinc-900"
      />
      {!hideButtons && (
        <div className="flex flex-wrap gap-1">
          {BUTTON_CHARS.map((char) => (
            <button
              key={char}
              type="button"
              // preventDefault on mousedown keeps focus (and the cursor) in the input
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertChar(char)}
              className="h-9 w-9 rounded border border-zinc-300 text-lg hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {char}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
