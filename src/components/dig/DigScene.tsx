"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PackMeta } from "@/data/packs";
import type { TierId } from "@/lib/tiers";
import { DigWorld } from "./world";

/** Field and on-field colors per pack tone. Mirrors the tone tokens in globals.css. */
const PALETTES: Record<PackMeta["tone"], { field: string; on: string }> = {
  ochre: { field: "#e4ae1f", on: "#16130f" },
  vermilion: { field: "#bf3a22", on: "#fffaf5" },
  cobalt: { field: "#2b57a6", on: "#f3ecdd" },
};

export type DigSceneHandle = {
  drop: (tier: TierId | null, cb?: { onLayer?: (d: number) => void; onLand?: () => void }) => void;
  rise: () => void;
  panTo: (y: number, ms?: number) => void;
  layerTop: (depth: number) => number;
  setFloor: (px: number) => void;
};

type Props = {
  tone: PackMeta["tone"];
  seed: number;
  className?: string;
  floor?: number;
  labels?: boolean;
};

export const DigScene = forwardRef<DigSceneHandle, Props>(function DigScene({ tone, seed, className, floor, labels }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<DigWorld | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const world = new DigWorld(canvas, { seed, palette: PALETTES[tone], reducedMotion: reduced, floor, labels });
    worldRef.current = world;
    world.resize();
    world.start();
    const ro = new ResizeObserver(() => world.resize());
    ro.observe(canvas);
    const onVis = () => (document.hidden ? world.stop() : world.start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      world.stop();
      worldRef.current = null;
    };
  }, [tone, seed, floor, labels]);

  useImperativeHandle(ref, () => ({
    drop: (tier, cb) => worldRef.current?.dropRecord(tier, cb),
    rise: () => worldRef.current?.rise(),
    panTo: (y, ms) => worldRef.current?.panTo(y, ms),
    layerTop: (d) => worldRef.current?.layerTop(d) ?? 0,
    setFloor: (px) => worldRef.current?.setFloor(px),
  }));

  return <canvas ref={canvasRef} aria-hidden className={className} />;
});
