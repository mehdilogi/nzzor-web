// =============================================================================
// Nzzor — Analytics Admin Panel (Bundle 2)
// =============================================================================
// Reads from the six endpoints shipped in Bundle 1:
//   /api/admin/analytics/{overview, timeseries, sources, geo, pages, events}
//
// All endpoints accept ?start=YYYY-MM-DD&end=YYYY-MM-DD. The date-range
// picker at the top drives the whole panel — change the range, every card
// re-fetches.
//
// Design notes:
// - Single SVG line chart (no recharts/d3) to keep bundle size honest
// - Sources/geo/pages/events render as compact bar lists, not charts
// - Empty states are first-class — DailyStats is empty until 02:00 UTC,
//   AnalyticsEvent is empty until trackEvent is wired, so the panel must
//   not look broken in those cases
// - Matches AdminApp's `nzad-` class convention; styles at the bottom
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// -----------------------------------------------------------------------------
// Date helpers — work in UTC to match what the API expects (YYYY-MM-DD)
// -----------------------------------------------------------------------------

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// -----------------------------------------------------------------------------
// Number formatters — locale-stable, no surprises across servers/clients
// -----------------------------------------------------------------------------

const numFmt = new Intl.NumberFormat("en-US");
const fmtInt = (n) => numFmt.format(Math.round(n || 0));
const fmtPct = (n) => `${(n || 0).toFixed(1)}%`;
const fmtDec = (n) => (n || 0).toFixed(2);

// Compute the delta % from previous period for a KPI card. Returns:
//   { value: number|null, direction: "up"|"down"|"flat"|"none" }
// "none" means we can't compute (previous was zero or null).
function pctDelta(curr, prev) {
  if (!prev || prev === 0) return { value: null, direction: "none" };
  const v = ((curr - prev) / prev) * 100;
  if (Math.abs(v) < 0.5) return { value: v, direction: "flat" };
  return { value: v, direction: v > 0 ? "up" : "down" };
}

// -----------------------------------------------------------------------------
// Country code → emoji flag. Pure character math: regional indicator A-Z is
// at code point 0x1F1E6 + letter offset. Works for any ISO 3166-1 alpha-2.
// -----------------------------------------------------------------------------

function flagFor(country) {
  if (!country || country.length !== 2 || country === "unknown") return "🌍";
  const cc = country.toUpperCase();
  const a = cc.charCodeAt(0);
  const b = cc.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🌍";
  return String.fromCodePoint(0x1f1e6 + (a - 65), 0x1f1e6 + (b - 65));
}

// English country names for the most common ISO codes we'll see. Anything
// unmatched falls back to the raw code so the UI doesn't lie about names.
const COUNTRY_NAMES = {
  DZ: "Algeria",
  FR: "France",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  TN: "Tunisia",
  MA: "Morocco",
  EG: "Egypt",
  TR: "Turkey",
  SA: "Saudi Arabia",
  AE: "UAE",
  QA: "Qatar",
  KW: "Kuwait",
  CN: "China",
  JP: "Japan",
  AU: "Australia",
  BR: "Brazil",
  MX: "Mexico",
  RU: "Russia",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  PT: "Portugal",
  GR: "Greece",
  IL: "Israel",
  IN: "India",
  PK: "Pakistan",
  ID: "Indonesia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  NG: "Nigeria",
  ZA: "South Africa",
  KE: "Kenya",
  SN: "Senegal",
};

