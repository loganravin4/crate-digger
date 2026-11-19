import type { Answer } from "@/data/types";
import { isTier, TIERS, type TierId } from "./tiers";

export const ROUNDS = 7;
export const SECONDS = 30;
export const MAX_POINTS = TIERS["holy-grail"].points;
export const MAX_TOTAL = ROUNDS * MAX_POINTS;

/** The answer's tier. A malformed pack entry falls back to the deepest regular tier rather than crashing a round. */
export function tierOf(answer: Answer): TierId {
  return isTier(answer.tier) ? answer.tier : "white-label";
}

export function pointsFor(tier: TierId | null): number {
  return tier ? TIERS[tier].points : 0;
}

/** Score bands for the final tally, shallow to deep. */
export const BANDS = [
  { min: 0, label: "Browsing", line: "You flipped the front rack. The good stuff is further down." },
  { min: 140, label: "Regular", line: "The clerk knows your face now." },
  { min: 255, label: "Digger", line: "Dusty fingers. You went into the back room." },
  { min: 375, label: "Collector", line: "You found records the shop forgot it had." },
  { min: 490, label: "Vault Keeper", line: "You own the basement key. Absurd." },
] as const;

export function bandFor(total: number) {
  return [...BANDS].reverse().find((b) => total >= b.min) ?? BANDS[0];
}
