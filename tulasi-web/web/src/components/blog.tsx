// Blog listing pieces shared by /blog/, /blog/page/N/ and the archives.
import Link from "next/link";
import clsx from "clsx";
import type { Entry } from "@/lib/content";
import { PostCard } from "@/components/cards";
import { Reveal } from "@/components/ui/primitives";

// 10 per page, like WordPress: /blog/page/2/ … /blog/page/32/ keep the same URLs.
export const PER_PAGE = 10;

export function PostGrid({ posts, priorityFirst, featureFirst }: { posts: Entry[]; priorityFirst?: boolean; featureFirst?: boolean }) {
  const [first, ...rest] = posts;
  const list = featureFirst ? rest : posts;
  return (
    <>
      {featureFirst && first && (
        <Reveal className="mb-16 border-b border-line pb-16 [&_article]:lg:grid [&_article]:lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] [&_article]:lg:items-center [&_article]:lg:gap-12">
          <PostCard p={first} priority headingLevel="h2" feature />
        </Reveal>
      )}
      <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 3) * 80}>
            <PostCard p={p} priority={priorityFirst && !featureFirst && i < 3} headingLevel="h2" />
          </Reveal>
        ))}
      </ul>
    </>
  );
}

export function Pagination({ page, total, base }: { page: number; total: number; base: string }) {
  if (total <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}page/${n}/`);
  const nums = Array.from({ length: total }, (_, i) => i + 1).filter((n) => n === 1 || n === total || Math.abs(n - page) <= 2);
  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">← Newer</Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span aria-hidden="true" className="px-1 text-ink-soft">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={clsx("grid size-11 place-items-center rounded-full text-sm font-semibold transition-colors", n === page ? "bg-brand-600 text-white" : "text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1px_var(--color-brand-200)]")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < total && <Link href={href(page + 1)} rel="next" className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Older →</Link>}
    </nav>
  );
}
