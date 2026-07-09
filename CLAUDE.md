# FinalPing Product Site

finalpingapp.com — marketing site, user dashboard, auth, checkout, admin. See `../ARCHITECTURE.md` for full system context.

## Stack
- Next.js 14 (App Router, TypeScript) · Prisma · PostgreSQL · NextAuth · Stripe
- Deployed on Vercel (auto-deploys on push to main)

## Commands
```bash
npm run dev       # dev server at localhost:3000
npm run build     # production build
npx prisma studio # DB browser
```

## Key App Routes
- `/` — homepage
- `/pricing` — Personal + Teams pricing tabs
- `/download` — download links + Teams waitlist
- `/dashboard` — user account (licenses, alerts, 2FA, settings)
- `/login`, `/login/forgot`, `/login/reset`, `/login/verify` — auth
- `/account/create` — new account
- `/groundstationkit` — GS Kit product page + cart (IN PROGRESS: cart feature + 3-image cards)
- `/checkout`, `/checkout/kit-success` — Stripe checkout
- `/admin` — admin panel
- `/auth/desktop-complete` — Google OAuth bridge page for desktop apps

## Key API Routes
- `GET /api/auth/google/desktop-start` — initiates Google OAuth for desktop (`?scheme=` param)
- `GET /api/auth/google/desktop-callback` — exchanges code, redirects to desktop-complete
- `POST /api/internal/desktop-verify` — validates short-lived desktop OAuth tokens (called by backends)
- `POST /api/webhooks/stripe` — Stripe events → license provisioning

## Pending Work
- `STRIPE_PRICE_GROUND_STATION_KIT_STUBBY` ($220), `STRIPE_PRICE_GROUND_STATION_KIT_STUBBY_BUILT` ($245), `STRIPE_PRICE_PRO_STICK_PLUS` ($60), `STRIPE_PRICE_STAND_ANTENNA` ($15), `STRIPE_PRICE_STUBBY_ANTENNA_SOLO` ($30) — Stripe products not yet created + env vars not yet on Vercel
- Cart feature on `/groundstationkit` — individual parts get "Add to Cart", cart sidebar, `/api/checkout` handles multiple items
