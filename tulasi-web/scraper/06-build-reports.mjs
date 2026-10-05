// Step 6: build the Phase 0 deliverables from the cached data.
//   reports/inventory.csv + inventory.json  one row per known URL
//   reports/content-gap-report.md           everything missing, thin, duplicate or outdated
//   reports/redirects.json + redirects.csv  the redirect map for the new site
// Also checks internal links that point outside the inventory (one cached
// request each), so broken links show up before launch rather than after.
import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { DATA, RAW, ROOT, ORIGIN, fetchCached, readJson, writeJson, mapProgress } from "./lib/http.mjs";

const REPORTS = path.join(ROOT, "reports");
await mkdir(REPORTS, { recursive: true });
const c = (n) => readJson(path.join(DATA, "content", `${n}.json`));
const [crawl, posts, pages, media, doctors, tags] = await Promise.all([
  readJson(path.join(RAW, "crawl.json")), c("posts"), c("pages"), c("media"), c("doctors"), c("tags"),
]);
const contentByUrl = new Map([...posts, ...pages].map((p) => [p.url, p]));
const doctorByUrl = new Map(doctors.map((d) => [d.url, d]));

const GENERIC_ALT = /^(img|image|icon|logo|photo|picture|banner|header-img|rest|\d+|[\w-]+\.(jpe?g|png|webp|gif))$/i;
const badAlt = (a) => a == null || !a.trim() || GENERIC_ALT.test(a.trim());

function typeOf(row) {
  const content = contentByUrl.get(row.url);
  if (content) return content.pageType;
  if (doctorByUrl.has(row.url)) return "doctor";
  return { "post_tag-sitemap": "tag-archive", "category-sitemap": "category-archive", "author-sitemap": "author-archive", "team-sitemap": "team-index" }[row.source] ?? "other";
}

// ---------- inventory ----------
const inventory = crawl.map((r) => ({
  url: r.url,
  path: new URL(r.url).pathname,
  type: typeOf(r),
  source: r.source,
  status: r.status,
  finalUrl: r.finalUrl !== r.url ? r.finalUrl : "",
  title: r.title ?? "",
  titleLength: r.title?.length ?? 0,
  metaDescription: r.metaDescription ?? "",
  metaDescriptionLength: r.metaDescription?.length ?? 0,
  canonical: r.canonical ?? "",
  canonicalSelf: r.canonical ? r.canonical === r.finalUrl : "",
  robots: r.robots ?? "",
  h1Count: r.h1?.length ?? 0,
  h1: (r.h1 ?? []).join(" | "),
  headingCount: r.headings?.length ?? 0,
  wordCount: r.wordCount ?? 0,
  restWordCount: contentByUrl.get(r.url)?.wordCount ?? "",
  images: r.images?.length ?? 0,
  imagesBadAlt: r.images?.filter((i) => badAlt(i.alt)).length ?? 0,
  internalLinks: r.internalLinks?.length ?? 0,
  externalLinks: r.externalLinks?.length ?? 0,
  schemaTypes: [...new Set(r.schemaTypes ?? [])].join(" "),
  lastmod: r.lastmod ?? "",
}));
await writeJson(path.join(REPORTS, "inventory.json"), inventory);
await writeFile(path.join(REPORTS, "inventory.csv"), "﻿" + toCsv(inventory)); // BOM so Excel reads UTF-8

// ---------- internal link check ----------
const known = new Set(crawl.map((r) => r.url));
const mediaPaths = new Set(media.map((m) => m.url));
const linkSources = new Map();
for (const r of crawl) for (const l of r.internalLinks ?? []) {
  const u = l.replace(/^http:/, "https:").replace("//tulasihealthcare.com", "//www.tulasihealthcare.com");
  if (known.has(u) || mediaPaths.has(u) || /\/wp-(content|admin|json|login)|\?|\/feed\/?$/.test(u)) continue;
  if (!linkSources.has(u)) linkSources.set(u, new Set());
  linkSources.get(u).add(r.url);
}
console.log(`checking ${linkSources.size} internal link targets outside the sitemap`);
const linkChecks = await mapProgress(
  [...linkSources.keys()],
  async (u) => {
    try {
      const res = await fetchCached(u);
      return { url: u, status: res.status, finalUrl: res.finalUrl, linkedFrom: [...linkSources.get(u)] };
    } catch (e) {
      return { url: u, status: "error", finalUrl: null, linkedFrom: [...linkSources.get(u)] };
    }
  },
  "links"
);
const brokenLinks = linkChecks.filter((l) => l.status !== 200 || !known.has(l.finalUrl));

