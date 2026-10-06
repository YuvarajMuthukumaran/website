// Cards shared by the home page, team pages, blog and archives.
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { formatDate, localPath, readingMinutes, tagsFor, type Doctor, type Entry } from "@/lib/content";
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
const titleCase = (t: string) => t.replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** The first real paragraph of the article, so the card does not repeat the heading the excerpt used to start with. */
function cardExcerpt(p: Entry) {
  for (const m of (p.contentHtml ?? "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const t = m[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "’").replace(/\s+/g, " ").trim();
    if (t.length < 70 || /^(%%|share|read more)/i.test(t)) continue;
    if (t.length <= 170) return t;
    const cut = t.slice(0, 170);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–—\s]+$/, "") + "…";
  }
  return (p.excerpt ?? "").replace(/\s*\[…\]|\s*\[&hellip;\]/g, "…");
}

export function PostCard({ p, priority, headingLevel = "h3", feature }: { p: Entry; priority?: boolean; headingLevel?: "h2" | "h3"; feature?: boolean }) {
  const H = headingLevel;
  const tag = tagsFor(p)[0];
  return (
    <article className="group relative flex h-full flex-col">
      <div className={clsx("duo relative overflow-hidden rounded-[var(--radius-blob)] bg-brand-50 shadow-[0_0_0_1px_var(--color-line)]", feature ? "aspect-[16/10]" : "aspect-[16/10]")}>
        {p.featuredImage ? (
          <Image
            src={localPath(p.featuredImage.url)}
            alt={p.featuredImage.alt ?? ""}
            fill
            sizes={feature ? "(min-width:1024px) 720px, 100vw" : "(min-width:1024px) 400px, (min-width:640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-[900ms] ease-[var(--ease-calm)] group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-sage-50 via-white to-brand-50" />
        )}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="flex flex-wrap items-center gap-2.5 text-[0.8125rem] text-ink-soft">
          {tag && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-900">{titleCase(tag.name)}</span>}
          <time dateTime={p.date ?? undefined}>{formatDate(p.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(p)} min read</span>
        </p>
        <H className={clsx("mt-3 font-display font-bold tracking-[-0.025em] text-ink", feature ? "text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-[1.1]" : "text-[1.15rem] leading-snug")}>
          <Link href={p.path} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {p.title}
          </Link>
        </H>
        {(() => { const x = cardExcerpt(p); return x ? <p className={clsx("mt-2 text-ink-soft", feature ? "line-clamp-3 max-w-[62ch] leading-relaxed" : "line-clamp-2 text-[0.9375rem] leading-relaxed")}>{x}</p> : null; })()}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-700">
          Read article <Icon name="arrow" className="size-4 transition-transform duration-[450ms] group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
