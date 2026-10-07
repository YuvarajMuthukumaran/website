// The "Our Team" location pages (Psychiatrist in Gurgaon, Best Psychologist in
// Delhi, Child Counsellor Near Me ...). Their WordPress content is a flat run of
// page-builder blocks; this reads it into structured sections so the template
// can lay it out as doctor cards, feature grids, FAQ accordions and so on.
//
// SEO safety: every heading, sentence and link of the published content is kept,
// in the same order and at the same heading level. Only wrappers, classes and
// purely decorative images (stock avatars, quote marks, theme illustrations) change.
import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import type { AnyNode, Element, Text } from "domhandler";
import { getDoctors, getSite, localPath } from "./content";
import { expertiseTags } from "./team-tags";
import { pastelFor } from "@/components/team";

/** The pages listed under "Our Team" in the live menu. */
export function teamLocationPaths() {
  const team = getSite().menu.find((m) => m.label === "Our Team");
  return new Set((team?.groups ?? []).flatMap((g) => g.links.map((l) => l.href)).filter((h): h is string => !!h));
}

export type CardMeta = { slug: string | null; name: string; kind: "Psychiatrist" | "Psychologist" | null; tags: string[]; cutout: string | null; photo: string | null };

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");

// Small inline icons (decorative).
const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  exp: svg('<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>'),
  fee: svg('<path d="M7 5h10M7 9h10M13 21 7 13h2.5a4 4 0 0 0 0-8"/>'),
  opd: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  online: svg('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
  other: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>'),
  phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  chev: svg('<path d="m6 9 6 6 6-6"/>'),
  quote: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M13 8C7.5 9.6 4 13.8 4 19.5 4 23 6.3 25 9 25c2.6 0 4.5-1.9 4.5-4.4 0-2.4-1.7-4.2-4-4.2-.4 0-.8 0-1.1.2.6-2.9 2.7-5.2 5.6-6.4L13 8zm14 0c-5.5 1.6-9 5.8-9 11.5 0 3.5 2.3 5.5 5 5.5 2.6 0 4.5-1.9 4.5-4.4 0-2.4-1.7-4.2-4-4.2-.4 0-.8 0-1.1.2.6-2.9 2.7-5.2 5.6-6.4L27 8z"/></svg>',
};

const isHeading = (el: Element | undefined, levels = "123456") => !!el && new RegExp(`^h[${levels}]$`).test(el.tagName);
const DECORATIVE_IMG = /\/male\.jpg|\/f\.png|qutation|\/testimonial\/|FAQ-Tulasi-Helathcare|touch-illustration/i;

