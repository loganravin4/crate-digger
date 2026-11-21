import type { Answer, Prompt } from "@/data/types";

/** Lowercase, strip accents, "&" -> "and", drop a leading "the", remove punctuation and spaces. */
export function normalize(raw: string): string {
  let s = raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\$/g, "s")
    .trim();
  s = s.replace(/^the\s+/, "");
  return s.replace(/[^a-z0-9]+/g, "");
}

/** Same key with any parenthetical or "feat." tail removed, so "Umbrella (feat. Jay-Z)" matches "Umbrella". */
function loose(raw: string): string {
  return normalize(
    raw
      .replace(/\s*[([][^)\]]*[)\]]\s*/g, " ")
      .replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, ""),
  );
}

type Index = { key: string; answer: Answer }[];
const cache = new WeakMap<Prompt, Index>();

function indexFor(prompt: Prompt): Index {
  const hit = cache.get(prompt);
  if (hit) return hit;
  const out: Index = [];
  for (const answer of prompt.answers) {
    const forms = [answer.name, ...(answer.aliases ?? [])];
    const keys = new Set<string>();
    for (const f of forms) {
      keys.add(normalize(f));
      keys.add(loose(f));
    }
    for (const key of keys) if (key) out.push({ key, answer });
  }
  cache.set(prompt, out);
  return out;
}

function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function tolerance(len: number): number {
  if (len < 5) return 0;
  if (len < 9) return 1;
  return 2;
}

export type MatchResult = { answer: Answer; corrected: boolean };

/**
 * Find the answer a player meant. Exact (normalized) first, then a small typo allowance.
 * `corrected` is true for a typo match, so the game can ask "did you mean…?" first.
 */
export function matchDetailed(prompt: Prompt, input: string): MatchResult | null {
  const key = normalize(input);
  if (!key) return null;
  const looseKey = loose(input);
  const exact = indexFor(prompt).find((e) => e.key === key || e.key === looseKey);
  if (exact) {
    // A nickname or alias ("pharrell" for Pharrell Williams) is confirmed first, the way a typo is.
    const canonical = [normalize(exact.answer.name), loose(exact.answer.name)];
    return { answer: exact.answer, corrected: !canonical.includes(key) && !canonical.includes(looseKey) };
  }
  const fuzzy = match(prompt, input);
  return fuzzy ? { answer: fuzzy, corrected: true } : null;
}

/** Find the answer a player meant. Exact (normalized) first, then a small typo allowance. */
export function match(prompt: Prompt, input: string): Answer | null {
  const key = normalize(input);
  if (!key) return null;
  const looseKey = loose(input);
  const index = indexFor(prompt);

  const exact = index.find((e) => e.key === key || e.key === looseKey);
  if (exact) return exact.answer;

  const max = tolerance(key.length);
  if (max === 0) return null;
  let best: Answer | null = null;
  let bestD = max + 1;
  let tie = false;
  for (const e of index) {
    // Typo help only within the curated list; the long tail would turn wrong guesses into odd suggestions.
    if (e.answer.tail || tolerance(e.key.length) === 0) continue;
    const d = distance(key, e.key, max);
    if (d < bestD) {
      bestD = d;
      best = e.answer;
      tie = false;
    } else if (d === bestD && best && e.answer !== best) {
      tie = true;
    }
  }
  if (!best || bestD > max || tie) return null;
  return best;
}
