/** Splits "Name a song by OutKast" into a small lead ("Name a") and the cover subject. */
export function splitPrompt(text: string): { lead: string; subject: string } {
  const m = text.match(/^(name\s+an?)\s+(.+)$/i);
  return m ? { lead: m[1], subject: m[2] } : { lead: "", subject: text };
}

/**
 * Size condensed 900 to fill the sleeve without breaking words. Archivo at 62% width
 * runs about 0.46em per uppercase glyph; the sleeve's inner width is about 88cqw.
 */
function fit(subject: string): string {
  const longest = Math.max(...subject.split(/\s+/).map((w) => w.length));
  const byWord = (88 * 0.94) / (longest * 0.46);
  const len = subject.length;
  const byLength = len <= 14 ? 24 : len <= 22 ? 19 : len <= 32 ? 15 : len <= 44 ? 12.5 : 10.5;
  const size = Math.min(byWord, byLength);
  return `min(${size.toFixed(2)}cqw, 6rem)`;
}

export function CoverType({ text, as: Tag = "h1", id }: { text: string; as?: "h1" | "h2" | "p"; id?: string }) {
  const { lead, subject } = splitPrompt(text);
  return (
    <Tag id={id} className="text-on">
      {lead && <span className="display-wide block text-[clamp(0.95rem,4.6cqw,1.6rem)] leading-none">{lead}</span>}
      <span className="display-condensed mt-[0.12em] block text-balance" style={{ fontSize: fit(subject) }}>
        {subject}
      </span>
    </Tag>
  );
}
