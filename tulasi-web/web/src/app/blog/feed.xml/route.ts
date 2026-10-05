// RSS feed (the WordPress /feed/ URL redirects here, so subscribers keep receiving posts).
import { absoluteUrl, getPosts, SITE_URL } from "@/lib/content";

export const dynamic = "force-static";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = getPosts()
    .slice(0, 30)
    .map((p) => `<item><title>${esc(p.title)}</title><link>${absoluteUrl(p.path)}</link><guid isPermaLink="true">${absoluteUrl(p.path)}</guid>${p.date ? `<pubDate>${new Date(p.date).toUTCString()}</pubDate>` : ""}<description>${esc(p.excerpt ?? "")}</description></item>`)
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Tulasi Healthcare Blog</title><link>${SITE_URL}/blog/</link><atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/><description>Mental health articles from Tulasi Healthcare</description><language>en-IN</language>\n${items}\n</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } }
  );
}
