"use client";

/* =============================================================================
   AlgeriaGlobe
   -----------------------------------------------------------------------------
   A Cloudflare "Region: Earth"–style animated globe, themed for Nzzor:
   - Wireframe of soft cream/ink dots forming a sphere
   - Algeria highlighted in the brand red, with pins on each of our cities
   - Two anchored callouts telling the trust story
   - Continuous gentle rotation (60s loop) — never aggressive
   - Click anywhere on the globe to spin it faster for a beat, then settle
   - Pure SVG, no Three.js, no external libraries. Renders fine on mobile.
   ============================================================================= */

import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/LangContext";

// ---- 10 launch hotels' cities, mapped to lat/lng on a unit sphere ----------
// Coordinates are real geographic lat/lng for each city.
const CITIES = [
  { name: "Algiers",      lat: 36.7538, lng: 3.0588,  primary: true  },
  { name: "Oran",         lat: 35.6976, lng: -0.6337                 },
  { name: "Constantine",  lat: 36.3650, lng: 6.6147                  },
  { name: "Bejaia",       lat: 36.7525, lng: 5.0840                  },
  { name: "Tipaza",       lat: 36.5894, lng: 2.4439                  },
  { name: "Batna",        lat: 35.5500, lng: 6.1739                  },
  { name: "Ghardaia",     lat: 32.4900, lng: 3.6700                  },
  { name: "Djanet",       lat: 24.5544, lng: 9.4843                  },
];

// Project a (lat, lng, rotation-yaw) point to 2D coordinates on a circle.
// Standard orthographic projection. Returns { x, y, z } — z is depth
// (negative = behind the globe, positive = in front).
function project(lat, lng, yaw, radius) {
  const latRad = (lat * Math.PI) / 180;
  // adjust longitude by the current rotation, so the globe "spins"
  const lngRad = ((lng + yaw) * Math.PI) / 180;
  const x = radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = -radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);
  return { x, y, z };
}

// Build a dotted-sphere field. Returns an array of {x,y,z,opacity} dots
// placed on a regular lat/lng grid. The opacity falls off near the limb
// to give the illusion of a globe rather than a flat disk.
function buildDotField(yaw, radius) {
  const dots = [];
  // step in degrees — smaller = denser sphere. ~6 degrees gives a nice density
  // without melting mobile devices.
  const STEP = 6;
  for (let lat = -84; lat <= 84; lat += STEP) {
    // dynamic longitude step so we don't get clusters at the poles
    const latRad = (lat * Math.PI) / 180;
    const circumferenceFactor = Math.max(Math.cos(latRad), 0.18);
    const lngStep = STEP / circumferenceFactor;
    for (let lng = -180; lng < 180; lng += lngStep) {
      const p = project(lat, lng, yaw, radius);
      // Only render dots on the visible hemisphere (z > 0).
      // For dots near the limb (low z), fade them so the edge feels soft.
      if (p.z > -radius * 0.02) {
        // opacity scales with z: deepest visible dots are 0.12, front dots 0.55
        const t = (p.z + radius * 0.02) / (radius + radius * 0.02);
        const opacity = 0.12 + t * 0.43;
        dots.push({ x: p.x, y: p.y, z: p.z, opacity });
      }
    }
  }
  return dots;
}

