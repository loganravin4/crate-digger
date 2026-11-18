import { Fragment } from "react";

/** Splits "Name a song by OutKast" into a small lead ("Name a") and the cover subject. */
export function splitPrompt(text: string): { lead: string; subject: string } {
  const m = text.match(/^(name\s+an?)\s+(.+)$/i);
  return m ? { lead: m[1], subject: m[2] } : { lead: "", subject: text };
}

/**
 * Size the pack's display voice to fill the sleeve without breaking words.
 * `glyph` is the voice's average uppercase glyph width in em; the sleeve's inner width is about 88cqw.
 */
export function fitCover(subject: string, glyph: number, cap = "6rem"): string {
  const longest = Math.max(...subject.split(/\s+/).map((w) => w.length));
  const byWord = (88 * 0.94) / (longest * glyph);
  const len = subject.length * (glyph / 0.46);
  const byLength = len <= 14 ? 24 : len <= 22 ? 19 : len <= 32 ? 15 : len <= 44 ? 12.5 : 10.5;
  const size = Math.min(byWord, byLength);
  return `min(${size.toFixed(2)}cqw, ${cap})`;
}

export function CoverType({ text, glyph, id }: { text: string; glyph: number; id?: string }) {
  const { lead, subject } = splitPrompt(text);
  return (
    <h1 id={id} className="text-on">
      {lead && <span className="display-wide block text-[clamp(0.95rem,4.6cqw,1.6rem)] leading-none">{lead}</span>}
      <span className="voice mt-[0.12em] block text-balance" style={{ fontSize: fitCover(subject, glyph) }}>
        {/* Words never break, including at hyphens ("one-word"). */}
        {subject.split(" ").map((w, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="whitespace-nowrap">{w}</span>
          </Fragment>
        ))}
      </span>
    </h1>
  );
}
