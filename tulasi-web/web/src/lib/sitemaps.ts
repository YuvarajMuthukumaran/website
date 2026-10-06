// XML sitemaps at the same URLs Yoast publishes today (already submitted in
// Search Console): /sitemap_index.xml → /post-sitemap.xml, /page-sitemap.xml,
// /team-sitemap.xml, /category-sitemap.xml, /post_tag-sitemap.xml, /author-sitemap.xml.
// Each entry carries its images (image sitemap extension).
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, getAuthors, getCategories, getDoctors, getPages, getPosts, getTags, localPath, postsByAuthor, SITE_URL } from "./content";

type Url = { loc: string; lastmod?: string | null; images?: string[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Images retired in the redesign (they now 301) are left out of the image sitemap.
const RETIRED = new Set((JSON.parse(readFileSync(path.join(process.cwd(), "content", "retired-media.json"), "utf8")) as { path: string }[]).map((r) => r.path));
const imagesIn = (html: string) => [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((u) => !RETIRED.has(localPath(u)));
const abs = (u: string) => absoluteUrl(localPath(u));
const uniq = (a: string[]) => [...new Set(a)];
const publicPagePath = (path: string) => (path === "/contact-us/" ? "/locations/" : path);

// Tag archives are left out on purpose: they are noindex (thin lists of posts already in the post sitemap).
export const SITEMAPS = ["post", "page", "team", "category", "author"] as const;
export type SitemapName = (typeof SITEMAPS)[number] | "post_tag";

function entries(name: SitemapName): Url[] {
  const posts = getPosts();
  const latest = posts[0]?.modified ?? posts[0]?.date;
  switch (name) {
    case "post":
      return [
        { loc: absoluteUrl("/blog/"), lastmod: latest },
        ...posts.map((p) => ({ loc: absoluteUrl(p.path), lastmod: p.modified ?? p.date, images: uniq([...(p.featuredImage ? [p.featuredImage.url] : []), ...imagesIn(p.contentHtml)]).map(abs) })),
      ];
    case "page":
      return getPages()
        .filter((p) => p.path !== "/blog/")
        .map((p) => ({ loc: absoluteUrl(publicPagePath(p.path)), lastmod: p.modified, images: uniq(imagesIn(p.contentHtml)).map(abs) }));
    case "team":
      return [{ loc: absoluteUrl("/team/") }, ...getDoctors().map((d) => ({ loc: absoluteUrl(`/team/${d.slug}/`), images: d.photo ? [abs(d.photo)] : [] }))];
    case "category":
      return getCategories().filter((c) => c.count > 0).map((c) => ({ loc: absoluteUrl(c.path) }));
    case "post_tag":
      return getTags().filter((t) => t.count > 0).map((t) => ({ loc: absoluteUrl(t.path) }));
    case "author":
      return getAuthors().map((a) => ({ loc: absoluteUrl(a.path), lastmod: postsByAuthor(a)[0]?.modified }));
  }
}

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });

export function sitemapResponse(name: SitemapName) {
  const urls = entries(name)
    .map(
      (u) =>
        `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}${(u.images ?? [])
          .map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`)
          .join("")}</url>`
    )
    .join("\n");
  return xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`);
}

export function sitemapIndexResponse() {
  const items = SITEMAPS.map((n) => {
    const lastmod = entries(n).map((e) => e.lastmod).filter(Boolean).sort().at(-1);
    return `<sitemap><loc>${SITE_URL}/${n}-sitemap.xml</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}</sitemap>`;
  }).join("\n");
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`);
}
