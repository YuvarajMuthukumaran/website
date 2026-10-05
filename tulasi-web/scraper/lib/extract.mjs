// HTML → SEO facts for one page. Used by the crawler (live site) and later by
// the crawl-comparison script (new site), so both sides are measured the same way.
import * as cheerio from "cheerio";

const SITE_HOSTS = new Set(["www.tulasihealthcare.com", "tulasihealthcare.com"]);

// Site chrome that should not count towards a page's own content.
const CHROME = "header, footer, nav, script, style, noscript, template, svg, iframe, form, .elementor-location-header, .elementor-location-footer, #wpadminbar";

export function extractPage(html, pageUrl) {
  const $ = cheerio.load(html);
  const meta = (sel) => $(sel).attr("content")?.trim() ?? null;

  // Main content: <main> when the theme has one, else the body minus chrome.
  const $main = $("main").length ? $("main").first().clone() : $("body").clone();
  $main.find(CHROME).remove();
  const text = $main.text().replace(/\s+/g, " ").trim();

  const headings = $main
    .find("h1, h2, h3, h4, h5, h6")
    .map((_, el) => ({ level: Number(el.tagName[1]), text: $(el).text().replace(/\s+/g, " ").trim() }))
    .get()
    .filter((h) => h.text);

  const images = $main
    .find("img")
    .map((_, el) => {
      const $el = $(el);
      // LiteSpeed lazy-load puts the real URL in data-src and a placeholder in src.
      const src = $el.attr("data-src") || $el.attr("src") || "";
      return { src: src.startsWith("data:") ? null : abs(src, pageUrl), alt: $el.attr("alt") ?? null };
    })
    .get()
    .filter((i) => i.src);

  const internal = new Set();
  const external = new Set();
  $main.find("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const u = abs(href, pageUrl);
    if (!u || !/^https?:/.test(u)) return;
    (SITE_HOSTS.has(new URL(u).host) ? internal : external).add(u.split("#")[0]);
  });

  return {
    title: $("head > title").first().text().trim() || null,
    metaDescription: meta('meta[name="description"]'),
    canonical: $('link[rel="canonical"]').attr("href") ?? null,
    robots: meta('meta[name="robots"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: meta('meta[property="og:image"]'),
    ogType: meta('meta[property="og:type"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    h1: headings.filter((h) => h.level === 1).map((h) => h.text),
    headings,
    wordCount: text ? text.split(" ").length : 0,
    images,
    internalLinks: [...internal],
    externalLinks: [...external],
    schemaTypes: $('script[type="application/ld+json"]')
      .map((_, el) => {
        try {
          const j = JSON.parse($(el).text());
          const graph = j["@graph"] ?? [j];
          return graph.map((n) => n["@type"]).flat();
        } catch {
          return [];
        }
      })
      .get(),
  };
}

function abs(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}
