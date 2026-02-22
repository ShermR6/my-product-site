# SkyPing - Setup & Deployment Checklist

## 1. Install new packages
```bash
npm install next-auth @auth/prisma-adapter @prisma/client stripe resend
npm install -D prisma
```

## 2. Run Prisma migration
```bash
npx prisma migrate dev --name add_auth_and_licenses
npx prisma generate
```

## 3. Set up environment variables
Copy .env.local and fill in:
- NEXTAUTH_SECRET → run: `openssl rand -base64 32` (or use any random 32+ char string)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Stripe Dashboard → Developers → API Keys → Publishable key
- RESEND_API_KEY → your new key after regenerating at resend.com
- STRIPE_WEBHOOK_SECRET → set up after step 4

## 4. Set up Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: https://skyping.xyz/api/webhook
3. Select event: checkout.session.completed
4. Copy the webhook signing secret → paste as STRIPE_WEBHOOK_SECRET

## 5. Set up Resend domain
1. Go to resend.com → Domains → Add domain → skyping.xyz
2. Add the DNS records they give you to your domain registrar
3. Wait for verification (usually a few minutes)

## 6. Add env vars to Vercel
Go to Vercel → your project → Settings → Environment Variables
Add all variables from .env.local

## 7. Add download URLs to Vercel env vars
After you build Mac/Linux installers:
- NEXT_PUBLIC_DOWNLOAD_WINDOWS
- NEXT_PUBLIC_DOWNLOAD_MAC  
- NEXT_PUBLIC_DOWNLOAD_LINUX

## 8. Deploy
```bash
git add .
git commit -m "Add Stripe payments, NextAuth, and dashboard"
git push
```
Vercel auto-deploys on push.

## File placement guide
Place each file at this path in your project:

| File | Path |
|------|------|
| prisma/schema.prisma | prisma/schema.prisma |
| .env.local | .env.local (root) |
| route.ts (auth) | app/api/auth/[...nextauth]/route.ts |
| route.ts (checkout) | app/api/checkout/route.ts |
| route.ts (webhook) | app/api/webhook/route.ts |
| route.ts (portal) | app/api/portal/route.ts |
| page.tsx (dashboard) | app/dashboard/page.tsx |
| DashboardClient.tsx | app/dashboard/DashboardClient.tsx |
| page.tsx (login) | app/login/page.tsx |
| PricingTabs.tsx | app/pricing/PricingTabs.tsx |
| Navbar.tsx | app/components/Navbar.tsx |
| Providers.tsx | app/components/Providers.tsx |
| layout.tsx | app/layout.tsx |