export default function AlgeriaGlobe() {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";

  // Globe drawing constants
  const SIZE = 560;            // SVG viewBox is SIZE x SIZE
  const CENTER = SIZE / 2;
  const RADIUS = 200;

  // The rotation yaw is animated continuously by a requestAnimationFrame loop.
  // A click bumps the rotation speed for ~1.5s, then it decays back to base.
  const [yaw, setYaw] = useState(-10); // start with Algeria roughly centered
  const speedRef = useRef(0.06);       // degrees per frame, base speed
  const boostRef = useRef(0);          // additional speed from a click, decays
  const rafRef = useRef(null);

  useEffect(() => {
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(now - last, 60); // clamp to avoid huge jumps after a tab-blur
      last = now;
      // decay boost toward zero
      boostRef.current *= 0.965;
      if (boostRef.current < 0.001) boostRef.current = 0;
      // advance yaw based on speed * dt (dt-normalized so motion looks the same
      // on 60Hz and 120Hz displays)
      setYaw((y) => y + (speedRef.current + boostRef.current) * (dt / 16.67));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function handleSpin() {
    // Push the globe — feels responsive without being a full rotation
    boostRef.current = 1.6;
  }

  // ---- Build the dot field for the current yaw ----------------------------
  // Yaw mod 360 for numerical stability (yaw can grow without bound)
  const normalizedYaw = ((yaw % 360) + 360) % 360 - 180;
  const dots = buildDotField(normalizedYaw, RADIUS);

  // ---- Project city pins so we know where to draw them --------------------
  const cityProjections = CITIES.map((c) => ({
    ...c,
    p: project(c.lat, c.lng, normalizedYaw, RADIUS),
  }));

  // Algiers projection used to anchor the left callout's leader line
  const algiers = cityProjections.find((c) => c.primary);
  // Djanet projection used to anchor the right callout's leader line
  const djanet  = cityProjections.find((c) => c.name === "Djanet");

  return (
    <section className="nz-globe-section">
      <div className="wrap nz-globe-head">
        <div className="nz-globe-kicker">{t("globe.kicker")}</div>
        <h2 className="display nz-globe-title">{t("globe.title")}</h2>
        <p className="nz-globe-sub">{t("globe.sub")}</p>
      </div>

      <div className="nz-globe-stage" onClick={handleSpin} role="button"
           tabIndex={0} aria-label="Spin the globe"
           onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSpin(); }}>

        {/* Left callout — anchored to Algiers */}
        <div className="nz-globe-callout nz-globe-callout-left">
          <div className="nz-globe-callout-num display">10</div>
          <div className="nz-globe-callout-body">
            <div className="nz-globe-callout-title">{t("globe.callout1_t")}</div>
            <div className="nz-globe-callout-text">{t("globe.callout1_d")}</div>
          </div>
        </div>

        {/* Right callout — anchored to Djanet */}
        <div className="nz-globe-callout nz-globe-callout-right">
          <div className="nz-globe-callout-body">
            <div className="nz-globe-callout-title">{t("globe.callout2_t")}</div>
            <div className="nz-globe-callout-text">{t("globe.callout2_d")}</div>
          </div>
        </div>

        <svg className="nz-globe-svg" viewBox={`0 0 ${SIZE} ${SIZE}`}
             xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {/* Soft ambient halo behind the sphere */}
          <defs>
            <radialGradient id="nz-globe-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#E63946" stopOpacity="0.10" />
              <stop offset="55%" stopColor="#E63946" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nz-globe-shade" cx="35%" cy="35%" r="75%">
              <stop offset="0%"   stopColor="#FAF8F4" stopOpacity="0" />
              <stop offset="100%" stopColor="#16161A" stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Halo */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS * 1.45}
                  fill="url(#nz-globe-halo)" />

          {/* Subtle sphere base — gives the dots something to sit on */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS}
                  fill="url(#nz-globe-shade)" />

          {/* Dot field (the sphere itself) */}
          <g>
            {dots.map((d, i) => (
              <circle key={i}
                cx={CENTER + d.x}
                cy={CENTER + d.y}
                r={1.4}
                fill="#16161A"
                opacity={d.opacity}
              />
            ))}
          </g>

          {/* City pins — only render when on the visible hemisphere */}
          <g>
            {cityProjections.map((c, i) => {
              if (c.p.z < 0) return null;
              const cx = CENTER + c.p.x;
              const cy = CENTER + c.p.y;
              // Front-facing dots get a stronger red and a pulsing halo
              const visibility = Math.max(0, c.p.z / RADIUS);
              return (
                <g key={c.name} opacity={0.4 + visibility * 0.6}>
                  {/* Pulse halo — pure CSS animation, staggered per-city */}
                  <circle cx={cx} cy={cy} r="4" fill="#E63946"
                          className="nz-globe-pulse"
                          style={{ animationDelay: `${i * 0.35}s` }} />
                  {/* Solid pin */}
                  <circle cx={cx} cy={cy} r={c.primary ? 4.5 : 3.5}
                          fill="#E63946" />
                  {c.primary && (
                    <circle cx={cx} cy={cy} r="2"
                            fill="#FAF8F4" />
                  )}
                </g>
              );
            })}
          </g>

          {/* Leader lines from callouts to anchor pins */}
          {algiers && algiers.p.z > 0 && (
            <line
              x1={CENTER + algiers.p.x} y1={CENTER + algiers.p.y}
              x2={CENTER - RADIUS - 30} y2={CENTER - 30}
              stroke="#E63946" strokeWidth="1" strokeOpacity="0.45"
              strokeDasharray="2 3"
            />
          )}
          {djanet && djanet.p.z > 0 && (
            <line
              x1={CENTER + djanet.p.x} y1={CENTER + djanet.p.y}
              x2={CENTER + RADIUS + 30} y2={CENTER + 50}
              stroke="#E63946" strokeWidth="1" strokeOpacity="0.45"
              strokeDasharray="2 3"
            />
          )}
        </svg>

        {/* Hint that the globe is interactive */}
        <div className="nz-globe-hint">{t("globe.hint")}</div>
      </div>

      <style>{`
        .nz-globe-section {
          padding: 72px 0 80px;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }
        .nz-globe-head {
          text-align: center;
          margin-bottom: 32px;
        }
        .nz-globe-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 14px;
        }
        .nz-globe-title {
          font-size: clamp(34px, 5vw, 56px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .nz-globe-sub {
          font-size: 16px;
          color: var(--ink-2);
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.55;
        }
        .nz-globe-stage {
          position: relative;
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 20px 20px 0;
          cursor: pointer;
          user-select: none;
        }
        .nz-globe-svg {
          display: block;
          width: 100%;
          height: auto;
          max-width: 620px;
          margin: 0 auto;
        }
        .nz-globe-pulse {
          transform-origin: center;
          transform-box: fill-box;
          animation: nz-globe-pulse 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          opacity: 0;
        }
        @keyframes nz-globe-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(3.2); opacity: 0;   }
          100% { transform: scale(3.2); opacity: 0;   }
        }

        /* Callouts — bracket-style boxes with a left/right red accent */
        .nz-globe-callout {
          position: absolute;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: rgba(250, 248, 244, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 16px 20px;
          border-radius: 6px;
          max-width: 240px;
          font-size: 13.5px;
          line-height: 1.5;
          z-index: 2;
          animation: nz-globe-callout-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes nz-globe-callout-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nz-globe-callout-left {
          top: 30%;
          left: 6%;
          border: 1px solid rgba(230, 57, 70, 0.4);
          border-left: 2px solid var(--red);
          animation-delay: 0.3s;
        }
        .nz-globe-callout-right {
          top: 58%;
          right: 6%;
          border: 1px solid rgba(230, 57, 70, 0.4);
          border-right: 2px solid var(--red);
          text-align: right;
          animation-delay: 0.5s;
        }
        .nz-globe-callout-num {
          font-size: 32px;
          font-weight: 600;
          color: var(--red);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .nz-globe-callout-title {
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .nz-globe-callout-text {
          color: var(--ink-2);
          font-size: 12.5px;
        }
        .nz-globe-hint {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gray-400);
          white-space: nowrap;
          opacity: 0.7;
          pointer-events: none;
        }

        /* RTL mirroring for callouts */
        [dir="rtl"] .nz-globe-callout-left {
          left: auto; right: 6%;
          border-left: 1px solid rgba(230, 57, 70, 0.4);
          border-right: 2px solid var(--red);
          text-align: right;
        }
        [dir="rtl"] .nz-globe-callout-right {
          right: auto; left: 6%;
          border-right: 1px solid rgba(230, 57, 70, 0.4);
          border-left: 2px solid var(--red);
          text-align: left;
        }

        /* Tablet */
        @media (max-width: 860px) {
          .nz-globe-callout { max-width: 200px; padding: 12px 16px; font-size: 12.5px; }
          .nz-globe-callout-num { font-size: 26px; }
          .nz-globe-callout-left { top: 24%; left: 2%; }
          .nz-globe-callout-right { top: 62%; right: 2%; }
        }

        /* Phone — callouts stack below the globe instead of overlapping */
        @media (max-width: 600px) {
          .nz-globe-section { padding: 56px 0 64px; }
          .nz-globe-sub { font-size: 14.5px; padding: 0 20px; }
          .nz-globe-stage { padding: 0 16px; }
          .nz-globe-svg { max-width: 360px; }
          .nz-globe-callout {
            position: static;
            max-width: none;
            width: 100%;
            margin: 0;
            text-align: left;
          }
          [dir="rtl"] .nz-globe-callout-left,
          [dir="rtl"] .nz-globe-callout-right { text-align: right; }
          .nz-globe-callout-left  { margin: 24px auto 12px; }
          .nz-globe-callout-right { margin: 0 auto 8px; }
          .nz-globe-hint { position: static; transform: none; display: block;
                           text-align: center; margin-top: 24px; }
        }

        /* Respect reduced-motion preference — kill all animation */
        @media (prefers-reduced-motion: reduce) {
          .nz-globe-pulse { animation: none; opacity: 0; }
          .nz-globe-callout { animation: none; }
        }
      `}</style>
    </section>
  );
}
