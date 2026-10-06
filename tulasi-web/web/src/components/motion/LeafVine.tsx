"use client";
// A quiet decorative vine that joins the four care steps. It draws itself once, the
// first time the section comes into view, leaves unfolding along the way, and then
// stays still. Not tied to scrolling. Desktop only (the steps stack on smaller screens).
import { useEffect, useRef, useState } from "react";

// Wave between the four circle centres (viewBox 0..100 wide, stretched to the row).
const STEM = "M0 20 C 8 6, 25 6, 33.33 20 S 58 34, 66.66 20 S 91 6, 100 20";
// x%, y (of 40), size, rotation. Each bump carries one larger and one smaller leaf.
const LEAVES: { x: number; y: number; r: number; s: number; d: number }[] = [
  { x: 16.5, y: 9.5, r: -38, s: 1.35, d: 0.55 },
  { x: 17.5, y: 9.5, r: 148, s: 0.95, d: 0.7 },
  { x: 50, y: 30.5, r: 142, s: 1.35, d: 1.05 },
  { x: 51, y: 30.5, r: -32, s: 0.95, d: 1.2 },
  { x: 83.3, y: 9.5, r: -38, s: 1.35, d: 1.55 },
  { x: 84.3, y: 9.5, r: 148, s: 0.95, d: 1.7 },
];

export function LeafVine() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setState("in");
        io.disconnect();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" data-vine={state} className="vine pointer-events-none absolute top-0 left-5 hidden h-10 w-[calc(75%+1.125rem)] lg:block">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={STEM} pathLength={1} className="vine-stem" fill="none" stroke="var(--color-sage-300)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {LEAVES.map((l, i) => (
        <span key={i} className="vine-leaf absolute" style={{ left: `${l.x}%`, top: `${l.y}px`, ["--r" as string]: `${l.r}deg`, ["--s" as string]: l.s, transitionDelay: `${l.d}s` }}>
          <svg viewBox="0 0 22 12" className="block h-3 w-[22px] -translate-y-1/2" style={{ transformOrigin: "0 50%" }}>
            <path d="M0 6C4 0 14 0 22 6 14 12 4 12 0 6z" fill="var(--color-sage-500)" fillOpacity="0.5" />
            <path d="M1 6h15" stroke="var(--color-sage-100)" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </span>
      ))}
    </div>
  );
}
