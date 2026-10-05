// /category/<slug>/
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArchiveSeo, getCategories, getCategoryBySlug, postsByCategory } from "@/lib/content";
import { metadataFromArchive } from "@/lib/seo";
import { Archive } from "@/components/Archive";

export const dynamicParams = false;
export const generateStaticParams = () => getCategories().map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const cat = getCategoryBySlug((await params).slug);
  if (!cat) return {};
  return metadataFromArchive(getArchiveSeo(cat.path) ?? { title: cat.seo.title, description: cat.seo.description, canonical: cat.seo.canonical, robots: null }, { title: cat.name, path: cat.path });
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const cat = getCategoryBySlug((await params).slug);
  if (!cat) notFound();
  return <Archive title={getArchiveSeo(cat.path)?.h1 ?? cat.name} path={cat.path} kind="Category" posts={postsByCategory(cat.id)} description={cat.description} />;
}
