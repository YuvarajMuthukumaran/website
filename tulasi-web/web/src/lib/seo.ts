// Metadata + JSON-LD. Titles, descriptions, canonicals, robots and OG tags
// are reused exactly as Yoast publishes them today; nothing is regenerated.
import type { Metadata } from "next";
import { absoluteUrl, getSite, localPath, SITE_URL, type Doctor, type Entry, type Seo } from "./content";

/** Yoast robots object ({index:"index", "max-snippet":"max-snippet:-1"...}) → the exact live string. */
function robotsString(r: Seo["robots"] | string | null | undefined) {
  if (!r) return undefined;
  if (typeof r === "string") return r;
  // Same order Yoast prints in the live <meta name="robots">.
  const order = ["index", "follow", "max-image-preview", "max-snippet", "max-video-preview"];
  const rank = (k: string) => (order.indexOf(k) < 0 ? 99 : order.indexOf(k));
  return Object.entries(r).sort(([a], [b]) => rank(a) - rank(b)).map(([, v]) => v).join(", ");
}

/** Canonicals point at the production domain, whatever host serves the page. */
const canonical = (c: string | null | undefined, fallbackPath: string) => absoluteUrl(localPath(c ?? fallbackPath));

/** First sentences of a text, cut at a word boundary, for a description when none was written. */
export function descriptionFrom(text: string | null | undefined, max = 155) {
  const t = (text ?? "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || undefined;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).replace(/[,;:.\-–—\s]+$/, "") + "…";
}

/** Shown when a page has no social-share image of its own: the hospital building. */
const SHARE_FALLBACK = "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp";

export function metadataFromSeo(seo: Seo, fallback: { title: string; path: string; description?: string | null; image?: string }): Metadata {
  const og = seo.og;
  const title = seo.title ?? fallback.title;
  const own = (og?.image ?? []).map((i) => ({ url: absoluteUrl(localPath(i.url)), width: i.width, height: i.height, type: i.type }));
  // An explicit image wins, then the page's own; a transparent cut-out (as the old home page used) makes a poor preview.
  const images = fallback.image ? [{ url: absoluteUrl(fallback.image) }] : own.length ? own : [{ url: absoluteUrl(SHARE_FALLBACK) }];
  const description = seo.description ?? fallback.description ?? undefined;
  return {
    title: { absolute: title },
    description,
    robots: robotsString(seo.robots),
    alternates: { canonical: canonical(seo.canonical, fallback.path) },
    openGraph: {
      locale: "en_IN",
      siteName: "Tulasi Healthcare",
      type: og?.type === "article" && fallback.path.startsWith("/blog/") && fallback.path !== "/blog/" ? "article" : "website",
      title: og?.title ?? title,
      description: og?.description ?? description,
      url: canonical(og?.url ?? seo.canonical, fallback.path),
      images,
      ...(og?.publishedTime ? { publishedTime: og.publishedTime } : {}),
      ...(og?.modifiedTime ? { modifiedTime: og.modifiedTime } : {}),
    },
    twitter: { card: (seo.twitter?.card as "summary_large_image") ?? "summary_large_image" },
  };
}

/** Archive pages (tags, authors, team) only have the crawled tags. */
export function metadataFromArchive(a: { title: string | null; description: string | null; canonical: string | null; robots: string | null; ogImage?: string | null } | null, fallback: { title: string; path: string }): Metadata {
  return {
    title: { absolute: a?.title ?? fallback.title },
    description: a?.description ?? undefined,
    robots: a?.robots ?? undefined,
    alternates: { canonical: canonical(a?.canonical, fallback.path) },
    openGraph: { title: a?.title ?? fallback.title, description: a?.description ?? undefined, url: canonical(a?.canonical, fallback.path), siteName: "Tulasi Healthcare", type: "website", ...(a?.ogImage ? { images: [absoluteUrl(localPath(a.ogImage))] } : {}) },
  };
}

// ───────────── JSON-LD ─────────────
const ORG_ID = `${SITE_URL}/#organization`;

/** Hospital (a MedicalOrganization and LocalBusiness), built only from published facts. */
export function hospitalSchema() {
  const site = getSite();
  return {
    "@context": "https://schema.org",
    "@type": ["Hospital", "MedicalOrganization"],
    "@id": ORG_ID,
    name: "Tulasi Healthcare",
    url: `${SITE_URL}/`,
    logo: site.logo ? absoluteUrl(site.logo.src) : undefined,
    image: site.logo ? absoluteUrl(site.logo.src) : undefined,
    description: site.footerAbout,
    telephone: site.contact.phoneDisplay.replace(/\s+/g, ""),
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sector 64, Golf Course Extension Road",
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: "122102",
      addressCountry: "IN",
    },
    medicalSpecialty: ["Psychiatric", "Psychiatry"],
    sameAs: site.social,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "Tulasi Healthcare",
    publisher: { "@id": ORG_ID },
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/blog/?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function articleSchema(post: Entry, authorName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(post.path)}#article`,
    headline: post.h1 || post.title,
    description: post.seo.description ?? post.excerpt ?? undefined,
    datePublished: post.date ?? undefined,
    dateModified: post.modified ?? post.date ?? undefined,
    mainEntityOfPage: absoluteUrl(post.path),
    image: post.featuredImage ? absoluteUrl(localPath(post.featuredImage.url)) : undefined,
    author: authorName && authorName !== "admin" ? { "@type": "Person", name: authorName } : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    wordCount: post.wordCount,
    inLanguage: "en-IN",
  };
}

/** MedicalWebPage for condition/treatment pages; `about` names only the page's own subject. */
export function medicalPageSchema(page: Entry, kind: "condition" | "therapy" | "page") {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.seo.title ?? page.title,
    description: page.seo.description ?? undefined,
    lastReviewed: page.modified?.slice(0, 10),
    publisher: { "@id": ORG_ID },
    ...(kind === "condition" ? { about: { "@type": "MedicalCondition", name: page.title } } : {}),
    ...(kind === "therapy" ? { about: { "@type": "MedicalTherapy", name: page.title } } : {}),
  };
}

/** Physician for psychiatrists (medical doctors); Person for psychologists and social workers. */
export function doctorSchema(d: Doctor) {
  const base = {
    "@context": "https://schema.org",
    "@id": `${absoluteUrl(`/team/${d.slug}/`)}#person`,
    name: d.name,
    url: absoluteUrl(`/team/${d.slug}/`),
    image: d.photo ? absoluteUrl(localPath(d.photo)) : undefined,
    jobTitle: d.designation ?? undefined,
  };
  return d.role === "psychiatrist"
    ? { ...base, "@type": "Physician", medicalSpecialty: "Psychiatric", worksFor: { "@id": ORG_ID }, address: hospitalSchema().address }
    : { ...base, "@type": "Person", worksFor: { "@id": ORG_ID } };
}
