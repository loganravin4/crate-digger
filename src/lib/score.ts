import type { Answer } from "@/data/types";

export const ROUNDS = 6;
export const SECONDS = 30;
/** Scale for the rarity curve; the best possible answer (pop 1) scores 90. */
const SCALE = 100;
export const MAX_POINTS = 90;

export type Tier = "white-label" | "b-side" | "album-track" | "radio-edit" | "miss";

export const TIERS: Record<Tier, { label: string; glyph: string; note: string }> = {
  "white-label": { label: "White Label", glyph: "◉", note: "Almost nobody has this one" },
  "b-side": { label: "B-Side", glyph: "●", note: "A real dig" },
  "album-track": { label: "Album Track", glyph: "◐", note: "Solid, not obscure" },
  "radio-edit": { label: "Radio Edit", glyph: "○", note: "Everyone knows it" },
  miss: { label: "Not listed", glyph: "×", note: "No match" },
};

/** Rarer answers score higher. pop 1 -> 90, pop 10 -> 68, pop 35 -> 41, pop 50 -> 29. */
export function pointsFor(answer: Answer | null): number {
  if (!answer) return 0;
  const p = Math.min(100, Math.max(1, answer.pop));
  return Math.max(5, Math.round(SCALE * (1 - Math.sqrt(p / 100))));
}

export function tierFor(points: number, matched: boolean): Tier {
  if (!matched) return "miss";
  if (points >= 90) return "white-label";
  if (points >= 70) return "b-side";
  if (points >= 40) return "album-track";
  return "radio-edit";
}
