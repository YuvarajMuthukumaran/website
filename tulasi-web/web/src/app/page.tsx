// Home page. Every heading, paragraph, number and FAQ below comes from the
// live homepage (data/content/home.json); only layout and motion are new.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDoctors, getHome, getPageByPath, getPosts, getSite } from "@/lib/content";
import { faqSchema, metadataFromSeo } from "@/lib/seo";
import { ButtonLink, Icon, JsonLd, Reveal, SectionHeading } from "@/components/ui/primitives";
import { HeroVisual } from "@/components/home/HeroVisual";
import { Counter, Magnetic, TiltCard } from "@/components/home/interactive";
import { Journey } from "@/components/home/Journey";
import { PostCard } from "@/components/cards";
import { TeamWall } from "@/components/team";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { CareFinder } from "@/components/home/CareFinder";
import { CARE_PATHWAY_ICON, PATHWAYS } from "@/lib/care";

export function generateMetadata(): Metadata {
  const page = getPageByPath("/")!;
  return metadataFromSeo(page.seo, { title: page.title, path: "/" });
}

// Generic alt text on the live site ("img", "icon") replaced with descriptions; flagged in the gap report.
const BETTER_ALT: Record<string, string> = {
  "/wp-content/uploads/2023/07/b1.png": "Illustration of a psychologist in conversation with a patient",
};