export function structureTeamPage(html: string) {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  const root = $("#r");
  const kids = () => root.children().toArray() as Element[];

  // Doctor photo (original upload path) → slug, for cards whose name is not linked.
  const bySlug = new Map(getDoctors().map((d) => [d.slug, d]));
  const byPhoto = new Map(getDoctors().filter((d) => d.photo).map((d) => [localPath(d.photo!), d.slug]));
  const cutoutOf = (slug: string | null) => {
    if (!slug) return null;
    const p = `/team-portraits/${slug}.webp`;
    return existsSync(path.join(process.cwd(), "public", p)) ? p : null;
  };

  // 0 · Comments out; loose text (FAQ answers, eyebrows, post dates) into paragraphs.
  root.contents().each((_, n: AnyNode) => {
    if (n.type === "comment") $(n).remove();
    else if (n.type === "text") {
      const t = norm($(n).text());
      if (!t) $(n).remove();
      else $(n).replaceWith(`<p class="lt-loose">${esc(t)}</p>`);
    }
  });
  root.find("img").each((_, el) => {
    if (DECORATIVE_IMG.test($(el).attr("src") ?? "") || /touch-illustration/i.test($(el).attr("alt") ?? "")) $(el).remove();
  });
  root.children("ul").each((_, el) => {
    if (!norm($(el).text())) $(el).remove();
  });

  // 1 · Doctor blocks: [photo] name-heading, role, experience, expertise list, fee, OPD, "Book an Appointment" (tel:).
  const cards: CardMeta[] = [];
  let els = kids();
  for (let i = 0; i < els.length; i++) {
    if (!isHeading(els[i], "34")) continue;
    let tel = -1;
    let meta = false;
    for (let j = i + 1; j < els.length && j < i + 16; j++) {
      const e = els[j];
      if (isHeading(e) || e.tagName === "img") break;
      const t = norm($(e).text());
      if (e.tagName === "ul" || /experience\s*:|subject expert/i.test(t)) meta = true;
      if (e.tagName === "a" && /^tel:/.test($(e).attr("href") ?? "")) {
        tel = j;
        break;
      }
    }
    if (tel < 0 || !meta) continue;
    const start = els[i - 1]?.tagName === "img" ? i - 1 : i;
    const { html: cardHtml, meta: m } = buildCard($, els.slice(start, tel + 1), { bySlug, byPhoto, cutoutOf });
    cards.push(m);
    $(els[start]).before(cardHtml);
    els.slice(start, tel + 1).forEach((e) => $(e).remove());
    els = kids();
    i = els.findIndex((e) => e.tagName === "article" && $(e).hasClass("dr-card") && !$(e).attr("data-done"));
    $(els[i]).attr("data-done", "1");
  }
  root.find("[data-done]").removeAttr("data-done");
  groupRuns($, root, (el) => el.tagName === "article" && $(el).hasClass("dr-card"), '<div class="dr-grid"></div>');

  // 2 · NABH line + logo → trust band.
  for (const el of kids()) {
    if (!isHeading(el) || !/NABH/.test($(el).text())) continue;
    const img = [el.prev, el.next].map((n) => (n && n.type === "tag" ? (n as Element) : undefined)).find((n) => n?.tagName === "img" && /nabh/i.test($(n).attr("alt") ?? ""));
    const band = $('<div class="lt-trust"></div>');
    $(el).before(band);
    if (img) band.append($(img));
    band.append($(el));
  }

  // 3 · FAQ: heading "FAQ…" followed by question headings ("…?") and their answers → accordions.
  for (const el of kids()) {
    if (!isHeading(el, "23") || !/\bFAQ|frequently asked/i.test($(el).text())) continue;
    const list = $('<div class="lt-faq"></div>');
    let n = el.next as Element | null;
    let first = true;
    while (n && n.type === "tag" && isHeading(n) && norm($(n).text()).endsWith("?")) {
      const q = n;
      const answer: Element[] = [];
      let a = q.next as Element | null;
      while (a && a.type === "tag" && !isHeading(a) && !$(a).hasClass("lt-trust")) {
        answer.push(a);
        a = a.next as Element | null;
      }
      const d = $(`<details class="acc lt-q"${first ? " open" : ""}><summary></summary><div class="lt-a"></div></details>`);
      d.find("summary").append($(q)).append(`<span class="lt-q-icon">${ICON.chev}</span>`);
      answer.forEach((x) => d.find(".lt-a").append($(x)));
      list.append(d);
      first = false;
      n = a;
    }
    if (list.children().length) $(el).after(list);
  }

  // 4 · Runs of h4/h5 sub-sections → feature grid.
  {
    let run: Element[][] = [];
    const flush = () => {
      if (run.length >= 2) {
        const grid = $('<div class="lt-feats"></div>');
        $(run[0][0]).before(grid);
        run.forEach((g, gi) => {
          const card = $(`<div class="lt-feat"><span class="lt-num" aria-hidden="true">${String(gi + 1).padStart(2, "0")}</span></div>`);
          g.forEach((x) => card.append($(x)));
          grid.append(card);
        });
      }
      run = [];
    };
    for (const el of kids()) {
      if (isHeading(el, "45") && !$(el).closest(".lt-trust").length) run.push([el]);
      else if (run.length && !isHeading(el) && !/^(div|article)$/.test(el.tagName) && el.tagName !== "img") run.at(-1)!.push(el);
      else flush();
    }
    flush();
  }

  // 5 · "– Label: text" lists → tiles.
  root.find("ul").each((_, ul) => {
    const lis = $(ul).children("li").toArray();
    if (lis.length < 2 || !lis.every((li) => /^[–—-]\s*/.test(norm($(li).text())))) return;
    $(ul).addClass("lt-dash");
    lis.forEach((li) => {
      const first = li.children[0];
      if (first?.type === "text") (first as Text).data = (first as Text).data.replace(/^\s*[–—-]\s*/, "");
      // "<strong>Label:</strong> text" or "<strong>Label</strong>: text" → label as the tile title.
      const kids = li.children.filter((c) => !(c.type === "text" && !(c as Text).data.trim()));
      const label = kids[0];
      if (label?.type !== "tag" || !/^(strong|b)$/.test((label as Element).tagName)) return;
      const $l = $(label);
      $l.addClass("lt-dash-t").text(norm($l.text()).replace(/\s*:\s*$/, ""));
      const after = label.next;
      if (after?.type === "text") (after as Text).data = (after as Text).data.replace(/^\s*:\s*/, "");
    });
  });

  // 5b · Longer lists of short items (conditions, therapies) → tile grid.
  root.children("ul, ol").each((_, list) => {
    const lis = $(list).children("li").toArray();
    if ($(list).hasClass("lt-dash") || lis.length < 5 || !lis.every((li) => norm($(li).text()).length <= 60)) return;
    if (lis.every((li) => $(li).children("a").length === 1 && norm($(li).text()) === norm($(li).children("a").text()))) return;
    $(list).addClass("lt-tiles");
  });

  // 6 · Heading + lists of links only → link chips.
  for (const el of kids()) {
    if (!isHeading(el, "34")) continue;
    const lists: Element[] = [];
    let n = el.next as Element | null;
    while (n && n.type === "tag" && n.tagName === "ul" && $(n).children("li").toArray().every((li) => $(li).children("a").length === 1 && norm($(li).text()) === norm($(li).children("a").text()))) {
      lists.push(n);
      n = n.next as Element | null;
    }
    if (!lists.length) continue;
    const box = $('<div class="lt-links"></div>');
    $(el).before(box);
    box.append($(el));
    const ul = $(lists[0]);
    lists.slice(1).forEach((l) => {
      ul.append($(l).children("li"));
      $(l).remove();
    });
    box.append(ul);
  }
  groupRuns($, root, (el) => $(el).hasClass("lt-links"), '<div class="lt-linkgrid"></div>');

  // 7 · Visit card: "Visit Our … Centre" + address + directions.
  for (const el of kids()) {
    if (!isHeading(el, "34") || !/^visit our/i.test(norm($(el).text()))) continue;
    const p = el.next as Element | null;
    const a = p?.next as Element | null;
    const box = $(`<div class="lt-visit"><span class="lt-visit-icon">${ICON.pin}</span><div></div></div>`);
    $(el).before(box);
    box.find("div").append($(el));
    if (p?.tagName === "p") box.find("div").append($(p));
    if (a?.tagName === "a") box.find("div").append($(a).addClass("lt-dir").append(ICON.arrow));
  }

  // 8 · Latest blog posts: [empty link] [category] h2>a [author – date].
  for (const el of kids()) {
    if (el.tagName !== "a" || norm($(el).text())) continue;
    const cat = el.next as Element | null;
    const h = cat?.next as Element | null;
    if (cat?.tagName !== "a" || !isHeading(h ?? undefined) || !$(h!).find("a").length) continue;
    const meta = h!.next as Element | null;
    const box = $('<div class="lt-post"></div>');
    $(el).before(box);
    $(el).remove();
    box.append($(cat).addClass("lt-cat"));
    box.append($(h!));
    if (meta && $(meta).hasClass("lt-loose")) box.append($(meta).removeClass("lt-loose").addClass("lt-meta"));
  }
  groupRuns($, root, (el) => $(el).hasClass("lt-post"), '<div class="lt-posts"></div>');

  // 9 · Image + heading + text, repeated (awards, news) → media cards.
  {
    const items: Element[][] = [];
    for (const el of kids()) {
      const h = el.next as Element | null;
      const p = h?.next as Element | null;
      if (el.tagName === "img" && isHeading(h ?? undefined, "34") && p?.tagName === "p") items.push([el, h!, p]);
    }
    for (const group of items) {
      const box = $('<div class="lt-media"><div class="lt-media-img"></div><div class="lt-media-body"></div></div>');
      $(group[0]).before(box);
      box.find(".lt-media-img").append($(group[0]));
      box.find(".lt-media-body").append($(group[1])).append($(group[2]));
    }
    groupRuns($, root, (el) => $(el).hasClass("lt-media"), '<div class="lt-mediagrid"></div>');
  }

  // 10 · Testimonials: h6 name + quote.
  for (const el of kids()) {
    const p = el.next as Element | null;
    if (el.tagName !== "h6" || p?.tagName !== "p") continue;
    const initials = norm($(el).text()).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const fig = $(`<figure class="lt-quote"><span class="lt-quote-mark">${ICON.quote}</span><blockquote></blockquote><figcaption><span class="lt-avatar" aria-hidden="true">${esc(initials)}</span></figcaption></figure>`);
    $(el).before(fig);
    fig.find("blockquote").append($(p));
    fig.find("figcaption").append($(el));
  }
  groupRuns($, root, (el) => $(el).hasClass("lt-quote"), '<div class="lt-quotes"></div>');

  // 11 · Short loose text right before a heading or block = eyebrow.
  root.children("p.lt-loose").each((_, el) => {
    const t = norm($(el).text());
    const next = el.next as Element | null;
    if (t.length <= 40 && !/[.!?]$/.test(t) && next && (isHeading(next) || next.tagName === "div")) $(el).removeClass("lt-loose").addClass("lt-kick");
  });

  // Section ids + table of contents (top-level H2/H3 only: not doctor names, FAQ questions or post titles).
  const toc: { id: string; text: string }[] = [];
  let k = 0;
  for (const el of kids()) {
    if (!isHeading(el, "23")) continue;
    const id = `section-${++k}`;
    $(el).attr("id", id);
    toc.push({ id, text: norm($(el).text()) });
  }

  // Split: intro | team (heading + doctor grid) | the rest.
  const all = kids();
  const gridAt = all.findIndex((e) => $(e).hasClass("dr-grid"));
  const headAt = gridAt > 0 && isHeading(all[gridAt - 1]) ? gridAt - 1 : gridAt;
  const out = (list: Element[]) => list.map((e) => $.html(e)).join("\n");
  let intro = gridAt < 0 ? "" : out(all.slice(0, headAt));
  // The banner image (first wide image of the intro) is shown beside the intro text.
  let banner: string | null = null;
  if (gridAt >= 0) {
    const $i = cheerio.load(`<div id="i">${intro}</div>`, null, false);
    const img = $i("#i > img").toArray().find((e) => Number($i(e).attr("width") ?? 0) >= 600);
    if (img) {
      // Below the hero now, so it is no longer the LCP image: load it lazily.
      $i(img).attr("loading", "lazy").removeAttr("fetchpriority");
      banner = $i.html(img);
      $i(img).remove();
      intro = $i("#i").html() ?? "";
    }
  }
  const teamHeadingText = gridAt >= 0 && headAt < gridAt ? norm($(all[headAt]).text()) : null;
  return {
    intro,
    banner,
    teamHeading: gridAt >= 0 && headAt < gridAt ? $.html(all[headAt]) : null,
    teamHeadingText,
    grid: gridAt >= 0 ? $.html(all[gridAt]) : null,
    rest: gridAt < 0 ? out(all) : out(all.slice(gridAt + 1)),
    cards,
    toc: toc.filter((t) => t.text !== teamHeadingText),
  };
}

