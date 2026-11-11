# Site Theme and Web App Implementation Plan

Plans 2 and 3 for `docs/superpowers/specs/2026-11-10-web-app-black-theme-design.md`. Branch `web-app` only; `main` auto-deploys and is not touched until the owner approves.

Unlike plan 1, this document lists tasks, files and interfaces but does not repeat the UI code: the visual source of truth is the nine `Web-*.dc.html` boards, and the code is written once, in the files below.

## Status of plan 1 (backend)

- Deployed to the Personal backend on 2026-11-11 (`5b43e98`): routing, multi-runway headings, receiver stats, channel-list fix. 38 tests pass (`tests/`).
- Agent 3.7 is on branch `agent-3.7` in the backend repo and hand-installed on the owner's Pi (`/home/pi/finalping-ground/`, 3.6 kept as `finalping_ground.py.3.6.bak`). NOT yet published: `version.txt` on `main` is still 3.6. Publish = plan 1, Task 6, Steps 8–9, after it has run with real traffic.

## Global constraints

- Tokens, fonts and colors exactly as in the spec's "Site theme" table. No orange, no green. Buy buttons white with `#0A0A0A` text.
- No emoji as icons; lucide-react icons.
- The browser only calls same-origin `/api/*`. The tracker JWT never reaches page scripts.
- CSP in `next.config.ts` must allow what the app loads (map tiles) and nothing more.
- Commit messages end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## Deviation from the spec

The spec moves every page under an `app/(site)/` route group. Instead, `app/layout.tsx` keeps its place and a small client component, `SiteChrome`, renders the marketing navbar, container and footer for every path except `/app`. This avoids moving ~30 directories and rewriting their relative imports, and the site already switches chrome by path (`landing-mode`).

## Tasks

### A. Theme foundation
1. `app/globals.css`: single `:root` token set; remove `[data-theme]` variants; fix rules that hard-code light colors (nav, drawer, buttons, tabs, legal, select).
2. `app/layout.tsx`: Geist + Geist Mono via `next/font/google` (`--font-sans`, `--font-mono`); drop `data-theme`; wrap children in `SiteChrome`.
3. `app/components/SiteChrome.tsx` (new, client): `{navbar, footer, children}`; bare children when `pathname` starts with `/app`.
4. `app/components/Navbar.tsx`, `MobileMenu.tsx`: primary button "Open app" → `/app`.
5. Delete `ThemeProvider.tsx`, `ThemeToggle.tsx` (unused).

### B. Web app plumbing
1. `lib/trackerSession.ts`: `getTrackerToken(email, userId)` (mint through the desktop bridge), cookie helpers. Cookie `fp_tracker`.
2. `app/api/tracker/[...path]/route.ts`: allow-listed proxy; 401 → re-mint once; 402 on `license_expired`.
3. `app/api/airports/route.ts` + `lib/data/airports.json`: airport search.
4. `app/api/aircraft-lookup/route.ts`: registry lookup for a tail number (server-side call to adsbdb, so CSP `connect-src` stays closed).
5. `next.config.ts`: `img-src` gains the Esri tile host.

### C. Web app UI — `app/app/`
- `layout.tsx` (server: session gate) → `_components/AppShell.tsx` (client).
- `_lib/`: `tracker.ts` (typed fetch client), `store.tsx` (shared polling context: user, aircraft, live, airport, ground), `format.ts`, `types.ts`.
- `_components/`: `TopNav`, `BottomTabs`, `LiveStrip`, `kit.tsx` (Card, Button, Pill, Toggle, Field, Empty, PageHead), `ApproachLadder`, `RingMap` (SVG mini map), `LeafletMap`.
- Screens: `page.tsx` (Dashboard), `aircraft/`, `map/`, `airport/`, `alerts/`, `integrations/`, `logs/`, `ground-station/`.
- `app.css`: app-only styles under `.fp-app`.

### D. Recolor every live page
`LandingPageV3`, `dashboard`, `login/*`, `pricing`, `download`, `groundstationkit`, `groundstationsetup`, `admin`, `alerts`, `contact`, `changelog`, `docs`, `status`, `waitlist`, legal pages, `not-found`, `auth/desktop-complete`, shared components, `opengraph-image`. Replace hard-coded light colors with tokens; replace emoji icons with lucide.

### E. Verification
- `npm run lint`, `npm run build`.
- Local `npm run dev`; each web app screen at 1440px and 390px signed in as the owner; reads compared with the desktop app; writes exercised with a throwaway aircraft and webhook, then removed.
- Every sitemap route + login/dashboard/checkout screenshotted for leftover light surfaces.
