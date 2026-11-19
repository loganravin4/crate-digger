#!/usr/bin/env node
// Popularity evidence for every answer in a pack: resolve each answer to an English
// Wikipedia article in the prompt's context, then read its recent human pageviews.
// Evidence only; tiers are assigned by judgment on top of it.
//
//   node scripts/rarity/research.mjs <packId>
//
// Reads  src/data/packs/<packId>.json and scripts/rarity/hints/<packId>.json
// Writes scripts/rarity/evidence/<packId>.json (per prompt, sorted by views)
//
// hints/<packId>.json shape:
//   { "<promptId>": { "hint": "Beatles song", "titles": { "Answer name": "Exact Wikipedia title" } } }
// "titles" pins answers that resolve wrongly. A title of "" means "no article".
//
// Polite by design: one request at a time, batched 50 titles per query, honoring
// Retry-After. Expect a few minutes per pack.

import fs from "node:fs";
import path from "node:path";

const UA = "CrateDiggerResearch/0.2 (rarity research script)";
const API = "https://en.wikipedia.org/w/api.php";
const GAP_MS = 1000;
const DAYS = 60;

const packId = process.argv[2];
if (!packId) {
  console.error("usage: node scripts/rarity/research.mjs <packId>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "../..");
const pack = JSON.parse(fs.readFileSync(path.join(root, "src/data/packs", `${packId}.json`), "utf8"));
const hintsPath = path.join(root, "scripts/rarity/hints", `${packId}.json`);
const hints = fs.existsSync(hintsPath) ? JSON.parse(fs.readFileSync(hintsPath, "utf8")) : {};
const outDir = path.join(root, "scripts/rarity/evidence");
fs.mkdirSync(outDir, { recursive: true });
const cachePath = path.join(outDir, `.cache-${packId}.json`);
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : { pages: {}, search: {} };
const saveCache = () => fs.writeFileSync(cachePath, JSON.stringify(cache));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const giveUpAt = Date.now() + 40 * 60 * 1000;
  for (let attempt = 0; Date.now() < giveUpAt; attempt++) {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.json();
      // A temporary block can outlast Retry-After; stretch the wait each time, up to 5 minutes.
      const retry = Math.min(300, Math.max(Number(res.headers.get("retry-after")) || 5, 30 * attempt));
      process.stdout.write(` [${res.status}, waiting ${retry}s]`);
      await sleep(retry * 1000 + 250);
    } catch (e) {
      process.stdout.write(` [${e.name}]`);
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error(`Wikipedia kept refusing: ${url.slice(0, 120)}…`);
}

/** Look up many titles at once: existence, redirects, short description, disambiguation, pageviews. */
async function lookup(titles) {
  const todo = [...new Set(titles.filter((t) => t && !(t in cache.pages)))];
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    // Pageviews come back for only part of a batch per response; follow `continue` until done.
    const pages = new Map();
    const alias = new Map();
    let cont = {};
    for (let guard = 0; guard < 20; guard++) {
      const data = await api({
        action: "query",
        titles: batch.join("|"),
        prop: "pageviews|description|pageprops",
        ppprop: "disambiguation",
        pvipdays: String(DAYS),
        redirects: "1",
        ...cont,
      });
      const q = data.query ?? {};
      for (const n of q.normalized ?? []) alias.set(n.from, n.to);
      for (const r of q.redirects ?? []) alias.set(r.from, r.to);
      for (const p of q.pages ?? []) {
        const prev = pages.get(p.title) ?? {};
        pages.set(p.title, { ...prev, ...p, pageviews: { ...(prev.pageviews ?? {}), ...(p.pageviews ?? {}) } });
      }
      if (!data.continue) break;
      cont = data.continue;
    }
    const byTitle = pages;
    for (const t of batch) {
      let final = t;
      for (let k = 0; k < 4 && alias.has(final); k++) final = alias.get(final);
      const p = byTitle.get(final);
      cache.pages[t] =
        !p || p.missing || p.invalid
          ? null
          : {
              title: p.title,
              description: p.description ?? "",
              disambiguation: !!p.pageprops && "disambiguation" in p.pageprops,
              views: Object.values(p.pageviews ?? {}).reduce((s, v) => s + (v ?? 0), 0),
            };
    }
    saveCache();
  }
}

async function search(q) {
  if (q in cache.search) return cache.search[q];
  const data = await api({ action: "query", list: "search", srsearch: q, srlimit: "1", srprop: "" });
  const title = data.query?.search?.[0]?.title ?? null;
  cache.search[q] = title;
  saveCache();
  return title;
}

/** Wikipedia's conventional disambiguated titles for an answer, given the prompt's hint. */
function candidates(name, hint) {
  const h = hint.toLowerCase();
  const subject = hint.replace(/(song|songs|album|albums|single)/gi, "").trim();
  const out = [];
  if (/song|single/.test(h)) {
    if (subject) out.push(`${name} (${subject} song)`);
    out.push(`${name} (song)`);
  }
  if (/album/.test(h)) {
    if (subject) out.push(`${name} (${subject} album)`);
    out.push(`${name} (album)`);
  }
  if (/band|group|act|duo|crew|clan|collective/.test(h)) out.push(`${name} (band)`, `${name} (group)`);
  if (/rapper|hip hop|hip-hop/.test(h)) out.push(`${name} (rapper)`);
  if (/singer|artist|musician|star|member|composer|producer|dj/.test(h)) out.push(`${name} (singer)`, `${name} (musician)`);
  if (/label/.test(h)) out.push(`${name} (record label)`, `${name} Records`);
  if (/festival/.test(h)) out.push(`${name} (festival)`, `${name} Festival`);
  if (/instrument/.test(h)) out.push(`${name} (instrument)`);
  if (out.length === 0) out.push(`${name} (band)`, `${name} (musician)`);
  return [...new Set(out)];
}

const MUSIC = /song|single|album|record|music|band|group|singer|rapper|musician|composer|songwriter|producer|dj|duo|trio|artist|vocalist|guitarist|pianist|drummer|bassist|saxophonist|trumpeter|festival|instrument|label|orchestra|ensemble|boy band|girl group|hip hop|jazz|soul|rock|pop|country|eurovision/;

/** Does an article fit the prompt? A music article, or one whose description names the hint. */
function fits(page, hint) {
  if (!page || page.disambiguation) return false;
  const hay = `${page.description} ${page.title}`.toLowerCase();
  const words = (hint ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  return MUSIC.test(hay) || words.some((w) => hay.includes(w));
}

const evidence = [];
for (const prompt of pack.prompts) {
  const h = hints[prompt.id] ?? {};
  const pinned = h.titles ?? {};
  // Pass 1: the answer's own name (or its pinned title) as an exact title.
  const first = prompt.answers.map((a) => (a.name in pinned ? pinned[a.name] : a.name));
  await lookup(first);
  // Pass 2: Wikipedia's own disambiguation titles, batched ("Vogue (Madonna song)", "Common (rapper)").
  const misses = prompt.answers.map((a, i) => (a.name in pinned || fits(cache.pages[first[i]], h.hint) ? null : a));
  const cands = new Map();
  for (const a of misses) if (a) cands.set(a.name, candidates(a.name, h.hint ?? ""));
  await lookup([...cands.values()].flat());
  // Pass 3: a real search, only for the few still unresolved (capped to stay polite).
  let searches = 0;
  const resolved = [];
  for (let i = 0; i < prompt.answers.length; i++) {
    const a = prompt.answers[i];
    if (a.name in pinned) {
      resolved.push({ a, title: pinned[a.name] || null, how: pinned[a.name] ? "pinned" : "none" });
      continue;
    }
    if (!misses[i]) {
      resolved.push({ a, title: first[i], how: "exact" });
      continue;
    }
    const hit = cands.get(a.name).find((t) => fits(cache.pages[t], h.hint));
    if (hit) {
      resolved.push({ a, title: hit, how: "qualified" });
      continue;
    }
    if (searches < 6) {
      searches++;
      const found = await search(`${a.name} ${h.hint ?? ""}`.trim());
      resolved.push({ a, title: found, how: found ? "search" : "none" });
    } else {
      // Fall back to the exact title if it exists at all; flagged for review.
      resolved.push({ a, title: cache.pages[first[i]] ? first[i] : null, how: cache.pages[first[i]] ? "exact?" : "none" });
    }
  }
  await lookup(resolved.map((r) => r.title).filter(Boolean));
  const rows = resolved.map(({ a, title, how }) => {
    const page = title ? cache.pages[title] : null;
    return { name: a.name, title: page?.title ?? title, how, description: page?.description ?? "", views: page?.views ?? 0 };
  });
  rows.sort((x, y) => y.views - x.views);
  evidence.push({ id: prompt.id, text: prompt.text, hint: h.hint ?? "", days: DAYS, answers: rows });
  process.stdout.write(`\n${prompt.id} ✓ (${rows.filter((r) => r.how === "search").length} searched)`);
}
fs.writeFileSync(path.join(outDir, `${packId}.json`), JSON.stringify(evidence, null, 2) + "\n");
console.log(`\nwrote scripts/rarity/evidence/${packId}.json`);
