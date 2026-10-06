"use client";
// Visible feedback that you are scrolling:
//  - a thin gradient progress bar along the top of the window
//  - a back-to-top button (bottom-left) whose ring fills as you read
// Both update from one passive scroll listener, batched to animation frames.
import { useEffect, useRef, useState } from "react";

const R = 22;
const C = 2 * Math.PI * R;

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - p));
      setShow(window.scrollY > 600);
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
    };
  }, []);

  const toTop = () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-brand-500" />
      </div>
      <button
        type="button"
        onClick={toTop}
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        className={`group fixed bottom-4 left-4 z-[55] grid size-14 place-items-center rounded-full bg-white shadow-[var(--shadow-lift)] ring-1 ring-line transition-all duration-500 ease-[var(--ease-calm)] hover:-translate-y-1 sm:bottom-6 sm:left-6 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <svg viewBox="0 0 50 50" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="25" cy="25" r={R} fill="none" stroke="var(--color-brand-100)" strokeWidth="3" />
          <circle ref={ring} cx="25" cy="25" r={R} fill="none" stroke="var(--color-brand-600)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} />
        </svg>
        <svg viewBox="0 0 24 24" className="relative size-5 text-brand-700 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
        <span className="sr-only">Back to top</span>
      </button>
    </>
  );
}
