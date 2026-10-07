// Content access for every route. Reads the JSON produced by the Phase 0
// scraper (synced into /content by scripts/sync-content.mjs). Server-only:
// the full content never ships to the browser.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tulasihealthcare.com").replace(/\/$/, "");
const LIVE_ORIGINS = /^https?:\/\/(www\.)?tulasihealthcare\.com/i;

// ───────────── Types (mirror scraper/05-normalize-content.mjs) ─────────────
export type Seo = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: Record<string, string> | string | null;
  og?: {
    title: string | null;
    description: string | null;
    type: string | null;
    url: string | null;
    image: { url: string; width?: number; height?: number; type?: string }[];
    publishedTime: string | null;
    modifiedTime: string | null;
  };
  twitter?: { card: string | null; misc: Record<string, string> | null };
  schema?: unknown;
};
export type ImageRef = { id?: number; url: string; alt: string | null; width: number | null; height: number | null };
export type Entry = {
  id: number;
  kind: "post" | "page";
  pageType: string;
  slug: string;
  path: string;
  url: string;
  title: string;
  h1: string;
  date: string | null;
  modified: string | null;
  author: number | null;
  parent: number | null;
  categories: number[];
  tags: number[];
  featuredImage: ImageRef | null;
  excerpt: string | null;
  contentHtml: string;
  wordCount: number;
  seo: Seo;
};
export type Term = { id: number; name: string; slug: string; path: string; count: number; description: string | null; seo: Seo };
export type Doctor = {
  slug: string;
  url: string;
  name: string;
  honorific: string | null;
  designation: string | null;
  role: "psychiatrist" | "psychologist" | "other";
  rciLicensed: boolean;
  photo: string | null;
  photoAlt: string | null;
  bioHtml: string;
  excerpt: string | null;
  experienceYearsMentioned: number | null;
  qualificationsMentioned: string[];
  seo: { title: string; metaDescription: string | null; canonical: string | null };
};
/** Facts published on the service pages (scraper/10-extract-doctor-details.mjs). */
export type DoctorDetails = {
  experience?: string;
  expertise?: string[];
  fee?: string;
  opd?: string[];
  onlineOpd?: string;
  conflicts: Partial<Record<"experience" | "expertise" | "fee" | "opd" | "onlineOpd", { value: unknown; pages: number }[]>>;
  sources: string[];
};
export type Author = { slug: string; name: string; path: string; wpAuthorIds: number[]; seo: { title: string; description: string | null; canonical: string; robots: string } };
export type ArchiveSeo = { title: string | null; description: string | null; canonical: string | null; robots: string | null; h1: string | null; ogImage: string | null };
export type Link = { label: string; href: string | null };
export type Site = {
  name: string;
  logo: { src: string; alt: string } | null;
  footerAbout: string;
  footerColumns: { heading: string; links: Link[] }[];
  contact: { phoneDisplay: string; phoneHref: string; email: string; address: string };
  social: string[];
  copyright: string;
  menu: { label: string; href: string | null; groups: { label: string | null; links: Link[] }[] }[];
};
export type Home = {
  hero: { heading: string; headingEmphasis: string | null; text: string; cta: { label: string; href: string }; image: { src: string; alt: string } | null };
  stats: { value: number; display: string; label: string }[];
  about: { eyebrow: string | null; heading: string; text: string; points: string[]; more: Link; image: { src: string; alt: string } | null };
  apart: { eyebrow: string | null; heading: string; items: { title: string; text: string; image: { src: string; alt: string } | null }[] };
  team: { eyebrow: string | null; heading: string; text: string };
  premium: string;
  awards: { title: string; text: string; image: { src: string; alt: string } | null }[];
  nabh: { text: string; image: { src: string; alt: string } | null };
  insurance: { heading: string; text: string; logos: { src: string; alt: string }[] };
  intro: { heading: string; blocks: { heading: string; paragraphs: string[] }[] };
  faq: { heading: string; text: string; items: { q: string; a: string }[] };
  blog: { heading: string; text: string; postTitles: string[] };
  resources: { heading: string; subheading: string; items: { title: string }[]; text: string; links: { label: string; href: string }[]; images: { src: string; alt: string }[] };
  testimonials: { heading: string; text: string; items: { name: string; quote: string }[] };
};
type Redirect = { from: string; to: string };

// ───────────── Loading ─────────────
const DIR = path.join(process.cwd(), "content");
const load = <T,>(name: string): T => JSON.parse(readFileSync(path.join(DIR, `${name}.json`), "utf8"));

