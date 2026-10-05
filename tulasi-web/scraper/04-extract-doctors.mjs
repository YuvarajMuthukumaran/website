// Step 4: the "team" post type is not exposed by the REST API, so doctor
// profiles are parsed from the crawled HTML (already cached by step 3).
// Only fields that are actually published are filled; everything else is null
// and listed in the gap report, never guessed.
// Output: data/content/doctors.json
import path from "node:path";
import * as cheerio from "cheerio";
import { DATA, RAW, fetchCached, readJson, writeJson } from "./lib/http.mjs";
import { cleanHtml, textOf } from "./lib/clean.mjs";

const sitemap = await readJson(path.join(RAW, "sitemap-urls.json"));
const profileUrls = sitemap.filter((s) => s.sitemap === "team-sitemap" && /\/team\/[^/]+\/$/.test(s.url));

// Phrases that hint at fields we can lift verbatim from the bio text.
const EXPERIENCE = /(\d{1,2})\+?\s*(?:years|yrs)/i;
const QUALS = /\b(MBBS|MD|DNB|DPM|MRCPsych|FRCPsych|M\.?Phil|Ph\.?D|M\.?A\.?|M\.?Sc|B\.?A\.?|PGD\w*|RCI)\b/g;

const doctors = [];
for (const { url, lastmod } of profileUrls) {
  const r = await fetchCached(url);
  const $ = cheerio.load(r.body);
  const $box = $(".lower-content").first();
  const name = $box.find(".s-about-content h1").first().text().trim() || $("h1").last().text().trim();
  const designation = $box.find(".s-about-content > span, .s-about-content span").first().text().trim() || null;

  const $bio = $box.find(".s-about-content").clone();
  $bio.find("h1").remove();
  $bio.find("span").first().remove();
  const bioHtml = cleanHtml($bio.html() ?? "", url);
  const bioText = textOf(bioHtml);

  const $img = $box.find(".team-img-box img").first();
  const photo = $img.attr("data-src") || $img.attr("src") || null;

  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  doctors.push({
    slug,
    url,
    name,
    honorific: name.match(/^(Dr\.|Ms\.|Mr\.|Mrs\.)/)?.[1] ?? null,
    designation,
    // Psychiatrists are physicians (Physician schema); psychologists/social workers are not.
    role: /psychiatrist/i.test(designation ?? "") ? "psychiatrist" : /psycholog/i.test(designation ?? "") ? "psychologist" : "other",
    rciLicensed: /\bRCI\b/.test(`${designation} ${bioText}`),
    photo: photo && !photo.startsWith("data:") ? new URL(photo, url).href : null,
    photoAlt: $img.attr("alt") ?? null,
    bioHtml,
    bioWordCount: bioText ? bioText.split(" ").length : 0,
    // WordPress archive excerpt as the live /team/ page shows it: 19 words + "..."
    // (wp_trim_words(20) on content that starts with a hidden token).
    excerpt: bioText ? bioText.split(" ").slice(0, 19).join(" ") + (bioText.split(" ").length > 19 ? "..." : "") : null,
    experienceYearsMentioned: bioText.match(EXPERIENCE)?.[1] ? Number(bioText.match(EXPERIENCE)[1]) : null,
    qualificationsMentioned: [...new Set(bioText.match(QUALS) ?? [])],
    // Not published anywhere on the current profiles — kept explicit so the
    // gap report can ask the hospital for them instead of inventing values.
    languages: null,
    registrationNumber: null,
    timings: null,
    branch: null,
    lastmod,
    seo: {
      title: $("head > title").text().trim(),
      metaDescription: $('meta[name="description"]').attr("content") ?? null,
      canonical: $('link[rel="canonical"]').attr("href") ?? null,
    },
  });
}

// Check the generated excerpts against the ones the live /team/ archive shows.
const archive = cheerio.load((await fetchCached("https://www.tulasihealthcare.com/team/")).body);
let checked = 0, matched = 0;
archive(".bsingle__content").each((_, el) => {
  const href = archive(el).find("h2 a").attr("href");
  const live = archive(el).find("p").first().text().replace(/\s+/g, " ").trim();
  const d = doctors.find((x) => x.url === href);
  if (!d || !live) return;
  checked++;
  if (d.excerpt === live) matched++;
  else console.warn(`excerpt differs for ${d.name}:
  live: ${live}
  ours: ${d.excerpt}`);
});
console.log(`excerpts matching the live archive: ${matched}/${checked}`);

await writeJson(path.join(DATA, "content", "doctors.json"), doctors);
console.log(`doctors: ${doctors.length}`);
console.table(doctors.map((d) => ({ name: d.name, designation: d.designation, photo: !!d.photo, bioWords: d.bioWordCount })));
