"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PackMeta } from "@/data/packs";
import type { Prompt } from "@/data/types";
import { normalize } from "@/lib/match";
import { bandFor, MAX_TOTAL, tierOf } from "@/lib/score";
import { shareCard, shareText } from "@/lib/share";
import type { Pick, Stats } from "@/lib/storage";
import { TIER_IDS, TIERS } from "@/lib/tiers";
import { ArrowLeft, ImageIcon, ShareIcon, Shuffle, TierMark } from "./icons";


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
  const [shared, setShared] = useState<"idle" | "copied" | "failed" | "saved">("idle");
  const total = picks.reduce((s, p) => s + p.points, 0);
  const band = bandFor(total);
  const link = () => `${window.location.origin}/play/${meta.id}`;

  const share = async () => {
    const text = shareText(meta, label, picks, link());
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

  /** The image card: the native share sheet with the file on phones, a download elsewhere. */
  const shareImage = async () => {
    const blob = await shareCard(meta, label, picks);
    if (!blob) return setShared("failed");
    const file = new File([blob], `crate-digger-${meta.id}-${dateKey || "practice"}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ files: [file], text: shareText(meta, label, picks, link()) });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      setShared("saved");
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
          {shared === "copied" ? "Copied to clipboard" : shared === "failed" ? "Couldn't share" : "Share the dig"}
          <ShareIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={shareImage}
          className="display-wide inline-flex min-h-14 items-center justify-between gap-6 bg-paper px-5 text-base text-ink transition-[background-color,color] duration-150 hover:bg-[var(--field)] hover:text-[var(--on)]"
        >
          {shared === "saved" ? "Card saved" : "Share card"}
          <ImageIcon className="size-5" />
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
        {shared === "copied" ? "Results copied to clipboard." : shared === "saved" ? "Share card saved." : shared === "failed" ? "Couldn't share results." : ""}
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

      <CrateReview picks={picks} prompts={prompts} />

      <p className="mt-10 text-sm leading-relaxed text-paper-mute">
        Tiers come from recent Wikipedia pageviews for each answer, read in context and hand-checked, with one holy grail
        picked per prompt. They aren&rsquo;t live counts of players. Correct answers missing from our list score nothing.
        {!practice && ` A new ${meta.name} set drops at midnight.`}
      </p>
    </main>
  );
}

/** The seven records, each sitting at the depth it reached in the shop. */
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
                className="log-row grid grid-cols-[minmax(5.5rem,8.5rem)_repeat(7,minmax(0,1fr))] items-center"
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
                        className={`log-disc vinyl relative flex size-8 items-center justify-center rounded-full sm:size-10 ${tier === "holy-grail" ? "log-grail" : ""}`}
                        style={{ "--i": i } as React.CSSProperties}
                        title={`Track ${i + 1}: ${p.matched ?? "no find"}`}
                      >
                        <span
                          className="flex size-3 items-center justify-center rounded-full sm:size-4"
                          style={{ background: `var(--tier-${tier ?? "miss"})` }}
                        />
                        <span className="sr-only">
                          Track {i + 1}: {p.matched ?? "no find"}
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
        <div aria-hidden className="grid grid-cols-[minmax(5.5rem,8.5rem)_repeat(7,minmax(0,1fr))] pt-1">
          <span />
          {picks.map((_, i) => (
            <span key={i} className="smallprint tnum text-center text-paper-mute">
              <span className="sr-only">Track </span>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Every answer we had, one track at a time: pick a track, search its crate, and scroll
 * the full list deepest first. Your answer is marked where it sits.
 */
function CrateReview({ picks, prompts }: { picks: Pick[]; prompts: Prompt[] }) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const pick = picks[active];
  const prompt = prompts.find((x) => x.id === pick?.promptId);

  const rows = useMemo(() => {
    if (!prompt) return [];
    const order = [...TIER_IDS].reverse();
    return [...prompt.answers]
      .map((a) => ({ name: a.name, tier: tierOf(a), keys: [a.name, ...(a.aliases ?? [])].map(normalize) }))
      .sort((x, y) => order.indexOf(x.tier) - order.indexOf(y.tier) || x.name.localeCompare(y.name));
  }, [prompt]);
  const q = normalize(query);
  const shown = q ? rows.filter((r) => r.keys.some((k) => k.includes(q))) : rows;

  if (!pick || !prompt) return null;
  return (
    <section aria-labelledby="review-title" className="mt-10">
      <h2 id="review-title" className="display-wide text-2xl">
        What was in the crate
      </h2>
      <p className="mt-1 text-sm text-paper-mute">Every answer we had for each track, deepest first.</p>

      <div role="tablist" aria-label="Tracks" className="mt-4 grid grid-cols-7 gap-1">
        {picks.map((p, i) => (
          <button
            key={p.promptId}
            role="tab"
            type="button"
            id={`tab-${i}`}
            aria-selected={i === active}
            aria-controls="crate-panel"
            onClick={() => {
              setActive(i);
              setQuery("");
            }}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-b-2 transition-colors duration-150 ${
              i === active ? "border-[var(--field)] bg-ink-2 text-paper" : "border-ink-3 text-paper-mute hover:bg-ink-2 hover:text-paper"
            }`}
          >
            <span className="smallprint">
              <span className="sr-only sm:not-sr-only">Track </span>
              {i + 1}
            </span>
            <span className="flex items-center gap-1">
              <TierMark tier={p.tier} className="size-3.5" />
              <span className="display-condensed tnum text-lg leading-none">{p.points}</span>
            </span>
          </button>
        ))}
      </div>

      <div id="crate-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="border border-t-0 border-ink-3 p-4">
        <p className="text-sm text-paper-mute">{prompt.text}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <span className="display-wide break-words text-lg text-paper">
            {pick.matched ?? (pick.input ? `“${pick.input}”` : "Passed")}
          </span>
          <span className="smallprint text-paper-mute">{pick.tier ? `${TIERS[pick.tier].label} · ${pick.points}` : "No find · 0"}</span>
        </p>
        {pick.tries.length > 0 && <p className="mt-1 text-xs text-paper-mute">Your misses: {pick.tries.join(" · ")}</p>}

        <label htmlFor="crate-search" className="sr-only">
          Search this crate
        </label>
        <input
          id="crate-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${rows.length} answers…`}
          autoComplete="off"
          spellCheck={false}
          className="mt-4 min-h-11 w-full bg-paper px-3 text-base text-ink outline-none placeholder:text-[var(--back-mute)] focus-visible:shadow-[inset_0_-3px_0_var(--field)]"
        />
        <p className="smallprint mt-2 text-paper-mute" aria-live="polite">
          {q ? `${shown.length} of ${rows.length} match` : `${rows.length} answers`}
        </p>
        <ul tabIndex={0} aria-label="Answers" className="mt-2 max-h-[26rem] overflow-y-auto overscroll-contain border-t border-ink-3">
          {shown.map((r) => {
            const mine = r.name === pick.matched;
            return (
              <li
                key={r.name}
                className={`grid grid-cols-[1.25rem_1fr_auto] items-center gap-3 border-b border-ink-2 px-1 py-2 ${mine ? "bg-ink-2" : ""}`}
              >
                <TierMark tier={r.tier} className="size-4" />
                <span className={`min-w-0 break-words text-sm ${mine ? "font-semibold text-paper" : "text-paper-dim"}`}>
                  {r.name}
                  {mine && <span className="smallprint ml-2 text-[var(--alert)]">Yours</span>}
                </span>
                <span className="smallprint tnum whitespace-nowrap text-paper-mute">
                  {TIERS[r.tier].label} · {TIERS[r.tier].points}
                </span>
              </li>
            );
          })}
          {shown.length === 0 && <li className="py-4 text-sm text-paper-mute">Nothing in this crate matches “{query}”.</li>}
        </ul>
      </div>
    </section>
  );
}
