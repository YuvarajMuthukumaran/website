"use client";
// The animation engine for the always-on pieces (floating buttons, the leaf mascot). They use the
// lightweight `m` components, and the engine itself is fetched after the page has hydrated instead of
// being part of the first load. Pages that use the full `motion` components keep working as before.
import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

const features = () => import("./lazy-features").then((mod) => mod.default);

export function LazyMotionRoot({ children }: { children: ReactNode }) {
  return <LazyMotion features={features}>{children}</LazyMotion>;
}
