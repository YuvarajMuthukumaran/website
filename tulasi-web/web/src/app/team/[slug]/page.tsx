// /team/<slug>/: each doctor's live profile, with Physician/Person schema
// and a booking shortcut that pre-selects the doctor.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArchiveSeo, getDoctorBySlug, getDoctors, getSite, renderHtml } from "@/lib/content";
import { tidy } from "@/lib/html";
import { breadcrumbSchema, doctorSchema, metadataFromArchive } from "@/lib/seo";
import { Breadcrumbs, ButtonLink, Icon, JsonLd, Reveal } from "@/components/ui/primitives";
import { PortraitCard, PASTELS } from "@/components/team";
import { TrackedLink } from "@/components/layout/TrackedLink";

export const dynamicParams = false;
export const generateStaticParams = () => getDoctors().map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: PageProps<"/team/[slug]">): Promise<Metadata> {
  const d = getDoctorBySlug((await params).slug);
  if (!d) return {};
  const path = `/team/${d.slug}/`;
  return metadataFromArchive(getArchiveSeo(path) ?? { title: d.seo.title, description: d.seo.metaDescription, canonical: d.seo.canonical, robots: null, ogImage: d.photo }, { title: d.name, path });
}

export default async function DoctorPage({ params }: PageProps<"/team/[slug]">) {
  const d = getDoctorBySlug((await params).slug);
  if (!d) notFound();
  const all = getDoctors();
  const index = all.findIndex((x) => x.slug === d.slug);
  const others = all.filter((x) => x.slug !== d.slug && x.role === d.role).slice(0, 10);
  const site = getSite();
  const crumbs = [{ name: "Home", path: "/" }, { name: "Our Team", path: "/our-team/" }, { name: d.name, path: `/team/${d.slug}/` }];
  const firstName = d.honorific === "Dr." ? d.name.replace(/\s*\(.*?\)/, "") : d.name.split(" ").slice(0, 2).join(" ");
  // Quick facts: only what the published bio itself states.
  const facts = [
    d.role === "psychiatrist" ? "Psychiatrist" : d.role === "psychologist" ? "Psychologist" : null,
    d.rciLicensed ? "RCI licensed" : null,
    d.experienceYearsMentioned ? `${d.experienceYearsMentioned}+ years of experience` : null,
    ...d.qualificationsMentioned.filter((q) => q !== "RCI").slice(0, 3),
  ].filter(Boolean) as string[];

  return (
    <>
      <section className="relative overflow-clip" style={{ background: `linear-gradient(180deg, ${PASTELS[index % PASTELS.length]}66, #ffffff 85%)` }}>
        <div className="container-page grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:py-16">
          <Reveal variant="scale" className="mx-auto w-full max-w-[340px] lg:max-w-none">
            <PortraitCard d={d} index={index} size="lg" overlay={false} priority />
          </Reveal>
          <div>
            <Breadcrumbs items={crumbs} />
            <p className="eyebrow mt-6">{d.role === "psychiatrist" ? "Psychiatrist" : d.role === "psychologist" ? "Psychologist" : "Mental health professional"}</p>
            <h1 className="mt-2 text-[length:var(--text-h1)] font-extrabold leading-[1.08] text-ink">{d.name}</h1>
            <p className="mt-3 text-[length:var(--text-lead)] text-ink-soft">{d.designation}</p>
            {facts.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Quick facts">
                {facts.map((f) => (
                  <li key={f} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-brand-800 shadow-[var(--shadow-soft)] ring-1 ring-line">
                    <Icon name="check" className="size-4 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/book-appointment/?doctor=${d.slug}&from=profile`} variant="accent" size="lg">
                <Icon name="calendar" /> Book with {firstName}
              </ButtonLink>
              <TrackedLink event="call_click" eventLocation="profile" href={site.contact.phoneHref} className="inline-flex min-h-14 items-center gap-2 rounded-full border border-line bg-white px-6 font-semibold text-ink transition hover:border-brand-300">
                <Icon name="phone" /> {site.contact.phoneDisplay}
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-16">
        <article className="prose-tulasi min-w-0 max-w-none">
          <h2>About {d.name}</h2>
          <div dangerouslySetInnerHTML={{ __html: renderHtml(tidy(d.bioHtml)) }} />
        </article>
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Book a consultation">
          <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-[var(--shadow-lift)]">
            <p className="font-display text-lg font-bold">Consult {firstName}</p>
            <p className="mt-1 text-sm text-brand-100">Choose a date and time online in about a minute.</p>
            <a href={`/book-appointment/?doctor=${d.slug}&from=profile`} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold hover:bg-accent-700">
              <Icon name="calendar" /> Book Appointment
            </a>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="bg-sand py-16" aria-labelledby="others">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="others" className="font-display text-[length:var(--text-h2)] font-bold text-ink">{d.role === "psychiatrist" ? "Other psychiatrists" : "Other specialists"}</h2>
              <ButtonLink href="/our-team/" variant="ghost">Meet the whole team <Icon name="arrow" className="size-4" /></ButtonLink>
            </div>
            <ul className="mt-8 flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
              {others.map((o) => (
                <li key={o.slug} className="snap-start">
                  <PortraitCard d={o} index={all.indexOf(o)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <JsonLd data={[doctorSchema(d), breadcrumbSchema(crumbs)]} />
    </>
  );
}
