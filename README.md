# In-Sync Eventsync

Professional event management platform: registration, check-in, agenda management, attendee engagement, meetings, landing-page builder, and PWA support — all in one app.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn-ui (PWA via vite-plugin-pwa)
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **Hosting:** Cloudflare Pages
- **Integrations:** Razorpay (billing), Resend (email), WhatsApp Cloud API (notifications), Google Analytics

## Local Development

```sh
npm install
npm run dev          # http://localhost:8080
npm run build        # outputs to dist/
npm run lint
npm test             # vitest
```

`.env` (gitignored) must contain at minimum:

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon JWT or sb_publishable_...>
VITE_SUPABASE_PROJECT_ID=<ref>
```

For deploys, also include:

```env
CLOUDFLARE_API_TOKEN=cfut_...
CLOUDFLARE_ACCOUNT_ID=...
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server-only, never bundled
SUPABASE_DB_PASSWORD=...
```

Only values prefixed `VITE_` are inlined into the browser bundle. Anything that grants write access (service role key, sbp_ token, Cloudflare API token) must NOT be prefixed `VITE_`.

## Deploy — Frontend (Cloudflare Pages)

The frontend deploys automatically on every push to `main` via `.github/workflows/pages-deploy.yml` (build + publish to Cloudflare Pages). Pushing to `main` is the only deploy path — there is no manual Wrangler step.

The Cloudflare Pages project is `Eventsync`, served at `https://Eventsync.pages.dev`. The custom domain `event.in-sync.co.in` points at it via a proxied CNAME on the `in-sync.co.in` zone.

## Deploy — Supabase (CI)

Migrations and edge functions deploy automatically on push to `main` when files under `supabase/**` change. See `.github/workflows/supabase-deploy.yml`.

Required GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN` (`sbp_…`)
- `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_PROJECT_ID`

## Custom Domain

Production: `https://event.in-sync.co.in`

DNS is managed in Cloudflare; the record is a proxied CNAME pointing at `Eventsync.pages.dev`.

## Rollback

Forward-rollback (bad new deploy, Pages itself fine): use the Cloudflare Pages dashboard to roll back to a previous deployment of `Eventsync`.

Full rollback to Azure (only viable while the legacy SWA still exists): PATCH the production CNAME back to the Azure target (`proud-sand-0b62db01e.7.azurestaticapps.net`) via the Cloudflare API.
