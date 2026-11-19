/**
 * Fixed rarity tiers. Every answer in a tier scores the same; each prompt has one
 * designated holy-grail worth 100. Order is depth order in the dig, shallow to deep.
 */
export const TIER_IDS = ["radio-edit", "staff-pick", "album-track", "b-side", "white-label", "holy-grail"] as const;
export type TierId = (typeof TIER_IDS)[number];

export type TierInfo = {
  label: string;
  points: number;
  /** Where in the shop the record lands. */
  stratum: string;
  note: string;
  glyph: string;
  /** Share-text mark, colored to match the tier's in-game color. */
  emoji: string;
};

export const TIERS: Record<TierId, TierInfo> = {
  "radio-edit": { label: "Radio Edit", points: 10, stratum: "Front rack", note: "The one everybody says first", glyph: "○", emoji: "⚫" },
  "staff-pick": { label: "Staff Pick", points: 15, stratum: "Staff picks shelf", note: "The obscure pick everyone thinks only they know", glyph: "◇", emoji: "🟣" },
  "album-track": { label: "Album Track", points: 30, stratum: "Used bins", note: "Solid. Real fans know it", glyph: "◐", emoji: "🔵" },
  "b-side": { label: "B-Side", points: 60, stratum: "Back room", note: "Now you're digging", glyph: "●", emoji: "🟡" },
  "white-label": { label: "White Label", points: 85, stratum: "Basement", note: "Almost nobody pulls this one", glyph: "◉", emoji: "⚪" },
  "holy-grail": { label: "Holy Grail", points: 100, stratum: "The vault", note: "The record every digger is looking for", glyph: "✦", emoji: "🏆" },
};

export const MISS = { label: "No find", points: 0, glyph: "×", emoji: "✖️" } as const;

export function isTier(v: unknown): v is TierId {
  return typeof v === "string" && (TIER_IDS as readonly string[]).includes(v);
}

export function depthOf(tier: TierId): number {
  return TIER_IDS.indexOf(tier);
}