// ---------- redirect map ----------
const redirects = [];
const seen = new Set();
const addRedirect = (from, to, reason) => {
  // "/x" → "/x/" is the trailing-slash rule, handled by the framework itself.
  if (from === to || from + "/" === to || seen.has(from)) return;
  seen.add(from);
  redirects.push({ from, to, status: 301, reason });
};
// URLs in the sitemap that already redirect today: keep the same destination.
for (const r of crawl) if (r.finalUrl && r.finalUrl !== r.url && r.status === 200) addRedirect(new URL(r.url).pathname, new URL(r.finalUrl).pathname, "already redirects on the live site");
// Linked-to URLs outside the sitemap that resolve somewhere: preserve that hop.
for (const l of linkChecks) if (l.status === 200 && l.finalUrl && l.finalUrl !== l.url && new URL(l.finalUrl).host === new URL(ORIGIN).host)
  addRedirect(new URL(l.url).pathname, new URL(l.finalUrl).pathname, "internal link target that redirects today");
// WordPress shortlinks (?p=ID / ?page_id=ID) are indexed and shared; map them to the canonical path.
for (const p of posts) addRedirect(`/?p=${p.id}`, p.path, "WordPress shortlink");
for (const p of pages) addRedirect(`/?page_id=${p.id}`, p.path, "WordPress shortlink");
// Feeds: keep subscribers working.
addRedirect("/feed/", "/blog/feed.xml", "RSS feed moves to a static feed");
addRedirect("/comments/feed/", "/blog/feed.xml", "comments feed retired");
await writeJson(path.join(REPORTS, "redirects.json"), redirects);
await writeFile(path.join(REPORTS, "redirects.csv"), "﻿" + toCsv(redirects));

// Media keep their exact /wp-content/uploads/... paths in the new build (served
// as-is and optimised on the fly by next/image), so no media redirects are needed.
// The map is still written so it can be diffed after launch.
await writeJson(path.join(REPORTS, "media-map.json"), media.map((m) => ({ from: m.path, to: m.path, alt: m.alt, mime: m.mime })));

// ---------- gap report ----------
const ok = inventory.filter((r) => r.status === 200);
const content = ok.filter((r) => !/archive|team-index/.test(r.type));
const dupes = (field) => Object.entries(Object.groupBy(content.filter((r) => r[field]), (r) => r[field].toLowerCase())).filter(([, v]) => v.length > 1);
const section = (title, rows, fmt, note = "") => `\n## ${title} (${rows.length})\n${note ? note + "\n" : ""}\n${rows.length ? rows.slice(0, 200).map(fmt).join("\n") + (rows.length > 200 ? `\n- ...and ${rows.length - 200} more (see inventory.csv)` : "") : "_None._"}\n`;
const link = (r) => `[${r.path ?? decodeURIComponent(new URL(r.url).pathname)}](${r.url})`;

