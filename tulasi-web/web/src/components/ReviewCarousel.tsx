"use client";
// Patient voices as one slim row that changes by itself: three reviews on a laptop, two on a tablet,
// one on a phone, sliding along every few seconds. It pauses while someone points at it or touches it,
// stays still for people who prefer less motion, and has arrows and dots. The full set of reviews is in
// the page either way, so nothing here depends on the motion.
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Review } from "./ReviewGrid";

const G = (
  <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser setting once on mount
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const go = useCallback(
    (i: number) => {
      const t = track.current;
      if (!t) return;
      const n = reviews.length;
      const next = ((i % n) + n) % n;
      const el = t.children[next] as HTMLElement | undefined;
      if (!el) return;
      // the last cards cannot all reach the left edge, so the track stops at its end
      t.scrollTo({ left: Math.min(el.offsetLeft - t.offsetLeft, t.scrollWidth - t.clientWidth), behavior: reduce ? "auto" : "smooth" });
      setActive(next);
    },
    [reviews.length, reduce],
  );

  // follow manual swipes
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = t.children[0] as HTMLElement;
        const step = (t.children[1] as HTMLElement | undefined)?.offsetLeft ?? first.offsetWidth;
        setActive(Math.round(t.scrollLeft / (step - first.offsetLeft || step)));
      });
    };
    t.addEventListener("scroll", on, { passive: true });
    return () => {
      t.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // advance every 6 seconds
  useEffect(() => {
    if (paused || reduce) return;
    const id = window.setInterval(() => go(active + 1), 6000);
    return () => window.clearInterval(id);
  }, [active, paused, reduce, go]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <ul ref={track} className="rv-track mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1" aria-label="Patient reviews" tabIndex={0}>
        {reviews.map((r, i) => (
          <li key={i} className="w-[88%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]">
            <figure className="flex h-full flex-col justify-between gap-3 rounded-2xl p-5" style={{ background: "rgb(255 255 255 / 0.07)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.12)" }}>
              <blockquote className="line-clamp-5 text-[0.9375rem] leading-relaxed text-white/90">{r.quote}</blockquote>
              <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs font-semibold text-white/60">
                <span className="flex items-center gap-2">
                  <span className="text-amber-400" role="img" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}</span>
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">{G} Google</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(active - 1)} aria-label="Previous review" className="grid size-9 place-items-center rounded-full text-white/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-colors hover:bg-white/10">←</button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a review">
          {reviews.map((_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`Review ${i + 1}`} aria-current={i === active} className={clsx("h-1.5 rounded-full transition-all duration-300", i === active ? "w-6 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60")} />
          ))}
        </div>
        <button type="button" onClick={() => go(active + 1)} aria-label="Next review" className="grid size-9 place-items-center rounded-full text-white/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-colors hover:bg-white/10">→</button>
      </div>
    </div>
  );
}
