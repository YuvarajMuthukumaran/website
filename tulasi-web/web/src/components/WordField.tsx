// The logo's word-cloud as slow-drifting words on midnight (decorative).
import clsx from "clsx";
import type { CSSProperties } from "react";

const WORDS: [string, number, number, number, number, boolean?][] = [
  // word, left %, top %, size px, opacity, accent
  ["hope", 8, 18, 22, 0.55],
  ["calm", 30, 8, 16, 0.35],
  ["recovery", 56, 14, 26, 1, true],
  ["care", 82, 10, 18, 0.45],
  ["healing", 18, 52, 16, 0.35],
  ["together", 44, 46, 15, 0.3],
  ["balance", 70, 48, 18, 0.4],
  ["kindness", 6, 82, 15, 0.3],
  ["wellbeing", 36, 78, 20, 0.45],
  ["support", 62, 84, 15, 0.3],
  ["resilience", 86, 74, 17, 0.35],
];

export function WordField({ className, scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div aria-hidden="true" className={clsx("word-field pointer-events-none absolute inset-0 select-none", className)}>
      {WORDS.map(([w, x, y, s, o, hot], i) => (
        <span
          key={w}
          className={hot ? "hot" : undefined}
          style={{ left: `${x}%`, top: `${y}%`, fontSize: `${s * scale}px`, "--o": o, "--d": `${12 + (i % 5) * 2}s`, "--dx": `${i % 2 ? -10 : 10}px`, "--dy": `${i % 3 ? -12 : 8}px` } as CSSProperties}
        >
          {w}
        </span>
      ))}
    </div>
  );
}
