import type { Prompt } from "@/data/types";

/**
 * Long-tail coverage: every correct answer we found beyond the curated list, all scored as
 * White Label. Stored one file per prompt (public/tails/<id>.json) and fetched only when needed.
 */
const loads = new Map<string, Promise<string[]>>();

export function loadTail(promptId: string): Promise<string[]> {
  let p = loads.get(promptId);
  if (!p) {
    p = fetch(`/tails/${promptId}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
      .catch(() => []);
    loads.set(promptId, p);
  }
  return p;
}

const merged = new Map<string, Prompt>();

/** The prompt with its tail appended. Stable per prompt, so the matcher's index cache holds. */
export function withTail(prompt: Prompt, tail: string[] | undefined): Prompt {
  if (!tail?.length) return prompt;
  const key = `${prompt.id}:${tail.length}`;
  let m = merged.get(key);
  if (!m) {
    m = { ...prompt, answers: [...prompt.answers, ...tail.map((name) => ({ name, tier: "white-label" as const, tail: true as const }))] };
    merged.set(key, m);
  }
  return m;
}
