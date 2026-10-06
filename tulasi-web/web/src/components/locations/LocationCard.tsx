"use client";
// LocationCard – true CSS 3D flip card.
// Desktop: flips on hover. Touch: flips on tap. Keyboard: Enter/Space.
// prefers-reduced-motion: simple fade instead of flip.

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Location } from "@/lib/locations";

function HospitalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <rect x="2" y="5" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 18V13h6v5M10 8v4M8 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 5V3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5V5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function ClinicIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 1 1 9.9 9.9L10 18.9l-4.95-4.95a7 7 0 0 1 0-9.9ZM10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-8.284 0-15-6.716-15-15V3.5Z" clipRule="evenodd"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd"/>
    </svg>
  );
}

export function LocationCard({ loc, index }: { loc: Location; index: number }) {
  const [flipped, setFlipped] = useState(false);

  const toggle = () => setFlipped((f) => !f);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    if (e.key === "Escape") setFlipped(false);
  };

  const isHospital = loc.type === "hospital";
  const badgeBg    = isHospital ? "loc-badge-hospital" : "loc-badge-clinic";

  return (
    <div
      id={loc.id}
      className="loc-card-wrap"
      style={{ "--loc-delay": `${index * 80}ms` } as React.CSSProperties}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${loc.name} — ${flipped ? "showing details, press Enter to flip back" : "press Enter to see details"}`}
        className={`loc-card${flipped ? " loc-flipped" : ""}`}
        onClick={toggle}
        onKeyDown={onKey}
      >
        {/* ── FRONT ── */}
        <div className="loc-face loc-front" aria-hidden={flipped}>
          {/* Photo */}
          <Image
            src={loc.photo}
            alt={loc.name}
            fill
            sizes="(max-width:639px) 100vw, (max-width:1023px) 50vw, 33vw"
            className="loc-photo"
          />
          {/* Gradient overlay */}
          <span className="loc-gradient" aria-hidden="true" />

          {/* Emergency ribbon */}
          {loc.emergency && (
            <span className="loc-ribbon" aria-label="24×7 Emergency">24×7 Emergency</span>
          )}

          {/* Type badge */}
          <span className={`loc-badge ${badgeBg}`}>
            {isHospital ? <HospitalIcon /> : <ClinicIcon />}
            {isHospital ? "HOSPITAL" : "CLINIC"}
            {loc.beds && <span className="loc-badge-beds">· {loc.beds} beds</span>}
          </span>

          {/* Name + area */}
          <div className="loc-front-info">
            <p className="loc-area">{loc.area}</p>
            <h3 className="loc-name">{loc.name}</h3>
            <span className="loc-flip-hint" aria-hidden="true">
              Hover for details ›
            </span>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="loc-face loc-back" aria-hidden={!flipped}>
          <div className="loc-back-inner">
            {/* Header */}
            <div className="loc-back-header">
              <span className={`loc-badge ${badgeBg} loc-badge-sm`}>
                {isHospital ? <HospitalIcon /> : <ClinicIcon />}
                {isHospital ? "Hospital" : "Clinic"}
              </span>
              <h3 className="loc-back-name">{loc.name}</h3>
              <p className="loc-back-tagline">{loc.tagline}</p>
            </div>

            {/* Details */}
            <ul className="loc-details">
              <li className="loc-detail-row">
                <MapPinIcon />
                <address className="not-italic">{loc.address}</address>
              </li>
              <li className="loc-detail-row">
                <PhoneIcon />
                <a href={loc.phoneHref} className="loc-detail-link">{loc.phone}</a>
              </li>
              <li className="loc-detail-row">
                <ClockIcon />
                <span>
                  {loc.hours}
                  {loc.openNow
                    ? <span className="loc-open-pill">Open now</span>
                    : <span className="loc-closed-pill">Closed</span>}
                </span>
              </li>
            </ul>

            {/* Service chips */}
            <div className="loc-chips">
              {loc.services.map((s) => (
                <span key={s} className="loc-chip">{s}</span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="loc-ctas">
              <a
                href={loc.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="loc-btn loc-btn-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPinIcon /> Directions
              </a>
              <a
                href={loc.phoneHref}
                className="loc-btn loc-btn-secondary"
                onClick={(e) => e.stopPropagation()}
              >
                <PhoneIcon /> Call now
              </a>
              <Link
                href="/book-appointment/"
                className="loc-btn loc-btn-secondary"
                onClick={(e) => e.stopPropagation()}
              >
                Book
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tap hint (shown only on touch devices) */}
      <p className="loc-tap-hint" aria-hidden="true">Tap to see details</p>
    </div>
  );
}
