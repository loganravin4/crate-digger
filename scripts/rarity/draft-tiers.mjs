#!/usr/bin/env node
// First-pass tiers from popularity evidence. Writes `tier` onto every answer and drops
// the legacy `pop` field. A human (or an agent) then reviews: fixes bad title matches,
// adjusts salience in context, picks the holy grail and staff picks, and writes quips.
//
//   node scripts/rarity/draft-tiers.mjs <packId> [--keep]
//
// --keep leaves tiers that are already set (so a reviewed pack can be re-drafted safely).
//
// Bands, by cumulative share of the prompt's total views (most viewed first):
//   radio-edit   up to 45% of views (at least 2, at most 8 answers)
//   album-track  up to 72%
//   b-side       up to 90%
//   white-label  the rest
// The single least-viewed answer that still has a real article becomes the draft
// holy grail, purely as a placeholder for review.

import fs from "node:fs";
import path from "node:path";

const [packId, flag] = process.argv.slice(2);
if (!packId) {
  console.error("usage: node scripts/rarity/draft-tiers.mjs <packId> [--keep]");
  process.exit(1);
}
const keep = flag === "--keep";
const root = path.resolve(import.meta.dirname, "../..");
const packPath = path.join(root, "src/data/packs", `${packId}.json`);
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(root, "scripts/rarity/evidence", `${packId}.json`), "utf8"));
const byPrompt = new Map(evidence.map((e) => [e.id, e]));

for (const prompt of pack.prompts) {
  const ev = byPrompt.get(prompt.id);
  if (!ev) continue;
  const views = new Map(ev.answers.map((r) => [r.name, r.views]));
  const ranked = [...prompt.answers].sort((a, b) => (views.get(b.name) ?? 0) - (views.get(a.name) ?? 0));
  const total = ranked.reduce((s, a) => s + (views.get(a.name) ?? 0), 0) || 1;
  let cum = 0;
  ranked.forEach((a, i) => {
    cum += views.get(a.name) ?? 0;
    const share = cum / total;
    let tier;
    if (i < 2 || (share <= 0.45 && i < 8)) tier = "radio-edit";
    else if (share <= 0.72) tier = "album-track";
    else if (share <= 0.9) tier = "b-side";
    else tier = "white-label";
    if (!(keep && a.tier)) a.tier = tier;
  });
  if (!prompt.answers.some((a) => a.tier === "holy-grail")) {
    const grail = [...ranked].reverse().find((a) => (views.get(a.name) ?? 0) > 0) ?? ranked[ranked.length - 1];
    grail.tier = "holy-grail";
  }
  for (const a of prompt.answers) delete a.pop;
}
fs.writeFileSync(packPath, JSON.stringify(pack, null, 2) + "\n");
console.log(`drafted tiers for ${packId}`);
