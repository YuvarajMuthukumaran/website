// Blog listing pieces shared by /blog/, /blog/page/N/ and the archives.
import Link from "next/link";
import clsx from "clsx";
import type { Entry } from "@/lib/content";
import { PostCard } from "@/components/cards";
import { Reveal } from "@/components/ui/primitives";

// 10 per page, like WordPress: /blog/page/2/ … /blog/page/32/ keep the same URLs.
export const PER_PAGE = 10;

export function PostGrid({ posts, priorityFirst }: { posts: Entry[]; priorityFirst?: boolean }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 3) * 80}>
          <PostCard p={p} priority={priorityFirst && i < 3} headingLevel="h2" />
        </Reveal>
      ))}
    </ul>
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
            className={clsx("grid size-11 place-items-center rounded-full text-sm font-semibold", n === page ? "bg-brand-600 text-white" : "text-ink hover:bg-brand-50")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < total && <Link href={href(page + 1)} rel="next" className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Older →</Link>}
    </nav>
  );
}
