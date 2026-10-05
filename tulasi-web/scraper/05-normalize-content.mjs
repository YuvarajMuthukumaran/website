// Step 5: REST posts/pages/media/taxonomies → typed content JSON for the new site.
// Body HTML is cleaned (wrappers stripped) but never reworded. The Yoast
// fields are copied verbatim so the Next.js metadata reuses them exactly.
// Output: data/content/{posts,pages,media,categories,tags}.json
import path from "node:path";
import * as cheerio from "cheerio";
import { DATA, RAW, readJson, writeJson, fetchCached } from "./lib/http.mjs";
import { cleanHtml, textOf, wordCount } from "./lib/clean.mjs";

const api = (n) => readJson(path.join(RAW, "api", `${n}.json`));
const [posts, pages, media, categories, tags, crawl] = await Promise.all([
  api("posts"), api("pages"), api("media"), api("categories"), api("tags"), readJson(path.join(RAW, "crawl.json")),
]);
const crawlByUrl = new Map(crawl.map((c) => [c.url, c]));
const mediaById = new Map(media.map((m) => [m.id, m]));
const decode = (s) => textOf(s ?? "");
const pathOf = (link) => new URL(link).pathname;

/** Yoast's REST output, trimmed to what the new <head> needs. */
function seoOf(item) {
  const y = item.yoast_head_json ?? {};
  return {
    title: y.title ?? null,
    description: y.description ?? null,
    canonical: y.canonical ?? item.link,
    robots: y.robots ?? null,
    og: {
      title: y.og_title ?? null,
      description: y.og_description ?? null,
      type: y.og_type ?? null,
      url: y.og_url ?? null,
      image: y.og_image ?? [],
      publishedTime: y.article_published_time ?? null,
      modifiedTime: y.article_modified_time ?? null,
    },
    twitter: { card: y.twitter_card ?? null, misc: y.twitter_misc ?? null },
    schema: y.schema ?? null,
  };
}

function featured(item) {
  const m = mediaById.get(item.featured_media);
  return m ? { id: m.id, url: m.source_url, alt: m.alt_text || null, width: m.media_details?.width ?? null, height: m.media_details?.height ?? null } : null;
}

