"use client";
// "Our services": a calm master/detail.
// - The list never changes height, so nothing jumps. A soft highlight glides
//   between rows (spring) and a thin progress line shows the auto-advance.
// - A preview card on the left swaps its content with a gentle rise and fade.
// - Auto-advances every few seconds only while the section is on screen and
//   untouched; hover / focus pauses it; reduced-motion turns it off.
// - Every row is a real link and every description is in the HTML (rows show
//   theirs below `lg`; on `lg+` the preview card shows the active one).
import clsx from "clsx";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PATHWAYS, type Pathway } from "@/lib/care";
import { Arrow, BrandIcon } from "@/components/ui/primitives";

const ICON: Record<Pathway["icon"], string> = {
  stethoscope: "psychiatry",
  talk: "therapy",
  home: "inpatient",
  leaf: "sprout",
  child: "child",
  elder: "memory",
  wave: "waves",
  briefcase: "workplace",
};
const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 6000;

export function ServicesShowcase({ intro }: { intro: ReactNode }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const running = inView && !paused && !reduce;

  useEffect(() => {
    // Auto-advance is a desktop effect: below lg there is no preview card, every row shows its own text.
    if (!running || !matchMedia("(min-width: 1024px)").matches) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % PATHWAYS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [running, active]);

  const current = PATHWAYS[active];

  return (
    <div ref={root} className="container-page relative grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        {intro}

        {/* Preview card: lg+ only (below that, each row shows its own text). */}
        <div
          className="relative mt-10 hidden min-h-[17rem] overflow-hidden rounded-[1.75rem] bg-white p-8 shadow-[0_1px_2px_rgb(15_18_34/0.04),0_30px_60px_-36px_rgb(10_47_181/0.4)] ring-1 ring-brand-100 lg:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`n-${active}`}
              aria-hidden="true"
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="pointer-events-none absolute -top-4 right-4 font-display text-[8.5rem] leading-none font-extrabold tracking-[-0.06em] text-brand-50 select-none"
            >
              {String(active + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.href}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative flex h-full min-h-[13.5rem] flex-col"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_14px_28px_-14px_rgb(10_47_181/0.7)]">
                <BrandIcon name={ICON[current.icon]} className="size-7" />
              </span>
              <h3 className="mt-6 font-display text-[1.65rem] leading-tight font-bold tracking-[-0.03em] text-ink">{current.title}</h3>
              <p className="mt-2 max-w-[38ch] leading-relaxed text-ink-soft">{current.text}</p>
              <Link href={current.href} className="group/btn mt-auto inline-flex items-center gap-2 self-start pt-6 text-sm font-semibold text-brand-700 hover:text-brand-900" tabIndex={-1} aria-hidden="true">
                Learn more <Arrow className="size-4" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <LayoutGroup id="services-showcase">
        <ul className="relative space-y-1" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          {PATHWAYS.map((p, i) => {
            const on = i === active;
            return (
              <motion.li
                key={p.href}
                initial={reduce ? false : { opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -6% 0px" }}
                transition={{ duration: 0.8, delay: reduce ? 0 : i * 0.06, ease: EASE }}
                className="relative"
              >
                {on && (
                  <motion.span
                    layoutId="services-active"
                    aria-hidden="true"
                    className="absolute inset-0 hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(15_18_34/0.04),0_16px_36px_-26px_rgb(10_47_181/0.45)] ring-1 ring-brand-100 lg:block"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
                  />
                )}
                <Link
                  href={p.href}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group relative flex items-start gap-4 rounded-2xl px-4 py-3.5 sm:gap-5 sm:px-5 max-lg:bg-white max-lg:ring-1 max-lg:ring-line lg:min-h-[4.5rem] lg:items-center"
                >
                  <span className={clsx("hidden w-6 shrink-0 text-xs font-semibold tabular-nums transition-colors duration-500 sm:block", on ? "lg:text-brand-600" : "text-ink-soft/60")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={clsx("icon-tile size-11 shrink-0 transition-[background-color,color,transform] duration-500 ease-[var(--ease-calm)]", on && "lg:!bg-brand-50 lg:scale-105")}>
                    <BrandIcon name={ICON[p.icon]} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={clsx("block font-display text-[1.0625rem] leading-snug font-bold tracking-[-0.02em] transition-[color,transform] duration-500 ease-[var(--ease-calm)]", on ? "text-ink lg:translate-x-1 lg:text-brand-800" : "text-ink")}>{p.title}</span>
                    <span className="block max-w-[52ch] pt-1 text-[0.95rem] leading-relaxed text-ink-soft lg:hidden">{p.text}</span>
                  </span>
                  <span className={clsx("grid size-8 shrink-0 place-items-center rounded-full transition-[background-color,color,transform,opacity] duration-500 ease-[var(--ease-calm)]", on ? "text-ink-soft lg:translate-x-0 lg:bg-brand-600 lg:text-white lg:opacity-100" : "text-ink-soft lg:-translate-x-2 lg:opacity-0")}>
                    <Arrow className="size-4" />
                    <span className="sr-only">Learn more about {p.title}</span>
                  </span>
                  {/* auto-advance progress */}
                  {on && running && (
                    <motion.span
                      key={`p-${active}`}
                      aria-hidden="true"
                      className="absolute right-5 bottom-0 left-5 hidden h-0.5 origin-left rounded-full bg-brand-600/60 lg:block"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </div>
  );
}