/** Wrap each run of consecutive matching root children in `wrapper`. */
function groupRuns($: cheerio.CheerioAPI, root: cheerio.Cheerio<Element>, match: (el: Element) => boolean, wrapper: string) {
  let run: Element[] = [];
  const flush = () => {
    if (run.length) {
      const w = $(wrapper);
      $(run[0]).before(w);
      run.forEach((e) => w.append($(e)));
    }
    run = [];
  };
  for (const el of root.children().toArray() as Element[]) {
    if (match(el)) run.push(el);
    else flush();
  }
  flush();
}

type Lookups = { bySlug: Map<string, { slug: string; name: string }>; byPhoto: Map<string, string>; cutoutOf: (s: string | null) => string | null };

function buildCard($: cheerio.CheerioAPI, nodes: Element[], { byPhoto, cutoutOf }: Lookups) {
  const img = nodes[0].tagName === "img" ? $(nodes[0]) : null;
  const rest = img ? nodes.slice(1) : nodes;
  const h = $(rest[0]);
  const tel = $(rest.at(-1)!);
  const href = h.find("a").attr("href") ?? "";
  const photo = img ? localPath(img.attr("src") ?? "") : null;
  let slug = href.match(/\/team\/([^/]+)\/?$/)?.[1] ?? null;
  if (!slug && photo) slug = byPhoto.get(photo) ?? null;
  const cutout = cutoutOf(slug);
  const name = norm(h.text());

  let role = "";
  let skillsLabel: string | null = null;
  let skills = "";
  const facts: { key: string; label: string; value: string }[] = [];
  const notes: string[] = [];
  const fact = (inner: string) => {
    const m = inner.match(/^\s*<(strong|b)>([\s\S]*?)<\/\1>\s*([\s\S]*)$/i);
    if (!m) return notes.push(`<p class="dr-note">${inner}</p>`);
    let label = norm(stripTags(m[2]).replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")).replace(/[:\s]+$/, "");
    let value = m[3].replace(/^(?:\s|&nbsp;|:)+/, "").replace(/<br\s*\/?>(?:\s|&nbsp;)*/gi, "<br>").trim();
    // "<strong>Experience: 8</strong>+ Years": the number belongs with the value, not the label
    const split = label.match(/^([^:]+):\s*(\S.*)$/);
    if (split) {
      label = split[1].trim();
      value = `${split[2]}${value}`.trim();
    }
    const key = /experience/i.test(label) ? "exp" : /online/i.test(label) ? "online" : /opd|timing/i.test(label) ? "opd" : /fee/i.test(label) ? "fee" : "other";
    if (/subject expert|expertise|speciali/i.test(label) && !norm(stripTags(value))) skillsLabel = label;
    else facts.push({ key, label, value });
  };
  for (const e of rest.slice(1, -1)) {
    const $e = $(e);
    if (e.tagName === "ul") {
      skills = `<ul class="dr-chips">${$e.html() ?? ""}</ul>`;
      continue;
    }
    if (e.tagName !== "p") {
      notes.push($.html(e));
      continue;
    }
    const inner = ($e.html() ?? "").trim();
    if (!role && !/^<(strong|b)>/i.test(inner)) {
      const [r, ...more] = inner.split(/(?:<br\s*\/?>\s*)+(?=<(?:strong|b)>)/i);
      role = r.replace(/(?:&nbsp;|\s)+$/, "");
      if (more.length) fact(more.join(""));
      continue;
    }
    fact(inner);
  }
  const text = `${role} ${stripTags(skills)}`;
  const kind = /psychiatr/i.test(role) ? "Psychiatrist" : /psycholog|counsel|therap/i.test(role) ? "Psychologist" : null;
  const tags = expertiseTags(text);
  const years = facts.find((f) => f.key === "exp")?.value.match(/(\d+\+?)\s*Years?/i)?.[1];

  const alt = img?.attr("alt") ?? name;
  const imgHtml = cutout
    ? `<img src="${cutout}" alt="${esc(alt)}" width="480" height="600" loading="lazy" decoding="async" class="dr-cut">`
    : img
      ? `<img src="${img.attr("src")}" alt="${esc(alt)}" width="${img.attr("width") ?? 400}" height="${img.attr("height") ?? 240}" loading="lazy" decoding="async" class="dr-orig">`
      : "";
  h.addClass("dr-name");
  tel.addClass("dr-call").prepend(ICON.phone);
  const html = `<article class="dr-card" data-kind="${kind ?? ""}" data-tags="${esc(tags.join("|"))}">
<div class="dr-photo"${slug ? ` style="--tint:${pastelFor(slug)}"` : ""}>${imgHtml}${years ? `<span class="dr-badge" aria-hidden="true">${ICON.exp}${esc(years)} yrs</span>` : ""}</div>
<div class="dr-body">
<div class="dr-id">${$.html(h)}${role ? `<p class="dr-role">${role}</p>` : ""}</div>
${skills ? `<div class="dr-skills">${skillsLabel ? `<p class="dr-label">${esc(skillsLabel)}:</p>` : ""}${skills}</div>` : ""}
${facts.length ? `<div class="dr-facts">${facts.map((f) => `<p class="dr-fact" data-k="${f.key}"><span class="dr-fact-icon">${ICON[f.key as keyof typeof ICON] ?? ICON.other}</span><strong>${esc(f.label)}</strong><span class="dr-fact-v">${f.value}</span></p>`).join("")}</div>` : ""}
${notes.join("")}
<div class="dr-actions">${$.html(tel)}${href ? `<span class="dr-more" aria-hidden="true">Profile ${ICON.arrow}</span>` : ""}</div>
</div>
</article>`;
  return { html, meta: { slug, name, kind, tags, cutout, photo } as CardMeta };
}
