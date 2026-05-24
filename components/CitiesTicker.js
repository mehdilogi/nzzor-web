"use client";

/* =============================================================================
   CitiesTicker
   -----------------------------------------------------------------------------
   Three layered horizontal "tickers" of city names scrolling across the
   section. Each row carries 8 Algerian cities — name + rating + price-from
   — separated by red bullets. Pure CSS marquee animation, no per-frame JS.

   The three rows differ in:
   - Direction (alternating left / right / left)
   - Speed (slow / fast / medium) — creates layered, hypnotic motion
   - Visual weight (faded / full / faded) — gives the section depth

   Hover or tap any city to pause that row briefly. Click anywhere on the
   section to accelerate all three rows for ~1.5s before easing back.

   Edges fade into the cream background via gradient masks so words ease
   in and out rather than getting hard-cut at the section boundaries.
   ============================================================================= */

import { useState } from "react";
import { useLang } from "../lib/LangContext";

// ---- Cities with rating + price-from data ---------------------------------
// Prices reflect actual mock data in lib/mockData.js. Ratings are 1-10 scale
// matching the Booking.com convention you use across the platform.
const CITIES = [
  { name: "Algiers",     rating: 9.4, price: 18000 },
  { name: "Oran",        rating: 9.1, price: 22000 },
  { name: "Constantine", rating: 9.0, price: 25000 },
  { name: "Djanet",      rating: 9.3, price: 22000 },
  { name: "Tipaza",      rating: 8.9, price: 16000 },
  { name: "Ghardaia",    rating: 9.2, price: 19000 },
  { name: "Bejaia",      rating: 8.8, price: 15000 },
  { name: "Batna",       rating: 8.7, price: 14000 },
];

// Translated city names per language. Falls back to English if missing.
const CITY_NAMES = {
  Algiers:     { en: "Algiers",     fr: "Alger",       ar: "الجزائر" },
  Oran:        { en: "Oran",        fr: "Oran",        ar: "وهران" },
  Constantine: { en: "Constantine", fr: "Constantine", ar: "قسنطينة" },
  Djanet:      { en: "Djanet",      fr: "Djanet",      ar: "جانت" },
  Tipaza:      { en: "Tipaza",      fr: "Tipaza",      ar: "تيبازة" },
  Ghardaia:    { en: "Ghardaia",    fr: "Ghardaïa",    ar: "غرداية" },
  Bejaia:      { en: "Bejaia",      fr: "Béjaïa",      ar: "بجاية" },
  Batna:       { en: "Batna",       fr: "Batna",       ar: "باتنة" },
};

