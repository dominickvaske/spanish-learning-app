/**
 * Typed sequences that turn into Spanish characters as you type.
 * Key = what you type, value = what replaces it.
 */
export const ACCENT_RULES: Record<string, string> = {
  "a'": "á",
  "e'": "é",
  "i'": "í",
  "o'": "ó",
  "u'": "ú",
  "A'": "Á",
  "E'": "É",
  "I'": "Í",
  "O'": "Ó",
  "U'": "Ú",
  'u"': "ü",
  'U"': "Ü",
  "n~": "ñ",
  "N~": "Ñ",
  "??": "¿",
  "!!": "¡",
};

/** Which sequence matched, and what it should become. */
export type AccentMatch = {
  sequence: string;
  replacement: string;
};

/**
 * Looks at the text just before the cursor. If it ENDS with one of the
 * sequences in ACCENT_RULES, returns the match. Otherwise returns null.
 *
 *   findAccentReplacement("pin~")  -> { sequence: "n~", replacement: "ñ" }
 *   findAccentReplacement("hola")  -> null
 */
export function findAccentReplacement(
  textBeforeCursor: string,
): AccentMatch | null {
  for (const [sequence, replacement] of Object.entries(ACCENT_RULES)) {
    if (textBeforeCursor.endsWith(sequence)) {
      return { sequence, replacement };
    }
  }

  return null;
}
