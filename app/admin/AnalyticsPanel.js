// =============================================================================
// Nzzor — Analytics Admin Panel (Bundle 2 v2 — information-dense)
// =============================================================================
// Reads from the six endpoints shipped in Bundle 1:
//   /api/admin/analytics/{overview, timeseries, sources, geo, pages, events}
//
// All endpoints accept ?start=YYYY-MM-DD&end=YYYY-MM-DD. The date-range
// controls drive the whole panel — change the range, every card re-fetches.
//
// IMPORTANT — design lessons from v1:
//   - All styles are INLINE on the elements themselves. No <style jsx>.
//     v1 used styled-jsx and the descendant selectors silently failed to
//     apply at runtime, which made the page look like a broken pile of
//     stacked text. Inline styles cannot have that failure mode.
//   - Design direction: Datadog/Vercel/Plausible — small, dense, scannable.
//     6 KPI cards in one row, full chart, then 2x2 grid of detail cards.
//   - Empty states are first-class — they don't look broken.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// -----------------------------------------------------------------------------
// Design tokens — single source of truth so every visual rule is consistent.
// Kept as a plain object (not CSS vars) because we use inline styles only.
// -----------------------------------------------------------------------------

const T = {
  ink: "#16161A",
  cream: "#FAF8F4",
  bg: "#F7F6F2",
  red: "#E63946",
  teal: "#1B8A5A",
  whatsappGreen: "#25D366",
  white: "#FFFFFF",
  border: "rgba(22, 22, 26, 0.10)",
  borderStrong: "rgba(22, 22, 26, 0.18)",
  borderSoft: "rgba(22, 22, 26, 0.06)",
  mute: "rgba(22, 22, 26, 0.55)",
  muteSoft: "rgba(22, 22, 26, 0.40)",
  soft: "rgba(22, 22, 26, 0.04)",
  redSoft: "rgba(230, 57, 70, 0.18)",
  redBg: "linear-gradient(180deg, #fff 0%, #FFF5F5 100%)",
};

// -----------------------------------------------------------------------------
// Date helpers — UTC throughout so the API receives YYYY-MM-DD that match
// the bucket boundaries it expects.
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
// Number formatting — stable across server/client
// -----------------------------------------------------------------------------

const numFmt = new Intl.NumberFormat("en-US");
const fmtInt = (n) => numFmt.format(Math.round(n || 0));
const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;
const fmtDec = (n) => (n || 0).toFixed(2);

function pctDelta(curr, prev) {
  if (prev == null || prev === 0) return { value: null, direction: "none" };
  const v = ((curr - prev) / prev) * 100;
  if (Math.abs(v) < 0.5) return { value: v, direction: "flat" };
  return { value: v, direction: v > 0 ? "up" : "down" };
}

// -----------------------------------------------------------------------------
// Country code → flag emoji. Regional indicator characters at 0x1F1E6+offset.
// -----------------------------------------------------------------------------

function flagFor(country) {
  if (!country || country.length !== 2 || country === "unknown") return "🌍";
  const cc = country.toUpperCase();
  const a = cc.charCodeAt(0);
  const b = cc.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🌍";
  return String.fromCodePoint(0x1f1e6 + (a - 65), 0x1f1e6 + (b - 65));
}

const COUNTRY_NAMES = {
  DZ: "Algeria", FR: "France", US: "United States", GB: "United Kingdom",
  CA: "Canada", DE: "Germany", ES: "Spain", IT: "Italy", TN: "Tunisia",
  MA: "Morocco", EG: "Egypt", TR: "Turkey", SA: "Saudi Arabia", AE: "UAE",
  QA: "Qatar", KW: "Kuwait", CN: "China", JP: "Japan", AU: "Australia",
  BR: "Brazil", MX: "Mexico", RU: "Russia", NL: "Netherlands", BE: "Belgium",
  CH: "Switzerland", SE: "Sweden", NO: "Norway", PT: "Portugal", GR: "Greece",
  IL: "Israel", IN: "India", PK: "Pakistan", ID: "Indonesia", MY: "Malaysia",
  TH: "Thailand", VN: "Vietnam", PH: "Philippines", NG: "Nigeria", ZA: "South Africa",
  KE: "Kenya", SN: "Senegal", LY: "Libya", JO: "Jordan", LB: "Lebanon",
};

