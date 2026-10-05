// /team/<slug>/: each doctor's live profile, with Physician/Person schema
// and a booking shortcut that pre-selects the doctor. Facts (experience,
// expertise, fee, OPD) are those published on the site's service pages; fee
// and timings only appear when every page agrees (see getDoctorFacts).
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArchiveSeo, getDoctorBySlug, getDoctorFacts, getDoctors, getSite, renderHtml } from "@/lib/content";
import { tidy } from "@/lib/html";
import { breadcrumbSchema, doctorSchema, metadataFromArchive } from "@/lib/seo";
import { Arrow, Breadcrumbs, ButtonLink, Icon, JsonLd, Kinetic, Reveal, Tag, btnClass } from "@/components/ui/primitives";
import { PortraitCard, portraitOf } from "@/components/team";
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
  const others = all.filter((x) => x.slug !== d.slug && x.role === d.role).slice(0, 10);
  const site = getSite();
  const facts = getDoctorFacts(d.slug);
  const portrait = portraitOf(d);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Our Team", path: "/our-team/" }, { name: d.name, path: `/team/${d.slug}/` }];
  const firstName = d.honorific === "Dr." ? d.name.replace(/\s*\(.*?\)/, "") : d.name.split(" ").slice(0, 2).join(" ");
  const roleLabel = d.role === "psychiatrist" ? "Psychiatrist" : d.role === "psychologist" ? "Psychologist" : "Mental health professional";
  const badges = [d.rciLicensed ? "RCI licensed" : null, ...d.qualificationsMentioned.filter((q) => q !== "RCI").slice(0, 3)].filter(Boolean) as string[];
  const initials = d.name.replace(/^(Dr|Ms|Mr|Mrs)\.\s*/, "").replace(/\(.*?\)\s*/, "").split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <>
      <section className="on-dark stage relative overflow-clip bg-hero text-white">
        <div className="beam" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[20%] left-[8%] hidden size-[520px] rounded-full bg-brand-600/40 blur-[120px] md:block" />
        <div className="container-page relative grid items-end gap-12 pt-32 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 lg:pt-40">
          {/* portrait under a rim light */}
          <Reveal variant="scale" className="relative mx-auto w-full max-w-[360px] lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[200px] rounded-b-none bg-[radial-gradient(80%_60%_at_50%_25%,#355dd6,#0b1a6e_60%,#09226b)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_0_0_1px_rgb(255_255_255/0.12)]">
              <div aria-hidden="true" className="absolute inset-x-[15%] top-[6%] h-[45%] rounded-full bg-brand-200/30 blur-3xl" />
              {portrait ? (
                <Image src={portrait.src} alt={`${d.name}, ${d.designation ?? ""}`} fill priority sizes="(min-width:1024px) 420px, 360px" className={portrait.cutout ? "object-cover object-bottom" : "object-cover object-[50%_25%]"} />
              ) : (
                <span className="absolute inset-0 grid place-items-center font-display text-7xl font-extrabold text-white/80">{initials}</span>
              )}
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-midnight/70 to-transparent" />
            </div>
          </Reveal>
          <div className="pb-14 lg:pb-20">
            <Breadcrumbs items={crumbs} dark />
            <p className="eyebrow mt-8 !text-brand-200">{roleLabel}</p>
            <h1 className="mt-4 text-[length:var(--text-h1)] leading-[1] font-extrabold tracking-[-0.045em]">
              <Kinetic text={d.name} tone="dark" />
            </h1>
            <p className="mt-4 text-[length:var(--text-lead)] text-brand-100/80">{d.designation}</p>
            {(badges.length > 0 || facts?.experience) && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Credentials">
                {facts?.experience && <li><Tag tone="dark"><Icon name="clock" className="size-3.5" /> {facts.experience} experience</Tag></li>}
                {badges.map((b) => <li key={b}><Tag tone="dark"><Icon name="check" className="size-3.5" /> {b}</Tag></li>)}
              </ul>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={`/book-appointment/?doctor=${d.slug}&from=profile`} variant="accent" size="lg">
                Book with {firstName} <Arrow />
              </ButtonLink>
              <TrackedLink event="call_click" eventLocation="profile" href={site.contact.phoneHref} className={btnClass("glass", "lg")}>
                <Icon name="phone" className="size-4" /> {site.contact.phoneDisplay}
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20 lg:py-28">
        <article className="prose-tulasi min-w-0 max-w-none">
          <h2>About {d.name}</h2>
          <div dangerouslySetInnerHTML={{ __html: renderHtml(tidy(d.bioHtml)) }} />
        </article>
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Consultation details">
          {facts && facts.expertise.length > 0 && (
            <div className="rounded-[var(--radius-blob)] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">Areas of expertise</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {facts.expertise.map((e) => <li key={e}><Tag>{e}</Tag></li>)}
              </ul>
            </div>
          )}
          <div className="on-dark stage relative overflow-clip rounded-[var(--radius-blob)] bg-hero p-6 text-white shadow-[var(--shadow-glow)]">
            <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-brand-200 uppercase">Consultation</p>
            {facts && (facts.opd || facts.onlineOpd || facts.fee) ? (
              <dl className="mt-4 space-y-4 text-sm">
                {facts.opd && (
                  <div>
                    <dt className="text-brand-100/70">OPD</dt>
                    {facts.opd.map((o) => <dd key={o} className="mt-1 font-semibold">{o}</dd>)}
                  </div>
                )}
                {facts.onlineOpd && (
                  <div>
                    <dt className="text-brand-100/70">Online OPD</dt>
                    <dd className="mt-1 font-semibold">{facts.onlineOpd}</dd>
                  </div>
                )}
                {facts.fee && (
                  <div>
                    <dt className="text-brand-100/70">Consultation fee</dt>
                    <dd className="mt-1 font-semibold">{facts.fee}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-brand-100/80">Please call us to confirm current timings and fees.</p>
            )}
            {facts?.timingsUnconfirmed && (facts.opd || facts.onlineOpd || facts.fee) && <p className="mt-4 text-xs text-brand-100/60">Some details vary across our pages; please call to confirm.</p>}
            <a href={`/book-appointment/?doctor=${d.slug}&from=profile`} className="group/btn mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-[#c8121c]">
              Book Appointment <Arrow />
            </a>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="overflow-clip bg-mist py-20" aria-labelledby="others">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="others" className="font-display text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em] text-ink">{d.role === "psychiatrist" ? "Other psychiatrists" : "Other specialists"}</h2>
              <ButtonLink href="/our-team/" variant="line">Meet the whole team <Arrow /></ButtonLink>
            </div>
            <ul className="mt-10 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
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
