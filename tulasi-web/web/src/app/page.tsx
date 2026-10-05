// Home page. Every heading, paragraph, number and FAQ below comes from the
// live homepage (data/content/home.json); layout, type, imagery and motion
// are the new "Held in light" design. Only short UI labels are new.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, getDoctorBySlug, getDoctorFacts, getDoctors, getHome, getPageByPath, getPosts, getSite, localPath, readingMinutes, tagsFor } from "@/lib/content";
import { faqSchema, metadataFromSeo } from "@/lib/seo";
import { Arrow, BrandIcon, ButtonLink, Icon, JsonLd, Kinetic, Reveal, SectionHeading, btnClass } from "@/components/ui/primitives";
import { HeroVisual } from "@/components/home/HeroVisual";
import { Counter, Magnetic, Rail } from "@/components/home/interactive";
import { Journey } from "@/components/home/Journey";
import { Testimonials } from "@/components/home/Testimonials";
import { Mockups } from "@/components/home/Mockups";
import { CareFinder } from "@/components/home/CareFinder";
import { TeamWall, portraitOf } from "@/components/team";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { HeroScene } from "@/components/HeroScene";
import { Logo3D } from "@/components/Logo3D";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";

export function generateMetadata(): Metadata {
  const page = getPageByPath("/")!;
  return metadataFromSeo(page.seo, { title: page.title, path: "/" });
}

const APART_ICON = ["inpatient", "family", "balance"];
const COVERS = [
  "radial-gradient(80% 60% at 20% 10%,rgb(47 91 224/.85),transparent 60%),radial-gradient(70% 70% at 90% 90%,rgb(10 53 181/.9),transparent 60%),#0b236b",
  "radial-gradient(80% 60% at 80% 10%,rgb(144 170 249/.6),transparent 60%),radial-gradient(70% 70% at 10% 90%,rgb(10 53 181/.9),transparent 60%),#0a2679",
  "radial-gradient(80% 60% at 50% 0%,rgb(47 91 224/.8),transparent 60%),radial-gradient(60% 60% at 80% 100%,rgb(215 20 31/.35),transparent 60%),#081e5f",
];

