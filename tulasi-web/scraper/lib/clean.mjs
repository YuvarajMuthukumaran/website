// Page-builder HTML → clean semantic HTML.
//
// The rule from the brief: keep every word, heading level, link, image and alt
// text exactly as published; strip only Elementor/theme wrapper markup, inline
// styles, lazy-load placeholders and leftover shortcodes.
import * as cheerio from "cheerio";

const KEEP_ATTRS = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "title"],
  iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  ol: ["start", "type"],
  blockquote: ["cite"],
  time: ["datetime"],
};
// Tags that carry meaning; everything else (div, span, section, font...) is unwrapped.
const SEMANTIC = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "figure", "figcaption", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "blockquote", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "caption", "br", "hr", "iframe", "sup", "sub", "time", "dl", "dt", "dd", "code", "pre", "mark", "small",
]);
// <button> is unwrapped, not dropped: accordion FAQs put the question text in one.
const DROP = "script, style, noscript, template, svg, link, meta, input, select, textarea, .screen-reader-text";
const SHORTCODE = /\[\/?[a-z_-]+(?:\s[^\]]*)?\]/gi;

export function cleanHtml(html, baseUrl) {
  const $ = cheerio.load(`<div id="__root">${html ?? ""}</div>`, null, false);
  const root = $("#__root");
  // Embedded contact forms (Contact Form 7) become a marker the site renders
  // as a booking call-to-action in the same place.
  root.find("form").replaceWith("<p>%%BOOKING_CTA%%</p>");
  root.find(DROP).remove();

  // Resolve lazy-loaded images to their real source before attributes are stripped.
  root.find("img").each((_, el) => {
    const $el = $(el);
    const real = $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("src") || "";
    if (!real || real.startsWith("data:")) return $el.remove();
    $el.attr("src", abs(real, baseUrl));
  });

  // Builders often express emphasis as inline styles; keep it as real markup.
  root.find("span[style], font[style]").each((_, el) => {
    const style = $(el).attr("style") ?? "";
    let inner = $(el).html();
    if (/font-style:\s*italic/i.test(style)) inner = `<em>${inner}</em>`;
    if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) inner = `<strong>${inner}</strong>`;
    if (inner !== $(el).html()) $(el).html(inner);
  });

  // Unwrap non-semantic elements from the inside out.
  root.find("*").get().reverse().forEach((el) => {
    if (!SEMANTIC.has(el.tagName)) $(el).replaceWith($(el).contents());
  });

  root.find("*").each((_, el) => {
    const keep = KEEP_ATTRS[el.tagName] ?? [];
    for (const name of Object.keys(el.attribs)) if (!keep.includes(name)) $(el).removeAttr(name);
    if (el.tagName === "a" && $(el).attr("href")) $(el).attr("href", abs($(el).attr("href"), baseUrl));
  });

  // Leftover shortcodes and empty paragraphs/headings produced by the builder.
  root.contents().each(function walk(_, node) {
    if (node.type === "text") node.data = node.data.replace(SHORTCODE, "");
    else $(node).contents().each(walk);
  });
  root.find("p, h1, h2, h3, h4, h5, h6, li, strong, em, b, i").each((_, el) => {
    const $el = $(el);
    if (!$el.text().replace(/ /g, " ").trim() && !$el.find("img, iframe, br").length) $el.remove();
  });

  return root.html().replace(/\n{3,}/g, "\n\n").trim();
}

export const textOf = (html) => cheerio.load(html ?? "").text().replace(/\s+/g, " ").trim();
export const wordCount = (html) => (textOf(html) ? textOf(html).split(" ").length : 0);

function abs(href, base) {
  try {
    return base ? new URL(href, base).href : href;
  } catch {
    return href;
  }
}
