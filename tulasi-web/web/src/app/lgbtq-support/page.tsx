// /lgbtq-support/: a welcoming page for LGBTQ+ people and their families.
import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, getSite } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { Arrow, Icon } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: { absolute: "LGBTQ+ Mental Health Support - Tulasi Healthcare" },
  description: "Respectful, confidential mental health care for LGBTQ+ people and their families at Tulasi Healthcare, Delhi NCR.",
  alternates: { canonical: absoluteUrl("/lgbtq-support/") },
};

const CONCERNS = [
  { title: "Stress about coming out", text: "Deciding when and how to tell family, friends or colleagues, and coping with the wait." },
  { title: "Family and social pressure", text: "Pressure to marry, hide who you are, or live up to expectations that do not fit." },
  { title: "Anxiety and low mood", text: "Constant worry, loneliness, or feeling down, which are common when you feel unsafe or unseen." },
  { title: "Relationships", text: "Support for couples and partners, and for families learning to understand a loved one." },
  { title: "Identity questions", text: "A calm space to think things through at your own pace, with no pressure to label yourself." },
  { title: "Bullying, discrimination and trauma", text: "Healing after harassment, rejection or other painful experiences." },
];

const WHAT_TO_EXPECT = [
  "A private, respectful conversation. You decide what to share and when.",
  "A psychologist or psychiatrist who listens first, without judgement.",
  "Help with the problem you came for, such as anxiety, depression, stress or relationships.",
  "Support for your family too, if you want them involved.",
];

export default function LgbtqSupport() {
  const site = getSite();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };
  return (
    <>
      <PageHero
        compact
        kicker="Everyone is welcome"
        title="LGBTQ+ mental health support"
        lead="Respectful, confidential care for LGBTQ+ people and the families who love them. Come as you are."
        crumbs={[{ name: "Home", path: "/" }, { name: "Conditions", path: "/conditions/" }, { name: "LGBTQ+ support", path: "/lgbtq-support/" }]}
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/book-appointment/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Book a private consultation <Arrow /></Link>
          <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
        </div>
      </PageHero>

      <section className="py-12 sm:py-16" aria-label="What we can help with">
        <div className="container-page">
          <h2 className="text-[length:var(--text-h2)] leading-tight font-semibold tracking-[-0.02em] text-ink">What you can talk to us about</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONCERNS.map((c) => (
              <li key={c.title} className="rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)]">
                <h3 className="font-display text-lg font-semibold text-ink">{c.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-mist py-12 sm:py-16" aria-label="What to expect">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-[length:var(--text-h2)] leading-tight font-semibold tracking-[-0.02em] text-ink">What to expect</h2>
            <ul className="mt-6 space-y-3">
              {WHAT_TO_EXPECT.map((w) => (
                <li key={w} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-ink">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-sage-600" strokeWidth={2.4} /> {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)]">
            <p className="font-display text-lg font-semibold text-ink">Not sure where to start?</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">Three quick questions suggest who to see first, and nothing you answer is stored. Or call us and ask for a private first conversation.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/find-a-specialist/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Find the right specialist <Arrow /></Link>
              <Link href="/mental-health-check/" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">Free 2-minute check-in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
