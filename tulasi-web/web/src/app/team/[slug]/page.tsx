// /team/<slug>/: each doctor's live profile, with Physician/Person schema
// and a booking shortcut that pre-selects the doctor. Facts (experience,
// expertise, fee, OPD) are those published on the site's service pages; fee
// and timings only appear when every page agrees (see getDoctorFacts).
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArchiveSeo, getDoctorBySlug, getDoctorFacts, getDoctors, getSite, renderHtml } from "@/lib/content";
import { tidy } from "@/lib/html";
import { breadcrumbSchema, descriptionFrom, doctorSchema, metadataFromArchive } from "@/lib/seo";
import { Arrow, Breadcrumbs, ButtonLink, Icon, JsonLd, Reveal, Tag, btnClass } from "@/components/ui/primitives";
import { PortraitCard, pastelFor, portraitOf } from "@/components/team";
import { TrackedLink } from "@/components/layout/TrackedLink";

export const dynamicParams = false;
export const generateStaticParams = () => getDoctors().map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: PageProps<"/team/[slug]">): Promise<Metadata> {
  const d = getDoctorBySlug((await params).slug);
  if (!d) return {};
  const path = `/team/${d.slug}/`;
  const seo = getArchiveSeo(path) ?? { title: d.seo.title, description: d.seo.metaDescription, canonical: d.seo.canonical, robots: null, ogImage: d.photo };
  return metadataFromArchive({ ...seo, description: seo.description ?? descriptionFrom(`${d.name}, ${d.designation ?? ""}. ${d.excerpt ?? d.bioHtml}`) ?? null }, { title: d.name, path });
}

export default async function DoctorPage({ params }: PageProps<"/team/[slug]">) {
  const d = getDoctorBySlug((await params).slug);
  if (!d) notFound();
  const all = getDoctors();
  const others = all.filter((x) => x.slug !== d.slug && x.role === d.role).slice(0, 10);
  const site = getSite();
  const rawFacts = getDoctorFacts(d.slug);
  // The designation can already state the experience; two different figures would contradict each other.
  const facts = rawFacts && /years?\s+of\s+experience/i.test(d.designation ?? "") ? { ...rawFacts, experience: null } : rawFacts;
  const portrait = portraitOf(d);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Our Team", path: "/our-team/" }, { name: d.name, path: `/team/${d.slug}/` }];
  const firstName = d.honorific === "Dr." ? d.name.replace(/\s*\(.*?\)/, "") : d.name.split(" ").slice(0, 2).join(" ");
  const roleLabel = d.role === "psychiatrist" ? "Psychiatrist" : d.role === "psychologist" ? "Psychologist" : "Mental health professional";
  const badges = [d.rciLicensed ? "RCI licensed" : null, ...d.qualificationsMentioned.filter((q) => q !== "RCI").slice(0, 3)].filter(Boolean) as string[];
  const initials = d.name.replace(/^(Dr|Ms|Mr|Mrs)\.\s*/, "").replace(/\(.*?\)\s*/, "").split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-mist to-white">
        <div className="container-page grid items-center gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-14 lg:py-14">
          <Reveal variant="scale" className="mx-auto w-full max-w-[200px] sm:max-w-[280px] lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_0_0_1px_rgb(23_34_44/0.05)]" style={{ backgroundColor: pastelFor(d.slug) }}>
              {portrait ? (
                <Image src={portrait.src} alt={`${d.name}, ${d.designation ?? ""}`} fill priority sizes="(min-width:1024px) 340px, 300px" className={portrait.cutout ? "object-cover object-bottom" : "object-cover object-[50%_25%]"} />
              ) : (
                <span className="absolute inset-0 grid place-items-center font-display text-7xl font-semibold text-sage-300">{initials}</span>
              )}
            </div>
          </Reveal>
          <div className="min-w-0">
            <Breadcrumbs items={crumbs} />
            <p className="eyebrow mt-6">{roleLabel}</p>
            <h1 className="mt-3 text-[length:var(--text-h1)] leading-[1.1] font-semibold tracking-[-0.025em] text-ink">{d.name}</h1>
            <p className="mt-3 max-w-[60ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">{d.designation}</p>
            {(badges.length > 0 || facts?.experience) && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Credentials">
                {facts?.experience && <li><Tag><Icon name="clock" className="size-3.5" /> {facts.experience} experience</Tag></li>}
                {badges.map((b) => <li key={b}><Tag><Icon name="check" className="size-3.5" /> {b}</Tag></li>)}
              </ul>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={`/book-appointment/?doctor=${d.slug}&from=profile`} size="lg">
                Book with {firstName} <Arrow />
              </ButtonLink>
              <TrackedLink event="call_click" eventLocation="profile" href={site.contact.phoneHref} className={btnClass("line", "lg")}>
                <Icon name="phone" className="size-4 text-sage-600" /> {site.contact.phoneDisplay}
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:py-16">
        <article className="prose-tulasi min-w-0 max-w-none">
          <h2>About {d.name}</h2>
          <div dangerouslySetInnerHTML={{ __html: renderHtml(tidy(d.bioHtml)) }} />
        </article>
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Consultation details">
          {facts && facts.expertise.length > 0 && (
            <div className="rounded-[var(--radius-card)] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Areas of expertise</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {facts.expertise.map((e) => <li key={e}><Tag>{e}</Tag></li>)}
              </ul>
            </div>
          )}
          <div className="rounded-[var(--radius-card)] bg-sage-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
            <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage-700 uppercase">Consultation</p>
            {facts && (facts.opd || facts.onlineOpd || facts.fee) ? (
              <dl className="mt-4 space-y-4 text-sm">
                {facts.opd && (
                  <div>
                    <dt className="text-ink-soft">OPD</dt>
                    {facts.opd.map((o) => <dd key={o} className="mt-1 font-semibold text-ink">{o}</dd>)}
                  </div>
                )}
                {facts.onlineOpd && (
                  <div>
                    <dt className="text-ink-soft">Online OPD</dt>
                    <dd className="mt-1 font-semibold text-ink">{facts.onlineOpd}</dd>
                  </div>
                )}
                {facts.fee && (
                  <div>
                    <dt className="text-ink-soft">Consultation fee</dt>
                    <dd className="mt-1 font-semibold text-ink">{facts.fee}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">Please call us to confirm current timings and fees.</p>
            )}
            {facts?.timingsUnconfirmed && (facts.opd || facts.onlineOpd || facts.fee) && <p className="mt-4 text-xs text-ink-soft">Some details vary across our pages; please call to confirm.</p>}
            <a href={`/book-appointment/?doctor=${d.slug}&from=profile`} className="group/btn mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700">
              Book appointment <Arrow />
            </a>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="overflow-clip bg-mist py-14 lg:py-16" aria-labelledby="others">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="others" className="font-display text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">{d.role === "psychiatrist" ? "Other psychiatrists" : "Other specialists"}</h2>
              <ButtonLink href="/our-team/" variant="line">Meet the whole team <Arrow /></ButtonLink>
            </div>
            <ul className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
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
