// Design-system building blocks shared by every page (server-safe).
import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

/** Wraps content that fades/slides in on scroll (see MotionProvider). Visible by default. */
export function Reveal({ children, delay = 0, variant, as: Tag = "div", className, ...rest }: { children: ReactNode; delay?: number; variant?: "scale" | "left"; as?: "div" | "section" | "li" | "article" | "header" | "figure"; className?: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <Tag className={clsx("reveal", variant && `reveal-${variant}`, className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties} {...(rest as object)}>
      {children}
    </Tag>
  );
}

export type ButtonVariant = "primary" | "accent" | "ghost" | "light" | "outline-light" | "line" | "glass" | "soft";

/**
 * One calm button system: solid quiet blue for the main action, white with a
 * hairline for secondary ones, a pale tint for soft ones. No glows, no red.
 * (accent/light/glass/outline-light are kept as aliases so older call sites stay valid.)
 * 48px (md) / 54px (lg) tap targets.
 */
export function btnClass(variant: ButtonVariant = "primary", size: "md" | "lg" = "md", className?: string) {
  const solid = variant === "primary" || variant === "accent";
  const outline = variant === "line" || variant === "light" || variant === "glass" || variant === "outline-light";
  return clsx(
    "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-300 ease-[var(--ease-calm)] active:translate-y-px",
    size === "lg" ? "min-h-[3.375rem] px-7 text-base" : "min-h-12 px-6 text-[0.9375rem]",
    solid && "bg-brand-600 text-white shadow-[0_1px_2px_rgb(23_34_44/0.12)] hover:bg-brand-700",
    outline && "bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line),0_1px_2px_rgb(23_34_44/0.04)] hover:shadow-[inset_0_0_0_1px_var(--color-brand-300)] hover:text-brand-700",
    variant === "soft" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
    variant === "ghost" && "!min-h-11 !px-3 text-brand-700 hover:bg-brand-50",
    className
  );
}

type ButtonProps = { href: string; children: ReactNode; variant?: ButtonVariant; size?: "md" | "lg"; className?: string; external?: boolean } & Omit<ComponentProps<"a">, "href">;

export function ButtonLink({ href, children, variant = "primary", size = "md", className, external, ...rest }: ButtonProps) {
  const cls = btnClass(variant, size, className);
  const isExternal = external ?? /^(https?:|tel:|mailto:)/.test(href);
  return isExternal ? (
    <a href={href} className={cls} {...rest}>{children}</a>
  ) : (
    <Link href={href} className={cls} {...(rest as object)}>{children}</Link>
  );
}

/** Arrow that slides on hover of the enclosing button/link. */
export function Arrow({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx(className, "shrink-0 transition-transform duration-[450ms] ease-[var(--ease-calm)] group-hover:translate-x-1 group-hover/btn:translate-x-1")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Heading text with one highlighted phrase (colour only, no animation).
 * The rendered text is identical to `text`. Kept under its old name so call sites stay valid.
 */
export function Kinetic({ text, highlight }: { text: string; highlight?: string | null; tone?: "light" | "dark"; start?: number }) {
  const idx = highlight ? text.indexOf(highlight) : -1;
  if (idx < 0 || !highlight) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-brand-600">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export function SectionHeading({ eyebrow, title, text, align = "left", as: H = "h2", className, highlight, id }: { eyebrow?: string | null; title: string; text?: string | null; align?: "left" | "center"; as?: "h1" | "h2" | "h3"; className?: string; dark?: boolean; highlight?: string | null; id?: string }) {
  return (
    <Reveal as="header" className={clsx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <H id={id} className="text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">
        <Kinetic text={title} highlight={highlight} />
      </H>
      {text && <p className={clsx("mt-4 max-w-[56ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft", align === "center" && "mx-auto")}>{text}</p>}
    </Reveal>
  );
}

/** Structured data, rendered into the server HTML. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-soft">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="opacity-40">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="line-clamp-1 text-ink">{it.name}</span>
            ) : (
              <Link href={it.path} className="link-underline hover:text-brand-700">{it.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Tag({ children, className }: { children: ReactNode; tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={clsx("inline-flex min-h-7 items-center gap-1.5 rounded-full bg-sage-50 px-2.5 text-[0.8125rem] font-medium text-sage-700 shadow-[inset_0_0_0_1px_var(--color-sage-100)]", className)}>
      {children}
    </span>
  );
}

const UI: Record<string, ReactNode> = {
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M16 2.5v4M8 2.5v4M3 9.5h18" /></>,
  chat: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.55L3 21l1.45-5.6A8.5 8.5 0 1 1 21 12z" />,
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="m3 7 9 6 9-6" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h10" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  heart: <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.5 5 5 0 1 1 7.5 6.5z" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  play: <path d="M7 4.5v15l13-7.5z" />,
  download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" />,
  quote: <path d="M9 7H5a2 2 0 0 0-2 2v4h6v-6zm0 6c0 3-2 4-4 4M21 7h-4a2 2 0 0 0-2 2v4h6V7zm0 6c0 3-2 4-4 4" />,
  award: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
};

export function Icon({ name, className = "size-5", strokeWidth = 1.75 }: { name: keyof typeof UI | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {UI[name]}
    </svg>
  );
}

/**
 * Tulasi's own line icons for services and conditions: 24px grid, 1.5px stroke,
 * rounded caps, hopeful metaphors only (breath, light, growth, holding).
 */
const BRAND: Record<string, ReactNode> = {
  psychiatry: <><path d="M6 3v5a4 4 0 0 0 8 0V3M10 12v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="11" r="2" /></>,
  therapy: <><path d="M4 5h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-4 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M18 9h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v3l-4-3h-3" /></>,
  inpatient: <><path d="M3 11l9-7 9 7M5 9.5V20h14V9.5" /><path d="M12 17s-3-1.7-3-3.5a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.8-3 3.5-3 3.5z" /></>,
  sprout: <path d="M12 21v-8M12 13c0-4.5 3-7 8-7 0 5-3 7-8 7zM12 15.5c0-3-2-5-6-5 0 3 2 5 6 5z" />,
  child: <><circle cx="8" cy="7" r="2" /><circle cx="16" cy="5.5" r="2.5" /><path d="M5 21v-4.5a3 3 0 0 1 6 0V21M12.5 21v-6a3.5 3.5 0 0 1 7 0v6" /></>,
  memory: <path d="M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6z" />,
  waves: <><circle cx="12" cy="12" r="1.2" /><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" /></>,
  workplace: <><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M12 16.5s-2.5-1.4-2.5-3a1.3 1.3 0 0 1 2.5-.6 1.3 1.3 0 0 1 2.5.6c0 1.6-2.5 3-2.5 3z" /></>,
  assessment: <><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5M8.5 10.5h7M8.5 14h4.5M8.5 17.5h2.5" /></>,
  breath: <path d="M3 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 15.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  sunrise: <path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 6v2.5M5.6 9.6 7 11M18.4 9.6 17 11" />,
  order: <path d="M4.5 7h4M4.5 12h4M4.5 17h4M13 7l1.5 1.5L17.5 5.5M13 12h6.5M13 17h6.5" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5zM17 3.5v3M15.5 5h3" />,
  cradle: <><path d="M12 20c-4 0-7.5-2.4-8.5-6.5L3 9.5M12 20c4 0 7.5-2.4 8.5-6.5L21 9.5" /><circle cx="12" cy="10" r="3.5" /></>,
  balance: <path d="M12 4v16M6 20h12M5 9l-2.5 5a3 3 0 0 0 5 0L5 9zm14 0-2.5 5a3 3 0 0 0 5 0L19 9zM5 9h14" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  family: <><circle cx="7.5" cy="6" r="2.2" /><circle cx="16.5" cy="6" r="2.2" /><circle cx="12" cy="12" r="1.8" /><path d="M3.5 20v-4a4 4 0 0 1 8 0M12.5 16a4 4 0 0 1 8 0v4M9.5 20v-1.5a2.5 2.5 0 0 1 5 0V20" /></>,
};
export type BrandIconName = keyof typeof BRAND;

export function BrandIcon({ name, className = "size-6" }: { name: BrandIconName | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {BRAND[name] ?? BRAND.cradle}
    </svg>
  );
}
