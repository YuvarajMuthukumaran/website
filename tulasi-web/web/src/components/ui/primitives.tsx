// Small server-safe building blocks shared by every page.
import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

/** Wraps content that fades/slides in on scroll (see MotionProvider). Visible by default. */
export function Reveal({ children, delay = 0, variant, as: Tag = "div", className, ...rest }: { children: ReactNode; delay?: number; variant?: "scale" | "left"; as?: "div" | "section" | "li" | "article" | "header"; className?: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <Tag className={clsx("reveal", variant && `reveal-${variant}`, className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties} {...(rest as object)}>
      {children}
    </Tag>
  );
}

type ButtonProps = { href: string; children: ReactNode; variant?: "primary" | "accent" | "ghost" | "light" | "outline-light"; size?: "md" | "lg"; className?: string; external?: boolean } & Omit<ComponentProps<"a">, "href">;

/** Link styled as a button. Min 48px tall (tap target), visible focus ring. */
export function ButtonLink({ href, children, variant = "primary", size = "md", className, external, ...rest }: ButtonProps) {
  const cls = clsx(
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-[var(--ease-calm)] select-none",
    size === "lg" ? "min-h-14 px-7 text-base" : "min-h-12 px-6 text-[0.9375rem]",
    variant === "primary" && "bg-brand-600 text-white shadow-[var(--shadow-soft)] hover:bg-brand-700 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5",
    variant === "accent" && "bg-accent-600 text-white shadow-[0_10px_30px_-10px_rgb(215_20_31/0.6)] hover:bg-accent-700 hover:-translate-y-0.5",
    variant === "ghost" && "text-brand-700 hover:bg-brand-50",
    variant === "light" && "bg-white text-brand-900 hover:bg-brand-50 hover:-translate-y-0.5 shadow-[var(--shadow-soft)]",
    variant === "outline-light" && "border border-white/40 text-white hover:bg-white/10 hover:border-white",
    className
  );
  const isExternal = external ?? /^(https?:|tel:|mailto:)/.test(href);
  return isExternal ? (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} {...(rest as object)}>
      {children}
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, text, align = "left", as: H = "h2", className, dark }: { eyebrow?: string | null; title: string; text?: string | null; align?: "left" | "center"; as?: "h1" | "h2" | "h3"; className?: string; dark?: boolean }) {
  return (
    <Reveal as="header" className={clsx("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={clsx("eyebrow mb-3", dark && "!text-brand-200")}>{eyebrow}</p>}
      <H className={clsx("text-[length:var(--text-h2)] font-bold leading-[1.15]", dark ? "text-white" : "text-ink")}>{title}</H>
      {text && <p className={clsx("mt-4 text-[length:var(--text-lead)] leading-relaxed", dark ? "text-brand-100" : "text-ink-soft")}>{text}</p>}
    </Reveal>
  );
}

/** Structured data, rendered into the server HTML. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumbs({ items, dark }: { items: { name: string; path: string }[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={clsx("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", dark ? "text-brand-100" : "text-ink-soft")}>
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className={clsx("line-clamp-1", dark ? "text-white" : "text-ink")}>{it.name}</span>
            ) : (
              <Link href={it.path} className="link-underline hover:text-current">{it.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Icon({ name, className = "size-5" }: { name: "phone" | "arrow" | "calendar" | "chat" | "mail" | "pin" | "check" | "plus" | "close" | "menu" | "search" | "shield" | "heart" | "spark" | "clock" | "user" | "chevron" | "play" | "download" | "quote"; className?: string }) {
  const p: Record<string, ReactNode> = {
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
    menu: <path d="M4 7h16M4 12h16M4 17h10" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    heart: <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.5 5 5 0 1 1 7.5 6.5z" />,
    spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    play: <path d="M7 4.5v15l13-7.5z" />,
    download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" />,
    quote: <path d="M9 7H5a2 2 0 0 0-2 2v4h6v-6zm0 6c0 3-2 4-4 4M21 7h-4a2 2 0 0 0-2 2v4h6V7zm0 6c0 3-2 4-4 4" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {p[name]}
    </svg>
  );
}
