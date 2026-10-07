import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getDoctors, getSite, SITE_URL } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { portraitOf } from "@/components/team";
import { Footer } from "@/components/layout/Footer";
import { CrisisStrip } from "@/components/layout/CrisisStrip";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Consent } from "@/components/layout/Consent";
import { LazyMotionRoot } from "@/components/motion/LazyMotionRoot";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { JsonLd } from "@/components/ui/primitives";
import { hospitalSchema, websiteSchema } from "@/lib/seo";

// Self-hosted at build time by next/font (no request to Google at runtime).
// Variable fonts: one file each instead of one per weight.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
// Body text uses "optional": it paints at once in a metric-matched fallback and
// never repaints late (a late font swap was the mobile LCP). Inter is
// preloaded, so on most visits it is ready in time anyway.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "optional" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Tulasi Healthcare",
  formatDetection: { telephone: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const site = getSite();
  const phone = { display: site.contact.phoneDisplay, href: site.contact.phoneHref };
  const logo = site.logo ?? { src: "/brand/tulasi-logo-600.webp", alt: "Tulasi Healthcare" };
  const doctors = getDoctors();
  const team = { count: doctors.length, faces: doctors.map(portraitOf).filter((p) => p?.cutout).map((p) => p!.src).slice(0, 5) };
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <LazyMotionRoot>
        <a href="#main" className="sr-only z-[100] rounded-full bg-brand-600 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to content
        </a>
        <CrisisStrip phone={phone} />
        <Header menu={site.menu} phone={phone} logo={{ src: logo.src, alt: "Tulasi Healthcare logo" }} team={team} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer site={site} />
        <FloatingActions phone={phone} doctorSlugs={Object.fromEntries(doctors.map((d) => [d.name, d.slug]))} doctorPhotos={Object.fromEntries(doctors.flatMap((d) => { const p = portraitOf(d); return p ? [[d.name, p.src]] : []; }))} />
        <Consent />
        <MotionProvider />
        <ScrollProgress />
        <JsonLd data={[hospitalSchema(), websiteSchema()]} />
        </LazyMotionRoot>
      </body>
    </html>
  );
}