const countryName = (code) =>
  !code || code === "unknown" ? "Unknown" : COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();

const SOURCE_LABELS = {
  direct: "Direct", internal: "Internal nav", google: "Google", bing: "Bing",
  yahoo: "Yahoo", duckduckgo: "DuckDuckGo", yandex: "Yandex", baidu: "Baidu",
  ecosia: "Ecosia", facebook: "Facebook", instagram: "Instagram",
  twitter: "Twitter / X", linkedin: "LinkedIn", tiktok: "TikTok",
  reddit: "Reddit", pinterest: "Pinterest", snapchat: "Snapchat",
  youtube: "YouTube", threads: "Threads", whatsapp: "WhatsApp",
  telegram: "Telegram", messenger: "Messenger", email: "Email", other: "Other",
};
const sourceLabel = (s) => SOURCE_LABELS[s] || s || "Unknown";

const EVENT_LABELS = {
  WHATSAPP_CLICK: "WhatsApp click",
  BOOKING_CTA_CLICK: "Booking CTA",
  HOTEL_VIEW: "Hotel viewed",
  SIGNUP: "Sign-up",
  LOGIN: "Login",
  BOOKING_STARTED: "Booking started",
  BOOKING_COMPLETED: "Booking completed",
  SEARCH: "Search",
};
const eventLabel = (t) => EVENT_LABELS[t] || t;

function sourceColor(src) {
  if (src === "direct" || src === "internal") return T.ink;
  if (["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu", "ecosia"].includes(src)) return T.teal;
  if (["facebook", "instagram", "twitter", "linkedin", "tiktok", "reddit", "pinterest", "snapchat", "youtube", "threads"].includes(src)) return T.red;
  if (["whatsapp", "telegram", "messenger"].includes(src)) return T.whatsappGreen;
  if (src === "email") return "#7c5ce6";
  return "#9ca3af";
}

function sourceIcon(src) {
  if (src === "direct") return "•";
  if (src === "internal") return "↻";
  if (src === "email") return "✉";
  if (["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu", "ecosia"].includes(src)) return "⌕";
  return "→";
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
  if (type === "WHATSAPP_CLICK") return T.whatsappGreen;
  if (type === "BOOKING_CTA_CLICK" || type === "BOOKING_COMPLETED") return T.teal;
  if (type === "BOOKING_STARTED") return T.red;
  return T.ink;
}

// -----------------------------------------------------------------------------
// Auth — adminApi.js stores the JWT in localStorage under "nzzor_admin_token".
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
// MAIN
// =============================================================================

export default function AnalyticsPanel() {
  const [preset, setPreset] = useState("7d");
  const [start, setStart] = useState(() => toISODate(daysAgo(6)));
  const [end, setEnd] = useState(() => toISODate(todayUTC()));

  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [sources, setSources] = useState(null);
  const [geo, setGeo] = useState(null);
  const [pages, setPages] = useState(null);
  const [events, setEvents] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastFetchAt = useRef(null);

  const applyPreset = useCallback((p) => {
    setPreset(p);
    const today = todayUTC();
    let s;
    if (p === "today") s = today;
    else if (p === "7d") s = daysAgo(6);
    else if (p === "30d") s = daysAgo(29);
    else if (p === "90d") s = daysAgo(89);
    else return;
    setStart(toISODate(s));
    setEnd(toISODate(today));
  }, []);

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
        if (r.status === "fulfilled") setter(r.value);
        else {
          console.error(`[analytics] ${name} failed:`, r.reason?.message);
          setter({ data: null, _err: r.reason?.message || "fetch failed" });
        }
      });
      if (results.every((r) => r.status === "rejected")) {
        setError(results[0].reason?.message || "Failed to load analytics");
      }
      lastFetchAt.current = new Date();
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [start, end, refreshKey]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "20px 24px", color: T.ink, fontFamily: "inherit" }}>
      <Header
        preset={preset}
        start={start}
        end={end}
        loading={loading}
        lastFetchAt={lastFetchAt.current}
        onPreset={applyPreset}
        onStartChange={(v) => { setStart(v); setPreset("custom"); }}
        onEndChange={(v) => { setEnd(v); setPreset("custom"); }}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {error ? (
        <ErrorBanner message={error} />
      ) : (
        <>
          <KpiRow data={overview?.data} loading={loading} />

          <ChartCard
            title="Sessions over time"
            subtitle={timeseriesSubtitle(start, end)}
            points={timeseries?.data}
            loading={loading}
          />

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 12,
          }}>
            <DetailCard title="Traffic sources" subtitle="Where visitors come from">
              <SourcesList rows={sources?.data} total={sources?.total} loading={loading} />
            </DetailCard>

            <DetailCard title="Top countries" subtitle="By session count">
              <GeoList rows={geo?.data} total={geo?.total} loading={loading} />
            </DetailCard>

            <DetailCard title="Top pages" subtitle="By pageviews">
              <PagesList rows={pages?.data} loading={loading} />
            </DetailCard>

            <DetailCard title="Events" subtitle="Custom-tracked clicks">
              <EventsList rows={events?.data} loading={loading} />
            </DetailCard>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// HEADER — title + range controls + refresh
