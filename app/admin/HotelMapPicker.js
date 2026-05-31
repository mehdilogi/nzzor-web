"use client";

// =============================================================================
// HotelMapPicker
// =============================================================================
// Click-to-place coordinate picker for the admin hotel editor.
//
// Drops into the editor as:
//
//   <HotelMapPicker
//     lat={form.latitude}
//     lng={form.longitude}
//     onChange={(la, lo) => setForm((f) => ({ ...f, latitude: la, longitude: lo }))}
//   />
//
// `lat` / `lng` are numbers or null. `onChange(lat, lng)` is called with two
// numbers (rounded to 6 dp) when a pin is placed/moved/typed/pasted, and with
// (null, null) when the pin is cleared.
//
// The Leaflet map itself lives in HotelMapPickerInner.js and is loaded
// client-only (ssr:false) — Leaflet crashes during SSR.
// =============================================================================

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const MapInner = dynamic(() => import("./HotelMapPickerInner"), {
  ssr: false,
  loading: () => <div className="nzad-mappick-loading">Loading map…</div>,
});

// "" / null / non-numeric -> null; otherwise a Number.
const num = (v) =>
  v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v);

// Parses a pasted coordinate pair. Google Maps' right-click "copy" gives
// "36.7521, 2.8954"; we also accept space-separated. Returns [lat, lng] within
// valid ranges, or null.
function parsePair(str) {
  if (!str) return null;
  const m = String(str).match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const la = Number(m[1]);
  const lo = Number(m[2]);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return [la, lo];
}