function countryName(code) {
  if (!code || code === "unknown") return "Unknown";
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

// Pretty labels for traffic-source buckets — matches referrerService.js
const SOURCE_LABELS = {
  direct: "Direct",
  internal: "Internal nav",
  google: "Google",
  bing: "Bing",
  yahoo: "Yahoo",
  duckduckgo: "DuckDuckGo",
  yandex: "Yandex",
  baidu: "Baidu",
  ecosia: "Ecosia",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  reddit: "Reddit",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  youtube: "YouTube",
  threads: "Threads",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  messenger: "Messenger",
  email: "Email",
  other: "Other",
};
const sourceLabel = (s) => SOURCE_LABELS[s] || s || "Unknown";

// Event type → human label
const EVENT_LABELS = {
  WHATSAPP_CLICK: "WhatsApp clicked",
  BOOKING_CTA_CLICK: "Booking CTA clicked",
  HOTEL_VIEW: "Hotel viewed",
  SIGNUP: "Sign-up",
  LOGIN: "Login",
  BOOKING_STARTED: "Booking started",
  BOOKING_COMPLETED: "Booking completed",
  SEARCH: "Search",
};
const eventLabel = (t) => EVENT_LABELS[t] || t;

// -----------------------------------------------------------------------------
// Auth — admin endpoints require a Bearer token. AdminApp's adminApi.js stores
// the JWT in localStorage under the key "nzzor_admin_token" (see lib/adminApi.js).
// We read it the same way for fetches so the admin's session is reused.
// -----------------------------------------------------------------------------

function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("nzzor_admin_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function fetchJSON(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API}${path}${qs}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? ": " + body.slice(0, 200) : ""}`);
  }
  return res.json();
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AnalyticsPanel() {
  // ---- Date range state (the master input for every fetch) ----
  const [preset, setPreset] = useState("7d");
  const [start, setStart] = useState(() => toISODate(daysAgo(6))); // 7d inclusive
  const [end, setEnd] = useState(() => toISODate(todayUTC()));

  // ---- Data state, one per endpoint ----
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [sources, setSources] = useState(null);
  const [geo, setGeo] = useState(null);
  const [pages, setPages] = useState(null);
  const [events, setEvents] = useState(null);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bump to force re-fetch

  // ---- Bookkeeping ----
  const lastFetchAt = useRef(null);

  // -------------------------------------------------------------------------
  // Preset → date range
  // -------------------------------------------------------------------------
  const applyPreset = useCallback((p) => {
    setPreset(p);
    const today = todayUTC();
    let s;
    switch (p) {
      case "today":
        s = today;
        break;
      case "7d":
        s = daysAgo(6);
        break;
      case "30d":
        s = daysAgo(29);
        break;
      case "90d":
        s = daysAgo(89);
        break;
      default:
        return; // "custom" keeps the existing range
    }
    setStart(toISODate(s));
    setEnd(toISODate(today));
  }, []);

  // -------------------------------------------------------------------------
  // Fetch all panels in parallel. Independent endpoint failures are tolerated
  // — one slow / broken card shouldn't block the rest of the dashboard.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const params = { start, end };
    setLoading(true);
    setError(null);

    const tasks = [
      ["overview", "/api/admin/analytics/overview", setOverview],
      ["timeseries", "/api/admin/analytics/timeseries", setTimeseries],
      ["sources", "/api/admin/analytics/sources", setSources],
      ["geo", "/api/admin/analytics/geo", setGeo],
      ["pages", "/api/admin/analytics/pages", setPages],
      ["events", "/api/admin/analytics/events", setEvents],
    ];

    Promise.allSettled(tasks.map(([_, p]) => fetchJSON(p, params))).then((results) => {
      if (cancelled) return;
      results.forEach((r, i) => {
        const [name, , setter] = tasks[i];
        if (r.status === "fulfilled") {
          setter(r.value);
        } else {
          console.error(`[analytics] ${name} fetch failed:`, r.reason?.message);
          setter({ data: null, _err: r.reason?.message || "fetch failed" });
        }
      });
      // Surface a top-level error only if ALL panels failed (usually an auth issue)
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        setError(results[0].reason?.message || "Failed to load analytics");
      }
      lastFetchAt.current = new Date();
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [start, end, refreshKey]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="nzad-analytics">
      <Header
        preset={preset}
        start={start}
        end={end}
        loading={loading}
        lastFetchAt={lastFetchAt.current}
        onPreset={applyPreset}
        onStartChange={(v) => {
          setStart(v);
          setPreset("custom");
        }}
        onEndChange={(v) => {
          setEnd(v);
          setPreset("custom");
        }}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {error ? (
        <ErrorBanner message={error} />
      ) : (
        <>
          <KpiRow data={overview?.data} loading={loading} />

          <div className="nzad-an-grid">
            <Card title="Sessions over time" subtitle={timeseriesSubtitle(start, end)}>
              <TimeseriesChart points={timeseries?.data} loading={loading} />
            </Card>

            <Card title="Top countries" subtitle="By session count">
              <GeoList rows={geo?.data} total={geo?.total} loading={loading} />
            </Card>

            <Card title="Traffic sources" subtitle="Where visitors come from">
              <SourcesList rows={sources?.data} total={sources?.total} loading={loading} />
            </Card>

            <Card title="Top pages" subtitle="By pageviews">
              <PagesList rows={pages?.data} loading={loading} />
            </Card>

            <Card
              title="Events"
              subtitle="Custom-tracked clicks (WhatsApp, booking CTA, etc.)"
              span={2}
            >
              <EventsList rows={events?.data} loading={loading} />
            </Card>
          </div>
        </>
      )}

      <style jsx>{`
        .nzad-analytics {
          --nz-ink: #16161a;
          --nz-cream: #faf8f4;
          --nz-red: #e63946;
          --nz-teal: #1b8a5a;
          --nz-border: rgba(22, 22, 26, 0.08);
          --nz-border-strong: rgba(22, 22, 26, 0.16);
          --nz-mute: rgba(22, 22, 26, 0.55);
          --nz-soft: rgba(22, 22, 26, 0.04);
          color: var(--nz-ink);
          padding: 28px;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* Header */
        .nzad-an-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .nzad-an-title {
          font-family: "Clash Display", "Manrope", system-ui, sans-serif;
          font-size: 32px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .nzad-an-sub {
          font-size: 13px;
          color: var(--nz-mute);
          margin-top: 4px;
        }
        .nzad-an-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .nzad-an-presets {
          display: inline-flex;
          background: var(--nz-soft);
          border-radius: 8px;
          padding: 3px;
        }
        .nzad-an-preset {
          border: 0;
          background: transparent;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--nz-mute);
          cursor: pointer;
          border-radius: 6px;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .nzad-an-preset:hover { color: var(--nz-ink); }
        .nzad-an-preset.is-active {
          background: white;
          color: var(--nz-ink);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .nzad-an-daterange {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid var(--nz-border);
          border-radius: 8px;
          padding: 6px 10px;
        }
        .nzad-an-daterange input {
          border: 0;
          outline: 0;
          font-size: 13px;
          font-family: inherit;
          color: var(--nz-ink);
          background: transparent;
          padding: 2px 0;
          width: 130px;
        }
        .nzad-an-dash { color: var(--nz-mute); font-size: 12px; }
        .nzad-an-refresh {
          border: 1px solid var(--nz-border);
          background: white;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          color: var(--nz-ink);
          transition: background 0.15s ease;
        }
        .nzad-an-refresh:hover { background: var(--nz-soft); }
        .nzad-an-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        /* KPI row */
        .nzad-an-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        @media (max-width: 1100px) { .nzad-an-kpis { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px)  { .nzad-an-kpis { grid-template-columns: repeat(2, 1fr); } }
        .nzad-an-kpi {
          background: white;
          border: 1px solid var(--nz-border);
          border-radius: 12px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
        }
        .nzad-an-kpi.is-highlight {
          background: linear-gradient(180deg, #fff 0%, #fff8f0 100%);
          border-color: rgba(230, 57, 70, 0.18);
        }
        .nzad-an-kpi-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--nz-mute);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .nzad-an-kpi-value {
          font-family: "Clash Display", "Manrope", system-ui, sans-serif;
          font-size: 30px;
          font-weight: 600;
          margin-top: 6px;
          letter-spacing: -0.02em;
          color: var(--nz-ink);
          line-height: 1.1;
        }
        .nzad-an-delta {
          margin-top: 10px;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
        }
        .nzad-an-delta.is-up { color: var(--nz-teal); }
        .nzad-an-delta.is-down { color: var(--nz-red); }
        .nzad-an-delta.is-flat { color: var(--nz-mute); }
        .nzad-an-delta.is-none { color: var(--nz-mute); opacity: 0.7; }
        .nzad-an-delta-arrow { font-size: 9px; }
        .nzad-an-delta-prev { color: var(--nz-mute); font-weight: 400; opacity: 0.7; }

        /* Cards grid */
        .nzad-an-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 900px) { .nzad-an-grid { grid-template-columns: 1fr; } }
        .nzad-an-card {
          background: white;
          border: 1px solid var(--nz-border);
          border-radius: 14px;
          padding: 22px 24px;
          min-height: 260px;
        }
        .nzad-an-card.is-wide { grid-column: span 2; }
        @media (max-width: 900px) { .nzad-an-card.is-wide { grid-column: span 1; } }
        .nzad-an-card-head { margin-bottom: 16px; }
        .nzad-an-card-title {
          margin: 0;
          font-family: "Clash Display", "Manrope", system-ui, sans-serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .nzad-an-card-sub {
          font-size: 12px;
          color: var(--nz-mute);
          margin-top: 3px;
        }

        /* Chart */
        .nzad-an-chart-wrap { position: relative; }
        .nzad-an-chart-legend {
          display: flex;
          gap: 14px;
          font-size: 12px;
          color: var(--nz-mute);
          margin-bottom: 8px;
        }
        .nzad-an-chart-key { display: inline-flex; align-items: center; gap: 6px; }
        .nzad-an-chart-key .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--nz-ink);
          display: inline-block;
        }
        .nzad-an-chart-key.is-pageviews .dot { background: var(--nz-red); }
        .nzad-an-chart-key.is-sessions .dot { background: var(--nz-teal); }
        .nzad-an-chart {
          width: 100%;
          height: auto;
          display: block;
          font-family: inherit;
        }
        .nzad-an-grid-line {
          stroke: var(--nz-border);
          stroke-width: 1;
          stroke-dasharray: 2 4;
        }
        .nzad-an-axis-label {
          font-size: 10px;
          fill: var(--nz-mute);
          font-family: inherit;
        }
        .nzad-an-area.is-pageviews {
          fill: rgba(230, 57, 70, 0.08);
        }
        .nzad-an-line {
          fill: none;
          stroke-width: 2;
          stroke-linejoin: round;
          stroke-linecap: round;
        }
        .nzad-an-line.is-pageviews { stroke: var(--nz-red); }
        .nzad-an-line.is-sessions { stroke: var(--nz-teal); }
        .nzad-an-cursor {
          stroke: var(--nz-border-strong);
          stroke-width: 1;
          stroke-dasharray: 3 3;
        }
        .nzad-an-dot {
          stroke: white;
          stroke-width: 2;
        }
        .nzad-an-dot.is-pageviews { fill: var(--nz-red); }
        .nzad-an-dot.is-sessions { fill: var(--nz-teal); }
        .nzad-an-tooltip {
          position: absolute;
          top: 24px;
          transform: translateX(-50%);
          background: var(--nz-ink);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        .nzad-an-tooltip-date {
          font-weight: 600;
          margin-bottom: 4px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
        .nzad-an-tooltip-row {
          display: flex;
          align-items: center;
          gap: 6px;
          line-height: 1.5;
        }
        .nzad-an-tooltip-row strong {
          margin-left: auto;
          padding-left: 12px;
          font-variant-numeric: tabular-nums;
        }
        .nzad-an-tooltip-row .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
        .nzad-an-tooltip-row .dot.is-pageviews { background: var(--nz-red); }
        .nzad-an-tooltip-row .dot.is-sessions { background: var(--nz-teal); }
        .nzad-an-tooltip-row .dot.is-uv { background: white; }

        /* Bar lists */
        .nzad-an-bars { display: flex; flex-direction: column; gap: 8px; }
        .nzad-an-bar-row {
          display: grid;
          grid-template-columns: minmax(0, 200px) 1fr auto;
          gap: 12px;
          align-items: center;
          font-size: 13px;
        }
        .nzad-an-bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .nzad-an-bar-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nzad-an-flag { font-size: 16px; line-height: 1; }
        .nzad-an-source-icon, .nzad-an-event-icon {
          color: var(--nz-mute);
          font-size: 13px;
          width: 16px;
          text-align: center;
          display: inline-block;
        }
        .nzad-an-bar-track {
          background: var(--nz-soft);
          border-radius: 4px;
          height: 8px;
          overflow: hidden;
        }
        .nzad-an-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .nzad-an-bar-value {
          text-align: right;
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          min-width: 80px;
        }
        .nzad-an-bar-value strong { font-weight: 600; }
        .nzad-an-bar-pct {
          margin-left: 6px;
          color: var(--nz-mute);
          font-size: 11px;
        }
        .nzad-an-bars-foot {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--nz-border);
          font-size: 12px;
          color: var(--nz-mute);
        }
        .nzad-an-bars-foot strong { color: var(--nz-ink); font-weight: 600; }
        .nzad-an-foot-note { margin-left: 6px; }
        .nzad-an-foot-note code {
          background: var(--nz-soft);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 10px;
        }

        /* Empty / skeleton / error */
        .nzad-an-empty {
          text-align: center;
          padding: 28px 16px;
          color: var(--nz-mute);
        }
        .nzad-an-empty-icon {
          font-size: 28px;
          opacity: 0.4;
          margin-bottom: 6px;
        }
        .nzad-an-empty-msg {
          font-size: 14px;
          font-weight: 500;
          color: var(--nz-ink);
        }
        .nzad-an-empty-hint {
          font-size: 12px;
          margin-top: 6px;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
        }
        .nzad-an-skel {
          background: linear-gradient(90deg, var(--nz-soft) 0%, var(--nz-border) 50%, var(--nz-soft) 100%);
          background-size: 200% 100%;
          animation: nzad-shimmer 1.4s linear infinite;
          border-radius: 4px;
        }
        .nzad-an-skel-text { display: block; height: 28px; width: 60%; }
        .nzad-an-skel-label { width: 120px; height: 14px; }
        .nzad-an-skel-bar { height: 8px; }
        .nzad-an-skel-value { width: 60px; height: 14px; margin-left: auto; }
        .nzad-an-skel-chart { height: 240px; border-radius: 8px; }
        .nzad-an-bar-row.is-skel { opacity: 0.6; }
        @keyframes nzad-shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        .nzad-an-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 18px 22px;
          color: #991b1b;
        }
        .nzad-an-error strong { font-size: 14px; }
        .nzad-an-error-msg {
          font-size: 13px;
          margin-top: 6px;
          font-family: ui-monospace, Menlo, monospace;
          background: rgba(0, 0, 0, 0.05);
          padding: 8px 10px;
          border-radius: 6px;
        }
        .nzad-an-error-hint {
          font-size: 12px;
          margin-top: 10px;
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// HEADER — title + date range controls + refresh
// =============================================================================

function Header({
  preset,
  start,
  end,
  loading,
  lastFetchAt,
  onPreset,
  onStartChange,
  onEndChange,
  onRefresh,
}) {
  return (
    <div className="nzad-an-header">
      <div>
        <h1 className="nzad-an-title">Analytics</h1>
        <div className="nzad-an-sub">
          Proprietary first-party tracking · No GA, no Mixpanel · Data lives in your Postgres
        </div>
      </div>

      <div className="nzad-an-controls">
        <div className="nzad-an-presets" role="tablist">
          {[
            ["today", "Today"],
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["90d", "90 days"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`nzad-an-preset ${preset === k ? "is-active" : ""}`}
              onClick={() => onPreset(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="nzad-an-daterange">
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => onStartChange(e.target.value)}
            aria-label="Start date"
          />
          <span className="nzad-an-dash">→</span>
          <input
            type="date"
            value={end}
            min={start}
            max={toISODate(todayUTC())}
            onChange={(e) => onEndChange(e.target.value)}
            aria-label="End date"
          />
        </div>

        <button
          type="button"
          className="nzad-an-refresh"
          onClick={onRefresh}
          disabled={loading}
          title={lastFetchAt ? `Last refreshed ${lastFetchAt.toLocaleTimeString()}` : "Refresh"}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

function timeseriesSubtitle(start, end) {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const days = Math.round((e - s) / (24 * 3600 * 1000)) + 1;
  return `${days} day${days === 1 ? "" : "s"}`;
}

// =============================================================================
// KPI ROW — six cards with previous-period deltas
// =============================================================================

function KpiRow({ data, loading }) {
  const curr = data?.current;
  const prev = data?.previous;

  const kpis = [
    { key: "sessions", label: "Sessions", value: curr?.sessions, prev: prev?.sessions, fmt: fmtInt },
    {
      key: "uniqueVisitors",
      label: "Unique visitors",
      value: curr?.uniqueVisitors,
      prev: prev?.uniqueVisitors,
      fmt: fmtInt,
    },
    {
      key: "pageviews",
      label: "Pageviews",
      value: curr?.pageviews,
      prev: prev?.pageviews,
      fmt: fmtInt,
    },
    {
      key: "bookings",
      label: "Bookings",
      value: curr?.bookings,
      prev: prev?.bookings,
      fmt: fmtInt,
      highlight: true,
    },
    {
      key: "conversionRate",
      label: "Conversion",
      value: curr?.conversionRate,
      prev: prev?.conversionRate,
      fmt: fmtPct,
      tip: "Bookings ÷ sessions",
    },
    {
      key: "avgPagesPerSession",
      label: "Pages / session",
      value: curr?.avgPagesPerSession,
      prev: prev?.avgPagesPerSession,
      fmt: fmtDec,
    },
  ];

  return (
    <div className="nzad-an-kpis">
      {kpis.map((k) => (
        <Kpi
          key={k.key}
          label={k.label}
          value={k.value}
          prev={k.prev}
          fmt={k.fmt}
          loading={loading && !data}
          highlight={k.highlight}
          tip={k.tip}
        />
      ))}
    </div>
  );
}

function Kpi({ label, value, prev, fmt, loading, highlight, tip }) {
  const delta = pctDelta(value, prev);
  return (
    <div className={`nzad-an-kpi ${highlight ? "is-highlight" : ""}`} title={tip || ""}>
      <div className="nzad-an-kpi-label">{label}</div>
      <div className="nzad-an-kpi-value">
        {loading ? <span className="nzad-an-skel nzad-an-skel-text" /> : fmt(value || 0)}
      </div>
      <DeltaPill delta={delta} fmt={fmt} prev={prev} />
    </div>
  );
}

function DeltaPill({ delta, fmt, prev }) {
  if (!delta || delta.direction === "none") {
    return <div className="nzad-an-delta is-none">vs prev: —</div>;
  }
  const sign = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "•";
  const cls =
    delta.direction === "up"
      ? "is-up"
      : delta.direction === "down"
      ? "is-down"
      : "is-flat";
  const v = Math.abs(delta.value);
  return (
    <div className={`nzad-an-delta ${cls}`}>
      <span className="nzad-an-delta-arrow">{sign}</span>
      <span>{v.toFixed(1)}%</span>
      <span className="nzad-an-delta-prev">vs {fmt(prev)}</span>
    </div>
  );
}

// =============================================================================
// CARD — generic wrapper
// =============================================================================

function Card({ title, subtitle, span, children }) {
  return (
    <section className={`nzad-an-card ${span === 2 ? "is-wide" : ""}`}>
      <header className="nzad-an-card-head">
        <h3 className="nzad-an-card-title">{title}</h3>
        {subtitle && <div className="nzad-an-card-sub">{subtitle}</div>}
      </header>
      <div className="nzad-an-card-body">{children}</div>
    </section>
  );
}

// =============================================================================
// TIMESERIES CHART — single SVG line chart, sessions + pageviews
// =============================================================================

function TimeseriesChart({ points, loading }) {
  // Hover state — which x-index is being inspected
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (loading && !points) {
    return <div className="nzad-an-skel-chart" />;
  }

  if (!points || points.length === 0) {
    return <Empty message="No data for this range yet" />;
  }

  // Geometry
  const W = 720;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxV = Math.max(
    1,
    ...points.map((p) => Math.max(p.pageviews || 0, p.sessions || 0))
  );
  // Round the y-max to a "nice" number for readable gridlines
  const niceMax = niceCeil(maxV);

  const x = (i) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const linePath = (key) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key] || 0)}`).join(" ");
  const areaPath = (key) =>
    `M ${x(0)} ${y(0)} ` +
    points.map((p, i) => `L ${x(i)} ${y(p[key] || 0)}`).join(" ") +
    ` L ${x(points.length - 1)} ${y(0)} Z`;

  // Y-axis gridlines: 4 evenly spaced
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    v: niceMax * t,
    y: PAD.top + innerH - t * innerH,
  }));

  // X-axis labels: show ~5 ticks max
  const xLabelEvery = Math.max(1, Math.ceil(points.length / 6));

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / innerW;
    const i = Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1))));
    setHoverIdx(i);
  };

  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="nzad-an-chart-wrap">
      <div className="nzad-an-chart-legend">
        <span className="nzad-an-chart-key is-pageviews">
          <span className="dot" /> Pageviews
        </span>
        <span className="nzad-an-chart-key is-sessions">
          <span className="dot" /> Sessions
        </span>
      </div>

      <svg
        ref={svgRef}
        className="nzad-an-chart"
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Gridlines */}
        {gridYs.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={g.y}
              y2={g.y}
              className="nzad-an-grid-line"
            />
            <text x={PAD.left - 8} y={g.y + 4} className="nzad-an-axis-label" textAnchor="end">
              {fmtInt(g.v)}
            </text>
          </g>
        ))}

        {/* Pageviews area + line */}
        <path d={areaPath("pageviews")} className="nzad-an-area is-pageviews" />
        <path d={linePath("pageviews")} className="nzad-an-line is-pageviews" />

        {/* Sessions line on top */}
        <path d={linePath("sessions")} className="nzad-an-line is-sessions" />

        {/* X-axis date labels */}
        {points.map((p, i) =>
          i % xLabelEvery === 0 || i === points.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              className="nzad-an-axis-label"
              textAnchor="middle"
            >
              {shortDate(p.date)}
            </text>
          ) : null
        )}

        {/* Hover crosshair + dots */}
        {hovered && (
          <>
            <line
              x1={x(hoverIdx)}
              x2={x(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="nzad-an-cursor"
            />
            <circle
              cx={x(hoverIdx)}
              cy={y(hovered.pageviews || 0)}
              r="4"
              className="nzad-an-dot is-pageviews"
            />
            <circle
              cx={x(hoverIdx)}
              cy={y(hovered.sessions || 0)}
              r="4"
              className="nzad-an-dot is-sessions"
            />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="nzad-an-tooltip"
          style={{ left: `${(x(hoverIdx) / W) * 100}%` }}
        >
          <div className="nzad-an-tooltip-date">{longDate(hovered.date)}</div>
          <div className="nzad-an-tooltip-row">
            <span className="dot is-pageviews" /> Pageviews
            <strong>{fmtInt(hovered.pageviews)}</strong>
          </div>
          <div className="nzad-an-tooltip-row">
            <span className="dot is-sessions" /> Sessions
            <strong>{fmtInt(hovered.sessions)}</strong>
          </div>
          <div className="nzad-an-tooltip-row">
            <span className="dot is-uv" /> Unique
            <strong>{fmtInt(hovered.uniqueVisitors)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// Round up to a clean axis max (1, 2, 2.5, 5, 10, 20, 25, 50, 100, …)
function niceCeil(v) {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const norm = v / base;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 2.5) nice = 2.5;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

function shortDate(iso) {
  // YYYY-MM-DD → "May 27"
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function longDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// =============================================================================
// BAR LIST — generic component used by geo / sources / pages / events
// =============================================================================

function BarRow({ leading, label, value, percentage, accent }) {
  return (
    <div className="nzad-an-bar-row">
      <div className="nzad-an-bar-label">
        {leading}
        <span className="nzad-an-bar-text" title={label}>
          {label}
        </span>
      </div>
      <div className="nzad-an-bar-track">
        <div
          className="nzad-an-bar-fill"
          style={{
            width: `${Math.max(2, Math.min(100, percentage || 0))}%`,
            background: accent || "var(--nz-red, #E63946)",
          }}
        />
      </div>
      <div className="nzad-an-bar-value">
        <strong>{fmtInt(value)}</strong>
        {percentage != null && <span className="nzad-an-bar-pct">{percentage.toFixed(1)}%</span>}
      </div>
    </div>
  );
}

// =============================================================================
// SOURCES LIST
// =============================================================================

function SourcesList({ rows, total, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No traffic data for this range" />;

  // Sort by sessions desc, keep top 10
  const display = rows.slice(0, 10);
  return (
    <div className="nzad-an-bars">
      {display.map((r) => (
        <BarRow
          key={r.src}
          leading={<span className="nzad-an-source-icon">{sourceIcon(r.src)}</span>}
          label={sourceLabel(r.src)}
          value={r.sessions}
          percentage={r.percentage}
          accent={sourceColor(r.src)}
        />
      ))}
      {total != null && (
        <div className="nzad-an-bars-foot">
          Total: <strong>{fmtInt(total)}</strong> sessions
        </div>
      )}
    </div>
  );
}

// Subtle accent color per source family so the bars carry information at a glance
function sourceColor(src) {
  if (src === "direct" || src === "internal") return "#16161A";
  if (["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu", "ecosia"].includes(src))
    return "#1B8A5A";
  if (
    ["facebook", "instagram", "twitter", "linkedin", "tiktok", "reddit", "pinterest", "snapchat", "youtube", "threads"].includes(
      src
    )
  )
    return "#E63946";
  if (["whatsapp", "telegram", "messenger"].includes(src)) return "#25D366";
  if (src === "email") return "#7c5ce6";
  return "#9ca3af";
}

function sourceIcon(src) {
  // Tiny inline glyph — just enough to scan at a glance
  if (src === "direct") return "•";
  if (src === "internal") return "↻";
  if (src === "email") return "✉";
  if (["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu", "ecosia"].includes(src))
    return "⌕";
  return "→";
}

// =============================================================================
// GEO LIST
// =============================================================================

function GeoList({ rows, total, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No geo data yet" />;

  const display = rows.slice(0, 10);
  return (
    <div className="nzad-an-bars">
      {display.map((r) => (
        <BarRow
          key={r.country}
          leading={<span className="nzad-an-flag">{flagFor(r.country)}</span>}
          label={countryName(r.country)}
          value={r.sessions}
          percentage={r.percentage}
          accent="#1B8A5A"
        />
      ))}
      {total != null && (
        <div className="nzad-an-bars-foot">
          Total: <strong>{fmtInt(total)}</strong> sessions
          {rows.length > 0 && rows[0].country === "unknown" && rows[0].percentage > 50 && (
            <span className="nzad-an-foot-note">
              · Country data missing — see <code>CF-IPCountry</code> header check
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PAGES LIST
// =============================================================================

function PagesList({ rows, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No pageviews yet" />;

  // Compute percentages relative to top page so the bars communicate magnitude
  const max = Math.max(...rows.map((r) => r.pageviews || 0));
  const display = rows.slice(0, 12);

  return (
    <div className="nzad-an-bars">
      {display.map((r) => (
        <BarRow
          key={r.path}
          leading={null}
          label={r.path}
          value={r.pageviews}
          percentage={max > 0 ? (r.pageviews / max) * 100 : 0}
          accent="#16161A"
        />
      ))}
    </div>
  );
}

// =============================================================================
// EVENTS LIST
// =============================================================================

function EventsList({ rows, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) {
    return (
      <Empty
        message="No custom events recorded yet"
        hint="Events are fired from the frontend via trackEvent() — e.g. WhatsApp button clicks. Wire trackEvent into the CTAs and they'll appear here."
      />
    );
  }

  const max = Math.max(...rows.map((r) => r.count || 0));
  return (
    <div className="nzad-an-bars">
      {rows.map((r) => (
        <BarRow
          key={r.type}
          leading={<span className="nzad-an-event-icon">{eventIcon(r.type)}</span>}
          label={eventLabel(r.type)}
          value={r.count}
          percentage={max > 0 ? (r.count / max) * 100 : 0}
          accent={eventColor(r.type)}
        />
      ))}
    </div>
  );
}

function eventIcon(type) {
  if (type === "WHATSAPP_CLICK") return "💬";
  if (type === "BOOKING_CTA_CLICK") return "🛏";
  if (type === "BOOKING_STARTED") return "→";
  if (type === "BOOKING_COMPLETED") return "✓";
  if (type === "HOTEL_VIEW") return "🏨";
  if (type === "SIGNUP") return "🙋";
  if (type === "LOGIN") return "🔑";
  if (type === "SEARCH") return "⌕";
  return "•";
}

function eventColor(type) {
  if (type === "WHATSAPP_CLICK") return "#25D366";
  if (type === "BOOKING_CTA_CLICK" || type === "BOOKING_COMPLETED") return "#1B8A5A";
  if (type === "BOOKING_STARTED") return "#E63946";
  return "#16161A";
}

// =============================================================================
// SMALL UTILS — Empty, Skeleton, Error
// =============================================================================

function Empty({ message, hint }) {
  return (
    <div className="nzad-an-empty">
      <div className="nzad-an-empty-icon">∅</div>
      <div className="nzad-an-empty-msg">{message}</div>
      {hint && <div className="nzad-an-empty-hint">{hint}</div>}
    </div>
  );
}

function SkelList() {
  return (
    <div className="nzad-an-bars">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="nzad-an-bar-row is-skel">
          <div className="nzad-an-skel nzad-an-skel-label" />
          <div className="nzad-an-skel nzad-an-skel-bar" />
          <div className="nzad-an-skel nzad-an-skel-value" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="nzad-an-error">
      <strong>Couldn't load analytics.</strong>
      <div className="nzad-an-error-msg">{message}</div>
      <div className="nzad-an-error-hint">
        If this says "401 Unauthorized", your admin session may have expired. Try logging out and
        back in.
      </div>
    </div>
  );
}

// =============================================================================
// Styles are inlined at the bottom of the AnalyticsPanel return — see above.
// Single <style jsx> block, in keeping with the codebase rule (memory #11).
// =============================================================================
