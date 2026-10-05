// Step 8: site-wide content that lives in the theme, not in any post:
// header menu, footer, contact details, social links, and every homepage
// section (verbatim). The homepage is an Elementor + theme template, so its
// text is lifted from the rendered HTML with selectors confirmed against the
// live markup.
// Output: data/content/site.json, data/content/home.json
import path from "node:path";
import * as cheerio from "cheerio";
import { DATA, ORIGIN, fetchCached, writeJson } from "./lib/http.mjs";

const r = await fetchCached(`${ORIGIN}/`);
const $ = cheerio.load(r.body);
const t = (el) => $(el).text().replace(/\s+/g, " ").trim();
const rel = (href) => {
  if (!href || href.startsWith("#")) return null;
  try {
    const u = new URL(href, ORIGIN);
    return u.host.endsWith("tulasihealthcare.com") ? u.pathname + u.search : u.href;
  } catch {
    return href;
  }
};
const img = (el) => {
  const $el = $(el);
  const src = $el.attr("data-src") || $el.attr("src");
  return src && !src.startsWith("data:") ? { src: rel(src), alt: $el.attr("alt") ?? "" } : null;
};

// ---------- header menu (QuadMenu): top level → groups ("#value" headings) → links ----------
const menu = $("ul.quadmenu-navbar-nav").first().children("li").map((_, li) => {
  const $a = $(li).children("a").first();
  const groups = [];
  let current = { label: null, links: [] };
  $(li).find("ul li > a").each((_, a) => {
    const href = $(a).attr("href");
    if (href === "#value") {
      if (current.label || current.links.length) groups.push(current);
      current = { label: t(a), links: [] };
    } else current.links.push({ label: t(a), href: rel(href) });
  });
  if (current.label || current.links.length) groups.push(current);
  return { label: t($a), href: rel($a.attr("href")), groups };
}).get();

// ---------- footer ----------
const $f = $("footer");
const footerColumns = $f.find("h5").map((_, h) => ({
  heading: t(h),
  // The <ul> is a sibling of the title wrapper inside .footer-widget.
  links: $(h).closest(".footer-widget").find("ul a").map((_, a) => ({ label: t(a), href: rel($(a).attr("href")) })).get(),
})).get();
const contact = {
  phoneDisplay: t($f.find('a[href^="tel:"]').first()),
  phoneHref: $f.find('a[href^="tel:"]').first().attr("href"),
  email: t($f.find('a[href^="mailto:"]').first()),
  address: t($f.find("li").filter((_, li) => /Sector|Haryana-|\d{3} ?\d{3}/.test(t(li)) && !$(li).find("a").length).first()),
};
const social = [...new Set($('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com/"]').map((_, a) => $(a).attr("href")).get())];
const site = {
  name: "Tulasi Healthcare",
  logo: img($("header img").first()),
  footerAbout: t($f.find("p").first()),
  footerColumns,
  contact,
  social,
  copyright: t($f.find("p").filter((_, p) => /Copyright/.test(t(p))).first()),
  menu,
};

// ---------- homepage ----------
const $m = $("main").length ? $("main") : $("body");
const h = (level, text) => $m.find(level).filter((_, e) => t(e) === text).first();
const nextP = ($el) => t($el.nextAll("p").first()) || t($el.parent().nextAll().find("p").addBack("p").first());

// Document-order walk: every element matching `sel` between two anchors.
// Elementor splits one visual section across sibling <section>s, so "the
// content between heading A and heading B" is more reliable than DOM nesting.
const ORDER = $m.find("*").get();
const between = (start, end, sel) => {
  const a = ORDER.indexOf(start[0] ?? start);
  const b = end ? ORDER.indexOf(end[0] ?? end) : ORDER.length;
  return ORDER.slice(a + 1, b < 0 ? ORDER.length : b).filter((el) => $(el).is(sel));
};

