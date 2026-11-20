"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PackMeta } from "@/data/packs";
import { sound } from "@/lib/sound";
import type { TierId } from "@/lib/tiers";
import type { CrateEngine, FeaturedPack } from "./engine";

/** Field and on-field colors per pack tone. Mirrors the tone tokens in globals.css. */
export const PALETTES: Record<PackMeta["tone"], { field: string; on: string }> = {
  ochre: { field: "#e4ae1f", on: "#16130f" },
  vermilion: { field: "#bf3a22", on: "#fffaf5" },
  cobalt: { field: "#2b57a6", on: "#f3ecdd" },
};

export type CrateHandle = {
  dig: (tier: TierId | null, answer: string, cb?: { onLand?: () => void }) => void;
  reset: () => void;
  setFrame: (shift: number, instant?: boolean, shiftX?: number) => void;
  setHover: (index: number) => void;
  pickPack: (index: number, done: () => void) => void;
  diveTo: (depth: number) => void;
};

type Props = {
  tone: PackMeta["tone"];
  seed: number;
  className?: string;
  frameShift?: number;
  demo?: boolean;
  /** Home page: featured pack sleeves the visitor can hover and pull. */
  packs?: FeaturedPack[];
  onPackHover?: (index: number) => void;
  onPackPick?: (index: number) => void;
  /** Called when WebGL isn't available, so the caller can skip the scene. */
  onUnavailable?: () => void;
};

export const CrateScene = forwardRef<CrateHandle, Props>(function CrateScene(
  { tone, seed, className, frameShift, demo, packs, onPackHover, onPackPick, onUnavailable },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CrateEngine | null>(null);
  const [failed, setFailed] = useState(false);
  const hoverRef = useRef(onPackHover);
  const pickRef = useRef(onPackPick);
  // Frames asked for before the engine exists are applied when it starts.
  const pendingFrame = useRef<[number, boolean | undefined, number] | null>(null);
  useEffect(() => {
    hoverRef.current = onPackHover;
    pickRef.current = onPackPick;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let cleanup = () => {};
    // three.js is a big download and a big parse; wait until the page is idle, then load and build.
    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200);
    const handle = idle(async () => {
      const { CrateEngine } = await import("./engine");
      if (cancelled) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let engine: CrateEngine;
      try {
        engine = new CrateEngine(canvas, { seed, ...PALETTES[tone], reducedMotion: reduced, frameShift, demo, packs });
      } catch {
        setFailed(true);
        onUnavailable?.();
        return;
      }
      await engine.warmUp();
      if (cancelled) return engine.dispose();
      engineRef.current = engine;
      if (!demo) engine.setFlipSound((divider) => sound.flip(divider));
      engine.setFrame(pendingFrame.current?.[0] ?? frameShift ?? 0.18, true, pendingFrame.current?.[2] ?? 0);
      engine.start();
      canvas.classList.add("scene-in");
      const ro = new ResizeObserver(() => engine.resize());
      ro.observe(canvas);
      const onVis = () => (document.hidden ? engine.stop() : engine.start());
      document.addEventListener("visibilitychange", onVis);

      // Pointer picking for the featured sleeves. Keyboard users get real links in the page.
      let hover = -1;
      const onMove = (e: PointerEvent) => {
        const i = engine.hitTest(e.clientX, e.clientY);
        if (i !== hover) {
          hover = i;
          engine.setHover(i);
          hoverRef.current?.(i);
          canvas.style.cursor = i >= 0 ? "pointer" : "";
        }
      };
      const onClick = (e: MouseEvent) => {
        const i = engine.hitTest(e.clientX, e.clientY);
        if (i >= 0) pickRef.current?.(i);
      };
      if (packs?.length) {
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("click", onClick);
      }
      cleanup = () => {
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("click", onClick);
        engine.dispose();
        engineRef.current = null;
      };
    });
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle as number);
      else clearTimeout(handle as number);
      cleanup();
    };
    // frameShift changes go through setFrame; packs are fixed per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, seed, demo]);

  useImperativeHandle(ref, () => ({
    dig: (tier, answer, cb) => {
      if (!engineRef.current) return cb?.onLand?.();
      engineRef.current.dig(tier, answer, cb);
    },
    reset: () => engineRef.current?.reset(),
    setFrame: (shift, instant, shiftX) => {
      pendingFrame.current = [shift, instant, shiftX ?? 0];
      engineRef.current?.setFrame(shift, instant, shiftX);
    },
    setHover: (i) => engineRef.current?.setHover(i),
    pickPack: (i, done) => (engineRef.current ? engineRef.current.pickPack(i, done) : done()),
    diveTo: (d) => engineRef.current?.diveTo(d),
  }));

  if (failed) return null;
  return <canvas ref={canvasRef} aria-hidden className={className} />;
});
