# FinalPing web app and black site theme — design

Date: 2026-11-10
Status: approved in chat by the owner; nothing is live until he approves the finished branch.

## Goal

1. Ship the FinalPing tracker as a web app at `finalpingapp.com/app`, built into this site, usable on a phone.
2. Move the whole site to the black, white and grey theme from the web app mockup.
3. Add three features the mockup shows but the tracker lacks: per-event channel routing, a multi-runway picker for the approach filter, and receiver stats.
4. Keep the desktop apps and the live site working exactly as they are at every step.

Visual reference: the nine "Web app" boards in the Design canvas https://claude.ai/artifact/X4H2zhqCwanpNAAa1LzYpr (local copies under the session scratchpad, `features-canvas/project/Web-*.dc.html`).

## Decisions made by the owner

| Topic | Decision |
|---|---|
| Address | `finalpingapp.com/app`, inside this Next.js project |
| Site scope | Recolor every live page; same content and layout. No new Features page, no homepage redesign |
| Accounts | Personal plans only. Teams keeps its desktop app |
| Release | Site work on branch `web-app`; `main` (which auto-deploys) is untouched until approval |
| Buy buttons | White on black. No orange anywhere |
| Font | Geist + Geist Mono, replacing Plus Jakarta Sans |
| Top bar | Main button is "Open app"; Download stays as a menu link |
| Unbuilt mockup features | Build them for real (routing, runway picker, receiver stats) |
| Backend scope | Personal backend only (`aircraft-tracker-backend`); Teams backend untouched |
| Receiver update | Build agent 3.7, install by hand on the owner's Pi first, publish only after it reports |
| Backend timing | Deploy backend additions once tested, before the site is approved |
| Channel-list bug | Fix it (see Backend, item 4) |

## Non-goals

- No desktop app code changes and no new installer.
- No Teams support in the web app (no Team screen, no Teams backend calls).
- No changes to transactional emails.
- `LandingPage.tsx` and `LandingPageV2.tsx` are unused and are left alone.
- No native mobile app.

## Architecture

### Request path

```
browser ──► finalpingapp.com/api/tracker/<path>  (Next.js route handler)
                 │  reads NextAuth session, attaches tracker JWT
                 ▼
        aircraft-tracker-backend (Railway)  /api/<path>
```

- The browser never talks to Railway and never sees the tracker JWT.
- `app/api/tracker/[...path]/route.ts` forwards GET/POST/PUT/DELETE with the JSON body and query string, and returns the backend's status and body unchanged.
- Only an allow-list of path prefixes is forwarded: `aircraft`, `airport`, `locations`, `settings`, `integrations`, `notifications`, `ground`, `user/me`. Everything else returns 404. `/api/internal/*`, `/api/admin/*`, `/api/licenses/*` and `/api/teams/*` are never reachable through the proxy.
- `GET /health` is exposed separately as `/api/tracker/health` with no auth.

### Tracker session

The site already can sign a user into the tracker: the desktop Google flow stores a single-use token on the user row (`desktopOAuthToken`, 5 minute expiry) and the backend's `POST /api/auth/google-desktop` exchanges it by calling back `POST /api/auth/google/desktop-verify`.

`lib/trackerSession.ts`:

1. Read the `fp_tracker` cookie (httpOnly, Secure, SameSite=Lax, 25 day max age). If present, use it.
2. Otherwise mint: write a fresh random token and expiry on the session user's row, call the backend's `/api/auth/google-desktop` with `{token, email}`, and store the returned `access_token` in the cookie.
3. If the backend answers 401 to a proxied call, clear the cookie, mint once more and retry the call once.
4. If minting returns 401 `license_expired`, the proxy returns `{error: "license_expired"}` with 402 and the app shows a plan-expired screen linking to `/dashboard?tab=billing`.

The cookie is cleared on site sign-out. The token and cookie are bound to the NextAuth session's email; the proxy re-checks the session on every call.

Known limit: minting reuses the `desktopOAuthToken` column, so a desktop Google sign-in that lands in the same few hundred milliseconds would fail once and need a retry. Accepted.

### Routing and layouts

Today `app/layout.tsx` wraps every page in the marketing Navbar, a 980px container and the Footer. The web app needs none of those.

- `app/layout.tsx` keeps `<html>`, `<body>`, fonts and `Providers` only.
- `app/(site)/layout.tsx` holds Navbar, `<main class="page">`, container, Footer, CookieConsent. Every existing page directory moves under `app/(site)/` with `git mv`. URLs do not change.
- `app/(webapp)/app/layout.tsx` is the web app shell. `app/api/*` stays where it is.

### Web app structure

