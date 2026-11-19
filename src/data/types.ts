import type { TierId } from "@/lib/tiers";

export type Answer = {
  /** Canonical display name, e.g. "Purple Rain". */
  name: string;
  /** Other spellings players might type. Case, punctuation, accents, and a leading "the" are already handled. */
  aliases?: string[];
  /** Fixed rarity tier, assigned from popularity evidence plus judgment. Each prompt has one holy-grail. */
  tier: TierId;
  /** Optional one-line note shown when this answer lands, in the game's own voice. */
  quip?: string;
};

export type Prompt = {
  id: string;
  /** Imperative prompt shown to the player, e.g. "Name a song by Prince". */
  text: string;
  /** Short clarifier of what counts, e.g. "Solo albums only". Optional. */
  rule?: string;
  answers: Answer[];
};

export type PackFile = {
  id: string;
  prompts: Prompt[];
};
