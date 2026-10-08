"use client";
// A statistic that counts up to its figure whenever it scrolls into view. Big figures ("50,000+") start just
// below it (49,500) and tick up like a live counter; small ones climb from 0. It always ends on exactly the
// figure it was given, so it never claims more than the figure shown. Words such as "NABH" are shown as they are. The real text is in the markup for screen
// readers and for people who prefer less motion, who see the final figure straight away.
import { useEffect, useRef, useState } from "react";

const FORMAT = new Intl.NumberFormat("en-IN");
const DURATION = 2800;
const LIVE_DURATION = 7000; // the 500-step tick up to a big figure
const LIVE_GAP = 500;

export function StatValue({ value }: { value: string }) {
  const m = value.match(/^([\d,]+)(\+?)$/);
  const target = m ? Number(m[1].replace(/,/g, "")) : null;
  const suffix = m ? m[2] : "";
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null); // null = show the final figure

  useEffect(() => {
    const el = ref.current;
    if (!el || target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const stop = () => cancelAnimationFrame(raf);
    const run = () => {
      stop();
      const start = performance.now();
      const from = target >= 10000 ? target - LIVE_GAP : 0;
      const duration = from ? LIVE_DURATION : DURATION;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = from ? 1 - Math.pow(1 - t, 2) : 1 - Math.pow(1 - t, 4); // steady, then slowing to the figure
        setShown(from + Math.round((target - from) * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setShown(null);
      };
      setShown(from);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) run();
        else {
          stop();
          setShown(null);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [target]);

  if (target === null) return <>{value}</>;
  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {shown === null ? FORMAT.format(target) : FORMAT.format(shown)}
        {suffix}
      </span>
    </span>
  );
}
