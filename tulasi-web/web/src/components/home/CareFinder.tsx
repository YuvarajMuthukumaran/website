"use client";
// "What would you like help with?": the fastest route to the right page.
// - Concern chips are real links to the existing treatment pages, all present
//   in the server HTML (choosing "who" only re-orders and highlights them).
// - "Guide me" is a 3-step matcher: who → what → how much support, ending in
//   a recommendation and a booking link pre-filtered to the right specialists.
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CONCERNS, INTENSITY, WHO, type Who } from "@/lib/care";
import { Icon } from "@/components/ui/primitives";

export function CareFinder({ phone }: { phone: { display: string; href: string } }) {
  const [who, setWho] = useState<Who>("self");
  const [guide, setGuide] = useState(false);
  const ordered = useMemo(() => [...CONCERNS].sort((a, b) => Number(b.who.includes(who)) - Number(a.who.includes(who))), [who]);

  return (
    <div className="rounded-[var(--radius-blob)] bg-white p-6 shadow-[var(--shadow-lift)] ring-1 ring-line sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Find the right care</p>
          <h2 className="mt-2 font-display text-[length:var(--text-h2)] font-bold leading-tight text-ink">What would you like help with?</h2>
        </div>
        <div role="group" aria-label="Who is the care for?" className="flex flex-wrap gap-2 rounded-full bg-sand p-1.5">
          {WHO.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={who === w.id}
              onClick={() => setWho(w.id)}
              className={clsx("min-h-10 rounded-full px-4 text-sm font-semibold transition-all duration-300", who === w.id ? "bg-brand-600 text-white shadow-[var(--shadow-soft)]" : "text-ink-soft hover:text-ink")}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap gap-2.5">
        {ordered.map((c) => {
          const match = c.who.includes(who);
          return (
            <li key={c.href + c.label} className={clsx("transition-all duration-500", match ? "opacity-100" : "opacity-45")}>
              <Link
                href={c.href}
                className={clsx(
                  "group inline-flex min-h-12 items-center gap-2 rounded-full border px-5 font-medium transition-all duration-300 hover:-translate-y-0.5",
                  match ? "border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-600 hover:bg-brand-600 hover:text-white" : "border-line bg-white text-ink-soft hover:border-brand-300"
                )}
              >
                {c.label}
                <Icon name="arrow" className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="button" onClick={() => setGuide((g) => !g)} aria-expanded={guide} aria-controls="care-guide" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white transition hover:bg-brand-900">
          <Icon name="spark" className="size-4" /> {guide ? "Close the guide" : "Not sure? Guide me in 3 steps"}
        </button>
        <p className="text-sm text-ink-soft">Or call us on <a href={phone.href} className="font-semibold text-brand-700 underline underline-offset-2">{phone.display}</a>: our team will help you choose.</p>
      </div>

      {guide && <Matcher initialWho={who} phone={phone} />}
    </div>
  );
}

/** Lower-case for mid-sentence use, keeping acronyms like ADHD and OCD intact. */
const inSentence = (label: string) => label.split(" ").map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");

function Matcher({ initialWho, phone }: { initialWho: Who; phone: { display: string; href: string } }) {
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<Who>(initialWho);
  const [concern, setConcern] = useState<(typeof CONCERNS)[number] | null>(null);
  const [intensity, setIntensity] = useState<(typeof INTENSITY)[number]["id"] | null>(null);
  const forWho = CONCERNS.filter((c) => c.who.includes(who));

  const option = (selected: boolean) =>
    clsx("flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-5 py-3 text-left font-medium transition-all duration-300", selected ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line bg-white text-ink hover:border-brand-300 hover:-translate-y-0.5");

  return (
    <div id="care-guide" className="step-in mt-8 rounded-[var(--radius-card)] bg-sand p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-ink-soft">Step {Math.min(step + 1, 3)} of 3</p>
        {step > 0 && step < 3 && (
          <button type="button" onClick={() => setStep(step - 1)} className="min-h-10 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-white">Back</button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-[var(--ease-calm)]" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
      </div>

      <div key={step} className="step-in mt-6">
        {step === 0 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">Who are you looking for help for?</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {WHO.map((w) => (
                <button key={w.id} type="button" className={option(who === w.id)} onClick={() => { setWho(w.id); setStep(1); }}>
                  {w.label} <Icon name="chevron" className="size-4 opacity-50" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">What feels closest to what’s going on?</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {forWho.map((c) => (
                <button key={c.label} type="button" className={option(concern?.label === c.label)} onClick={() => { setConcern(c); setStep(2); }}>
                  {c.label} <Icon name="chevron" className="size-4 opacity-50" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">What kind of support are you looking for?</legend>
            <div className="mt-4 grid gap-3">
              {INTENSITY.map((i) => (
                <button key={i.id} type="button" className={option(intensity === i.id)} onClick={() => { setIntensity(i.id); setStep(3); }}>
                  <span>{i.label}<span className="block text-sm font-normal text-ink-soft">{i.hint}</span></span>
                  <Icon name="chevron" className="size-4 opacity-50" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {step === 3 && concern && (
          <div role="status">
            <p className="eyebrow">Our suggestion</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">
              {intensity === "intensive" ? `Speak with our team about inpatient care for ${inSentence(concern.label)}` : `Start with a ${who === "child" ? "child & adolescent specialist" : "specialist"} for ${inSentence(concern.label)}`}
            </p>
            <p className="mt-2 max-w-2xl text-ink-soft">
              {intensity === "intensive"
                ? "Residential care is planned with a psychiatrist first. Call us and we’ll explain admission, or book a consultation to begin."
                : "Read about how we treat it, then choose a time with one of our psychiatrists or psychologists."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/book-appointment/?service=${concern.specialty}&from=guide`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-600 px-6 font-semibold text-white hover:bg-accent-700">
                <Icon name="calendar" className="size-4" /> Book a consultation
              </Link>
              {intensity === "intensive" ? (
                <Link href="/admission/" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white px-6 font-semibold text-ink hover:border-brand-300">About admission</Link>
              ) : (
                <Link href={concern.href} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white px-6 font-semibold text-ink hover:border-brand-300">About {inSentence(concern.label)} treatment</Link>
              )}
              <a href={phone.href} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold text-brand-700 hover:bg-white"><Icon name="phone" className="size-4" /> {phone.display}</a>
            </div>
            <p className="mt-6 text-xs text-ink-soft">This guide only points you to the right place. It isn’t a diagnosis. If you or someone else is in danger, call <a href="tel:14416" className="font-semibold underline">Tele-MANAS 14416</a> or <a href="tel:112" className="font-semibold underline">112</a>.</p>
            <button type="button" onClick={() => { setStep(0); setConcern(null); setIntensity(null); }} className="mt-4 min-h-10 text-sm font-semibold text-brand-700 underline underline-offset-2">Start again</button>
          </div>
        )}
      </div>
    </div>
  );
}
