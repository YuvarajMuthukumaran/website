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
import { REVIEWS } from "@/components/ReviewGrid";
import { ReviewCarousel } from "@/components/ReviewCarousel";
import { LeafVine } from "@/components/motion/LeafVine";
import { TrackedLink } from "@/components/layout/TrackedLink";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { FinderBar } from "@/components/FinderBar";
import { LocationsShowcase } from "@/components/locations/LocationsShowcase";
import { PASTELS } from "@/components/team";
import { CITIES, CLINICS, HOSPITALS, locationSummary } from "@/lib/locations";
import { HomeHeroSlideshow } from "@/components/HomeHeroSlideshow";
import { InstagramVideos } from "@/components/InstagramVideos";
import { StatValue } from "@/components/StatValue";
import { TrustPromise } from "@/components/TrustPromise";
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
const HELP_HINT: Record<string, string> = {
  Anxiety: "Worry, panic and fear",
  Depression: "Low mood and hopelessness",
  "Bipolar disorder": "Mood swings, highs and lows",
  OCD: "Repeating thoughts and rituals",
  Addiction: "Alcohol, drugs, nicotine, gaming",
  "Child & teen mental health": "Including ADHD and autism",
  "LGBTQ+ support": "Respectful, private care",
};
// Seven on the home page (the rest are in the Conditions menu and on /conditions/): ADHD and autism sit under child and teen care, all addictions under one.
const HELP_WITH = ["Anxiety", "Depression", "Bipolar disorder", "OCD", "Addiction", "Child & teen mental health", "LGBTQ+ support"];

/** Photo for a condition tile: `public/conditions/<slug>.webp` (see SOURCES.md there). Without a file the tile shows its icon. */
const conditionSlug = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const conditionPhoto = (label: string) => ["webp", "jpg", "jpeg", "png"].map((e) => `/conditions/${conditionSlug(label)}.${e}`).find((p) => existsSync(path.join(process.cwd(), "public", p))) ?? null;

const sectionPad = "py-10 sm:py-12 lg:py-14";

/** Hearts, stars and smiles that drift up slowly behind the reviews (decorative, hidden from screen readers). */
const REVIEW_FLOATERS: { e: string; left: string; size: string; dur: string; delay: string }[] = [
  { e: "💙", left: "4%", size: "1.6rem", dur: "16s", delay: "0s" },
  { e: "⭐", left: "11%", size: "1.2rem", dur: "19s", delay: "4s" },
  { e: "😊", left: "19%", size: "1.7rem", dur: "17s", delay: "9s" },
  { e: "❤️", left: "27%", size: "1.3rem", dur: "21s", delay: "2s" },
  { e: "🙏", left: "36%", size: "1.4rem", dur: "18s", delay: "11s" },
  { e: "💚", left: "45%", size: "1.5rem", dur: "20s", delay: "6s" },
  { e: "⭐", left: "54%", size: "1.1rem", dur: "16s", delay: "13s" },
  { e: "😌", left: "62%", size: "1.6rem", dur: "22s", delay: "1s" },
  { e: "💙", left: "70%", size: "1.3rem", dur: "18s", delay: "8s" },
  { e: "😊", left: "78%", size: "1.5rem", dur: "20s", delay: "3s" },
  { e: "❤️", left: "86%", size: "1.7rem", dur: "17s", delay: "10s" },
  { e: "⭐", left: "93%", size: "1.2rem", dur: "19s", delay: "5s" },
];

type BubbleConcern = { label: string; href: string };
/** Angles (degrees) of the seven circles on the oval, mirrored left and right so no label touches a neighbour. */
const ORBIT_DEG = [-90, -50, 10, 62, 118, 170, 230];

/** One condition as a round photo with its name below. */
function Bubble({ c, photo, size }: { c: BubbleConcern; photo?: string | null; size: string }) {
  return (
    <Link href={c.href} className="bubble group flex flex-col items-center gap-3 text-center">
      <span className={`bubble-ring relative grid ${size} place-items-center rounded-full bg-sage-50 text-ink/75 shadow-[0_0_0_4px_#fff,0_0_0_5px_var(--color-line)] group-hover:shadow-[0_0_0_4px_#fff,0_0_0_5px_var(--color-brand-300),0_18px_32px_-14px_rgb(23_34_44/0.5)]`}>
        <span className="absolute inset-0 overflow-hidden rounded-full">
          {photo ? <Image src={photo} alt="" fill sizes="120px" className="bubble-img object-cover" /> : <Icon name="heart" className="m-auto size-9" />}
        </span>
      </span>
      <span className="bubble-label max-w-[11ch] text-[0.9375rem] leading-snug font-semibold text-ink group-hover:text-brand-700 sm:max-w-[14ch] sm:text-base lg:max-w-[12ch]">{c.label}</span>
    </Link>
  );
}

