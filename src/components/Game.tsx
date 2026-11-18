"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PackMeta } from "@/data/packs";
import type { Prompt } from "@/data/types";
import { dailyPrompts, issueNumber, localDateKey, practicePrompts } from "@/lib/daily";
import { match } from "@/lib/match";
import { pointsFor, ROUNDS, SECONDS, tierFor, TIERS } from "@/lib/score";
import { loadRun, loadSettings, recordFinish, saveRun, saveSettings, type Pick, type Run, type Stats } from "@/lib/storage";
import { BackCover } from "./BackCover";
import { CoverType } from "./CoverType";
import { ArrowLeft, ArrowRight } from "./icons";

type Phase = "loading" | "intro" | "playing" | "revealed" | "done";

export function Game({ meta, pool, practice = false }: { meta: PackMeta; pool: Prompt[]; practice?: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [dateKey, setDateKey] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [input, setInput] = useState("");
  const [relaxed, setRelaxed] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);

  // Date and saved progress only exist in the browser.
  useEffect(() => {
    const key = localDateKey();
    const settings = loadSettings();
    const deal = practice ? practicePrompts(pool) : dailyPrompts(meta.id, pool, key);
    const saved = practice ? null : loadRun(meta.id, key);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    setDateKey(key);
    setRelaxed(settings.relaxedTimer);
    setPrompts(deal);
    if (saved?.done) {
      setPicks(saved.picks);
      setStats(recordFinish(saved));
      setPhase("done");
    } else if (saved && saved.picks.length > 0) {
      setPicks(saved.picks);
      setPhase("intro");
    } else {
      setPhase("intro");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [meta.id, pool, practice]);

  const round = picks.length;
  const current = prompts[Math.min(round, ROUNDS - 1)];
  // While a result is showing, the sleeve keeps the prompt that was just answered.
  const shown = phase === "revealed" ? prompts[round - 1] : current;
  const lastPick = picks[picks.length - 1];
  const total = picks.reduce((s, p) => s + p.points, 0);
  const remaining = relaxed ? SECONDS : Math.max(0, Math.ceil((deadline - now) / 1000));

  const persist = useCallback(
    (next: Pick[], done: boolean) => {
      if (practice) return;
      const run: Run = { packId: meta.id, dateKey, picks: next, done };
      saveRun(run);
      if (done) setStats(recordFinish(run));
    },
    [practice, meta.id, dateKey],
  );

  const startRound = useCallback(() => {
    submitting.current = false;
    setInput("");
    setDeadline(Date.now() + SECONDS * 1000);
    setNow(Date.now());
    setPhase("playing");
  }, []);

  const submit = useCallback(
    (raw: string) => {
      if (submitting.current || !current) return;
      submitting.current = true;
      const value = raw.trim();
      const answer = value ? match(current, value) : null;
      const points = pointsFor(answer);
      const pick: Pick = {
        promptId: current.id,
        input: value,
        matched: answer?.name ?? null,
        points,
        tier: tierFor(points, !!answer),
      };
      const next = [...picks, pick];
      setPicks(next);
      persist(next, false);
      setPhase("revealed");
    },
    [current, picks, persist],
  );

  const advance = useCallback(() => {
    if (picks.length >= ROUNDS) {
      persist(picks, true);
      setPhase("done");
      window.scrollTo({ top: 0 });
    } else {
      startRound();
    }
  }, [picks, persist, startRound]);

  // Clock. Turned off entirely in relaxed mode.
  useEffect(() => {
    if (phase !== "playing" || relaxed) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [phase, relaxed]);

  useEffect(() => {
    if (phase === "playing" && !relaxed && now > 0 && now >= deadline) submit(inputRef.current?.value ?? "");
  }, [now, deadline, phase, relaxed, submit]);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
    if (phase !== "revealed") return;
    nextRef.current?.focus({ preventScroll: true });
    // Once the disc has landed, bring the result and Next into view on short screens.
    const id = window.setTimeout(() => nextRef.current?.scrollIntoView({ block: "nearest" }), 640);
    return () => window.clearTimeout(id);
  }, [phase]);

  const toggleRelaxed = () => {
    const v = !relaxed;
    setRelaxed(v);
    saveSettings({ relaxedTimer: v });
    if (!v && phase === "playing") {
      setDeadline(Date.now() + SECONDS * 1000);
      setNow(Date.now());
    }
  };

  const label = practice ? "Practice" : `No. ${dateKey ? issueNumber(dateKey) : "···"}`;
  const revealAnswer = useMemo(() => {
    if (!lastPick || phase !== "revealed") return null;
    return prompts.find((p) => p.id === lastPick.promptId) ?? null;
  }, [lastPick, phase, prompts]);

  if (phase === "done") {
    return (
      <BackCover meta={meta} prompts={prompts} picks={picks} label={label} stats={stats} practice={practice} dateKey={dateKey} />
    );
  }

  return (
    <main className={`tone-${meta.tone} mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col`}>
      <header className="flex items-center justify-between px-4 py-3 sm:px-0">
        <Link
          href="/"
          className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim no-underline hover:text-paper"
        >
          <ArrowLeft className="size-4" />
          Crate
        </Link>
        <TimerSwitch relaxed={relaxed} onToggle={toggleRelaxed} />
      </header>

      {/* The sleeve. Fixed slots in the catalog line never move; only values change. */}
      <section
        aria-labelledby="cover-title"
        className="sleeve on-field relative z-10 aspect-square w-full bg-field text-on"
      >
        <div key={phase === "intro" ? "intro" : shown?.id} className="sleeve-in flex h-full flex-col p-[6cqw]">
          <div className="smallprint flex items-start justify-between gap-4 text-on-mute">
            <span>
              Crate Digger
              <br />
              {meta.name} · {meta.series}
            </span>
            <span className="tnum text-right">
              {label}
              <br />
              {phase === "intro" ? `${ROUNDS} tracks` : `Track ${Math.min(round + (phase === "playing" ? 1 : 0), ROUNDS)} of ${ROUNDS}`}
            </span>
          </div>
          <div className="mt-auto">
            {phase === "loading" ? (
              <p className="display-condensed text-[18cqw]" id="cover-title">
                {meta.name}
              </p>
            ) : phase === "intro" ? (
              <h1 id="cover-title" className="display-condensed text-[min(26cqw,6rem)]">
                {meta.name}
                <span className="sr-only">, today&rsquo;s set</span>
              </h1>
            ) : shown ? (
              <CoverType text={shown.text} id="cover-title" />
            ) : null}
            {(phase === "playing" || phase === "revealed") && shown?.rule && (
              <p className="mt-[3cqw] max-w-[40ch] text-sm font-medium leading-snug text-on-mute">{shown.rule}</p>
            )}
          </div>
        </div>
      </section>

      <section className="relative flex flex-1 flex-col px-4 pb-8 sm:px-0">
        {phase === "intro" && (
          <Intro
            resume={round > 0}
            round={round}
            practice={practice}
            onStart={startRound}
            blurb={meta.blurb}
          />
        )}

        {phase === "playing" && (
          <form
            className="pt-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <Slots round={round + 1} remaining={remaining} relaxed={relaxed} total={total} />
            <label htmlFor="answer" className="smallprint mt-6 block text-paper-mute">
              Your answer
            </label>
            <div className="mt-1 flex items-end gap-3">
              <input
                id="answer"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="go"
                maxLength={80}
                placeholder="Dig for something rare…"
                className="display-wide min-w-0 flex-1 border-b-2 border-paper bg-transparent pb-2 text-xl text-paper outline-none placeholder:text-paper-mute placeholder:normal-case placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-base focus:border-b-4 focus:pb-[0.375rem]"
              />
              <button
                type="submit"
                className="display-wide inline-flex min-h-12 shrink-0 items-center gap-2 bg-paper px-5 text-base text-ink transition-[background-color,transform] duration-150 hover:bg-[var(--field)] hover:text-[var(--on)] active:translate-y-px disabled:opacity-50"
              >
                Dig
              </button>
            </div>
            <p className="mt-3 text-sm text-paper-mute">
              One answer. Any correct one counts, and rarer ones score more.{" "}
              {!relaxed && "Whatever you've typed when the clock hits zero is sent."}
            </p>
          </form>
        )}

        {phase === "revealed" && lastPick && revealAnswer && (
          <Reveal pick={lastPick} prompt={revealAnswer} total={total} round={round} nextRef={nextRef} onNext={advance} />
        )}
      </section>
    </main>
  );
}

function TimerSwitch({ relaxed, onToggle }: { relaxed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!relaxed}
      onClick={onToggle}
      className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim hover:text-paper"
    >
      <span>Clock</span>
      <span aria-hidden className="relative inline-block h-4 w-7 border border-current">
        <span
          className={`absolute top-0.5 left-0.5 size-2.5 bg-current transition-transform duration-200 ease-out ${relaxed ? "translate-x-0" : "translate-x-3"}`}
        />
      </span>
      <span className="tnum w-9 text-left">{relaxed ? "Off" : `${SECONDS}s`}</span>
    </button>
  );
}

