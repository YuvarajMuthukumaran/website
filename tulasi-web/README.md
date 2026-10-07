# Tulasi Healthcare website rebuild

Next.js 16 rebuild of www.tulasihealthcare.com. Every existing URL, title, meta
description, canonical, robots tag, H1 and sentence of content is preserved
(verified page by page against the live site), with a new design, chat
assistant, online booking and a patient portal.

## Results

| | Live site today | New build |
|---|---|---|
| URLs preserved | 688 | 688, plus 456 legacy redirects kept |
| Titles / descriptions / canonicals / robots / H1 identical | – | 688 of 688 |
| Content parity (live sentences found on new page) | – | **100.00%** |
| Mobile Lighthouse, home (perf / a11y / best practices / SEO) | 42 / 87 / 96 / 85 | 90–91 / 100 / 100 / 100 |
| Mobile LCP, home / service page / blog post | 9.5 s / 13.3 s / 11.8 s | 3.4 s / 4.1 s / 3.3 s |
| Desktop Lighthouse, home | – | 100 / 100 / 100 / 100 (LCP 0.8 s) |
| Layout shift (CLS), home | 0.31 | 0 |

Reports: [reports/parity-report.md](reports/parity-report.md), [reports/content-gap-report.md](reports/content-gap-report.md),
[reports/inventory.csv](reports/inventory.csv), [reports/redirects.csv](reports/redirects.csv), [reports/lighthouse/](reports/lighthouse/).

## Design system: "Held in light"

Daylight sections for reading; midnight stages (hero, services, journey, booking, footer)
carry one soft key light. Tokens live in `web/src/app/globals.css` (`@theme`): brand
blues + Midnight `#030B3A` / Navy-900 `#081250`, red for primary actions only, radii
12/16/24, hairlines, surfaces on dark (white 6/10/16%), motion tokens (200/450/700ms,
ease-out). Building blocks: `components/ui/primitives.tsx` (buttons, Kinetic headings,
tags, custom icon set), `HeroScene.tsx` (code-built scenes per page type),
`WordField.tsx`, spotlight cards (`.spot` / `.spot-light`, one delegated pointer
listener in `MotionProvider`). Visual language sheet:
https://claude.ai/artifact/5vR1mWEarUUTvbLbouZjsx

Old stock decorations were removed and 301 to the page they decorated
(`web/content/retired-media.json`); every image inside migrated content is kept.

## Team portraits and locations

- **Portraits.** Every team photo is a transparent cut-out with the same head size and position, so the
  site can put each person on their own soft pastel (`pastelFor()` in `web/src/components/team.tsx`).
  Drop the original headshot into `extracted_photos/` or `extracted_doctors/`, add it to `SOURCES` in
  `scraper/12-uniform-portraits.py` and run `python scraper/12-uniform-portraits.py`; the result lands in
  `web/public/team-portraits/<slug>.webp`. People without a new headshot use `data/portrait-sources/legacy/`.
  Review `reports/portraits-contact-sheet.jpg` after a run. The script needs only OpenCV and downloads nothing.
- **Locations.** `web/src/lib/locations.ts` holds the centres as listed on the clinic's Google Business Profiles
  (5 hospital and care-home sites, 2 clinics; addresses as Google shows them, directions open Google Maps). Counts on the home page, `/locations/` and in the
  menu are derived from it. Add a `photo` to an entry to show a real photo of that centre on its card.
- **Crisis help** shows the clinic's own number (no third-party helpline) in the strip, menu, footer,
  contact page, booking page, finder, screener and chat widget.

## Layout

```
tulasi-web/
  scraper/              Phase 0 extraction + Phase 5 parity check (Node, cached, polite)
    01..08-*.mjs          REST API, sitemaps, crawl, doctors, content, reports, media, site/home
    09-compare.mjs        old vs new crawl comparison → reports/parity-report.md
  data/content/         normalized content (source of truth for the build)
  data/media/           all 829 media files at their original /wp-content/uploads/ paths
  reports/              inventory, gap report, redirect map, parity report, Lighthouse JSON
  scripts/api-sandbox.mjs  runs ../../chatbot/server on an in-memory DB for local testing
  web/                  the Next.js site
    scripts/sync-content.mjs  copies data/ into web/content + web/public
    src/app/              routes (same URLs as WordPress)
    src/components/       layout, home, cards, booking, portal, chat
    src/lib/              content loader, SEO/JSON-LD, sitemaps, API client, analytics
    src/proxy.ts          WordPress shortlinks (/?p=123) and portal guard
```

Backend: the existing `chatbot/server` (Express + MongoDB + Groq) was extended in place:
`routes/auth.js`, `lib/authStore.js`, `lib/secure.js`, `lib/notify.js`, a website chat
channel in `lib/turnRouter.js` / `routes/chat.js`, and `test/websiteAuth.test.mjs`
(108 tests pass).

## Run locally

```bash
# 1. API in sandbox mode (in-memory DB, stub HMS, login codes shown on screen)
node tulasi-web/scripts/api-sandbox.mjs          # http://localhost:8788

# 2. Website
cd tulasi-web/web
cp .env.example .env.local                       # set NEXT_PUBLIC_API_URL=http://localhost:8788
npm install
npm run dev                                       # http://localhost:3000
```

Sandbox test patient phone: `9999999999` (the login code appears on the login page).

## Refresh content from the live site

```bash
cd tulasi-web/scraper && rm -rf ../data/raw/cache && npm run all && node 08-extract-site.mjs
cd ../web && npm run sync-content && npm run build
```

Run this once more just before launch to pick up posts published during the build.

## Deploy

**Website (Vercel, or any Node host)**
1. Project root `tulasi-web/web`; build `npm run build`; start `npm start` (Node 20.9+).
2. Environment: see `web/.env.example` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`,
   `NEXT_PUBLIC_GA4_ID`, Ads ID and conversion labels).
3. `web/content/` and `web/public/wp-content/` are part of the build; commit them (≈ 60 MB).

**API (`chatbot/server`, Render/Railway/VM)** at `api.tulasihealthcare.com`
1. Environment: `server/.env.example`. Required in production: `GROQ_API_KEY` (a **new**
   key; the old one is public on GitHub), `MONGODB_URI`, `CLIENT_ORIGIN=https://www.tulasihealthcare.com`,
   `COOKIE_DOMAIN=.tulasihealthcare.com`, `DATA_ENCRYPTION_KEY`, `LOOKUP_HASH_KEY`, an SMS provider.
2. Remove `TEST_GROQ_API_KEY` from `server/lib/llmClient.js` and rotate it.
3. MongoDB Atlas: restrict network access to the API host's IPs (database not public).

See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for the go-live sequence.
