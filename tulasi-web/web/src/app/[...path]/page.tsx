// Every WordPress page (113), at exactly the same URL as today:
// /depression/, /deaddiction-centre/alcohol-addiction/, /map-direction/delhi/ ...
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDoctorBySlug, getDoctorFacts, getPageByPath, getPages, getSite, renderHtml, type Entry } from "@/lib/content";
import { addHeadingIds, extractFaq, headingsOf, teamGroups, tidy } from "@/lib/html";
import { faqSchema, medicalPageSchema, metadataFromSeo, descriptionFrom } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { Aside } from "@/components/Aside";
import { PASTELS, portraitOf } from "@/components/team";
import { TeamExplorer, type TeamGroup } from "@/components/team/TeamExplorer";
import { Arrow, ButtonLink, Icon, JsonLd, Reveal } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { TeamFilter } from "@/components/team/TeamFilter";
import { structureTeamPage, teamLocationPaths } from "@/lib/team-location";
import { credentialsOf, TAG_LIST } from "@/lib/team-tags";
import { whatsappLink } from "@/lib/care";
import Link from "next/link";
import clsx from "clsx";

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
  return metadataFromSeo(page.seo, { title: page.title, path: page.path, description: descriptionFrom(page.excerpt ?? page.contentHtml) });
}

function crumbsFor(page: Entry) {
  const parent = page.parent ? getPages().find((p) => p.id === page.parent) : undefined;
  return [{ name: "Home", path: "/" }, ...(parent ? [{ name: parent.title, path: parent.path }] : []), { name: page.title, path: page.path }];
}

// City pages kept for places in the wider NCR: say plainly where the hospital is.
const NEARBY_CITY = /-in-(noida|faridabad|rohtak|meerut|panipat)\/$/;
const cityName = (p: string) => (p.match(NEARBY_CITY)?.[1] ?? "").replace(/^./, (c) => c.toUpperCase());

const schemaKind = (t: string) => (t === "condition" ? "condition" : /service|addiction/.test(t) ? "therapy" : "page");

export default async function WpPage({ params }: PageProps<"/[...path]">) {
  const page = await pageFor(params);
  if (!page) notFound();
  if (page.path === "/our-team/") return <TeamPage page={page} />;
  if (page.path === "/contact-us/") return <ContactPage page={page} />;
  if (teamLocationPaths().has(page.path)) return <TeamLocationPage page={page} />;

  const html = addHeadingIds(renderHtml(tidy(page.contentHtml)));
  const toc = headingsOf(html);
  const faq = extractFaq(page.contentHtml);
  const isMedical = /condition|service|addiction|local-landing/.test(page.pageType);

  return (
    <>
      <PageHero title={page.h1} kicker={differs(page.title, page.h1) ? page.title : null} crumbs={crumbsFor(page)} />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:py-16">
        <div className="min-w-0">
          {NEARBY_CITY.test(page.path) && (
            <p className="mb-8 flex items-start gap-3 rounded-[var(--radius-card)] bg-sage-50 p-4 text-[0.9375rem] leading-relaxed text-ink shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-sage-600" />
              <span>
                <strong className="font-semibold">Where to find us.</strong> Our hospital and rehabilitation centre is at {getSite().contact.address}, with a centre in South Delhi. We welcome patients travelling from {cityName(page.path)}.{" "}
                <Link href="/map-direction/" className="font-semibold text-brand-700 underline underline-offset-2">Map &amp; directions</Link>
              </span>
            </p>
          )}
          <article className="prose-tulasi max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <Aside path={page.path} toc={toc} />
      </div>
      {isMedical && <JsonLd data={medicalPageSchema(page, schemaKind(page.pageType))} />}
      {faq.length >= 2 && <JsonLd data={faqSchema(faq)} />}
    </>
  );
}

/**
 * The "Our Team" location pages (Psychiatrist in Gurgaon, Best Psychologist in Delhi ...):
 * the same content in the same order, laid out as an intro, a filterable grid of
 * doctor cards, then the rest of the page as feature grids, accordions and cards.
 */
