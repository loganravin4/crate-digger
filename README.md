# Crate Digger

A daily music trivia game: seven prompts a day, one typed answer each, and the rarer your correct answer, the more it scores. Packs: General, Hip-Hop, Pop.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run lint
```

- Prompt content lives in `src/data/packs/*.json` (`PackFile` in `src/data/types.ts`). Register a new pack in `src/data/packs.ts`.
- Each answer has a fixed `tier` (`src/lib/tiers.ts`): Radio Edit 10, Staff Pick 15, Album Track 30, B-Side 60, White Label 85, Holy Grail 100 (one per prompt).
- The play scene is a three.js crate in `src/components/crate/`; sounds are synthesized in `src/lib/sound.ts`.
- Daily deal: `src/lib/daily.ts` (same seven prompts per pack per local date, no repeats within a cycle). Matching: `src/lib/match.ts`.
- Set `NEXT_PUBLIC_SITE_URL` in production for canonical, sitemap, and OG URLs.
