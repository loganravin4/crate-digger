"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, type TierId } from "@/lib/tiers";
import { TierMark } from "../icons";
import { DigScene, type DigSceneHandle } from "./DigScene";

export type DemoExample = { name: string; tier: TierId };

/**
 * The home page's live explainer: real answers from one prompt, dropped one after
 * another into the shop so the tiers read as depth. Pauses offscreen and for reduced motion.
 */
export function DemoDig({ prompt, examples }: { prompt: string; examples: DemoExample[] }) {
  const sceneRef = useRef<DigSceneHandle>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(-1);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || examples.length === 0) return;
    let visible = false;
    let timer = 0;
    let idx = -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = () => {
      if (!visible) return;
      idx = (idx + 1) % examples.length;
      setI(idx);
      setLanded(false);
      sceneRef.current?.drop(examples[idx].tier, {
        onLand: () => {
          setLanded(true);
          timer = window.setTimeout(() => {
            sceneRef.current?.rise();
            timer = window.setTimeout(next, reduced ? 400 : 1300);
          }, 2200);
        },
      });
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) timer = window.setTimeout(next, 500);
      if (!visible) window.clearTimeout(timer);
    });
    io.observe(box);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [examples]);

  const ex = i >= 0 ? examples[i] : null;
  return (
    <div ref={boxRef} className="relative h-[34rem] overflow-hidden bg-ink sm:h-[38rem]">
      <DigScene ref={sceneRef} tone="ochre" seed={11} floor={0.2} className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-ink to-transparent p-4 pb-10">
        <p className="smallprint text-paper-mute">{prompt}</p>
      </div>
      <div
        aria-live="polite"
        className={`pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-3 bg-paper px-4 py-3 text-ink transition-[opacity,transform] duration-300 ${
          landed && ex ? "opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {ex && (
          <>
            <TierMark tier={ex.tier} className="size-6 shrink-0 rounded-full bg-ink p-0.5" />
            <span className="display-wide min-w-0 flex-1 truncate text-base">{ex.name}</span>
            <span className="smallprint shrink-0 text-[var(--back-mute)]">{TIERS[ex.tier].label}</span>
            <span className="display-condensed tnum shrink-0 text-2xl">+{TIERS[ex.tier].points}</span>
          </>
        )}
      </div>
    </div>
  );
}
