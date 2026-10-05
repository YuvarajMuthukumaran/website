"use client";
// "Your journey to recovery": scroll-driven storytelling with native CSS
// sticky positioning (no scroll-jacking library, no pinning that changes the
// page height after load).
//
// Desktop (motion allowed): the section is 3.2 screens tall; its inner panel
// sticks to the viewport while four large cards glide horizontally, a progress
// rail fills and the step counter ticks over.
// Phones: a vertical timeline whose line fills as you scroll.
// No JS / reduced motion: a plain 4-column grid, everything visible.
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export type Step = { title: string; text: string };

const ICONS = [
  // assess: clipboard with pulse
  "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2M8 14h2l1.5-3 2 6 1.5-3h2",
  // treat: heart with cross
  "M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10zM9 11h6M12 8v6",
  // heal: leaf
  "M5 19c9 0 14-6 14-14C10 5 5 10 5 19zm0 0 8-8",
  // thrive: sun rising
  "M12 3v2M4.9 6.9l1.4 1.4M3 14h2M19 14h2M17.7 8.3l1.4-1.4M7 14a5 5 0 0 1 10 0M3 18h18M7 21h10",
];

export function Journey({ steps, heading, eyebrow }: { steps: Step[]; heading: string; eyebrow: string }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [mode, setMode] = useState<"static" | "horizontal" | "vertical">("static");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mq = matchMedia("(min-width: 1024px)");
    const pick = () => setMode(mq.matches ? "horizontal" : "vertical");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  useEffect(() => {
    if (mode === "static") return;
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // horizontal: 0 when the section top reaches the viewport top, 1 when its bottom does.
      const p =
        mode === "horizontal"
          ? Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)))
          : Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      el.style.setProperty("--p", p.toFixed(4));
      if (mode === "horizontal" && track.current?.parentElement) {
        const overflow = track.current.scrollWidth - track.current.parentElement.clientWidth;
        track.current.style.transform = `translate3d(${(-p * Math.max(0, overflow)).toFixed(1)}px,0,0)`;
      }
      setActive(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (track.current) track.current.style.transform = "";
    };
  }, [mode, steps.length]);

  const horizontal = mode === "horizontal";

  return (
    <section ref={root} aria-labelledby="journey-title" className={clsx("on-dark relative bg-hero text-white", horizontal ? "h-[320vh]" : "overflow-clip")}>
      <div className={clsx("relative overflow-clip", horizontal && "sticky top-0 flex h-screen flex-col justify-center")}>
        {/* drifting light */}
        <div aria-hidden="true" className="orb pointer-events-none absolute -left-40 top-10 hidden size-[30rem] rounded-full bg-brand-500/30 blur-3xl md:block" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] bottom-[-20%] hidden size-[36rem] rounded-full bg-accent-600/15 blur-3xl md:block" style={{ transform: "translate3d(calc(var(--p, 0) * -180px), 0, 0)" }} />

        <div className="container-page relative py-20 lg:py-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow !text-brand-200">{eyebrow}</p>
              <h2 id="journey-title" className="mt-3 max-w-2xl text-[length:var(--text-h2)] font-bold leading-tight">{heading}</h2>
            </div>
            {horizontal && (
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-brand-200" aria-hidden="true">
                <span className="text-3xl text-white tabular-nums">0{active + 1}</span> / 0{steps.length}
              </p>
            )}
          </div>

          {/* progress rail (desktop) */}
          {horizontal && (
            <div aria-hidden="true" className="relative mt-10 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-brand-300 via-white to-accent-600" style={{ transform: "scaleX(var(--p, 0))" }} />
            </div>
          )}

          <div className={horizontal ? "mt-10" : "mt-12"}>
            <ol ref={track} className={clsx(horizontal ? "flex w-max gap-8 will-change-transform" : mode === "vertical" ? "relative space-y-6 pl-11" : "grid gap-6 lg:grid-cols-4")}>
              {/* vertical timeline line (phones) */}
              {mode === "vertical" && (
                <li aria-hidden="true" className="absolute top-2 bottom-2 left-[0.95rem] w-0.5 list-none rounded-full bg-white/15">
                  <span className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-brand-300 to-accent-600" style={{ transform: "scaleY(var(--p, 0))" }} />
                </li>
              )}
              {steps.map((s, i) => {
                const on = mode === "static" || i <= active;
                const current = horizontal && i === active;
                return (
                  <li key={s.title} className={clsx("relative transition-transform duration-700 ease-[var(--ease-calm)]", horizontal && "w-[min(540px,42vw)]", horizontal && !current && "scale-[0.94]")}>
                    {mode === "vertical" && (
                      <span aria-hidden="true" className={clsx("absolute top-7 -left-11 grid size-8 place-items-center rounded-full border-2 text-xs font-bold transition-colors duration-500", on ? "border-white bg-white text-brand-900" : "border-white/30 bg-brand-900 text-white/70")}>
                        {i + 1}
                      </span>
                    )}
                    <div
                      className={clsx(
                        "glass-dark relative h-full overflow-hidden rounded-[2rem] transition-all duration-700",
                        horizontal ? "p-10" : "p-7",
                        current && "!bg-white/[0.14] shadow-[var(--shadow-glow)] ring-1 ring-white/40"
                      )}
                    >
                      {/* oversized outline number */}
                      <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-4 font-display text-[9rem] leading-none font-extrabold text-transparent [-webkit-text-stroke:1.5px_rgb(255_255_255/0.16)]">
                        0{i + 1}
                      </span>
                      <span className={clsx("relative grid place-items-center rounded-2xl transition-all duration-700", horizontal ? "size-16" : "size-12", current ? "scale-110 bg-white text-brand-800" : "bg-white/15")}>
                        <svg viewBox="0 0 24 24" className={horizontal ? "size-8" : "size-6"} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={ICONS[i % ICONS.length]} />
                        </svg>
                      </span>
                      <p className="relative mt-6 font-display text-sm font-semibold tracking-[0.2em] text-brand-200">STEP 0{i + 1}</p>
                      <h3 className={clsx("relative mt-2 font-display font-bold", horizontal ? "text-4xl" : "text-2xl")}>{s.title}</h3>
                      <p className={clsx("relative mt-3 leading-relaxed text-brand-50", horizontal && "text-lg")}>{s.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          {horizontal && (
            <p className="mt-10 flex items-center gap-2 text-sm text-brand-200" aria-hidden="true">
              <span className="inline-block h-px w-10 bg-brand-200/60" /> Keep scrolling to follow the journey
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