/** from -> to, whether or not the stored "from" ends in a slash. */
const redirectLookup = (redirects: Redirect[]) => {
  const m = new Map<string, string>();
  for (const r of redirects) {
    m.set(r.from, r.to);
    m.set(r.from.replace(/\/?$/, "/"), r.to);
  }
  return m;
};

function locationsLink(l: Link): Link {
  const href = l.href?.replace(LIVE_ORIGINS, "");
  if (href === "/contact-us/" || href === "/contact-us") return { ...l, label: l.label === "Contact Us" ? "Locations" : l.label, href: "/locations/" };
  return l.label === "Contact Us" ? { ...l, label: "Locations" } : l;
}

function withDirectLinks(site: Site, redirects: Redirect[]): Site {
  const map = redirectLookup(redirects);
  const fix = (l: Link): Link => {
    if (!l.href) return l;
    const p = l.href.replace(LIVE_ORIGINS, "");
    const linked = p.startsWith("/") && map.has(p) ? { ...l, href: map.get(p)! } : l;
    return locationsLink(linked);
  };
  return {
    ...site,
    menu: site.menu.map((m) => {
      const top = locationsLink({ label: m.label, href: m.href ? (map.get(m.href) ?? m.href) : m.href });
      return { ...m, label: top.label, href: top.href, groups: m.groups.map((g) => ({ ...g, links: g.links.map(fix) })) };
    }),
    footerColumns: site.footerColumns.map((c) => ({ ...c, links: c.links.map(fix) })),
  };
}

const all = cache(() => {
  const posts = load<Entry[]>("posts")
    .filter((p) => p.title)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const redirects = load<Redirect[]>("redirects");
  const redirected = new Set(redirects.map((r) => r.from));
  // Pages the live site already redirects elsewhere are served as redirects, not pages.
  const pages = load<Entry[]>("pages").filter((p) => !redirected.has(p.path));
  return {
    posts,
    pages,
    redirects,
    doctors: load<Doctor[]>("doctors"),
    tags: load<Term[]>("tags"),
    categories: load<Term[]>("categories"),
    authors: load<Author[]>("authors"),
    archiveSeo: load<Record<string, ArchiveSeo>>("archive-seo"),
    site: withDirectLinks(load<Site>("site"), redirects),
    doctorDetails: load<Record<string, DoctorDetails>>("doctor-details"),
    home: load<Home>("home"),
    media: load<{ url: string; path: string; alt: string | null; width: number | null; height: number | null }[]>("media"),
  };
});

export const getSite = () => all().site;
export const getHome = () => all().home;
export const getPosts = () => all().posts;
export const getPages = () => all().pages;
/** Dr Gorav Gupta always leads every list of doctors (team, booking, finder, chat). */
export const LEAD_DOCTOR = "dr-gorav-gupta";
export const getDoctorsUnsorted = () => all().doctors;
export const getDoctors = () => {
  const list = all().doctors;
  return [...list.filter((d) => d.slug === LEAD_DOCTOR), ...list.filter((d) => d.slug !== LEAD_DOCTOR)];
};
export const getTags = () => all().tags;
export const getCategories = () => all().categories;
export const getAuthors = () => all().authors;
/**
 * Published facts for a doctor. Fee and OPD timings are only returned when
 * every page that lists them agrees; otherwise the site asks people to call
 * (see the doctor-details conflicts in reports/doctor-details-conflicts.md).
 */
export function getDoctorFacts(slug: string) {
  const d = all().doctorDetails[slug];
  if (!d) return null;
  return {
    experience: d.experience?.replace(/\s*\(.*?\)\s*/g, " ").trim() ?? null,
    expertise: (d.expertise ?? []).map((e) => e.replace(/^[–-]\s*/, "").trim()).filter(Boolean),
    fee: d.conflicts.fee ? null : d.fee ?? null,
    opd: d.conflicts.opd ? null : d.opd ?? null,
    onlineOpd: d.conflicts.onlineOpd ? null : d.onlineOpd ?? null,
    timingsUnconfirmed: !!(d.conflicts.fee || d.conflicts.opd || d.conflicts.onlineOpd),
  };
}
export const getArchiveSeo = (p: string) => all().archiveSeo[p] ?? null;

const sameSlug = (a: string, b: string) => {
  const d = (s: string) => {
    try {
      return decodeURIComponent(s).normalize("NFC").toLowerCase();
    } catch {
      return s.toLowerCase();
    }
  };
  return d(a) === d(b);
};
export const getPostBySlug = (slug: string) => all().posts.find((p) => sameSlug(p.slug, slug));
export const getPageByPath = (p: string) => all().pages.find((x) => x.path === p || decodeURIComponent(x.path) === p);
export const getDoctorBySlug = (slug: string) => all().doctors.find((d) => d.slug === slug);
export const getTagBySlug = (slug: string) => all().tags.find((t) => sameSlug(t.slug, slug));
export const getCategoryBySlug = (slug: string) => all().categories.find((t) => t.slug === slug);
export const getAuthorBySlug = (slug: string) => all().authors.find((a) => a.slug === slug);

