// /blog/<slug>/: all 318 posts, same slugs, same text, same Yoast metadata.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doctorByName, formatDate, getPostBySlug, getPosts, localPath, readingMinutes, relatedPosts, renderHtml, tagsFor } from "@/lib/content";
import { addHeadingIds, extractFaq, headingsOf, tidy } from "@/lib/html";
import { articleSchema, faqSchema, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { Aside } from "@/components/Aside";
import { PostCard } from "@/components/cards";
import { ButtonLink, Icon, JsonLd, Reveal } from "@/components/ui/primitives";

export const dynamicParams = false;
// The live theme shows the post title and the content H1; when they differ, both stay visible.
const differs = (a: string, b: string) => a.replace(/\W+/g, "").toLowerCase() !== b.replace(/\W+/g, "").toLowerCase();


export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: decodeURIComponent(p.slug) }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) return {};
  return metadataFromSeo(post.seo, { title: post.title, path: post.path });
}

export default async function Post({ params }: PageProps<"/blog/[slug]">) {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();
  const html = addHeadingIds(renderHtml(tidy(post.contentHtml)));
  const toc = headingsOf(html);
  const faq = extractFaq(post.contentHtml);
  const tags = tagsFor(post);
  const writtenBy = post.seo.twitter?.misc?.["Written by"];
  const doctor = doctorByName(writtenBy);
  const related = relatedPosts(post, 3);
  const img = post.featuredImage;

  return (
    <>
      <PageHero title={post.h1} kicker={differs(post.title, post.h1) ? post.title : null} crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }, { name: post.title, path: post.path }]}>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-100">
          {writtenBy && writtenBy !== "admin" && (
            <span className="inline-flex items-center gap-2">
              <Icon name="user" className="size-4" />
              {doctor ? <Link href={`/team/${doctor.slug}/`} className="link-underline font-semibold text-white">{writtenBy}</Link> : writtenBy}
            </span>
          )}
          <span className="inline-flex items-center gap-2"><Icon name="calendar" className="size-4" /><time dateTime={post.date ?? undefined}>{formatDate(post.date)}</time></span>
          {post.modified && post.modified.slice(0, 10) !== post.date?.slice(0, 10) && <span>Updated <time dateTime={post.modified}>{formatDate(post.modified)}</time></span>}
          <span className="inline-flex items-center gap-2"><Icon name="clock" className="size-4" />{readingMinutes(post)} min read</span>
        </p>
      </PageHero>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-16">
        <div className="min-w-0">
          {img && (
            <Image
              src={localPath(img.url)}
              alt={img.alt ?? ""}
              width={img.width ?? 1280}
              height={img.height ?? 720}
              priority
              sizes="(min-width:1024px) 800px, 100vw"
              className="mb-10 h-auto w-full rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]"
            />
          )}
          <article className="prose-tulasi max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

          {tags.length > 0 && (
            <div className="mt-12 border-t border-line pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-soft">Related Tags</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <li key={t.id}>
                    <Link href={t.path} className="inline-flex min-h-9 items-center rounded-full bg-brand-50 px-4 text-sm font-medium text-brand-700 hover:bg-brand-100">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {doctor && (
            <div className="mt-10 flex flex-col gap-5 rounded-[var(--radius-card)] bg-mist p-6 sm:flex-row sm:items-center">
              {doctor.photo && <Image src={localPath(doctor.photo)} alt={doctor.name} width={96} height={96} className="size-24 shrink-0 rounded-2xl object-cover object-top" />}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Written by</p>
                <p className="mt-1 font-display text-lg font-bold text-ink">{doctor.name}</p>
                <p className="text-sm text-ink-soft">{doctor.designation}</p>
                <Link href={`/team/${doctor.slug}/`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">View profile <Icon name="arrow" className="size-4" /></Link>
              </div>
            </div>
          )}
        </div>
        <Aside path={post.path} toc={toc} />
      </div>

      {related.length > 0 && (
        <section className="bg-mist py-16 lg:py-20" aria-labelledby="related-title">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-title" className="font-display text-[length:var(--text-h2)] font-bold text-ink">Keep reading</h2>
              <ButtonLink href="/blog/" variant="ghost">All articles <Icon name="arrow" className="size-4" /></ButtonLink>
            </div>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i * 100}><PostCard p={p} /></Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <JsonLd data={articleSchema(post, writtenBy)} />
      {faq.length >= 2 && <JsonLd data={faqSchema(faq)} />}
    </>
  );
}