const nonOk = inventory.filter((r) => r.status !== 200);
const redirecting = inventory.filter((r) => r.finalUrl);
const noTitle = content.filter((r) => !r.title);
const noDesc = content.filter((r) => !r.metaDescription);
const longTitle = content.filter((r) => r.titleLength > 65);
const descLen = content.filter((r) => r.metaDescription && (r.metaDescriptionLength > 165 || r.metaDescriptionLength < 70));
const noH1 = content.filter((r) => r.h1Count === 0);
const multiH1 = content.filter((r) => r.h1Count > 1);
const thin = content.filter((r) => r.wordCount < (r.type === "blog-post" ? 400 : 250) && r.type !== "home");
const canonOther = content.filter((r) => r.canonical && r.canonicalSelf === false);
const noindex = inventory.filter((r) => /noindex/.test(r.robots));
const templateContent = [...pages].filter((p) => p.renderedWordCount && p.renderedWordCount > 150 && p.wordCount < p.renderedWordCount * 0.5);
const notInSitemap = crawl.filter((r) => r.source?.startsWith("rest-"));
const outdated = content.filter((r) => /\b20(1\d|2[0-5])\b/.test(`${r.title} ${r.h1}`));
const staleSummaries = posts.filter((p) => p.modified && new Date(p.modified) < new Date("2023-01-01"));
const thinTags = tags.filter((t) => t.count <= 1);
const altPages = inventory.filter((r) => r.imagesBadAlt > 0).sort((a, b) => b.imagesBadAlt - a.imagesBadAlt);
const mediaNoAlt = media.filter((m) => m.mime?.startsWith("image/") && badAlt(m.alt));
const docGaps = doctors.map((d) => ({ d, missing: [!d.photo && "photo", d.bioWordCount < 40 && `bio (${d.bioWordCount} words)`, !d.qualificationsMentioned.length && "qualifications", "languages", "registration no.", "timings", "branch"].filter(Boolean) }));
const testimonialPages = inventory.filter((r) => /testimonial|review|success-stor|patient-stor/.test(r.path));

// The chatbot's doctor directory (server/lib/doctors.js) vs the live team pages.
let chatbotDiff = "";
try {
  const { DOCTORS } = await import(new URL("file:///" + path.resolve(ROOT, "..", "..", "chatbot", "server", "lib", "doctors.js").replace(/\\/g, "/")));
  const norm = (n) => n.toLowerCase().replace(/\(.*?\)|dr\.|ms\.|mr\.|mrs\./g, "").replace(/\s+/g, " ").trim();
  const site = new Set(doctors.map((d) => norm(d.name)));
  const bot = new Set(DOCTORS.map((d) => norm(d.name)));
  const onlyBot = DOCTORS.filter((d) => !site.has(norm(d.name))).map((d) => d.name);
  const onlySite = doctors.filter((d) => !bot.has(norm(d.name))).map((d) => d.name);
  chatbotDiff = `\n## Doctor list: chatbot vs website\nThe chatbot's directory (\`chatbot/server/lib/doctors.js\`) and the live team pages disagree. Both sites must use one source of truth.\n\n- In the chatbot but **no profile page** on the website: ${onlyBot.join(", ") || "none"}\n- On the website but **missing from the chatbot**: ${onlySite.join(", ") || "none"}\n`;
} catch (e) {
  chatbotDiff = `\n## Doctor list: chatbot vs website\n_Could not load the chatbot directory: ${e.message}_\n`;
}

