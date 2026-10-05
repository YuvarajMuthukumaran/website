// Pre-launch crawl comparison: live site (cached crawl) vs the new build.
//
//   node 09-compare.mjs http://localhost:3100   (a `next start` of the build, or staging)
//
// For every URL the live site has, fetches the same path from the new site and checks:
//   status        200 (or the 301 the redirect map promises)
//   title, meta description, canonical, robots  identical
//   H1            the live H1 text is present as the new page's H1
//   content       every sentence of the live page's main text appears on the new page
//   links         internal links from the live content still exist on the new page
// Writes reports/parity-report.md and reports/parity.json; exits 1 on any blocker.
import path from "node:path";
import { writeFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { RAW, ROOT, ORIGIN, fetchCached, readJson, writeJson, mapProgress } from "./lib/http.mjs";
import { extractPage } from "./lib/extract.mjs";

const NEW = (process.argv[2] ?? "http://localhost:3100").replace(/\/$/, "");
const crawl = await readJson(path.join(RAW, "crawl.json"));
const redirects = new Map((await readJson(path.join(ROOT, "reports", "redirects.json"))).map((r) => [r.from, r.to]));

const norm = (s) => (s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/ /g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const canon = (u) => {
  if (!u) return u;
  const p = u.replace(/^https?:\/\/[^/]+/, "");
  try {
    return decodeURIComponent(p); // /blog/%E0%A4... and /blog/सर्व... are the same URL
  } catch {
    return p;
  }
};
const pathOf = (u) => decodeURIComponent(new URL(u).pathname);

// Theme furniture on the live pages that is intentionally not reproduced
// verbatim (sidebars, share widgets, builder labels).
// (The site header/footer sit outside <main>; <header> inside main is section content.)
const NOT_CONTENT = "nav, form, aside, .sidebar, .widget, .widget-area, .breadcrumb-area, [class*=breadcrumb], .comments-area, .post-navigation, .related-posts, .social-share, script, style, noscript, svg";
function mainText(html) {
  const $ = cheerio.load(html);
  const $m = ($("main").length ? $("main") : $("body")).first();
  $m.find(NOT_CONTENT).remove();
  // Element boundaries split "sentences" (the live markup often glues a label to the next block).
  $m.find("p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, figcaption, dd, dt, div, span, a, strong, b, em, button, br").each((_, el) => $(el).append(" \n "));
  return $m.text();
}
const sentences = (text) =>
  text
    .split(/(?<=[.?!])\s+|\n/)
    .map(norm)
    // Skip theme furniture and raw shortcodes the live theme printed as text by mistake.
    .filter((s) => s.length >= 40 && !s.startsWith("[") && !/^(related tags|social share|read more|share this|recent posts|categories)/.test(s));

/** Fetch without following redirects (to verify 301s exactly). */
async function getNew(p) {
  const res = await fetch(NEW + p, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: res.status === 200 ? await res.text() : "" };
}

const rows = await mapProgress(
  crawl.filter((r) => r.status === 200),
  async (old) => {
    const p = new URL(old.url).pathname;
    const issues = [];
    const res = await getNew(p);
    const expectRedirect = redirects.get(decodeURIComponent(p)) ?? redirects.get(p);
    if (expectRedirect) {
      const ok = res.status === 301 || res.status === 308;
      if (!ok || !res.location?.includes(expectRedirect)) issues.push({ level: "blocker", what: `expected 301 → ${expectRedirect}, got ${res.status} ${res.location ?? ""}` });
      return { path: p, status: res.status, issues, coverage: null };
    }
    if (res.status !== 200) return { path: p, status: res.status, issues: [{ level: "blocker", what: `status ${res.status}` }], coverage: 0 };

    const n = extractPage(res.html, NEW + p);
    const cmp = (field, a, b, level = "blocker") => {
      if (norm(a) !== norm(b)) issues.push({ level, what: `${field} differs`, old: a, new: b });
    };
    cmp("title", old.title, n.title);
    cmp("meta description", old.metaDescription, n.metaDescription);
    cmp("canonical", canon(old.canonical), canon(n.canonical));
    cmp("robots", old.robots, n.robots, "warning");
    if (old.h1?.[0] && !n.h1.map(norm).includes(norm(old.h1[0]))) issues.push({ level: "blocker", what: "H1 changed", old: old.h1[0], new: n.h1.join(" | ") });
    if (n.h1.length !== 1) issues.push({ level: "warning", what: `${n.h1.length} H1 tags` });

    // Content parity against the cached live HTML.
    const live = await fetchCached(old.url);
    const oldS = [...new Set(sentences(mainText(live.body)))];
    // Compare letters and digits only: the live markup often glues words
    // together ("Check In1 Clinical") where the new HTML has proper blocks.
    const alnum = (s) => s.replace(/[^\p{L}\p{N}]+/gu, "");
    const newText = alnum(norm(mainText(res.html)));
    const missing = oldS.filter((s) => !newText.includes(alnum(s)));
    const coverage = oldS.length ? 1 - missing.length / oldS.length : 1;
    if (coverage < 0.98) issues.push({ level: coverage < 0.9 ? "blocker" : "warning", what: `content coverage ${(coverage * 100).toFixed(1)}%`, missing: missing.slice(0, 5) });

    // Internal links from the live main content.
    const newLinks = new Set(n.internalLinks.map((u) => pathOf(u)));
    const lostLinks = (old.internalLinks ?? [])
      .map((u) => pathOf(u.replace("//tulasihealthcare.com", "//www.tulasihealthcare.com")))
      .filter((u) => !/\/wp-content\/|\/feed\/?$|\/page\/\d+\/$/.test(u) && !newLinks.has(u) && !newLinks.has(redirects.get(u)));
    // Header/footer menus are the same on every page, so links lost from <main> are often still in the layout.
    if (lostLinks.length) issues.push({ level: "info", what: `${lostLinks.length} internal links not in main content`, links: lostLinks.slice(0, 10) });

    return { path: p, status: 200, issues, coverage, oldWords: old.wordCount, newWords: n.wordCount };
  },
  "compare"
);

const blockers = rows.filter((r) => r.issues.some((i) => i.level === "blocker"));
const warnings = rows.filter((r) => r.issues.some((i) => i.level === "warning"));
const avgCoverage = rows.filter((r) => r.coverage != null).reduce((a, r, _, arr) => a + r.coverage / arr.length, 0);
await writeJson(path.join(ROOT, "reports", "parity.json"), rows);

const count = (what) => rows.filter((r) => r.issues.some((i) => i.what.startsWith(what))).length;
const md = `# Parity report: live site vs new build
Compared ${rows.length} live URLs against \`${NEW}\` on ${new Date().toISOString().slice(0, 10)}.

| Check | Pages with a problem |
|---|---|
| Wrong status / redirect | ${count("status") + count("expected 301")} |
| Title differs | ${count("title")} |
| Meta description differs | ${count("meta description")} |
| Canonical differs | ${count("canonical")} |
| Robots differs | ${count("robots")} |
| H1 changed | ${count("H1 changed")} |
| Content coverage below 98% | ${count("content coverage")} |

**Average content coverage: ${(avgCoverage * 100).toFixed(2)}%** (share of the live page's sentences found on the new page).
**Blockers: ${blockers.length}. Warnings: ${warnings.length}.**

## Blockers
${blockers.map((r) => `- \`${r.path}\`: ${r.issues.filter((i) => i.level === "blocker").map((i) => i.what + (i.old ? ` (old: "${i.old}" / new: "${i.new}")` : "") + (i.missing ? `\n  - missing: ${i.missing.map((m) => `"${m.slice(0, 120)}"`).join("\n  - missing: ")}` : "")).join("; ")}`).join("\n") || "_None._"}

## Warnings
${warnings.slice(0, 150).map((r) => `- \`${r.path}\`: ${r.issues.filter((i) => i.level === "warning").map((i) => i.what + (i.missing ? ` (e.g. "${i.missing[0]?.slice(0, 100)}")` : "")).join("; ")}`).join("\n") || "_None._"}
`;
await writeFile(path.join(ROOT, "reports", "parity-report.md"), md);
console.log(md.split("## Blockers")[0]);
process.exit(blockers.length ? 1 : 0);
