// /tag/<slug>/: all 223 tag archives stay live with their existing titles and robots.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArchiveSeo, getTagBySlug, getTags, postsByTag } from "@/lib/content";
import { metadataFromArchive } from "@/lib/seo";
import { Archive } from "@/components/Archive";

export const dynamicParams = false;
export const generateStaticParams = () => getTags().map((t) => ({ slug: decodeURIComponent(t.slug) }));

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const tag = getTagBySlug((await params).slug);
  if (!tag) return {};
  return metadataFromArchive(getArchiveSeo(tag.path) ?? { title: tag.seo.title, description: tag.seo.description, canonical: tag.seo.canonical, robots: null }, { title: tag.name, path: tag.path });
}

export default async function TagPage({ params }: PageProps<"/tag/[slug]">) {
  const tag = getTagBySlug((await params).slug);
  if (!tag) notFound();
  return <Archive title={getArchiveSeo(tag.path)?.h1 ?? tag.name} path={tag.path} kind="Tag" posts={postsByTag(tag.id)} description={tag.description} />;
}
