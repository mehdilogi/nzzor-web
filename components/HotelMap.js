// =============================================================================
// Nzzor — Hotel Location Map
// =============================================================================
// Renders an interactive Leaflet map with a single pin for one hotel.
//
// Key design decisions:
//   - Leaflet touches `window` on import, which breaks Next.js SSR. So the
//     actual map is in MapInner (below) and loaded via next/dynamic with
//     ssr:false. This file's default export is a thin wrapper that does the
//     dynamic import + handles the "no coordinates" case.
//   - OpenStreetMap tiles — free, no API key, no usage limits for our scale.
//   - Tap-to-interact on mobile: the map starts non-interactive (so it never
//     hijacks a scroll), with a "Tap to explore" overlay. First tap enables
//     dragging/zooming. On desktop the map is interactive immediately.
//   - Renders NOTHING (null) if the hotel has no location. The API gives us
//     hotel.location = { lat, lng } or null, so coords can be filled in later
//     and maps appear progressively, hotel by hotel.
//   - Custom red pin (Nzzor brand) instead of Leaflet's default blue marker.
//
// Requires: leaflet + react-leaflet (see PATCH_NOTES for version pinning).
// Leaflet's CSS is imported here; it's small and scoped to .leaflet-* classes.
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The interactive map is loaded client-only. A skeleton shows while it loads.
const MapInner = dynamic(() => import("./HotelMapInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        width: "100%",
        background: "#ECEAE4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(22,22,26,0.4)",
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

export default function HotelMap({ hotel, t }) {
  // The API returns hotel.location = { lat, lng } | null.
  const loc = hotel?.location;

  // `activated` controls whether the map responds to drag/zoom.
  // Desktop should be interactive immediately; mobile waits for a tap (so the
  // map never hijacks a scroll gesture). We initialise from viewport width on
  // mount. Starts false for SSR safety, then an effect flips it true on
  // desktop. The tap overlay is only ever visible on mobile (CSS + this flag).
  const [activated, setActivated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) setActivated(true); // desktop: live immediately
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // No coordinates set for this hotel yet → render nothing at all.
  // (This is why we can ship before backfilling coords: hotels without
  // location simply don't show a map section.)
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    return null;
  }

  // Translation helper is optional — fall back to English strings if the
  // host page doesn't pass `t`.
  const tr = typeof t === "function" ? t : (k) => DEFAULT_STRINGS[k] || k;

  const { lat, lng } = loc;

  // Directions link — opens the device's default maps app. Google Maps URL
  // works on every platform (desktop, Android; iOS offers to open Apple Maps).
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="nz-map-wrap" style={{ position: "relative" }}>
      <div
        className="nz-map-frame"
        style={{
          position: "relative",
          width: "100%",
          height: 380,
          borderRadius: 14,
          overflow: "hidden",
          border: "0.5px solid rgba(22,22,26,0.12)",
          background: "#ECEAE4",
        }}
      >
        <MapInner lat={lat} lng={lng} interactive={activated} hotelName={hotel.name} />

        {/* Tap-to-interact overlay (mobile only). Once tapped, activated=true
            enables map interaction and removes this overlay. Not rendered at
            all on desktop (isDesktop) since the map is already live there. */}
        {!activated && !isDesktop && (
          <button
            type="button"
            className="nz-map-tap"
            onClick={() => setActivated(true)}
            aria-label={tr("detail.map_tap")}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 500,
              border: 0,
              background: "rgba(22,22,26,0.04)",
              cursor: "pointer",
              display: "none", // shown only on mobile via stylesheet below
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 16,
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                background: "rgba(22,22,26,0.82)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 999,
                backdropFilter: "blur(4px)",
              }}
            >
              {tr("detail.map_tap")}
            </span>
          </button>
        )}
      </div>

      {/* Address + directions row */}
      <div
        className="nz-map-foot"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">📍</span>
          <span
            style={{
              fontSize: 14,
              color: "rgba(22,22,26,0.7)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hotel.address || `${hotel.city || ""}${hotel.region ? ", " + hotel.region : ""}`}
          </span>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nz-map-dir"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "#E63946",
            textDecoration: "none",
            padding: "7px 14px",
            borderRadius: 8,
            border: "0.5px solid rgba(230,57,70,0.3)",
            background: "rgba(230,57,70,0.04)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden="true">→</span> {tr("detail.map_directions")}
        </a>
      </div>

      {/* The tap overlay should ONLY appear on touch / small screens.
          On desktop the map is interactive from the start (activated stays
          false but the overlay is display:none, and MapInner is told
          interactive=true via the media query trick below is not possible in
          inline styles — so we handle the desktop case in MapInner by always
          allowing scroll-wheel zoom off but drag on). We use a tiny scoped
          stylesheet to flip the overlay's display by viewport. */}
      <style>{`
        /* Desktop: hide the tap overlay entirely, map is live immediately. */
        @media (min-width: 768px) {
          .nz-map-tap { display: none !important; }
        }
        /* Mobile: show the tap overlay (until activated removes it). */
        @media (max-width: 767px) {
          .nz-map-tap { display: flex !important; }
          .nz-map-frame { height: 240px !important; }
        }
        .nz-map-dir:hover { background: rgba(230,57,70,0.10) !important; }
      `}</style>
    </div>
  );
}

const DEFAULT_STRINGS = {
  "detail.map_tap": "Tap to explore the map",
  "detail.map_directions": "Get directions",
};
