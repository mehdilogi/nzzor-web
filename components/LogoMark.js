"use client";

// =============================================================================
// Nzzor — Logo Mark
// The brand's red dot with a pulsing "ping". Self-contained so it renders
// identically everywhere (nav, footer, admin) with zero dependency on globals.
// =============================================================================

export default function LogoMark({ size = 30, light = false }) {
  return (
    <span className="lm" style={{ width: size, height: size }}>
      <span className="lm-ping" />
      <span className="lm-ping lm-ping-2" />
      <span className="lm-core" />
      <style jsx>{`
        .lm {
          position: relative; display: inline-block; flex-shrink: 0;
        }
        .lm-core {
          position: absolute; inset: 0; border-radius: 50%;
          background: ${light ? "#fff" : "#E63946"};
          z-index: 2;
        }
        .lm-ping {
          position: absolute; inset: 0; border-radius: 50%;
          background: ${light ? "#fff" : "#E63946"};
          z-index: 1;
          animation: lm-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .lm-ping-2 { animation-delay: 1.3s; }
        @keyframes lm-ping {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(2.3); opacity: 0; }
          100% { transform: scale(2.3); opacity: 0; }
        }
      `}</style>
    </span>
  );
}