export const postsByTag = (id: number) => all().posts.filter((p) => p.tags.includes(id));
export const postsByCategory = (id: number) => all().posts.filter((p) => p.categories.includes(id));
export const postsByAuthor = (a: Author) => all().posts.filter((p) => p.author != null && a.wpAuthorIds.includes(p.author));
export const tagsFor = (p: Entry) => all().tags.filter((t) => p.tags.includes(t.id));

/** Doctor whose name appears in a post's "Written by" (for author boxes). */
export const doctorByName = (name: string | undefined) =>
  name ? all().doctors.find((d) => d.name.replace(/\s+/g, " ").toLowerCase() === name.toLowerCase()) : undefined;

/** Posts that share the most tags with `post` (then most recent). */
export function relatedPosts(post: Entry, n = 3) {
  const tags = new Set(post.tags);
  return all()
    .posts.filter((p) => p.id !== post.id)
    .map((p) => ({ p, score: p.tags.filter((t) => tags.has(t)).length }))
    .sort((a, b) => b.score - a.score || (b.p.date ?? "").localeCompare(a.p.date ?? ""))
    .slice(0, n)
    .map((x) => x.p);
}

/** Image dimensions from the media library, so next/image never shifts layout. */
export function mediaInfo(src: string | null | undefined) {
  if (!src) return null;
  const p = localPath(src);
  return all().media.find((m) => m.path === p) ?? null;
}

// ───────────── HTML / URL helpers ─────────────
/** Live absolute URL → same-site relative path (links keep working on staging too). */
export function localPath(href: string) {
  return href.replace(LIVE_ORIGINS, "") || "/";
}

// Wording the migrated pages used that reads as stigmatising, or that mixes US and UK spelling.
// Applied to visible text only (never to tags or URLs). Order matters: longer phrases first.
const WORDING: [RegExp, string][] = [
  [/\bmentally sick patients\b/gi, "patients with mental illness"],
  [/\bmentally ill patients\b/gi, "patients with mental illness"],
  [/\bmental patients\b/gi, "people with mental illness"],
  [/\bmental patient\b/gi, "person with mental illness"],
  [/\bmentally sick\b/gi, "mentally unwell"],
  [/\bmental hospitals\b/gi, "psychiatric hospitals"],
  [/\bmental hospital\b/gi, "psychiatric hospital"],
  [/\bsuffering from\b/gi, "living with"],
  [/\bcounseling\b/gi, "counselling"],
  [/\bcounselors\b/gi, "counsellors"],
  [/\bcounselor\b/gi, "counsellor"],
  [/\bcenters\b/gi, "centres"],
  [/\bcenter\b(?! for\b)/gi, "centre"],
  [/\bbehavioral\b/gi, "behavioural"],
  [/\bbehaviors\b/gi, "behaviours"],
  [/\bbehavior\b/gi, "behaviour"],
  [/\bTherAapy\b/g, "Therapy"],
  [/\bFAQ's\b/g, "FAQs"],
  [/\bhis\/her\b/gi, "their"],
];
const keepCase = (from: string, to: string) =>
  from === from.toUpperCase() && from.length > 3 ? to.toUpperCase() : from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
export function polishText(text: string) {
  return WORDING.reduce((t, [re, to]) => t.replace(re, (m) => keepCase(m, to)), text);
}
/** Runs `fn` over the text between tags only (and not inside <script>/<style>). */
const mapText = (html: string, fn: (t: string) => string) =>
  html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/i).map((seg, i) => (i % 2 ? seg : fn(seg))).join("");

let legacy: { map: Map<string, string>; profiles: Set<string> } | undefined;
const legacyLinks = () =>
  (legacy ??= { map: redirectLookup(all().redirects), profiles: new Set(all().doctors.map((d) => d.slug)) });

/** Internal links: always end in "/", skip the redirect hop, and never point at a profile that doesn't exist. */
function fixInternalHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [pathAndQuery, hash = ""] = href.split("#");
  const [p, query = ""] = pathAndQuery.split("?");
  const direct = legacyLinks().map.get(p);
  if (direct) return direct + (query ? "?" + query : "") + (hash ? "#" + hash : ""); // includes old .php addresses
  if (/\.[a-z0-9]{2,5}$/i.test(p)) return href; // a file
  const withSlash = p.endsWith("/") ? p : p + "/";
  const { map, profiles } = legacyLinks();
  let to = map.get(withSlash) ?? withSlash;
  const prof = to.match(/^\/team\/([^/]+)\/$/);
  if (prof && !profiles.has(prof[1])) to = "/our-team/";
  return to + (query ? "?" + query : "") + (hash ? "#" + hash : "");
}

