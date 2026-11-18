import type { Tier } from "./score";

export type Pick = {
  promptId: string;
  input: string;
  /** Canonical answer name, or null when it wasn't in the list or time ran out. */
  matched: string | null;
  points: number;
  tier: Tier;
};

export type Run = {
  packId: string;
  dateKey: string;
  picks: Pick[];
  done: boolean;
};

export type Stats = {
  played: number;
  best: number;
  streak: number;
  maxStreak: number;
  lastDate: string | null;
  whiteLabels: number;
};

export type Settings = { relaxedTimer: boolean };

const PREFIX = "crate-digger:v1";
const EMPTY_STATS: Stats = { played: 0, best: 0, streak: 0, maxStreak: 0, lastDate: null, whiteLabels: 0 };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the game still plays, it just won't remember.
  }
}

export function loadRun(packId: string, dateKey: string): Run | null {
  const run = read<Run | null>(`run:${packId}:${dateKey}`, null);
  return run && Array.isArray(run.picks) ? run : null;
}

export function saveRun(run: Run) {
  write(`run:${run.packId}:${run.dateKey}`, run);
}

export function loadStats(packId: string): Stats {
  return read(`stats:${packId}`, EMPTY_STATS);
}

function previousDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Record a finished daily run once. Returns the updated stats. */
export function recordFinish(run: Run): Stats {
  const stats = loadStats(run.packId);
  if (stats.lastDate === run.dateKey) return stats;
  const total = run.picks.reduce((s, p) => s + p.points, 0);
  const streak = stats.lastDate === previousDay(run.dateKey) ? stats.streak + 1 : 1;
  const next: Stats = {
    played: stats.played + 1,
    best: Math.max(stats.best, total),
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastDate: run.dateKey,
    whiteLabels: stats.whiteLabels + run.picks.filter((p) => p.tier === "white-label").length,
  };
  write(`stats:${run.packId}`, next);
  return next;
}

export function loadSettings(): Settings {
  return read("settings", { relaxedTimer: false });
}

export function saveSettings(s: Settings) {
  write("settings", s);
}
