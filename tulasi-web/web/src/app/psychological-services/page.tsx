// /psychological-services/: what our clinical psychologists offer, led by psychometric testing.
import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, getSite } from "@/lib/content";
import { PSYCH_SERVICES } from "@/lib/care";
import { PageHero } from "@/components/PageHero";
import { Arrow, Icon } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: { absolute: "Psychological Services and Psychometric Testing - Tulasi Healthcare" },
  description: "Psychometric testing, neuropsychological and developmental assessments, therapy and counselling with RCI-registered clinical psychologists at Tulasi Healthcare, Delhi NCR.",
  alternates: { canonical: absoluteUrl("/psychological-services/") },
};

const STEPS = [
  { title: "Talk to us", text: "Tell our team what you need, or book a first session with a psychologist." },
  { title: "Assessment", text: "The psychologist chooses and runs the right tests or sessions for the question you have." },
  { title: "Report and feedback", text: "You get a clear written report and a feedback session to talk it through." },
];

export default function PsychologicalServices() {
  const site = getSite();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };
  return (
    <>
      <PageHero
        compact
        kicker="Clinical psychology"
        title="Psychological services"
        lead="Assessment, testing, therapy and counselling with our clinical psychologists. Psychometric testing is available for children, teens and adults."
        crumbs={[{ name: "Home", path: "/" }, { name: "Psychological services", path: "/psychological-services/" }]}
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/book-appointment/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700">Book with a psychologist <Arrow /></Link>
          <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
        </div>
      </PageHero>

      <section className="py-12 sm:py-16" aria-label="Our psychological services">
        <div className="container-page">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PSYCH_SERVICES.map((s) => (
              <li key={s.id} id={s.id} className="scroll-mt-28 rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)]">
                <h2 className="font-display text-[1.25rem] leading-snug font-semibold tracking-[-0.01em] text-ink">{s.title}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-ink">
                  {s.covers.map((c) => (
                    <li key={c} className="flex items-start gap-2"><Icon name="check" className="mt-1 size-3.5 shrink-0 text-sage-600" strokeWidth={2.4} /> {c}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-ink-soft"><span className="font-semibold text-ink">Suitable for:</span> {s.who}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-mist py-12 sm:py-16" aria-label="How it works">
        <div className="container-page">
          <h2 className="text-[length:var(--text-h2)] leading-tight font-semibold tracking-[-0.02em] text-ink">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 font-semibold text-white" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-[62ch] text-sm leading-relaxed text-ink-soft">Tests are chosen by the psychologist after a first conversation. Reports are shared only with you, or with the school or employer you ask us to send them to.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/book-appointment/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Book an appointment <Arrow /></Link>
            <Link href="/find-a-specialist/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">Find the right specialist</Link>
          </div>
        </div>
      </section>
    </>
  );
}