// =============================================================================

function Header({ preset, start, end, loading, lastFetchAt, onPreset, onStartChange, onEndChange, onRefresh }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      marginBottom: 18,
      flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          margin: 0,
          letterSpacing: "-0.01em",
          color: T.ink,
        }}>
          Analytics
        </h1>
        <p style={{
          fontSize: 11,
          color: T.mute,
          margin: "3px 0 0",
        }}>
          {rangeLabel(start, end)} · Proprietary first-party tracking
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{
          display: "inline-flex",
          background: T.white,
          border: `0.5px solid ${T.border}`,
          borderRadius: 6,
          padding: 2,
        }}>
          {[
            ["today", "Today"],
            ["7d", "7d"],
            ["30d", "30d"],
            ["90d", "90d"],
          ].map(([k, label]) => {
            const active = preset === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onPreset(k)}
                style={{
                  border: 0,
                  background: active ? T.ink : "transparent",
                  color: active ? T.white : T.mute,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: T.white,
          border: `0.5px solid ${T.border}`,
          borderRadius: 6,
          padding: "4px 8px",
        }}>
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => onStartChange(e.target.value)}
            style={{
              border: 0,
              outline: 0,
              fontSize: 11,
              fontFamily: "inherit",
              color: T.ink,
              background: "transparent",
              width: 110,
            }}
            aria-label="Start date"
          />
          <span style={{ color: T.muteSoft, fontSize: 10 }}>→</span>
          <input
            type="date"
            value={end}
            min={start}
            max={toISODate(todayUTC())}
            onChange={(e) => onEndChange(e.target.value)}
            style={{
              border: 0,
              outline: 0,
              fontSize: 11,
              fontFamily: "inherit",
              color: T.ink,
              background: "transparent",
              width: 110,
            }}
            aria-label="End date"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title={lastFetchAt ? `Last refreshed ${lastFetchAt.toLocaleTimeString()}` : "Refresh"}
          style={{
            border: `0.5px solid ${T.border}`,
            background: T.white,
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            color: T.ink,
          }}
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>
    </div>
  );
}

