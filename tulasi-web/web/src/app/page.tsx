// Home page: short, calm and easy to scan. One clear message, two clear actions,
// then a handful of quiet sections. Wording comes from the live homepage
// (content/home.json); only short UI labels are new.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDoctors, getHome, getPageByPath, getSite } from "@/lib/content";
import { faqSchema, metadataFromSeo } from "@/lib/seo";
import { Arrow, BrandIcon, btnClass, ButtonLink, Icon, JsonLd, Reveal, SectionHeading } from "@/components/ui/primitives";
import { TeamMember } from "@/components/team";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { CONCERN_ICON, CONCERNS, PATHWAYS, type Pathway } from "@/lib/care";

export function generateMetadata(): Metadata {
  const page = getPageByPath("/")!;
  return metadataFromSeo(page.seo, { title: page.title, path: "/" });
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
};
const HELP_WITH = ["Anxiety", "Depression", "OCD", "Bipolar disorder", "Alcohol addiction", "Drug addiction", "ADHD", "Dementia & memory"];
const FEATURED_DOCTORS = ["Dr. Gorav Gupta", "Dr. Ratnarakshit Ingole", "Dr. Pooja Sharma", "Dr. Poorva Gupta"];
const STEPS = [
  { title: "Assess", text: "Meet our psychiatrists and clinical psychologists for a careful evaluation." },
  { title: "Treat", text: "Medicine and therapy together, tailored to the person’s needs." },
  { title: "Heal", text: "Psychosocial rehabilitation, residential care and supported living." },
  { title: "Thrive", text: "Continued support and day-care programmes after inpatient treatment." },
];

const sectionPad = "py-14 sm:py-16 lg:py-20";

