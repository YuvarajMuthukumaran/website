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
    src: "/hero/gurugram.webp",
    alt: "Tulasi Healthcare hospital building, Gurugram",
    position: "50% 50%",
  },
  {
    src: "/hero/mehrauli.webp",
    alt: "Tulasi Healthcare centre and garden, Mehrauli, Delhi",
    position: "50% 50%",
  },
  {
    src: "/wp-content/uploads/2022/12/47-1024x768-1.webp",
    alt: "Tulasi Healthcare hospital courtyard",
    position: "50% 50%",
  },
];

const SLIDE_MS = 3200;

export function HomeHeroSlideshow() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const go = (next: number) => {
    setPrev(active);
    setActive(next);
  };

  useEffect(() => {
    if (reducedMotion || HERO_SLIDES.length < 2) return;
    const id = window.setTimeout(() => {
      setPrev(active);
      setActive((active + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [active, reducedMotion]);

  return (
    <div className="home-hero-slideshow">
      {HERO_SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          fill
          priority={index === 0}
          loading={index === 0 ? undefined : "eager"}
          sizes="(min-width:1024px) 540px, 100vw"
          className={`home-hero-slide${index === active ? (prev === null ? " is-active" : " is-active is-anim") : ""}${index === prev && index !== active ? " is-prev" : ""}`}
          style={{ objectPosition: slide.position }}
          aria-hidden={index === active ? undefined : true}
        />
      ))}
      <div className="home-hero-dots" role="group" aria-label="Choose a photo">
        {HERO_SLIDES.map((slide, index) => (
          <button key={slide.src} type="button" aria-label={`Photo ${index + 1} of ${HERO_SLIDES.length}`} aria-current={index === active} className={index === active ? "is-on" : ""} onClick={() => go(index)} />
        ))}
      </div>
    </div>
  );
}
