// Every WordPress page (113), at exactly the same URL as today:
// /depression/, /deaddiction-centre/alcohol-addiction/, /map-direction/delhi/ ...
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoctorBySlug, getDoctorFacts, getPageByPath, getPages, getSite, renderHtml, type Entry } from "@/lib/content";
import { addHeadingIds, extractFaq, headingsOf, teamGroups, tidy } from "@/lib/html";
import { faqSchema, medicalPageSchema, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { Aside } from "@/components/Aside";
import { PASTELS, portraitOf } from "@/components/team";
import { TeamExplorer, type TeamGroup } from "@/components/team/TeamExplorer";
import { ButtonLink, Icon, JsonLd, Reveal } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/layout/TrackedLink";

// Routes with their own templates elsewhere.
const OWN_ROUTE = new Set(["/", "/blog/"]);
export const dynamicParams = false;
// The live theme shows the page title and the content H1; when they differ, both stay visible.
const differs = (a: string, b: string) => a.replace(/\W+/g, "").toLowerCase() !== b.replace(/\W+/g, "").toLowerCase();


export function generateStaticParams() {
  return getPages()
    .filter((p) => !OWN_ROUTE.has(p.path))
    .map((p) => ({ path: p.path.split("/").filter(Boolean).map(decodeURIComponent) }));
}

async function pageFor(params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const p = `/${path.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/")}/`;
  return getPageByPath(p) ?? getPageByPath(`/${path.join("/")}/`);
}

export async function generateMetadata({ params }: PageProps<"/[...path]">): Promise<Metadata> {
  const page = await pageFor(params);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: page.path });
}

function crumbsFor(page: Entry) {
  const parent = page.parent ? getPages().find((p) => p.id === page.parent) : undefined;
  return [{ name: "Home", path: "/" }, ...(parent ? [{ name: parent.title, path: parent.path }] : []), { name: page.title, path: page.path }];
}

const schemaKind = (t: string) => (t === "condition" ? "condition" : /service|addiction/.test(t) ? "therapy" : "page");

export default async function WpPage({ params }: PageProps<"/[...path]">) {
  const page = await pageFor(params);
  if (!page) notFound();
  if (page.path === "/our-team/") return <TeamPage page={page} />;
  if (page.path === "/contact-us/") return <ContactPage page={page} />;

  const html = addHeadingIds(renderHtml(tidy(page.contentHtml)));
  const toc = headingsOf(html);
  const faq = extractFaq(page.contentHtml);
  const isMedical = /condition|service|addiction|local-landing/.test(page.pageType);

  return (
    <>
      <PageHero title={page.h1} kicker={differs(page.title, page.h1) ? page.title : null} crumbs={crumbsFor(page)} />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-20">
        <article className="prose-tulasi min-w-0 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        <Aside path={page.path} toc={toc} />
      </div>
      {isMedical && <JsonLd data={medicalPageSchema(page, schemaKind(page.pageType))} />}
      {faq.length >= 2 && <JsonLd data={faqSchema(faq)} />}
    </>
  );
}

// Expertise filters, derived only from each doctor's published designation and "Subject Expert" list.
const TAGS: [string, RegExp][] = [
  ["Addiction", /addict|substance|alcohol|drug|de-?addiction/i],
  ["Anxiety", /anxiety|panic|phobia/i],
  ["Depression", /depress|mood/i],
  ["OCD", /ocd|obsess/i],
  ["Bipolar", /bipolar/i],
  ["Schizophrenia", /schizo|psychos/i],
  ["Child & teen", /child|adolesc|teen|autism|adhd/i],
  ["Personality", /personality/i],
  ["Relationships", /marital|marriage|couple|family|relationship/i],
  ["Dementia & elderly", /dementia|geriatric|elder/i],
  ["Stress & trauma", /stress|trauma|ptsd/i],
  ["Rehabilitation", /rehabilitat/i],
];

