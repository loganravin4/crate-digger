# Product

<!-- impeccable:product-schema 1 -->

## Brief

```
Who: Music lovers who know more than the radio does, on their phone once a day (commute, bed, group chat).
Job: Type the rarest correct answer to six music prompts, then share the score. The one action: dig.
Kind: Browser game (daily trivia), general deck plus genre packs.
Mode: Experience (the play screen); pack picker and results are Operate.
Material: none; prompt and answer content authored for v1 (src/data/packs/*.json), rarity scores are seeded estimates.
Constraints: Next.js App Router + TypeScript + Tailwind, no backend, works offline, deploy target Vercel.
```

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, chosen by the user. No backend in v1.

## Users

Music lovers who take pride in knowing the deep end of a catalog: record-store regulars, playlist obsessives, genre loyalists. They play once a day, usually on a phone, in a short window, then compare scores with friends.

## Product Purpose

A daily music trivia game where any correct answer scores, but the rarer it is the more it scores. Each pack (General, Hip-Hop, Pop, and more later) serves the same six prompts to everyone on a given day. Success means a player comes back daily and shares results.

## Positioning

The game rewards knowing the B-side, not the hit. Naming "Purple Rain" is safe; naming "Sometimes It Snows in April" is the flex. Genre packs let specialists play on their home turf.

## Operating Context

- One daily set per pack, the same for every player on a given local date. A practice mode deals random prompts on demand.
- Typed free-text answers, matched with normalization and typo tolerance against an authored answer list.
- Results are shared as plain text through the clipboard or the native share sheet.

## Capabilities and Constraints

- Rarity in v1 comes from `pop` estimates authored with each answer, not measured player data. The UI must not claim "X% of players said this". Label it as an estimate. A backend that counts real answers is a possible later version.
- An answer missing from the list is scored as not found; the game cannot verify answers outside its list.
- Stats and streaks live in localStorage only.
- Score tiers (our own vocabulary): Radio Edit, Album Track, B-Side, White Label.

## Brand Commitments

- Name: Crate Digger (working name).
- Must not borrow Krillion's name, score-tier names (e.g. "deep cut"), copy, or look. Shares the genre (rarest-answer trivia) only.

## Evidence on Hand

No player counts, testimonials, press, or user numbers exist. Don't invent any.

## Product Principles

1. Obscure and correct beats famous; the scoring must make that feel earned.
2. One short daily ritual: done in under three minutes, no account.
3. Honest about what the game knows: estimated rarity, a finite answer list.
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
