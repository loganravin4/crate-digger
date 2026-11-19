import type { PackMeta } from "@/data/packs";
import type { Pick } from "./storage";
import { bandFor, MAX_TOTAL } from "./score";
import { MISS, TIER_IDS, TIERS } from "./tiers";

const FIELD: Record<PackMeta["tone"], { field: string; on: string }> = {
  ochre: { field: "#e4ae1f", on: "#16130f" },
  vermilion: { field: "#bf3a22", on: "#fffaf5" },
  cobalt: { field: "#2b57a6", on: "#f3ecdd" },
};
const TIER_COLOR: Record<string, string> = {
  "radio-edit": "#a89e8a",
  "staff-pick": "#e08fa0",
  "album-track": "#7ea6de",
  "b-side": "#e4ae1f",
  "white-label": "#f3ecdd",
  "holy-grail": "#f2c14e",
};

/** Spoiler-free share text: one colored mark per track, then the score. */
export function shareText(meta: PackMeta, label: string, picks: Pick[], url: string): string {
  const total = picks.reduce((s, p) => s + p.points, 0);
  const marks = picks.map((p) => (p.tier ? TIERS[p.tier].emoji : MISS.emoji)).join("");
  const deepest = picks.reduce((d, p) => Math.max(d, p.tier ? TIER_IDS.indexOf(p.tier) : -1), -1);
  const lines = [
    `Crate Digger · ${meta.name} ${label}`,
    marks,
    `${total}/${MAX_TOTAL} · ${bandFor(total).label}`,
  ];
  if (deepest >= 0) lines.push(`Deepest dig: ${TIERS[TIER_IDS[deepest]].stratum}`);
  lines.push(url);
  return lines.join("\n");
}

/**
 * A 1080×1350 share card in the game's own look: the pack's sleeve color across the
 * top, the score, and every record sitting at the depths they reached.
 */
export async function shareCard(meta: PackMeta, label: string, picks: Pick[]): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  await document.fonts?.ready;
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-archivo").trim() || "sans-serif";
  const text = css.getPropertyValue("--font-franklin").trim() || "sans-serif";
  const { field, on } = FIELD[meta.tone];
  const total = picks.reduce((s, p) => s + p.points, 0);
  const band = bandFor(total);

  g.fillStyle = "#16130f";
  g.fillRect(0, 0, W, H);

  // Sleeve band.
  g.fillStyle = field;
  g.fillRect(0, 0, W, 420);
  g.fillStyle = on;
  g.textBaseline = "alphabetic";
  g.font = `600 30px ${text}`;
  g.fillText(`CRATE DIGGER · ${meta.name.toUpperCase()}`, 72, 96);
  g.textAlign = "right";
  g.fillText(label.toUpperCase(), W - 72, 96);
  g.textAlign = "left";
  // Canvas ignores CSS font-stretch; set the width axis directly so the score matches the game.
  const setStretch = (v: CanvasFontStretch) => {
    if ("fontStretch" in g) g.fontStretch = v;
  };
  setStretch("extra-condensed");
  g.font = `900 extra-condensed 300px ${display}`;
  g.fillText(String(total), 64, 372);
  const scoreW = g.measureText(String(total)).width;
  setStretch("normal");
  g.font = `800 60px ${display}`;
  g.globalAlpha = 0.7;
  g.fillText(`/ ${MAX_TOTAL}`, 64 + scoreW + 24, 360);
  g.globalAlpha = 1;

  g.fillStyle = "#f3ecdd";
  g.font = `800 64px ${display}`;
  g.fillText(band.label.toUpperCase(), 72, 520);
  g.fillStyle = "#cfc5b1";
  g.font = `500 34px ${text}`;
  g.fillText(band.line, 72, 576);

  // The dig: one column per track, seven depth rows (shop floor + six tiers).
  const top = 650;
  const rowH = 70;
  const left = 300;
  const colW = (W - left - 60) / Math.max(1, picks.length);
  const rows = ["Shop floor", ...TIER_IDS.map((t) => TIERS[t].label)];
  rows.forEach((name, r) => {
    const y = top + r * rowH;
    if (r % 2 === 1) {
      g.fillStyle = "#1d1914";
      g.fillRect(48, y, W - 96, rowH);
    }
    g.fillStyle = r === rows.length - 1 ? "#f2c14e" : "#a89e8a";
    g.font = `700 26px ${text}`;
    g.fillText(name.toUpperCase(), 72, y + rowH / 2 + 9);
  });
  picks.forEach((p, i) => {
    const r = p.tier ? TIER_IDS.indexOf(p.tier) + 1 : 0;
    const cx = left + colW * i + colW / 2;
    const cy = top + r * rowH + rowH / 2;
    g.fillStyle = "#0c0a07";
    g.beginPath();
    g.arc(cx, cy, 32, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(243,236,221,0.12)";
    g.lineWidth = 2;
    for (const rr of [26, 20]) {
      g.beginPath();
      g.arc(cx, cy, rr, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = p.tier ? TIER_COLOR[p.tier] : "#8c8272";
    g.beginPath();
    g.arc(cx, cy, 12, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "#a89e8a";
  g.font = `700 26px ${text}`;
  g.textAlign = "center";
  picks.forEach((_, i) => g.fillText(String(i + 1), left + colW * i + colW / 2, top + rows.length * rowH + 40));
  g.textAlign = "left";

  g.fillStyle = "#f3ecdd";
  g.font = `800 34px ${display}`;
  g.fillText("NAME THE RECORD NOBODY ELSE WOULD.", 72, H - 56);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
}