```
app/(webapp)/app/
  layout.tsx            server: requires session (redirect to /login?callbackUrl=/app), renders <AppShell>
  page.tsx              Dashboard
  aircraft/page.tsx
  map/page.tsx
  airport/page.tsx
  alerts/page.tsx
  integrations/page.tsx
  logs/page.tsx
  ground-station/page.tsx
  _components/          AppShell, TopNav, BottomTabs, LiveStrip, ApproachLadder, MiniMap, kit (Card, Pill, Toggle, Button, Field, Table, Empty)
  _lib/                 tracker.ts (typed client for /api/tracker), useTracker.ts (polling hook), format.ts (eta, stage, ago), types.ts
  app.css               app-only styles, scoped under .fp-app
```

- All screens are client components that fetch through `_lib/tracker.ts`. One shared polling store (`useTracker`) loads `user/me`, `aircraft`, `aircraft/live`, `airport/config` and `ground/status` and refreshes live data every 10 s while the tab is visible; screens add their own calls.
- `TopNav` (desktop) is the centered pill bar from the mockup with airport switcher and account menu. Under 820px it collapses to a slim top bar plus `BottomTabs` (Home, Map, Aircraft, Alerts, More).
- `LiveStrip` shows the nearest inbound tracked aircraft on every screen; hidden when nothing is inbound.
- The map is plain Leaflet loaded with `next/dynamic` (`ssr: false`), Esri World Dark Gray base and reference tiles, the same as the desktop app. Trails accumulate client-side from successive `aircraft/live` polls.

### Screens and the endpoints they use

| Screen | Reads | Writes |
|---|---|---|
| Dashboard | `user/me`, `aircraft`, `aircraft/live`, `notifications/recent?limit=60`, `notifications/stats`, `ground/status`, `airport/config` | none |
| Aircraft | `aircraft`, `aircraft/live`, `user/me` (plan limit) | `POST/PUT/DELETE aircraft`; tail lookup via `api.adsbdb.com` as the desktop app does |
| Live Map | `aircraft/live`, `ground/range`, `airport/config` | none |
| Airport | `airport/config`, `locations` | `POST airport/config`, locations CRUD + activate; airport search via new `GET /api/airports?q=` on the site |
| Alerts | `settings/alerts`, `airport/config` (quiet hours), `integrations`, `settings/routing` (new) | `POST settings/alerts`, `POST airport/config`, `PUT settings/routing` |
| Integrations | `integrations`, `user/me` (allowed channels) | CRUD + `POST integrations/{id}/test` |
| Logs | `notifications/logs` | none; CSV export built in the browser |
| Ground Station | `ground/status` (with new stats), `ground/range` | `POST ground/claim` |

`GET /api/airports?q=`: server route over the desktop app's `airports.json` (6.7 MB, copied to `lib/data/airports.json`, loaded once per function instance). Returns at most 10 matches with code, name, lat, lon, elevation and runway list. Requires a session.

Ground Station for accounts without the add-on: `ground/status` answers 403 `ground_station_not_enabled`; the screen shows what it is and links to pricing.

### Error handling

- Proxy network failure or backend 5xx: the screen keeps its last data and shows a single "Can't reach the tracker" bar with retry; polling continues.
- 401 after one re-mint: redirect to `/login?callbackUrl=<current>`.
- 402 `license_expired`: plan-expired screen.
- 403 from a plan limit (aircraft, integrations, channels): inline message naming the limit with a link to billing. The backend stays the only enforcer of limits.
- Form saves: optimistic UI is not used; buttons disable while saving and errors show next to the control.

## Backend additions (`aircraft-tracker-backend`, Personal only)

