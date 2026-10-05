"use client";
// Site-wide motion. Native scrolling only (no scroll-jacking): it is the
// fastest, most accessible option and never leaves the screen blank.
// Everything here is enhancement: with JS off or prefers-reduced-motion on,
// the page is complete and static.
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MotionProvider() {
  const pathname = usePathname();

  // Enable route transitions after the first page: that page is marked
  // static so it never re-animates (see app/template.tsx).
  useEffect(() => {
    document.querySelectorAll(".page-enter").forEach((el) => el.classList.add("page-static"));
    document.documentElement.classList.add("nav-ready");
  }, []);

  // Scroll reveals. Elements are revealed while still ~25% of a screen BELOW
  // the viewport, so by the time they scroll into view they are already
  // (nearly) visible, even when scrolling fast. Nothing above the fold is hidden.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    const vh = window.innerHeight;
    const show = (el: Element) => {
      el.classList.remove("reveal-wait");
      el.classList.add("is-in");
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          show(e.target);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px 25% 0px", threshold: 0 }
    );
    for (const el of els) {
      const top = el.getBoundingClientRect().top;
      if (top > vh * 1.1) {
        el.classList.add("reveal-wait");
        io.observe(el);
      } else show(el);
    }
    // Safety net: anything that is on screen after a jump (anchor link, Home key) is shown at once.
    const onScroll = () => {
      for (const el of document.querySelectorAll<HTMLElement>(".reveal-wait")) {
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
