"use client";

import { useSyncExternalStore } from "react";
import { issueNumber, localDateKey } from "@/lib/daily";
import { loadRun, loadStats } from "@/lib/storage";

type Snapshot = { issue: string; line: string; streak: number } | null;
const cache = new Map<string, { key: string; value: Snapshot }>();

function read(packId: string): Snapshot {
  const date = localDateKey();
  const run = loadRun(packId, date);
  const stats = loadStats(packId);
  const line = run?.done
    ? `Played · ${run.picks.reduce((s, p) => s + p.points, 0)} pts`
    : run && run.picks.length
      ? `In progress · track ${run.picks.length + 1}`
      : "Today's set is waiting";
  const key = `${date}|${line}|${stats.streak}`;
  const hit = cache.get(packId);
  if (hit && hit.key === key) return hit.value;
  const value = { issue: issueNumber(date), line, streak: stats.streak };
  cache.set(packId, { key, value });
  return value;
}

const noop = () => () => {};

/** Per-viewer status printed on a sleeve. Server render shows the neutral line. */
export function SleeveStatus({ packId }: { packId: string }) {
  const snap = useSyncExternalStore(noop, () => read(packId), () => null);
  return (
    <span className="tnum flex items-end justify-between gap-3">
      <span>{snap?.line ?? "Today's set is waiting"}</span>
      <span className="text-right">
        {snap ? `No. ${snap.issue}` : "Daily"}
        {snap && snap.streak > 1 ? ` · ${snap.streak}-day streak` : ""}
      </span>
    </span>
  );
}

export function TodayLine() {
  const label = useSyncExternalStore(
    noop,
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    () => "",
  );
  return <span suppressHydrationWarning>{label}</span>;
}
