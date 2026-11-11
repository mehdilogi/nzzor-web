"use client";

// =============================================================================
// ArabesqueGlow — the 8-point star lattice behind the "Why Nzzor" band.
// -----------------------------------------------------------------------------
// Two layers of one pattern:
//   base  cream lines at 15 %, faded out behind the copy so it stays readable
//   glow  the same lines in warm gold, blurred, visible only inside a soft
//         spot that drifts across the band (14 s) and breathes (7 s); it is
//         also kept out of the text area.
// Sits between the background and the copy (z-index 1; the copy is z 2 in
// globals.css). Static for visitors who ask for reduced motion.
// =============================================================================

const TILE = (
  <>
    <polygon points="60.0,20.0 66.7,43.8 88.3,31.7 76.2,53.3 100.0,60.0 76.2,66.7 88.3,88.3 66.7,76.2 60.0,100.0 53.3,76.2 31.7,88.3 43.8,66.7 20.0,60.0 43.8,53.3 31.7,31.7 53.3,43.8" />
          <polygon points="66.7,43.8 72.4,47.6 76.2,53.3 77.5,60.0 76.2,66.7 72.4,72.4 66.7,76.2 60.0,77.5 53.3,76.2 47.6,72.4 43.8,66.7 42.5,60.0 43.8,53.3 47.6,47.6 53.3,43.8 60.0,42.5" />
          <circle cx="60" cy="60" r="6" />
          <path d="M60.0 20.0 L60.0 0.0 M88.3 31.7 L109.4 10.6 M100.0 60.0 L120.0 60.0 M88.3 88.3 L109.4 109.4 M60.0 100.0 L60.0 120.0 M31.7 88.3 L10.6 109.4 M20.0 60.0 L0.0 60.0 M31.7 31.7 L10.6 10.6" />
          <polygon points="10.6,-10.6 6.0,0.0 10.6,10.6 0.0,6.0 -10.6,10.6 -6.0,0.0 -10.6,-10.6 -0.0,-6.0" /><polygon points="130.6,-10.6 126.0,0.0 130.6,10.6 120.0,6.0 109.4,10.6 114.0,0.0 109.4,-10.6 120.0,-6.0" /><polygon points="10.6,109.4 6.0,120.0 10.6,130.6 0.0,126.0 -10.6,130.6 -6.0,120.0 -10.6,109.4 -0.0,114.0" /><polygon points="130.6,109.4 126.0,120.0 130.6,130.6 120.0,126.0 109.4,130.6 114.0,120.0 109.4,109.4 120.0,114.0" />
          <circle cx="0" cy="0" r="22" /><circle cx="120" cy="0" r="22" /><circle cx="0" cy="120" r="22" /><circle cx="120" cy="120" r="22" />
  </>
);

export default function ArabesqueGlow() {
  return (
    <div className="nz-arab" aria-hidden="true">
      <svg className="nz-arab-defs" width="0" height="0" focusable="false">
        <defs>
          <pattern id="nzArabBase" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#F3E3CF" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">{TILE}</g>
          </pattern>
          <pattern id="nzArabGlow" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#F6C98F" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{TILE}</g>
          </pattern>
        </defs>
      </svg>
      <div className="nz-arab-layer nz-arab-base">
        <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#nzArabBase)" /></svg>
      </div>
      <div className="nz-arab-layer nz-arab-glow">
        <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#nzArabGlow)" /></svg>
      </div>

      <style jsx>{`
        .nz-arab { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .nz-arab-defs { position: absolute; }
        .nz-arab-layer { position: absolute; inset: 0; }
        .nz-arab-layer svg { display: block; }
        .nz-arab-base {
          opacity: 0.15;
          -webkit-mask-image: radial-gradient(42% 62% at 40% 52%, transparent 0%, rgba(0,0,0,.25) 50%, #000 85%);
                  mask-image: radial-gradient(42% 62% at 40% 52%, transparent 0%, rgba(0,0,0,.25) 50%, #000 85%);
        }
        /* The drifting spot is the first mask layer, moved with mask-position
           (no @property needed); the second layer keeps it out of the copy. */
        .nz-arab-glow {
          opacity: 0;
          filter: drop-shadow(0 0 3px rgba(240,190,130,.9)) drop-shadow(0 0 10px rgba(230,57,70,.6));
          -webkit-mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            radial-gradient(42% 62% at 40% 52%, transparent 0%, rgba(0,0,0,.25) 50%, #000 85%);
          -webkit-mask-size: 44% 90%, 100% 100%;
          -webkit-mask-repeat: no-repeat, no-repeat;
          -webkit-mask-position: 0% 20%, 0 0;
          -webkit-mask-composite: source-in;
                  mask-image:
            radial-gradient(closest-side, #000 0%, rgba(0,0,0,.45) 50%, transparent 100%),
            radial-gradient(42% 62% at 40% 52%, transparent 0%, rgba(0,0,0,.25) 50%, #000 85%);
                  mask-size: 44% 90%, 100% 100%;
                  mask-repeat: no-repeat, no-repeat;
                  mask-position: 0% 20%, 0 0;
                  mask-composite: intersect;
          animation: nzArabDrift 14s ease-in-out infinite, nzArabBreathe 7s ease-in-out infinite;
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
        @media (max-width: 720px) {
          /* on phones the copy spans the width: keep the lattice to the edges */
          .nz-arab-base, .nz-arab-glow { opacity: 0.12; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nz-arab-glow { animation: none; opacity: 0.14; }
        }
      `}</style>
    </div>
  );
}