/** Alt text from a descriptive file name ("best-psychiatrist-in-delhi-2.webp" -> "best psychiatrist in delhi"). */
function altFromSrc(src: string) {
  const base = decodeURIComponent(src.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/-\d+x\d+$/, "").replace(/-\d+$/, "");
  const words = base.split(/[-_ ]+/).filter((w) => /^[a-z]{2,}$/i.test(w));
  if (words.length < 2 || /^(img|image|screenshot|whatsapp|dsc|photo|banner|untitled)/i.test(base)) return "";
  return words.join(" ");
}

/**
 * Final pass over migrated HTML: internal links become relative (and skip legacy redirects),
 * images get native lazy-loading, async decoding and a descriptive alt where the editor left
 * it empty, external links open safely, and a few stigmatising or mixed-spelling phrases are
 * tidied in the visible text.
 */
const BOOKING_CTA = `<div class="not-prose my-10 flex flex-col gap-4 rounded-[1.25rem] bg-sage-50 p-6 ring-1 ring-sage-100 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-display text-xl font-semibold !text-ink">Talk to a specialist</p><p class="mt-1 !text-ink-soft">Book a consultation with our psychiatrists and psychologists.</p></div><a href="/book-appointment/" class="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-brand-600 px-6 font-semibold !text-white !no-underline hover:bg-brand-700">Book appointment</a></div>`;

/**
 * The old theme ended most pages with a scraped footer: a wall of "Psychiatrist / Rehabilitation
 * centre in <city>" links (many for cities with no centre), a decorative image and an empty
 * "Get in touch" heading. The real footer already links to what matters, so cut it, and keep
 * the booking call-to-action that sat inside it.
 */
const stripSeoFooter = (html: string) =>
  html
    .replace(/<h[2-6][^>]*>[^<]*Psychiatrist in other locations\s*<\/h[2-6]>[\s\S]*?(?=<!-- contact-area -->)/i, "")
    .replace(/<!-- contact-area -->[\s\S]*?<!-- contact-area-end -->/g, (block) => (block.includes("%%BOOKING_CTA%%") ? "<p>%%BOOKING_CTA%%</p>" : ""));

export function renderHtml(html: string) {
  return mapText(stripSeoFooter(html), polishText)
    .replace(/<h4>([^<]+)<\/h4>([\s\S]*?)<a href="([^"]+)">\s*Click here\s*<\/a>/g, (_m, title, body, href) => `<h4>${title}</h4>${body}<a href="${href}">Learn more<span class="sr-only"> about ${title.replace(/^Treatment of /i, "").trim()}</span></a>`)
    // Where the live page had an embedded contact form: a booking call-to-action.
    .replace(/(<p>%%BOOKING_CTA%%<\/p>\s*)+/g, BOOKING_CTA)
    .replace(/tulasiheathcare\.com/gi, "tulasihealthcare.com") // a typo in older content
    .replace(/<a\b[^>]*href="[^"]*\/wp-admin\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, "$1") // editor links that never worked
    .replace(/(href|src)="(https?:\/\/(?:www\.)?tulasihealthcare\.com)(\/[^"]*)?"/gi, (_m, attr, _o, rest) => `${attr}="${rest ?? "/"}"`)
    .replace(/href="(\/[^"]*)"/g, (_m, h) => `href="${fixInternalHref(h)}"`)
    .replace(/<img\b([^>]*?)\balt=""([^>]*?)\bsrc="([^"]+)"/g, (m, a, b, src) => { const alt = altFromSrc(src); return alt ? `<img${a}alt="${alt}"${b}src="${src}"` : m; })
    .replace(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*?)\balt=""/g, (m, a, src, b) => { const alt = altFromSrc(src); return alt ? `<img${a}src="${src}"${b}alt="${alt}"` : m; })
    // The first image is usually the page's LCP element: load it eagerly.
    .replace(/<img (?![^>]*loading=)/, '<img loading="eager" fetchpriority="high" decoding="async" ')
    .replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ')
    .replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*rel=)/g, '<a href="$1" rel="noopener" target="_blank"');
}

export const readingMinutes = (e: Entry) => Math.max(1, Math.round(e.wordCount / 220));

export const absoluteUrl = (p: string) => (p.startsWith("http") ? p.replace(LIVE_ORIGINS, SITE_URL) : `${SITE_URL}${p}`);

/** Display a date the way Indian readers expect: 5 October 2026. */
export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
