import { TIERS, type TierId } from "@/lib/tiers";

/**
 * Procedural sleeve art in the game's hard-bop language: one flat field, one bold
 * motif, a strip of small print. Drawn to canvases that become textures.
 */

export const FIELDS = ["#e4ae1f", "#bf3a22", "#2b57a6", "#1f7a72", "#d9772b", "#f3ecdd", "#7a3f6b", "#6b6a2a", "#d77a8a", "#1d1a16", "#4f8fbf", "#c9b48a"];
const INK = "#16130f";
const PAPER = "#f3ecdd";
const GOLD = "#f2c14e";

export type Fonts = { display: string; text: string };

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
}

/** A random but stable record cover. */
export function drawCover(seed: number, fonts: Fonts, size = 256): HTMLCanvasElement {
  const r = rng(seed);
  const [c, g] = canvas(size);
  const field = FIELDS[Math.floor(r() * FIELDS.length)];
  let ink = r() < 0.5 ? INK : PAPER;
  if (field === PAPER || field === "#e4ae1f" || field === "#c9b48a" || field === "#d77a8a") ink = INK;
  if (field === "#1d1a16") ink = FIELDS[Math.floor(r() * 5)];
  const s = size;
  g.fillStyle = field;
  g.fillRect(0, 0, s, s);
  g.fillStyle = ink;
  const kind = Math.floor(r() * 6);
  if (kind === 0) {
    g.beginPath();
    g.arc(s * (0.3 + r() * 0.4), s * (0.3 + r() * 0.35), s * (0.18 + r() * 0.16), 0, Math.PI * 2);
    g.fill();
  } else if (kind === 1) {
    for (let i = 0; i < 3 + Math.floor(r() * 3); i++) g.fillRect(s * 0.1, s * (0.12 + i * 0.13), s * (0.3 + r() * 0.6), s * 0.07);
  } else if (kind === 2) {
    g.fillRect(s * (0.45 + r() * 0.2), 0, s, s);
  } else if (kind === 3) {
    g.font = `900 ${Math.round(s * 0.7)}px ${fonts.display}`;
    g.textBaseline = "alphabetic";
    g.fillText(String.fromCharCode(65 + Math.floor(r() * 26)), s * 0.08, s * 0.8);
  } else if (kind === 4) {
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * (0.42 - i * 0.055), 0, Math.PI * 2);
      g.lineWidth = s * 0.018;
      g.strokeStyle = ink;
      g.stroke();
    }
  } else {
    g.fillRect(0, s * (0.55 + r() * 0.15), s, s);
    g.fillStyle = field;
    g.beginPath();
    g.arc(s * 0.7, s * 0.62, s * 0.12, 0, Math.PI * 2);
    g.fill();
  }
  // Small print strip.
  g.fillStyle = ink;
  g.globalAlpha = 0.85;
  g.font = `700 ${Math.round(s * 0.05)}px ${fonts.text}`;
  g.fillText(["BLUE SIDE", "HI-FI", "STEREO", "MONO", "VOL. 2", "SESSIONS", "LIVE AT", "PRESSING"][Math.floor(r() * 8)], s * 0.07, s * 0.94);
  g.globalAlpha = 1;
  return c;
}

