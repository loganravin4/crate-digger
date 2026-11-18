# Launch gate: 2026-11-18

This is an engineering checklist, not legal advice.

Scope (details in PRODUCT.md, "Compliance scope"):
- Static Next.js site with no backend.
- No accounts, payments, UGC, analytics, ads, or email/SMS.
- Game state lives in localStorage only.
- General audience, not directed at children.
- Web only.

## Blockers (must fix before launch)

None.

## Fixed in this run

- Added security headers in `next.config.ts`:
  - HSTS
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - CSP with `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`
  - `poweredByHeader: false`
- Added a privacy notice at `/privacy` that matches the data inventory: localStorage game state only, no third parties. It's a draft.
- Added an accessibility statement at `/accessibility`. It covers WCAG 2.2 AA, the clock-off switch for SC 2.2.1, and known gaps.
- Linked both pages from the footer.
- Fixed color contrast:
  - `--on-vermilion-mute` raised to 5.02:1.
  - `--back-faint` raised to 5.15:1.
  - `--tier-miss` raised so ink text on the disc label passes.
- Replaced the live timer announcement, which was noisy, with a single 10-second warning.

## Needs the user

- Replace `[contact email]` on `/privacy` and `/accessibility`.
- Have a lawyer review `/privacy` before a public launch. It's short, but it's still a draft.
- Set `NEXT_PUBLIC_SITE_URL` in Vercel so canonical, sitemap, and Open Graph URLs point at the real domain.
- Run HTTP Observatory against the deployed host. It can't run on localhost.
- Do a screen-reader pass (NVDA) on the play flow. The automated and keyboard checks passed, but a real screen-reader run was not done.

## Accepted risks (with reason)

- **Answer lists are visible to anyone who reads the client bundle.** No backend means a determined player could cheat. That's acceptable for a casual daily game with no prizes.
- **Rarity comes from authored estimates, not measured data.** The UI labels it as an estimate everywhere.
- **A few trivia facts remain uncertain.** Every flagged list was fact-checked against web sources on 2026-11-18. Still open: Jeezy's "raised in Atlanta" status; Eazy-E, DJ Paul, and Juicy J on "in a group before going solo"; and "We Can't Be Friends" as a Max Martin co-write, which rests on one source.

## Not checked (and why)

- `insecure-defaults`, `sentry-security-review`, and `owasp-security` deep reviews: the app has no server routes, auth, database, uploads, or secrets, so there's no attack surface for them.
  - Semgrep `p/default` came back clean.
  - React renders all user input as text. There's no `dangerouslySetInnerHTML` or `eval`.
- Stores section: web only.
- Subscriptions, UGC, children, and marketing sections: out of scope (see Scope).
- Cookie consent: no cookies or trackers. localStorage holds only state needed for the game the player asked to play.

## Scan results

| Tool | Command | Result |
|---|---|---|
| gitleaks (history) | `gitleaks git .` | No leaks |
| gitleaks (tree) | `gitleaks dir .` | 10 hits, all false positives in git-ignored `.next/` build output and Impeccable's ignored seed files |
| npm audit | `npm audit --omit=dev` | 0 vulnerabilities |
| osv-scanner | `osv-scanner scan source -r .` | No issues (427 packages) |
| semgrep | `semgrep scan --config p/default src` | No findings |
| axe-core 4.10.2 (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) | `/`, `/privacy`, `/accessibility`, play intro, round, reveal, back cover | 0 violations |
| Lighthouse | `/` and `/play/hiphop` | 100 / 100 / 100 / 100 (performance, accessibility, best practices, SEO) |
| Keyboard | Tab through home; play a full round with Enter only | Pass. Focus is visible and the order is logical. |
