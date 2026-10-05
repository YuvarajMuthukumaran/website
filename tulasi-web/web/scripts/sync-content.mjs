// Copies the Phase 0 extraction into the app:
//   ../data/content/*.json      -> content/
//   ../reports/redirects.json   -> content/redirects.json
//   ../data/media/wp-content/... -> public/wp-content/... (original paths kept)
// and derives a few small indexes the routes need (authors, search index).
// Run after re-scraping: `npm run sync-content`.
import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const WEB = path.resolve(import.meta.dirname, "..");
const ROOT = path.resolve(WEB, "..");
const SRC = path.join(ROOT, "data", "content");
const OUT = path.join(WEB, "content");
const read = async (f) => JSON.parse(await readFile(f, "utf8"));

await mkdir(OUT, { recursive: true });
for (const f of await readdir(SRC)) if (f.endsWith(".json")) await cp(path.join(SRC, f), path.join(OUT, f));
await cp(path.join(ROOT, "reports", "redirects.json"), path.join(OUT, "redirects.json"));

// Author archives: the users endpoint is private, so authors are rebuilt from
// the crawled /author/<slug>/ pages (name) and each post's Yoast "Written by"
// (the archive pages' links can't be used: every one shows the same sidebar).
const crawl = await read(path.join(ROOT, "data", "raw", "crawl.json"));
const posts = await read(path.join(OUT, "posts.json"));
const authors = crawl
  .filter((r) => r.source === "author-sitemap")
  .map((r) => {
    const slug = new URL(r.url).pathname.split("/").filter(Boolean).pop();
    const name = (r.title ?? slug).replace(/,\s*Author at .*$/i, "").trim();
    const authorIds = new Set(posts.filter((p) => p.seo?.twitter?.misc?.["Written by"] === name).map((p) => p.author));
    return {
      slug,
      name,
      path: `/author/${slug}/`,
      wpAuthorIds: [...authorIds],
      seo: { title: r.title, description: r.metaDescription, canonical: r.canonical, robots: r.robots },
    };
  });
await writeFile(path.join(OUT, "authors.json"), JSON.stringify(authors, null, 2));

// SEO facts of the live archive pages (tags, categories, authors, team index),
// so their <title>/description/canonical are reused exactly.
const archives = Object.fromEntries(
  crawl
    .filter((r) => /tag-sitemap|category-sitemap|author-sitemap|team-sitemap/.test(r.source))
    .map((r) => [new URL(r.url).pathname, { title: r.title, description: r.metaDescription, canonical: r.canonical, robots: r.robots, h1: r.h1?.[0] ?? null, ogImage: r.ogImage }])
);
await writeFile(path.join(OUT, "archive-seo.json"), JSON.stringify(archives, null, 2));

// WordPress shortlinks (/?p=123, /?page_id=45) for src/proxy.ts.
const pagesJson = await read(path.join(OUT, "pages.json"));
const shortlinks = {
  p: Object.fromEntries(posts.map((p) => [p.id, p.path])),
  page_id: Object.fromEntries(pagesJson.map((p) => [p.id, p.path])),
};
await writeFile(path.join(OUT, "shortlinks.json"), JSON.stringify(shortlinks));

// Small client-side search index for the blog (title + excerpt only).
const searchIndex = posts
  .map((p) => ({ t: p.title, p: p.path, e: (p.excerpt ?? "").slice(0, 160), d: p.date?.slice(0, 10) }))
  .sort((a, b) => (b.d ?? "").localeCompare(a.d ?? ""));
await mkdir(path.join(WEB, "public"), { recursive: true });
await writeFile(path.join(WEB, "public", "search-index.json"), JSON.stringify(searchIndex));

// Media at their original URLs.
const media = path.join(ROOT, "data", "media", "wp-content");
if (existsSync(media)) await cp(media, path.join(WEB, "public", "wp-content"), { recursive: true });

console.log({ files: (await readdir(OUT)).length, authors: authors.length, searchIndex: searchIndex.length, media: existsSync(media) });
