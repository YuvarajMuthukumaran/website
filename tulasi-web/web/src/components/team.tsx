// Team portraits: soft-tinted cards with the doctor's photo in colour, the name
// and role underneath. Used by the home page, /our-team/, /team/ and profiles.
//
// Photos: if a background-removed cut-out exists at /team-cutouts/<slug>.webp it
// is used as-is on the tinted card; otherwise the original photo is shown and a
// fade of the card colour covers the printed banner behind the doctor.
import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { localPath, type Doctor } from "@/lib/content";
import { credentialsOf } from "@/lib/team-tags";
import { Icon } from "@/components/ui/primitives";

// Quiet tints (sage and pale blue) that sit well on white.
export const PASTELS = ["#eef5f0", "#eaf1f8", "#f1f6ee", "#e8f0f5", "#eef4f1", "#ebf1f8"] as const;

export function portraitOf(d: Doctor) {
  const cut = `/team-cutouts/${d.slug}.webp`;
  if (existsSync(path.join(process.cwd(), "public", cut))) return { src: cut, cutout: true };
  return d.photo ? { src: localPath(d.photo), cutout: false } : null;
}

const roleLabel = (d: Doctor) =>
  (d.designation ?? "").replace(/\s*with over .*$/i, "").replace(/\s*\((RCI|A)\)/, "").trim();

export function PortraitCard({ d, index = 0, size = "md", tabbable = true, priority, className }: { d: Doctor; index?: number; size?: "sm" | "md" | "lg"; tabbable?: boolean; priority?: boolean; className?: string; overlay?: boolean }) {
  const p = portraitOf(d);
  const bg = PASTELS[index % PASTELS.length];
  return (
    <Link
      href={`/team/${d.slug}/`}
      tabIndex={tabbable ? undefined : -1}
      aria-hidden={tabbable ? undefined : true}
      className={clsx(
        "group relative isolate block shrink-0 overflow-hidden rounded-[1.25rem] ring-1 ring-black/[0.04] transition-all duration-300 ease-[var(--ease-calm)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-visible:-translate-y-1",
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
          className={clsx("transition-transform duration-500 ease-[var(--ease-calm)] group-hover:scale-[1.03]", p.cutout ? "object-cover object-bottom" : "scale-[1.1] object-cover object-[50%_30%]")}
        />
      )}
      {p && !p.cutout && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[40%]" style={{ background: `linear-gradient(to bottom, ${bg} 20%, ${bg}cc 55%, transparent)` }} />}
    </Link>
  );
}

/** Grid item for team pages: portrait + full name and designation (exactly as published) below it. */
export function TeamMember({ d, index, designation, excerpt, headingLevel: H = "h3" }: { d: Doctor; index: number; designation?: string | null; excerpt?: string | null; headingLevel?: "h2" | "h3" }) {
  return (
    <article className="group/member">
      <PortraitCard d={d} index={index} size="lg" />
      <H className="mt-3.5 font-display text-[1.0625rem] font-semibold leading-snug text-ink">
        <Link href={`/team/${d.slug}/`} className="hover:text-brand-700">{d.name}</Link>
      </H>
      <p className="mt-1 text-sm leading-snug text-ink-soft">{designation ?? d.designation}</p>
      {credentialsOf(d) && <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] leading-snug font-medium text-sage-700"><Icon name="check" className="size-3.5 shrink-0" strokeWidth={2.2} /> {credentialsOf(d)}</p>}
      {excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{excerpt}</p>}
    </article>
  );
}
