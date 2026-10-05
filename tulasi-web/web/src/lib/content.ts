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
    doctors: load<Doctor[]>("doctors"),
    tags: load<Term[]>("tags"),
    categories: load<Term[]>("categories"),
    authors: load<Author[]>("authors"),
    archiveSeo: load<Record<string, ArchiveSeo>>("archive-seo"),
    site: load<Site>("site"),
    doctorDetails: load<Record<string, DoctorDetails>>("doctor-details"),
    home: load<Home>("home"),
    media: load<{ url: string; path: string; alt: string | null; width: number | null; height: number | null }[]>("media"),
  };
});

export const getSite = () => all().site;
export const getHome = () => all().home;
export const getPosts = () => all().posts;
export const getPages = () => all().pages;
export const getDoctors = () => all().doctors;
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

/**
 * Final pass over migrated HTML: internal links become relative, images get
 * native lazy-loading + async decoding, external links open safely.
 * Text is never touched.
 */
const BOOKING_CTA = `<div class="not-prose my-10 flex flex-col gap-4 rounded-[1.5rem] bg-gradient-to-br from-brand-600 to-brand-900 p-7 text-white sm:flex-row sm:items-center sm:justify-between"><div><p class="font-display text-xl font-bold !text-white">Talk to a specialist</p><p class="mt-1 !text-brand-100">Book a consultation with our psychiatrists and psychologists.</p></div><a href="/book-appointment/" class="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-accent-600 px-6 font-semibold !text-white !no-underline hover:bg-accent-700">Book Appointment</a></div>`;

export function renderHtml(html: string) {
  return html
    // Where the live page had an embedded contact form: a booking call-to-action.
    .replace(/(<p>%%BOOKING_CTA%%<\/p>\s*)+/g, BOOKING_CTA)
    .replace(/(href|src)="(https?:\/\/(?:www\.)?tulasihealthcare\.com)(\/[^"]*)?"/gi, (_m, attr, _o, rest) => `${attr}="${rest ?? "/"}"`)
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
