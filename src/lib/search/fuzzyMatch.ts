/**
 * Lightweight fuzzy matching for typo tolerance.
 * Uses Levenshtein distance — cheap and good enough for recipe names and
 * ingredient strings that are typically 4–20 characters long.
 */

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const dp = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) dp[j] = j;
  for (let i = 1; i <= al; i++) {
    let prev = i - 1;
    let curr = i;
    for (let j = 1; j <= bl; j++) {
      const next = dp[j];
      curr =
        a.charCodeAt(i - 1) === b.charCodeAt(j - 1)
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      dp[j - 1] = prev;
      prev = next;
      dp[j] = curr;
    }
    dp[bl] = curr;
  }
  return dp[bl];
}

/**
 * Returns true when `query` is "close enough" to `target` to be considered
 * a typo. Threshold scales with length so single short typos count.
 */
export function isFuzzyMatch(query: string, target: string): boolean {
  if (query.length < 3) return false;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // Compare against each word in target
  for (const word of t.split(/\s+/)) {
    if (word.length < 3) continue;
    const tolerance = word.length <= 5 ? 1 : word.length <= 8 ? 2 : 3;
    if (editDistance(q, word) <= tolerance) return true;
  }
  return false;
}

/**
 * Find the best-matching candidate for a query and return [match, distance].
 * Used by "Did you mean…" suggestions.
 */
export function bestFuzzyMatch(
  query: string,
  candidates: string[],
): { match: string; distance: number } | null {
  if (query.length < 3) return null;
  const q = query.toLowerCase();
  let best: { match: string; distance: number } | null = null;
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (lower === q) return { match: c, distance: 0 };
    // Compare against the shortest word in the candidate to favor exact-word fuzzies
    const words = lower.split(/\s+/);
    let bestWordDist = Infinity;
    for (const w of words) {
      if (w.length < 3) continue;
      const d = editDistance(q, w);
      if (d < bestWordDist) bestWordDist = d;
    }
    if (bestWordDist === Infinity) continue;
    if (!best || bestWordDist < best.distance) {
      best = { match: c, distance: bestWordDist };
    }
  }
  if (!best) return null;
  // Only return if the distance is reasonable
  if (best.distance > Math.max(1, Math.floor(q.length / 3))) return null;
  return best;
}
