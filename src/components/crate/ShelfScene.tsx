"use client";

import { useEffect, useRef, useState } from "react";
import type { PackMeta } from "@/data/packs";
import { PALETTES } from "./CrateScene";
import type { ShelfEngine, ShelfRecord } from "./shelf";

/** The day's pulls, face-out on a lit shelf. Decorative; the dig log below carries the same facts. */
export function ShelfScene({ records, tone, className }: { records: ShelfRecord[]; tone: PackMeta["tone"]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const key = records.map((r) => `${r.tier}:${r.answer}`).join("|");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    let cleanup = () => {};
    void import("./shelf").then(({ ShelfEngine: Shelf }) => {
      if (cancelled) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let engine: ShelfEngine;
      try {
        engine = new Shelf(canvas, records, PALETTES[tone], reduced);
      } catch {
        setFailed(true);
        return;
      }
      engine.start();
      canvas.classList.add("scene-in");
      const ro = new ResizeObserver(() => engine.resize());
      ro.observe(canvas);
      cleanup = () => {
        ro.disconnect();
        engine.dispose();
      };
    });
    return () => {
      cancelled = true;
      cleanup();
    };
    // Rebuild only when the records themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tone]);

  if (failed) return null;
  return <canvas ref={ref} aria-hidden className={className} />;
}
