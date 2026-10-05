"use client";
// "What would you like help with?": the fastest route to the right page.
// - Concern chips are real links to the existing treatment pages, all present
//   in the server HTML (choosing "who" only re-orders and highlights them).
// - "Guide me" is a 3-step matcher: who → what → how much support, ending in
//   a recommendation and a booking link pre-filtered to the right specialists.
import clsx from "clsx";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { CONCERNS, INTENSITY, WHO, type Who } from "@/lib/care";
import { Icon } from "@/components/ui/primitives";

export function CareFinder({ phone }: { phone: { display: string; href: string } }) {
  const reduce = useReducedMotion();
  const [who, setWho] = useState<Who>("self");
  const [guide, setGuide] = useState(false);
  const ordered = useMemo(() => [...CONCERNS].sort((a, b) => Number(b.who.includes(who)) - Number(a.who.includes(who))), [who]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div>
        <p className="eyebrow">Find the right care</p>
        <h2 className="mt-5 font-display text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em] text-ink">
          What would you like <span className="text-brandgrad">help with?</span>
        </h2>
        <p className="mt-5 max-w-[44ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Choose who the care is for, then what feels closest. Each one opens how we treat it.</p>
        <LayoutGroup id="care-who">
          <div role="group" aria-label="Who is the care for?" className="mt-8 grid w-full grid-cols-2 gap-1 rounded-[var(--radius-card)] bg-mist p-1 shadow-[inset_0_0_0_1px_var(--color-line)] sm:inline-flex sm:w-auto sm:max-w-full sm:flex-wrap">
            {WHO.map((w) => {
              const on = who === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWho(w.id)}
                  className={clsx("relative min-h-11 rounded-[var(--radius-tile)] px-3 text-center text-sm leading-tight font-semibold transition-colors duration-300 sm:px-4", on ? "text-white" : "text-ink-soft hover:text-ink")}
                >
                  {on && (
                    <motion.span
                      layoutId="care-who-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[var(--radius-tile)] bg-brand-600 shadow-[0_8px_18px_-8px_rgb(10_47_181/0.75)]"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{w.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div>
      <p className="mb-3 text-sm font-semibold text-brand-700 lg:pt-2" aria-live="polite">
        Best matches for: <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-white">{WHO.find((w) => w.id === who)?.label}</span>
      </p>
      <LayoutGroup id="care-chips">
        <ul className="flex flex-wrap gap-2.5">
          {ordered.map((c) => {
            const match = c.who.includes(who);
            return (
              <motion.li
                key={c.href + c.label}
                layout="position"
                initial={false}
                animate={{ opacity: match ? 1 : 0.5 }}
                transition={reduce ? { duration: 0 } : { layout: { type: "spring", stiffness: 260, damping: 30 }, opacity: { duration: 0.4 } }}
              >
                <Link
                  href={c.href}
                  className={clsx(
                    "group inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[0.95rem] transition-[background-color,color,box-shadow,transform] duration-[450ms] ease-[var(--ease-calm)] hover:-translate-y-px",
                    match ? "bg-brand-50 font-semibold text-brand-800 shadow-[inset_0_0_0_1.5px_var(--color-brand-600)] hover:bg-brand-600 hover:text-white hover:shadow-[0_10px_24px_-12px_rgb(10_47_181/0.8)]" : "bg-transparent font-medium text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-ink"
                  )}
                >
                  {match && <span className="size-1.5 rounded-full bg-brand-600 group-hover:bg-white" aria-hidden="true" />}
                  {c.label}
                  <Icon name="arrow" className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <button type="button" onClick={() => setGuide((g) => !g)} aria-expanded={guide} aria-controls="care-guide" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-midnight px-6 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_10px_28px_-14px_rgb(3_11_58/0.9)] transition hover:-translate-y-px hover:bg-navy-900">
          <Icon name="spark" className="size-4" /> {guide ? "Close the guide" : "Not sure? Guide me in 3 steps"}
        </button>
        <p className="text-sm text-ink-soft">Or call us on <a href={phone.href} className="font-semibold text-brand-700 underline underline-offset-2">{phone.display}</a>: our team will help you choose.</p>
      </div>

      {guide && <Matcher initialWho={who} phone={phone} />}
      </div>
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
    clsx("flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-card)] px-5 py-3 text-left font-medium transition-all duration-300", selected ? "bg-brand-50 text-brand-800 shadow-[inset_0_0_0_1.5px_var(--color-brand-600)]" : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_var(--color-brand-200),0_8px_20px_-12px_rgb(10_47_181/0.35)]");

  return (
    <div id="care-guide" className="step-in mt-8 rounded-[var(--radius-blob)] bg-mist p-6 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-8">
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