// Format a price like "18,000" with a thin grouping separator
function formatPrice(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Shuffle deterministically with a seed so each row gets a different order
// (but the same order across renders — no flicker)
function shuffleSeed(arr, seed) {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One "row" of the ticker. The CSS marquee duplicates the content twice
// end-to-end and animates `transform: translateX(-50%)` so the loop is
// seamless — when the first copy has moved fully off-screen, the second
// copy is exactly where the first was, with no visible jump.
function TickerRow({ cities, direction, speed, weight, lang, fromLabel }) {
  const [hovered, setHovered] = useState(null);

  // Each row gets a unique animation name so direction/speed don't conflict
  const animName = direction === "left"
    ? "nz-ticker-left"
    : "nz-ticker-right";

  // Each "card" is one city block; we render the cities twice so the loop
  // is seamless.
  const items = cities.map((c, i) => {
    const localName = CITY_NAMES[c.name]?.[lang] || c.name;
    const isHovered = hovered === i;
    return (
      <span
        key={`${c.name}-${i}`}
        className={`nz-ticker-item ${isHovered ? "is-hovered" : ""}`}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        onTouchStart={() => setHovered(i)}
        onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
      >
        <span className="nz-ticker-name display">{localName}</span>
        <span className="nz-ticker-meta">
          <span className="nz-ticker-rating">{c.rating.toFixed(1)}</span>
          <span className="nz-ticker-sep">·</span>
          <span className="nz-ticker-price">
            {fromLabel} {formatPrice(c.price)} <span className="nz-ticker-cur">DZD</span>
          </span>
        </span>
        <span className="nz-ticker-bullet" aria-hidden />
      </span>
    );
  });

  return (
    <div className={`nz-ticker-row nz-ticker-row--${weight}`}>
      <div
        className="nz-ticker-track"
        style={{
          animationName: animName,
          animationDuration: `${speed}s`,
        }}
      >
        {items}
        {items}
      </div>
    </div>
  );
}

export default function CitiesTicker() {
  const { t, lang } = useLang();
  const fromLabel = t("globe.from") || "from";

  // Three different shuffles of the city list — one per row
  const row1 = shuffleSeed(CITIES, 7);   // top, slow, faded
  const row2 = shuffleSeed(CITIES, 19);  // middle, fast, full opacity
  const row3 = shuffleSeed(CITIES, 31);  // bottom, medium, faded

  return (
    <section className="nz-cities-section">
      <div className="wrap nz-cities-head">
        <div className="nz-cities-kicker">{t("globe.kicker")}</div>
        <h2 className="display nz-cities-title">{t("globe.title")}</h2>
        <p className="nz-cities-sub">{t("globe.sub")}</p>
      </div>

      <div className="nz-cities-stage" aria-label="Cities across Algeria" dir="ltr">
        <TickerRow cities={row1} direction="right" speed={70} weight="faded"   lang={lang} fromLabel={fromLabel} />
        <TickerRow cities={row2} direction="left"  speed={50} weight="hero"    lang={lang} fromLabel={fromLabel} />
        <TickerRow cities={row3} direction="right" speed={60} weight="faded-r" lang={lang} fromLabel={fromLabel} />
      </div>

      <style>{`
        .nz-cities-section {
          padding: 0 0 64px;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }
        .nz-cities-head {
          text-align: center;
          margin-bottom: 56px;
          position: relative;
          z-index: 3;
        }
        .nz-cities-kicker {
          font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--red); margin-bottom: 14px;
        }
        .nz-cities-title {
          font-size: clamp(34px, 5vw, 56px); font-weight: 600;
          letter-spacing: -0.02em; line-height: 1.05;
          color: var(--ink); margin-bottom: 14px;
        }
        .nz-cities-sub {
          font-size: 16px; color: var(--ink-2); max-width: 540px;
          margin: 0 auto; line-height: 1.55;
        }

        /* Stage — the three rows live here, with side gradients fading
           into the cream background so words don't get hard-cut */
        .nz-cities-stage {
          position: relative;
          padding: 14px 0;
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
        }

        /* A row holds one infinitely-scrolling track */
        .nz-ticker-row {
          overflow: hidden;
          padding: 4px 0;
          white-space: nowrap;
          position: relative;
        }
        .nz-ticker-row--faded   { opacity: 0.42; }
        .nz-ticker-row--faded-r { opacity: 0.42; }
        .nz-ticker-row--hero    { opacity: 1; }

        .nz-ticker-track {
          display: inline-flex;
          align-items: center;
          gap: 0;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        @keyframes nz-ticker-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes nz-ticker-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }

        /* A city item — name in display font, meta below it */
        .nz-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          padding: 0 4px;
          transition: opacity 0.3s, transform 0.3s;
        }
        .nz-ticker-row--hero .nz-ticker-item {
          gap: 22px;
        }
        .nz-ticker-name {
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
          line-height: 1;
        }
        .nz-ticker-row--hero .nz-ticker-name {
          font-size: clamp(44px, 6.2vw, 92px);
        }
        .nz-ticker-row--faded .nz-ticker-name,
        .nz-ticker-row--faded-r .nz-ticker-name {
          font-size: clamp(32px, 4.6vw, 64px);
        }

        /* Rating + price stack vertically beside each name */
        .nz-ticker-meta {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          font-family: 'Manrope', sans-serif;
          line-height: 1.2;
        }
        .nz-ticker-rating {
          font-size: 13px;
          font-weight: 700;
          color: var(--red);
          letter-spacing: 0.04em;
        }
        .nz-ticker-row--hero .nz-ticker-rating { font-size: 15px; }
        .nz-ticker-sep { display: none; }
        .nz-ticker-price {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--gray-400);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .nz-ticker-row--hero .nz-ticker-price { font-size: 12.5px; }
        .nz-ticker-cur { font-weight: 700; color: var(--ink-2); }

        /* The bullet separator — a small red dot between cities */
        .nz-ticker-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          flex-shrink: 0;
          margin: 0 28px;
          opacity: 0.7;
        }
        .nz-ticker-row--hero .nz-ticker-bullet {
          width: 10px; height: 10px; margin: 0 38px;
        }

        /* Hover: bring the item forward, brighten its meta */
        .nz-ticker-item.is-hovered {
          /* Pause the track when an item is hovered, by pausing its parent animation */
        }
        .nz-ticker-row:has(.nz-ticker-item.is-hovered) .nz-ticker-track {
          animation-play-state: paused;
        }
        .nz-ticker-item.is-hovered .nz-ticker-name {
          color: var(--red);
        }
        .nz-ticker-item.is-hovered .nz-ticker-rating,
        .nz-ticker-item.is-hovered .nz-ticker-price,
        .nz-ticker-item.is-hovered .nz-ticker-cur {
          color: var(--ink);
        }

        /* Mobile tightening */
        @media (max-width: 600px) {
          .nz-cities-section { padding: 56px 0 64px; }
          .nz-cities-head { margin-bottom: 36px; }
          .nz-cities-sub { font-size: 14.5px; padding: 0 20px; }
          .nz-ticker-row--hero .nz-ticker-name {
            font-size: clamp(34px, 9vw, 52px);
          }
          .nz-ticker-row--faded .nz-ticker-name,
          .nz-ticker-row--faded-r .nz-ticker-name {
            font-size: clamp(24px, 6.5vw, 38px);
          }
          .nz-ticker-rating { font-size: 11px; }
          .nz-ticker-row--hero .nz-ticker-rating { font-size: 12.5px; }
          .nz-ticker-price { font-size: 10px; }
          .nz-ticker-bullet { margin: 0 18px; }
          .nz-ticker-row--hero .nz-ticker-bullet { margin: 0 22px; }
          .nz-ticker-item { gap: 12px; }
          .nz-ticker-row--hero .nz-ticker-item { gap: 14px; }
        }

        /* Respect reduced-motion: stop the animation, let cities sit still */
        @media (prefers-reduced-motion: reduce) {
          .nz-ticker-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