export default function Home() {
  const h = getHome();
  const site = getSite();
  const doctors = getDoctors();
  const recent = getPosts().slice(0, 20); // the live homepage links to the 20 newest articles
  const posts = recent.slice(0, 6);
  const { hero } = h;
  const [before, after] = hero.headingEmphasis ? hero.heading.split(hero.headingEmphasis) : [hero.heading, ""];

  // Order of the doctors follows the live homepage team list.
  const order = ["Dr. Gorav Gupta", "Dr. Ratnarakshit Ingole"];
  const team = [...doctors].sort((a, b) => {
    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a.role === "psychiatrist" ? -1 : 1) - (b.role === "psychiatrist" ? -1 : 1);
  });

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="on-dark relative isolate overflow-clip bg-hero text-white">
        <div aria-hidden="true" className="orb pointer-events-none absolute hidden md:block -top-32 -left-24 size-[26rem] rounded-full bg-brand-300/20 blur-3xl" />
        <div aria-hidden="true" className="orb pointer-events-none absolute hidden md:block right-[-10rem] bottom-[-12rem] size-[34rem] rounded-full bg-accent-600/15 blur-3xl [animation-delay:-6s]" />
        <div className="container-page relative grid items-center gap-10 pt-12 pb-28 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-36">
          <div>
            <h1 className="inline-flex max-w-xl items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[0.8125rem] font-semibold leading-snug tracking-normal text-brand-50 ring-1 ring-white/15">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent-600 shadow-[0_0_12px_2px_rgb(215_20_31/0.7)]" />
              {h.intro.heading}
            </h1>
            <h2 className="mt-6 text-[length:var(--text-display)] font-extrabold leading-[1.04] tracking-[-0.03em]">
              {before}
              {hero.headingEmphasis && <span className="bg-gradient-to-r from-[#ff8a90] via-white to-brand-200 bg-clip-text text-transparent">{hero.headingEmphasis}</span>}
              {after}
            </h2>
            <p className="mt-6 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-brand-100">{hero.text}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink href="/book-appointment/" variant="accent" size="lg">
                  <Icon name="calendar" /> Book Appointment
                </ButtonLink>
              </Magnetic>
              <TrackedLink event="call_click" eventLocation="hero" href={hero.cta.href} className="inline-flex min-h-14 items-center gap-2 rounded-full border border-white/40 px-7 font-semibold text-white transition hover:border-white hover:bg-white/10">
                <Icon name="phone" /> {hero.cta.label}
              </TrackedLink>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-brand-100">
              {h.about.points.slice(0, 2).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Icon name="check" className="size-4 text-brand-300" /> {p}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <Icon name="shield" className="size-4 text-brand-300" /> NABH accredited
              </li>
            </ul>
          </div>
          <HeroVisual />
        </div>
        {/* soft curved edge into the next section */}
        <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full text-white lg:h-20">
          <path d="M0 80V40C240 0 480 0 720 24s480 56 720 16v40z" fill="currentColor" />
        </svg>
      </section>

      {/* ───────────── Stats ───────────── */}
      <section aria-label="Tulasi Healthcare in numbers" className="relative z-10 -mt-16 lg:-mt-20">
        <div className="container-page">
          <ul className="glass grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-blob)] shadow-[var(--shadow-lift)] lg:grid-cols-4">
            {h.stats.map((s, i) => (
              <Reveal as="li" key={s.label} delay={i * 90} className="bg-white/70 px-5 py-7 text-center sm:py-9">
                <Counter value={s.value} suffix="+" className="block font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-extrabold tracking-tight text-brand-700" />
                <span className="mt-1 block text-sm font-medium text-ink-soft sm:text-base">{s.label}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── Find the right care ───────────── */}
      <section className="pt-16 pb-6 lg:pt-20">
        <div className="container-page">
          <Reveal>
            <CareFinder phone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── Care pathways ───────────── */}
      <section className="py-16 lg:py-24" aria-labelledby="pathways-title">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal as="header" className="max-w-2xl">
              <p className="eyebrow">Our services</p>
              <h2 id="pathways-title" className="mt-3 text-[length:var(--text-h2)] font-bold leading-[1.15] text-ink">One team, every kind of care</h2>
              <p className="mt-4 text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Psychiatrists, psychologists, social workers and paramedical staff working together, from a first consultation to residential rehabilitation.</p>
            </Reveal>
            <ButtonLink href="/services-2/" variant="ghost">All services <Icon name="arrow" className="size-4" /></ButtonLink>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PATHWAYS.map((p, i) => (
              <Reveal as="li" key={p.href} delay={(i % 4) * 80} className={i < 2 ? "lg:col-span-2" : undefined}>
                <TiltCard max={4} className="group h-full rounded-[var(--radius-card)]">
                  <Link href={p.href} className={`flex h-full flex-col rounded-[var(--radius-card)] p-7 ring-1 transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] ${i < 2 ? "bg-gradient-to-br from-brand-600 to-brand-900 text-white ring-transparent on-dark" : "bg-white ring-line"}`}>
                    <span className={`grid size-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${i < 2 ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700"}`}>
                      <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={CARE_PATHWAY_ICON[p.icon]} /></svg>
                    </span>
                    <h3 className={`mt-6 font-display font-bold ${i < 2 ? "text-2xl" : "text-xl text-ink"}`}>{p.title}</h3>
                    <p className={`mt-2 flex-1 leading-relaxed ${i < 2 ? "text-brand-100" : "text-ink-soft"}`}>{p.text}</p>
                    <span className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${i < 2 ? "text-white" : "text-brand-700"}`}>
                      Learn more <Icon name="arrow" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── About ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal variant="left" className="relative">
            <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-50 to-white" />
            {h.about.image && <Image src={h.about.image.src} alt={BETTER_ALT[h.about.image.src] ?? h.about.image.alt} width={904} height={594} sizes="(min-width:1024px) 560px, 100vw" className="h-auto w-full" />}
          </Reveal>
          <div>
            <SectionHeading eyebrow={h.about.eyebrow} title={h.about.heading} />
            <Reveal delay={100}>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">{h.about.text}</p>
              <ul className="mt-6 grid gap-3">
                {h.about.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 rounded-2xl bg-mist px-4 py-3 font-medium text-ink">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              {h.about.more.href && (
                <ButtonLink href={h.about.more.href} variant="primary" className="mt-8">
                  {h.about.more.label}
                  <span className="sr-only"> about Tulasi Healthcare</span> <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                </ButtonLink>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── What sets us apart ───────────── */}
      <section className="bg-sand py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading eyebrow={h.apart.eyebrow} title={h.apart.heading} align="center" />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {h.apart.items.map((it, i) => (
              <Reveal as="li" key={it.title} delay={i * 120} className="h-full">
                <TiltCard className="group h-full rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-soft)] ring-1 ring-line hover:shadow-[var(--shadow-lift)]">
                  <span className="grid size-16 place-items-center rounded-2xl bg-brand-50 ring-1 ring-brand-100 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                    {it.image && <Image src={it.image.src} alt="" width={36} height={36} className="size-9 object-contain" />}
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold text-ink">{it.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-soft">{it.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── Journey (new storytelling section; copy drawn from the live text) ───────────── */}
      <Journey
        eyebrow="Your journey to recovery"
        heading="From the first conversation to life after treatment, we walk with you."
        steps={[
          { title: "Assess", text: "Meet our psychiatrists and clinical psychologists for a careful evaluation." },
          { title: "Treat", text: "Medicinal treatment integrated with psychological intervention, tailored to the patient’s needs." },
          { title: "Heal", text: "Psychosocial rehabilitation, residential care and supported living." },
          { title: "Thrive", text: "Continuous support and daycare programs after in-patient treatment." },
        ]}
      />

      {/* ───────────── Team ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={h.team.eyebrow ?? "Our team"} title={h.team.heading} text={h.team.text} />
            <ButtonLink href="/our-team/" variant="ghost">
              Meet the whole team <Icon name="arrow" className="size-4" />
            </ButtonLink>
          </div>
          <div className="mt-12">
            <TeamWall doctors={team} />
          </div>
        </div>
      </section>

      {/* ───────────── Awards ───────────── */}
      <section className="relative overflow-clip bg-gradient-to-b from-brand-50 to-white py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="News & Awards" title={h.premium} align="center" />
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {h.awards.map((a, i) => (
              <Reveal as="li" key={a.title} delay={(i % 3) * 100}>
                <article className="group flex h-full gap-5 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  {a.image && (
                    <div className="relative w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:w-28">
                      <Image src={a.image.src} alt={a.image.alt} width={225} height={300} sizes="112px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-base font-bold leading-snug text-ink">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <Reveal className="flex items-center gap-5 rounded-[var(--radius-card)] bg-brand-900 p-7 text-white">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                <Icon name="shield" className="size-8" />
              </span>
              <p className="font-display text-lg font-semibold leading-snug">{h.nabh.text}</p>
            </Reveal>
            <Reveal delay={120} className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line">
              <h2 className="font-display text-xl font-bold text-ink">{h.insurance.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.insurance.text}</p>
              <ul className="mt-5 flex flex-wrap items-center gap-6">
                {h.insurance.logos.map((l) => (
                  <li key={l.src}>
                    <Image src={l.src} alt={l.alt} width={150} height={50} className="h-12 w-auto object-contain" />
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── Why choose us (the live page's H1 section) ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Why Tulasi Healthcare</p>
            <p className="mt-3 font-display text-[length:var(--text-h2)] font-bold leading-tight text-ink">Over two decades of psychiatric and rehabilitation care in Delhi-NCR.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/book-appointment/" variant="accent">
                <Icon name="calendar" /> Book Appointment
              </ButtonLink>
              <ButtonLink href="/about-us/" variant="ghost">
                About us <Icon name="arrow" className="size-4" />
              </ButtonLink>
            </div>
          </div>
          <div className="space-y-5">
            {h.intro.blocks.map((b, i) => (
              <Reveal key={b.heading} delay={i * 60} className="rounded-[var(--radius-card)] border border-line bg-white p-7 transition-shadow hover:shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-xl font-bold text-ink">{b.heading}</h3>
                {b.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-ink-soft">{p}</p>
                ))}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Where to find us ───────────── */}
      <section className="bg-sand py-20 lg:py-28" aria-labelledby="locations-title">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal as="header">
            <p className="eyebrow">Locations</p>
            <h2 id="locations-title" className="mt-3 text-[length:var(--text-h2)] font-bold leading-[1.15] text-ink">Care close to home, across Delhi-NCR</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">Psychiatric hospital and rehabilitation centres in Delhi and Gurgaon, with treatment for patients from across India and abroad.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/map-direction/" variant="primary"><Icon name="pin" className="size-4" /> Map &amp; Direction</ButtonLink>
              <ButtonLink href="/international-patient-services/" variant="ghost">International patients <Icon name="arrow" className="size-4" /></ButtonLink>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { city: "Gurgaon", href: "/map-direction/gurgaon/", line: site.contact.address },
              { city: "Delhi", href: "/map-direction/delhi/", line: "Psychiatric hospital and rehabilitation centre in Delhi" },
            ].map((l, i) => (
              <Reveal key={l.city} delay={i * 100}>
                <Link href={l.href} className="group flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent-50 text-accent-700"><Icon name="pin" /></span>
                  <h3 className="mt-5 font-display text-2xl font-bold text-ink">{l.city}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{l.line}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">Directions <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={200} className="sm:col-span-2">
              <div className="rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-line">
                <p className="text-sm font-semibold text-ink">Rehabilitation centres</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {site.footerColumns.flatMap((c) => c.links).filter((l, i, all) => /rehabilitation cent(re|er) in/i.test(l.label) && all.findIndex((x) => x.href === l.href) === i).map((l) => (
                    <li key={l.href}><Link href={l.href ?? "/"} className="inline-flex min-h-9 items-center rounded-full bg-sand px-3.5 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700">{l.label.replace(/Rehabilitation Cent(re|er) in /i, "")}</Link></li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="bg-mist py-20 lg:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="FAQ" title={h.faq.heading} text={h.faq.text} />
          <Reveal className="space-y-3">
            {h.faq.items.map((f, i) => (
              <details key={f.q} className="group rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-line open:ring-brand-200" open={i === 0}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-display text-[1.0625rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <h3>{f.q}</h3>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-300 group-open:rotate-45">
                    <Icon name="plus" className="size-4" />
                  </span>
                </summary>
                <p className="px-6 pb-6 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
        <JsonLd data={faqSchema(h.faq.items)} />
      </section>

      {/* ───────────── Blog ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Blog & News" title={h.blog.heading} text={h.blog.text} />
            <ButtonLink href="/blog/" variant="ghost">
              All articles <Icon name="arrow" className="size-4" />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 3) * 100}>
                <PostCard p={p} />
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-12 rounded-[var(--radius-card)] border border-line p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-ink">More articles</h3>
            <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {recent.slice(6).map((p) => (
                <li key={p.id}>
                  <Link href={p.path} className="group flex items-start gap-2 text-ink-soft hover:text-brand-700">
                    <Icon name="chevron" className="mt-1 size-4 shrink-0 text-brand-300 transition-transform group-hover:translate-x-0.5" />
                    <span>{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────────── Patient resources ───────────── */}
      <section className="pb-20 lg:pb-28">
        <div className="container-page">
          <Reveal className="relative overflow-clip rounded-[var(--radius-blob)] bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white sm:p-12">
            <div aria-hidden="true" className="orb absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <p className="eyebrow !text-brand-200">{h.resources.subheading}</p>
                <h2 className="mt-2 font-display text-[length:var(--text-h2)] font-bold">{h.resources.heading}</h2>
                {h.resources.items.map((it) => (
                  <h3 key={it.title} className="mt-4 font-display text-lg font-semibold text-brand-100">{it.title}</h3>
                ))}
                <p className="mt-2 leading-relaxed text-brand-100">{h.resources.text}</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {h.resources.links.map((l) => (
                  <li key={l.href}>
                    <TrackedLink event="ebook_download" eventLocation={l.label} href={l.href} className="glass-dark flex h-full min-h-14 items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition hover:bg-white/15" download>
                      <Icon name="download" className="size-5 shrink-0" /> {l.label}
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── Testimonials ───────────── */}
      <section className="bg-mist py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="Testimonials" title={h.testimonials.heading} text={h.testimonials.text} align="center" />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {h.testimonials.items.map((t, i) => (
              <Reveal as="li" key={t.name} delay={i * 120}>
                <figure className="flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line">
                  <Icon name="quote" className="size-8 text-brand-300" />
                  <blockquote className="mt-4 flex-1 leading-relaxed text-ink-soft">{t.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-brand-600 font-display font-bold text-white">
                      {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                    <h3 className="font-display font-semibold text-ink">{t.name}</h3>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
          <p className="mt-10 text-center text-sm text-ink-soft">
            Questions about treatment? <Link href="/faqs/" className="font-semibold text-brand-700 underline underline-offset-2">Read our FAQs</Link> or call{" "}
            <a href={site.contact.phoneHref} className="font-semibold text-brand-700 underline underline-offset-2">{site.contact.phoneDisplay}</a>.
          </p>
        </div>
      </section>
    </>
  );
}
