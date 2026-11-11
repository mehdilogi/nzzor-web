"use client";

import { useEffect, useRef } from "react";

// =============================================================================
// ArabesqueGlow — the zellige lattice behind the "Why Nzzor" band.
// -----------------------------------------------------------------------------
// Two layers of one pattern:
//   base  cream lines at 15 %, faded out behind the copy so it stays readable
//   glow  the same lines in warm gold, blurred, visible only inside a soft
//         spot that drifts across the band (14 s) and breathes (7 s); it is
//         also kept out of the text area.
// With a mouse inside the section, the spot leaves its loop and follows the
// pointer (eased, one update per frame); it returns to the loop on leave.
// Touch screens and reduced-motion visitors keep the loop only.
// Sits between the background and the copy (z-index 1; the copy is z 2 in
// globals.css). Static for visitors who ask for reduced motion.
// =============================================================================

// Andalusian/Algerian strapwork: 12-point rosettes (star, 12 petals, outer
// ring) on a triangular lattice, a hexagon at the centre of every lattice
// triangle, joined by interlacing bands. One 282.324 x 163.000 repeat.
// Generated geometry, so keep it as one path.
const TILE_W = 282.324;
const TILE_H = 163.000;
const TILE_D = "M285.9 13.5L282.3 20.0 M298.4 59.9L282.3 50.0 M282.3 20.0L278.7 13.5 M278.7 13.5L272.3 17.3 M282.3 20.0L282.3 50.0 M282.3 50.0L266.3 59.9 M266.3 59.9L257.3 43.3 M272.3 17.3L272.4 9.9 M272.4 9.9L265.0 10.0 M272.3 17.3L257.3 43.3 M257.3 43.3L238.5 43.8 M238.5 43.8L239.0 25.0 M265.0 10.0L268.8 3.6 M268.8 3.6L262.3 0.0 M265.0 10.0L239.0 25.0 M239.0 25.0L222.4 16.0 M222.4 16.0L232.3 0.0 M262.3 0.0L268.8 -3.6 M262.3 0.0L232.3 0.0 M232.3 0.0L222.4 -16.0 M20.0 0.0L13.5 3.6 M13.5 3.6L17.3 10.0 M20.0 0.0L50.0 0.0 M50.0 0.0L59.9 16.0 M59.9 16.0L43.3 25.0 M17.3 10.0L9.9 9.9 M9.9 9.9L10.0 17.3 M17.3 10.0L43.3 25.0 M43.3 25.0L43.8 43.8 M43.8 43.8L25.0 43.3 M10.0 17.3L3.6 13.5 M3.6 13.5L0.0 20.0 M10.0 17.3L25.0 43.3 M25.0 43.3L16.0 59.9 M16.0 59.9L0.0 50.0 M0.0 20.0L-3.6 13.5 M0.0 20.0L0.0 50.0 M0.0 50.0L-16.0 59.9 M13.5 -3.6L20.0 0.0 M59.9 -16.0L50.0 0.0 M161.2 81.5L154.7 85.1 M154.7 85.1L158.5 91.5 M161.2 81.5L191.2 81.5 M191.2 81.5L201.0 97.5 M201.0 97.5L184.5 106.5 M158.5 91.5L151.1 91.4 M151.1 91.4L151.2 98.8 M158.5 91.5L184.5 106.5 M184.5 106.5L185.0 125.3 M185.0 125.3L166.2 124.8 M151.2 98.8L144.8 95.0 M144.8 95.0L141.2 101.5 M151.2 98.8L166.2 124.8 M166.2 124.8L157.2 141.4 M157.2 141.4L141.2 131.5 M141.2 101.5L137.5 95.0 M137.5 95.0L131.2 98.8 M141.2 101.5L141.2 131.5 M141.2 131.5L125.1 141.4 M125.1 141.4L116.2 124.8 M131.2 98.8L131.3 91.4 M131.3 91.4L123.8 91.5 M131.2 98.8L116.2 124.8 M116.2 124.8L97.3 125.3 M97.3 125.3L97.9 106.5 M123.8 91.5L127.6 85.1 M127.6 85.1L121.2 81.5 M123.8 91.5L97.9 106.5 M97.9 106.5L81.3 97.5 M81.3 97.5L91.2 81.5 M121.2 81.5L127.6 77.9 M127.6 77.9L123.8 71.5 M121.2 81.5L91.2 81.5 M91.2 81.5L81.3 65.5 M81.3 65.5L97.9 56.5 M123.8 71.5L131.3 71.6 M131.3 71.6L131.2 64.2 M123.8 71.5L97.9 56.5 M97.9 56.5L97.3 37.7 M97.3 37.7L116.2 38.2 M131.2 64.2L137.5 68.0 M137.5 68.0L141.2 61.5 M131.2 64.2L116.2 38.2 M116.2 38.2L125.1 21.6 M125.1 21.6L141.2 31.5 M141.2 61.5L144.8 68.0 M144.8 68.0L151.2 64.2 M141.2 61.5L141.2 31.5 M141.2 31.5L157.2 21.6 M157.2 21.6L166.2 38.2 M151.2 64.2L151.1 71.6 M151.1 71.6L158.5 71.5 M151.2 64.2L166.2 38.2 M166.2 38.2L185.0 37.7 M185.0 37.7L184.5 56.5 M158.5 71.5L154.7 77.9 M154.7 77.9L161.2 81.5 M158.5 71.5L184.5 56.5 M184.5 56.5L201.0 65.5 M201.0 65.5L191.2 81.5 M268.8 166.6L262.3 163.0 M222.4 179.0L232.3 163.0 M262.3 163.0L268.8 159.4 M268.8 159.4L265.0 153.0 M262.3 163.0L232.3 163.0 M232.3 163.0L222.4 147.0 M222.4 147.0L239.0 138.0 M265.0 153.0L272.4 153.1 M272.4 153.1L272.3 145.7 M265.0 153.0L239.0 138.0 M239.0 138.0L238.5 119.2 M238.5 119.2L257.3 119.7 M272.3 145.7L278.7 149.5 M278.7 149.5L282.3 143.0 M272.3 145.7L257.3 119.7 M257.3 119.7L266.3 103.1 M266.3 103.1L282.3 113.0 M282.3 143.0L285.9 149.5 M282.3 143.0L282.3 113.0 M282.3 113.0L298.4 103.1 M20.0 163.0L13.5 166.6 M20.0 163.0L50.0 163.0 M50.0 163.0L59.9 179.0 M-3.6 149.5L-0.0 143.0 M-16.0 103.1L-0.0 113.0 M-0.0 143.0L3.6 149.5 M3.6 149.5L10.0 145.7 M-0.0 143.0L-0.0 113.0 M-0.0 113.0L16.0 103.1 M16.0 103.1L25.0 119.7 M10.0 145.7L9.9 153.1 M9.9 153.1L17.3 153.0 M10.0 145.7L25.0 119.7 M25.0 119.7L43.8 119.2 M43.8 119.2L43.3 138.0 M17.3 153.0L13.5 159.4 M13.5 159.4L20.0 163.0 M17.3 153.0L43.3 138.0 M43.3 138.0L59.9 147.0 M59.9 147.0L50.0 163.0 M162.2 178.0L162.2 148.0 M162.2 148.0L188.2 133.0 M188.2 133.0L214.2 148.0 M214.2 148.0L214.2 178.0 M68.1 178.0L68.1 148.0 M68.1 148.0L94.1 133.0 M94.1 133.0L120.1 148.0 M120.1 148.0L120.1 178.0 M261.3 96.5L235.3 111.5 M235.3 111.5L209.3 96.5 M209.3 96.5L209.3 66.5 M209.3 66.5L235.3 51.5 M235.3 51.5L261.3 66.5 M261.3 66.5L261.3 96.5 M214.2 15.0L188.2 30.0 M188.2 30.0L162.2 15.0 M162.2 15.0L162.2 -15.0 M214.2 -15.0L214.2 15.0 M120.1 15.0L94.1 30.0 M94.1 30.0L68.1 15.0 M68.1 15.0L68.1 -15.0 M120.1 -15.0L120.1 15.0 M73.0 96.5L47.1 111.5 M47.1 111.5L21.1 96.5 M21.1 96.5L21.1 66.5 M21.1 66.5L47.1 51.5 M47.1 51.5L73.0 66.5 M73.0 66.5L73.0 96.5 M166.2 -38.2L145.5 0.0 M116.2 -38.2L136.8 0.0 M282.3 50.0L306.3 64.8 M282.3 50.0L258.3 64.8 M257.3 43.3L277.9 81.5 M257.3 43.3L213.9 44.5 M239.0 25.0L238.2 53.2 M239.0 25.0L214.2 11.6 M232.3 0.0L209.6 37.0 M232.3 0.0L209.6 -37.0 M50.0 0.0L72.8 37.0 M43.3 25.0L68.1 11.6 M43.3 25.0L44.1 53.2 M25.0 43.3L68.4 44.5 M25.0 43.3L4.4 81.5 M0.0 50.0L24.0 64.8 M0.0 50.0L-24.0 64.8 M50.0 0.0L72.8 -37.0 M191.2 81.5L213.9 118.5 M184.5 106.5L209.3 93.1 M184.5 106.5L185.3 134.7 M166.2 124.8L209.6 126.0 M166.2 124.8L145.5 163.0 M141.2 131.5L165.2 146.3 M141.2 131.5L117.1 146.3 M116.2 124.8L136.8 163.0 M116.2 124.8L72.8 126.0 M97.9 106.5L97.1 134.7 M97.9 106.5L73.0 93.1 M91.2 81.5L68.4 118.5 M91.2 81.5L68.4 44.5 M97.9 56.5L73.0 69.9 M97.9 56.5L97.1 28.3 M116.2 38.2L72.8 37.0 M116.2 38.2L136.8 0.0 M141.2 31.5L117.1 16.7 M141.2 31.5L165.2 16.7 M166.2 38.2L145.5 0.0 M166.2 38.2L209.6 37.0 M184.5 56.5L185.3 28.3 M184.5 56.5L209.3 69.9 M191.2 81.5L213.9 44.5 M232.3 163.0L209.6 200.0 M232.3 163.0L209.6 126.0 M239.0 138.0L214.2 151.4 M239.0 138.0L238.2 109.8 M257.3 119.7L213.9 118.5 M257.3 119.7L277.9 81.5 M282.3 113.0L258.3 98.2 M282.3 113.0L306.3 98.2 M50.0 163.0L72.8 200.0 M-0.0 113.0L-24.0 98.2 M-0.0 113.0L24.0 98.2 M25.0 119.7L4.4 81.5 M25.0 119.7L68.4 118.5 M43.3 138.0L44.1 109.8 M43.3 138.0L68.1 151.4 M50.0 163.0L72.8 126.0 M116.2 201.2L136.8 163.0 M166.2 201.2L145.5 163.0";
const TILE = <path d={TILE_D} />;