function rangeLabel(start, end) {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const days = Math.round((e - s) / (24 * 3600 * 1000)) + 1;
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(s)} — ${fmt(e)} · ${days} day${days === 1 ? "" : "s"}`;
}

function timeseriesSubtitle(start, end) {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const days = Math.round((e - s) / (24 * 3600 * 1000)) + 1;
  return `${days} day${days === 1 ? "" : "s"} · daily buckets`;
}

// =============================================================================
// KPI ROW — 6 cards in one row, dense
// =============================================================================

function KpiRow({ data, loading }) {
  const curr = data?.current;
  const prev = data?.previous;

  const kpis = [
    { key: "sessions", label: "Sessions", value: curr?.sessions, prev: prev?.sessions, fmt: fmtInt },
    { key: "uniqueVisitors", label: "Visitors", value: curr?.uniqueVisitors, prev: prev?.uniqueVisitors, fmt: fmtInt },
    { key: "pageviews", label: "Pageviews", value: curr?.pageviews, prev: prev?.pageviews, fmt: fmtInt },
    { key: "bookings", label: "Bookings", value: curr?.bookings, prev: prev?.bookings, fmt: fmtInt, highlight: true },
    { key: "conversionRate", label: "Conv. rate", value: curr?.conversionRate, prev: prev?.conversionRate, fmt: fmtPct },
    { key: "avgPagesPerSession", label: "Pages/sess.", value: curr?.avgPagesPerSession, prev: prev?.avgPagesPerSession, fmt: fmtDec },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 8,
      marginBottom: 14,
    }}>
      {kpis.map((k) => (
        <Kpi
          key={k.key}
          label={k.label}
          value={k.value}
          prev={k.prev}
          fmt={k.fmt}
          loading={loading && !curr}
          highlight={k.highlight}
        />
      ))}
    </div>
  );
}

function Kpi({ label, value, prev, fmt, loading, highlight }) {
  const delta = pctDelta(value, prev);
  return (
    <div style={{
      background: highlight ? T.redBg : T.white,
      border: `0.5px solid ${highlight ? "rgba(230, 57, 70, 0.25)" : T.border}`,
      borderRadius: 8,
      padding: "10px 12px",
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 500,
        color: T.mute,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 600,
        marginTop: 4,
        letterSpacing: "-0.02em",
        color: highlight ? T.red : T.ink,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {loading ? <Shimmer width="60%" height={22} /> : fmt(value || 0)}
      </div>
      <DeltaPill delta={delta} fmt={fmt} prev={prev} />
    </div>
  );
}

function DeltaPill({ delta, fmt, prev }) {
  if (!delta || delta.direction === "none") {
    return (
      <div style={{ fontSize: 10, color: T.muteSoft, marginTop: 4 }}>
        vs prev: —
      </div>
    );
  }
  const sign = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "•";
  const color = delta.direction === "up" ? T.teal : delta.direction === "down" ? T.red : T.mute;
  const v = Math.abs(delta.value);
  return (
    <div style={{
      fontSize: 10,
      color,
      marginTop: 4,
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontWeight: 500,
    }}>
      <span style={{ fontSize: 8 }}>{sign}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toFixed(1)}%</span>
      <span style={{ color: T.muteSoft, fontWeight: 400, marginLeft: 2 }}>
        vs {fmt(prev || 0)}
      </span>
    </div>
  );
}

// =============================================================================
// CHART CARD — sessions over time
// =============================================================================

function ChartCard({ title, subtitle, points, loading }) {
  return (
    <div style={{
      background: T.white,
      border: `0.5px solid ${T.border}`,
      borderRadius: 8,
      padding: "14px 16px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{title}</div>
          <div style={{ fontSize: 10, color: T.mute, marginTop: 1 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.mute }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 2, background: T.red }} />
            Pageviews
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 2, background: T.teal }} />
            Sessions
          </span>
        </div>
      </div>
      <TimeseriesChart points={points} loading={loading} />
    </div>
  );
}

function TimeseriesChart({ points, loading }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (loading && !points) {
    return <div style={{ height: 200, background: T.soft, borderRadius: 4 }} />;
  }
  if (!points || points.length === 0) {
    return <Empty message="No data for this range yet" tall />;
  }

  const W = 800;
  const H = 200;
  const PAD = { top: 12, right: 12, bottom: 24, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxV = Math.max(1, ...points.map((p) => Math.max(p.pageviews || 0, p.sessions || 0)));
  const niceMax = niceCeil(maxV);

  const x = (i) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const linePath = (key) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key] || 0)}`).join(" ");

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    v: niceMax * t,
    y: PAD.top + innerH - t * innerH,
  }));

  const xLabelEvery = Math.max(1, Math.ceil(points.length / 7));

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / innerW;
    const i = Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1))));
    setHoverIdx(i);
  };

  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ width: "100%", height: "auto", display: "block", fontFamily: "inherit" }}
      >
        {gridYs.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={g.y} y2={g.y}
              stroke={T.borderSoft} strokeWidth="0.5" strokeDasharray="2 3" />
            <text x={PAD.left - 6} y={g.y + 3} fontSize="9" fill={T.muteSoft} textAnchor="end">
              {fmtInt(g.v)}
            </text>
          </g>
        ))}

        <path d={linePath("pageviews")} fill="none" stroke={T.red} strokeWidth="1.75"
              strokeLinejoin="round" strokeLinecap="round" />
        <path d={linePath("sessions")} fill="none" stroke={T.teal} strokeWidth="1.75"
              strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) =>
          (i % xLabelEvery === 0 || i === points.length - 1) ? (
            <text key={i} x={x(i)} y={H - 6} fontSize="9" fill={T.muteSoft} textAnchor="middle">
              {shortDate(p.date)}
            </text>
          ) : null
        )}

        {hovered && (
          <>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={PAD.top + innerH}
              stroke={T.borderStrong} strokeWidth="0.75" strokeDasharray="2 3" />
            <circle cx={x(hoverIdx)} cy={y(hovered.pageviews || 0)} r="3.5"
              fill={T.red} stroke={T.white} strokeWidth="1.5" />
            <circle cx={x(hoverIdx)} cy={y(hovered.sessions || 0)} r="3.5"
              fill={T.teal} stroke={T.white} strokeWidth="1.5" />
          </>
        )}
      </svg>

      {hovered && (
        <div style={{
          position: "absolute",
          top: 12,
          left: `${(x(hoverIdx) / W) * 100}%`,
          transform: "translateX(-50%)",
          background: T.ink,
          color: T.white,
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 10,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          minWidth: 130,
        }}>
          <div style={{
            fontWeight: 600,
            paddingBottom: 4,
            marginBottom: 4,
            borderBottom: "0.5px solid rgba(255,255,255,0.15)",
          }}>
            {longDate(hovered.date)}
          </div>
          <TooltipRow color={T.red} label="Pageviews" value={fmtInt(hovered.pageviews)} />
          <TooltipRow color={T.teal} label="Sessions" value={fmtInt(hovered.sessions)} />
          <TooltipRow color="rgba(255,255,255,0.6)" label="Unique" value={fmtInt(hovered.uniqueVisitors)} />
        </div>
      )}
    </div>
  );
}

