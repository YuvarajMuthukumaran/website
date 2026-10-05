// Step 3: fetch every sitemap URL once (cached) plus any published REST page/post
// that is missing from the sitemaps, and record its SEO facts.
// Output: data/raw/crawl.json  [{ url, source, status, finalUrl, redirects, ...extractPage() }]
import path from "node:path";
import { RAW, fetchCached, readJson, writeJson, mapProgress } from "./lib/http.mjs";
import { extractPage } from "./lib/extract.mjs";

const sitemap = await readJson(path.join(RAW, "sitemap-urls.json"));
const pages = await readJson(path.join(RAW, "api", "pages.json"));
const posts = await readJson(path.join(RAW, "api", "posts.json"));

const targets = new Map(sitemap.map((s) => [s.url, { source: s.sitemap, lastmod: s.lastmod }]));
for (const item of [...pages, ...posts]) {
  if (!targets.has(item.link)) targets.set(item.link, { source: `rest-${item.type}-not-in-sitemap`, lastmod: item.modified_gmt });
}
console.log(`crawling ${targets.size} urls`);

const results = await mapProgress(
  [...targets],
  async ([url, info]) => {
    try {
      const r = await fetchCached(url);
      const isHtml = (r.headers["content-type"] ?? "").includes("text/html");
      return {
        url,
        ...info,
        status: r.status,
        finalUrl: r.finalUrl,
        redirects: r.redirects,
        xRobotsTag: r.headers["x-robots-tag"] ?? null,
        ...(isHtml && r.status === 200 ? extractPage(r.body, r.finalUrl) : {}),
      };
    } catch (err) {
      return { url, ...info, status: "error", error: String(err) };
    }
  },
  "crawl"
);

await writeJson(path.join(RAW, "crawl.json"), results);
const byStatus = Object.groupBy(results, (r) => r.status);
console.log(Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [k, v.length])));
