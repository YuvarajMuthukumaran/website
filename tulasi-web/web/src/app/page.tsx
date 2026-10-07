// Home page: short, calm and easy to scan. One clear message, two clear actions,
// then a handful of quiet sections. Wording comes from the live homepage
// (content/home.json); only short UI labels are new.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import { getHome, getPageByPath, getSite, polishText } from "@/lib/content";
import { faqSchema, metadataFromSeo } from "@/lib/seo";
import { Arrow, BrandIcon, btnClass, ButtonLink, Icon, JsonLd, Reveal, SectionHeading } from "@/components/ui/primitives";
import { DoctorMarquee } from "@/components/DoctorMarquee";
import { ReviewGrid } from "@/components/ReviewGrid";
import { LeafVine } from "@/components/motion/LeafVine";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { FinderBar } from "@/components/FinderBar";
import { LocationsShowcase } from "@/components/locations/LocationsShowcase";
import { PASTELS } from "@/components/team";
import { CITIES, CLINICS, HOSPITALS, locationSummary } from "@/lib/locations";
import { HomeHeroSlideshow } from "@/components/HomeHeroSlideshow";
import { InstagramVideos } from "@/components/InstagramVideos";
import { CONCERN_ICON, CONCERNS, PATHWAYS, type Pathway } from "@/lib/care";

