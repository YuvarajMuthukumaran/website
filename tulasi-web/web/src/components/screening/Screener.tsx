"use client";
// Free two-minute check-in (PHQ-9 / GAD-7). One question per screen, answers stay in
// this browser tab, and the result always ends with a next step: a specialist, a
// conversation, or (if the self-harm question is answered "yes") help right now.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { FREQUENCY, INSTRUMENTS, bandFor, needsSafetyNet, score, type Instrument } from "@/lib/screening";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Arrow, Icon } from "@/components/ui/primitives";

const optionClass =
  "group flex w-full min-h-14 items-center rounded-[var(--radius-card)] bg-white px-4 py-3 text-left font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-[box-shadow,transform,background-color] duration-300 hover:bg-brand-50 hover:shadow-[inset_0_0_0_1px_var(--color-brand-300)] focus-visible:bg-brand-50 active:scale-[0.99]";

export function Screener({ phone }: { phone: { display: string; href: string } }) {
  const reduce = useReducedMotion();
  const [inst, setInst] = useState<Instrument | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const index = answers.length;
  const done = !!inst && index >= inst.questions.length;

  // Each new question heading takes focus as it appears (after the exit animation), so
  // keyboard and screen-reader users follow along. The very first heading does not.
  const seenFirst = useRef(false);
  const focusHeading = useCallback((el: HTMLHeadingElement | null) => {
    if (!el) return;
    if (!seenFirst.current) {
      seenFirst.current = true;
      return;
    }
    el.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (done && inst) track("screener_complete", { instrument: inst.id }); // never the score
  }, [done, inst]);

  const motionProps = reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const } };

  if (!inst) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <h2 ref={focusHeading} tabIndex={-1} className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-ink outline-none sm:text-[1.75rem]">What would you like to check in on?</h2>
        <ul className="mt-5 space-y-3">
          {Object.values(INSTRUMENTS).map((i) => (
            <li key={i.id}>
              <button type="button" className={optionClass} onClick={() => { setInst(i); setAnswers([]); }}>
                <span className="min-w-0 flex-1">
                  <span className="block">{i.title}</span>
                  <span className="block text-sm font-normal text-ink-soft">{i.blurb} About 2 minutes.</span>
                </span>
                <Icon name="arrow" className="size-4 shrink-0 text-brand-600 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-8 flex items-start gap-2 text-sm text-ink-soft">
          <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-sage-600" /> Private: your answers stay on this device and aren’t stored or sent anywhere. These are well-known screening questions, not a diagnosis.
        </p>
      </div>
    );
  }

  if (done) {
    const total = score(answers);
    const max = inst.questions.length * 3;
    const band = bandFor(inst, total);
    const unsafe = needsSafetyNet(inst, answers);
    const seeSomeone = unsafe || inst.bands.indexOf(band) >= 2;
    return (
      <div className="mx-auto w-full max-w-2xl">
        {unsafe && (
          <div role="alert" className="mb-6 rounded-[var(--radius-card)] bg-alert-50 p-5 shadow-[inset_0_0_0_1px_var(--color-alert-100)]">
            <p className="font-semibold text-ink">You said you’ve had thoughts of harming yourself. Thank you for being honest.</p>
            <p className="mt-2 leading-relaxed text-ink-soft">You don’t have to carry this alone. Please talk to someone today:</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 font-semibold text-alert-700 shadow-[inset_0_0_0_1px_var(--color-alert-100)] hover:bg-alert-100"><Icon name="phone" className="size-4" /> Tulasi {phone.display}</a>
            </div>
            <p className="mt-3 text-sm text-ink-soft">If you are in immediate danger, go to the nearest emergency department.</p>
          </div>
        )}
        <h2 ref={focusHeading} tabIndex={-1} className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-ink outline-none sm:text-[1.75rem]">Your {inst.title.toLowerCase()} result</h2>
        <div className="mt-5 rounded-[var(--radius-card)] bg-sage-50 p-5 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
          <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage-700 uppercase">{inst.short}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{band.label} <span className="text-base font-normal text-ink-soft">· {total} of {max}</span></p>
          <p className="mt-3 leading-relaxed text-ink-soft">{band.advice}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/find-a-specialist/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">
            {seeSomeone ? "Find the right specialist" : "Talk to a specialist anyway"} <Arrow />
          </Link>
          <OpenChatButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">Talk to Tulasi</OpenChatButton>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">This is a screening guide, not a diagnosis. Only a qualified professional can assess what is going on. If you are worried, please speak to one of our specialists.</p>
        <button type="button" onClick={() => { setInst(null); setAnswers([]); }} className="mt-4 min-h-10 text-sm font-semibold text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">Take another check-in</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-soft" aria-live="polite">Question {index + 1} of {inst.questions.length}</p>
        <button type="button" onClick={() => (index === 0 ? setInst(null) : setAnswers((a) => a.slice(0, -1)))} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          <Icon name="arrow" className="size-4 rotate-180" /> Back
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-50" role="progressbar" aria-valuemin={0} aria-valuemax={inst.questions.length} aria-valuenow={index} aria-label="Progress">
        <div className="h-full rounded-full bg-sage-500 transition-[width] duration-500 ease-[var(--ease-calm)]" style={{ width: `${(index / inst.questions.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={index} {...motionProps} className="mt-6">
          <p className="text-sm text-ink-soft">Over the last 2 weeks, how often have you been bothered by:</p>
          <h2 ref={focusHeading} tabIndex={-1} className="mt-2 font-display text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] text-ink outline-none sm:text-[1.625rem]">{inst.questions[index]}</h2>
          <ul className="mt-5 space-y-3">
            {FREQUENCY.map((o) => (
              <li key={o.value}>
                <button type="button" className={optionClass} onClick={() => setAnswers((a) => [...a, o.value])}>{o.label}</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
