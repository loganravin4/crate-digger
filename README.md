# Crate Digger

A daily music trivia game: six prompts a day, one typed answer each, and the rarer your correct answer, the more it scores. Packs: General, Hip-Hop, Pop.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run lint
```

- Prompt content lives in `src/data/packs/*.json` (`PackFile` in `src/data/types.ts`). Register a new pack in `src/data/packs.ts`.
- `pop` on each answer is a seeded rarity estimate (1-100), not measured data. Points are `100 * (1 - sqrt(pop / 100))`, floor 5, max 90.
- Daily deal: `src/lib/daily.ts` (same six prompts per pack per local date, no repeats within a cycle). Matching: `src/lib/match.ts`.
- Set `NEXT_PUBLIC_SITE_URL` in production for canonical, sitemap, and OG URLs.
