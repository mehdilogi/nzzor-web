"use client";

// =============================================================================
// Nzzor — Logo Mark
// The brand's red dot. The pulse is a box-shadow ring (soft, expands outward,
// never affects layout and can never look like a huge solid circle).
// =============================================================================

export default function LogoMark({ size = 28, light = false }) {
  const color = light ? "255,255,255" : "230,57,70";
  return (
    <span className="lm">
      <style jsx>{`
        .lm {
          display: block;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: rgb(${color});
          flex-shrink: 0;
          animation: lm-pulse 2.4s ease-out infinite;
        }
        @keyframes lm-pulse {
          0% { box-shadow: 0 0 0 0 rgba(${color}, 0.5); }
          70% { box-shadow: 0 0 0 11px rgba(${color}, 0); }
          100% { box-shadow: 0 0 0 0 rgba(${color}, 0); }
        }
      `}</style>
    </span>
  );
}
