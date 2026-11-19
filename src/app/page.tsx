import Link from "next/link";
import { DemoDig, type DemoExample } from "@/components/dig/DemoDig";
import { ArrowRight, TierMark } from "@/components/icons";
import { SleeveStatus, TodayLine } from "@/components/SleeveStatus";
import { getPack, PACKS } from "@/data/packs";
import { tierOf } from "@/lib/score";
import { TIER_IDS, TIERS } from "@/lib/tiers";

/** One real answer per tier from the General pack's Beatles prompt, shallow to deep. */
function examples(): { text: string; rows: DemoExample[] } {
  const prompt = getPack("general")!.data.prompts.find((p) => p.id === "general-01")!;
  const rows = TIER_IDS.map((tier) => {
    const a = prompt.answers.find((x) => tierOf(x) === tier);
    return a ? { name: a.name, tier } : null;
  }).filter((r): r is DemoExample => r !== null);
  return { text: prompt.text, rows };
}

export default function Home() {
  const ex = examples();
  return (
    <main className="mx-auto w-full max-w-[76rem] px-4 pb-16 sm:px-8">
      <header className="flex items-center justify-between py-4">
        <span className="display-wide text-sm">Crate Digger</span>
        <span className="smallprint text-paper-mute">
          <TodayLine />
        </span>
      </header>

      <section aria-labelledby="hero" className="grid gap-8 pt-6 pb-10 md:grid-cols-[1.25fr_1fr] md:items-end md:pt-14">
        <h1 id="hero" className="display-condensed text-[clamp(3.75rem,15vw,6rem)] text-balance">
          Name the record nobody else would.
        </h1>
        <div className="md:pb-2">
          <p className="max-w-[40ch] text-lg leading-snug text-paper-dim">
            Seven music prompts a day. Any correct answer counts, but the rarer it is, the more it scores.
          </p>
          <figure className="mt-5 border-t border-ink-3 pt-3">
            <figcaption className="smallprint text-paper-mute">{ex.text}</figcaption>
            <ul className="mt-2 space-y-1.5">
              {[ex.rows[0], ex.rows[ex.rows.length - 1]].filter(Boolean).map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <TierMark tier={r.tier} />
                  <span className="display-wide min-w-0 flex-1 text-sm leading-tight">{r.name}</span>
                  <span className="smallprint text-paper-mute">{TIERS[r.tier].label}</span>
                  <span className="display-condensed tnum w-10 text-right text-2xl">+{TIERS[r.tier].points}</span>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </section>

      <section aria-labelledby="crate-title">
        <h2 id="crate-title" className="sr-only">
          Pick a pack
        </h2>
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:flex lg:gap-0 lg:pb-10">
          {PACKS.map((p, i) => (
            <li key={p.id} className="sleeve crate-slot relative w-[82%] shrink-0 snap-start sm:w-auto lg:flex-1" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/play/${p.id}`}
                className={`tone-${p.tone} on-field group relative flex aspect-square flex-col bg-field p-[7cqw] text-on no-underline transition-transform duration-200 ease-out hover:-translate-y-1 active:translate-y-0`}
              >
                <span className="smallprint flex justify-between text-on-mute">
                  <span>
                    Crate Digger
                    <br />
                    {p.series}
                  </span>
                  <span className="tnum shrink-0 whitespace-nowrap">CRT-{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="mt-auto">
                  <span
                    className="voice mt-[0.08em] block whitespace-nowrap"
                    style={{ fontSize: `${Math.min(30, 80 / (p.name.length * p.glyph * 1.08)).toFixed(2)}cqw` }}
                  >
                    {p.name}
                  </span>
                </span>
                <span className="smallprint mt-[5cqw] border-t border-current pt-[3cqw] text-on-mute">
                  <SleeveStatus packId={p.id} />
                </span>
                <span className="sr-only">. {p.blurb}</span>
              </Link>
            </li>
          ))}
          <li className="sleeve crate-slot relative w-[82%] shrink-0 snap-start sm:w-auto lg:flex-1" style={{ "--i": PACKS.length } as React.CSSProperties}>
            <div className="relative flex aspect-square flex-col items-center justify-center bg-ink-2 p-[7cqw] text-center">
              <div aria-hidden className="vinyl absolute inset-[9%] rounded-full" />
              <div className="relative flex aspect-square w-[44%] flex-col items-center justify-center rounded-full bg-paper p-3 text-ink">
                <span className="smallprint text-[2.6cqw] text-[var(--back-mute)]">Test pressing</span>
                <span className="display-condensed mt-1 text-[8cqw] leading-[0.9]">More genres</span>
                <span className="smallprint mt-1 text-[2.6cqw] text-[var(--back-mute)]">Coming soon</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <section aria-labelledby="notes-title" className="mt-16 grid gap-8 border-t border-ink-3 pt-10 md:grid-cols-[1fr_1.3fr] md:items-start">
        <div className="md:sticky md:top-8">
          <h2 id="notes-title" className="voice text-[clamp(2.75rem,8vw,4.5rem)]">
            How deep can you dig?
          </h2>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-paper-dim">
            Your answer drops like a record through the shop. The hits stay on the front rack. Real catalog sinks to the back
            room. One answer per prompt is the holy grail, locked in the vault.
          </p>
          <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-paper-mute">
            Wrong guesses cost nothing but time, so keep digging until the clock runs out. Every tier scores the same flat
            points, and tiers come from recent Wikipedia
            pageviews for each answer, hand-checked.
          </p>
          <ol className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {TIER_IDS.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <TierMark tier={t} className="size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="display-wide block text-sm leading-tight">{TIERS[t].label}</span>
                  <span className="smallprint tnum text-paper-mute">{TIERS[t].points} pts</span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/play/general"
            className="display-wide mt-7 inline-flex min-h-12 items-center gap-3 bg-paper px-5 text-base text-ink no-underline transition-colors duration-150 hover:bg-[var(--field-ochre)]"
          >
            Play today&rsquo;s General
            <ArrowRight className="size-5" />
          </Link>
        </div>
        <DemoDig prompt={ex.text} examples={ex.rows} />
      </section>

      <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t border-ink-3 pt-5 text-sm text-paper-mute">
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
    </main>
  );
}
