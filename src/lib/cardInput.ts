/**
 * Validation for user-entered deck and card fields.
 *
 * This runs on the server. Never trust what the browser sends:
 * anyone can POST to a server action directly, skipping the form's checks.
 */

export const MAX_TEXT_LENGTH = 500;

export type CardInput = {
  english: string;
  spanish: string;
  alternatives: string[];
  notes: string | null;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseDeckName(raw: unknown): ParseResult<string> {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return { ok: false, error: "Deck name is required." };
  if (name.length > 100) return { ok: false, error: "Deck name is too long." };
  return { ok: true, value: name };
}

/**
 * Alternatives are typed in one box, separated by semicolons:
 *   "¿Qué horas son?; ¿Me dices la hora?"
 */
export function parseAlternatives(raw: string, spanish: string): string[] {
  const seen = new Set<string>([spanish]);
  const result: string[] = [];
  for (const part of raw.split(";")) {
    const alt = part.trim();
    if (alt && !seen.has(alt)) {
      seen.add(alt);
      result.push(alt);
    }
  }
  return result;
}

export function parseCardInput(fields: {
  english: unknown;
  spanish: unknown;
  alternatives: unknown;
  notes: unknown;
}): ParseResult<CardInput> {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const english = str(fields.english);
  const spanish = str(fields.spanish);
  const notes = str(fields.notes);
  const alternatives = parseAlternatives(str(fields.alternatives), spanish);

  if (!english) return { ok: false, error: "English is required." };
  if (!spanish) return { ok: false, error: "Spanish is required." };

  const tooLong = [english, spanish, notes, ...alternatives].some(
    (s) => s.length > MAX_TEXT_LENGTH,
  );
  if (tooLong) {
    return { ok: false, error: `Each field must be under ${MAX_TEXT_LENGTH} characters.` };
  }

  return {
    ok: true,
    value: { english, spanish, alternatives, notes: notes || null },
  };
}