// Two tones:
//   dark  (default) cream lines + gold glow, for dark bands ("Why Nzzor")
//   light warm brown lines + red glow, for cream pages (contact)
// `clearAt` is where the copy sits: the pattern fades out around that point.
const TONES = {
  dark: { line: "#F3E3CF", glow: "#F6C98F", base: 0.15, shadow: "drop-shadow(0 0 3px rgba(240,190,130,.9)) drop-shadow(0 0 10px rgba(230,57,70,.6))" },
  light: { line: "#7A4A2A", glow: "#E63946", base: 0.10, shadow: "drop-shadow(0 0 2px rgba(230,57,70,.55)) drop-shadow(0 0 8px rgba(230,57,70,.35))" },
};

export default function ArabesqueGlow({ tone = "dark", clearAt = "40% 52%" }) {
  const tn = TONES[tone] || TONES.dark;
  const idBase = "nzArabBase-" + tone;
  const idGlow = "nzArabGlow-" + tone;
  const rootRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const glow = glowRef.current;
    const section = root && root.parentElement;
    if (!section || !glow) return undefined;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return undefined;

    let frame = 0;
    let target = null;
    let pos = null;

    const tick = () => {
      frame = 0;
      if (!target) return;
      // ease toward the pointer so the light trails it instead of snapping
      pos = pos ? { x: pos.x + (target.x - pos.x) * 0.18, y: pos.y + (target.y - pos.y) * 0.18 } : { ...target };
      const r = section.getBoundingClientRect();
      const w = r.width * 0.34;   // spot size while following (smaller than the loop's)
      const h = r.height * 0.8;
      glow.style.setProperty("--nz-mpos", `${pos.x - w / 2}px ${pos.y - h / 2}px`);
      glow.style.setProperty("--nz-msize", `${w}px ${h}px`);
      if (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5) frame = requestAnimationFrame(tick);
    };
    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      glow.classList.add("is-follow");
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      target = null; pos = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      glow.classList.remove("is-follow");
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="nz-arab"
      aria-hidden="true"
      ref={rootRef}
      style={{
        "--nz-arab-op": tn.base,
        "--nz-arab-shadow": tn.shadow,
        "--nz-arab-clear": `radial-gradient(42% 62% at ${clearAt}, transparent 0%, rgba(0,0,0,.25) 50%, #000 85%)`,
        "--nz-arab-clear-soft": `radial-gradient(34% 50% at ${clearAt}, rgba(0,0,0,.18) 0%, #000 100%)`,
      }}
    >
      <svg className="nz-arab-defs" width="0" height="0" focusable="false">
        <defs>
          <pattern id={idBase} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <g fill="none" stroke={tn.line} strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">{TILE}</g>
          </pattern>
          <pattern id={idGlow} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <g fill="none" stroke={tn.glow} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{TILE}</g>
          </pattern>
        </defs>
      </svg>
      <div className="nz-arab-layer nz-arab-base">
        <svg width="100%" height="100%"><rect width="100%" height="100%" fill={`url(#${idBase})`} /></svg>
      </div>
      <div className="nz-arab-layer nz-arab-glow" ref={glowRef}>
        <svg width="100%" height="100%"><rect width="100%" height="100%" fill={`url(#${idGlow})`} /></svg>
      </div>

      <style jsx>{`
        .nz-arab { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .nz-arab-defs { position: absolute; }
        .nz-arab-layer { position: absolute; inset: 0; }
        .nz-arab-layer svg { display: block; }
        .nz-arab-base {
          opacity: var(--nz-arab-op, 0.15);
          -webkit-mask-image: var(--nz-arab-clear);
                  mask-image: var(--nz-arab-clear);
        }
        /* The drifting spot is the first mask layer, moved with mask-position
           (no @property needed); the second layer keeps it out of the copy. */
        .nz-arab-glow {
          opacity: 0;
          filter: var(--nz-arab-shadow);
          -webkit-mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            var(--nz-arab-clear);
          -webkit-mask-size: 44% 90%, 100% 100%;
          -webkit-mask-repeat: no-repeat, no-repeat;
          -webkit-mask-position: 0% 20%, 0 0;
          -webkit-mask-composite: source-in;
                  mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            var(--nz-arab-clear);
                  mask-size: 44% 90%, 100% 100%;
                  mask-repeat: no-repeat, no-repeat;
                  mask-position: 0% 20%, 0 0;
                  mask-composite: intersect;
          animation: nzArabDrift 14s ease-in-out infinite, nzArabBreathe 7s ease-in-out infinite;
        }
        /* Following the pointer: the drift stops, the breathing goes on, the
           spot sits where the mouse is (positions set from JS, in px). */
        .nz-arab-glow.is-follow {
          animation: nzArabBreatheHi 7s ease-in-out infinite;
          /* softer text guard than the loop's, so the light still answers
             the mouse near the copy, only dimmed right under the words */
          -webkit-mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            var(--nz-arab-clear-soft);
                  mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            var(--nz-arab-clear-soft);
          -webkit-mask-size: var(--nz-msize, 34% 80%), 100% 100%;
                  mask-size: var(--nz-msize, 34% 80%), 100% 100%;
          -webkit-mask-position: var(--nz-mpos, 50% 50%), 0 0;
                  mask-position: var(--nz-mpos, 50% 50%), 0 0;
        }
        @keyframes nzArabBreatheHi {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.75; }
        }
        @keyframes nzArabDrift {
          0%   { -webkit-mask-position: 0% 10%, 0 0;   mask-position: 0% 10%, 0 0; }
          25%  { -webkit-mask-position: 25% 90%, 0 0;  mask-position: 25% 90%, 0 0; }
          50%  { -webkit-mask-position: 100% 70%, 0 0; mask-position: 100% 70%, 0 0; }
          75%  { -webkit-mask-position: 75% 0%, 0 0;   mask-position: 75% 0%, 0 0; }
          100% { -webkit-mask-position: 0% 10%, 0 0;   mask-position: 0% 10%, 0 0; }
        }
        @keyframes nzArabBreathe {
          0%, 100% { opacity: 0.18; }
          50%      { opacity: 0.55; }
        }
        /* Phones and touch screens. The copy covers the whole width there, so
           a drifting spot only ever showed as clipped blobs between text and
           cards. Instead: the lattice sits in the lower part of the section
           (under the copy, not behind it), and a slow diagonal band of light
           sweeps across it on a loop, like light passing over tiles. No blur
           filter, which is costly on a phone. */
        @media (max-width: 720px), (hover: none) {
          .nz-arab-base {
            opacity: calc(var(--nz-arab-op, 0.15) * 0.75);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, transparent 38%, #000 100%);
                    mask-image: linear-gradient(to bottom, transparent 0%, transparent 38%, #000 100%);
          }
          .nz-arab-glow,
          .nz-arab-glow.is-follow {
            filter: none;
            opacity: 0.55;
            -webkit-mask-image:
              linear-gradient(115deg, transparent 0%, transparent 42%, #000 50%, transparent 58%, transparent 100%),
              linear-gradient(to bottom, transparent 0%, transparent 38%, #000 100%);
            -webkit-mask-size: 300% 100%, 100% 100%;
            -webkit-mask-repeat: no-repeat, no-repeat;
            -webkit-mask-position: 100% 0, 0 0;
            -webkit-mask-composite: source-in;
                    mask-image:
              linear-gradient(115deg, transparent 0%, transparent 42%, #000 50%, transparent 58%, transparent 100%),
              linear-gradient(to bottom, transparent 0%, transparent 38%, #000 100%);
                    mask-size: 300% 100%, 100% 100%;
                    mask-repeat: no-repeat, no-repeat;
                    mask-position: 100% 0, 0 0;
                    mask-composite: intersect;
            animation: nzArabSweep 7s ease-in-out infinite;
          }
        }
        @keyframes nzArabSweep {
          0%   { -webkit-mask-position: 100% 0, 0 0; mask-position: 100% 0, 0 0; }
          70%  { -webkit-mask-position: 0% 0, 0 0;   mask-position: 0% 0, 0 0; }
          100% { -webkit-mask-position: 0% 0, 0 0;   mask-position: 0% 0, 0 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nz-arab-glow { animation: none; opacity: 0.14; }
        }
      `}</style>
    </div>
  );
}
