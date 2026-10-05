// Shared template for /tag/x/, /category/x/ and /author/x/ archives.
import type { Entry } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { PostGrid } from "@/components/blog";

export function Archive({ title, path, kind, posts, description }: { title: string; path: string; kind: string; posts: Entry[]; description?: string | null }) {
  return (
    <>
      <PageHero compact scene="pages" title={title} lead={description ?? `${posts.length} article${posts.length === 1 ? "" : "s"}`} crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }, { name: `${kind}: ${title.replace(/^(Tag|Category|Author):\s*/i, "")}`, path }]} />
      <div className="container-page py-20 lg:py-28">
        {posts.length ? <PostGrid posts={posts} /> : <p className="text-ink-soft">No articles yet.</p>}
      </div>
    </>
  );
}
