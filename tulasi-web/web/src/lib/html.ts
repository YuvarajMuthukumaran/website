// Server-side reading of migrated HTML (FAQ sections, team groups, headings).
import "server-only";
import * as cheerio from "cheerio";
import { localPath } from "./content";

const text = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Q&A pairs from a real FAQ section: questions (headings ending in "?") that
 * follow a heading mentioning FAQ / Frequently Asked. Used for FAQPage schema,
 * which must mirror visible content exactly.
 */
export function extractFaq(html: string) {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  const nodes = $("#r").children().toArray();
  const items: { q: string; a: string }[] = [];
  let inFaq = false;
  let faqLevel = 0;
  let current: { q: string; a: string[] } | null = null;
  const flush = () => {
    if (current && current.a.length) items.push({ q: current.q, a: current.a.join(" ") });
    current = null;
  };
  for (const el of nodes) {
    const tag = el.tagName;
    const t = text($(el).text());
    if (/^h[2-6]$/.test(tag)) {
      const level = Number(tag[1]);
      if (/\bFAQs?\b|frequently asked/i.test(t)) {
        flush();
        inFaq = true;
        faqLevel = level;
        continue;
      }
      if (inFaq && t.endsWith("?")) {
        flush();
        current = { q: t, a: [] };
        continue;
      }
      if (inFaq && level <= faqLevel) {
        flush();
        inFaq = false;
      }
      continue;
    }
    if (current && t && /^(p|ul|ol)$/.test(tag)) current.a.push(t);
  }
  flush();
  return items;
}

/** The Our Team page: groups (Psychiatrists, Psychologists...) of people with photo + designation. */
export function teamGroups(html: string) {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  const groups: { heading: string; people: { name: string; slug: string | null; designation: string; photo: string | null; alt: string }[] }[] = [];
  const intro: string[] = [];
  let pendingImg: { src: string; alt: string } | null = null;
  for (const el of $("#r").find("h2, h3, p, img").toArray()) {
    const $el = $(el);
    if (el.tagName === "h2") groups.push({ heading: text($el.text()), people: [] });
    else if (el.tagName === "img") pendingImg = { src: localPath($el.attr("src") ?? ""), alt: $el.attr("alt") ?? "" };
    else if (el.tagName === "h3" && groups.length) {
      const href = $el.find("a").attr("href");
      groups.at(-1)!.people.push({
        name: text($el.text()),
        slug: href ? localPath(href).split("/").filter(Boolean).pop() ?? null : null,
        designation: "",
        photo: pendingImg?.src ?? null,
        alt: pendingImg?.alt ?? "",
      });
      pendingImg = null;
    } else if (el.tagName === "p") {
      const person = groups.at(-1)?.people.at(-1);
      if (person && !person.designation) person.designation = text($el.text());
      else if (!groups.length) intro.push(text($el.text()));
    }
  }
  return { intro, groups: groups.filter((g) => g.people.length) };
}

/** Table of contents from H2s (anchors are added by addHeadingIds). */
export function headingsOf(html: string) {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  return $("#r h2").toArray().map((el, i) => ({ id: `section-${i + 1}`, text: text($(el).text()) })).filter((h) => h.text);
}

export function addHeadingIds(html: string) {
  let i = 0;
  return html.replace(/<h2>/g, () => `<h2 id="section-${++i}">`);
}

/** Collapse the page builder's whitespace runs (keeps the JSON small, the text unchanged). */
export const tidy = (html: string) => html.replace(/[\t ]*\n[\t\n ]*/g, "\n");