// Rough page-type guess from the slug, so the inventory can be sorted.
// It is only a hint for review: the final mapping is confirmed with the hospital.
const CONDITION_WORDS = /depress|anxiety|ocd|obsess|schizo|bipolar|psychos|ptsd|adhd|autism|dementia|alzheim|insomnia|sleep|personality|phobia|panic|eating|stress|anger|sexual|gaming|internet|suicid/;
const ADDICTION_WORDS = /addiction|alcohol|drug|de-addiction|smack|heroin|cannabis|ganja|opium|nasha|substance|smoking|tobacco/;
function guessPageType(p) {
  const s = p.slug;
  if (p.link === "https://www.tulasihealthcare.com/") return "home";
  if (/map-direction|contact|location|branch/.test(s) || /\/map-direction\//.test(p.link)) return "location/contact";
  if (/-(in|near)-(delhi|gurgaon|gurugram|noida|india|ncr|faridabad|ghaziabad)/.test(s)) return "local-landing";
  if (ADDICTION_WORDS.test(s)) return "service-addiction";
  if (CONDITION_WORDS.test(s)) return "condition";
  if (/privacy|terms|disclaimer|refund|policy/.test(s)) return "legal";
  if (/about|team|award|media|news|gallery|career|publication|testimonial|review|faq|blog/.test(s)) return "about/info";
  if (/service|treatment|therapy|rehab|care|program|clinic|hospital/.test(s)) return "service";
  return "other";
}

// Theme chrome inside <main> that is not the page's own content.
const NOT_CONTENT = "header, footer, nav, form, .breadcrumb-area, .breadcrumb-wrap, .breadcrumb, [class*=breadcrumb], .sidebar, aside, .widget-area, .comments-area, #comments, .post-navigation, .related-posts, .elementor-location-header, .elementor-location-footer";

/** Main content from the live rendered page (already in the HTTP cache). */
async function renderedMainHtml(url) {
  const r = await fetchCached(url);
  const $ = cheerio.load(r.body);
  const $main = ($("main").length ? $("main") : $("body")).first().clone();
  $main.find(NOT_CONTENT).remove();
  return cleanHtml($main.html(), url);
}

/**
 * Exactly one H1 per page, and it is the live page's H1 text: the template
 * renders it, so any copy inside the body is removed and other H1s in the
 * body become H2s (the live site has several pages with two H1s).
 */
function fixHeadings(html, h1Text) {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  $("#r h1").each((_, el) => {
    if (textOf($(el).html()) === h1Text) $(el).remove();
    else el.tagName = "h2";
  });
  return $("#r").html();
}

async function normalize(item, kind) {
  const crawled = crawlByUrl.get(item.link);
  let contentHtml = cleanHtml(item.content?.rendered, item.link);
  let contentSource = "rest";
  // Content parity: when the page shows noticeably more text than the editor
  // holds (theme templates, widgets), migrate the rendered content instead.
  // Posts are excluded: their body is always post_content; the extra rendered
  // text on posts is only theme furniture (tags, share buttons, sidebar).
  if (kind === "page" && crawled?.status === 200 && crawled.wordCount > 150 && wordCount(contentHtml) < crawled.wordCount * 0.7) {
    const rendered = await renderedMainHtml(item.link);
    if (wordCount(rendered) > wordCount(contentHtml)) {
      contentHtml = rendered;
      contentSource = "rendered";
    }
  }
  const h1 = crawled?.h1?.[0] ?? decode(item.title?.rendered);
  contentHtml = fixHeadings(contentHtml, h1);
  return {
    id: item.id,
    kind,
    pageType: kind === "post" ? "blog-post" : guessPageType(item),
    slug: item.slug,
    path: pathOf(item.link),
    url: item.link,
    status: item.status,
    title: decode(item.title?.rendered),
    h1,
    contentSource,
    date: item.date_gmt ? item.date_gmt + "Z" : null,
    modified: item.modified_gmt ? item.modified_gmt + "Z" : null,
    author: item.author ?? null,
    parent: item.parent ?? null,
    template: item.template || null,
    categories: item.categories ?? [],
    tags: item.tags ?? [],
    featuredImage: featured(item),
    excerpt: decode(item.excerpt?.rendered) || null,
    contentHtml,
    wordCount: wordCount(contentHtml),
    // Rendered page word count (from the crawl). A big gap means some visible
    // content lives in theme templates/widgets, not post_content, and must be
    // carried over separately (flagged in the gap report).
    renderedWordCount: crawled?.wordCount ?? null,
    liveStatus: crawled?.status ?? null,
    seo: seoOf(item),
  };
}

const outPosts = [];
for (const p of posts) outPosts.push(await normalize(p, "post"));
const outPages = [];
for (const p of pages) outPages.push(await normalize(p, "page"));
const outMedia = media.map((m) => ({
  id: m.id,
  url: m.source_url,
  path: pathOf(m.source_url),
  mime: m.mime_type,
  alt: m.alt_text || null,
  title: decode(m.title?.rendered),
  caption: decode(m.caption?.rendered) || null,
  width: m.media_details?.width ?? null,
  height: m.media_details?.height ?? null,
  filesize: m.media_details?.filesize ?? null,
  attachedTo: m.post ?? null,
}));
const tax = (list) => list.map((t) => ({ id: t.id, name: decode(t.name), slug: t.slug, path: pathOf(t.link), count: t.count, description: t.description || null, seo: seoOf(t) }));

const out = path.join(DATA, "content");
await writeJson(path.join(out, "posts.json"), outPosts);
await writeJson(path.join(out, "pages.json"), outPages);
await writeJson(path.join(out, "media.json"), outMedia);
await writeJson(path.join(out, "categories.json"), tax(categories));
await writeJson(path.join(out, "tags.json"), tax(tags));
console.log({ posts: outPosts.length, pages: outPages.length, media: outMedia.length, categories: categories.length, tags: tags.length });
console.log(Object.fromEntries(Object.entries(Object.groupBy(outPages, (p) => p.pageType)).map(([k, v]) => [k, v.length])));