/** Card-stock divider with a tab naming the tier section behind it. */
export function drawDivider(tier: TierId, fonts: Fonts, size = 256): HTMLCanvasElement {
  const [c, g] = canvas(size);
  const s = size;
  const color = tier === "holy-grail" ? GOLD : "#e9e1cf";
  g.fillStyle = color;
  g.fillRect(0, 0, s, s);
  g.fillStyle = INK;
  g.font = `900 ${Math.round(s * 0.11)}px ${fonts.display}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(TIERS[tier].label.toUpperCase(), s / 2, s * 0.36);
  g.font = `700 ${Math.round(s * 0.06)}px ${fonts.text}`;
  g.fillText(`${TIERS[tier].stratum.toUpperCase()} · ${TIERS[tier].points} PTS`, s / 2, s * 0.49);
  // Ruled lines like a shop's handwritten divider.
  g.strokeStyle = "rgba(22,19,15,0.22)";
  g.lineWidth = 2;
  for (let y = s * 0.6; y < s * 0.95; y += s * 0.1) {
    g.beginPath();
    g.moveTo(s * 0.1, y);
    g.lineTo(s * 0.9, y);
    g.stroke();
  }
  return c;
}

/** The pulled record: your answer printed as its own cover. */
export function drawResultCover(opts: {
  tier: TierId | null;
  answer: string;
  field: string;
  on: string;
  fonts: Fonts;
  size?: number;
}): HTMLCanvasElement {
  const { tier, answer, fonts } = opts;
  const s = opts.size ?? 512;
  const [c, g] = canvas(s);
  let bg = opts.field;
  let fg = opts.on;
  if (tier === "holy-grail") {
    bg = GOLD;
    fg = INK;
  } else if (tier === "white-label") {
    bg = "#f7f3ea";
    fg = INK;
  } else if (!tier) {
    bg = "#2a251d";
    fg = PAPER;
  }
  g.fillStyle = bg;
  g.fillRect(0, 0, s, s);
  if (tier === "white-label") {
    // A rubber stamp, slightly crooked.
    g.save();
    g.translate(s * 0.68, s * 0.24);
    g.rotate(-0.14);
    g.strokeStyle = "#bf3a22";
    g.lineWidth = s * 0.012;
    g.strokeRect(-s * 0.22, -s * 0.06, s * 0.44, s * 0.12);
    g.fillStyle = "#bf3a22";
    g.font = `900 ${Math.round(s * 0.05)}px ${fonts.display}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("PROMO · NOT FOR SALE", 0, 0);
    g.restore();
  }
  g.fillStyle = fg;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.font = `700 ${Math.round(s * 0.036)}px ${fonts.text}`;
  g.fillText("CRATE DIGGER", s * 0.07, s * 0.1);
  // Answer, set big and condensed, wrapped to the cover width.
  const words = (answer || "No find").toUpperCase().split(/\s+/);
  let size = s * 0.2;
  let lines: string[] = [];
  for (; size > s * 0.06; size *= 0.9) {
    g.font = `900 ${Math.round(size)}px ${fonts.display}`;
    lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > s * 0.86 && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    lines.push(line);
    if (lines.length <= 4 && lines.every((l) => g.measureText(l).width <= s * 0.86)) break;
  }
  const lh = size * 0.92;
  const base = s * 0.78;
  lines.forEach((l, i) => g.fillText(l, s * 0.07, base - (lines.length - 1 - i) * lh));
  g.font = `800 ${Math.round(s * 0.05)}px ${fonts.display}`;
  const label = tier ? `${TIERS[tier].label.toUpperCase()} · +${TIERS[tier].points}` : "NOT IN THIS CRATE";
  g.fillText(label, s * 0.07, s * 0.9);
  return c;
}

/** Soft round light for out-of-focus shop lamps. */
export function drawGlow(color: string, size = 128): HTMLCanvasElement {
  const [c, g] = canvas(size);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** A featured pack's sleeve: its field color, its own type voice, and the shop's small print. */
export function drawPackCover(
  pack: { name: string; series: string; field: string; on: string; voice?: "condensed" | "wide" | "italic" },
  fonts: Fonts,
  size = 512,
): HTMLCanvasElement {
  const s = size;
  const [c, g] = canvas(s);
  g.fillStyle = pack.field;
  g.fillRect(0, 0, s, s);
  g.fillStyle = pack.on;
  g.font = `700 ${Math.round(s * 0.036)}px ${fonts.text}`;
  g.textBaseline = "alphabetic";
  g.fillText("CRATE DIGGER", s * 0.07, s * 0.1);
  g.fillText(pack.series.toUpperCase(), s * 0.07, s * 0.15);
  g.textAlign = "right";
  g.fillText("DAILY · 7 TRACKS", s * 0.93, s * 0.1);
  g.textAlign = "left";
  const voice = pack.voice ?? "condensed";
  const stretch = voice === "wide" ? "expanded" : "extra-condensed";
  const style = voice === "italic" ? "italic " : "";
  const name = pack.name.toUpperCase();
  let size2 = s * 0.42;
  for (; size2 > s * 0.1; size2 *= 0.94) {
    g.font = `${style}900 ${stretch} ${Math.round(size2)}px ${fonts.display}`;
    if (g.measureText(name).width <= s * 0.86) break;
  }
  g.fillText(name, s * 0.07, s * 0.86);
  // A rule and the tagline, like a label's catalog line.
  g.fillRect(s * 0.07, s * 0.895, s * 0.86, Math.max(2, s * 0.004));
  g.font = `700 ${Math.round(s * 0.032)}px ${fonts.text}`;
  g.fillText("NAME THE RECORD NOBODY ELSE WOULD", s * 0.07, s * 0.94);
  return c;
}
