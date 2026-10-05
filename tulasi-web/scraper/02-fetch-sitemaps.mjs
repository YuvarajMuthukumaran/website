// Step 2: read the Yoast sitemap index and every child sitemap.
// The sitemaps are the authoritative list of URLs Google knows about, so they
// define the set of pages the new site must keep alive.
// Output: data/raw/sitemap-urls.json  [{ url, sitemap, lastmod, images[] }]
import path from "node:path";
import * as cheerio from "cheerio";
import { ORIGIN, RAW, fetchCached, writeJson } from "./lib/http.mjs";

const index = await fetchCached(`${ORIGIN}/sitemap_index.xml`);
const $i = cheerio.load(index.body, { xml: true });
const sitemaps = $i("sitemap > loc").map((_, el) => $i(el).text().trim()).get();
console.log(`sitemap index: ${sitemaps.length} sitemaps`);

const urls = [];
for (const sm of sitemaps) {
  const res = await fetchCached(sm);
  const $ = cheerio.load(res.body, { xml: true });
  const name = path.basename(new URL(sm).pathname, ".xml");
  $("url").each((_, el) => {
    const u = $(el);
    urls.push({
      url: u.children("loc").text().trim(),
      sitemap: name,
      lastmod: u.children("lastmod").text().trim() || null,
      images: u.find("image\\:loc, loc").slice(1).map((_, im) => $(im).text().trim()).get(),
    });
  });
  console.log(`  ${name}: ${$("url").length} urls`);
}
await writeJson(path.join(RAW, "sitemap-urls.json"), urls);
console.log(`total: ${urls.length} urls`);