function TeamLocationPage({ page }: { page: Entry }) {
  const s = structureTeamPage(renderHtml(tidy(page.contentHtml)));
  const faq = extractFaq(page.contentHtml);
  const faces = [...new Set(s.cards.map((c) => c.cutout).filter((c): c is string => !!c))];
  const kinds = (["Psychiatrist", "Psychologist"] as const).map((kind) => ({ kind, count: s.cards.filter((c) => c.kind === kind).length })).filter((k) => k.count);
  const tags = TAG_LIST.map((tag) => ({ tag, count: s.cards.filter((c) => c.tags.includes(tag)).length })).filter((t) => t.count > 1 && t.count < s.cards.length);
  const people = kinds.length === 1 ? `${kinds[0].kind.toLowerCase()}s` : "specialists";
  return (
    <>
      <PageHero
        title={page.h1}
        kicker={differs(page.title, page.h1) ? page.title : null}
        crumbs={crumbsFor(page)}
        lead={page.seo.description}
      >
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {s.grid && (
            <ButtonLink href="#team" size="lg">
              Meet the {people} <Arrow />
            </ButtonLink>
          )}
          <ButtonLink href={`/book-appointment/?from=${encodeURIComponent(page.path)}`} variant="line" size="lg">
            <Icon name="calendar" /> Book appointment
          </ButtonLink>
        </div>
        {s.cards.length > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3" aria-hidden="true">
              {faces.slice(0, 5).map((f) => (
                <span key={f} className="relative size-11 overflow-hidden rounded-full bg-sage-100 ring-2 ring-white">
                  <Image src={f} alt="" fill sizes="44px" className="object-cover object-[50%_10%]" />
                </span>
              ))}
            </div>
            <p className="text-sm leading-snug text-ink-soft">
              <b className="block font-display text-base font-semibold text-ink">{s.cards.length} {people}</b>
              {/NABH/.test(page.contentHtml) ? "at an NABH-accredited hospital" : "at Tulasi Healthcare"}
            </p>
          </div>
        )}
      </PageHero>

      {(s.intro || s.banner) && (
        <section className={clsx("container-page grid items-center gap-10 py-14 lg:gap-14 lg:py-20", s.banner && "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]")}>
          <div className="prose-tulasi lt-prose min-w-0" dangerouslySetInnerHTML={{ __html: s.intro }} />
          {s.banner && <div className="lt-banner" dangerouslySetInnerHTML={{ __html: s.banner }} />}
        </section>
      )}

      {s.grid && (
        <section id="team" className="relative scroll-mt-20 overflow-clip bg-mist py-14 lg:py-20">
          <div className="container-page relative">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="eyebrow">Our {people}</p>
                {s.teamHeading && <div className="lt-teamhead mt-4" dangerouslySetInnerHTML={{ __html: s.teamHeading }} />}
              </div>
              <p className="max-w-sm text-ink-soft lg:text-right">Open a card for the full profile, or call to book a consultation.</p>
            </div>
            <TeamFilter gridId="team-grid" kinds={kinds} tags={tags} total={s.cards.length} />
            <div id="team-grid" className="mt-8" dangerouslySetInnerHTML={{ __html: s.grid }} />
          </div>
        </section>
      )}

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:py-20">
        <article className="prose-tulasi lt-prose min-w-0 max-w-none" dangerouslySetInnerHTML={{ __html: s.rest }} />
        <Aside path={page.path} toc={s.toc} />
      </div>
      {/condition|service|addiction|local-landing/.test(page.pageType) && <JsonLd data={medicalPageSchema(page, schemaKind(page.pageType))} />}
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
        experience: /years?\s+of\s+experience/i.test(person.designation || d?.designation || "") ? null : facts?.experience ?? null,
        credentials: credentialsOf(d),
      };
    }),
  }));
  const tags = TAGS.map(([tag]) => ({ tag, count: explorerGroups.reduce((c, g) => c + g.people.filter((p) => p.tags.includes(tag)).length, 0) })).filter((t) => t.count > 1);
  return (
    <>
      <PageHero title={page.h1} crumbs={crumbsFor(page)} lead={intro.join(" ")}>
        <p className="mt-6 text-[0.9375rem] text-ink-soft">Not sure who to see? <Link href="/find-a-specialist/" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900">Answer three quick questions</Link> and we’ll suggest the right specialist.</p>
        <nav aria-label="Team groups" className="mt-6 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.heading} href={`#${anchor(g.heading)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-brand-700 hover:ring-brand-300">
              {g.heading} <span className="rounded-full bg-sage-50 px-2 py-0.5 text-xs text-sage-700">{g.people.length}</span>
            </a>
          ))}
        </nav>
      </PageHero>
      <div className="container-page pb-20">
        <TeamExplorer groups={explorerGroups} tags={tags} />
        <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-[var(--radius-card)] bg-sage-50 p-7 shadow-[inset_0_0_0_1px_var(--color-sage-100)] sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="font-display text-xl font-semibold text-ink">Not sure whom to see?</p>
            <p className="mt-1 text-ink-soft">Tell us what’s going on and we’ll match you with the right specialist.</p>
          </div>
          <ButtonLink href="/book-appointment/"><Icon name="calendar" /> Book appointment</ButtonLink>
        </div>
      </div>
    </>
  );
}

