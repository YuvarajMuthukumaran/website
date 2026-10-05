// Same policy as the live robots.txt (everything crawlable), plus the new
// private areas, and the sitemap index Search Console already knows.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/portal/", "/patient-login/", "/api/"] },
      // Bots the live site already blocks.
      { userAgent: ["OmniExplorer_Bot", "FreeFind", "BecomeBot", "Nutch", "Jetbot/1.0", "Jetbot"], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap_index.xml`,
  };
}
