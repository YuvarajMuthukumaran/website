// /addiction-treatment/: one page for every addiction (alcohol, drugs, nicotine, digital and gaming).
// Each section is a short summary of what Tulasi's existing pages say, with a link to the full page.
import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, getSite } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { Arrow, Icon } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: { absolute: "Addiction Treatment: Alcohol, Drugs, Nicotine and Gaming - Tulasi Healthcare" },
  description: "One place for alcohol, drug, nicotine and digital addiction treatment at Tulasi Healthcare, Delhi NCR: inpatient and outpatient care, therapy and relapse prevention.",
  alternates: { canonical: absoluteUrl("/addiction-treatment/") },
};

type Section = { id: string; title: string; text: string; links: { label: string; href: string }[] };

const SECTIONS: Section[] = [
  {
    id: "alcohol",
    title: "Alcohol addiction",
    text: "Treatment for alcohol dependence, with both inpatient and outpatient care, and support for problems the drinking has caused, including liver disease.",
    links: [
      { label: "Alcohol addiction treatment", href: "/deaddiction-centre/alcohol-addiction/" },
      { label: "Problem drinking", href: "/treatment-of-problem-drinking/" },
      { label: "Alcohol use disorder", href: "/alcohol-use-disorder-treatment/" },
      { label: "Alcohol-related liver disease", href: "/liver-cirrhosis/" },
    ],
  },
  {
    id: "drugs",
    title: "Drug addiction",
    text: "Specialised treatment for drugs and other substances, delivered by psychiatrists and psychologists, with rehabilitation to recover from the illness.",
    links: [
      { label: "Drug addiction treatment", href: "/drug-addiction-treatment-in-delhi-gurgaon-and-ncr/" },
      { label: "Heroin addiction", href: "/deaddiction-centre/heroin-addiction/" },
      { label: "Cocaine addiction", href: "/deaddiction-centre/cocaine-addiction/" },
      { label: "Cannabis (marijuana) addiction", href: "/deaddiction-centre/marijuana-treatment/" },
      { label: "Drug screening tests", href: "/drug-screening-tests/" },
    ],
  },
  {
    id: "nicotine",
    title: "Nicotine and smoking",
    text: "Help to quit smoking and tobacco, including dTMS therapy delivered by trained staff.",
    links: [
      { label: "Smoking cessation", href: "/smoking-cessation/" },
      { label: "Deep TMS", href: "/deep-tms-treatment/" },
    ],
  },
  {
    id: "digital",
    title: "Digital and gaming addiction",
    text: "Treatment through behavioural therapies such as cognitive behavioural therapy (CBT), and other psychotherapies, for people who cannot cut down on screens or games.",
    links: [
      { label: "Digital and gaming addiction", href: "/digital-and-gaming-addiction/" },
      { label: "Cognitive behavioural therapy", href: "/cbt-behavioural-therapy/" },
    ],
  },
];

const ALSO = [
  { label: "Dual diagnosis", text: "When an addiction and a mental illness occur together.", href: "/dual-diagnosis/" },
  { label: "Relapse prevention", text: "Aftercare to help recovery last.", href: "/relapse-prevention/" },
  { label: "Rehabilitation centre", text: "Residential care and psychosocial rehabilitation.", href: "/rehabilitation-centre/" },
  { label: "Family therapy", text: "Support for the people who love someone in recovery.", href: "/family-therapy/" },
];

export default function AddictionTreatment() {
  const site = getSite();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };
  return (
    <>
      <PageHero
        compact
        kicker="De-addiction"
        title="Addiction treatment"
        lead="Alcohol, drugs, nicotine, screens and games. Whatever it is, treatment starts with a conversation, and nobody is judged for asking."
        crumbs={[{ name: "Home", path: "/" }, { name: "Conditions", path: "/conditions/" }, { name: "Addiction", path: "/addiction-treatment/" }]}
      >
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Jump to a type of addiction">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:text-brand-700">{s.title}</a>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/book-appointment/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Book an appointment <Arrow /></Link>
          <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
        </div>
      </PageHero>

      <section className="py-12 sm:py-16" aria-label="Types of addiction we treat">
        <div className="container-page grid gap-5 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <article key={s.id} id={s.id} className="scroll-mt-28 rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)]">
              <h2 className="font-display text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] text-ink">{s.title}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
              <ul className="mt-4 grid gap-1">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-brand-700 transition-colors hover:bg-brand-50">
                      {l.label}
                      <Icon name="arrow" className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-mist py-12 sm:py-16" aria-label="Related care">
        <div className="container-page">
          <h2 className="text-[length:var(--text-h2)] leading-tight font-semibold tracking-[-0.02em] text-ink">Care that goes with recovery</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALSO.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="group block h-full rounded-[var(--radius-card)] bg-white p-5 shadow-[0_0_0_1px_var(--color-line)] transition-shadow hover:shadow-[0_0_0_1px_var(--color-brand-300)]">
                  <span className="block font-display text-lg font-semibold text-ink group-hover:text-brand-700">{a.label}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[62ch] text-sm leading-relaxed text-ink-soft">Not sure which one fits? <Link href="/find-a-specialist/" className="font-semibold text-brand-700 underline underline-offset-2">Answer three questions</Link> or call {phone.display}. Admission and outpatient care both start with a short assessment.</p>
        </div>
      </section>
    </>
  );
}
