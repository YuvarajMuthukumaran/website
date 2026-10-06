"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroSlide = {
  src: string;
  alt: string;
  position?: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
    alt: "Tulasi Healthcare psychiatric hospital and rehabilitation centre, Gurugram",
    position: "50% 50%",
  },
  {
    src: "/wp-content/uploads/2022/12/47-1024x768-1.webp",
    alt: "Tulasi Healthcare hospital courtyard in Delhi-NCR",
    position: "50% 50%",
  },
  {
    src: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
    alt: "Tulasi Healthcare hospital building and campus",
    position: "52% 50%",
  },
];

const SLIDE_MS = 4600;

export function HomeHeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    HERO_SLIDES.slice(1).forEach((slide) => {
      const img = new window.Image();
      img.src = slide.src;
    });
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || HERO_SLIDES.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  return (
    <div
      className={`home-hero-slideshow${paused ? " is-paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          fill
          priority={index === 0}
          sizes="(min-width:1024px) 540px, 100vw"
          className={`home-hero-slide${index === active ? " is-active" : ""}`}
          style={{ objectPosition: slide.position }}
          aria-hidden={index === active ? undefined : true}
        />
      ))}
    </div>
  );
}
