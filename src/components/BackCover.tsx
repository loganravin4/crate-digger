"use client";

import Link from "next/link";
import { useState } from "react";
import type { PackMeta } from "@/data/packs";
import type { Prompt } from "@/data/types";
import { MAX_POINTS, ROUNDS, TIERS } from "@/lib/score";
import type { Pick, Stats } from "@/lib/storage";
import { ArrowLeft, ShareIcon, Shuffle, TierMark } from "./icons";

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
  const whiteLabels = picks.filter((p) => p.tier === "white-label").length;

  const share = async () => {
    const lines = [
      `Crate Digger · ${meta.name} ${label}`,
      `${total}/${ROUNDS * MAX_POINTS}`,
      picks.map((p) => TIERS[p.tier].glyph).join(" "),
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
    <main className={`tone-${meta.tone} mx-auto w-full max-w-[34rem] pb-12`}>
      <header className="flex items-center justify-between px-4 py-3 sm:px-0">
        <Link href="/" className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim no-underline hover:text-paper">
          <ArrowLeft className="size-4" />
          Crate
        </Link>
        <span className="smallprint tnum text-paper-mute">{practice ? "Practice" : dateKey}</span>
      </header>

      {/* Back cover: paper stock, the pack's color as the spine band. */}
      <div className="sleeve-in relative mr-7 ml-4 mt-3 sm:mx-0">
        {/* The front cover peeks out from behind the back: depth by overlap only. */}
        <div aria-hidden className="absolute inset-0 translate-x-3 -translate-y-3 bg-[var(--field)]" />
      <article aria-labelledby="back-title" className="relative bg-paper text-ink">
        <div>
          <div className="p-5 sm:p-7">
            <div className="smallprint flex justify-between gap-4 text-[var(--back-mute)]">
              <span>
                Crate Digger · {meta.name}
                <br />
                {meta.series}
              </span>
              <span className="tnum text-right">
                {label}
                <br />
                Side B
              </span>
            </div>

            <h1 id="back-title" className="mt-6">
              <span className="sr-only">Final score: </span>
              <span className="display-condensed tnum mt-1 block text-[clamp(5rem,30vw,8.5rem)] leading-[0.8]">
                {total}
                <span className="text-[0.32em] text-[var(--back-faint)]"> / {ROUNDS * MAX_POINTS}</span>
              </span>
            </h1>
            <p className="mt-3 text-base text-[var(--back-ink)]">
              {whiteLabels > 0
                ? `${whiteLabels} White Label ${whiteLabels === 1 ? "pull" : "pulls"}. That's real digging.`
                : picks.some((p) => p.tier === "b-side")
                  ? "Some solid B-sides in there."
                  : picks.filter((p) => p.tier === "miss").length >= 3
                    ? "A tough crate. Come back tomorrow and dig again."
                    : "Mostly hits. Tomorrow, dig further."}
            </p>

            <h2 className="smallprint mt-8 border-b border-ink pb-2 text-ink">Tracklist</h2>
            <ol>
              {picks.map((p, i) => {
                const prompt = prompts.find((x) => x.id === p.promptId);
                const rarest = prompt
                  ? prompt.answers
                      .filter((a) => a.name !== p.matched)
                      .sort((a, b) => a.pop - b.pop)
                      .slice(0, 2)
                      .map((a) => a.name)
                  : [];
                return (
                  <li key={p.promptId} className="grid grid-cols-[2rem_1fr_auto] gap-x-2 border-b border-[var(--back-rule)] py-3">
                    <span className="smallprint tnum pt-0.5 text-[var(--back-mute)]">
                      {i < 3 ? "A" : "B"}
                      {(i % 3) + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-[var(--back-mute)]">{prompt?.text ?? "Prompt"}</p>
                      <p className="display-wide mt-0.5 break-words text-base leading-tight">
                        {p.matched ?? (p.input ? <s className="text-[var(--back-faint)]">{p.input}</s> : <span className="text-[var(--back-faint)]">No answer</span>)}
                      </p>
                      {rarest.length > 0 && (
                        <p className="mt-1 text-xs leading-snug text-[var(--back-mute)]">Rarer on our list: {rarest.join(", ")}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-2 pt-0.5">
                      <span className="display-condensed tnum text-2xl leading-none">{p.points}</span>
                      <span className="mt-0.5 rounded-full bg-ink p-0.5" title={TIERS[p.tier].label}>
                        <TierMark tier={p.tier} />
                        <span className="sr-only">{TIERS[p.tier].label}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            {stats && !practice && (
              <dl className="mt-6 grid grid-cols-4 gap-2 text-center">
                {(
                  [
                    ["Played", stats.played],
                    ["Streak", stats.streak],
                    ["Best", stats.best],
                    ["White labels", stats.whiteLabels],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dd className="display-condensed tnum text-3xl">{v}</dd>
                    <dt className="smallprint text-[var(--back-mute)]">{k}</dt>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-7 text-xs leading-relaxed text-[var(--back-mute)]">
              Liner notes: rarity is an estimate written into each answer, not a live count of players. Correct answers missing
              from our list score zero. Sorry, crate diggers.
            </p>
          </div>
        </div>
      </article>
      </div>

      <div className="mt-6 flex flex-col gap-3 px-4 sm:flex-row sm:px-0">
        <button
          type="button"
          onClick={share}
          className="display-wide inline-flex min-h-14 flex-1 items-center justify-between bg-[var(--field)] px-5 text-lg text-[var(--on)] transition-transform duration-150 active:translate-y-px"
        >
          {shared === "copied" ? "Copied to clipboard" : shared === "failed" ? "Couldn't copy" : "Share the tracklist"}
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
      {!practice && <p className="mt-6 px-4 text-sm text-paper-mute sm:px-0">A new {meta.name} set drops at midnight.</p>}
    </main>
  );
}