function AllBubble({ size, center }: { size: string; center?: boolean }) {
  return (
    <Link href="/conditions/" className="bubble group flex flex-col items-center gap-3 text-center">
      <span className={`bubble-ring bubble-pulse relative grid ${size} place-items-center rounded-full bg-brand-600 text-white shadow-[0_0_0_5px_#fff,0_0_0_6px_var(--color-brand-200)] group-hover:bg-brand-700`}>
        <span className="grid justify-items-center gap-1">
          <span className={`font-display font-semibold tracking-[-0.02em] ${center ? "text-4xl" : "text-2xl"}`}>A–Z</span>
          {center && <span className="max-w-[12ch] text-xs leading-tight text-white/85">Browse or search</span>}
        </span>
      </span>
      <span className="bubble-label text-[0.9375rem] leading-snug font-semibold text-brand-700 sm:text-base">All conditions</span>
    </Link>
  );
}

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
  const cashless = h.insurance.text.match(/empanelled with (.+?) for cashless/i)?.[1] ?? null;
  const siteFaqs = h.faq.items.map((f) => ({ q: polishText(f.q), a: polishText(f.a) }));
  // The questions people are afraid to ask come first.
  const trustFaqs = [
    { q: "Will I be judged for coming?", a: "No. Our doctors and counsellors treat mental illness and addiction as health conditions, like diabetes or asthma. You will be listened to with respect, whatever brought you here." },
    { q: "Do I have to be admitted?", a: "No. Many people are seen as outpatients in an OPD consultation. Admission is suggested only when the doctor feels it is clinically needed, and you and your family decide together with them." },
    { q: "Will my family or employer be told?", a: "Your care is confidential. We share information with relatives only with the patient’s agreement, apart from situations where the law or someone’s safety requires otherwise." },
    { q: "Will I be pushed into expensive treatment?", a: `We explain every option and its cost before you decide. Consultation fees are shown on each doctor’s profile, and you can call ${phone.display} to ask anything first.` },
  ];
  const moreFaqs = [
    { q: "How do I book an appointment?", a: `Choose a doctor and a time online, or call ${phone.display}. If you are not sure who to see, we will help you choose.` },
    { q: "Do you accept insurance?", a: `${cashless ? `We are empanelled with ${cashless} for cashless treatment. ` : ""}Not sure what your policy covers? Call ${phone.display} and we will check with you.` },
    { q: "Do you treat children and teenagers?", a: "Yes. Our child and adolescent services help with ADHD, autism, anxiety, and behavioural and emotional problems in children and teens." },
    { q: "Can I talk to someone before I book?", a: `Yes. Call ${phone.display}, chat with Tulasi on this page, or answer three quick questions to see who to see first.` },
  ];
  const faqItems = [...trustFaqs, ...siteFaqs.slice(0, 4), ...moreFaqs];


  const concerns = HELP_WITH.map((l) => CONCERNS.find((c) => c.label === l)).filter((c): c is NonNullable<typeof c> => !!c);
  const services = PATHWAYS.slice(0, 9);
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
              A warm, caring place for you and your family. Our doctors and counsellors listen first, and walk with you through every step of your recovery.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/book-appointment/" size="lg" className="w-full sm:w-auto">Book an appointment</ButtonLink>
              <OpenChatButton className={btnClass("line", "lg", "w-full sm:w-auto")}>Talk to Tulasi</OpenChatButton>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Or call us on{" "}
              <TrackedLink event="call_click" eventLocation="hero" href={phone.href} className="font-semibold text-ink underline decoration-line underline-offset-4 hover:text-brand-700">{phone.display}</TrackedLink>
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft" aria-label="What to expect">
              {["Private and confidential", "No judgement", "You decide the pace"].map((x) => (
                <li key={x} className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-sage-600" strokeWidth={2.4} /> {x}</li>
              ))}
            </ul>
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
                  <StatValue value={value} />
                  {unit && <span className="stats-unit">{unit}</span>}
                </p>
                <p className="stats-label">{label}</p>
              </li>
            ))}
          </ul>
          <p className="stats-footnote">Figures as provided by Tulasi Healthcare.</p>
        </div>
      </section>


      {/* ═════════════ What would you like help with ═════════════ */}
      <section id="help" className={sectionPad}>
        <div className="container-page">
          <SectionHeading title="What would you like help with?" text="Choose what feels closest. Each page explains how we treat it." />
          {/* Phones and tablets: a tidy grid of circles. */}
          <ul className="mt-10 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 lg:hidden">
            {concerns.map((c, i) => (
              <Reveal as="li" key={c.href} delay={(i % 4) * 40}>
                <Bubble c={c} photo={photos[c.label]} size="size-[5.5rem] sm:size-28" />
              </Reveal>
            ))}
            <Reveal as="li" delay={(concerns.length % 4) * 40}>
              <AllBubble size="size-[5.5rem] sm:size-28" />
            </Reveal>
          </ul>

          {/* Laptops: the circles sit on an oval around "All conditions". */}
          <div className="relative mx-auto mt-6 hidden h-[35rem] max-w-5xl lg:block">
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-[68%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-brand-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <AllBubble size="size-40" center />
            </div>
            <ul>
              {concerns.map((c, i) => {
                const a = (ORBIT_DEG[i] ?? -90 + (i * 360) / concerns.length) * (Math.PI / 180);
                return (
                  <li key={c.href} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 36 * Math.sin(a)}%` }}>
                    <Bubble c={c} photo={photos[c.label]} size="size-[7.25rem]" />
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-12 rounded-[1.5rem] bg-gradient-to-r from-sage-50 via-white to-brand-50 p-5 shadow-[inset_0_0_0_1px_var(--color-sage-100)] sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="lg:max-w-xs">
              <p className="font-display text-[1.375rem] leading-snug font-semibold tracking-[-0.015em] text-ink">Not sure where to start?</p>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">That is completely normal. Choose the easiest way in, and we will take it from there.</p>
              <Link href="/services-2/" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">Browse all treatments <Arrow className="size-4" /></Link>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3 lg:mt-0 lg:max-w-[44rem] lg:flex-1">
              {[
                { icon: "psychiatry", title: "Find the right specialist", sub: "Three quick questions", href: "/find-a-specialist/" },
                { icon: "assessment", title: "Free 2-minute check-in", sub: "Private, no sign-up", href: "/mental-health-check/" },
              ].map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="help-card group flex h-full items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_0_0_1px_var(--color-line)]">
                    <span className="help-icon icon-tile icon-tile-blue size-11 shrink-0"><BrandIcon name={h.icon} className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] leading-snug font-semibold text-ink group-hover:text-brand-700">{h.title}</span>
                      <span className="block text-xs text-ink-soft">{h.sub}</span>
                    </span>
                    <span className="help-arrow shrink-0 text-brand-600"><Arrow className="size-4" /></span>
                  </Link>
                </li>
              ))}
              <li>
                <OpenChatButton className="help-card group flex h-full w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-[0_0_0_1px_var(--color-line)]">
                  <span className="help-icon icon-tile icon-tile-blue size-11 shrink-0"><BrandIcon name="therapy" className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] leading-snug font-semibold text-ink group-hover:text-brand-700">Ask Tulasi</span>
                    <span className="block text-xs text-ink-soft">Chat with our assistant</span>
                  </span>
                  <span className="help-arrow shrink-0 text-brand-600"><Arrow className="size-4" /></span>
                </OpenChatButton>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═════════════ Our promise ═════════════ */}
      <section aria-label="Our promise to you" className="cv overflow-hidden bg-gradient-to-b from-white via-sage-50/50 to-white py-14 sm:py-16 lg:py-20">
        <div className="container-page">
          <TrustPromise phone={phone} />
        </div>
      </section>

      {/* ═════════════ Services ═════════════ */}
      <section className={`cv ${sectionPad} bg-mist`}>
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="One team, every kind of care" text="Psychiatrists, psychologists, social workers and paramedical staff working together, from a first consultation to residential rehabilitation." />
            <div className="hidden sm:block"><ButtonLink href="/services-2/" variant="line">All services <Arrow /></ButtonLink></div>
          </div>
          {/* The OPD banner: the way most people start. Slim, so the rest stays in view. */}
          {services[0] && (
            <Reveal className="mt-6">
              <Link href={services[0].href} className="group relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] bg-brand-600 p-5 text-white shadow-[0_18px_36px_-26px_rgb(15_40_71/0.7)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                <span aria-hidden="true" className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-white/10" />
                <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><BrandIcon name={PATHWAY_ICON[services[0].icon]} className="size-6" /></span>
                <span className="relative min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display text-xl leading-snug font-semibold tracking-[-0.015em]">{services[0].title}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">Most people start here</span>
                  </span>
                  <span className="mt-1 block max-w-[70ch] text-[0.9375rem] leading-relaxed text-white/85">{services[0].text}</span>
                </span>
                <span className="relative inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-transform duration-300 group-hover:translate-x-0.5">Book an OPD visit <Arrow className="size-4" /></span>
              </Link>
            </Reveal>
          )}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(1).map((p, i) => (
              <Reveal as="li" key={p.href} delay={(i % 4) * 50}>
                <Link href={p.href} className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white p-4 shadow-[0_0_0_1px_var(--color-line)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-brand-200),var(--shadow-lift)]">
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-600 transition-transform duration-500 group-hover:scale-x-100" />
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl text-brand-700 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: PASTELS[(i + 1) % PASTELS.length] }}><BrandIcon name={PATHWAY_ICON[p.icon]} className="size-5" /></span>
                    <h3 className="font-display text-base leading-snug font-semibold tracking-[-0.01em] text-ink group-hover:text-brand-700">{p.title}</h3>
                  </span>
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
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

      {/* ═════════════ From the first call to life with treatment (one section) ═════════════ */}
      <section aria-labelledby="first-visit" className={`cv ${sectionPad} bg-mist`}>
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From your first call to life with treatment" text="Starting is often the hardest part. Hover over a number to see how it works, so there are no surprises." id="first-visit" className="max-w-3xl" />
          <div className="relative mt-10">
            <LeafVine />
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {[
                ["Book or call", `Choose a doctor and a time online, or call ${phone.display}. If you are not sure who to see, we will help you choose.`],
                ["Meet your specialist", "A first consultation with a psychiatrist or psychologist usually lasts 20 to 45 minutes. Bring any earlier reports and a list of current medicines."],
                ["Agree a plan", "Your doctor explains what they found and suggests the next steps: therapy, medicines, follow-up visits, or admission if it is needed. You decide at your own pace."],
                ["Recover, with support", "Medicine and therapy, tailored to the person. Where needed: psychosocial rehabilitation, residential care and supported living, then continued support and day-care programmes after inpatient treatment."],
              ].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70} className="hiw-step relative">
                  <button type="button" className="hiw-num grid size-10 place-items-center rounded-full bg-white font-display text-sm font-semibold text-sage-700 shadow-[inset_0_0_0_1px_var(--color-sage-200)] transition-[background-color,color,box-shadow] duration-300" aria-describedby={`hiw-${i}`}>{i + 1}</button>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{t}</h3>
                  <p id={`hiw-${i}`} className="hiw-desc max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink-soft">{d}</p>
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

      {/* ═════════════ Videos from Instagram ═════════════ */}
      <section aria-label="Videos from Instagram" className="relative overflow-hidden bg-gradient-to-b from-mist via-white to-mist py-10 sm:py-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-[#e4ddf6] opacity-70 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-[#d6e8f7] opacity-70 blur-3xl" />
        <div className="container-page relative">
          <InstagramVideos />
        </div>
      </section>

      {/* ═════════════ Patient voices ═════════════ */}
      <section aria-labelledby="reviews-heading" className="cv relative overflow-hidden py-8 sm:py-10" style={{ background: "linear-gradient(135deg, #0f2847 0%, #0b1d40 50%, #102a5a 100%)" }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {REVIEW_FLOATERS.map((f, i) => (
            <span key={i} className="rv-float" style={{ left: f.left, fontSize: f.size, animationDuration: f.dur, animationDelay: f.delay }}>{f.e}</span>
          ))}
        </div>
        <div className="container-page relative z-10">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal as="header">
              <p className="eyebrow mb-2" style={{ color: "rgb(163 200 176)" }}>What patients say</p>
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
                      <span key={i} className="relative inline-block size-3.5" aria-hidden="true">
                        <svg viewBox="0 0 16 16" className={`size-3.5 ${i < 4 ? "fill-amber-400" : "fill-white/25"}`}>
                          <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
                        </svg>
                        {i === 4 && (
                          <span className="absolute inset-y-0 left-0 w-[70%] overflow-hidden">
                            <svg viewBox="0 0 16 16" className="size-3.5 max-w-none fill-amber-400">
                              <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
                            </svg>
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="ml-1 text-sm font-bold text-white"><span className="sr-only">Rated </span>4.7<span className="sr-only"> out of 5</span></span>
                  </div>
                  <p className="mt-0.5 text-[0.7rem] font-medium" style={{ color: "rgb(255 255 255 / 0.5)" }}>Verified Google Reviews</p>
                </div>
              </div>
            </Reveal>
          </div>
          <ReviewCarousel reviews={REVIEWS} />
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
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <SectionHeading title="Questions we are often asked" text="Short answers to what families and patients ask us most." />
            <Link href="/faqs/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">All questions <Arrow className="size-4" /></Link>
          </div>
          <Reveal className="mt-6 grid gap-x-8 rounded-[var(--radius-card)] bg-white px-5 shadow-[0_0_0_1px_var(--color-line)] sm:px-7 lg:grid-cols-2 lg:gap-x-12">
            {faqItems.map((f, i) => (
              <details key={f.q} open={i === 0} className="acc group border-b border-line last:border-b-0 lg:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3">
                  <h3 className="font-display text-[0.9375rem] leading-snug font-semibold text-ink sm:text-base">{f.q}</h3>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mist text-ink-soft transition-transform duration-300 group-open:rotate-45">
                    <Icon name="plus" className="size-3.5" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-4 text-[0.9375rem] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
        <JsonLd data={faqSchema(faqItems)} />
      </section>

      {/* ═════════════ Closing step ═════════════ */}
      <section className={`cv ${sectionPad}`}>
        <div className="container-page">
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sage-50 via-white to-brand-50 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
            <span aria-hidden="true" className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-[#d9efdd] opacity-60 blur-3xl" />
            <span aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-[#d6e8f7] opacity-70 blur-3xl" />
            <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:p-14">
              <div>
                <p className="eyebrow">We are here for you</p>
                <h2 className="mt-3 max-w-[18ch] text-[length:var(--text-display)] leading-[1.1] font-semibold tracking-[-0.025em] text-ink">You don’t have to do this alone</h2>
                <p className="mt-4 max-w-[52ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Book a consultation with our psychiatrists and psychologists, or call us. We’ll help you take the first step, at your own pace.</p>
                <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <ButtonLink href="/book-appointment/" size="lg">Book an appointment</ButtonLink>
                  <TrackedLink event="call_click" eventLocation="home_cta" href={phone.href} className={btnClass("line", "lg")}>
                    <Icon name="phone" className="size-4 text-sage-600" /> {phone.display}
                  </TrackedLink>
                </div>
                <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[0.9375rem] text-ink">
                  {["Private and confidential", "No sign-up to start", "Your family can join in"].map((x) => (
                    <li key={x} className="flex items-center gap-2"><Icon name="check" className="size-4 text-sage-600" strokeWidth={2.4} /> {x}</li>
                  ))}
                </ul>
                <p className="mt-6 text-[0.9375rem] text-ink-soft">Not sure who to see? <Link href="/find-a-specialist/" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900">Answer three quick questions</Link>, or take the <Link href="/mental-health-check/" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900">free 2-minute check-in</Link>.</p>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_30px_60px_-34px_rgb(23_34_44/0.55)]">
                  <Image src="/hero/hero-grandma.webp" alt="A grandmother and her granddaughter smiling together" fill sizes="(min-width:1024px) 420px, 0px" className="object-cover object-[35%_50%]" />
                </div>
                <div className="absolute -bottom-4 -left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_36px_-20px_rgb(23_34_44/0.5)]">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon name="phone" className="size-5" /></span>
                  <span>
                    <span className="block text-xs text-ink-soft">Talk to our care team</span>
                    <span className="block font-display text-base font-semibold text-ink">{phone.display}</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <FinderBar />
    </>
  );
}
