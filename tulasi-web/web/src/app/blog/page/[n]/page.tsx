// /blog/page/N/ (WordPress-style pagination).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl, getPosts } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { Pagination, PER_PAGE, PostGrid } from "@/components/blog";

export const dynamicParams = false;
const totalPages = () => Math.ceil(getPosts().length / PER_PAGE);

export function generateStaticParams() {
  return Array.from({ length: totalPages() - 1 }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: PageProps<"/blog/page/[n]">): Promise<Metadata> {
  const { n } = await params;
  return {
    title: { absolute: `Blog - Page ${n} of ${totalPages()} - Tulasi Healthcare` },
    alternates: { canonical: absoluteUrl(`/blog/page/${n}/`) },
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}

export default async function BlogPage({ params }: PageProps<"/blog/page/[n]">) {
  const n = Number((await params).n);
  const posts = getPosts().slice((n - 1) * PER_PAGE, n * PER_PAGE);
  if (!posts.length) notFound();
  return (
    <>
      <PageHero compact title={`Blog: page ${n}`} crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }, { name: `Page ${n}`, path: `/blog/page/${n}/` }]} />
      <div className="container-page py-12 lg:py-16">
        <PostGrid posts={posts} />
        <Pagination page={n} total={totalPages()} base="/blog/" />
      </div>
    </>
  );
}
