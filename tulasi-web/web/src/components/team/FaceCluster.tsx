// Hero art for the team location pages: the specialists on the page, as cut-out
// portraits floating in soft light around the stage (decorative; the names and
// details are in the cards below).
import Image from "next/image";

const SPOTS = [
  { x: 50, y: 47, s: 46 },
  { x: 17, y: 25, s: 27 },
  { x: 83, y: 22, s: 30 },
  { x: 13, y: 73, s: 25 },
  { x: 86, y: 72, s: 27 },
  { x: 37, y: 91, s: 20 },
  { x: 64, y: 8, s: 20 },
];

export function FaceCluster({ faces }: { faces: string[] }) {
  return (
    <div className="relative mx-auto aspect-[1/0.92] w-full max-w-[520px]">
      <svg viewBox="0 0 520 480" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse cx="260" cy="226" rx="236" ry="176" fill="none" stroke="#90aaf9" strokeOpacity="0.16" strokeDasharray="2 7" />
        <ellipse cx="260" cy="226" rx="170" ry="126" fill="none" stroke="#90aaf9" strokeOpacity="0.12" />
      </svg>
      <div className="absolute top-[47%] left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(185_200_255/0.5),rgb(47_85_224/0.22)_45%,transparent_70%)] blur-xl" />
      {faces.slice(0, SPOTS.length).map((src, i) => {
        const p = SPOTS[i];
        return (
          <div
            key={src}
            className="hv-float absolute overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_85%,#ffffff,#c9d5ff_45%,#85a2f9)] shadow-[0_0_0_1px_rgb(255_255_255/0.35),0_0_0_6px_rgb(255_255_255/0.05),0_24px_48px_-18px_rgb(0_0_0/0.6)]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}%`, aspectRatio: "1", translate: "-50% -50%", animationDelay: `${i * -1.7}s`, animationDuration: `${7 + (i % 3)}s` }}
          >
            <Image src={src} alt="" fill sizes="(min-width:1024px) 240px, 0px" className="object-cover object-[50%_12%] [transform:scale(1.08)_translateY(6%)]" />
          </div>
        );
      })}
    </div>
  );
}