export default function HotelMapPicker({ lat, lng, address = "", onChange }) {
  const [paste, setPaste] = useState("");
  const [pasteErr, setPasteErr] = useState("");

  // Address-geocode state. `addr` seeds from the hotel's address prop but stays
  // editable — the operator can refine it before searching. `geoStatus` drives
  // the inline feedback (idle / searching / a found-place label / not-found).
  const [addr, setAddr] = useState(address);
  const [geoStatus, setGeoStatus] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);

  // Keep the search box in sync if the hotel's address prop changes (e.g.
  // switching which hotel is being edited) — but only when the operator hasn't
  // already typed something different into it.
  useEffect(() => {
    setAddr(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Local text mirrors of the numeric coords, so typing a decimal like "36.7"
  // isn't fought by coercion. Synced from props only when the value actually
  // changes from outside (map click / drag / paste / clear).
  const [latStr, setLatStr] = useState(lat == null ? "" : String(lat));
  const [lngStr, setLngStr] = useState(lng == null ? "" : String(lng));

  useEffect(() => {
    if (num(latStr) !== num(lat)) setLatStr(lat == null ? "" : String(lat));
    if (num(lngStr) !== num(lng)) setLngStr(lng == null ? "" : String(lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const hasPoint = lat != null && lng != null;

  // Single funnel for every coordinate change. Rounds to 6 dp (~0.1 m) to keep
  // the database tidy; passing null clears the pin.
  const pick = (la, lo) => {
    onChange(
      la == null ? null : Math.round(la * 1e6) / 1e6,
      lo == null ? null : Math.round(lo * 1e6) / 1e6
    );
  };

  const applyPaste = () => {
    const parsed = parsePair(paste);
    if (!parsed) {
      setPasteErr("Couldn't read that. Expected something like  36.7521, 2.8954");
      return;
    }
    setPasteErr("");
    setPaste("");
    pick(parsed[0], parsed[1]);
  };

  // Geocode an address -> coordinates via OpenStreetMap's Nominatim (free, no
  // key, same OSM family as our tiles). Biased to Algeria (countrycodes=dz) so
  // a bare town name can't match abroad. This gets the pin ~90% there; the
  // operator still confirms/drags, because rural Algerian addresses often
  // resolve only to the town centre, not the exact building.
  const geocode = async () => {
    const q = addr.trim();
    if (!q) {
      setGeoStatus("Type an address first (it pre-fills from the Address field above).");
      return;
    }
    setGeoBusy(true);
    setGeoStatus("Searching…");
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=dz&q=" +
        encodeURIComponent(q);
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error("geocode http " + res.status);
      const results = await res.json();
      if (!results || results.length === 0) {
        setGeoStatus("No match in Algeria. Try a simpler address (street + town), or drop the pin by hand.");
        return;
      }
      const hit = results[0];
      const la = Number(hit.lat);
      const lo = Number(hit.lon);
      if (Number.isNaN(la) || Number.isNaN(lo)) {
        setGeoStatus("Got an odd result — drop the pin by hand instead.");
        return;
      }
      pick(la, lo);
      const label = (hit.display_name || q).split(",").slice(0, 3).join(",");
      setGeoStatus("Found: " + label + " — check the pin and drag it if it's off.");
    } catch (e) {
      setGeoStatus("Lookup failed (network or rate limit). Wait a moment, or drop the pin by hand.");
    } finally {
      setGeoBusy(false);
    }
  };

  return (
    <div className="nzad-mappick">
      <p className="nzad-mappick-help">
        Click the map to drop the pin, drag it to fine-tune, or paste
        coordinates from Google Maps. This is exactly where guests will see the
        hotel on its page — no map shows until a pin is set.
      </p>

      <div className="nzad-mappick-geo">
        <input
          type="text"
          className="nzad-mappick-geo-input"
          value={addr}
          placeholder="Type an address, then Find on map"
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              geocode();
            }
          }}
        />
        <button
          type="button"
          className="nzad-mappick-geo-btn"
          onClick={geocode}
          disabled={geoBusy}
        >
          {geoBusy ? "Searching…" : "Find on map"}
        </button>
      </div>
      {geoStatus && <div className="nzad-mappick-geo-status">{geoStatus}</div>}

      <div className="nzad-mappick-map">
        <MapInner lat={num(lat)} lng={num(lng)} onPick={pick} />
      </div>

      <div className="nzad-mappick-fields">
        <div className="nzad-mappick-field">
          <label>Latitude</label>
          <input
            type="number"
            step="any"
            value={latStr}
            placeholder="—"
            onChange={(e) => {
              setLatStr(e.target.value);
              pick(num(e.target.value), num(lngStr));
            }}
          />
        </div>
        <div className="nzad-mappick-field">
          <label>Longitude</label>
          <input
            type="number"
            step="any"
            value={lngStr}
            placeholder="—"
            onChange={(e) => {
              setLngStr(e.target.value);
              pick(num(latStr), num(e.target.value));
            }}
          />
        </div>
        <div className="nzad-mappick-field nzad-mappick-paste">
          <label>Paste from Google Maps</label>
          <div className="nzad-mappick-paste-row">
            <input
              type="text"
              value={paste}
              placeholder="36.7521, 2.8954"
              onChange={(e) => setPaste(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyPaste();
                }
              }}
            />
            <button type="button" className="nzad-mappick-btn" onClick={applyPaste}>
              Set
            </button>
          </div>
        </div>
      </div>

      {pasteErr && <div className="nzad-mappick-err">{pasteErr}</div>}

      <div className="nzad-mappick-actions">
        <span className="nzad-mappick-status">
          {hasPoint
            ? `Pin set · ${lat}, ${lng}`
            : "No pin yet — this hotel won't show a map until you set one."}
        </span>
        <div className="nzad-mappick-action-btns">
          {hasPoint && (
            <a
              className="nzad-mappick-link"
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps ↗
            </a>
          )}
          {hasPoint && (
            <button
              type="button"
              className="nzad-mappick-clear"
              onClick={() => pick(null, null)}
            >
              Clear pin
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .nzad-mappick {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .nzad-mappick-help {
          font-size: 12.5px;
          color: var(--gray-400);
          line-height: 1.5;
          margin: 0;
        }
        .nzad-mappick-geo {
          display: flex;
          gap: 8px;
        }
        .nzad-mappick-geo-input {
          flex: 1;
          min-width: 0;
          padding: 10px 13px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .nzad-mappick-geo-input:focus {
          border-color: var(--red);
        }
        .nzad-mappick-geo-btn {
          padding: 10px 18px;
          background: var(--red);
          color: #fff;
          border: none;
          border-radius: var(--r-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .nzad-mappick-geo-btn:hover:not(:disabled) {
          background: var(--red-deep);
        }
        .nzad-mappick-geo-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .nzad-mappick-geo-status {
          font-size: 12px;
          color: var(--ink-2);
          line-height: 1.5;
          padding: 2px 2px 0;
        }
        .nzad-mappick-map {
          height: 320px;
          border-radius: var(--r-md);
          overflow: hidden;
          border: 1.5px solid var(--gray-200);
          position: relative;
          z-index: 0;
        }
        .nzad-mappick-loading {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--gray-400);
          background: var(--cream);
        }
        .nzad-mappick-fields {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          gap: 14px;
          align-items: end;
        }
        .nzad-mappick-field label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--gray-400);
          margin-bottom: 5px;
        }
        .nzad-mappick-field input {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .nzad-mappick-field input:focus {
          border-color: var(--red);
        }
        .nzad-mappick-paste-row {
          display: flex;
          gap: 8px;
        }
        .nzad-mappick-paste-row input {
          flex: 1;
          min-width: 0;
        }
        .nzad-mappick-btn {
          padding: 9px 16px;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: var(--r-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          flex-shrink: 0;
        }
        .nzad-mappick-btn:hover {
          opacity: 0.9;
        }
        .nzad-mappick-err {
          padding: 8px 12px;
          background: var(--red-soft);
          color: var(--red-deep);
          border-radius: var(--r-sm);
          font-size: 12.5px;
          font-weight: 600;
        }
        .nzad-mappick-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .nzad-mappick-status {
          font-size: 12.5px;
          color: var(--gray-400);
          font-weight: 600;
        }
        .nzad-mappick-action-btns {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .nzad-mappick-link {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--red);
          text-decoration: none;
          white-space: nowrap;
        }
        .nzad-mappick-link:hover {
          text-decoration: underline;
        }
        .nzad-mappick-clear {
          padding: 7px 13px;
          background: #fff;
          color: var(--red-deep);
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .nzad-mappick-clear:hover {
          border-color: var(--red);
        }
        @media (max-width: 720px) {
          .nzad-mappick-fields {
            grid-template-columns: 1fr;
          }
          .nzad-mappick-map {
            height: 260px;
          }
        }
      `}</style>
    </div>
  );
}
