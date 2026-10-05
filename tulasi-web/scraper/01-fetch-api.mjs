// Step 1: pull every public collection from the WordPress REST API, including
// the Yoast SEO fields (yoast_head_json) that come with posts and pages.
// Output: data/raw/api/<collection>.json
import path from "node:path";
import { ORIGIN, RAW, fetchJson, fetchCached, writeJson, mapProgress } from "./lib/http.mjs";

const API = `${ORIGIN}/wp-json/wp/v2`;
const COLLECTIONS = ["pages", "posts", "media", "categories", "tags", "users", "menu-items", "navigation"];

async function fetchAll(collection) {
  const first = await fetchCached(`${API}/${collection}?per_page=100&page=1`);
  if (first.status !== 200) {
    console.log(`  ${collection}: HTTP ${first.status} (not public, skipped)`);
    return null;
  }
  const totalPages = Number(first.headers["x-wp-totalpages"] ?? 1);
  const rest = await mapProgress(
    Array.from({ length: totalPages - 1 }, (_, i) => i + 2),
    (p) => fetchJson(`${API}/${collection}?per_page=100&page=${p}`).then((r) => r.data),
    collection
  );
  const items = [JSON.parse(first.body), ...rest].flat();
  console.log(`  ${collection}: ${items.length} items`);
  return items;
}

const summary = {};
for (const c of COLLECTIONS) {
  const items = await fetchAll(c);
  summary[c] = items ? items.length : "not public";
  if (items) await writeJson(path.join(RAW, "api", `${c}.json`), items);
}

// Site-level settings that the new build needs (name, description, logo, etc.).
const root = await fetchCached(`${ORIGIN}/wp-json/`);
if (root.status === 200) {
  const { name, description, url, home, site_logo, site_icon, site_icon_url } = JSON.parse(root.body);
  await writeJson(path.join(RAW, "api", "site.json"), { name, description, url, home, site_logo, site_icon, site_icon_url });
}
await writeJson(path.join(RAW, "api", "_summary.json"), summary);
console.log(summary);