export default function Home() {
  const h = getHome();
  const site = getSite();
  const doctors = getDoctors();
  const recent = getPosts().slice(0, 20); // the live homepage links to the 20 newest articles
  const [featured, ...rest] = recent;
  const { hero } = h;
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };

  // Order of the doctors follows the live homepage team list.
  const order = ["Dr. Gorav Gupta", "Dr. Ratnarakshit Ingole"];
  const team = [...doctors].sort((a, b) => {
    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a.role === "psychiatrist" ? -1 : 1) - (b.role === "psychiatrist" ? -1 : 1);
  });
  const mockDoctor = getDoctorBySlug("dr-pooja-sharma") ?? team[0];
  const since = h.intro.blocks.flatMap((b) => b.paragraphs).join(" ").match(/inauguration in (\d{4})/)?.[1];
  const proof: [string, string][] = [
    ...(since ? ([["Since", since]] as [string, string][]) : []),
    ["Accreditation", "NABH"],
    ["Experts", h.stats.find((s) => /expert/i.test(s.label))?.display ?? ""],
    ["Beds", h.stats.find((s) => /bed/i.test(s.label))?.display ?? ""],
  ];

  return (
    <>
      {/* ═════════════ Hero (midnight stage) ═════════════ */}
      <section className="on-dark stage relative overflow-clip bg-hero text-white">
        <div className="beam" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[10%] right-[-8%] hidden h-[620px] w-[620px] rounded-full bg-brand-300/20 blur-[120px] md:block" />
        <div className="container-page relative pt-36 lg:pt-44">
          <h1 className="relative z-10 inline-flex max-w-[44rem] items-center gap-2.5 rounded-full bg-white/[0.06] py-2 pr-4 pl-3 text-[0.8125rem] leading-snug font-medium text-brand-100 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent-600 shadow-[0_0_10px_2px_rgb(215_20_31/0.8)]" />
            {h.intro.heading}
          </h1>
          <h2 className="relative z-10 mt-8 max-w-[15ch] text-[clamp(3.25rem,1.3rem+5.6vw,6.75rem)] leading-[0.96] font-extrabold tracking-[-0.045em]">
            <Kinetic text={hero.heading} highlight={hero.headingEmphasis} tone="dark" />
          </h2>

          <div className="grid items-end gap-8 lg:grid-cols-2">
            <div className="relative z-10 pt-8 lg:pb-20">
              <p className="max-w-[54ch] text-[length:var(--text-lead)] leading-relaxed text-brand-100/80">{hero.text}</p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <ButtonLink href="/book-appointment/" variant="accent" size="lg">
                    Book Appointment <Arrow />
                  </ButtonLink>
                </Magnetic>
                <TrackedLink event="call_click" eventLocation="hero" href={hero.cta.href} className={btnClass("glass", "lg")}>
                  <Icon name="phone" className="size-4" /> {hero.cta.label}
                </TrackedLink>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.875rem] text-brand-100/75">
                {h.about.points.slice(0, 2).map((p) => (
                  <li key={p} className="flex items-center gap-2"><Icon name="check" className="size-4 text-brand-300" /> {p}</li>
                ))}
                <li className="flex items-center gap-2"><Icon name="shield" className="size-4 text-brand-300" /> NABH accredited</li>
              </ul>
            </div>
            <div className="relative lg:-mt-56">
              <HeroVisual />
            </div>
          </div>

          {/* proof bar: real figures from the live page */}
          <ul className="relative z-10 mt-6 mb-16 grid grid-cols-2 overflow-hidden rounded-[var(--radius-blob)] bg-white/[0.04] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),inset_0_1px_0_rgb(255_255_255/0.08)] lg:mb-20 lg:grid-cols-4">
            {h.stats.map((s, i) => (
              <li key={s.label} className={`px-6 py-7 sm:px-8 ${i % 2 ? "border-l border-white/10" : ""} ${i > 1 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                <Counter value={s.value} suffix="+" className="block font-display text-[clamp(1.875rem,1.3rem+2vw,3rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums" />
                <span className="mt-2 block text-sm text-brand-100/70">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════════ Find the right care ═════════════ */}
      <section id="find-care" className="cv grid-light py-24 lg:py-32">
        <div className="container-page">
          <Reveal>
            <CareFinder phone={phone} />
          </Reveal>
        </div>
      </section>

      {/* ═════════════ Services (calm, light) ═════════════ */}
      <section aria-labelledby="pathways-title" className="cv relative overflow-clip bg-mist py-24 lg:py-32">
        <ServicesShowcase
          intro={
            <Reveal as="header">
              <p className="eyebrow">Our services</p>
              <h2 id="pathways-title" className="mt-5 text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em] text-ink">
                One team, <span className="text-brandgrad">every kind of care</span>
              </h2>
              <p className="mt-5 max-w-[46ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Psychiatrists, psychologists, social workers and paramedical staff working together, from a first consultation to residential rehabilitation.</p>
              <ButtonLink href="/services-2/" variant="line" className="mt-8">All services <Arrow /></ButtonLink>
            </Reveal>
          }
        />
      </section>

      {/* ═════════════ About: asymmetric split ═════════════ */}
      <section className="cv py-24 lg:py-32">
        <div className="container-page grid items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <div>
            <SectionHeading eyebrow={h.about.eyebrow} title={h.about.heading} highlight="Best Rehabilitation Centre" />
            <Reveal delay={80}>
              <p className="mt-6 max-w-[60ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">{h.about.text}</p>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {h.about.points.map((p) => (
                  <li key={p} className="flex items-center gap-4 py-4 font-display text-lg font-semibold tracking-[-0.015em] text-ink">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 shadow-[inset_0_0_0_1px_var(--color-brand-100)]"><Icon name="check" className="size-3.5" strokeWidth={2.4} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              {h.about.more.href && (
                <ButtonLink href={h.about.more.href} variant="line" className="mt-8">
                  {h.about.more.label}
                  <span className="sr-only"> about Tulasi Healthcare</span> <Arrow />
                </ButtonLink>
              )}
            </Reveal>
          </div>
          <Reveal variant="scale" className="on-dark stage relative overflow-clip rounded-[var(--radius-blob)] bg-hero p-8 text-white shadow-[var(--shadow-glow)] sm:p-10">
            <div className="beam" aria-hidden="true" />
            <Logo3D className="max-w-[320px]" />
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/10">
              {proof.slice(0, 4).map(([k, v]) => (
                <div key={k} className="bg-navy-900/80 p-5">
                  <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-brand-200 uppercase">{k}</dt>
                  <dd className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em]">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ═════════════ What sets us apart: editorial rows ═════════════ */}
      <section className="cv bg-mist py-24 lg:py-32">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={h.apart.eyebrow} title={h.apart.heading} highlight="Apart" />
          </div>
          <ul className="border-t border-line">
            {h.apart.items.map((it, i) => (
              <Reveal as="li" key={it.title} delay={i * 90} className="group grid gap-5 border-b border-line py-9 sm:grid-cols-[auto_1fr] sm:gap-8">
                <span className="icon-tile size-14 transition-transform duration-[450ms] ease-[var(--ease-calm)] group-hover:-translate-y-1"><BrandIcon name={APART_ICON[i] ?? "cradle"} className="size-7" /></span>
                <div>
                  <h3 className="font-display text-[length:var(--text-h3)] font-bold tracking-[-0.025em] text-ink">{it.title}</h3>
                  <p className="mt-3 max-w-[56ch] leading-relaxed text-ink-soft">{it.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════════ Journey (sticky storytelling) ═════════════ */}
      <Journey
        eyebrow="Your journey to recovery"
        heading="From the first conversation to life after treatment, we walk with you."
        highlight="we walk with you."
        steps={[
          { title: "Assess", text: "Meet our psychiatrists and clinical psychologists for a careful evaluation." },
          { title: "Treat", text: "Medicinal treatment integrated with psychological intervention, tailored to the patient’s needs." },
          { title: "Heal", text: "Psychosocial rehabilitation, residential care and supported living." },
          { title: "Thrive", text: "Continuous support and daycare programs after in-patient treatment." },
        ]}
      />

      {/* ═════════════ Team ═════════════ */}
      <section className="cv overflow-clip py-24 lg:py-32">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={h.team.eyebrow ?? "Our team"} title={h.team.heading} text={h.team.text} highlight="Psychologists" />
            <ButtonLink href="/our-team/" variant="line">Meet the whole team <Arrow /></ButtonLink>
          </div>
          <div className="mt-14">
            <TeamWall doctors={team} />
          </div>
        </div>
      </section>

      {/* ═════════════ Booking, shown as a product ═════════════ */}
      <section className="cv px-3 sm:px-4">
        <div className="on-dark stage relative mx-auto max-w-[1360px] overflow-clip rounded-[32px] bg-hero px-4 py-20 text-white sm:px-8 lg:py-28">
          <div className="beam" aria-hidden="true" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 hidden h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-300/20 blur-[120px] md:block" />
          <Reveal as="header" className="relative mx-auto max-w-2xl text-center">
            <p className="eyebrow !text-brand-200">Online booking</p>
            <h2 className="mt-5 text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em]">Book in about <span className="text-glow">a minute.</span></h2>
            <p className="mx-auto mt-5 max-w-[48ch] text-[length:var(--text-lead)] text-brand-100/80">Choose a specialist and a time, get an SMS confirmation, and manage it in the patient portal.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/book-appointment/" variant="accent" size="lg">Book Appointment <Arrow /></ButtonLink>
              <ButtonLink href="/patient-login/" variant="glass" size="lg">Patient portal</ButtonLink>
            </div>
          </Reveal>
          <div className="relative mt-16">
            <Mockups doctor={mockDoctor} facts={getDoctorFacts(mockDoctor.slug)} portrait={portraitOf(mockDoctor)} />
          </div>
        </div>
      </section>

      {/* ═════════════ Recognition ═════════════ */}
      <section className="cv py-24 lg:py-32">
        <div className="container-page">
          <SectionHeading eyebrow="News & Awards" title={h.premium} />
          <Rail label="Awards and recognition" className="mt-12">
            {h.awards.map((a) => (
              <li key={a.title} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
                <article className="group spot-light h-full">
                  <div className="spot-in flex h-full gap-5 p-5">
                    {a.image && (
                      <div className="duo relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-[var(--radius-tile)] bg-brand-50 shadow-[0_0_0_1px_var(--color-line)] sm:w-28">
                        <Image src={a.image.src} alt={a.image.alt} fill sizes="112px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="icon-tile size-9"><Icon name="award" className="size-4" /></span>
                      <h3 className="mt-3 font-display text-[1.02rem] leading-snug font-bold tracking-[-0.015em] text-ink">{a.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.text}</p>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </Rail>
          <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <Reveal className="flex items-center gap-5 rounded-[var(--radius-blob)] bg-midnight p-7 text-white shadow-[var(--shadow-glow)]">
              <span className="icon-tile icon-tile-dark size-14 shrink-0"><Icon name="shield" className="size-6" /></span>
              <p className="font-display text-lg leading-snug font-semibold tracking-[-0.015em]">{h.nabh.text}</p>
            </Reveal>
            <Reveal delay={100} className="grid gap-6 rounded-[var(--radius-blob)] p-7 shadow-[inset_0_0_0_1px_var(--color-line)] sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">{h.insurance.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.insurance.text}</p>
              </div>
              <ul className="flex items-center gap-6">
                {h.insurance.logos.map((l) => (
                  <li key={l.src}><Image src={l.src} alt={l.alt} width={150} height={50} className="h-10 w-auto object-contain" /></li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═════════════ Why Tulasi (the live page's H1 section) ═════════════ */}
      <section className="cv bg-mist py-24 lg:py-32">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Why Tulasi Healthcare</p>
            <p className="mt-5 font-display text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em] text-ink">
              Over two decades of psychiatric and rehabilitation care <span className="text-brandgrad">in Delhi-NCR.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/book-appointment/" variant="accent">Book Appointment <Arrow /></ButtonLink>
              <ButtonLink href="/about-us/" variant="line">About us</ButtonLink>
            </div>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {h.intro.blocks.map((b, i) => (
              <Reveal key={b.heading} delay={i * 60} className="py-9">
                <h3 className="font-display text-[length:var(--text-h3)] font-bold tracking-[-0.025em] text-ink">{b.heading}</h3>
                {b.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-4 leading-relaxed text-ink-soft">{p}</p>
                ))}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════ Testimonials ═════════════ */}
      <section className="cv overflow-clip py-24 lg:py-32">
        <div className="container-page">
          <SectionHeading eyebrow="Testimonials" title={h.testimonials.heading} text={h.testimonials.text} />
          <div className="mt-12">
            <Testimonials items={h.testimonials.items} />
          </div>
        </div>
      </section>

      {/* ═════════════ Locations ═════════════ */}
      <section aria-labelledby="locations-title" className="cv pb-24 lg:pb-32">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <Reveal as="header">
            <p className="eyebrow">Locations</p>
            <h2 id="locations-title" className="mt-5 text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em] text-ink">
              Care close to home, <span className="text-brandgrad">across Delhi-NCR</span>
            </h2>
            <p className="mt-5 max-w-[48ch] leading-relaxed text-ink-soft">Psychiatric hospital and rehabilitation centres in Delhi and Gurgaon, with treatment for patients from across India and abroad.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/map-direction/" variant="primary"><Icon name="pin" className="size-4" /> Map &amp; Direction</ButtonLink>
              <ButtonLink href="/international-patient-services/" variant="line">International patients <Arrow /></ButtonLink>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { city: "Gurgaon", href: "/map-direction/gurgaon/", line: site.contact.address },
              { city: "Delhi", href: "/map-direction/delhi/", line: "Psychiatric hospital and rehabilitation centre in Delhi" },
            ].map((l, i) => (
              <Reveal key={l.city} delay={i * 90}>
                <Link href={l.href} className="spot group block h-full">
                  <div className="spot-in flex h-full flex-col p-7 text-white">
                    <HeroScene scene="map" className="-mx-4 -mt-4 h-auto w-[calc(100%+2rem)] opacity-80" />
                    <h3 className="font-display text-2xl font-bold tracking-[-0.03em]">{l.city}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-100/75">{l.line}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">Directions <Arrow /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={180} className="sm:col-span-2">
              <div className="rounded-[var(--radius-blob)] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
                <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">Rehabilitation centres</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {site.footerColumns
                    .flatMap((c) => c.links)
                    .filter((l, i, all) => /rehabilitation cent(re|er) in/i.test(l.label) && all.findIndex((x) => x.href === l.href) === i)
                    .map((l) => (
                      <li key={l.href}>
                        <Link href={l.href ?? "/"} className="inline-flex min-h-9 items-center rounded-full bg-mist px-3.5 text-sm text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-800">{l.label.replace(/Rehabilitation Cent(re|er) in /i, "")}</Link>
                      </li>
                    ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═════════════ FAQ ═════════════ */}
      <section className="cv bg-mist py-24 lg:py-32">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow="FAQ" title={h.faq.heading} text={h.faq.text} />
          </div>
          <Reveal className="divide-y divide-line border-y border-line">
            {h.faq.items.map((f, i) => (
              <details key={f.q} className="acc group" open={i === 0}>
                <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-6">
                  <h3 className="font-display text-[1.15rem] leading-snug font-semibold tracking-[-0.015em] text-ink">{f.q}</h3>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-[inset_0_0_0_1px_var(--color-line)] transition-transform duration-[450ms] ease-[var(--ease-calm)] group-open:rotate-45">
                    <Icon name="plus" className="size-4" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-7 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
        <JsonLd data={faqSchema(h.faq.items)} />
      </section>

      {/* ═════════════ Blog: editorial ═════════════ */}
      <section className="cv py-24 lg:py-32">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Blog & News" title={h.blog.heading} text={h.blog.text} />
            <ButtonLink href="/blog/" variant="line">All articles <Arrow /></ButtonLink>
          </div>
          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
            {featured && (
              <Reveal as="article" className="group relative">
                {featured.featuredImage && (
                  <div className="duo relative aspect-[16/10] overflow-hidden rounded-[var(--radius-blob)] bg-brand-50 shadow-[0_0_0_1px_var(--color-line)]">
                    <Image src={localPath(featured.featuredImage.url)} alt={featured.featuredImage.alt ?? ""} fill sizes="(min-width:1024px) 680px, 100vw" className="object-cover transition-transform duration-[900ms] ease-[var(--ease-calm)] group-hover:scale-[1.03]" />
                  </div>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-[0.8125rem] text-ink-soft">
                  {tagsFor(featured).slice(0, 2).map((t) => (
                    <span key={t.id} className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-900">{t.name}</span>
                  ))}
                  <time dateTime={featured.date ?? undefined}>{formatDate(featured.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{readingMinutes(featured)} min read</span>
                </div>
                <h3 className="mt-3 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-[1.1] font-bold tracking-[-0.03em] text-ink">
                  <Link href={featured.path} className="after:absolute after:inset-0 hover:text-brand-700">{featured.title}</Link>
                </h3>
                {featured.excerpt && <p className="mt-3 line-clamp-3 max-w-[60ch] leading-relaxed text-ink-soft">{featured.excerpt.replace(/\s*\[…\]|\s*\[&hellip;\]/g, "…")}</p>}
              </Reveal>
            )}
            <ul className="divide-y divide-line border-y border-line">
              {rest.slice(0, 5).map((p, i) => (
                <Reveal as="li" key={p.id} delay={i * 60}>
                  <article className="group relative flex gap-4 py-5">
                    {p.featuredImage && (
                      <div className="duo relative aspect-square w-20 shrink-0 overflow-hidden rounded-[var(--radius-tile)] bg-brand-50 shadow-[0_0_0_1px_var(--color-line)]">
                        <Image src={localPath(p.featuredImage.url)} alt="" fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-ink-soft">
                        <time dateTime={p.date ?? undefined}>{formatDate(p.date)}</time> · {readingMinutes(p)} min read
                      </p>
                      <h3 className="mt-1.5 font-display text-[1.02rem] leading-snug font-semibold tracking-[-0.015em] text-ink">
                        <Link href={p.path} className="after:absolute after:inset-0 group-hover:text-brand-700">{p.title}</Link>
                      </h3>
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal className="mt-14">
            <h3 className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">More articles</h3>
            <ul className="mt-5 grid gap-x-10 gap-y-3 md:grid-cols-2">
              {rest.slice(5).map((p) => (
                <li key={p.id}>
                  <Link href={p.path} className="group flex items-start gap-2.5 text-ink-soft transition-colors hover:text-brand-700">
                    <Icon name="chevron" className="mt-1 size-4 shrink-0 text-brand-300 transition-transform group-hover:translate-x-0.5" />
                    <span className="link-underline">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ═════════════ Patient resources (e-book covers built in code) ═════════════ */}
      <section className="cv px-3 pb-24 sm:px-4 lg:pb-32">
        <div className="on-dark stage relative mx-auto max-w-[1360px] overflow-clip rounded-[32px] bg-hero px-6 py-16 text-white sm:px-12 lg:py-20">
          <div className="beam" aria-hidden="true" />
          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="eyebrow !text-brand-200">{h.resources.subheading}</p>
              <h2 className="mt-5 text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em]">{h.resources.heading}</h2>
              {h.resources.items.map((it) => (
                <h3 key={it.title} className="mt-6 font-display text-lg font-semibold text-brand-100">{it.title}</h3>
              ))}
              <p className="mt-2 max-w-[52ch] leading-relaxed text-brand-100/80">{h.resources.text}</p>
            </div>
            <ul className="grid grid-cols-3 gap-4">
              {h.resources.links.map((l, i) => (
                <li key={l.href}>
                  <TrackedLink event="ebook_download" eventLocation={l.label} href={l.href} download className="group block">
                    <span
                      className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),0_24px_48px_-24px_rgb(0_0_0/0.6)] transition-transform duration-[700ms] ease-[var(--ease-calm)] group-hover:-translate-y-2 group-hover:rotate-[-1.5deg]"
                      style={{ background: COVERS[i % COVERS.length] }}
                    >
                      <span className="text-[0.6rem] font-semibold tracking-[0.16em] text-brand-200 uppercase">E-book</span>
                      <span className="font-display text-[clamp(0.85rem,0.7rem+0.5vw,1.15rem)] leading-tight font-bold tracking-[-0.02em]">{l.label.replace(/\s*e-?book/i, "")}</span>
                      <span className="flex items-center justify-between text-[0.65rem] text-brand-100/70">
                        Tulasi Healthcare <Icon name="download" className="size-4" />
                      </span>
                    </span>
                    <span className="mt-3 block text-sm font-semibold text-brand-100 group-hover:text-white">{l.label}</span>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
