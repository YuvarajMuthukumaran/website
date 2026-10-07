"use client";
// A calm bar at the bottom of the phone screen once you have scrolled a little, inviting people who
// do not know where to start to use the specialist finder (the idea comes from Rula's "Personalize
// your search" bar). Phones only. The floating Book / chat buttons move up while it is showing.
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Arrow } from "@/components/ui/primitives";

export function FinderBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => {
      const nearEnd = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 620;
      setShow(window.scrollY > 560 && !nearEnd);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-finder-bar", show);
    return () => document.documentElement.removeAttribute("data-finder-bar");
  }, [show]);

  return (
    <div
      className={clsx(
        "fixed inset-x-0 bottom-0 z-[54] rounded-t-3xl bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-14px_rgb(23_34_44/0.3)] transition-transform duration-500 ease-[var(--ease-calm)] sm:hidden",
        show ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm leading-snug text-ink-soft">
          <span className="block text-base font-semibold text-ink">Not sure where to start?</span>
          We’ll help you find the right specialist.
        </p>
        <Link href="/find-a-specialist/" tabIndex={show ? 0 : -1} className="group/btn inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[0.9375rem] font-semibold text-white hover:bg-brand-700">
          Find care <Arrow className="size-4" />
        </Link>
      </div>
    </div>
  );
}
