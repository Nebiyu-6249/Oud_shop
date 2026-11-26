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

## The title sequence

The home page is a title sequence on the astrolabe's own plate: seven beats (`rim`, `descent`, `resins`, `florals`, `ember`, `woods`, `ascent`) on one master GSAP timeline (`src/lib/sequence.ts`). The timeline drives a single progress value; the camera splines, every mechanism, the grade and the overlays are pure functions of it (`src/lib/choreography.ts`, `src/lib/grade.ts`, `src/lib/gears.ts`), so scrolling back reverses everything exactly.

- One persistent `<Canvas>` lives in the locale layout and never remounts. Its runtime is a separate chunk loaded on the visitor's first interaction, after the hero text has painted.
- Home: a 700vh section scrubbed by ScrollTrigger with Lenis on the GSAP ticker; scroll snaps gently to beats; arrow keys and Page Up/Down step between them.
- Other routes: the timeline travels to the route's label with `tweenFromTo` (at most 1.4 s planned); realm pages park on their mechanism, product and cart pages on the Ascent.
- Phones and portrait screens take a shorter camera path with a slightly wider lens and start without tilt-shift. `PerformanceMonitor` drops tilt-shift, then dust, then shadows. Pixel ratio is capped at 1.5.
- Reduced motion: no camera flight; the stage holds composed stills with mechanisms in place and swaps them through a brief fade; smoke, dust, grain movement and smooth scrolling are off.

### Measuring on a device

Add `?debug` to any URL: the stage loads at once and an overlay shows frames drawn per second (the stage renders on demand, so 0 means nothing is moving), the page frame rate, the quality level, pixel ratio, draw calls, progress and the last route travel's planned and measured time. `?debug&quality=0..3` pins a quality level; `?debug&post=0` bypasses post-processing.

Targets: 55+ fps on a mid laptop with integrated graphics, 30+ on a mid Android phone. These have not been measured: the build container has no GPU.

Local Lighthouse (mobile, simulated throttling) on `/en` after the sequence: Performance 93 to 96, Accessibility 100, LCP 1.1 s on the hero paragraph, CLS 0.

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
