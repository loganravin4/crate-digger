export type Answer = {
  /** Canonical display name, e.g. "Purple Rain". */
  name: string;
  /** Other spellings players might type, e.g. ["purple rain (song)"]. Not needed for case or punctuation. */
  aliases?: string[];
  /** Estimated share of players (1-100) who would give this answer. Seeded estimate, not measured. */
  pop: number;
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
