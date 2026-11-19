# Product

<!-- impeccable:product-schema 1 -->

## Brief

```
Who: Music lovers who know more than the radio does, on their phone once a day (commute, bed, group chat).
Job: Type the rarest correct answer to seven music prompts, then share the score. The one action: dig.
Kind: Browser game (daily trivia), general deck plus genre packs.
Mode: Experience (the play screen); pack picker and results are Operate.
Material: none; prompt and answer content authored for v1 (src/data/packs/*.json), each answer carries a fixed tier assigned from Wikipedia pageview evidence plus judgment (scripts/rarity/).
Constraints: Next.js App Router + TypeScript + Tailwind, no backend, works offline, deploy target Vercel.
```

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, chosen by the user. No backend in v1.

## Users

Music lovers who take pride in knowing the deep end of a catalog: record-store regulars, playlist obsessives, genre loyalists. They play once a day, usually on a phone, in a short window, then compare scores with friends.

## Product Purpose

A daily music trivia game where any correct answer scores, but the rarer it is the more it scores. Each pack (General, Hip-Hop, Pop, and more later) serves the same seven prompts to everyone on a given day. Success means a player comes back daily and shares results.

## Positioning

The game rewards knowing the B-side, not the hit. Naming "Purple Rain" is safe; naming "Sometimes It Snows in April" is the flex. Genre packs let specialists play on their home turf.

## Operating Context

- One daily set per pack, the same for every player on a given local date. A practice mode deals random prompts on demand.
- Typed free-text answers, matched with normalization and typo tolerance against an authored answer list.
- Results are shared as plain text through the clipboard or the native share sheet.

## Capabilities and Constraints

- Rarity comes from a fixed tier on each answer, assigned from two months of Wikipedia pageviews read in the prompt's context and hand-checked (`scripts/rarity/research.mjs`, evidence in `scripts/rarity/evidence/`). It is not measured player data, so the UI must never claim "X% of players said this". A backend that counts real answers is a possible later version.
- Wrong answers don't end a round: the player keeps guessing until the clock runs out or they pass. Typo matches ask "did you mean…?" first. Empty submissions are refused.
- An answer missing from the list is scored as not found; the game cannot verify answers outside its list.
- Stats and streaks live in localStorage only.
- Fixed-point tiers (our own vocabulary), shallow to deep: Radio Edit 10, Staff Pick 15 (the "obscure" pick everyone makes), Album Track 30, B-Side 60, White Label 85, Holy Grail 100 (one designated gem per prompt). Max 700 over seven rounds.
- The play screen is "The Dig": a canvas cross-section of a record shop; the answer drops as a record to its tier's depth, with synthesized sound (mutable).

## Brand Commitments

- Name: Crate Digger (working name).
- Must not borrow Krillion's name, score-tier names (e.g. "deep cut"), copy, or look. Shares the genre (rarest-answer trivia) only.

## Evidence on Hand

No player counts, testimonials, press, or user numbers exist. Don't invent any.

## Product Principles

1. Obscure and correct beats famous; the scoring must make that feel earned.
2. One short daily ritual: done in under three minutes, no account.
3. Honest about what the game knows: researched tiers, not player counts, and a finite answer list.
4. Genre packs feel like home turf, but one system holds them together.

## Accessibility & Inclusion

WCAG 2.2 AA. The timer must be pausable or extendable for players who need more time (WCAG 2.2.1). The game must be fully keyboard-playable.

## Compliance scope

- Users: general audience, US-first; EU/UK visitors can reach it. No EU-targeted commerce.
- Payments, subscriptions, trials: none.
- Accounts, UGC, messaging, AI-generated content: none.
- Children: not directed at children; collects no personal data, so COPPA isn't triggered.
- Email, SMS, reviews, testimonials: none.
- Ads, analytics, pixels, data sale or sharing: none. Only localStorage game state (strictly necessary), so no consent banner is needed.
- Government entity: no.

## Open decisions for the backend version

- **Capture unmatched answers.** Real players give correct answers too niche for the authored lists (seen in playtesting: Michael Jackson's "Loving You"). When a backend exists (Supabase or similar), log every rejected guess per prompt, without personal data. Frequent rejects are review candidates: add them to the list with a tier, or add an alias for a near-miss spelling.
- **Re-tier from real play.** Once enough daily runs exist, blend actual answer frequency into tiers, keeping one designated holy grail per prompt. Until then, tiers stay research plus judgment.
- **Wider sources when polling.** Wikipedia pageviews miss deep catalog. Add a second popularity source (for example Spotify or Last.fm play counts) for songs and artists when the pipeline moves server-side.
