// Abstract, code-built scenes for page heroes (no stock art). One per kind of
// page, all from the logo's motifs: cupped hands, light, breath, growth.
// Pure SVG + CSS: sharp at any size, ~1-2 KB each, decorative (aria-hidden).
import type { ReactNode } from "react";

export type Scene = "breath" | "sprout" | "rings" | "map" | "cradle" | "pages" | "sunrise";

export function sceneFor(pageType: string, path = ""): Scene {
  if (/map-direction|contact|-in-|near-me/.test(path) || pageType === "local-landing" || pageType === "location/contact") return "map";
  if (pageType === "service-addiction" || /addiction|alcohol|drug|smoking|nasha|liver|hepatitis|relapse/.test(path)) return "sprout";
  if (pageType === "condition") return "breath";
  if (pageType === "service" || /therapy|tms|electroconvulsive|counsel/.test(path)) return "rings";
  if (pageType === "about/info") return "cradle";
  return "pages";
}

const defs = (
  <defs>
    <linearGradient id="hs-line" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#e4ebfe" />
      <stop offset="1" stopColor="#2f5be0" stopOpacity="0.5" />
    </linearGradient>
    <radialGradient id="hs-core">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.28" stopColor="#bdccfb" stopOpacity="0.85" />
      <stop offset="0.65" stopColor="#2f5be0" stopOpacity="0.28" />
      <stop offset="1" stopColor="#0a35b5" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="hs-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
      <stop offset="1" stopColor="#ffffff" stopOpacity="0.03" />
    </linearGradient>
  </defs>
);

