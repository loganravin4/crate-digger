"use client";

import Link from "next/link";
import { useState } from "react";
import type { PackMeta } from "@/data/packs";
import type { Prompt } from "@/data/types";
import { bandFor, MAX_TOTAL, tierOf } from "@/lib/score";
import type { Pick, Stats } from "@/lib/storage";
import { MISS, TIER_IDS, TIERS, type TierId } from "@/lib/tiers";
import { ArrowLeft, ShareIcon, Shuffle, TierMark } from "./icons";

const SIDE = (i: number) => `${i < 3 ? "A" : "B"}${(i % 3) + 1}`;

export function BackCover({
  meta,
  prompts,
  picks,
  label,
  stats,
  practice,
  dateKey,
}: {
  meta: PackMeta;
  prompts: Prompt[];
  picks: Pick[];
  label: string;
  stats: Stats | null;
  practice: boolean;
  dateKey: string;
}) {
  const [shared, setShared] = useState<"idle" | "copied" | "failed">("idle");
  const total = picks.reduce((s, p) => s + p.points, 0);
  const band = bandFor(total);

  const share = async () => {
    const lines = [
      `Crate Digger · ${meta.name} ${label}`,
      `${total}/${MAX_TOTAL} · ${band.label}`,
      picks.map((p) => (p.tier ? TIERS[p.tier].glyph : MISS.glyph)).join(" "),
      `${window.location.origin}/play/${meta.id}`,
    ];
    const text = lines.join("\n");
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShared("copied");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setShared("failed");
    }
  };

  return (
    <main className={`tone-${meta.tone} mx-auto w-full max-w-[44rem] px-4 pb-16`}>
      <header className="flex items-center justify-between py-3">
        <Link href="/" className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim no-underline hover:text-paper">
          <ArrowLeft className="size-4" />
          Crate
        </Link>
        <span className="smallprint tnum text-paper-mute">
          {meta.name} · {practice ? "Practice" : `${label} · ${dateKey}`}
        </span>
      </header>

      <section aria-labelledby="score-title" className="sleeve-in mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <h1 id="score-title">
          <span className="sr-only">Final score: </span>
          <span className="voice tnum block text-[clamp(5.5rem,26vw,9rem)] leading-[0.8]">{total}</span>
          <span className="smallprint mt-3 block text-paper-mute">out of {MAX_TOTAL}</span>
        </h1>
        <div className="sm:max-w-[18rem] sm:text-right">
          <p className="display-wide text-2xl text-[var(--alert)]">{band.label}</p>
          <p className="mt-1 text-base text-paper-dim">{band.line}</p>
        </div>
      </section>

      <DigLog picks={picks} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={share}
          className="display-wide inline-flex min-h-14 flex-1 items-center justify-between bg-[var(--field)] px-5 text-lg text-[var(--on)] transition-[background-color,color,transform] duration-150 hover:bg-paper hover:text-ink active:translate-y-px"
        >
          {shared === "copied" ? "Copied to clipboard" : shared === "failed" ? "Couldn't copy" : "Share the dig"}
          <ShareIcon className="size-5" />
        </button>
        <a
          href={`/play/${meta.id}/practice`}
          className="display-wide inline-flex min-h-14 items-center justify-between gap-6 border-2 border-paper px-5 text-base text-paper no-underline transition-colors duration-150 hover:bg-paper hover:text-ink"
        >
          Practice
          <Shuffle className="size-5" />
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {shared === "copied" ? "Results copied to clipboard." : shared === "failed" ? "Couldn't copy results." : ""}
      </p>

      {stats && !practice && (
        <dl className="mt-8 grid grid-cols-4 gap-2 border-y border-ink-3 py-4 text-center">
          {(
            [
              ["Played", stats.played],
              ["Streak", stats.streak],
              ["Best", stats.best],
              ["Holy grails", stats.grails],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse">
              <dt className="smallprint text-paper-mute">{k}</dt>
              <dd className="display-condensed tnum text-3xl">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <section aria-labelledby="review-title" className="mt-10">
        <h2 id="review-title" className="display-wide text-2xl">
          What was in the crate
        </h2>
        <p className="mt-1 text-sm text-paper-mute">Open any track to see every answer we had, deepest first.</p>
        <ol className="mt-4 space-y-2">
          {picks.map((p, i) => {
            const prompt = prompts.find((x) => x.id === p.promptId);
            return prompt ? <Review key={p.promptId} side={SIDE(i)} pick={p} prompt={prompt} /> : null;
          })}
        </ol>
      </section>

      <p className="mt-10 text-sm leading-relaxed text-paper-mute">
        Tiers come from recent Wikipedia pageviews for each answer, read in context and hand-checked, with one holy grail
        picked per prompt. They aren&rsquo;t live counts of players. Correct answers missing from our list score nothing.
        {!practice && ` A new ${meta.name} set drops at midnight.`}
      </p>
    </main>
  );
}

/** The six records, each sitting at the depth it reached in the shop. */
function DigLog({ picks }: { picks: Pick[] }) {
  return (
    <section aria-labelledby="log-title" className="mt-10">
      <h2 id="log-title" className="smallprint text-paper-mute">
        Dig log
      </h2>
      <div className="mt-3 overflow-hidden" role="table" aria-label="Where each record landed">
        <div role="rowgroup">
          {[null, ...TIER_IDS].map((tier, depth) => {
            const info = tier ? TIERS[tier] : null;
            return (
              <div
                key={tier ?? "floor"}
                role="row"
                className="log-row grid grid-cols-[minmax(6.5rem,8.5rem)_repeat(6,minmax(0,1fr))] items-center"
                style={{ "--d": depth } as React.CSSProperties}
              >
                <div role="rowheader" className="py-2 pr-2">
                  <span className="smallprint block text-paper-mute">{info ? info.stratum : "Shop floor"}</span>
                  <span className="display-wide block text-xs leading-tight text-paper-dim">
                    {info ? `${info.label} · ${info.points}` : "No find · 0"}
                  </span>
                </div>
                {picks.map((p, i) => (
                  <div key={i} role="cell" className="flex h-12 items-center justify-center">
                    {p.tier === tier ? (
                      <span
                        className={`log-disc vinyl relative flex size-10 items-center justify-center rounded-full ${tier === "holy-grail" ? "log-grail" : ""}`}
                        style={{ "--i": i } as React.CSSProperties}
                        title={`${SIDE(i)}: ${p.matched ?? "no find"}`}
                      >
                        <span
                          className="flex size-4 items-center justify-center rounded-full"
                          style={{ background: `var(--tier-${tier ?? "miss"})` }}
                        />
                        <span className="sr-only">
                          {SIDE(i)}: {p.matched ?? "no find"}
                        </span>
                      </span>
                    ) : (
                      <span aria-hidden className="h-px w-3 bg-ink-3" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div aria-hidden className="grid grid-cols-[minmax(6.5rem,8.5rem)_repeat(6,minmax(0,1fr))] pt-1">
          <span />
          {picks.map((_, i) => (
            <span key={i} className="smallprint tnum text-center text-paper-mute">
              {SIDE(i)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Review({ side, pick, prompt }: { side: string; pick: Pick; prompt: Prompt }) {
  const byTier = new Map<TierId, string[]>();
  for (const a of prompt.answers) {
    const t = tierOf(a);
    byTier.set(t, [...(byTier.get(t) ?? []), a.name]);
  }
  const order = [...TIER_IDS].reverse();
  return (
    <li>
      <details className="review group border border-ink-3">
        <summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_auto] items-center gap-x-3 px-3 py-3 hover:bg-ink-2">
          <span className="smallprint tnum text-paper-mute">{side}</span>
          <span className="min-w-0">
            <span className="block text-sm leading-snug text-paper-mute">{prompt.text}</span>
            <span className="display-wide block break-words text-base leading-tight text-paper">
              {pick.matched ?? (pick.input ? `“${pick.input}”` : "Passed")}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="display-condensed tnum text-2xl">{pick.points}</span>
            <TierMark tier={pick.tier} className="size-5" />
          </span>
        </summary>
        <div className="border-t border-ink-3 px-3 py-3">
          {pick.tries.length > 0 && <p className="mb-3 text-xs text-paper-mute">Your misses: {pick.tries.join(" · ")}</p>}
          <dl className="space-y-2">
            {order.map((t) =>
              byTier.get(t)?.length ? (
                <div key={t} className="grid grid-cols-[7.5rem_1fr] gap-x-3">
                  <dt className="flex items-start gap-1.5 pt-0.5">
                    <TierMark tier={t} className="size-4 shrink-0" />
                    <span className="smallprint text-paper-dim">{TIERS[t].label}</span>
                  </dt>
                  <dd className="text-sm leading-relaxed text-paper-dim">
                    {byTier.get(t)!.map((n, k) => (
                      <span key={n}>
                        {k > 0 && " · "}
                        <span className={n === pick.matched ? "font-semibold text-paper underline decoration-[var(--field)] decoration-2 underline-offset-4" : ""}>
                          {n}
                        </span>
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      </details>
    </li>
  );
}
