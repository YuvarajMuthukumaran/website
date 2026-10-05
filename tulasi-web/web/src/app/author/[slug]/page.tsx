// /author/<slug>/
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBySlug, getAuthors, postsByAuthor } from "@/lib/content";
import { metadataFromArchive } from "@/lib/seo";
import { Archive } from "@/components/Archive";

export const dynamicParams = false;
export const generateStaticParams = () => getAuthors().map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: PageProps<"/author/[slug]">): Promise<Metadata> {
  const a = getAuthorBySlug((await params).slug);
  if (!a) return {};
  return metadataFromArchive(a.seo, { title: a.name, path: a.path });
}

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const a = getAuthorBySlug((await params).slug);
  if (!a) notFound();
  return <Archive title={a.name === "admin" ? "Tulasi Healthcare" : a.name} path={a.path} kind="Author" posts={postsByAuthor(a)} />;
}