const md = `# Content gap report: tulasihealthcare.com
Generated ${new Date().toISOString().slice(0, 10)} from a one-time cached crawl. Nothing here has been fixed or rewritten; this is the list of what needs a decision from the hospital before or during the build.

| | |
|---|---|
| URLs in sitemaps | ${crawl.filter((r) => !r.source?.startsWith("rest-")).length} |
| Published posts / pages (REST) | ${posts.length} / ${pages.length} |
| Doctor profiles | ${doctors.length} |
| Media items | ${media.length} |
| URLs returning 200 | ${ok.length} |
| Internal link targets outside the sitemap checked | ${linkChecks.length} |
${section("URLs not returning 200", nonOk, (r) => `- ${link(r)}: **${r.status}**`)}
${section("Sitemap URLs that redirect", redirecting, (r) => `- ${link(r)} → ${r.finalUrl}`, "These should be removed from the sitemap; the redirect is kept in redirects.csv.")}
${section("Broken or redirecting internal links", brokenLinks, (l) => `- ${l.url}: **${l.status}**${l.finalUrl && l.finalUrl !== l.url ? ` → ${l.finalUrl}` : ""} (linked from ${l.linkedFrom.length} page${l.linkedFrom.length > 1 ? "s" : ""}, e.g. ${l.linkedFrom[0]})`, "Fix the links in the new content, and keep a redirect for any that resolve.")}
${section("Published content missing from the sitemap", notInSitemap, (r) => `- ${link(r)} (status ${r.status})`, "Either add to the sitemap or decide to noindex/retire.")}
${section("Pages whose visible content is not in the WordPress editor", templateContent, (p) => `- [${p.path}](${p.url}): editor ${p.wordCount} words vs rendered ${p.renderedWordCount}`, "Part of the visible text comes from theme templates or widgets, so the REST API alone would lose it. These pages are migrated from the crawled HTML instead.")}
${section("Thin content", thin, (r) => `- ${link(r)}: ${r.wordCount} words (${r.type})`, "Under 400 words for posts / 250 for pages. Keep as-is for migration (content parity); review later.")}
${section("Missing title", noTitle, (r) => `- ${link(r)}`)}
${section("Missing meta description", noDesc, (r) => `- ${link(r)} (${r.type})`)}
${section("Duplicate titles", dupes("title"), ([t, v]) => `- "${t}": ${v.map(link).join(", ")}`)}
${section("Duplicate meta descriptions", dupes("metaDescription"), ([t, v]) => `- "${t.slice(0, 80)}...": ${v.map(link).join(", ")}`)}
${section("Titles over 65 characters", longTitle, (r) => `- ${link(r)}: ${r.titleLength} chars`, "Truncated in Google results. Copied unchanged for parity; shorten later if desired.")}
${section("Meta descriptions under 70 or over 165 characters", descLen, (r) => `- ${link(r)}: ${r.metaDescriptionLength} chars`)}
${section("No H1", noH1, (r) => `- ${link(r)} (${r.type})`)}
${section("More than one H1", multiH1, (r) => `- ${link(r)}: ${r.h1}`, "The new templates will output exactly one H1 per page (the page's main heading).")}
${section("Canonical points to another URL", canonOther, (r) => `- ${link(r)} → ${r.canonical}`)}
${section("noindex pages", noindex, (r) => `- ${link(r)}: ${r.robots}`)}
${section("Possibly outdated (a year in the title or H1)", outdated, (r) => `- ${link(r)}: ${r.title}`)}
${section("Blog posts not updated since before 2023", staleSummaries, (p) => `- [${p.path}](${p.url}): last modified ${p.modified.slice(0, 10)}`, "Medical content should be reviewed periodically; not changed during migration.")}
${section("Pages with images missing a meaningful alt text", altPages, (r) => `- ${link(r)}: ${r.imagesBadAlt} of ${r.images}`, 'Includes empty alt and generic values such as "img", "icon", "logo".')}
${section("Media library images without meaningful alt text", mediaNoAlt, (m) => `- ${m.path}${m.alt ? ` (alt: "${m.alt}")` : ""}`)}
${section("Tag archives with 0–1 posts", thinTags, (t) => `- [${t.path}](${ORIGIN}${t.path}): ${t.count} post(s)`, "Kept live for parity at launch; candidates for noindex later.")}
${section("Doctor profiles: missing data", docGaps.filter((g) => g.missing.length), ({ d, missing }) => `- [${d.name}](${d.url}): ${missing.join(", ")}`, "Languages, registration numbers, timings and branch are not published for anyone. They need to come from the hospital; the site will not show them until then.")}
${chatbotDiff}
${section("Testimonial / review pages: check for patient identity", testimonialPages, (r) => `- ${link(r)}`, "Review manually before migration: remove or anonymise any testimonial that identifies a patient (name + photo + condition) unless written consent is on file.")}
`;
await writeFile(path.join(REPORTS, "content-gap-report.md"), md);
console.log("reports written:", ["inventory.csv", "inventory.json", "content-gap-report.md", "redirects.csv", "redirects.json", "media-map.json"].join(", "));

function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = Array.isArray(v) ? v.join(" ") : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((k) => esc(r[k])).join(","))].join("\n");
}
