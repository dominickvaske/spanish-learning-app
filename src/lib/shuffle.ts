/**
 * Returns a shuffled copy (Fisher–Yates). The input is not changed.
 * `random` can be swapped out in tests to get a predictable order.
 */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
