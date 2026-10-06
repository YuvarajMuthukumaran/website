// Shared template for /tag/x/, /category/x/ and /author/x/ archives.
import type { Entry } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { PostGrid } from "@/components/blog";
import Link from "next/link";
import { Arrow } from "@/components/ui/primitives";

const SHOWN = 18;

export function Archive({ title, path, kind, posts, description }: { title: string; path: string; kind: string; posts: Entry[]; description?: string | null }) {
  return (
    <>
      <PageHero compact title={title} lead={description ?? `${posts.length} article${posts.length === 1 ? "" : "s"}`} crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }, { name: `${kind}: ${title.replace(/^(Tag|Category|Author):\s*/i, "")}`, path }]} />
      <div className="container-page py-12 lg:py-16">
        {posts.length ? <PostGrid posts={posts.slice(0, SHOWN)} /> : <p className="text-ink-soft">No articles yet.</p>}
        {posts.length > SHOWN && (
          <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-soft">
            Showing the latest {SHOWN} of {posts.length} articles.
            <Link href="/blog/" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900">Browse every article <Arrow className="size-4" /></Link>
          </p>
        )}
      </div>
    </>
  );
}