All schema changes are `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in the existing startup migration block, nullable, with behavior unchanged when null.

1. **Per-event routing**
   - `users.routing JSON NULL`, shape `{"<alert_type>": ["<integration_id>", …]}` listing integrations switched OFF for that event (same shape as `Team.routing`). Alert types: ring keys as the tracker emits them (`"10nm"`, `"2.5nm"`), `"landing"`, `"takeoff"`.
   - `GET /api/settings/routing` → `{routing}`; `PUT /api/settings/routing` validates that keys are strings and values are lists of the caller's own integration ids, drops unknown ids, stores.
   - `tracker.send_notifications` (personal path) and the `/api/ground/ingest` dispatch skip integrations listed for the notification's alert type.
   - Deleting an integration removes its id from the user's routing.
2. **Multi-runway approach filter**
   - `airport_configs.approach_runway_headings JSON NULL` (list of degrees true).
   - Tracker: when the list is non-empty, a distance alert passes if the aircraft's track is within 35° of ANY listed heading; otherwise the existing single `approach_runway_heading` logic applies unchanged.
   - `POST /api/airport/config`: accepts the optional list. If the payload omits it (desktop app), the stored list is set to null so the desktop's single heading governs. The web app sends both the list and, for older readers, the first heading as `approach_runway_heading`.
   - `GET /api/airport/config` returns the list.
3. **Receiver stats**
   - `users.gs_stats JSON NULL`. `POST /api/ground/heartbeat` reads an optional JSON body `{version, uptime_s, msg_rate, aircraft_count}`, keeps only those keys with numeric/short-string values, and stores them with the heartbeat. An empty or missing body (agents ≤ 3.6) is accepted exactly as today.
   - `GET /api/ground/status` adds `stats` (null when the agent has not reported any).
4. **Channel-list bug**
   - `tracker.TIER_CHANNELS` disagrees with `main.TIER_LIMITS[…]["channels"]` and has no `owner` entry, so Pro users' Telegram, webhook and Google Chat integrations are silently never sent, and `owner` falls back to Discord + email.
   - Fix: one source of truth. Move the per-tier channel list to a small module both files import; the tracker allows a channel when either list allowed it before (union), so no plan loses a channel it currently receives.
5. **Tests**: `tests/test_routing.py`, `tests/test_approach_filter.py`, `tests/test_tier_channels.py`, runnable with `pytest` and no database (pure functions extracted for the routing filter and heading check).

Deploy: push to `main` (Railway auto-deploys). After deploy, confirm `/health`, sign in with the desktop app, load Dashboard, Aircraft, Live Map and Ground Station, and check the tracker loop logs for one clean cycle.

### Receiver agent 3.7 (`finalping_ground.py`)

- Heartbeat body becomes `{version, uptime_s, msg_rate, aircraft_count}`.
  - `uptime_s`: seconds since the agent process started.
  - `msg_rate`: messages per second, from the `messages` counter in dump1090's `aircraft.json` between polls; when only the SBS stream is available, lines received per second. `null` when unknown.
  - `aircraft_count`: aircraft with a position in the last poll.
- No other behavior changes. The three self-update guards stay.
- Rollout: the agent self-updates from this repo's `main` (`version.txt` + `finalping_ground.py`). So:
  1. Commit 3.7 on a branch. Copy it by hand to the owner's Pi (`pi@192.168.4.166`), keep the 3.6 file as a backup, restart the service, watch the log for two heartbeats and confirm `ground/status` shows stats.
  2. Only then merge to `main` with `version.txt` = 3.7, and update the copies in `my-product-site/public/ground/`.

## Site theme

- Tokens in `app/globals.css` become a single set on `:root` (the `[data-theme]` blocks, `ThemeProvider` and `ThemeToggle` are removed; `<html>` loses `data-theme`):

  | Token | Value |
  |---|---|
  | `--bg` | `#0A0A0A` |
  | `--panel` | `#131313` |
  | `--panel-2` | `#1A1A1A` |
  | `--border` | `#232323` |
  | `--border-strong` | `#2E2E2E` |
  | `--text` | `#FAFAFA` |
  | `--muted` | `#A3A3A3` |
  | `--faint` | `#8A8A8A` |
  | `--accent` | `#38BDF8` (text, icons, live state only) |
  | `--cta` / `--cta-text` | `#FAFAFA` / `#0A0A0A` (hover `#E5E5E5`) |
  | `--warn` | `#FBBF24` |
  | `--bad` | `#F87171` |
  | `--good` | `#FAFAFA` (success is shown with a check and neutral text, not green) |

- Fonts: `Geist` and `Geist_Mono` from `next/font/google` as `--font-sans` and `--font-mono`.
- Every live page's hard-coded light colors are replaced with tokens: `LandingPageV3`, `dashboard`, `login/*`, `pricing`, `download`, `groundstationkit`, `groundstationsetup`, `groundstationdevices`, `admin`, `alerts`, `contact`, `changelog`, `docs`, `status`, `waitlist`, legal pages, `not-found`, `auth/desktop-complete`, shared components, and `opengraph-image`.
- Emoji used as icons on recolored pages are replaced with lucide icons (standing site rule).
- Navbar: primary button "Open app" → `/app`; "Download" stays in the link row; "Dashboard"/"Sign In" unchanged.
- Product photos on the kit pages sit on white backgrounds; they get a neutral light tile so they don't look cut out.

## Order of work

1. Backend additions + tests → deploy → verify desktop app.
2. Agent 3.7 → hand-install on the Pi → verify → publish.
3. Site: route groups, tokens, fonts, navbar; recolor pages.
4. Web app: proxy + tracker session, shell, then screens in the order Dashboard, Aircraft, Live Map, Airport, Alerts, Integrations, Logs, Ground Station; phone layout throughout.
5. Owner reviews on a local preview (`npm run dev`); merge `web-app` into `main` only on his word.

## Verification

- Backend: pytest for the new pure functions; after deploy the desktop checks listed above.
- Site: `npm run lint` and `npm run build` clean on the branch.
- Web app: each screen opened in a real browser at 1440px and 390px, signed in as the owner's account. Reads are checked against what the desktop app shows. Writes are exercised with a throwaway aircraft and a throwaway webhook integration that are removed afterwards; the owner's real alert settings are restored to their starting values.
- Recolor: every route in the sitemap plus login, dashboard and checkout pages screenshotted and checked for leftover light surfaces and unreadable text.
