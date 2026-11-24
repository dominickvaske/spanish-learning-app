/**
 * Simple (non-AI) answer checking, used until milestone 2.
 *
 * - "correct": matches an accepted answer, ignoring case, spacing,
 *   and punctuation (¿ ? ¡ ! . , etc.)
 * - "almost": would be correct except for accents/tildes (que → qué, ano → año),
 *   or one small typo in a longer answer (olivdamos → olvidamos)
 * - "wrong": anything else, including a blank answer
 *
 * Typo tolerance is deliberately small: in Spanish a one-letter difference is
 * often a real grammar mistake (mezcla/mezcle, hablo/habla), which the AI
 * grader in milestone 2 will judge properly.
 */

export type Verdict = "correct" | "almost" | "wrong";

export type CheckResult = {
  verdict: Verdict;
  /** Why an answer is "almost". */
  reason?: "accents" | "spelling";
  /** The accepted answer it matched, or the main answer if wrong. */
  expected: string;
};

/** Lowercase, drop punctuation, collapse whitespace. Accents are kept. */
export function normalize(text: string): string {
  return text
    .normalize("NFC") // "é" can be stored 2 ways in Unicode; pick one
    .toLowerCase()
    .replace(/\p{P}/gu, " ") // \p{P} = any punctuation character
    .replace(/\s+/g, " ")
    .trim();
}

/** "qué año" → "que ano". Splits letters from their accent marks, then drops the marks. */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

/**
 * @param typed what the user typed
 * @param accepted the card's main answer first, then its alternatives
 */
export function checkAnswer(typed: string, accepted: string[]): CheckResult {
  const answer = normalize(typed);
  if (!answer) return { verdict: "wrong", expected: accepted[0] };

  for (const a of accepted) {
    if (normalize(a) === answer) return { verdict: "correct", expected: a };
  }

  const bare = stripAccents(answer);
  for (const a of accepted) {
    if (stripAccents(normalize(a)) === bare) {
      return { verdict: "almost", reason: "accents", expected: a };
    }
  }

  if (bare.length >= MIN_LENGTH_FOR_TYPOS) {
    for (const a of accepted) {
      if (editDistance(stripAccents(normalize(a)), bare) <= 1) {
        return { verdict: "almost", reason: "spelling", expected: a };
      }
    }
  }

  return { verdict: "wrong", expected: accepted[0] };
}

/** Short answers get no typo tolerance: "pero" vs "perro" is a different word. */
export const MIN_LENGTH_FOR_TYPOS = 8;

/**
 * How many single-letter edits turn `a` into `b`: insert, delete, replace,
 * or swap two neighbouring letters ("olivdamos" → "olvidamos" is 1 edit).
 * (Optimal string alignment distance, a variant of Levenshtein distance.)
 */
export function editDistance(a: string, b: string): number {
  // d[i][j] = edits to turn the first i letters of a into the first j of b
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // delete
        d[i][j - 1] + 1, // insert
        d[i - 1][j - 1] + cost, // replace (or keep)
      );
      const swapped = i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
      if (swapped) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
