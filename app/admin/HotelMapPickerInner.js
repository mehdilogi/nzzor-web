"use client";

// =============================================================================
// HotelMapPickerInner
// =============================================================================
// The actual Leaflet map for the admin hotel editor. This file is loaded
// CLIENT-ONLY via next/dynamic({ ssr: false }) from HotelMapPicker.js, because
// Leaflet touches `window` on import and would crash server-side rendering.
//
// Behaviour:
//   - Click anywhere on the map  -> drops / moves the pin (calls onPick)
//   - Drag the pin               -> fine-tunes the position (calls onPick)
//   - Coords changed from outside -> the map recenters on the new point
//
// react-leaflet v4 (React 18 line). Do NOT upgrade to react-leaflet v5 — it
// requires React 19 and the project is on React 18.
// =============================================================================

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Whole-country view, used before any pin is set so the admin can zoom in
// anywhere in Algeria. Rough geographic centre of Algeria.
const ALGERIA_CENTER = [28.0339, 1.6596];
const ALGERIA_ZOOM = 5;
const PIN_ZOOM = 15;

// Red teardrop pin drawn as inline SVG. Inline SVG sidesteps Leaflet's classic
// "marker-icon.png 404" bundling problem entirely. Same brand red (#E63946) as
// the public hotel-detail map, so admin and public stay visually consistent.
const pinIcon = L.divIcon({
  className: "nzad-pin-icon",
  html:
    '<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13 23.6 14 24.5.6.5 1.4.5 2 0C17 38.6 30 25.5 30 15 30 6.7 23.3 0 15 0z" fill="#E63946"/>' +
    '<circle cx="15" cy="15" r="5.5" fill="#fff"/>' +
    "</svg>",
  iconSize: [30, 40],
  iconAnchor: [15, 40], // the tip of the teardrop sits on the exact point
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer's center/zoom props only apply at mount in react-leaflet v4, so
// we recenter imperatively whenever a real point arrives (click/paste/typed).
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), PIN_ZOOM));
    }
  }, [lat, lng, map]);
  return null;
}

export default function HotelMapPickerInner({ lat, lng, onPick }) {
  const hasPoint =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const center = hasPoint ? [lat, lng] : ALGERIA_CENTER;
  const zoom = hasPoint ? PIN_ZOOM : ALGERIA_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onPick={onPick} />
      <Recenter lat={hasPoint ? lat : null} lng={hasPoint ? lng : null} />
      {hasPoint && (
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const m = e.target.getLatLng();
              onPick(m.lat, m.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
