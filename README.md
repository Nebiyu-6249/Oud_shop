# Asturlab

Bilingual (English and Arabic) storefront for a fictional Dubai oud and perfume house. Next.js 16, Prisma on Neon, Stripe test mode, deployed on Netlify.

## Local setup

```bash
cp .env.example .env.local   # then fill in DATABASE_URL
npm install                  # also runs prisma generate
npm run db:migrate           # apply migrations
npm run db:seed              # idempotent; never resets stock
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build` | content check, Prisma client, Next build |
| `npm run build:netlify` | as above, plus `migrate deploy` and seed against the production database |
| `npm test` | Vitest unit tests |
| `npm run check:content` | fails on emoji or blocklisted terms in `src/`, `prisma/` and `messages/` |

## Netlify

Set `DATABASE_URL` (Neon pooled connection string), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` in the site's environment variables. The build command is in `netlify.toml`.

Catalogue pages are prerendered from the database at build time. Stock on the fragrance page is read per request, which runs Prisma inside a Netlify Function.

## Arabic copy

Every Arabic string is a draft awaiting native-speaker review. See the `_review` note in `messages/ar.json`; the same applies to `nameAr` and `storyAr` in `prisma/seed-data.ts`.
