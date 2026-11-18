import type { Prompt } from "@/data/types";
import { ROUNDS } from "./score";

/** Day 1 of the catalog. Issue numbers count from here. */
const EPOCH = Date.UTC(2026, 10, 18);

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Days since EPOCH for a YYYY-MM-DD key, using the calendar date only. */
export function dayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.max(0, Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000));
}

export function issueNumber(dateKey: string): string {
  return String(dayIndex(dateKey) + 1).padStart(3, "0");
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Same six prompts for everyone on a date. The pool is shuffled once per cycle
 * and dealt in slices, so no prompt repeats until the whole pool has been used.
 */
export function dailyPrompts(packId: string, pool: Prompt[], dateKey: string): Prompt[] {
  const perCycle = Math.max(1, Math.floor(pool.length / ROUNDS));
  const day = dayIndex(dateKey);
  const cycle = Math.floor(day / perCycle);
  const order = shuffle(pool, hash(`${packId}:${cycle}`));
  const start = (day % perCycle) * ROUNDS;
  return order.slice(start, start + ROUNDS);
}

export function practicePrompts(pool: Prompt[]): Prompt[] {
  return shuffle(pool, Math.floor(Math.random() * 2 ** 31)).slice(0, ROUNDS);
}
