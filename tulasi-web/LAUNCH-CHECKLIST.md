# Launch checklist

## Before launch (blocking)

- [ ] **Rotate the Groq API key.** The current key is committed to the public repo
      `YuvarajMuthukumaran/chatbot` (`server/lib/llmClient.js`). Revoke it, create a new one,
      set it only as `GROQ_API_KEY` on the API host, and delete `TEST_GROQ_API_KEY` from the code.
- [ ] **Hospital sign-off on new copy.** All page content is migrated verbatim; the few new
      lines are UI copy: the journey section (Assess / Treat / Heal / Thrive), the care finder and
      guide, service-card blurbs (from each page's meta description), the locations intro, the chat
      consent text, and the booking consent line.
- [ ] **Testimonials.** Three are shown with names as published today (Vipin Sharma, Manav,
      Navneet Kaur). Confirm written consent is on file, or switch to initials.
- [ ] **Doctor directory: one source of truth.** The chatbot lists Dr. Anil Kumar and
      Dr. Naseem Akhtar Qureshi (no profile on the site; their old profile links 404 and now
      redirect to /our-team/); Dr. Madhura Samudra is on the site but not bookable. Update
      `chatbot/server/lib/doctors.js` and run `npm run import-doctors`.
- [ ] **Doctor timings.** Slots are a fixed 9:00–13:00 / 14:00–17:00 template. Load real
      timings per doctor/branch before taking bookings.
- [ ] **SMS provider.** DLT-registered templates for the login code and booking confirmation
      (MSG91 or Twilio env vars), and optionally a WhatsApp Business template.
- [ ] **Secrets** set on the API host: `DATA_ENCRYPTION_KEY`, `LOOKUP_HASH_KEY`,
      `COOKIE_DOMAIN=.tulasihealthcare.com`, `CLIENT_ORIGIN=https://www.tulasihealthcare.com`.
- [ ] **GA4.** Create a GA4 property (the live site only has the retired Universal Analytics tag)
      and set `NEXT_PUBLIC_GA4_ID`; add Ads conversion labels for bookings and calls.
- [ ] **Fresh content snapshot** (README → Refresh content), rebuild, then run
      `node scraper/09-compare.mjs https://staging.tulasihealthcare.com` → 0 blockers.
- [ ] **Staging is noindexed** (password-protect it or set `X-Robots-Tag: noindex` at the host).

## Launch day

- [ ] Deploy the API to `api.tulasihealthcare.com`; check `/api/health`, `/api/db-status`, `/api/llm-status`.
- [ ] Deploy the site; point `www.tulasihealthcare.com` at it. Keep apex → www and http → https redirects.
- [ ] Spot check: `/robots.txt` (no `Disallow: /`), `/sitemap_index.xml`, `/?p=2813` → 301,
      `/feed/` → 301, `/psychiatrist-in-delhi/` → 301, a `.php` legacy URL → 301.
- [ ] Book a real test appointment, receive the SMS, sign in to the portal, cancel it.
- [ ] Search Console: resubmit `sitemap_index.xml`; URL-inspect the home page and top 20 pages.
- [ ] Keep the WordPress install reachable on a private URL for 3 months (rollback + content source).

## After launch

- [ ] Search Console daily for 2 weeks, then weekly for 2 months: coverage, 404s, Core Web Vitals,
      clicks on top pages (compare with the 16-month export taken before launch).
- [ ] GA4: booking_complete, call_click and chat_open events arriving.
- [ ] Later, one change at a time: add a meta description to /blog/, shorten the 134 titles
      over 65 characters, add alt text to the 591 pages with generic alt (see the gap report),
      noindex the 131 tag pages with 0–1 posts.
- [ ] Facility and team photography: the single biggest visual upgrade still available.