function Slots({ round, remaining, relaxed, total }: { round: number; remaining: number; relaxed: boolean; total: number }) {
  const low = !relaxed && remaining <= 5;
  return (
    <dl className="grid grid-cols-3 border-y border-ink-3 py-3">
      <div>
        <dt className="smallprint text-paper-mute">Track</dt>
        <dd className="display-condensed tnum mt-1 text-4xl">
          {round}
          <span className="text-paper-mute">/{ROUNDS}</span>
        </dd>
      </div>
      <div className="text-center">
        <dt className="smallprint text-paper-mute">Clock</dt>
        <dd
          className={`display-condensed tnum mt-1 text-4xl ${low ? "clock-low text-[var(--field-ochre)]" : ""}`}
        >
          {relaxed ? "—" : `0:${String(remaining).padStart(2, "0")}`}
        </dd>
        {!relaxed && remaining === 10 && (
          <span role="status" className="sr-only">
            10 seconds left
          </span>
        )}
      </div>
      <div className="text-right">
        <dt className="smallprint text-paper-mute">Score</dt>
        <dd className="display-condensed tnum mt-1 text-4xl">{total}</dd>
      </div>
    </dl>
  );
}

function Intro({
  resume,
  round,
  practice,
  onStart,
  blurb,
}: {
  resume: boolean;
  round: number;
  practice: boolean;
  onStart: () => void;
  blurb: string;
}) {
  return (
    <div className="rise pt-6">
      <p className="max-w-[44ch] text-lg leading-snug text-paper">{blurb}</p>
      <ol className="mt-5 space-y-2 text-base leading-snug text-paper-dim">
        <li>
          <span className="tnum font-semibold text-paper">{ROUNDS} prompts</span>, one typed answer each, {SECONDS} seconds
          per prompt.
        </li>
        <li>Any correct answer counts. The fewer people who&rsquo;d think of it, the more it scores, up to 90.</li>
        <li>{practice ? "Practice deals random prompts and saves nothing." : "Same set for everyone today. New one at midnight."}</li>
      </ol>
      <button
        type="button"
        onClick={onStart}
        className="display-wide mt-7 inline-flex min-h-14 w-full items-center justify-between bg-[var(--field)] px-5 text-lg text-[var(--on)] transition-transform duration-150 active:translate-y-px sm:w-auto sm:gap-10"
      >
        {resume ? `Resume at track ${round + 1}` : "Drop the needle"}
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

function Reveal({
  pick,
  prompt,
  total,
  round,
  nextRef,
  onNext,
}: {
  pick: Pick;
  prompt: Prompt;
  total: number;
  round: number;
  nextRef: React.RefObject<HTMLButtonElement | null>;
  onNext: () => void;
}) {
  const tier = TIERS[pick.tier];
  const rarest = prompt.answers
    .filter((a) => a.name !== pick.matched)
    .sort((a, b) => a.pop - b.pop)
    .slice(0, 3)
    .map((a) => a.name);
  const last = round >= ROUNDS;

  return (
    <div className="flex flex-col items-center">
      {/* The disc slides out from under the sleeve, label printed with the result. */}
      {/* Disc is 58% wide and tucks 14% under the sleeve; the result clears its bottom edge. */}
      <div aria-hidden className="relative -mt-[14%] h-0 w-full">
        <div className="disc-out vinyl relative mx-auto aspect-square w-[58%] rounded-full [container-type:inline-size]">
          <div
            className="absolute inset-[29%] flex flex-col items-center justify-center rounded-full text-center"
            style={{ background: `var(--tier-${pick.tier})`, color: "var(--ink)" }}
          >
            <span className="display-condensed tnum text-[17cqw]">+{pick.points}</span>
            <span className="smallprint mt-[1cqw] max-w-[74%] text-[4.4cqw] leading-tight">{tier.label}</span>
          </div>
        </div>
      </div>
      <div className="rise mt-[calc(58%+1.25rem)] w-full" role="status" aria-live="polite">
        <p className="sr-only">
          {pick.matched ? `${pick.matched}: ${tier.label}, plus ${pick.points} points.` : `${tier.label}. No points.`}
        </p>
        <p className="display-wide break-words text-xl leading-tight text-paper">
          {pick.matched ? pick.matched : pick.input ? `“${pick.input}”` : "Time ran out"}
        </p>
        <p className="mt-1 text-base text-paper-dim">
          {pick.matched
            ? `${tier.label}. ${tier.note}.`
            : pick.input
              ? "Not in this crate. It may be right, but it isn't on our list."
              : "Nothing was typed in time."}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-paper-mute">
          <span className="smallprint text-paper-dim">Other rare pulls on our list</span>
          <br />
          {rarest.join(" · ")}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-3 pt-4">
          <p className="smallprint tnum text-paper-mute">
            Score <span className="display-condensed ml-1 align-middle text-2xl text-paper">{total}</span>
          </p>
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className="display-wide inline-flex min-h-12 scroll-mb-8 items-center gap-3 bg-paper px-5 text-base text-ink transition-[background-color,transform] duration-150 hover:bg-[var(--field)] hover:text-[var(--on)] active:translate-y-px"
          >
            {last ? "Flip to the back" : "Next track"}
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
