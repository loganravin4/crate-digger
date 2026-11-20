"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PackMeta } from "@/data/packs";
import type { Answer, Prompt } from "@/data/types";
import { dailyPrompts, issueNumber, localDateKey, practicePrompts } from "@/lib/daily";
import { matchDetailed } from "@/lib/match";
import { pointsFor, ROUNDS, SECONDS, tierOf } from "@/lib/score";
import { sound } from "@/lib/sound";
import { loadRun, loadSettings, recordFinish, saveRun, saveSettings, type Pick, type Run, type Stats } from "@/lib/storage";
import { TIERS, type TierId } from "@/lib/tiers";
import { BackCover } from "./BackCover";
import { CoverType, fitCover } from "./CoverType";
import { CrateScene, type CrateHandle } from "./crate/CrateScene";
import { ArrowLeft, ArrowRight, SpeakerIcon } from "./icons";

type Phase = "loading" | "intro" | "playing" | "dropping" | "landed" | "done";
type Notice = { kind: "rejected" | "empty"; text: string } | null;

function seedFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function Game({ meta, pool, practice = false }: { meta: PackMeta; pool: Prompt[]; practice?: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [dateKey, setDateKey] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [input, setInput] = useState("");
  const [tries, setTries] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [suggestion, setSuggestion] = useState<Answer | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [relaxed, setRelaxed] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [arrived, setArrived] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<CrateHandle>(null);
  const stageRef = useRef<HTMLElement>(null);
  const [stageBottom, setStageBottom] = useState(0);
  const committing = useRef(false);
  const lastTick = useRef(-1);

  useEffect(() => {
    const key = localDateKey();
    const settings = loadSettings();
    const deal = practice ? practicePrompts(pool) : dailyPrompts(meta.id, pool, key);
    const saved = practice ? null : loadRun(meta.id, key);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    try {
      // Coming from the home page's pull: start in the pack's color and fade into the game.
      if (sessionStorage.getItem("crate-digger:from-home")) {
        sessionStorage.removeItem("crate-digger:from-home");
        setArrived(true);
      }
    } catch {
      // Storage blocked: no handoff fade.
    }
    setDateKey(key);
    setRelaxed(settings.relaxedTimer);
    setSoundOn(settings.sound);
    sound.setEnabled(settings.sound);
    setPrompts(deal);
    if (saved?.done) {
      setPicks(saved.picks);
      setStats(recordFinish(saved));
      setPhase("done");
    } else {
      if (saved?.picks.length) setPicks(saved.picks);
      setPhase("intro");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [meta.id, pool, practice]);

  const round = picks.length;
  const current = prompts[Math.min(round, ROUNDS - 1)];
  const shown = phase === "dropping" || phase === "landed" ? prompts[round - 1] : current;
  const lastPick = picks[picks.length - 1];
  const total = picks.reduce((s, p) => s + p.points, 0);
  const remaining = relaxed ? SECONDS : Math.max(0, Math.ceil((deadline - now) / 1000));
  const fraction = relaxed ? 1 : Math.max(0, Math.min(1, (deadline - now) / (SECONDS * 1000)));

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
    committing.current = false;
    lastTick.current = -1;
    setInput("");
    setTries([]);
    setNotice(null);
    setSuggestion(null);
    setDeadline(Date.now() + SECONDS * 1000 + 500);
    setNow(Date.now());
    setPhase("playing");
    sound.startCrackle();
  }, []);

  /** Lock in a pick (a real answer, or null for a pass or timeout) and drop the record. */
  const commit = useCallback(
    (answer: Answer | null, raw: string) => {
      if (committing.current || !current) return;
      committing.current = true;
      sound.stopCrackle();
      const tier: TierId | null = answer ? tierOf(answer) : null;
      const pick: Pick = {
        promptId: current.id,
        input: raw.trim(),
        matched: answer?.name ?? null,
        points: pointsFor(tier),
        tier,
        tries,
      };
      const next = [...picks, pick];
      setPicks(next);
      persist(next, false);
      setSuggestion(null);
      setNotice(null);
      setPhase("dropping");
      sceneRef.current?.dig(tier, answer?.name ?? (raw.trim() || "Passed"), {
        onLand: () => {
          sound.land(tier);
          setPhase("landed");
        },
      });
    },
    [current, picks, persist, tries],
  );

  const reject = useCallback((raw: string) => {
    sound.scratch();
    setTries((t) => (t.includes(raw) ? t : [...t, raw]));
    setNotice({ kind: "rejected", text: `“${raw}” isn’t in this crate. Keep digging.` });
    setShakeKey((k) => k + 1);
    window.setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const submit = useCallback(
    (rawInput: string) => {
      if (phase !== "playing" || !current) return;
      const raw = rawInput.trim();
      if (!raw) {
        setNotice({ kind: "empty", text: "Type an answer, or pass." });
        setShakeKey((k) => k + 1);
        return;
      }
      const m = matchDetailed(current, raw);
      if (!m) return reject(raw);
      if (m.corrected) {
        sound.confirm();
        setNotice(null);
        setSuggestion(m.answer);
        return;
      }
      commit(m.answer, raw);
    },
    [phase, current, reject, commit],
  );

  const advance = useCallback(() => {
    if (picks.length >= ROUNDS) {
      persist(picks, true);
      setPhase("done");
      window.scrollTo({ top: 0 });
    } else {
      sceneRef.current?.reset();
      startRound();
    }
  }, [picks, persist, startRound]);

  // Clock.
  useEffect(() => {
    if (phase !== "playing" || relaxed) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [phase, relaxed]);

  useEffect(() => {
    if (phase !== "playing" || relaxed || now === 0) return;
    if (remaining <= 5 && remaining > 0 && lastTick.current !== remaining) {
      lastTick.current = remaining;
      sound.tick(remaining <= 3);
    }
    if (now >= deadline) {
      // Time's up: take a pending suggestion, or whatever matches what's typed.
      const raw = inputRef.current?.value ?? input;
      const m = suggestion ? { answer: suggestion } : raw.trim() && current ? matchDetailed(current, raw) : null;
      commit(m?.answer ?? null, raw);
    }
  }, [now, deadline, phase, relaxed, remaining, suggestion, current, commit, input]);

  useEffect(() => {
    if (phase === "playing" && !suggestion) inputRef.current?.focus({ preventScroll: true });
    if (phase === "landed") nextRef.current?.focus({ preventScroll: true });
  }, [phase, suggestion]);

  const toggleRelaxed = () => {
    const v = !relaxed;
    setRelaxed(v);
    saveSettings({ relaxedTimer: v, sound: soundOn });
    if (!v && phase === "playing") {
      setDeadline(Date.now() + SECONDS * 1000);
      setNow(Date.now());
    }
  };

  const toggleSound = () => {
    const v = !soundOn;
    setSoundOn(v);
    sound.setEnabled(v);
    saveSettings({ relaxedTimer: relaxed, sound: v });
    if (v && phase === "playing") sound.startCrackle();
  };

  useEffect(() => () => sound.stopCrackle(), []);

  // Frame the crate in the space the UI leaves: below the counter while playing, higher once a record is pulled.
  useEffect(() => {
    const el = stageRef.current;
    if (phase === "dropping") return sceneRef.current?.setFrame(0.12);
    if (phase === "landed") return sceneRef.current?.setFrame(-0.06);
    if (!el || (phase !== "intro" && phase !== "playing")) return;
    const fit = () => {
      const bottom = el.getBoundingClientRect().bottom;
      setStageBottom(bottom);
      sceneRef.current?.setFrame(Math.min(0.34, bottom / (2 * window.innerHeight)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [phase, suggestion, notice, tries.length]);

  const label = practice ? "Practice" : `No. ${dateKey ? issueNumber(dateKey) : "···"}`;

  if (phase === "done") {
    return <BackCover meta={meta} prompts={pool} picks={picks} label={label} stats={stats} practice={practice} dateKey={dateKey} />;
  }

  const trackNo = Math.min(round + (phase === "playing" || phase === "intro" ? 1 : 0), ROUNDS);
  const lifted = phase === "dropping" || phase === "landed";
  const landedPrompt = phase === "landed" ? prompts[round - 1] : null;

  return (
    <main className={`tone-${meta.tone} relative min-h-dvh overflow-hidden`}>
      {arrived && <div aria-hidden className="arrive pointer-events-none fixed inset-0 z-40 bg-[var(--field)]" />}
      <CrateScene ref={sceneRef} tone={meta.tone} seed={seedFor(meta.id)} className="fixed inset-0 z-0 size-full" />
      {/* Solid ink behind the counter UI so text never sits on the sleeves; the crate rises out of the dark below it. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[5] transition-[height,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={
          phase === "intro" || phase === "playing"
            ? {
                height: stageBottom + 110,
                background: `linear-gradient(to bottom, var(--ink) 0, var(--ink) ${stageBottom + 14}px, transparent 100%)`,
              }
            : { height: 96, background: "linear-gradient(to bottom, var(--ink), transparent)" }
        }
      />
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-dvh w-full max-w-[40rem] flex-col px-4">
        <header className="pointer-events-auto flex items-center justify-between gap-2 py-3">
          <Link href="/" className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim no-underline hover:text-paper">
            <ArrowLeft className="size-4" />
            <span className="sr-only sm:not-sr-only">Crate</span>
          </Link>
          <dl className="flex items-baseline gap-4">
            <Slot label="Track" value={`${trackNo}/${ROUNDS}`} />
            <Slot label="Score" value={String(total)} />
          </dl>
          <div className="flex items-center">
            <button
              type="button"
              aria-pressed={soundOn}
              onClick={toggleSound}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-paper-dim hover:text-paper"
            >
              <SpeakerIcon on={soundOn} className="size-5" />
              <span className="sr-only">Sound</span>
            </button>
            <TimerSwitch relaxed={relaxed} onToggle={toggleRelaxed} />
          </div>
        </header>

        {/* The sleeve sits on the shop counter and lifts away while the record drops. */}
        <section
          ref={stageRef}
          aria-labelledby="cover-title"
          className={`pointer-events-auto mx-auto w-[min(100%,24rem,40dvh)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            lifted ? "-translate-y-[120%] opacity-0" : ""
          }`}
        >
          <div className="sleeve on-field relative aspect-square w-full bg-field text-on">
            <div key={phase === "intro" ? "intro" : shown?.id} className="sleeve-in flex h-full flex-col p-[6cqw]">
              <div className="smallprint flex items-start justify-between gap-4 text-on-mute">
                <span>
                  Crate Digger
                  <br />
                  {meta.name} · {meta.series}
                </span>
                <span className="tnum text-right">{label}</span>
              </div>
              <div className="mt-auto">
                {phase === "loading" || phase === "intro" ? (
                  <h1 id="cover-title" className="voice" style={{ fontSize: fitCover(meta.name, meta.glyph) }}>
                    {meta.name}
                    <span className="sr-only">, today&rsquo;s set</span>
                  </h1>
                ) : shown ? (
                  <CoverType text={shown.text} glyph={meta.glyph} id="cover-title" />
                ) : null}
                {phase !== "intro" && phase !== "loading" && shown?.rule && (
                  <p className="mt-[3cqw] max-w-[40ch] text-sm font-medium leading-snug text-on-mute [overflow-wrap:anywhere]">
                    {shown.rule}
                  </p>
                )}
              </div>
            </div>
            {/* The clock is the sleeve's bottom edge burning down. */}
            {phase === "playing" && !relaxed && (
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-[color-mix(in_oklab,var(--on)_22%,transparent)]">
                <div
                  className={`h-full origin-left bg-[var(--on)] ${remaining <= 5 ? "clock-low" : ""}`}
                  style={{ transform: `scaleX(${fraction})` }}
                />
              </div>
            )}
          </div>

          {phase === "intro" && <Intro resume={round > 0} round={round} practice={practice} onStart={startRound} blurb={meta.blurb} />}

          {phase === "playing" && (
            <AnswerBox
              key={current?.id}
              input={input}
              setInput={(v) => {
                setInput(v);
                if (notice?.kind === "empty") setNotice(null);
              }}
              inputRef={inputRef}
              onSubmit={() => submit(input)}
              onPass={() => commit(null, "")}
              notice={notice}
              shakeKey={shakeKey}
              tries={tries}
              suggestion={suggestion}
              onAccept={() => suggestion && commit(suggestion, input)}
              onDecline={() => {
                setSuggestion(null);
                reject(input.trim());
              }}
              remaining={remaining}
              relaxed={relaxed}
            />
          )}
        </section>

        {phase === "landed" && lastPick && landedPrompt && (
          <Landed pick={lastPick} prompt={landedPrompt} total={total} round={round} nextRef={nextRef} onNext={advance} />
        )}
      </div>
    </main>
  );
}

function Slot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="smallprint text-paper-mute">{label}</dt>
      <dd className="display-condensed tnum text-2xl leading-none">{value}</dd>
    </div>
  );
}

function TimerSwitch({ relaxed, onToggle }: { relaxed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!relaxed}
      aria-label="Clock"
      onClick={onToggle}
      className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim hover:text-paper"
    >
      <span aria-hidden className="relative inline-block h-4 w-7 border border-current">
        <span
          className={`absolute top-0.5 left-0.5 size-2.5 bg-current transition-transform duration-200 ease-out ${relaxed ? "translate-x-0" : "translate-x-3"}`}
        />
      </span>
      <span className="tnum w-7 text-left">{relaxed ? "Off" : `${SECONDS}s`}</span>
    </button>
  );
}

function Intro({ resume, round, practice, onStart, blurb }: { resume: boolean; round: number; practice: boolean; onStart: () => void; blurb: string }) {
  return (
    <div className="rise mt-4">
      <p className="text-base leading-snug text-paper">{blurb}</p>
      <p className="mt-2 text-sm leading-snug text-paper-dim">
        {ROUNDS} prompts, {SECONDS} seconds each. Wrong guesses don&rsquo;t end the round, so keep digging. Rarer answers sink
        deeper into the shop. {practice ? "Practice saves nothing." : "Same set for everyone today."}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="display-wide mt-4 inline-flex min-h-14 w-full items-center justify-between bg-[var(--field)] px-5 text-lg text-[var(--on)] transition-[background-color,color,transform] duration-150 hover:bg-paper hover:text-ink active:translate-y-px"
      >
        {resume ? `Resume at track ${round + 1}` : "Drop the needle"}
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

function AnswerBox({
  input,
  setInput,
  inputRef,
  onSubmit,
  onPass,
  notice,
  shakeKey,
  tries,
  suggestion,
  onAccept,
  onDecline,
  remaining,
  relaxed,
}: {
  input: string;
  setInput: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  onPass: () => void;
  notice: Notice;
  shakeKey: number;
  tries: string[];
  suggestion: Answer | null;
  onAccept: () => void;
  onDecline: () => void;
  remaining: number;
  relaxed: boolean;
}) {
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (suggestion) yesRef.current?.focus({ preventScroll: true });
  }, [suggestion]);

  if (suggestion) {
    return (
      <div
        className="rise mt-4 bg-paper p-4 text-ink"
        role="alertdialog"
        aria-labelledby="dym"
        onKeyDown={(e) => {
          if (e.key === "Escape") onDecline();
        }}
      >
        <p id="dym" className="text-base">
          Did you mean <strong className="display-wide text-lg">{suggestion.name}</strong>?
        </p>
        <div className="mt-3 flex gap-2">
          <button
            ref={yesRef}
            type="button"
            onClick={onAccept}
            className="display-wide inline-flex min-h-11 flex-1 items-center justify-center bg-ink px-4 text-sm text-paper hover:bg-[var(--field)] hover:text-[var(--on)]"
          >
            Yes, dig it
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="display-wide inline-flex min-h-11 items-center justify-center border-2 border-ink px-4 text-sm hover:bg-ink hover:text-paper"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="answer" className="sr-only">
        Your answer
      </label>
      <div key={shakeKey} className={`flex items-stretch gap-2 ${shakeKey ? "shake" : ""}`}>
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
          aria-describedby="answer-notice"
          placeholder="Dig for something rare…"
          className="display-wide min-h-13 min-w-0 flex-1 bg-paper px-4 text-lg text-ink outline-none placeholder:font-sans placeholder:text-base placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--back-mute)] focus-visible:shadow-[inset_0_-4px_0_var(--field)]"
        />
        <button
          type="submit"
          className="display-wide inline-flex min-h-13 shrink-0 items-center bg-[var(--field)] px-5 text-base text-[var(--on)] transition-[background-color,color,transform] duration-150 hover:bg-paper hover:text-ink active:translate-y-px"
        >
          Dig
        </button>
      </div>
      <div className="mt-2 flex min-h-11 items-start justify-between gap-3">
        <p id="answer-notice" aria-live="polite" className="pt-1 text-sm leading-snug text-paper-dim">
          {notice ? (
            <span className={notice.kind === "rejected" ? "text-[var(--alert)]" : ""}>{notice.text}</span>
          ) : tries.length ? null : (
            <span>Any correct answer counts. Wrong guesses only cost time.</span>
          )}
          {tries.length > 0 && <span className="mt-1 block text-xs text-paper-mute">Tried: {tries.slice(-4).join(" · ")}</span>}
        </p>
        <button
          type="button"
          onClick={onPass}
          className="smallprint inline-flex min-h-11 shrink-0 items-center px-2 text-paper-dim underline underline-offset-4 hover:text-paper"
        >
          Pass
        </button>
      </div>
      {!relaxed && remaining === 10 && (
        <span role="status" className="sr-only">
          10 seconds left
        </span>
      )}
    </form>
  );
}

function Landed({
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
  const info = pick.tier ? TIERS[pick.tier] : null;
  const answer = pick.matched ? prompt.answers.find((a) => a.name === pick.matched) : null;
  const last = round >= ROUNDS;
  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[40rem] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className={`rise bg-paper p-5 text-ink ${pick.tier === "holy-grail" ? "grail" : ""}`} role="status" aria-live="polite">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="smallprint text-[var(--back-mute)]">{info ? info.stratum : "Shop floor"}</p>
            <p className="display-wide mt-1 break-words text-xl leading-tight">
              {pick.matched ?? (pick.input ? `“${pick.input}”` : "Passed")}
            </p>
          </div>
          <p className="display-condensed tnum shrink-0 text-5xl leading-none">+{pick.points}</p>
        </div>
        <p className="mt-2 text-base">
          <strong>{info ? info.label : "No find"}.</strong> {answer?.quip ?? (info ? `${info.note}.` : "Nothing landed this time.")}
        </p>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--back-rule)] pt-3">
          <p className="smallprint tnum text-[var(--back-mute)]">
            Total <span className="display-condensed ml-1 align-middle text-2xl text-ink">{total}</span>
          </p>
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className="display-wide inline-flex min-h-12 items-center gap-3 bg-ink px-5 text-base text-paper transition-[background-color,color] duration-150 hover:bg-[var(--field)] hover:text-[var(--on)]"
          >
            {last ? "See the dig log" : "Next track"}
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
