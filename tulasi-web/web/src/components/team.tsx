// Team portraits: pastel cards with black-and-white photos, name and role on
// the photo. Used by the home page "team wall", /our-team/, /team/ and profiles.
//
// Photos: if a background-removed cut-out exists at /team-cutouts/<slug>.webp
// it is used as-is on the pastel card; otherwise the original photo is shown
// in greyscale and tinted into the card colour (luminosity blend), which turns
// the branded backdrop in the current photos into a soft texture.
import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { localPath, type Doctor } from "@/lib/content";

// Soft pastels that sit well next to the brand blue (all keep white text legible on the dark name band).
export const PASTELS = ["#e8e2fb", "#dff1e4", "#fdf1c7", "#fde2e4", "#dbe9fb", "#f3e6d8"] as const;

export function portraitOf(d: Doctor) {
  const cut = `/team-cutouts/${d.slug}.webp`;
  if (existsSync(path.join(process.cwd(), "public", cut))) return { src: cut, cutout: true };
  return d.photo ? { src: localPath(d.photo), cutout: false } : null;
}

const roleLabel = (d: Doctor) =>
  (d.designation ?? "").replace(/\s*with over .*$/i, "").replace(/\s*\((RCI|A)\)/, "").trim();

export function PortraitCard({ d, index = 0, size = "md", tabbable = true, priority, className, overlay = true }: { d: Doctor; index?: number; size?: "sm" | "md" | "lg"; tabbable?: boolean; priority?: boolean; className?: string; overlay?: boolean }) {
  const p = portraitOf(d);
  const bg = PASTELS[index % PASTELS.length];
  return (
    <Link
      href={`/team/${d.slug}/`}
      tabIndex={tabbable ? undefined : -1}
      aria-hidden={tabbable ? undefined : true}
      className={clsx(
        "group relative isolate block shrink-0 overflow-hidden rounded-[1.6rem] shadow-[var(--shadow-soft)] transition-all duration-500 ease-[var(--ease-calm)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] focus-visible:-translate-y-1.5",
        size === "sm" && "aspect-[4/5] w-[150px] sm:w-[170px]",
        size === "md" && "aspect-[4/5] w-[190px] sm:w-[210px]",
        size === "lg" && "aspect-[4/5] w-full",
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {p && (
        <Image
          src={p.src}
          alt={tabbable ? `${d.name}, ${roleLabel(d)}` : ""}
          fill
          priority={priority}
          sizes={size === "lg" ? "(min-width:1024px) 280px, 50vw" : "220px"}
          className={clsx(
            "object-cover transition-all duration-700 ease-[var(--ease-calm)] group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:mix-blend-normal",
            p.cutout ? "object-bottom grayscale" : "scale-[1.12] object-[50%_30%] grayscale contrast-[1.05] mix-blend-luminosity group-hover:scale-[1.16]"
          )}
        />
      )}
      {/* Original photos have a printed banner behind the doctor: fade the card
          colour over the top so the face stays the focus (not needed for cut-outs). */}
      {p && !p.cutout && (
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[42%] transition-opacity duration-700 group-hover:opacity-0" style={{ background: `linear-gradient(to bottom, ${bg} 18%, ${bg}cc 55%, transparent)` }} />
      )}
      {/* name band */}
      {overlay && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pt-12 pb-3.5 text-center">
        <span className="block font-display text-[0.98rem] font-bold leading-tight text-white sm:text-[1.05rem]">{d.name}</span>
        <span className="mt-1 block text-[0.62rem] font-semibold uppercase leading-snug tracking-[0.1em] text-white/85">{roleLabel(d)}</span>
      </span>}
    </Link>
  );
}

/**
 * Two rows drifting in opposite directions; pauses on hover/focus; static and
 * scrollable with prefers-reduced-motion. Each row is rendered twice for a
 * seamless loop; the copy is hidden from screen readers and keyboard.
 */
export function TeamWall({ doctors }: { doctors: Doctor[] }) {
  const half = Math.ceil(doctors.length / 2);
  const rows = [doctors.slice(0, half), doctors.slice(half)];
  return (
    <div className="team-wall relative -mx-4 space-y-5 sm:-mx-6 lg:-mx-8">
      {/* soft fade at both edges */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-24" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-24" />
      {rows.map((row, r) => (
        <div key={r} className="marquee overflow-x-auto [scrollbar-width:none]">
          <ul className={clsx("marquee-track flex w-max gap-5 px-4 sm:px-6 lg:px-8", r === 1 && "marquee-reverse")} style={{ animationDuration: `${row.length * 6}s` }}>
            {[...row, ...row].map((d, i) => (
              <li key={`${d.slug}-${i}`} className={i >= row.length ? "team-dup" : undefined}>
                <PortraitCard d={d} index={i + r * 3} tabbable={i < row.length} priority={r === 0 && i < 2} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Grid item for team pages: portrait + full name and designation (exactly as published) below it. */
export function TeamMember({ d, index, designation, excerpt, headingLevel: H = "h3" }: { d: Doctor; index: number; designation?: string | null; excerpt?: string | null; headingLevel?: "h2" | "h3" }) {
  return (
    <article className="group/member">
      <PortraitCard d={d} index={index} size="lg" overlay={false} />
      <H className="mt-4 font-display text-lg font-bold leading-snug text-ink">
        <Link href={`/team/${d.slug}/`} className="hover:text-brand-700">{d.name}</Link>
      </H>
      <p className="mt-1 text-sm leading-snug text-ink-soft">{designation ?? d.designation}</p>
      {excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{excerpt}</p>}
    </article>
  );
}
