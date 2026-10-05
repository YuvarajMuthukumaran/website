import { sitemapResponse } from "@/lib/sitemaps";
export const dynamic = "force-static";
export const GET = () => sitemapResponse("post_tag");