/** /contact-us/: the published contact details, a map of the published address, and booking. */
function ContactPage({ page }: { page: Entry }) {
  const site = getSite();
  const mapQuery = encodeURIComponent(`Tulasi Healthcare, ${site.contact.address}`);
  const card = "group flex h-full flex-col justify-between gap-8 rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--color-brand-200),var(--shadow-soft)]";
  return (
    <>
      <PageHero title={page.h1} crumbs={crumbsFor(page)} lead="Get In Touch With Us" />
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <TrackedLink event="call_click" eventLocation="contact" href={site.contact.phoneHref} className={card}>
              <span className="icon-tile size-12"><Icon name="phone" /></span>
              <span>
                <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Call us</span>
                <span className="mt-2 block font-display text-2xl font-semibold tracking-[-0.02em] text-ink">{site.contact.phoneDisplay}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Tap to call <Arrow /></span>
              </span>
            </TrackedLink>
          </Reveal>
          <Reveal delay={40}>
            <TrackedLink event="whatsapp_click" eventLocation="contact" href={whatsappLink(site.contact.phoneHref)} target="_blank" rel="noopener" className={card}>
              <span className="icon-tile size-12"><Icon name="chat" /></span>
              <span>
                <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">WhatsApp</span>
                <span className="mt-2 block font-display text-lg font-semibold tracking-[-0.01em] text-ink">Message us</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Open WhatsApp <Arrow /></span>
              </span>
            </TrackedLink>
          </Reveal>
          <Reveal delay={80}>
            <a href={`mailto:${site.contact.email}`} className={card}>
              <span className="icon-tile size-12"><Icon name="mail" /></span>
              <span>
                <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Email</span>
                <span className="mt-2 block font-display text-lg font-semibold tracking-[-0.01em] break-all text-ink">{site.contact.email}</span>
              </span>
            </a>
          </Reveal>
          <Reveal delay={140}>
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener" className={card}>
              <span className="icon-tile size-12"><Icon name="pin" /></span>
              <span>
                <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Visit</span>
                <address className="mt-2 block font-display text-base leading-snug font-semibold text-ink not-italic">{site.contact.address}</address>
              </span>
            </a>
          </Reveal>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="overflow-hidden rounded-[var(--radius-card)] shadow-[0_0_0_1px_var(--color-line)]">
            <iframe title="Map: Tulasi Healthcare, Gurugram" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="h-[360px] w-full sm:h-[420px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Reveal>
          <Reveal delay={100} className="flex flex-col justify-between gap-8 rounded-[var(--radius-card)] bg-sage-50 p-7 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
            <div>
              <p className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-ink">Book an appointment</p>
              <p className="mt-3 text-ink-soft">Choose a specialist, date and time in a few steps. We’ll confirm your appointment.</p>
            </div>
            <div className="grid gap-3">
              <ButtonLink href="/book-appointment/">Book appointment <Arrow /></ButtonLink>
              <ButtonLink href="/map-direction/" variant="line"><Icon name="pin" className="size-4" /> Map &amp; directions</ButtonLink>
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-alert-50 p-3 text-sm text-ink"><Icon name="heart" className="mt-0.5 size-4 shrink-0 text-alert-600" /><span><b className="font-semibold">In crisis?</b> Call <a href="tel:14416" className="font-semibold text-alert-700 underline underline-offset-2">Tele-MANAS 14416</a>, free and 24×7.</span></p>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
