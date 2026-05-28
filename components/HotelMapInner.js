// =============================================================================
// Nzzor — Hotel Map (inner, client-only)
// =============================================================================
// This file is imported via next/dynamic({ ssr: false }) from HotelMap.js,
// so it only ever runs in the browser. That's required because Leaflet
// references `window`/`document` at import time.
//
// Renders an OpenStreetMap-tiled Leaflet map with a single custom red pin.
// `interactive` toggles all the user-input handlers — on mobile we pass
// false until the user taps the overlay, so the map can't swallow scrolls.
// =============================================================================

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Custom pin. Leaflet's default marker icon relies on image files resolved
// relative to the CSS, which breaks under Next.js bundling (the classic
// "marker icon 404" problem). We sidestep it entirely with a divIcon — an
// HTML/CSS pin, no image assets. Brand red (#E63946) teardrop with a dot.
// ---------------------------------------------------------------------------

const redPin = L.divIcon({
  className: "nz-pin",
  html: `
    <div style="
      width: 28px; height: 28px;
      transform: translate(-50%, -100%);
      position: relative;
    ">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22c0-7.73-6.27-14-14-14z" fill="#E63946"/>
        <circle cx="14" cy="14" r="5.5" fill="#fff"/>
      </svg>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -34],
});

// Small helper component: when `interactive` changes, enable/disable the
// map's input handlers. react-leaflet doesn't let us toggle these via props
// after mount, so we reach into the map instance.
function InteractivityController({ interactive }) {
  const map = useMap();
  useEffect(() => {
    const handlers = [
      "dragging",
      "touchZoom",
      "doubleClickZoom",
      "scrollWheelZoom",
      "boxZoom",
      "keyboard",
    ];
    handlers.forEach((h) => {
      if (map[h]) {
        if (interactive) map[h].enable();
        else map[h].disable();
      }
    });
    // Tap handler exists only on touch builds
    if (map.tap) {
      if (interactive) map.tap.enable();
      else map.tap.disable();
    }
  }, [interactive, map]);
  return null;
}

export default function HotelMapInner({ lat, lng, interactive, hotelName }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      // We control interactivity dynamically via InteractivityController, so
      // start everything off; the controller flips them based on `interactive`.
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={true}
      attributionControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Marker position={[lat, lng]} icon={redPin}>
        {hotelName && <Popup>{hotelName}</Popup>}
      </Marker>
      <InteractivityController interactive={interactive} />
    </MapContainer>
  );
}
