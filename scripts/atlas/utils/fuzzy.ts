/**
 * Tiny fuzzy matcher — subsequence scoring with bonuses for prefix, word-start,
 * and contiguous runs. Good enough for `atlas find` over a few hundred concepts;
 * no dependency, fully deterministic.
 */
export interface FuzzyHit<T> {
  item: T;
  score: number;
  matched: boolean;
}

export function fuzzyScore(query: string, target: string): number {
  if (query.length === 0) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact / substring fast paths dominate the subsequence score.
  if (t === q) return 1000;
  const idx = t.indexOf(q);
  if (idx === 0) return 800 - t.length;
  if (idx > 0) return 600 - idx - t.length * 0.1;

  // Subsequence walk.
  let qi = 0;
  let score = 0;
  let run = 0;
  let prevMatch = -2;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      run = ti === prevMatch + 1 ? run + 1 : 0;
      score += 10 + run * 5;
      if (ti === 0 || /[\s_./-]/.test(t[ti - 1])) score += 15; // word start
      prevMatch = ti;
      qi++;
    }
  }
  if (qi < q.length) return -1; // not all query chars consumed
  return score - t.length * 0.05;
}

export function fuzzySearch<T>(query: string, items: T[], keys: (item: T) => string[]): FuzzyHit<T>[] {
  const hits: FuzzyHit<T>[] = items.map((item) => {
    let best = -1;
    for (const k of keys(item)) best = Math.max(best, fuzzyScore(query, k));
    return { item, score: best, matched: best >= 0 };
  });
  return hits.filter((h) => h.matched).sort((a, b) => b.score - a.score);
}
