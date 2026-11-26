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
| `npm test` | Vitest unit tests, plus order and webhook tests against the local database when `DATABASE_URL` is set |
| `npm run check:content` | fails on emoji or blocklisted terms in `src/`, `prisma/` and `messages/` |

## Netlify

Set `DATABASE_URL` (Neon pooled connection string), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` in the site's environment variables. The build command is in `netlify.toml`.

Catalogue pages are prerendered from the database at build time. Stock on the fragrance page is read per request, which runs Prisma inside a Netlify Function.

## The astrolabe

`/[locale]/finder` sets three rings: family (the rete), when (the middle ring) and intensity (the plate). Scoring lives in `src/lib/finder.ts` as a pure, tested function. The instrument is described once in `src/components/astrolabe/geometry.ts` and drawn twice: as SVG (first paint, and the fallback without WebGL) and as an extruded brass scene in React Three Fiber whose engravings are painted procedurally onto canvas textures. Rings turn by drag, touch, or the keyboard sliders beside it. With reduced motion the rings and rule jump straight to their detents and the home-page instrument stays still.

## Motion and performance

- Smoke behind the home-page instrument is a domain-warped fbm noise shader, never video.
- Engraved botanicals and flacons below the fold draw themselves stroke by stroke as they scroll in (GSAP ScrollTrigger); story paragraphs rise line by line (SplitText, lines only, so Arabic joins are never broken).
- Ring motion is slow and heavy: settling eases in, then stops with a small clunk.
- The home-page astrolabe is server-rendered SVG whose rings turn by CSS animation on the compositor, one layer per ring, so idling costs no JavaScript. The WebGL scene and GSAP load only on the visitor's first pointer, touch, key or scroll.
- Engraved labels are HTML text over the SVG line work so the browser measures them at their true size, keeping the hero text the largest contentful paint.
- With `prefers-reduced-motion`, ring drift, camera sway, smoke, scroll drawing and line reveals are all off; the finder's rings and rule jump straight to their detents.

Local Lighthouse (mobile, simulated throttling) on `/en`: Performance 95 to 97, Accessibility 100, LCP 1.1 s on the hero paragraph, CLS 0.

## Checkout

The cart lives in `localStorage` and holds only variant ids and quantities. `POST /api/checkout` reprices every line from the database, checks stock (short lines come back as per-line errors), creates a PENDING order and a Stripe Checkout session in AED, and returns its URL. Prices are VAT-inclusive; VAT is `round(total * 5 / 105)` fils.

`POST /api/stripe/webhook` verifies the signature against the raw body. `checkout.session.completed` marks the order PAID and takes the stock in one transaction, conditional on the order still being unpaid, so retries and duplicates do nothing. `checkout.session.expired` cancels it. The confirmation page re-reads the order every two seconds for up to 20 seconds while it is pending.

In the Stripe dashboard (test mode), add a webhook endpoint at `https://<site>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. Locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Only test-mode keys are accepted.

## Arabic copy

Every Arabic string is a draft awaiting native-speaker review. See the `_review` note in `messages/ar.json`; the same applies to `nameAr` and `storyAr` in `prisma/seed-data.ts`.