function TooltipRow({ color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1.5 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
      <strong style={{ marginLeft: "auto", paddingLeft: 12, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </strong>
    </div>
  );
}

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
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function longDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

// =============================================================================
// DETAIL CARDS — sources / geo / pages / events
// =============================================================================

function DetailCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: T.white,
      border: `0.5px solid ${T.border}`,
      borderRadius: 8,
      padding: "14px 16px",
      minHeight: 240,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: T.mute, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function BarRow({ leading, label, value, percentage, accent, valueExtra }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "120px 1fr 60px",
      gap: 8,
      alignItems: "center",
      fontSize: 11,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        {leading != null && (
          <span style={{ flexShrink: 0, width: 16, textAlign: "center", color: T.mute }}>
            {leading}
          </span>
        )}
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: T.ink,
        }} title={label}>
          {label}
        </span>
      </div>
      <div style={{
        background: T.soft,
        borderRadius: 3,
        height: 6,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.max(2, Math.min(100, percentage || 0))}%`,
          height: "100%",
          background: accent || T.ink,
          borderRadius: 3,
        }} />
      </div>
      <div style={{
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        color: T.ink,
      }}>
        <strong style={{ fontWeight: 600 }}>{fmtInt(value)}</strong>
        {valueExtra && (
          <span style={{ marginLeft: 4, color: T.muteSoft, fontSize: 10 }}>
            {valueExtra}
          </span>
        )}
      </div>
    </div>
  );
}

function SourcesList({ rows, total, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No traffic data yet" />;
  const display = rows.slice(0, 8);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {display.map((r) => (
        <BarRow
          key={r.src}
          leading={sourceIcon(r.src)}
          label={sourceLabel(r.src)}
          value={r.sessions}
          percentage={r.percentage}
          accent={sourceColor(r.src)}
          valueExtra={`${r.percentage?.toFixed(0)}%`}
        />
      ))}
      {total != null && (
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `0.5px solid ${T.border}`,
          fontSize: 10,
          color: T.mute,
        }}>
          Total: <strong style={{ color: T.ink, fontWeight: 600 }}>{fmtInt(total)}</strong> sessions
        </div>
      )}
    </div>
  );
}

function GeoList({ rows, total, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No geo data yet" />;
  const display = rows.slice(0, 8);
  const showCfHint = rows.length > 0 && rows[0].country === "unknown" && (rows[0].percentage || 0) > 50;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {display.map((r) => (
        <BarRow
          key={r.country}
          leading={<span style={{ fontSize: 14 }}>{flagFor(r.country)}</span>}
          label={countryName(r.country)}
          value={r.sessions}
          percentage={r.percentage}
          accent={T.teal}
          valueExtra={`${r.percentage?.toFixed(0)}%`}
        />
      ))}
      {total != null && (
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `0.5px solid ${T.border}`,
          fontSize: 10,
          color: T.mute,
        }}>
          Total: <strong style={{ color: T.ink, fontWeight: 600 }}>{fmtInt(total)}</strong> sessions
          {showCfHint && (
            <div style={{ marginTop: 4, color: T.muteSoft }}>
              Country missing — check <code style={{
                background: T.soft, padding: "1px 4px", borderRadius: 3, fontSize: 9
              }}>CF-IPCountry</code> header
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PagesList({ rows, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) return <Empty message="No pageviews yet" />;
  const max = Math.max(...rows.map((r) => r.pageviews || 0));
  const display = rows.slice(0, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {display.map((r) => (
        <BarRow
          key={r.path}
          leading={null}
          label={r.path}
          value={r.pageviews}
          percentage={max > 0 ? (r.pageviews / max) * 100 : 0}
          accent={T.ink}
        />
      ))}
    </div>
  );
}

function EventsList({ rows, loading }) {
  if (loading && !rows) return <SkelList />;
  if (!rows || rows.length === 0) {
    return (
      <Empty
        message="No custom events recorded yet"
        hint="Wire trackEvent() into your CTAs (WhatsApp button, Book button) and they'll show up here."
      />
    );
  }
  const max = Math.max(...rows.map((r) => r.count || 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map((r) => (
        <BarRow
          key={r.type}
          leading={<span style={{ fontSize: 12 }}>{eventIcon(r.type)}</span>}
          label={eventLabel(r.type)}
          value={r.count}
          percentage={max > 0 ? (r.count / max) * 100 : 0}
          accent={eventColor(r.type)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// STATE: empty / skeleton / error
// =============================================================================

function Empty({ message, hint, tall }) {
  return (
    <div style={{
      textAlign: "center",
      padding: tall ? "44px 16px" : "24px 16px",
      color: T.mute,
    }}>
      <div style={{ fontSize: 24, opacity: 0.35, marginBottom: 4 }}>∅</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.ink }}>{message}</div>
      {hint && (
        <div style={{
          fontSize: 11,
          marginTop: 6,
          maxWidth: 360,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.5,
          color: T.mute,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// Inline shimmer using just CSS — keyframes via @keyframes need a style tag,
// so we use plain opacity pulsing via style animations defined inline instead.
// Actually we cannot define @keyframes inline. We fall back to a static
// muted block — visually "loading-like" without animation.
function Shimmer({ width = "60%", height = 14 }) {
  return (
    <span style={{
      display: "inline-block",
      width,
      height,
      background: `linear-gradient(90deg, ${T.soft} 0%, ${T.border} 50%, ${T.soft} 100%)`,
      borderRadius: 3,
      verticalAlign: "middle",
    }} />
  );
}

function SkelList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 60px",
          gap: 8,
          alignItems: "center",
          opacity: 0.5,
        }}>
          <Shimmer width="80%" height={11} />
          <Shimmer width="100%" height={6} />
          <Shimmer width="100%" height={11} />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: 8,
      padding: "14px 18px",
      color: "#991B1B",
    }}>
      <strong style={{ fontSize: 13 }}>Couldn't load analytics.</strong>
      <div style={{
        fontSize: 11,
        marginTop: 6,
        fontFamily: "ui-monospace, Menlo, monospace",
        background: "rgba(0,0,0,0.05)",
        padding: "6px 8px",
        borderRadius: 4,
        wordBreak: "break-all",
      }}>
        {message}
      </div>
      <div style={{ fontSize: 11, marginTop: 8, opacity: 0.85 }}>
        If this says "401 Unauthorized", your admin session may have expired. Try logging out and back in.
      </div>
    </div>
  );
}
