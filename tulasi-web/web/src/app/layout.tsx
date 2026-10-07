import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CONCERNS, PSYCH_SERVICES, roleInPlace } from "@/lib/care";
import { LOCATIONS } from "@/lib/locations";
import type { SearchItem } from "@/components/layout/SiteSearch";
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
  const seen = new Set<string>();
  const searchItems: SearchItem[] = [
    ...site.menu.flatMap((m) => m.groups.flatMap((g) => g.links.filter((l) => l.href).map((l) => ({ label: roleInPlace(l.label), href: l.href as string, group: m.label })))),
    ...CONCERNS.map((c) => ({ label: c.label, href: c.href, group: "Conditions" })),
    ...PSYCH_SERVICES.map((s) => ({ label: s.title, href: `/psychological-services/#${s.id}`, group: "Services", hint: s.text })),
    ...LOCATIONS.map((l) => ({ label: l.name, href: `/locations/#${l.id}`, group: "Locations", hint: l.address })),
    ...doctors.map((d) => ({ label: d.name, href: `/team/${d.slug}/`, group: "Team", hint: d.designation ?? undefined })),
    { label: "Book an appointment", href: "/book-appointment/", group: "Book" },
    { label: "Find the right specialist", href: "/find-a-specialist/", group: "Tools", hint: "Three quick questions" },
    { label: "Free 2-minute mental health check-in", href: "/mental-health-check/", group: "Tools" },
    { label: "Patient login", href: "/patient-login/", group: "Account", hint: "See or cancel your appointments" },
  ].filter((i) => (seen.has(i.href + i.label) ? false : (seen.add(i.href + i.label), true)));
  const popular: SearchItem[] = [
    { label: "Book an appointment", href: "/book-appointment/", group: "Book" },
    { label: "Find the right specialist", href: "/find-a-specialist/", group: "Tools", hint: "Three quick questions" },
    { label: "Psychometric testing", href: "/psychological-services/#psychometric-testing", group: "Services" },
    { label: "Anxiety", href: "/anxiety/", group: "Conditions" },
    { label: "Depression", href: "/depression/", group: "Conditions" },
    { label: "Locations", href: "/locations/", group: "Locations" },
  ];
  const team = { count: doctors.length, faces: doctors.map(portraitOf).filter((p) => p?.cutout).map((p) => p!.src).slice(0, 5) };
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <LazyMotionRoot>
        <a href="#main" className="sr-only z-[100] rounded-full bg-brand-600 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to content
        </a>
        <CrisisStrip phone={phone} />
        <Header menu={site.menu} searchItems={searchItems} popular={popular} phone={phone} logo={{ src: logo.src, alt: "Tulasi Healthcare logo" }} team={team} />
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
