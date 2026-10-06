"use client";
// Tiny client wrapper: pauses the CSS marquee animation on hover and touch.
// The server renders all cards; this just toggles a data-attribute.
import { useRef } from "react";

export function MarqueePause({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const pause  = () => ref.current?.setAttribute("data-paused", "");
  const resume = () => ref.current?.removeAttribute("data-paused");

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      {children}
    </div>
  );
}
