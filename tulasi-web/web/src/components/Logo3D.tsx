"use client";
// The Tulasi logo as a small 3D object: a glossy plate with real thickness, the
// logo floating in front of it, a moving sheen. It follows the pointer and, when
// nobody is pointing at it (or on touch screens), sways gently on its own.
// Reduced motion: held still at a slight angle.
import clsx from "clsx";
import { motion, useAnimationFrame, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

const LOGO = "/wp-content/uploads/2023/01/tulasi-logowithout-background.webp";
const LAYERS = 8; // plate thickness, in 3px slices

export function Logo3D({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.2 });
  const hovering = useRef(false);

  // -1..1 targets; springs smooth them into rotation.
  const tx = useMotionValue(reduce ? 0.25 : 0);
  const ty = useMotionValue(reduce ? -0.15 : 0);
  const rx = useSpring(useTransform(ty, [-1, 1], [16, -16]), { stiffness: 110, damping: 16 });
  const ry = useSpring(useTransform(tx, [-1, 1], [-22, 22]), { stiffness: 110, damping: 16 });
  const glareX = useTransform(tx, [-1, 1], [15, 85]);
  const glareY = useTransform(ty, [-1, 1], [15, 70]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.85), transparent 52%)`;

  useAnimationFrame((t) => {
    if (reduce || hovering.current || !inView) return;
    tx.set(Math.sin(t / 2600) * 0.6);
    ty.set(Math.cos(t / 3300) * 0.35);
  });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    hovering.current = true;
    tx.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)));
    ty.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)));
  }

  return (
    <div
      ref={root}
      role="img"
      aria-label="Tulasi Healthcare logo"
      className={clsx("relative mx-auto aspect-square w-full max-w-[340px] select-none", className)}
      style={{ perspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={() => (hovering.current = false)}
    >
      {/* soft shadow on the "ground" */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-[16%] -bottom-2 h-9 rounded-[50%] bg-black/35 blur-xl"
        animate={reduce ? undefined : { scaleX: [1, 0.88, 1], opacity: [0.55, 0.35, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="absolute inset-0" animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative size-full">
          {/* thickness: stacked slices behind the plate, darkening with depth */}
          {Array.from({ length: LAYERS }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute inset-[6%] rounded-[2.1rem] bg-brand-300"
              style={{ transform: `translateZ(${-(i + 1) * 3}px)`, filter: `brightness(${1 - i * 0.045})` }}
            />
          ))}
          {/* the plate */}
          <div
            aria-hidden="true"
            className="absolute inset-[6%] rounded-[2.1rem] bg-gradient-to-br from-white via-white to-brand-100 shadow-[inset_0_1px_0_#fff,inset_0_0_0_1px_rgb(255_255_255/0.7),0_30px_60px_-20px_rgb(3_11_58/0.55)]"
          />
          {/* the logo, lifted off the plate */}
          <div className="absolute inset-[12%]" style={{ transform: "translateZ(46px)" }}>
            <Image src={LOGO} alt="" width={500} height={500} sizes="320px" className="size-full object-contain [filter:drop-shadow(0_14px_12px_rgb(3_11_58/0.3))]" />
          </div>
          {/* sheen that slides across as it turns */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-[6%] rounded-[2.1rem] mix-blend-soft-light" style={{ background: glare, transform: "translateZ(48px)" }} />
        </motion.div>
      </motion.div>
    </div>
  );
}
