"use client";
// Small client-side enhancements used on the home page and elsewhere.
// Each renders complete, final content on the server; motion is added on top.
import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Counts up to `value` when scrolled into view. The server HTML already shows the final number. */
export function Counter({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => n.toLocaleString("en-IN") + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1800;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {fmt(value)}
    </span>
  );
}

/** Card that tilts slightly towards the pointer (fine pointers only, motion allowed). */
export function TiltCard({ children, className, max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-4px)`;
      el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
      el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <div ref={ref} className={clsx("relative transition-transform duration-500 ease-[var(--ease-calm)] will-change-transform [transform-style:preserve-3d]", className)}>
      {/* soft light that follows the pointer */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(400px_circle_at_var(--mx,50%)_var(--my,50%),rgb(138_163_255/0.18),transparent_45%)]" />
      {children}
    </div>
  );
}

/** Horizontal scroll-snap rail with previous/next buttons (no duplicated DOM, keyboard friendly). */
export function Rail({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return (
    <div className={clsx("relative", className)}>
      <ul ref={ref} aria-label={label} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:thin] [-ms-overflow-style:none]">
        {children}
      </ul>
      <div className="mt-2 flex justify-end gap-2">
        {[-1, 1].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => by(d)}
            disabled={d < 0 ? edge.start : edge.end}
            className="grid size-12 place-items-center rounded-full border border-line bg-white text-brand-700 shadow-[var(--shadow-soft)] transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className={clsx("size-5", d < 0 && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <span className="sr-only">{d < 0 ? "Previous" : "Next"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Magnetic hover for primary CTAs. */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className="inline-block transition-transform duration-300 ease-[var(--ease-calm)]">
      {children}
    </span>
  );
}