export function generateMetadata(): Metadata {
  const page = getPageByPath("/")!;
  // The live title and description lead with "Rehab"; the hospital is much more than that.
  const title = "Tulasi Healthcare | Psychiatric Hospital & Mental Health Care in Gurugram, Delhi NCR";
  const description = "NABH-accredited psychiatric hospital in Gurugram and Delhi NCR: psychiatrists, psychologists and de-addiction care for anxiety, depression, addiction and all mental health conditions.";
  return metadataFromSeo({ ...page.seo, title, description, og: page.seo.og ? { ...page.seo.og, title, description } : page.seo.og }, { title, path: "/", image: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp" });
}

const PATHWAY_ICON: Record<Pathway["icon"], string> = {
  stethoscope: "psychiatry",
  talk: "therapy",
  home: "inpatient",
  leaf: "sprout",
  child: "child",
  elder: "memory",
  wave: "waves",
  briefcase: "workplace",
  clipboard: "assessment",
};
const HELP_WITH = ["Anxiety", "Depression", "OCD", "Bipolar disorder", "Schizophrenia & psychosis", "Child & teen mental health", "ADHD", "Autism", "Alcohol addiction", "Drug addiction", "Dementia & memory"];

/** Photo for a condition tile: `public/conditions/<slug>.webp` (see SOURCES.md there). Without a file the tile shows its icon. */
const conditionSlug = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const conditionPhoto = (label: string) => ["webp", "jpg", "jpeg", "png"].map((e) => `/conditions/${conditionSlug(label)}.${e}`).find((p) => existsSync(path.join(process.cwd(), "public", p))) ?? null;

const sectionPad = "py-10 sm:py-12 lg:py-14";

export default function Home() {
  const h = getHome();
  const site = getSite();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };
  const since = h.intro.blocks.flatMap((b) => b.paragraphs).join(" ").match(/inauguration in (\d{4})/)?.[1];
  const experts = h.stats.find((s) => /expert/i.test(s.label))?.display ?? "100+";
  const beds = h.stats.find((s) => /bed/i.test(s.label))?.display ?? "200+";
  const trust: [string, string][] = [
    ...(since ? ([[since, "Caring for patients since"]] as [string, string][]) : []),
    ["NABH", "Accredited hospital"],
    [experts, "Mental health experts"],
    [beds, "Beds"],
  ];

  const faqIntro = "Families and patients often write to us with questions about mental illness, addiction and their treatment. Here are some of the most common ones.";
  const faqItems = h.faq.items.map((f) => ({ q: polishText(f.q), a: polishText(f.a) }));

  const cashless = h.insurance.text.match(/empanelled with (.+?) for cashless/i)?.[1] ?? null;

  const concerns = HELP_WITH.map((l) => CONCERNS.find((c) => c.label === l)).filter((c): c is NonNullable<typeof c> => !!c);
  const services = PATHWAYS.slice(0, 6);
  const photos = Object.fromEntries(concerns.map((c) => [c.label, conditionPhoto(c.label)]));

  return (
    <>
      {/* ═════════════ Hero ═════════════ */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-10">
          <div>
            <p className="eyebrow">Psychiatric hospital &amp; mental health care</p>
            <h1 className="mt-4 max-w-[19ch] text-[length:var(--text-display)] leading-[1.12] font-semibold tracking-[-0.025em] text-ink">
              Get better care for your <span className="text-brand-600">mental and behavioural health</span>
            </h1>
            <p className="mt-5 max-w-[48ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">
              Treatment for addiction and all mental illnesses, with medicine and comprehensive psychosocial rehabilitation.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/book-appointment/" size="lg" className="w-full sm:w-auto">Book an appointment</ButtonLink>
              <OpenChatButton className={btnClass("line", "lg", "w-full sm:w-auto")}>Talk to Tulasi</OpenChatButton>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Or call us on{" "}
              <TrackedLink event="call_click" eventLocation="hero" href={phone.href} className="font-semibold text-ink underline decoration-line underline-offset-4 hover:text-brand-700">{phone.display}</TrackedLink>
            </p>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sage-50 shadow-[0_0_0_1px_rgb(23_34_44/0.06),0_30px_60px_-36px_rgb(23_34_44/0.35)] lg:aspect-[5/4]">
              <HomeHeroSlideshow />
            </div>
            <p className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-white/95 py-2 pr-4 pl-3 text-[0.8125rem] font-medium text-ink shadow-[0_8px_24px_-12px_rgb(23_34_44/0.4)] sm:bottom-4 sm:left-4">
              <Icon name="pin" className="size-4 shrink-0 text-sage-600" /> <span className="truncate">Gurugram &amp; Delhi · Delhi-NCR</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═════════════ Impact stats strip ═════════════ */}
      <section aria-label="Tulasi Healthcare impact numbers" className="stats-strip">
        <div className="container-page">
          <ul className="stats-grid">
            {[
              { value: "15+",   unit: "Years",    label: "Delivering compassionate psychiatric care in Delhi-NCR" },
              { value: "50,000+", unit: "Patients", label: "Treated and supported, helping people rebuild their lives" },
              { value: "100+",  unit: "Experts",  label: "Psychiatrists, psychologists and rehabilitation specialists" },
              { value: "200+",  unit: "Beds",     label: "Across our inpatient and rehabilitation centres" },
              { value: "NABH",  unit: null,       label: "Accredited — the gold standard for hospital quality in India" },
            ].map(({ value, unit, label }, i) => (
              <li key={label} className="stats-item">
                <p className="stats-value">
                  {value}
                  {unit && <span className="stats-unit">{unit}</span>}
                </p>
                <p className="stats-label">{label}</p>
              </li>
            ))}
          </ul>
          <p className="stats-footnote">Based on our operational records and accreditation status.</p>
        </div>
      </section>


      {/* ═════════════ Videos from Instagram ═════════════ */}
      <section aria-label="Videos from Instagram" className="relative overflow-hidden bg-gradient-to-b from-mist via-white to-mist py-10 sm:py-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-[#e4ddf6] opacity-70 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-[#d6e8f7] opacity-70 blur-3xl" />
        <div className="container-page relative">
          <InstagramVideos />
        </div>
      </section>

      {/* ═════════════ What would you like help with ═════════════ */}
      <section id="help" className={sectionPad}>
        <div className="container-page">
          <SectionHeading title="What would you like help with?" text="Choose what feels closest. Each page explains how we treat it." />
          <ul className="mt-10 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 lg:grid-cols-6 lg:gap-x-4">
            {concerns.map((c, i) => (
              <Reveal as="li" key={c.href} delay={(i % 6) * 40}>
                <Link href={c.href} className="group flex flex-col items-center gap-3 text-center">
                  <span className="relative grid size-[5.5rem] place-items-center overflow-hidden rounded-full text-ink/75 transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_28px_-16px_rgb(23_34_44/0.35)] sm:size-28 lg:size-[7.25rem]" style={{ backgroundColor: PASTELS[i % PASTELS.length] }}>
                    {(photos[c.label] ?? null) ? <Image src={photos[c.label]!} alt="" fill sizes="116px" className="object-cover" /> : CONCERN_ICON[c.label]?.startsWith("i:") ? <Icon name={CONCERN_ICON[c.label].slice(2)} className="size-9 sm:size-10" strokeWidth={1.5} /> : <BrandIcon name={CONCERN_ICON[c.label] ?? "cradle"} className="size-9 sm:size-10" />}
                  </span>
                  <span className="max-w-[12ch] text-[0.9375rem] leading-snug font-semibold text-ink group-hover:text-brand-700 sm:max-w-[14ch] sm:text-base">{c.label}</span>
                </Link>
              </Reveal>
            ))}
            <Reveal as="li" delay={(concerns.length % 6) * 40}>
              <Link href="/services-2/" className="group flex flex-col items-center gap-3 text-center">
                <span className="grid size-[5.5rem] place-items-center rounded-full bg-white text-brand-700 shadow-[inset_0_0_0_1.5px_var(--color-brand-200)] transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[inset_0_0_0_1.5px_var(--color-brand-500)] sm:size-28 lg:size-[7.25rem]">
                  <Icon name="arrow" className="size-8" />
                </span>
                <span className="max-w-[12ch] text-[0.9375rem] leading-snug font-semibold text-brand-700 sm:text-base">All conditions</span>
              </Link>
            </Reveal>
          </ul>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem] text-ink-soft">
            Not sure where to start?
            <Link href="/find-a-specialist/" className="group/btn inline-flex min-h-10 items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900">Find the right specialist <Arrow className="size-4" /></Link>
            <span aria-hidden="true" className="hidden text-line sm:inline">|</span>
            <Link href="/mental-health-check/" className="inline-flex min-h-10 items-center font-semibold text-brand-700 hover:text-brand-900">Free 2-minute check-in</Link>
            <span aria-hidden="true" className="hidden text-line sm:inline">|</span>
            <OpenChatButton className="inline-flex min-h-10 items-center gap-2 font-semibold text-brand-700 hover:text-brand-900">Ask Tulasi</OpenChatButton>
            <span aria-hidden="true" className="hidden text-line sm:inline">|</span>
            <Link href="/services-2/" className="group/btn inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900">All treatments <Arrow className="size-4" /></Link>
          </p>
        </div>
      </section>

      {/* ═════════════ Services ═════════════ */}
      <section className={`cv ${sectionPad} bg-mist`}>
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="One team, every kind of care" text="Psychiatrists, psychologists, social workers and paramedical staff working together, from a first consultation to residential rehabilitation." />
            <div className="hidden sm:block"><ButtonLink href="/services-2/" variant="line">All services <Arrow /></ButtonLink></div>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((p, i) => (
              <Reveal as="li" key={p.href} delay={(i % 3) * 60}>
                <Link href={p.href} className="group flex h-full flex-col rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-brand-200),var(--shadow-lift)]">
                  <span className="icon-tile icon-tile-blue size-12"><BrandIcon name={PATHWAY_ICON[p.icon]} className="size-6" /></span>
                  <h3 className="mt-5 font-display text-[1.1875rem] leading-snug font-semibold tracking-[-0.015em] text-ink">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">{p.text}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand-700 group-hover:text-brand-900">Learn more <Arrow className="size-4" /></span>
                </Link>
              </Reveal>
            ))}
          </ul>
          <div className="mt-6 sm:hidden"><ButtonLink href="/services-2/" variant="line" className="w-full">All services <Arrow /></ButtonLink></div>
        </div>
      </section>

      {/* ═════════════ Doctors marquee ═════════════ */}
      <section className="cv py-10 sm:py-12 lg:py-14 overflow-hidden">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Meet our team" text="Highly qualified and dedicated psychiatrists and psychologists. Choose a profile to read more or book." />
            <div className="hidden sm:block"><ButtonLink href="/our-team/" variant="line">Meet the whole team <Arrow /></ButtonLink></div>
          </div>
        </div>
        {/* Marquee bleeds beyond container-page intentionally */}
        <DoctorMarquee />
        <div className="container-page">
          <div className="mt-8 sm:hidden"><ButtonLink href="/our-team/" variant="line" className="w-full">Meet the whole team <Arrow /></ButtonLink></div>
        </div>
      </section>

      {/* ═════════════ From the first call to life after treatment (one section) ═════════════ */}
      <section aria-labelledby="first-visit" className={`cv ${sectionPad} bg-mist`}>
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From your first call to life after treatment" text="Starting is often the hardest part. Here is how it works, so there are no surprises." id="first-visit" className="max-w-3xl" />
          <div className="relative mt-10">
            <LeafVine />
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {[
                ["Book or call", `Choose a doctor and a time online, or call ${phone.display}. If you are not sure who to see, we will help you choose.`],
                ["Meet your specialist", "A first consultation with a psychiatrist or psychologist usually lasts 20 to 45 minutes. Bring any earlier reports and a list of current medicines."],
                ["Agree a plan", "Your doctor explains what they found and suggests the next steps: therapy, medicines, follow-up visits, or admission if it is needed. You decide at your own pace."],
                ["Recover, with support", "Medicine and therapy, tailored to the person. Where needed: psychosocial rehabilitation, residential care and supported living, then continued support and day-care programmes after inpatient treatment."],
              ].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70} className="relative">
                  <span className="grid size-10 place-items-center rounded-full bg-white font-display text-sm font-semibold text-sage-700 shadow-[inset_0_0_0_1px_var(--color-sage-200)]">{i + 1}</span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{t}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink-soft">{d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
          <p className="mt-10 flex items-start gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
            <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-sage-600" />
            <span>
              Consultation fees depend on the doctor and are shown on each <Link href="/our-team/" className="font-semibold text-brand-700 underline underline-offset-2">doctor’s profile</Link>.{" "}
              {cashless ? `We are empanelled with ${cashless} for cashless treatment. ` : ""}Not sure what your policy covers? <TrackedLink event="call_click" eventLocation="home_first_visit" href={phone.href} className="font-semibold text-brand-700 underline underline-offset-2">Call {phone.display}</TrackedLink> and we will check with you.
            </span>
          </p>
        </div>
      </section>

      {/* ═════════════ Patient voices ═════════════ */}
      <section aria-labelledby="reviews-heading" className="cv py-10 sm:py-12 lg:py-14" style={{ background: "linear-gradient(135deg, #0f2847 0%, #0b1d40 50%, #102a5a 100%)" }}>
        <div className="container-page">
          {/* Header row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Reveal as="header">
              <p className="eyebrow mb-3" style={{ color: "rgb(163 200 176)" }}>What patients say</p>
              <h2 id="reviews-heading" className="text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-white">
                Real stories, real recovery
              </h2>
            </Reveal>
            {/* Google aggregate badge */}
            <Reveal>
              <div className="flex items-center gap-3 rounded-2xl px-5 py-3" style={{ background: "rgb(255 255 255 / 0.07)", border: "1px solid rgb(255 255 255 / 0.12)" }}>
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} viewBox="0 0 16 16" className="size-3.5 fill-amber-400" aria-hidden="true">
                        <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm font-bold text-white">5.0</span>
                  </div>
                  <p className="mt-0.5 text-[0.7rem] font-medium" style={{ color: "rgb(255 255 255 / 0.5)" }}>Verified Google Reviews</p>
                </div>
              </div>
            </Reveal>
          </div>
          <ReviewGrid />
        </div>
      </section>

      {/* ═════════════ Locations ═════════════ */}
      <section id="locations" aria-labelledby="locations-title" className={`cv ${sectionPad}`}>
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Our locations" title="Care close to home, across Delhi-NCR" text={`Tulasi Healthcare has ${locationSummary()}. Turn a card over for the address and directions.`} id="locations-title" className="max-w-3xl" />
            <div className="hidden sm:block"><ButtonLink href="/locations/" variant="line">All locations <Arrow /></ButtonLink></div>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-ink" aria-label="Our centres at a glance">
            <li className="rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_var(--color-line)]">{HOSPITALS.length} hospitals</li>
            <li className="rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_var(--color-line)]">{CLINICS.length} clinics</li>
            <li className="rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_var(--color-line)]">{CITIES.length} cities</li>
          </ul>
          <div className="mt-8"><LocationsShowcase /></div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/locations/" variant="line" className="w-full sm:hidden">All locations <Arrow /></ButtonLink>
            <ButtonLink href="/international-patient-services/" variant="line" className="w-full sm:w-auto">International patients</ButtonLink>
          </div>
        </div>
      </section>

      {/* ═════════════ FAQ ═════════════ */}
      <section className={`cv ${sectionPad} bg-mist`}>
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <SectionHeading title="Questions we are often asked" text={faqIntro} />
          <Reveal className="divide-y divide-line rounded-[var(--radius-card)] bg-white px-5 shadow-[0_0_0_1px_var(--color-line)] sm:px-7">
            {faqItems.slice(0, 5).map((f, i) => (
              <details key={f.q} className="acc group" open={i === 0}>
                <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-4">
                  <h3 className="font-display text-base leading-snug font-semibold text-ink sm:text-[1.0625rem]">{f.q}</h3>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mist text-ink-soft transition-transform duration-300 group-open:rotate-45">
                    <Icon name="plus" className="size-4" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-5 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
        <JsonLd data={faqSchema(faqItems)} />
      </section>

      {/* ═════════════ Closing step ═════════════ */}
      <section className={`cv ${sectionPad}`}>
        <div className="container-page">
          <Reveal className="rounded-[2rem] bg-sage-50 px-6 py-12 text-center shadow-[inset_0_0_0_1px_var(--color-sage-100)] sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-[22ch] text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">You don’t have to do this alone</h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Book a consultation with our psychiatrists and psychologists, or call us. We’ll help you take the first step.</p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/book-appointment/" size="lg">Book an appointment</ButtonLink>
              <TrackedLink event="call_click" eventLocation="home_cta" href={phone.href} className={btnClass("line", "lg")}>
                <Icon name="phone" className="size-4 text-sage-600" /> {phone.display}
              </TrackedLink>
            </div>
          </Reveal>
        </div>
      </section>
      <FinderBar />
    </>
  );
}
