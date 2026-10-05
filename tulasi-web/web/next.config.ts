import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Redirect map produced by the Phase 0 crawl (scraper/06-build-reports.mjs).
// Query-string shortlinks (/?p=123) are handled in src/proxy.ts instead,
// because a config redirect would carry the query string along.
type Redirect = { from: string; to: string; status: number };
const redirectFile = path.join(process.cwd(), "content", "redirects.json");
const retiredFile = path.join(process.cwd(), "content", "retired-media.json");
const retiredMedia: { path: string; to: string }[] = existsSync(retiredFile) ? JSON.parse(readFileSync(retiredFile, "utf8")) : [];
const redirectMap: Redirect[] = existsSync(redirectFile)
  ? JSON.parse(readFileSync(redirectFile, "utf8")).filter((r: Redirect) => !r.from.includes("?") && r.from + "/" !== r.to)
  : [];

// Security headers the live site is missing today. CSP allows only what the
// site actually loads: itself, the chat/booking API, and Google Analytics/Ads.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "https://api.tulasihealthcare.com";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.co.in https://i.ytimg.com",
  "font-src 'self'",
  `connect-src 'self' ${API_ORIGIN} https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://googleads.g.doubleclick.net`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://td.doubleclick.net",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Every live URL ends in "/" (e.g. /blog/what-is-dbt-therapy/); keep it that way.
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    // Media keep their original /wp-content/uploads/... paths (public/).
    localPatterns: [{ pathname: "/**" }],
  },
  // Optional same-origin proxy for the chat/booking API: set API_PROXY_TARGET
  // (and leave NEXT_PUBLIC_API_URL empty) so the browser calls /api/* on this
  // site and Next forwards it. No CORS setup needed on the API host.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    return target ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }] : [];
  },
  async redirects() {
    return [
      ...redirectMap.map((r) => ({ source: r.from, destination: r.to, permanent: true })),
      // Old decorative images retired in the redesign (never content images): 301 to the page they decorated.
      ...retiredMedia.map((r) => ({ source: r.path, destination: r.to, permanent: true })),
      // Yoast answers /sitemap.xml with the index; keep that.
      { source: "/sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      // Profiles linked from live pages that no longer exist → the team page (see gap report).
      { source: "/team/dr-anil-kumar/", destination: "/our-team/", permanent: false },
      { source: "/team/ms-zarafshan-khan/", destination: "/our-team/", permanent: false },
      { source: "/team/dr-naseem-akhtar-qureshi/", destination: "/our-team/", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // Dev tooling needs eval(); the policy applies to production builds.
          ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
        ],
      },
      {
        source: "/wp-content/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
