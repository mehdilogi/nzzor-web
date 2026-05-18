"use client";

// =============================================================================
// Nzzor — Logo Mark
// The brand's red dot with a pulsing ring. Uses a plain inline style + a single
// global keyframe (defined in globals.css as `lm-pulse`). No styled-jsx inside,
// so it cannot introduce stray elements or layout quirks.
// =============================================================================

export default function LogoMark({ size = 28, light = false }) {
  const rgb = light ? "255,255,255" : "230,57,70";
  return (
    <span
      className="lm-dot"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `rgb(${rgb})`,
        flexShrink: 0,
        // CSS custom property consumed by the lm-pulse keyframe in globals.css
        ["--lm-rgb"]: rgb,
      }}
    />
  );
}
