// Step 10: doctor facts that the live site publishes on its service pages
// (not on the profiles): experience, areas of expertise, consultation fee,
// OPD days/hours and online OPD. Pattern on those pages:
//   <h3><a href="/team/<slug>/">Name</a></h3> <p>Designation</p>
//   <p><strong>Experience</strong>: ...</p> <p><strong>Subject Expert</strong>:</p><ul>...</ul>
//   <p><strong>Consultation Fee(s)</strong>: ...</p> <p><strong>OPD</strong>: ...</p> ...
// The same doctor appears on several pages; for each field the value
// published most often wins, and every source page is recorded.
// Output: data/content/doctor-details.json
import path from "node:path";
import * as cheerio from "cheerio";
import { DATA, readJson, writeJson } from "./lib/http.mjs";

const content = [...(await readJson(path.join(DATA, "content", "pages.json"))), ...(await readJson(path.join(DATA, "content", "posts.json")))];
const t = (s) => s.replace(/\s+/g, " ").trim();
const redirects = new Map((await readJson(path.join(DATA, "..", "reports", "redirects.json"))).map((r) => [r.from, r.to]));
const FIELDS = { experience: /^experience$/i, expertise: /^(subject expert|expertise|area of expertise|specialization|specialisation)s?$/i, fee: /^consultation fees?$/i, opd: /^opd$/i, onlineOpd: /^online opd$/i };

// Formatting-only differences ("2 PM – 5 PM" vs "2:00 pm-5:00 pm") are not conflicts.
const norm = (v) => JSON.stringify(v).toLowerCase().replace(/:00/g, "").replace(/[\s–—-]+/g, "").replace(/\(trainedat[^)]*\)/g, "");
const clean = (v) => (Array.isArray(v) ? v.map((x) => x.replace(/^[–-]\s*/, "")) : v.replace(/\s+Online OPD:.*$/i, ""));

const seen = {}; // slug -> field -> normalized value -> { value, count }
const sources = {};
for (const page of content) {
  if (!/\/team\//.test(page.contentHtml)) continue;
  const $ = cheerio.load(`<div id="r">${page.contentHtml}</div>`, null, false);
  $("#r h3, #r h4").each((_, h) => {
    const href = $(h).find('a[href*="/team/"]').attr("href");
    if (!href) return;
    const path0 = new URL(href, "https://www.tulasihealthcare.com").pathname;
    // Old profile URLs that now redirect (e.g. /team/mr-inderjeet-singh/) count for the current profile.
    const slug = (redirects.get(path0) ?? path0).split("/").filter(Boolean).pop();
    const rec = {};
    // Walk the siblings after the heading until the next heading.
    let el = $(h).next();
    let lastField = null;
    while (el.length && !/^h[1-4]$/.test(el[0].tagName)) {
      if (el[0].tagName === "p") {
        const strong = t(el.find("strong, b").first().text()).replace(/:$/, "");
        const field = Object.entries(FIELDS).find(([, re]) => re.test(strong))?.[0];
        if (field) {
          lastField = field;
          // text after the label; <br> separates multiple OPD slots
          const html = el.html().replace(/<(strong|b)>[^<]*<\/\1>\s*:?/i, "");
          const parts = cheerio.load(`<i>${html.replace(/<br\s*\/?>/gi, "\n")}</i>`).text().split("\n").map((s) => t(s.replace(/^:\s*/, ""))).filter(Boolean);
          if (parts.length) rec[field] = field === "opd" ? parts : parts.join(" ");
        } else if (lastField === "opd" && /\d\s*(am|pm)/i.test(el.text())) {
          rec.opd = [...(rec.opd ?? []), t(el.text())];
        }
      } else if (el[0].tagName === "ul" && lastField === "expertise") {
        rec.expertise = el.find("li").map((_, li) => t($(li).text())).get().filter(Boolean);
      }
      el = el.next();
    }
    if (!Object.keys(rec).length) return;
    (sources[slug] ??= new Set()).add(page.path);
    for (const [k, raw] of Object.entries(rec)) {
      const v = clean(raw);
      const key = norm(v);
      const slot = ((seen[slug] ??= {})[k] ??= {});
      slot[key] = { value: slot[key]?.value ?? v, count: (slot[key]?.count ?? 0) + 1 };
    }
  });
}

const details = Object.fromEntries(
  Object.entries(seen).map(([slug, fields]) => [
    slug,
    {
      ...Object.fromEntries(Object.entries(fields).map(([k, vals]) => [k, Object.values(vals).sort((a, b) => b.count - a.count)[0].value])),
      // Fields where pages genuinely disagree: every variant, for the hospital to confirm.
      conflicts: Object.fromEntries(Object.entries(fields).filter(([, vals]) => Object.keys(vals).length > 1).map(([k, vals]) => [k, Object.values(vals).map((x) => ({ value: x.value, pages: x.count }))])),
      sources: [...sources[slug]].sort(),
    },
  ])
);
await writeJson(path.join(DATA, "content", "doctor-details.json"), details);
console.log(`doctors with published details: ${Object.keys(details).length}`);
const conflicted = Object.entries(details).filter(([, d]) => Object.keys(d.conflicts).length);
console.log(`doctors whose pages disagree on a field: ${conflicted.length}`);
for (const [slug, d] of Object.entries(details)) console.log(`- ${slug}: ${["experience", "expertise", "fee", "opd", "onlineOpd"].filter((k) => d[k]).join(", ")} (${d.sources.length} pages)`);
