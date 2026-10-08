"use client";
// "What would you like help with?" as a small picker. Circle photos on the left (a row you can swipe on a
// phone); the one you point at, tap or move to with the arrow keys fills the big panel beside it with a
// photo, the plain-words signs of that concern and a button to read about it. Nothing is hidden behind a
// touch: everything is on screen, and a first tap only selects, so nobody lands on a page by accident.
// Until someone uses it, it steps through the concerns by itself (a thin ring fills round the active
// circle); it stops for good as soon as they interact, and never moves for people who prefer less motion.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/primitives";

export type ExplorerItem = { label: string; href: string; photo: string | null };

const INFO: Record<string, { hint: string; signs: string[]; cta: string }> = {
  Anxiety: { hint: "Worry, panic and fear that will not switch off.", signs: ["Constant worry", "Panic attacks", "Fear that is hard to explain"], cta: "anxiety" },
  Depression: { hint: "Low mood that stays, and the weight of feeling hopeless.", signs: ["Low mood", "No interest in things", "Feeling hopeless"], cta: "depression" },
  "Bipolar disorder": { hint: "Moods that swing far higher and lower than usual.", signs: ["Very high and very low phases", "Sudden mood swings", "Changes in sleep and energy"], cta: "bipolar disorder" },
  OCD: { hint: "Thoughts and habits that repeat, even when you want them to stop.", signs: ["Repeating thoughts", "Checking or washing again and again", "Rituals that are hard to stop"], cta: "OCD" },
  Addiction: { hint: "When alcohol, drugs, nicotine or screens have become hard to put down.", signs: ["Alcohol or drugs", "Nicotine and smoking", "Gaming and screens"], cta: "addiction care" },
  "Child & teen mental health": { hint: "Support for children and teenagers, and for the parents who worry about them.", signs: ["Behaviour or school problems", "ADHD and autism", "Anxiety and anger"], cta: "child and teen care" },
  "LGBTQ+ support": { hint: "A respectful, private place to talk, for you and your family.", signs: ["Coming out", "Family and social pressure", "A safe place to talk"], cta: "LGBTQ+ support" },
};
const STEP_MS = 5200;

export function ConditionsExplorer({ items }: { items: ExplorerItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const n = items.length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser setting once on mount
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = !reduce && !touched && !paused && inView;
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % n), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, n]);

  const pick = useCallback((i: number) => {
    setTouched(true);
    setActive(i);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(k)) return;
    e.preventDefault();
    const next = k === "Home" ? 0 : k === "End" ? n - 1 : (active + (k === "ArrowRight" || k === "ArrowDown" ? 1 : -1) + n) % n;
    pick(next);
    refs.current[next]?.focus();
  };

  const cur = items[active];
  const info = INFO[cur.label];

  return (
    <div
      ref={root}
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:items-stretch lg:gap-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The circles: a row to swipe on a phone, a grid of four on a laptop. */}
      <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label="What would you like help with?" aria-orientation="horizontal" onKeyDown={onKey} className="flex w-max gap-4 lg:grid lg:w-auto lg:grid-cols-4 lg:gap-x-3 lg:gap-y-5">
          {items.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.href}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`ce-tab-${i}`}
                aria-selected={on}
                aria-controls="ce-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => pick(i)}
                onMouseEnter={() => window.matchMedia("(hover: hover)").matches && pick(i)}
                className="group flex w-[5.75rem] shrink-0 flex-col items-center gap-2.5 rounded-2xl text-center outline-none lg:w-auto"
              >
                <span className={clsx("relative grid size-[5rem] place-items-center rounded-full transition-transform duration-500 ease-[var(--ease-calm)] lg:size-[5.5rem]", on ? "scale-110" : "group-hover:scale-105")}>
                  <span className={clsx("absolute inset-0 overflow-hidden rounded-full bg-sage-50 transition-shadow duration-300", on ? "shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-brand-600),0_14px_26px_-12px_rgb(23_34_44/0.5)]" : "shadow-[0_0_0_3px_#fff,0_0_0_4px_var(--color-line)] group-focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-brand-300)]")}>
                    {c.photo ? <Image src={c.photo} alt="" fill sizes="96px" className={clsx("object-cover transition-transform duration-700 ease-[var(--ease-calm)]", on ? "scale-110" : "scale-100")} /> : <Icon name="heart" className="m-auto size-8" />}
                    <span aria-hidden="true" className={clsx("absolute inset-0 bg-brand-900/25 transition-opacity duration-300", on ? "opacity-0" : "opacity-100 group-hover:opacity-0")} />
                  </span>
                  {/* the ring that fills while it steps along by itself */}
                  {on && playing && (
                    <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute -inset-[9px] size-[calc(100%+18px)] -rotate-90">
                      <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-brand-300)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="302" className="ce-ring" style={{ animationDuration: `${STEP_MS}ms` }} />
                    </svg>
                  )}
                </span>
                <span className={clsx("text-[0.8125rem] leading-snug font-semibold transition-colors sm:text-sm", on ? "text-brand-700" : "text-ink group-hover:text-brand-700")}>{c.label}</span>
              </button>
            );
          })}
          <Link href="/conditions/" className="group flex w-[5.75rem] shrink-0 flex-col items-center gap-2.5 rounded-2xl text-center outline-none lg:w-auto">
            <span className="grid size-[5rem] place-items-center rounded-full bg-brand-600 text-white shadow-[0_0_0_3px_#fff,0_0_0_4px_var(--color-brand-200)] transition-transform duration-300 group-hover:scale-105 group-hover:bg-brand-700 group-focus-visible:ring-4 group-focus-visible:ring-brand-200 lg:size-[5.5rem]">
              <span className="font-display text-xl font-semibold tracking-[-0.02em]">A–Z</span>
            </span>
            <span className="text-[0.8125rem] leading-snug font-semibold text-brand-700 sm:text-sm">All conditions</span>
          </Link>
        </div>
      </div>

      {/* The big panel for the one you are on. */}
      <div id="ce-panel" role="tabpanel" aria-labelledby={`ce-tab-${active}`} className="relative isolate min-h-[21rem] overflow-hidden rounded-[1.5rem] bg-brand-900 text-white shadow-[0_28px_50px_-30px_rgb(15_40_71/0.7)] lg:min-h-[19.5rem]">
        {items.map((c, i) =>
          c.photo ? (
            <Image key={c.href} src={c.photo} alt="" fill sizes="(min-width:1024px) 640px, 100vw" aria-hidden="true" className={clsx("object-cover transition-[opacity,transform] duration-1000 ease-[var(--ease-calm)]", i === active ? "scale-100 opacity-100" : "scale-[1.07] opacity-0")} />
          ) : null,
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[rgb(11_29_64/0.9)] via-[rgb(11_29_64/0.45)] to-[rgb(11_29_64/0.1)]" />
        <div key={active} className="ce-rise absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.12em] text-white/70 uppercase">Can we help with</p>
          <h3 className="mt-1 font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2rem]">{cur.label}</h3>
          <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-white/90">{info?.hint}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="What it can feel like">
            {info?.signs.map((s) => (
              <li key={s} className="rounded-full bg-white/15 px-3 py-1 text-[0.8125rem] font-medium backdrop-blur-sm">{s}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={cur.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[0.9375rem] font-semibold text-brand-700 transition-transform duration-300 hover:translate-x-0.5">
              Read about {info?.cta ?? cur.label} <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/find-a-specialist/" className="text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white">Not sure? Find the right specialist</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
