// /blog/: newest articles, with search and pagination (/blog/page/2/ ...).
import type { Metadata } from "next";
import { getPageByPath, getPosts } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { Pagination, PER_PAGE, PostGrid } from "@/components/blog";
import { BlogSearch } from "@/components/BlogSearch";

export function generateMetadata(): Metadata {
  const page = getPageByPath("/blog/")!;
  return metadataFromSeo(page.seo, { title: page.title, path: "/blog/" });
}

export default function BlogIndex() {
  const page = getPageByPath("/blog/")!;
  const posts = getPosts();
  return (
    <>
      <PageHero scene="pages" title={page.h1} crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }]} lead="Help Erase Stigma. You can change attitudes about mental health by learning more and sharing our educational resources with your friends and loved ones.">
        <BlogSearch />
      </PageHero>
      <div className="container-page py-20 lg:py-28">
        <PostGrid posts={posts.slice(0, PER_PAGE)} priorityFirst featureFirst />
        <Pagination page={1} total={Math.ceil(posts.length / PER_PAGE)} base="/blog/" />
      </div>
    </>
  );
}