const SCENES: Record<Scene, ReactNode> = {
  breath: (
    <g fill="none" strokeLinecap="round">
      <circle cx="300" cy="190" r="150" fill="url(#hs-core)" opacity="0.55" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M-20 ${150 + i * 22}C90 ${100 + i * 22} 170 ${250 + i * 22} 300 ${190 + i * 14}S510 ${120 + i * 22} 620 ${170 + i * 22}`} stroke="url(#hs-line)" strokeWidth={2.2 - i * 0.35} strokeOpacity={1 - i * 0.17} className="hs-drift" style={{ animationDelay: `${i * -1.4}s` }} />
      ))}
      <circle cx="300" cy="190" r="6" fill="#fff" />
      <circle cx="300" cy="190" r="18" fill="#90aaf9" fillOpacity="0.25" />
    </g>
  ),
  sprout: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="300" cy="140" r="140" fill="url(#hs-core)" opacity="0.5" />
      <path d="M150 320H450" stroke="#90aaf9" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M300 320V170" stroke="url(#hs-line)" strokeWidth="2.5" />
      <path d="M300 230C300 165 345 128 420 126C420 196 375 230 300 230Z" stroke="url(#hs-line)" strokeWidth="2.2" fill="#2f5be0" fillOpacity="0.12" />
      <path d="M300 262C300 214 268 186 210 184C210 236 242 262 300 262Z" stroke="url(#hs-line)" strokeWidth="2.2" fill="#2f5be0" fillOpacity="0.1" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx="300" cy="320" r={40 + i * 46} stroke="#90aaf9" strokeOpacity={0.22 - i * 0.06} strokeWidth="1.2" strokeDasharray="2 6" />
      ))}
    </g>
  ),
  rings: (
    <g fill="none">
      <circle cx="300" cy="190" r="120" fill="url(#hs-core)" opacity="0.6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx="300" cy="190" r={46 + i * 34} stroke="url(#hs-line)" strokeWidth={1.8 - i * 0.25} strokeOpacity={0.9 - i * 0.16} className="hs-pulse" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <circle cx="300" cy="190" r="7" fill="#fff" />
    </g>
  ),
  map: (
    <g>
      <circle cx="320" cy="170" r="150" fill="url(#hs-core)" opacity="0.45" />
      {Array.from({ length: 11 }, (_, r) =>
        Array.from({ length: 19 }, (_, c) => {
          const x = 60 + c * 26 + (r % 2) * 13;
          const y = 60 + r * 24;
          const d = Math.hypot(x - 320, (y - 170) * 1.4);
          return d < 230 ? <circle key={`${r}-${c}`} cx={x} cy={y} r="1.7" fill="#bdccfb" fillOpacity={Math.max(0.12, 0.75 - d / 300)} /> : null;
        })
      )}
      <g fill="none" stroke="url(#hs-line)" strokeWidth="2" strokeLinecap="round">
        <path d="M262 214C290 176 330 160 372 132" strokeDasharray="4 6" />
      </g>
      {[[262, 214], [372, 132]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill="#2f5be0" fillOpacity="0.3" className="hs-pulse" />
          <circle cx={x} cy={y} r="6" fill="#fff" />
        </g>
      ))}
    </g>
  ),
  cradle: (
    <g fill="none" strokeLinecap="round">
      <circle cx="300" cy="150" r="130" fill="url(#hs-core)" opacity="0.7" />
      <g stroke="url(#hs-line)" strokeWidth="2.4">
        <path d="M300 352C232 350 170 318 148 256C139 230 136 206 139 178" />
        <path d="M300 322C250 320 207 298 191 256" />
        <path d="M139 178C140 162 158 162 160 180L164 230M122 206C122 190 140 190 142 206L148 262M162 158C163 142 181 142 182 160L186 216" />
        <g transform="translate(600 0) scale(-1 1)">
          <path d="M300 352C232 350 170 318 148 256C139 230 136 206 139 178" />
          <path d="M300 322C250 320 207 298 191 256" />
          <path d="M139 178C140 162 158 162 160 180L164 230M122 206C122 190 140 190 142 206L148 262M162 158C163 142 181 142 182 160L186 216" />
        </g>
      </g>
    </g>
  ),
  sunrise: (
    <g fill="none" strokeLinecap="round">
      <circle cx="300" cy="250" r="170" fill="url(#hs-core)" opacity="0.7" />
      <path d="M120 250A180 180 0 0 1 480 250" stroke="url(#hs-line)" strokeWidth="2.4" />
      <path d="M180 250A120 120 0 0 1 420 250" stroke="url(#hs-line)" strokeWidth="1.6" strokeOpacity="0.6" />
      <path d="M60 250H540" stroke="#90aaf9" strokeOpacity="0.4" strokeWidth="1.5" />
      {[-60, -35, -12, 12, 35, 60].map((a, i) => (
        <path key={i} d={`M${300 + Math.sin((a * Math.PI) / 180) * 200} ${250 - Math.cos((a * Math.PI) / 180) * 200}L${300 + Math.sin((a * Math.PI) / 180) * 236} ${250 - Math.cos((a * Math.PI) / 180) * 236}`} stroke="#dee6fd" strokeOpacity="0.55" strokeWidth="2" />
      ))}
      <path d="M90 290H510M150 322H450M210 352H390" stroke="#90aaf9" strokeOpacity="0.22" strokeWidth="1.2" />
    </g>
  ),
  pages: (
    <g>
      <circle cx="300" cy="180" r="140" fill="url(#hs-core)" opacity="0.45" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${210 + i * 26} ${70 + i * 34}) rotate(${-8 + i * 8} 90 110)`}>
          <rect width="180" height="220" rx="18" fill="url(#hs-glass)" stroke="#ffffff" strokeOpacity="0.18" />
          <rect x="22" y="28" width="90" height="8" rx="4" fill="#ffffff" fillOpacity="0.5" />
          <rect x="22" y="48" width="136" height="6" rx="3" fill="#ffffff" fillOpacity="0.2" />
          <rect x="22" y="62" width="120" height="6" rx="3" fill="#ffffff" fillOpacity="0.2" />
          <rect x="22" y="76" width="130" height="6" rx="3" fill="#ffffff" fillOpacity="0.2" />
        </g>
      ))}
    </g>
  ),
};

export function HeroScene({ scene, className }: { scene: Scene; className?: string }) {
  return (
    <svg viewBox="0 0 600 380" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {defs}
      {SCENES[scene]}
    </svg>
  );
}