/** /our-team/: the same groups, names and designations as the live page, as an interactive explorer. */
function TeamPage({ page }: { page: Entry }) {
  const { intro, groups } = teamGroups(page.contentHtml);
  const anchor = (h: string) => `team-${h.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  let n = 0;
  const explorerGroups: TeamGroup[] = groups.map((g) => ({
    heading: g.heading,
    anchor: anchor(g.heading),
    people: g.people.map((person) => {
      const d = person.slug ? getDoctorBySlug(person.slug) : undefined;
      const facts = person.slug ? getDoctorFacts(person.slug) : null;
      const portrait = d ? portraitOf(d) : null;
      const text = [person.designation, ...(facts?.expertise ?? [])].join(" ");
      return {
        slug: d ? d.slug : null,
        name: person.name,
        designation: person.designation || d?.designation || "",
        src: portrait?.src ?? person.photo,
        alt: person.alt,
        cutout: !!portrait?.cutout,
        bg: PASTELS[n++ % PASTELS.length],
        tags: TAGS.filter(([, re]) => re.test(text)).map(([t]) => t),
        experience: facts?.experience ?? null,
      };
    }),
  }));
  const tags = TAGS.map(([tag]) => ({ tag, count: explorerGroups.reduce((c, g) => c + g.people.filter((p) => p.tags.includes(tag)).length, 0) })).filter((t) => t.count > 1);
  return (
    <>
      <PageHero title={page.h1} crumbs={crumbsFor(page)} lead={intro.join(" ")}>
        <nav aria-label="Team groups" className="mt-8 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.heading} href={`#${anchor(g.heading)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white hover:text-brand-900">
              {g.heading} <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{g.people.length}</span>
            </a>
          ))}
        </nav>
      </PageHero>
      <div className="container-page pb-20">
        <TeamExplorer groups={explorerGroups} tags={tags} />
        <div className="mt-20 flex flex-col items-start justify-between gap-5 rounded-[var(--radius-blob)] bg-sand p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="font-display text-2xl font-bold text-ink">Not sure whom to see?</p>
            <p className="mt-1 text-ink-soft">Tell us what’s going on and we’ll match you with the right specialist.</p>
          </div>
          <ButtonLink href="/book-appointment/" variant="accent"><Icon name="calendar" /> Book Appointment</ButtonLink>
        </div>
      </div>
    </>
  );
}

/** /contact-us/: the published contact details, a map of the published address, and booking. */
function ContactPage({ page }: { page: Entry }) {
  const site = getSite();
  const mapQuery = encodeURIComponent(`Tulasi Healthcare, ${site.contact.address}`);
  const cards = [
    { icon: "phone" as const, label: "Call us", value: site.contact.phoneDisplay, href: site.contact.phoneHref },
    { icon: "mail" as const, label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: "pin" as const, label: "Visit", value: site.contact.address, href: `https://www.google.com/maps/search/?api=1&query=${mapQuery}` },
  ];
  return (
    <>
      <PageHero title={page.h1} crumbs={crumbsFor(page)} lead="Get In Touch With Us" />
      <div className="container-page py-14 lg:py-20">
        <ul className="grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal as="li" key={c.label} delay={i * 100}>
              {c.icon === "phone" ? (
                <TrackedLink event="call_click" eventLocation="contact" href={c.href} className="group flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name={c.icon} />
                </span>
                <span className="mt-5 text-sm font-semibold uppercase tracking-wider text-ink-soft">{c.label}</span>
                <span className="mt-1 font-display text-lg font-bold text-ink">{c.value}</span>
              </TrackedLink>
              ) : (
                <a href={c.href} className="group flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]" {...(c.icon === "pin" ? { target: "_blank", rel: "noopener" } : {})}>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name={c.icon} />
                </span>
                <span className="mt-5 text-sm font-semibold uppercase tracking-wider text-ink-soft">{c.label}</span>
                <span className="mt-1 font-display text-lg font-bold text-ink">{c.value}</span>
              </a>
              )}
            </Reveal>
          ))}
        </ul>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
            <iframe title="Map: Tulasi Healthcare, Gurugram" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="h-[380px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white">
            <div>
              <p className="font-display text-2xl font-bold">Book an appointment</p>
              <p className="mt-2 text-brand-100">Choose a specialist, date and time in a few steps. We’ll confirm your appointment.</p>
            </div>
            <div className="mt-8 grid gap-3">
              <Link href="/book-appointment/" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold hover:bg-accent-700"><Icon name="calendar" /> Book Appointment</Link>
              <Link href="/map-direction/" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold hover:bg-white/10"><Icon name="pin" /> Map &amp; Direction</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