const $hero = $m.find(".slider-content").filter((_, e) => $(e).find("h2").length && $(e).find("p").length).first();
const heroH2 = $hero.find("h2").first();
const hero = {
  heading: t(heroH2),
  // The highlighted part of the heading (a <span> on the live site), styled as the accent.
  headingEmphasis: t(heroH2.find("span").first()) || null,
  text: t($hero.find("p").filter((_, p) => !!t(p)).first()),
  cta: { label: t($hero.find("a").first()) || "CALL NOW", href: $hero.find("a").first().attr("href") ?? contact.phoneHref },
  image: img($hero.closest(".single-slider").find("img").first()),
  background: ($hero.closest(".single-slider").attr("data-background") || $hero.closest(".single-slider").attr("style")?.match(/url\(['"]?([^'")]+)/)?.[1]) ?? null,
};
const stats = $m.find(".counter").map((_, c) => ({ value: Number($(c).find(".count").text().trim()), display: t(c), label: t($(c).nextAll("p").first()) || t($(c).parent().find("p").first()) })).get();

const aboutH2 = h("h2", "Tulasi Healthcare - Best Rehabilitation Centre in Delhi NCR, India");
const $about = aboutH2.closest(".about-content");
const about = {
  eyebrow: t(aboutH2.prevAll().first()) || null,
  heading: t(aboutH2),
  text: t($about.children("p").first()),
  points: $about.find("li").map((_, li) => t(li)).get(),
  more: { label: t($about.find("a").last()), href: rel($about.find("a").last().attr("href")) },
  image: img($about.closest("section").find("img").first()),
};

const apartH2 = h("h2", "What Sets us Apart");
const apart = {
  eyebrow: t(apartH2.prevAll().first()) || null,
  heading: t(apartH2),
  items: apartH2.closest("section").find("h3").map((_, h3) => {
    const $li = $(h3).closest("li").length ? $(h3).closest("li") : $(h3).parent();
    return { title: t(h3), text: t($li).replace(t(h3), "").trim(), image: img($li.find("img").first()) };
  }).get(),
};

const teamH2 = h("h2", "Psychiatrists and Psychologists");
const team = { eyebrow: t(teamH2.prevAll().first()) || null, heading: t(teamH2), text: t(teamH2.nextAll("p").first()) || t(teamH2.parent().find("p").first()) };

const premium = t($m.find("h3").filter((_, e) => /PREMIUM CENTRE/.test(t(e))).first());
const awards = $m.find("h3.elementor-heading-title").filter((_, e) => !/PREMIUM CENTRE|Patient Resources|FOR PATIENTS/.test(t(e))).map((_, h3) => {
  const $w = $(h3).closest(".elementor-widget");
  const $col = $(h3).closest(".elementor-column, .elementor-element.e-con, .elementor-widget-wrap");
  return { title: t(h3), text: t($w.nextAll(".elementor-widget").find("p").first()) || t($col.find("p").first()), image: img($col.find("img").first()) };
}).get();
const nabhP = $m.find("p").filter((_, p) => /NABH/.test(t(p))).first();
const nabh = { text: t(nabhP), image: img(nabhP.closest(".elementor-column, .e-con, section").find("img").first()) };

const insH2 = h("h2", "Insurance Partner");
const insurance = { heading: t(insH2), text: t(insH2.parent().find("p").first()), logos: insH2.closest("section").find("img").map((_, i) => img(i)).get().filter(Boolean) };

const h1 = $m.find("h1").first();
const faqH2 = h("h2", "FAQ's");
const introBlocks = [];
for (const el of between(h1, faqH2, "h3, p, img")) {
  if (el.tagName === "h3") introBlocks.push({ heading: t(el), paragraphs: [] });
  else if (el.tagName === "p" && t(el) && introBlocks.length) introBlocks.at(-1).paragraphs.push(t(el));
}
const intro = {
  heading: t(h1),
  blocks: introBlocks,
  images: between(h1, faqH2, "img").map(img).filter(Boolean),
};

const faq = {
  heading: t(faqH2),
  text: t(faqH2.closest("section").find("p").first()),
  items: $m.find(".faq-wrap .card").map((_, c) => ({ q: t($(c).find(".card-header")), a: t($(c).find(".card-body")) })).get(),
};

const blogH2 = h("h2", "Stay Updated To Our Blog & News");
const blog = { heading: t(blogH2), text: t(blogH2.closest("section").find("p").filter((_, p) => /Stigma/.test(t(p))).first()) || t(blogH2.parent().nextAll().find("p").first()), postTitles: $m.find(".psacp-post-title").map((_, e) => t(e)).get() };

const resH3 = $m.find("h3").filter((_, e) => t(e) === "Patient Resources").first();
const tH2 = h("h2", "What Our Patient’s Say");
const resEls = between(resH3, tH2, "h3, h4, p, a, img");
const resources = {
  heading: t(resH3),
  subheading: t(resEls.find((e) => e.tagName === "h3")),
  items: resEls.filter((e) => e.tagName === "h4").map((h4) => ({ title: t(h4) })),
  text: resEls.filter((e) => e.tagName === "p").map(t).filter(Boolean).join(" "),
  links: resEls.filter((e) => e.tagName === "a").map((a) => ({ label: t(a), href: rel($(a).attr("href")) })).filter((l) => l.label && l.href),
  images: resEls.filter((e) => e.tagName === "img").map(img).filter(Boolean),
};

const $tsec = tH2.closest("section");
const testimonials = {
  heading: t(tH2),
  text: t(tH2.nextAll("p").first()) || t(tH2.parent().find("p").first()),
  // Published names are kept so content matches; flagged in the gap report for consent review.
  items: $tsec.find("h6").map((_, h6) => {
    const $card = $(h6).closest("[class*=testimonial], .item, .swiper-slide, .slick-slide, .col-lg-4, .col-md-6").first();
    const quote = t($card.find("p").first()) || t($(h6).prevAll("p").first()) || t($(h6).nextAll("p").first());
    return { name: t(h6), quote };
  }).get().filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i),
};

const home = { hero, stats, about, apart, team, premium, awards, nabh, insurance, intro, faq, blog, resources, testimonials };
await writeJson(path.join(DATA, "content", "site.json"), site);
await writeJson(path.join(DATA, "content", "home.json"), home);
console.log(JSON.stringify({ menuTop: menu.length, footerColumns: footerColumns.length, stats: stats.length, apart: apart.items.length, awards: awards.length, intro: intro.blocks.length, heroText: !!hero.text, aboutPoints: about.points.length, faq: faq.items.length, resources: resources.items.length, testimonials: testimonials.items.length }));
