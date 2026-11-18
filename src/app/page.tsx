import Link from "next/link";
import { ArrowRight, TierMark } from "@/components/icons";
import { SleeveStatus, TodayLine } from "@/components/SleeveStatus";
import { getPack, PACKS } from "@/data/packs";
import { pointsFor, tierFor, TIERS, type Tier } from "@/lib/score";

/** A worked example pulled from the real General pack: the hit versus the long tail. */
function example() {
  const prompt = getPack("general")!.data.prompts.find((p) => p.id === "general-01")!;
  const sorted = [...prompt.answers].sort((a, b) => b.pop - a.pop);
  const hit = sorted[0];
  const rare = prompt.answers.find((a) => a.name === "Hey Bulldog") ?? sorted[sorted.length - 1];
  return {
    text: prompt.text,
    rows: [hit, rare].map((a) => {
      const pts = pointsFor(a);
      return { name: a.name, pts, tier: tierFor(pts, true) };
    }),
  };
}

const LADDER: { tier: Tier; range: string }[] = [
  { tier: "white-label", range: "90" },
  { tier: "b-side", range: "70–89" },
  { tier: "album-track", range: "40–69" },
  { tier: "radio-edit", range: "5–39" },
];

export default function Home() {
  const ex = example();
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
            Six music prompts a day. Any correct answer counts, but the rarer it is, the more it scores.
          </p>
          <figure className="mt-5 border-t border-ink-3 pt-3">
            <figcaption className="smallprint text-paper-mute">{ex.text}</figcaption>
            <ul className="mt-2 space-y-1.5">
              {ex.rows.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <TierMark tier={r.tier} />
                  <span className="display-wide min-w-0 flex-1 text-sm leading-tight">{r.name}</span>
                  <span className="smallprint text-paper-mute">{TIERS[r.tier].label}</span>
                  <span className="display-condensed tnum w-10 text-right text-2xl">+{r.pts}</span>
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
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {PACKS.map((p, i) => (
            <li key={p.id} className="sleeve w-[82%] shrink-0 snap-start sm:w-auto">
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
                    className="display-condensed mt-[0.08em] block whitespace-nowrap leading-[0.82]"
                    style={{ fontSize: `${Math.min(30, 84 / (p.name.length * 0.5)).toFixed(2)}cqw` }}
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
          <li className="sleeve w-[82%] shrink-0 snap-start sm:w-auto">
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

      <section aria-labelledby="notes-title" className="mt-14 grid gap-10 border-t border-ink-3 pt-8 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 id="notes-title" className="display-wide text-2xl">
            Liner notes
          </h2>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-paper-dim">
            Every answer in the crate carries a rarity estimate: how many music lovers we think would say it first. Hits score
            a little. Rare catalog scores a lot. Typos are forgiven; answers not on our list score nothing.
          </p>
          <Link
            href="/play/general"
            className="display-wide mt-6 inline-flex min-h-12 items-center gap-3 bg-paper px-5 text-base text-ink no-underline transition-colors duration-150 hover:bg-[var(--field-ochre)]"
          >
            Play today&rsquo;s General
            <ArrowRight className="size-5" />
          </Link>
        </div>
        <ol className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {LADDER.map(({ tier, range }) => (
            <li key={tier}>
              <TierMark tier={tier} className="size-10" />
              <p className="display-wide mt-3 text-base leading-tight">{TIERS[tier].label}</p>
              <p className="smallprint tnum mt-1 text-paper-mute">{range} pts</p>
              <p className="mt-1 text-sm text-paper-dim">{TIERS[tier].note}.</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t border-ink-3 pt-5 text-sm text-paper-mute">
        <span>Crate Digger. Rarity scores are estimates, not live player counts.</span>
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
