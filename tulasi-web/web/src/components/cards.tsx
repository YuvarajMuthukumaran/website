// Cards shared by the home page, team pages, blog and archives.
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { formatDate, localPath, readingMinutes, type Doctor, type Entry } from "@/lib/content";
import { Icon } from "@/components/ui/primitives";

/** Doctor card: lifts with depth on hover, photo eases in, profile link revealed. */
export function DoctorCard({ d, priority, className, showExcerpt }: { d: Doctor; priority?: boolean; className?: string; showExcerpt?: boolean }) {
  return (
    <article className={clsx("group relative h-full", className)}>
      <Link
        href={`/team/${d.slug}/`}
        className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-500 ease-[var(--ease-calm)] [transform:perspective(900px)] group-hover:-translate-y-2 group-hover:shadow-[var(--shadow-lift)] group-hover:[transform:perspective(900px)_rotateX(2deg)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-brand-50 to-brand-100">
          {d.photo ? (
            <Image
              src={localPath(d.photo)}
              alt={`${d.name}, ${d.designation ?? "Tulasi Healthcare"}`}
              fill
              sizes="(min-width:1024px) 280px, (min-width:640px) 45vw, 80vw"
              className="object-cover object-top transition-transform duration-700 ease-[var(--ease-calm)] group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="grid h-full place-items-center text-brand-300">
              <Icon name="user" className="size-16" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-950/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute bottom-3 left-3 inline-flex translate-y-3 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-800 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            View profile <Icon name="arrow" className="size-3.5" />
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-bold leading-snug text-ink">{d.name}</h3>
          {d.designation && <p className="mt-1 text-sm leading-snug text-ink-soft">{d.designation}</p>}
          {showExcerpt && d.excerpt && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-soft">{d.excerpt}</p>}
          {d.rciLicensed && <p className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wider text-brand-600">RCI licensed</p>}
        </div>
      </Link>
    </article>
  );
}

/** Blog post card with an image reveal on hover. */
export function PostCard({ p, priority, headingLevel = "h3" }: { p: Entry; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-500 ease-[var(--ease-calm)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-brand-50">
        {p.featuredImage ? (
          <Image
            src={localPath(p.featuredImage.url)}
            alt={p.featuredImage.alt ?? ""}
            fill
            sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-calm)] group-hover:scale-[1.06]"
            priority={priority}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-brand-100 to-brand-50" />
        )}
        {/* soft colour wash that lifts on hover */}
        <div aria-hidden="true" className="absolute inset-0 bg-brand-900/10 transition-opacity duration-500 group-hover:opacity-0" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-3 text-xs font-medium text-ink-soft">
          <time dateTime={p.date ?? undefined}>{formatDate(p.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(p)} min read</span>
        </p>
        <H className="mt-3 font-display text-lg font-bold leading-snug text-ink">
          <Link href={p.path} className="after:absolute after:inset-0 hover:text-brand-700">
            {p.title}
          </Link>
        </H>
        {p.excerpt && <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">{p.excerpt.replace(/\s*\[…\]|\s*\[&hellip;\]/g, "…")}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-700">
          Read article <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
