"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PackMeta } from "@/data/packs";
import { TIER_IDS, TIERS } from "@/lib/tiers";
import { CrateScene, PALETTES, type CrateHandle } from "./crate/CrateScene";
import { ArrowRight, TierMark } from "./icons";
import { SleeveStatus, TodayLine } from "./SleeveStatus";

const VOICE: Record<PackMeta["tone"], "condensed" | "wide" | "italic"> = { ochre: "condensed", vermilion: "wide", cobalt: "italic" };

export type TierExample = { tier: (typeof TIER_IDS)[number]; name: string };

/**
 * The home page is the shop. The packs stand at the front of a lit crate; pull one to
 * play. Scrolling down dives the camera back through the crate, one tier at a time.
 */
export function HomeShop({ packs, examples, examplePrompt }: { packs: PackMeta[]; examples: TierExample[]; examplePrompt: string }) {
  const router = useRouter();
  const sceneRef = useRef<CrateHandle>(null);
  const [hover, setHover] = useState(-1);
  const [leaving, setLeaving] = useState<PackMeta | null>(null);
  const [noGl, setNoGl] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const pick = (i: number) => {
    const p = packs[i];
    if (!p || leaving) return;
    setLeaving(p);
    try {
      sessionStorage.setItem("crate-digger:from-home", p.tone);
    } catch {
      // Storage blocked: the transition just won't carry over.
    }
    sceneRef.current?.pickPack(i, () => router.push(`/play/${p.id}`));
    window.setTimeout(() => router.push(`/play/${p.id}`), 1600);
  };

  // Wide screens put the display in the right half beside the headline; phones keep it centered below it.
  const frame = (shopFront: boolean) => {
    const wide = window.innerWidth >= 1024;
    if (shopFront) sceneRef.current?.setFrame(wide ? 0.15 : 0.2, false, wide ? 0.13 : 0);
    else sceneRef.current?.setFrame(0, false, 0);
  };

  // Each section sets where the camera is: the shop front, or a tier deep in the crate.
  useEffect(() => {
    frame(window.scrollY < window.innerHeight * 0.5);
    const onResize = () => frame(window.scrollY < window.innerHeight * 0.5);
    window.addEventListener("resize", onResize);
    const targets: [Element, number][] = [];
    if (heroRef.current) targets.push([heroRef.current, -1]);
    stepRefs.current.forEach((el, i) => el && targets.push([el, i]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const t = targets.find(([el]) => el === e.target);
          if (t) {
            sceneRef.current?.diveTo(t[1]);
            frame(t[1] < 0);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    targets.forEach(([el]) => io.observe(el));
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const featured = packs.map((p) => ({ id: p.id, name: p.name, series: p.series, ...PALETTES[p.tone], voice: VOICE[p.tone] }));

  return (
    <>
      <CrateScene
        ref={sceneRef}
        tone="ochre"
        seed={7}
        frameShift={0.2}
        packs={featured}
        onPackHover={setHover}
        onPackPick={pick}
        onUnavailable={() => setNoGl(true)}
        className="fixed inset-0 z-0 size-full"
      />
      {/* Carries the chosen pack's color into the game. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ${leaving ? "opacity-100 delay-700" : "opacity-0"}`}
        style={{ background: leaving ? PALETTES[leaving.tone].field : "transparent" }}
      />

      <main className="relative z-10">
        <section ref={heroRef} aria-labelledby="hero" className="pointer-events-none relative flex min-h-dvh flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[46dvh] bg-gradient-to-b from-ink via-ink/85 to-transparent" />
          <header className="pointer-events-auto relative mx-auto flex w-full max-w-[76rem] items-center justify-between px-4 py-4 sm:px-8">
            <span className="display-wide text-sm">Crate Digger</span>
            <span className="smallprint text-paper-mute">
              <TodayLine />
            </span>
          </header>
          <div className="relative mx-auto w-full max-w-[76rem] px-4 pt-[4dvh] sm:px-8">
            <h1 id="hero" className="hero-title display-condensed max-w-[13ch] text-[clamp(2.9rem,9vw,6.25rem)] text-balance">
              Name the record nobody else would.
            </h1>
            <p className="hero-sub mt-3 max-w-[38ch] text-base leading-snug text-paper-dim sm:text-lg">
              Seven music prompts a day. Any correct answer counts, but the rarer it is, the deeper it sits in the crate.
            </p>
          </div>

          <nav aria-label="Pick a pack" className="pointer-events-auto relative mx-auto mt-auto w-full max-w-[76rem] px-4 pb-6 sm:px-8">
            <p className="smallprint mb-2 text-paper-mute">{noGl ? "Pick a pack" : "Pull a record from the front of the crate"}</p>
            <ul className="grid grid-cols-3 gap-2">
              {packs.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/play/${p.id}`}
                    onClick={(e) => {
                      if (noGl) return;
                      e.preventDefault();
                      pick(i);
                    }}
                    onMouseEnter={() => {
                      setHover(i);
                      sceneRef.current?.setHover(i);
                    }}
                    onMouseLeave={() => {
                      setHover(-1);
                      sceneRef.current?.setHover(-1);
                    }}
                    onFocus={() => sceneRef.current?.setHover(i)}
                    onBlur={() => sceneRef.current?.setHover(-1)}
                    className={`tone-${p.tone} group flex min-h-16 flex-col justify-center border-t-4 border-[var(--field)] bg-ink/80 px-3 py-2 no-underline backdrop-blur-[3px] transition-colors duration-200 ${
                      hover === i ? "bg-[var(--field)] text-[var(--on)]" : "text-paper"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="display-wide whitespace-nowrap text-sm leading-tight sm:text-base">{p.name}</span>
                      <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                    <span className={`smallprint mt-1 hidden sm:block ${hover === i ? "text-[var(--on-mute)]" : "text-paper-mute"}`}>
                      <SleeveStatus packId={p.id} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <section aria-labelledby="dig-title" className="relative">
          <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-8">
            <h2 id="dig-title" className="voice max-w-[12ch] pt-[8dvh] text-[clamp(2.75rem,8vw,5rem)]">
              How deep can you dig?
            </h2>
            <p className="mt-3 max-w-[44ch] text-paper-dim">
              Every answer to <span className="text-paper">{examplePrompt.toLowerCase()}</span> sits somewhere in the crate. The
              hits are up front. Keep scrolling to dig.
            </p>
          </div>
          <ol>
            {TIER_IDS.map((t, i) => {
              const ex = examples.find((e) => e.tier === t);
              return (
                <li
                  key={t}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className={`mx-auto flex min-h-[85dvh] w-full max-w-[76rem] items-end px-4 pb-[6dvh] sm:items-center sm:px-8 sm:pb-0 ${i % 2 ? "sm:justify-end" : ""}`}
                >
                  <div className="w-full bg-ink/85 p-5 backdrop-blur-[4px] sm:max-w-[24rem]">
                    <div className="flex items-center gap-3">
                      <TierMark tier={t} className="size-7" />
                      <span className="smallprint text-paper-mute">
                        {TIERS[t].stratum} · {i + 1} of {TIER_IDS.length}
                      </span>
                    </div>
                    <h3 className="display-wide mt-3 text-3xl leading-none">{TIERS[t].label}</h3>
                    <p className="display-condensed tnum mt-2 text-6xl leading-none text-[var(--alert,var(--field-ochre))]">
                      +{TIERS[t].points}
                    </p>
                    <p className="mt-3 text-paper-dim">{TIERS[t].note}.</p>
                    {ex && (
                      <p className="mt-3 border-t border-ink-3 pt-3 text-sm text-paper-mute">
                        Like <span className="font-semibold text-paper">{ex.name}</span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="relative bg-ink">
          <div className="mx-auto grid w-full max-w-[76rem] gap-6 px-4 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-end">
            <p className="voice text-[clamp(2.5rem,7vw,4.5rem)]">Wrong guesses cost nothing but time. Keep digging.</p>
            <Link
              href="/play/general"
              className="display-wide inline-flex min-h-14 items-center justify-between gap-4 bg-paper px-5 text-lg text-ink no-underline transition-colors duration-150 hover:bg-[var(--field-ochre)]"
            >
              Play today&rsquo;s General
              <ArrowRight className="size-5" />
            </Link>
          </div>
          <footer className="mx-auto flex w-full max-w-[76rem] flex-wrap justify-between gap-4 border-t border-ink-3 px-4 py-5 text-sm text-paper-mute sm:px-8">
            <span>Crate Digger. Tiers are hand-checked research, not live player counts.</span>
            <span className="flex flex-wrap gap-x-5 gap-y-2">
              <span>No account. Your stats stay in this browser.</span>
              <Link href="/privacy" className="text-paper-dim hover:text-paper">
                Privacy
              </Link>
              <Link href="/accessibility" className="text-paper-dim hover:text-paper">
                Accessibility
              </Link>
            </span>
          </footer>
        </section>
      </main>
    </>
  );
}