export default function Home() {
  const h = getHome();
  const site = getSite();
  const doctors = getDoctors();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };

  const picked = FEATURED_DOCTORS.map((n) => doctors.find((d) => d.name === n)).filter((d): d is NonNullable<typeof d> => !!d);
  const team = [...picked, ...doctors.filter((d) => !picked.includes(d))].slice(0, 4);

  const since = h.intro.blocks.flatMap((b) => b.paragraphs).join(" ").match(/inauguration in (\d{4})/)?.[1];
  const experts = h.stats.find((s) => /expert/i.test(s.label))?.display ?? "100+";
  const beds = h.stats.find((s) => /bed/i.test(s.label))?.display ?? "200+";
  const trust: [string, string][] = [
    ...(since ? ([[since, "Caring for patients since"]] as [string, string][]) : []),
    ["NABH", "Accredited hospital"],
    [experts, "Mental health experts"],
    [beds, "Beds"],
  ];

  const concerns = HELP_WITH.map((l) => CONCERNS.find((c) => c.label === l)).filter((c): c is NonNullable<typeof c> => !!c);
  const services = PATHWAYS.slice(0, 6);

  return (
    <>
      {/* ═════════════ Hero ═════════════ */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-16">
          <div>
            <p className="eyebrow">Psychiatric hospital &amp; rehabilitation centre</p>
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
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              {["NABH accredited", since ? `Since ${since}` : "20+ years of experience", `${experts} mental health experts`].map((t) => (
                <li key={t} className="flex items-center gap-2"><Icon name="check" className="size-4 text-sage-600" strokeWidth={2.2} /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sage-50 shadow-[0_0_0_1px_rgb(23_34_44/0.06),0_30px_60px_-36px_rgb(23_34_44/0.35)] lg:aspect-[5/4]">
              <Image src="/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp" alt="Tulasi Healthcare psychiatric hospital and rehabilitation centre, Gurugram" fill priority sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />
            </div>
            <p className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-white/95 py-2 pr-4 pl-3 text-[0.8125rem] font-medium text-ink shadow-[0_8px_24px_-12px_rgb(23_34_44/0.4)] sm:bottom-4 sm:left-4">
              <Icon name="pin" className="size-4 shrink-0 text-sage-600" /> <span className="truncate">Gurugram &amp; Delhi · Delhi-NCR</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═════════════ Trust figures ═════════════ */}
      <section aria-label="Tulasi Healthcare in numbers" className="border-y border-line bg-white">
        <ul className="container-page grid grid-cols-2 lg:grid-cols-4">
          {trust.map(([value, label], i) => (
            <li key={label} className={`px-2 py-6 text-center sm:px-4 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <p className="font-display text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-ink sm:text-[2rem]">{value}</p>
              <p className="mt-2 text-sm text-ink-soft">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ═════════════ What would you like help with ═════════════ */}
      <section id="help" className={sectionPad}>
        <div className="container-page">
          <SectionHeading title="What would you like help with?" text="Choose what feels closest. Each page explains how we treat it." />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {concerns.map((c, i) => (
              <Reveal as="li" key={c.href} delay={(i % 4) * 50}>
                <Link href={c.href} className="group flex h-full min-h-[4.5rem] items-center gap-3 rounded-[var(--radius-card)] bg-white p-3.5 shadow-[inset_0_0_0_1px_var(--color-line)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_var(--color-brand-300),var(--shadow-soft)] sm:gap-4 sm:p-4">
                  <span className="icon-tile size-11 shrink-0">
                    {CONCERN_ICON[c.label]?.startsWith("i:") ? <Icon name={CONCERN_ICON[c.label].slice(2)} className="size-5" /> : <BrandIcon name={CONCERN_ICON[c.label] ?? "cradle"} className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold text-ink sm:text-base">{c.label}</span>
                  <Icon name="arrow" className="hidden size-4 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block" />
                </Link>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem] text-ink-soft">
            Not sure where to start?
            <OpenChatButton className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-900">Ask Tulasi</OpenChatButton>
            <span aria-hidden="true" className="hidden text-line sm:inline">|</span>
            <Link href="/services-2/" className="group/btn inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900">All conditions &amp; treatments <Arrow className="size-4" /></Link>
          </p>
        </div>
      </section>

      {/* ═════════════ Services ═════════════ */}
      <section className={`${sectionPad} bg-mist`}>
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

      {/* ═════════════ Doctors ═════════════ */}
      <section className={sectionPad}>
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Meet our doctors" text="Highly qualified and dedicated psychiatrists and psychologists. Choose a profile to read more or book." />
            <div className="hidden sm:block"><ButtonLink href="/our-team/" variant="line">Meet the whole team <Arrow /></ButtonLink></div>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {team.map((d, i) => (
              <Reveal as="li" key={d.slug} delay={i * 60}>
                <TeamMember d={d} index={i} />
              </Reveal>
            ))}
          </ul>
          <div className="mt-8 sm:hidden"><ButtonLink href="/our-team/" variant="line" className="w-full">Meet the whole team <Arrow /></ButtonLink></div>
        </div>
      </section>

      {/* ═════════════ How care works ═════════════ */}
      <section className={`${sectionPad} bg-mist`}>
        <div className="container-page">
          <SectionHeading title="From the first conversation to life after treatment, we walk with you." className="max-w-3xl" />
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70} className="relative">
                <span className="grid size-10 place-items-center rounded-full bg-white font-display text-sm font-semibold text-sage-700 shadow-[inset_0_0_0_1px_var(--color-sage-200)]">{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 max-w-[30ch] text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ═════════════ Visit ═════════════ */}
      <section aria-labelledby="visit-title" className={sectionPad}>
        <div className="container-page grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <Reveal as="header">
            <p className="eyebrow mb-3">Visit us</p>
            <h2 id="visit-title" className="text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">Care close to home, across Delhi-NCR</h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-soft">Psychiatric hospital and rehabilitation centres in Delhi and Gurgaon, with treatment for patients from across India and abroad.</p>
            <address className="mt-5 flex items-start gap-3 text-[0.9375rem] text-ink not-italic">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-sage-600" /> {site.contact.address}
            </address>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/map-direction/" className="w-full sm:w-auto"><Icon name="pin" className="size-4" /> Map &amp; directions</ButtonLink>
              <ButtonLink href="/international-patient-services/" variant="line" className="w-full sm:w-auto">International patients</ButtonLink>
            </div>
          </Reveal>
          <Reveal variant="scale">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sage-50 shadow-[0_0_0_1px_rgb(23_34_44/0.06)]">
              <Image src="/wp-content/uploads/2022/12/49-1024x768-1.webp" alt="The courtyard at Tulasi Healthcare" fill sizes="(min-width:1024px) 620px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═════════════ FAQ ═════════════ */}
      <section className={`${sectionPad} bg-mist`}>
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <SectionHeading title="Questions we are often asked" text={h.faq.text} />
          <Reveal className="divide-y divide-line rounded-[var(--radius-card)] bg-white px-5 shadow-[0_0_0_1px_var(--color-line)] sm:px-7">
            {h.faq.items.slice(0, 5).map((f, i) => (
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
        <JsonLd data={faqSchema(h.faq.items)} />
      </section>

      {/* ═════════════ Closing step ═════════════ */}
      <section className={sectionPad}>
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
    </>
  );
}
