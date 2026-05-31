"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  getToken, clearToken, adminLogin, adminMe, adminDashboard, adminToday,
  adminHotels, adminHotel, adminBookings, adminBookingDetail, adminUpdateBookingStatus,
  adminCreateHotel, adminUpdateHotel, adminDeleteHotel,
  adminAddRoom, adminUpdateRoom, adminDeleteRoom,
  adminAddPhoto, adminUploadPhoto, adminDeletePhoto, adminSetPrimaryPhoto,
  adminAddRoomPhoto, adminUploadRoomPhoto, adminDeleteRoomPhoto,
  adminHotelManagers, adminAddHotelManager, adminRemoveHotelManager, adminResetHotelManagerPassword,
  adminTags,
  adminUsers, adminUserDetail,
} from "../../lib/adminApi";
import AnalyticsPanel from "./AnalyticsPanel";

const fmt = (n) => Number(n || 0).toLocaleString("en") + " DZD";

// =============================================================================
// ROOT
// =============================================================================
export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    adminMe()
      .then((u) => {
        if (["ADMIN", "SUPER_ADMIN"].includes(u.role)) setUser(u);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <Splash />;
  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => { clearToken(); setUser(null); }} />;
}

// =============================================================================
// SPLASH
// =============================================================================
function Splash() {
  return (
    <div className="nzad-splash">
      <div className="nzad-logo-mark" />
      <span>Loading Nzzor Admin…</span>
      <style jsx>{`
        .nzad-splash {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          background: var(--ink); color: rgba(255,255,255,0.6); font-size: 14px;
        }
        .nzad-logo-mark { width: 36px; height: 36px; border-radius: 50%; background: var(--red); animation: blink 1.4s infinite; }
      `}</style>
    </div>
  );
}

// =============================================================================
// LOGIN
// =============================================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      const u = await adminLogin(email.trim(), password);
      onLogin(u);
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nzad-login">
      <div className="nzad-login-card">
        <div className="nzad-login-brand">
          <span className="nzad-logo-mark" />
          <div>
            <div className="nzad-login-name display">Nzzor</div>
            <div className="nzad-login-sub">Admin Dashboard</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="nzad-login-hint">Allouni Travel Agency staff only.</p>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="admin@nzzor.com" type="email" />

        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••••••" type="password" />

        {err && <div className="nzad-login-err">{err}</div>}

        <button className="nzad-login-btn" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <style jsx>{`
        .nzad-login {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: var(--ink); padding: 24px;
        }
        .nzad-login-card {
          width: 100%; max-width: 380px; background: #fff;
          border-radius: var(--r-lg); padding: 36px;
        }
        .nzad-login-brand { display: flex; align-items: center; gap: 11px; margin-bottom: 28px; }
        .nzad-logo-mark { width: 34px; height: 34px; border-radius: 50%; background: var(--red); flex-shrink: 0; position: relative; }
        .nzad-logo-mark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .nzad-login-name { font-size: 21px; font-weight: 600; letter-spacing: -0.02em; }
        .nzad-login-sub { font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: var(--gray-400); }
        .nzad-login-card h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
        .nzad-login-hint { font-size: 13px; color: var(--gray-400); margin-bottom: 24px; }
        .nzad-login-card label { display: block; font-size: 12px; font-weight: 700; color: var(--gray-400); margin-bottom: 6px; margin-top: 14px; }
        .nzad-login-card input {
          width: 100%; padding: 11px 14px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 14px; outline: none;
        }
        .nzad-login-card input:focus { border-color: var(--red); }
        .nzad-login-err {
          margin-top: 14px; padding: 10px 12px; background: var(--red-soft);
          color: var(--red-deep); border-radius: var(--r-sm); font-size: 13px; font-weight: 600;
        }
        .nzad-login-btn {
          width: 100%; margin-top: 22px; padding: 13px; background: var(--red);
          color: #fff; border: none; border-radius: var(--r-sm);
          font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .nzad-login-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}

// =============================================================================
// DASHBOARD SHELL
// =============================================================================
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="nzad-shell">
      <aside className="nzad-sidebar">
        <div className="nzad-side-brand">
          <span className="nzad-logo-mark" />
          <div>
            <div className="nzad-side-name display">Nzzor</div>
            <div className="nzad-side-sub">Admin</div>
          </div>
        </div>
        <nav>
          {[
            ["overview", "Overview"],
            ["analytics", "Analytics"],
            ["hotels", "Hotels"],
            ["bookings", "Bookings"],
            ["customers", "Customers"],
          ].map(([k, label]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="nzad-side-foot">
          <div className="nzad-side-user">
            <strong>{user.firstName || "Admin"}</strong>
            <span>{user.email}</span>
          </div>
          <button className="nzad-logout" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="nzad-main">
        {tab === "overview" && <Overview />}
        {tab === "analytics" && <AnalyticsPanel />}
        {tab === "hotels" && <HotelsManager />}
        {tab === "bookings" && <BookingsManager />}
        {tab === "customers" && <CustomersManager />}
      </main>

      <style jsx>{`
        .nzad-shell { display: flex; min-height: 100vh; background: var(--cream); align-items: flex-start; }
        .nzad-sidebar {
          width: 240px; flex-shrink: 0; background: var(--ink); color: #fff;
          display: flex; flex-direction: column; padding: 24px 16px;
          /* Sticky to viewport top so the sidebar stays visible as the
             admin scrolls through long content (booking lists, hotel
             managers). align-items: flex-start on the shell prevents
             grid/flex from stretching the aside vertically, which would
             defeat sticky. The 100vh height lets the inner nav fill
             the viewport; if the nav ever gets too tall it scrolls
             internally rather than pushing the foot off-screen. */
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .nzad-side-brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 28px; }
        .nzad-logo-mark { width: 32px; height: 32px; border-radius: 50%; background: var(--red); flex-shrink: 0; position: relative; }
        .nzad-logo-mark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .nzad-side-name { font-size: 19px; font-weight: 600; letter-spacing: -0.02em; }
        .nzad-side-sub { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: rgba(255,255,255,0.5); }
        .nzad-sidebar nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .nzad-sidebar nav button {
          text-align: left; padding: 11px 14px; border: none; background: transparent;
          color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 600;
          border-radius: var(--r-sm); cursor: pointer; font-family: inherit;
        }
        .nzad-sidebar nav button:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .nzad-sidebar nav button.on { background: var(--red); color: #fff; }
        .nzad-side-foot { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .nzad-side-user { padding: 0 8px 12px; }
        .nzad-side-user strong { display: block; font-size: 13px; }
        .nzad-side-user span { font-size: 11px; color: rgba(255,255,255,0.5); }
        .nzad-logout {
          width: 100%; padding: 9px; background: rgba(255,255,255,0.08);
          color: #fff; border: none; border-radius: var(--r-sm);
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .nzad-logout:hover { background: rgba(255,255,255,0.14); }
        .nzad-main { flex: 1; min-width: 0; padding: 32px 40px; overflow-x: clip; }
        @media (max-width: 720px) {
          .nzad-shell { flex-direction: column; align-items: stretch; }
          /* On mobile, the sidebar collapses to a horizontal bar at the top
             — sticky positioning would keep it pinned and waste vertical
             space. position: static + height: auto lets it scroll away
             naturally, which is the right pattern for mobile admin work. */
          .nzad-sidebar {
            width: 100%; flex-direction: row; flex-wrap: wrap; align-items: center; padding: 12px 16px;
            position: static; height: auto; overflow: visible;
          }
          .nzad-side-brand { padding: 0; }
          .nzad-sidebar nav { flex-direction: row; flex: 0; gap: 4px; }
          .nzad-side-foot { border: none; padding: 0; display: flex; align-items: center; gap: 8px; }
          .nzad-side-user { display: none; }
          .nzad-main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// OVERVIEW
// =============================================================================
function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminDashboard().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return <Loading />;

  return (
    <div>
      <PageHead title="Overview" subtitle="Your platform at a glance" />

      <TodayPanel />

      <OpsPanel />

      <div className="nzad-stats">
        <Stat label="Total bookings" value={data.bookings.total} />
        <Stat label="Bookings · last 7 days" value={data.bookings.last7Days} />
        <Stat label="Revenue · last 30 days" value={fmt(data.revenue.last30Days)} />
        <Stat label="Active hotels" value={data.hotels.total} />
      </div>

      <div className="nzad-panel">
        <h3>Bookings by status</h3>
        <div className="nzad-status-row">
          {Object.entries(data.bookings.byStatus || {}).length === 0 && (
            <span className="nzad-empty-inline">No bookings yet.</span>
          )}
          {Object.entries(data.bookings.byStatus || {}).map(([s, n]) => (
            <div className="nzad-status-chip" key={s}>
              <strong>{n}</strong> <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="nzad-panel">
        <h3>Top hotels by revenue</h3>
        {(!data.topHotels || data.topHotels.length === 0) ? (
          <span className="nzad-empty-inline">No bookings yet — top hotels will appear here.</span>
        ) : (
          <table className="nzad-table">
            <thead><tr><th>Hotel</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.topHotels.map((h, i) => (
                <tr key={i}>
                  <td>{h.hotel}</td>
                  <td>{h.bookings}</td>
                  <td>{fmt(h.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .nzad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .nzad-status-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .nzad-status-chip {
          padding: 10px 16px; background: var(--cream); border: 1px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px;
        }
        .nzad-status-chip strong { font-size: 16px; font-weight: 800; }
        .nzad-status-chip span { color: var(--gray-400); font-weight: 600; font-size: 11px; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        @media (max-width: 720px) { .nzad-stats { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// TODAY PANEL — what happened on the platform today, in Algiers local time
// -----------------------------------------------------------------------------
// Item #7 from the polish queue. Shows four count chips (created / confirmed
// / cancelled / revenue locked in today) plus a short recent-events feed so
// the Allouni team can scan the day's activity without opening the full
// bookings list.
//
// We poll every 60s — no websocket plumbing for an admin-only surface that's
// only viewed during business hours. Simpler is fine here.
// =============================================================================
function TodayPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      adminToday()
        .then((d) => { if (!cancelled) setData(d); })
        .catch((e) => { if (!cancelled) setErr(e.message); });
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return null; // silent loading — overview shows other things alongside

  const c = data.counts || {};
  const hasActivity = (c.created || 0) + (c.confirmed || 0) + (c.cancelled || 0) > 0;

  return (
    <div className="nzad-panel nzad-today">
      <div className="nzad-today-head">
        <h3>Today</h3>
        <span className="nzad-today-sub">Algiers local time</span>
      </div>

      <div className="nzad-today-counts">
        <TodayChip label="New bookings" value={c.created || 0} tone="ink" />
        <TodayChip label="Confirmed" value={c.confirmed || 0} tone="teal" />
        <TodayChip label="Cancelled / rejected" value={c.cancelled || 0} tone="red" />
        <TodayChip label="Revenue confirmed" value={fmt(c.revenueConfirmed || 0)} tone="ink" />
      </div>

      {!hasActivity && (
        <span className="nzad-empty-inline">No activity yet today. New events will appear here.</span>
      )}

      {data.events && data.events.length > 0 && (
        <ul className="nzad-today-feed">
          {data.events.map((ev) => (
            <li key={ev.id} className={`nzad-today-row k-${ev.event?.kind || "created"}`}>
              <span className="nzad-today-time">
                {ev.event?.at ? formatTimeAlgiers(ev.event.at) : "—"}
              </span>
              <span className="nzad-today-kind">{ev.event?.kind || "created"}</span>
              <span className="nzad-today-ref"><strong>{ev.reference}</strong></span>
              <span className="nzad-today-meta">
                {ev.hotel?.name || "—"} · {ev.guest?.firstName} {ev.guest?.lastName}
              </span>
              <span className="nzad-today-amt">{fmt(ev.pricing?.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .nzad-today { margin-bottom: 20px; }
        .nzad-today-head {
          display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px;
        }
        .nzad-today-head h3 { margin: 0; }
        .nzad-today-sub {
          font-size: 11.5px; color: var(--gray-400); font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .nzad-today-counts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
          margin-bottom: 16px;
        }
        .nzad-today-feed {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 4px;
          max-height: 320px; overflow-y: auto;
        }
        .nzad-today-row {
          display: grid;
          grid-template-columns: 60px 90px 110px 1fr auto;
          gap: 10px; align-items: center;
          padding: 8px 10px; border-radius: var(--r-sm);
          background: var(--cream);
          font-size: 13px;
        }
        .nzad-today-time {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 12px; color: var(--gray-400); font-weight: 600;
        }
        .nzad-today-kind {
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 980px;
          text-transform: uppercase; letter-spacing: 0.04em;
          text-align: center;
        }
        .k-created   .nzad-today-kind { background: rgba(22,22,26,0.07); color: var(--ink); }
        .k-confirmed .nzad-today-kind { background: var(--teal-soft); color: var(--teal); }
        .k-cancelled .nzad-today-kind { background: var(--red-soft); color: var(--red-deep); }
        .k-rejected  .nzad-today-kind { background: var(--red-soft); color: var(--red-deep); }
        .nzad-today-ref strong { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12.5px; }
        .nzad-today-meta { color: var(--gray-400); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nzad-today-amt { font-weight: 700; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        @media (max-width: 720px) {
          .nzad-today-counts { grid-template-columns: 1fr 1fr; }
          .nzad-today-row {
            grid-template-columns: 60px 80px 1fr auto;
          }
          .nzad-today-meta { display: none; }
        }
      `}</style>
    </div>
  );
}

// Small chip used in the Today counts grid.
function TodayChip({ label, value, tone = "ink" }) {
  return (
    <div className={`nzad-today-chip tone-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <style jsx>{`
        .nzad-today-chip {
          padding: 14px 18px; background: var(--cream);
          border: 1px solid var(--gray-200);
          border-radius: var(--r-md);
          display: flex; flex-direction: column; gap: 4px;
        }
        .nzad-today-chip.tone-teal { border-left: 3px solid var(--teal); }
        .nzad-today-chip.tone-red  { border-left: 3px solid var(--red); }
        .nzad-today-chip.tone-ink  { border-left: 3px solid var(--ink); }
        .nzad-today-chip strong { font-size: 22px; font-weight: 800; color: var(--ink); }
        .nzad-today-chip span {
          font-size: 11.5px; color: var(--gray-400); font-weight: 600;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}

// Format an ISO timestamp as "HH:MM" in Algiers local time. Used by the
// Today feed so the team sees times that match their wall clock.
function formatTimeAlgiers(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      timeZone: "Africa/Algiers",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// =============================================================================
// OPS PANEL — pending bookings sorted by how long they've been waiting
// 2-minute "warn" (yellow) / 5-minute "urgent" (red)
// Click hotel phone to call.
// =============================================================================
function OpsPanel() {
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0); // forces re-render every minute to update wait times

  const load = useCallback(() => {
    adminBookings({ status: "PENDING", limit: 50 })
      .then((j) => setPending(j.data || []))
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  // refresh from server every 30s; force a re-render every 30s so the
  // "X min ago" labels stay current even if no data changes
  useEffect(() => {
    const refreshT = setInterval(load, 30_000);
    const tickT = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { clearInterval(refreshT); clearInterval(tickT); };
  }, [load]);

  if (err) return <ErrorBox msg={err} />;
  if (!pending) return null; // silent while loading; overview shows other things

  const now = Date.now();
  const enriched = pending
    .map((b) => {
      const ageMs = now - new Date(b.createdAt).getTime();
      const ageMin = Math.floor(ageMs / 60_000);
      let level = "ok";
      if (ageMin >= 5) level = "urgent";
      else if (ageMin >= 2) level = "warn";
      return { ...b, ageMin, level };
    })
    .sort((a, b) => b.ageMin - a.ageMin); // oldest waiting first

  if (enriched.length === 0) return null; // no urgent items — clean overview

  const urgentCount = enriched.filter((b) => b.level === "urgent").length;
  const warnCount = enriched.filter((b) => b.level === "warn").length;

  return (
    <div className={`ops-panel ${urgentCount > 0 ? "has-urgent" : warnCount > 0 ? "has-warn" : ""}`}>
      <div className="ops-head">
        <h3>
          ⚡ Pending bookings
          {urgentCount > 0 && <span className="ops-pill urgent">{urgentCount} urgent</span>}
          {warnCount > 0 && <span className="ops-pill warn">{warnCount} need a nudge</span>}
        </h3>
        <span className="ops-sub">Hotels haven't confirmed yet. Tap phone to call.</span>
      </div>
      <div className="ops-list">
        {enriched.map((b) => (
          <div key={b.id} className={`ops-row ${b.level}`}>
            <div className="ops-row-main">
              <strong>{b.reference}</strong>
              <span className="ops-hotel">{b.hotel?.name || "—"}</span>
              <span className="ops-age">{b.ageMin < 1 ? "just now" : `${b.ageMin} min`}</span>
            </div>
            <div className="ops-row-actions">
              {b.hotel?.contactPhone ? (
                <a className="ops-call" href={`tel:${b.hotel.contactPhone.replace(/\s+/g, "")}`}>
                  📞 {b.hotel.contactPhone}
                </a>
              ) : (
                <span className="ops-nophone">No hotel phone on file</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .ops-panel { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 20px 22px; margin-bottom: 24px; }
        .ops-panel.has-warn { border-color: #F5C75A; }
        .ops-panel.has-urgent { border-color: var(--red); background: linear-gradient(180deg, #FFF6F5 0%, #fff 60%); }
        .ops-head { margin-bottom: 14px; }
        .ops-head h3 { font-size: 15px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ops-head .ops-sub { display: block; font-size: 12.5px; color: var(--gray-400); margin-top: 4px; }
        .ops-pill { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 980px; letter-spacing: 0.04em; }
        .ops-pill.warn { background: #FFF4E0; color: #9A6700; }
        .ops-pill.urgent { background: var(--red); color: #fff; }
        .ops-list { display: flex; flex-direction: column; gap: 8px; }
        .ops-row {
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
          padding: 12px 14px; border-radius: var(--r-sm); border: 1.5px solid var(--gray-200); background: #fff;
        }
        .ops-row.warn { border-color: #F5C75A; background: #FFFBF0; }
        .ops-row.urgent { border-color: var(--red); background: #FFF1F0; }
        .ops-row-main { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
        .ops-row-main strong { font-size: 13.5px; font-weight: 800; letter-spacing: 0.02em; }
        .ops-hotel { font-size: 14px; font-weight: 600; color: var(--ink); }
        .ops-age { font-size: 12px; font-weight: 700; color: var(--gray-400); }
        .ops-row.warn .ops-age { color: #9A6700; }
        .ops-row.urgent .ops-age { color: var(--red); }
        .ops-call {
          background: var(--ink); color: #fff; padding: 8px 16px; border-radius: 980px;
          font-size: 13px; font-weight: 700; text-decoration: none;
        }
        .ops-call:hover { background: var(--red); }
        .ops-row.urgent .ops-call { background: var(--red); }
        .ops-nophone { font-size: 12px; color: var(--gray-400); font-style: italic; }
      `}</style>
    </div>
  );
}

// =============================================================================
// HOTELS MANAGER
// =============================================================================
// =============================================================================
// HOTELS MANAGER  (with filter bar)
// =============================================================================
// The filter bar above the list lets the operator slice the inventory by:
//   - Free-text search (matches name in EN/FR/AR, city, slug)
//   - City (built dynamically from the hotels that exist right now)
//   - Star rating (3 / 4 / 5)
//   - Status (all / active / inactive)
//   - Featured (toggle: show only featured)
//   - Has rooms (toggle: show only hotels with at least one room)
//
// All filtering happens client-side over the array the admin endpoint
// already returns in one shot — there is no per-filter API round-trip.
// At 20-200 hotels the cost is negligible; if the catalog grows past a
// few thousand, switching to a server-side `?city=&stars=&...` query
// is the right move.
//
// Filter state persists in sessionStorage under the key NZAD_HOTEL_FILTERS
// so a hard refresh during the same tab keeps the operator's place. It
// does NOT persist across browser sessions — opening a fresh admin tab
// always starts with everything visible.

const FILTER_STORAGE_KEY = "NZAD_HOTEL_FILTERS";

const BLANK_FILTERS = {
  q: "",            // free-text search
  city: "",         // exact match against h.city (the lowercase slug)
  stars: 0,         // 0 = any; 3, 4, 5 = exact
  status: "all",    // "all" | "active" | "inactive"
  featured: false,  // true = only featured
  hasRooms: false,  // true = only hotels with at least one room
};

function loadStoredFilters() {
  if (typeof window === "undefined") return BLANK_FILTERS;
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return BLANK_FILTERS;
    const parsed = JSON.parse(raw);
    // Defensive merge — if a future version adds a new filter key, old
    // stored state shouldn't break the page; missing keys fall back to
    // the blank default.
    return { ...BLANK_FILTERS, ...parsed };
  } catch {
    return BLANK_FILTERS;
  }
}

function HotelsManager() {
  const [hotels, setHotels] = useState(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // hotel object, or "new", or null
  // Track per-row "opening" state so the user gets feedback while we fetch the
  // detail endpoint (which carries the raw multilingual fields the editor needs).
  const [openingId, setOpeningId] = useState(null);

  // Filter state — initialized from sessionStorage so a refresh keeps place.
  const [filters, setFilters] = useState(loadStoredFilters);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  const load = useCallback(() => {
    setHotels(null);
    adminHotels().then(setHotels).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  // CRITICAL: clicking Manage must NOT pass the list-item (which is run
  // through formatHotel on the backend and loses the multilingual nameFr/Ar,
  // descFr/Ar, cityFr/Ar, regionFr/Ar fields). Instead we fetch the detail
  // endpoint which returns the raw Prisma object with every language preserved.
  // Without this step, the editor's FR/AR boxes appear empty even when the DB
  // has correct translations — and any "save" then writes whatever the user
  // typed (often nothing) into the persisted record, making the bug appear
  // to be "AR/FR don't save" when actually the load was the broken side.
  async function openEditor(h) {
    setErr("");
    setOpeningId(h.id);
    try {
      const detail = await adminHotel(h.id);
      setEditing(detail);
    } catch (e) {
      setErr(`Failed to load hotel details: ${e.message}`);
    } finally {
      setOpeningId(null);
    }
  }

  // Cities dropdown options — built once per hotels-list change. Keyed by
  // the lowercase `city` slug (matches the DB field used in the search URL).
  // Display label is the most common cased form seen across the rows.
  const cityOptions = useMemo(() => {
    if (!hotels) return [];
    const seen = new Map(); // key -> { label, count }
    for (const h of hotels) {
      const key = (h.city || "").toLowerCase().trim();
      if (!key) continue;
      // Prefer the partner's English label for display; fall back to capitalized slug.
      const label = (h.cityEn && h.cityEn.trim()) || (key.charAt(0).toUpperCase() + key.slice(1));
      const prev = seen.get(key);
      if (prev) prev.count += 1;
      else seen.set(key, { label, count: 1 });
    }
    return Array.from(seen.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [hotels]);

  // Apply filters → filteredHotels. Plain array reductions; no library.
  const filteredHotels = useMemo(() => {
    if (!hotels) return null;
    const q = filters.q.trim().toLowerCase();
    return hotels.filter((h) => {
      // Free-text search across name, city, slug. Case-insensitive.
      // Arabic and French are covered too because name is whatever the admin
      // list endpoint returns for the current language (English by default).
      if (q) {
        const hay = [
          h.name, h.nameEn, h.nameFr, h.nameAr,
          h.city, h.cityEn, h.cityFr, h.cityAr,
          h.slug,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.city && (h.city || "").toLowerCase() !== filters.city) return false;
      if (filters.stars && h.stars !== filters.stars) return false;
      if (filters.status === "active"   && !h.isActive) return false;
      if (filters.status === "inactive" &&  h.isActive) return false;
      if (filters.featured && !h.isFeatured) return false;
      if (filters.hasRooms && !(h.rooms && h.rooms.length > 0)) return false;
      return true;
    });
  }, [hotels, filters]);

  // True when ANY filter is non-default. Used to show the "Clear filters" button
  // and the "Showing X of Y" line only when relevant.
  const filtersActive =
    filters.q !== "" ||
    filters.city !== "" ||
    filters.stars !== 0 ||
    filters.status !== "all" ||
    filters.featured ||
    filters.hasRooms;

  function setFilter(patch) { setFilters((f) => ({ ...f, ...patch })); }
  function clearFilters() { setFilters(BLANK_FILTERS); }

  if (editing) {
    return <HotelEditor hotel={editing === "new" ? null : editing}
      onClose={() => setEditing(null)}
      onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div>
      <PageHead title="Hotels" subtitle="Add and manage your hotel inventory"
        action={<button className="nzad-btn-primary" onClick={() => setEditing("new")}>+ New hotel</button>} />

      {err && <ErrorBox msg={err} />}
      {!hotels && !err && <Loading />}

      {hotels && (
        <>
          {/* ===== FILTER BAR ===== */}
          <div className="nzad-filter-bar">
            <div className="nzad-filter-row">
              <input
                type="search"
                className="nzad-filter-search"
                placeholder="Search hotel name, city, slug…"
                value={filters.q}
                onChange={(e) => setFilter({ q: e.target.value })}
              />

              <select
                className="nzad-filter-select"
                value={filters.city}
                onChange={(e) => setFilter({ city: e.target.value })}
                aria-label="Filter by city"
              >
                <option value="">All cities</option>
                {cityOptions.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>

              <select
                className="nzad-filter-select"
                value={filters.status}
                onChange={(e) => setFilter({ status: e.target.value })}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div className="nzad-filter-row">
              <div className="nzad-filter-pill-group" role="group" aria-label="Filter by stars">
                <button
                  className={`nzad-pill ${filters.stars === 0 ? "on" : ""}`}
                  onClick={() => setFilter({ stars: 0 })}
                >Any ★</button>
                {[3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`nzad-pill ${filters.stars === n ? "on" : ""}`}
                    onClick={() => setFilter({ stars: filters.stars === n ? 0 : n })}
                  >{n}★</button>
                ))}
              </div>

              <button
                className={`nzad-pill ${filters.featured ? "on" : ""}`}
                onClick={() => setFilter({ featured: !filters.featured })}
              >Featured only</button>

              <button
                className={`nzad-pill ${filters.hasRooms ? "on" : ""}`}
                onClick={() => setFilter({ hasRooms: !filters.hasRooms })}
                title="Hide hotels that have no rooms yet"
              >Has rooms</button>

              <div className="nzad-filter-spacer" />

              {filtersActive && (
                <button className="nzad-filter-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {filtersActive && (
              <div className="nzad-filter-count">
                Showing <strong>{filteredHotels.length}</strong> of {hotels.length} hotels
              </div>
            )}
          </div>

          {/* ===== HOTEL LIST ===== */}
          <div className="nzad-hotel-list">
            {hotels.length === 0 && (
              <div className="nzad-panel">
                <span className="nzad-empty-inline">No hotels yet. Click &quot;New hotel&quot; to add your first one.</span>
              </div>
            )}
            {hotels.length > 0 && filteredHotels.length === 0 && (
              <div className="nzad-panel">
                <span className="nzad-empty-inline">
                  No hotels match the current filters.{" "}
                  <button className="nzad-link-btn" onClick={clearFilters}>Clear filters</button>
                </span>
              </div>
            )}
            {filteredHotels.map((h) => (
              <div className="nzad-hotel-row" key={h.id}>
                <div className="nzad-hotel-thumb">
                  {h.primaryPhoto
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={h.primaryPhoto} alt={h.name} />
                    : <div className="nzad-noimg">No photo</div>}
                </div>
                <div className="nzad-hotel-meta">
                  <div className="nzad-hotel-name">
                    {h.name}
                    {!h.isActive && <span className="nzad-tag-off">Inactive</span>}
                    {h.isFeatured && <span className="nzad-tag-feat">Featured</span>}
                  </div>
                  <div className="nzad-hotel-sub">
                    {"★".repeat(h.stars)} · {h.city} · {h.rooms?.length || 0} room types · from {fmt(h.priceFrom)}
                  </div>
                </div>
                <button
                  className="nzad-btn-ghost"
                  disabled={openingId === h.id}
                  onClick={() => openEditor(h)}
                >
                  {openingId === h.id ? "Opening…" : "Manage"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .nzad-hotel-list { display: flex; flex-direction: column; gap: 10px; }
        .nzad-hotel-row {
          display: flex; align-items: center; gap: 16px; padding: 12px;
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md);
        }
        .nzad-hotel-thumb { width: 80px; height: 60px; border-radius: var(--r-sm); overflow: hidden; flex-shrink: 0; background: var(--gray-100); }
        .nzad-hotel-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .nzad-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--gray-400); }
        .nzad-hotel-meta { flex: 1; }
        .nzad-hotel-name { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .nzad-hotel-sub { font-size: 12.5px; color: var(--gray-400); font-weight: 600; margin-top: 2px; }
        .nzad-tag-off { font-size: 10px; background: var(--gray-100); color: var(--gray-400); padding: 2px 7px; border-radius: 980px; font-weight: 700; }
        .nzad-tag-feat { font-size: 10px; background: var(--red-soft); color: var(--red-deep); padding: 2px 7px; border-radius: 980px; font-weight: 700; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        .nzad-link-btn { background: none; border: none; color: var(--red-deep); font-weight: 700; cursor: pointer; font-family: inherit; padding: 0; text-decoration: underline; }

        /* ===== Filter bar ===== */
        .nzad-filter-bar {
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md);
          padding: 12px; margin-bottom: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .nzad-filter-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        }
        .nzad-filter-search {
          flex: 1; min-width: 200px;
          padding: 9px 12px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          font-size: 14px; outline: none; font-family: inherit; background: #fff;
          transition: border-color .15s;
        }
        .nzad-filter-search:focus { border-color: var(--ink); }
        .nzad-filter-select {
          padding: 9px 12px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          font-size: 14px; background: #fff; font-family: inherit; cursor: pointer;
          min-width: 150px;
        }
        .nzad-filter-pill-group { display: flex; gap: 4px; padding: 2px; background: var(--gray-100); border-radius: var(--r-sm); }
        .nzad-pill {
          padding: 7px 12px; border: none; background: transparent; border-radius: 6px;
          font-size: 12.5px; font-weight: 700; color: var(--gray-400); cursor: pointer;
          font-family: inherit; transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .nzad-filter-pill-group .nzad-pill { padding: 6px 10px; }
        .nzad-pill:hover { color: var(--ink); }
        .nzad-pill.on { background: var(--ink); color: #fff; }
        .nzad-filter-pill-group .nzad-pill.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .nzad-filter-spacer { flex: 1; }
        .nzad-filter-clear {
          padding: 7px 12px; background: transparent; border: 1px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 12.5px; font-weight: 700;
          color: var(--red-deep); cursor: pointer; font-family: inherit;
        }
        .nzad-filter-clear:hover { background: var(--red-soft); border-color: var(--red-soft); }
        .nzad-filter-count {
          font-size: 12px; color: var(--gray-400); padding-top: 4px;
          border-top: 1px dashed var(--gray-200);
        }
        .nzad-filter-count strong { color: var(--ink); }

        @media (max-width: 720px) {
          .nzad-filter-search, .nzad-filter-select { width: 100%; flex: 1 1 100%; }
          .nzad-filter-spacer { display: none; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// HOTEL EDITOR
// =============================================================================
const BLANK_HOTEL = {
  nameEn: "", nameFr: "", nameAr: "",
  descEn: "", descFr: "", descAr: "",
  stars: 4, city: "",
  cityEn: "", cityFr: "", cityAr: "",
  regionEn: "", regionFr: "", regionAr: "",
  address: "", contactEmail: "", contactPhone: "",
  checkInTime: "14:00", checkOutTime: "12:00", cancellationHours: 48,
  childrenAllowed: true, petsAllowed: false, parkingFree: true,
  instantConfirmation: true, verifiedPartner: true,
  isActive: true, isFeatured: false,
  tags: [],
};

function HotelEditor({ hotel, onClose, onSaved }) {
  const isNew = !hotel;

  // ---- Authoritative hotel data ------------------------------------------
  // We keep `hotelData` as the source of truth for photos and rooms. The
  // `hotel` prop is only the initial seed. After any mutation (delete photo,
  // add room, set primary, etc.) the child panel calls `refreshHotelData()`
  // which re-fetches the detail endpoint and updates this slot, which in
  // turn re-renders the child panels with fresh data.
  //
  // This eliminates the class of bugs where:
  //   1. User deletes a photo
  //   2. PhotosPanel optimistically updates local state
  //   3. User closes editor, reopens it
  //   4. Editor receives stale `hotel.photos` from initial load
  //   5. Photo appears to be back even though it was actually deleted
  //
  // With refresh-on-mutate, the truth is always the database.
  const [hotelData, setHotelData] = useState(hotel);
  const refreshHotelData = useCallback(async () => {
    if (!hotel?.id) return;
    try {
      const fresh = await adminHotel(hotel.id);
      setHotelData(fresh);
    } catch (e) {
      // Don't block the UI on a failed refresh — log it and continue with
      // whatever data we have.
      console.error("Failed to refresh hotel data:", e);
    }
  }, [hotel?.id]);

  const [form, setForm] = useState(() => {
    if (!hotel) return { ...BLANK_HOTEL };
    return {
      nameEn: hotel.nameEn ?? hotel.name ?? "", nameFr: hotel.nameFr ?? "", nameAr: hotel.nameAr ?? "",
      descEn: hotel.descEn ?? hotel.description ?? "", descFr: hotel.descFr ?? "", descAr: hotel.descAr ?? "",
      stars: hotel.stars ?? 4, city: hotel.city ?? "",
      cityEn: hotel.cityEn ?? "", cityFr: hotel.cityFr ?? "", cityAr: hotel.cityAr ?? "",
      regionEn: hotel.regionEn ?? "", regionFr: hotel.regionFr ?? "", regionAr: hotel.regionAr ?? "",
      address: hotel.address ?? "", contactEmail: hotel.contactEmail ?? "", contactPhone: hotel.contactPhone ?? "",
      checkInTime: hotel.checkInTime ?? "14:00", checkOutTime: hotel.checkOutTime ?? "12:00",
      cancellationHours: hotel.cancellationHours ?? 48,
      childrenAllowed: hotel.childrenAllowed ?? true,
      petsAllowed: hotel.petsAllowed ?? false,
      parkingFree: hotel.parkingFree ?? true,
      instantConfirmation: hotel.trustSignals?.instantConfirmation ?? hotel.instantConfirmation ?? true,
      verifiedPartner: hotel.trustSignals?.verifiedPartner ?? hotel.verifiedPartner ?? true,
      isActive: hotel.isActive ?? true,
      isFeatured: hotel.isFeatured ?? false,
      tags: Array.isArray(hotel.tags) ? hotel.tags : [],
    };
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [savedId, setSavedId] = useState(hotel?.id || null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr(""); setBusy(true);
    try {
      const payload = {
        ...form,
        stars: Number(form.stars),
        cancellationHours: Number(form.cancellationHours),
      };
      if (isNew && !savedId) {
        const created = await adminCreateHotel(payload);
        setSavedId(created.id);
      } else {
        await adminUpdateHotel(savedId, payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.message + (e.details ? ` (${e.details.map((d) => d.path?.join?.(".")).join(", ")})` : ""));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Deactivate this hotel? It will be hidden from the public site.")) return;
    setBusy(true);
    try {
      await adminDeleteHotel(savedId);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHead
        title={isNew ? "New hotel" : `Edit · ${form.nameEn || "Hotel"}`}
        subtitle={isNew ? "Add a new hotel to the platform" : "Update hotel details"}
        action={<button className="nzad-btn-ghost" onClick={onClose}>← Back to hotels</button>}
      />

      {err && <ErrorBox msg={err} />}

      <div className="nzad-panel">
        <h3>Names (3 languages)</h3>
        <div className="nzad-grid3">
          <Field label="Name (English)" v={form.nameEn} onChange={(v) => set("nameEn", v)} required />
          <Field label="Name (French)" v={form.nameFr} onChange={(v) => set("nameFr", v)} />
          <Field label="Name (Arabic)" v={form.nameAr} onChange={(v) => set("nameAr", v)} rtl />
        </div>
      </div>

      <div className="nzad-panel">
        <h3>Description (3 languages)</h3>
        <div className="nzad-grid3">
          <Field label="Description (EN)" v={form.descEn} onChange={(v) => set("descEn", v)} area required />
          <Field label="Description (FR)" v={form.descFr} onChange={(v) => set("descFr", v)} area />
          <Field label="Description (AR)" v={form.descAr} onChange={(v) => set("descAr", v)} area rtl />
        </div>
      </div>

      <div className="nzad-panel">
        <h3>Location &amp; rating</h3>
        <div className="nzad-grid3">
          <Field label="City key (lowercase, e.g. algiers)" v={form.city} onChange={(v) => set("city", v)} required />
          <Field label="Stars (1–5)" v={form.stars} onChange={(v) => set("stars", v)} type="number" required />
          <Field label="Address" v={form.address} onChange={(v) => set("address", v)} />
          <Field label="City (EN)" v={form.cityEn} onChange={(v) => set("cityEn", v)} />
          <Field label="City (FR)" v={form.cityFr} onChange={(v) => set("cityFr", v)} />
          <Field label="City (AR)" v={form.cityAr} onChange={(v) => set("cityAr", v)} rtl />
          <Field label="Region (EN)" v={form.regionEn} onChange={(v) => set("regionEn", v)} />
          <Field label="Region (FR)" v={form.regionFr} onChange={(v) => set("regionFr", v)} />
          <Field label="Region (AR)" v={form.regionAr} onChange={(v) => set("regionAr", v)} rtl />
        </div>
      </div>

      <div className="nzad-panel">
        <h3>Policies &amp; contact</h3>
        <div className="nzad-grid3">
          <Field label="Check-in time" v={form.checkInTime} onChange={(v) => set("checkInTime", v)} />
          <Field label="Check-out time" v={form.checkOutTime} onChange={(v) => set("checkOutTime", v)} />
          <Field label="Free cancellation (hours)" v={form.cancellationHours} onChange={(v) => set("cancellationHours", v)} type="number" />
          <Field label="Contact email" v={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
          <Field label="Contact phone" v={form.contactPhone} onChange={(v) => set("contactPhone", v)} />
        </div>
        <div className="nzad-toggles">
          <Toggle label="Children allowed" v={form.childrenAllowed} onChange={(v) => set("childrenAllowed", v)} />
          <Toggle label="Pets allowed" v={form.petsAllowed} onChange={(v) => set("petsAllowed", v)} />
          <Toggle label="Free parking" v={form.parkingFree} onChange={(v) => set("parkingFree", v)} />
          <Toggle label="Instant confirmation" v={form.instantConfirmation} onChange={(v) => set("instantConfirmation", v)} />
          <Toggle label="Verified partner" v={form.verifiedPartner} onChange={(v) => set("verifiedPartner", v)} />
          <Toggle label="Active (visible on site)" v={form.isActive} onChange={(v) => set("isActive", v)} />
          <Toggle label="Featured on homepage" v={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
        </div>

        <TagsPicker
          selected={form.tags || []}
          onChange={(tags) => set("tags", tags)}
        />
      </div>

      <div className="nzad-editor-actions">
        <button className="nzad-btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : isNew && !savedId ? "Create hotel" : "Save changes"}
        </button>
        {!isNew && (
          <button className="nzad-btn-danger" onClick={remove} disabled={busy}>Deactivate hotel</button>
        )}
      </div>

      {savedId && (
        <RoomsPanel
          hotelId={savedId}
          initialRooms={hotelData?.rooms || []}
          refresh={refreshHotelData}
        />
      )}
      {savedId && (
        <PhotosPanel
          hotelId={savedId}
          initialPhotos={hotelData?.photos || []}
          refresh={refreshHotelData}
        />
      )}
      {savedId && (
        <ManagersPanel hotelId={savedId} />
      )}
      {isNew && !savedId && (
        <div className="nzad-note">Save the hotel first to add rooms, photos and partner accounts.</div>
      )}

      <style jsx>{`
        .nzad-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .nzad-toggles { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .nzad-editor-actions { display: flex; gap: 10px; margin-bottom: 24px; }
        .nzad-note { padding: 16px; background: var(--cream); border: 1px dashed var(--gray-300); border-radius: var(--r-md); font-size: 13px; color: var(--gray-400); }
        @media (max-width: 720px) { .nzad-grid3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// ROOMS PANEL
// =============================================================================
const BLANK_ROOM = {
  typeEn: "", typeFr: "", typeAr: "",
  capacity: 2, sizeSqm: 30, bedType: "King",
  basePrice: 20000, totalUnits: 5, isActive: true,
};

function RoomsPanel({ hotelId, initialRooms, refresh }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK_ROOM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState(""); // soft-delete feedback message

  // Resync local state when the parent passes a different initialRooms
  // (happens after refresh()). Without this useEffect, the panel would
  // capture initialRooms only on first mount and ignore later updates.
  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  async function addRoom() {
    setErr(""); setNote(""); setBusy(true);
    try {
      const payload = {
        ...draft,
        capacity: Number(draft.capacity),
        sizeSqm: Number(draft.sizeSqm),
        basePrice: Number(draft.basePrice),
        totalUnits: Number(draft.totalUnits),
      };
      await adminAddRoom(hotelId, payload);
      setDraft(BLANK_ROOM);
      setAdding(false);
      // Refetch from the server — the new room comes back with its id and
      // any server-side defaults applied. More reliable than appending the
      // POST response directly.
      if (refresh) await refresh();
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function delRoom(id) {
    if (!confirm("Remove this room type?")) return;
    setErr(""); setNote("");
    try {
      const result = await adminDeleteRoom(id);
      // Smart-delete backend returns { deleteMode: "hard" | "soft",
      // bookingRefs }. When soft, the room stays in the DB (because
      // bookings reference it) but is filtered out of the editor. Show
      // an informational note so the admin understands what happened.
      if (result?.deleteMode === "soft") {
        setNote(
          `Room archived — ${result.bookingRefs} existing booking${result.bookingRefs === 1 ? "" : "s"} reference it, so it can't be permanently deleted.`
        );
      }
      if (refresh) await refresh();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="nzad-panel">
      <div className="nzad-panel-head">
        <h3>Rooms</h3>
        {!adding && <button className="nzad-btn-ghost" onClick={() => setAdding(true)}>+ Add room</button>}
      </div>
      {err && <ErrorBox msg={err} />}
      {note && (
        /* Informational note (not an error): explains why a room delete
           became an archive instead of a hard delete. Auto-dismissable
           by clicking the ×. Note styles live in the panel's main
           <style jsx> block below — we deliberately do NOT add a second
           <style jsx> here, because Next.js's SWC transformer panics
           on two styled-jsx blocks in the same component tree
           (styled_jsx-0.73.10/visitor.rs:597). */
        <div className="nzad-info-note" role="status">
          <span>{note}</span>
          <button type="button" onClick={() => setNote("")} aria-label="Dismiss">×</button>
        </div>
      )}

      {rooms.length === 0 && !adding && (
        <span className="nzad-empty-inline">No rooms yet. Add at least one room type.</span>
      )}

      {rooms.map((r) => (
        <RoomCard
          key={r.id}
          room={r}
          onDelete={() => delRoom(r.id)}
          onRoomChange={(updated) => setRooms((rs) => rs.map((x) => (x.id === updated.id ? updated : x)))}
        />
      ))}

      {adding && (
        <div className="nzad-room-form">
          <div className="nzad-grid3">
            <Field label="Type (EN)" v={draft.typeEn} onChange={(v) => set("typeEn", v)} />
            <Field label="Type (FR)" v={draft.typeFr} onChange={(v) => set("typeFr", v)} />
            <Field label="Type (AR)" v={draft.typeAr} onChange={(v) => set("typeAr", v)} rtl />
            <Field label="Price / night (DZD)" v={draft.basePrice} onChange={(v) => set("basePrice", v)} type="number" />
            <Field label="Capacity (guests)" v={draft.capacity} onChange={(v) => set("capacity", v)} type="number" />
            <Field label="Size (m²)" v={draft.sizeSqm} onChange={(v) => set("sizeSqm", v)} type="number" />
            <Field label="Bed type" v={draft.bedType} onChange={(v) => set("bedType", v)} />
            <Field label="Number of rooms" v={draft.totalUnits} onChange={(v) => set("totalUnits", v)} type="number" />
          </div>
          <div className="nzad-editor-actions">
            <button className="nzad-btn-primary" onClick={addRoom} disabled={busy}>
              {busy ? "Adding…" : "Add room"}
            </button>
            <button className="nzad-btn-ghost" onClick={() => { setAdding(false); setDraft(BLANK_ROOM); }}>Cancel</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .nzad-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .nzad-panel-head h3 { margin: 0; }
        .nzad-info-note {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; margin: 10px 0 14px;
          background: #FFF4E0; color: #9A6700;
          border-radius: var(--r-sm);
          font-size: 13px;
        }
        .nzad-info-note span { flex: 1; }
        .nzad-info-note button {
          background: none; border: none; font-size: 18px;
          line-height: 1; cursor: pointer; color: #9A6700;
          padding: 0 4px;
        }
        .nzad-room-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; background: var(--cream); border-radius: var(--r-sm); margin-bottom: 8px;
        }
        .nzad-room-row strong { font-size: 14px; }
        .nzad-room-row span { font-size: 12.5px; color: var(--gray-400); font-weight: 600; }
        .nzad-room-form { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gray-100); }
        .nzad-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .nzad-editor-actions { display: flex; gap: 10px; margin-top: 14px; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        @media (max-width: 720px) { .nzad-grid3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// ROOM CARD — one collapsed row that expands to show room photos
// =============================================================================
// We render rooms as cards (not flat rows) because each room now owns its
// own photo gallery. The header stays compact (one line) and clicking
// "Photos" reveals the gallery so the panel doesn't get visually overwhelming
// when a hotel has many room types.
//
// IMPORTANT: rooms come from the detail endpoint, so they carry typeEn/Fr/Ar
// fields directly. The display prefers typeEn (admin-facing UI is English)
// with a fallback to the legacy localized `type` field for rooms that were
// loaded before the editor refactor.
function RoomCard({ room, onDelete, onRoomChange }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const photoCount = (room.photos || []).length;
  const displayName = room.typeEn || room.type || "(unnamed room)";

  return (
    <div className="nzad-room-card">
      <div className="nzad-room-head">
        <div className="nzad-room-meta">
          <strong>{displayName}</strong>
          <span>· {room.capacity} guests · {room.bedType} · {fmt(room.basePrice ?? room.price)}/night</span>
        </div>
        <div className="nzad-room-actions">
          <button
            className="nzad-btn-mini"
            onClick={() => setShowPhotos((s) => !s)}
            title="Photos for this room type"
          >
            📷 Photos ({photoCount}) {showPhotos ? "▴" : "▾"}
          </button>
          <button className="nzad-btn-mini-danger" onClick={onDelete}>Remove</button>
        </div>
      </div>
      {showPhotos && (
        <div className="nzad-room-photos-wrap">
          <RoomPhotos
            room={room}
            onPhotosChange={(photos) => onRoomChange({ ...room, photos })}
          />
        </div>
      )}
      <style jsx>{`
        .nzad-room-card {
          background: var(--cream);
          border-radius: var(--r-sm);
          margin-bottom: 8px;
          overflow: hidden;
        }
        .nzad-room-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          gap: 12px;
        }
        .nzad-room-meta strong { font-size: 14px; }
        .nzad-room-meta span { font-size: 12.5px; color: var(--gray-400); font-weight: 600; margin-left: 6px; }
        .nzad-room-actions { display: flex; gap: 8px; align-items: center; }
        .nzad-room-photos-wrap {
          padding: 14px 14px 16px;
          border-top: 1px solid var(--gray-100);
          background: white;
        }
        @media (max-width: 720px) {
          .nzad-room-head { flex-direction: column; align-items: stretch; }
          .nzad-room-actions { justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// ROOM PHOTOS — gallery + drag-and-drop upload, scoped to one room
// =============================================================================
// Mirrors PhotosPanel but for room-level photos. Differences from PhotosPanel:
//   - No isPrimary flag — room photos are just an ordered gallery
//   - Uses /api/admin/rooms/:roomId/photos endpoints
//   - Files are stored in R2 under hotels/{slug}/rooms/{roomId}/
function RoomPhotos({ room, onPhotosChange }) {
  const initialPhotos = room.photos || [];
  const [photos, setPhotosLocal] = useState(initialPhotos);
  const [err, setErr] = useState("");
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Helper that updates BOTH local state AND bubbles up to RoomsPanel so the
  // parent's `rooms` array stays in sync. Without this, the photo count badge
  // on the card header (which reads room.photos.length) goes stale.
  const setPhotos = (updater) => {
    setPhotosLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onPhotosChange(next);
      return next;
    });
  };

  async function del(id) {
    try {
      await adminDeleteRoomPhoto(id);
      setPhotos((ps) => ps.filter((x) => x.id !== id));
    } catch (e) { setErr(e.message); }
  }

  function pickFiles() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function onFilesChosen(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) handleFiles(files);
  }

  async function handleFiles(files) {
    setErr("");
    const rows = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      error: null,
      done: false,
    }));
    setUploads((u) => [...u, ...rows]);

    // Sequential — same throttling rationale as hotel photos.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const row = rows[i];
      try {
        const p = await adminUploadRoomPhoto(room.id, file, {
          onProgress: (pct) => {
            setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, progress: pct } : r)));
          },
        });
        setPhotos((ps) => [...ps, p]);
        setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, done: true, progress: 100 } : r)));
        setTimeout(() => {
          setUploads((u) => u.filter((r) => r.id !== row.id));
        }, 1200);
      } catch (e) {
        setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, error: e.message } : r)));
      }
    }
  }

  return (
    <div>
      {err && <ErrorBox msg={err} />}

      {photos.length > 0 && (
        <div className="nzad-room-photo-grid">
          {photos.map((p) => (
            <div className="nzad-room-photo" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
              <button className="nzad-room-photo-del" onClick={() => del(p.id)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`nzad-room-drop ${dragging ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={pickFiles}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={onFilesChosen}
        />
        <div className="nzad-room-drop-icon">📷</div>
        <div className="nzad-room-drop-title">Drop room photos here, or click</div>
        <div className="nzad-room-drop-sub">JPG, PNG, or WEBP · up to 8 MB each</div>
      </div>

      {uploads.length > 0 && (
        <div className="nzad-uploads">
          {uploads.map((u) => (
            <div key={u.id} className={`nzad-upload ${u.error ? "err" : u.done ? "done" : ""}`}>
              <div className="nzad-upload-info">
                <span className="nzad-upload-name">{u.name}</span>
                <span className="nzad-upload-size">{Math.round((u.size || 0) / 1024)} KB</span>
              </div>
              {u.error ? (
                <span className="nzad-upload-err">{u.error}</span>
              ) : (
                <div className="nzad-upload-bar">
                  <div className="nzad-upload-fill" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .nzad-room-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .nzad-room-photo {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: var(--r-sm);
          overflow: hidden;
          background: var(--cream);
        }
        .nzad-room-photo img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .nzad-room-photo-del {
          position: absolute; top: 4px; right: 4px;
          width: 22px; height: 22px;
          border: none; border-radius: 50%;
          background: rgba(0,0,0,0.6); color: white;
          font-size: 14px; line-height: 1; cursor: pointer;
        }
        .nzad-room-photo-del:hover { background: var(--red); }
        .nzad-room-drop {
          border: 2px dashed var(--gray-300);
          border-radius: var(--r-sm);
          padding: 24px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nzad-room-drop:hover, .nzad-room-drop.active {
          border-color: var(--red);
          background: rgba(230, 57, 70, 0.04);
        }
        .nzad-room-drop-icon { font-size: 24px; margin-bottom: 4px; }
        .nzad-room-drop-title { font-size: 13px; font-weight: 600; color: var(--ink); }
        .nzad-room-drop-sub { font-size: 11.5px; color: var(--gray-400); margin-top: 2px; }
        .nzad-uploads { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
        .nzad-upload {
          padding: 8px 10px; background: var(--cream); border-radius: var(--r-sm);
          font-size: 12px;
        }
        .nzad-upload.err { background: rgba(230, 57, 70, 0.08); }
        .nzad-upload.done { background: rgba(27, 138, 90, 0.08); }
        .nzad-upload-info { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .nzad-upload-name { font-weight: 600; }
        .nzad-upload-size { color: var(--gray-400); }
        .nzad-upload-bar {
          height: 3px; background: var(--gray-100); border-radius: 2px; overflow: hidden;
        }
        .nzad-upload-fill {
          height: 100%; background: var(--red); transition: width 0.2s ease;
        }
        .nzad-upload-err { color: var(--red); font-size: 11.5px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// PHOTOS PANEL
// =============================================================================
function PhotosPanel({ hotelId, initialPhotos, refresh }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [busyUrl, setBusyUrl] = useState(false);
  const [err, setErr] = useState("");
  // Each upload row: { id, name, progress, error, done }
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  // Per-photo "busy" set so we can disable buttons during async ops without
  // a global lock. Storing as a Set in state — replaced rather than mutated.
  const [busyPhotoIds, setBusyPhotoIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Resync local state when parent passes a different initialPhotos
  // (happens after refresh() — e.g. after delete/add/setPrimary). Without
  // this, the panel would only ever see the photos array it was mounted
  // with, and "delete photo → photo reappears on reopen" type bugs would
  // persist.
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  function markBusy(id, busy) {
    setBusyPhotoIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function addByUrl() {
    if (!url.trim()) return;
    setErr(""); setBusyUrl(true);
    try {
      await adminAddPhoto(hotelId, url.trim(), photos.length === 0);
      setUrl("");
      // Refetch from server — gets the new photo with its id and resolved
      // isPrimary state. More reliable than appending the POST response.
      if (refresh) await refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusyUrl(false); }
  }

  async function del(id) {
    setErr("");
    markBusy(id, true);
    try {
      await adminDeletePhoto(id);
      // Refetch instead of optimistically filtering — the backend may have
      // also promoted a successor to primary (when the deleted photo was
      // the primary), and we want the refreshed photos list to reflect
      // that immediately.
      if (refresh) await refresh();
    } catch (e) { setErr(e.message); }
    finally { markBusy(id, false); }
  }

  // Promote a non-primary photo to primary. The backend transactionally
  // clears the flag on all sibling photos and sets it on this one, so we
  // always have exactly one primary photo per hotel.
  async function setPrimary(id) {
    setErr("");
    markBusy(id, true);
    try {
      await adminSetPrimaryPhoto(id);
      if (refresh) await refresh();
    } catch (e) { setErr(e.message); }
    finally { markBusy(id, false); }
  }

  function pickFiles() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function onFilesChosen(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    // reset so picking the same file twice still fires onChange
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) handleFiles(files);
  }

  async function handleFiles(files) {
    setErr("");
    // create one upload row per file and process them in sequence so the
    // R2 free tier and Railway's CPU don't get hammered with parallel uploads
    const rows = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      error: null,
      done: false,
    }));
    setUploads((u) => [...u, ...rows]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const row = rows[i];
      try {
        const p = await adminUploadPhoto(hotelId, file, {
          onProgress: (pct) => {
            setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, progress: pct } : r)));
          },
        });
        // Optimistically show the new photo immediately so multi-file
        // uploads feel responsive. We'll call refresh() at the end of
        // the loop to reconcile with server truth.
        setPhotos((ps) => [...ps, p]);
        setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, done: true, progress: 100 } : r)));
        // drop the row after a short delay so the user sees the "done" tick
        setTimeout(() => {
          setUploads((u) => u.filter((r) => r.id !== row.id));
        }, 1200);
      } catch (e) {
        setUploads((u) => u.map((r) => (r.id === row.id ? { ...r, error: e.message } : r)));
      }
    }
    // Reconcile with the server after the batch. Picks up any server-side
    // changes (e.g. the first uploaded photo being auto-promoted to primary
    // when the hotel had no photos before).
    if (refresh) await refresh();
  }

  return (
    <div className="nzad-panel">
      <h3>Photos</h3>

      {err && <ErrorBox msg={err} />}

      {/* existing photos grid */}
      {photos.length > 0 && (
        <div className="nzad-photo-grid">
          {photos.map((p) => {
            const isBusy = busyPhotoIds.has(p.id);
            return (
              <div className={`nzad-photo${isBusy ? " busy" : ""}`} key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" />
                {p.isPrimary && <span className="nzad-photo-primary">Primary</span>}
                <button
                  className="nzad-photo-del"
                  onClick={() => del(p.id)}
                  disabled={isBusy}
                  title="Remove"
                >×</button>
                {/* "Make primary" overlay button — only shown for non-primary
                    photos. Positioned at the bottom so it doesn't compete
                    visually with the × delete button at the top-right. */}
                {!p.isPrimary && (
                  <button
                    className="nzad-photo-make-primary"
                    onClick={() => setPrimary(p.id)}
                    disabled={isBusy}
                    title="Set as primary photo"
                  >
                    ★ Make primary
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* drag-and-drop dropzone */}
      <div
        className={`nzad-drop ${dragging ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={pickFiles}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={onFilesChosen}
        />
        <div className="nzad-drop-icon">📷</div>
        <div className="nzad-drop-title">Drag photos here, or click to choose</div>
        <div className="nzad-drop-sub">JPG, PNG, or WEBP · up to 8 MB each</div>
      </div>

      {/* in-progress uploads */}
      {uploads.length > 0 && (
        <div className="nzad-uploads">
          {uploads.map((u) => (
            <div key={u.id} className={`nzad-upload ${u.error ? "err" : u.done ? "done" : ""}`}>
              <div className="nzad-upload-info">
                <span className="nzad-upload-name">{u.name}</span>
                <span className="nzad-upload-status">
                  {u.error ? `Failed: ${u.error}` : u.done ? "✓ Done" : `${u.progress}%`}
                </span>
              </div>
              {!u.error && (
                <div className="nzad-upload-bar">
                  <div className="nzad-upload-fill" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* URL-paste — kept as a secondary option, collapsed by default */}
      <div className="nzad-url-toggle">
        <button onClick={() => setShowUrl((v) => !v)} type="button" className="nzad-link">
          {showUrl ? "Hide URL option" : "Or add by URL"}
        </button>
      </div>
      {showUrl && (
        <div className="nzad-photo-add">
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image URL — e.g. https://images.unsplash.com/photo-…"
            onKeyDown={(e) => e.key === "Enter" && addByUrl()} />
          <button className="nzad-btn-primary" onClick={addByUrl} disabled={busyUrl}>
            {busyUrl ? "Adding…" : "Add by URL"}
          </button>
        </div>
      )}

      <style jsx>{`
        .nzad-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 16px; }
        .nzad-photo { position: relative; height: 90px; border-radius: var(--r-sm); overflow: hidden; background: var(--gray-100); }
        .nzad-photo img { width: 100%; height: 100%; object-fit: cover; }
        /* Visually dim the card while an action is in flight (delete or
           set-primary), so the user gets feedback that something is
           happening. */
        .nzad-photo.busy { opacity: 0.55; pointer-events: none; }
        .nzad-photo-primary {
          position: absolute; bottom: 4px; left: 4px; background: var(--red); color: #fff;
          font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 980px;
        }
        .nzad-photo-del {
          position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
          border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
          font-size: 14px; cursor: pointer; line-height: 1;
        }
        .nzad-photo-del:hover { background: var(--red); }
        /* "Make primary" overlay — appears on hover at the bottom of the
           photo. Subtle until hovered so it doesn't clutter the gallery
           but is discoverable when the admin moves the mouse around. */
        .nzad-photo-make-primary {
          position: absolute;
          bottom: 4px; right: 4px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          border-radius: 980px;
          padding: 4px 10px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s;
          font-family: inherit;
          letter-spacing: 0.03em;
        }
        /* NOTE: the hover-to-reveal rule for .nzad-photo-make-primary
           lives in globals.css instead of here. styled_jsx 0.73.10
           (bundled with Next 14.2.x) panics in visitor.rs:597 when it
           tries to compile a :hover combined with a descendant
           combinator, e.g. .parent:hover .child. Moving that single
           rule to global CSS sidesteps the bug entirely while keeping
           every other rule in this block scoped as before. */
        .nzad-photo-make-primary:hover { background: var(--red); }
        .nzad-photo-make-primary:disabled { opacity: 0.5; cursor: default; }

        /* dropzone */
        .nzad-drop {
          border: 2px dashed var(--gray-200);
          border-radius: var(--r-sm);
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
          background: var(--gray-50, #FAFAFA);
          transition: border-color .15s, background .15s;
        }
        .nzad-drop:hover { border-color: var(--gray-300); }
        .nzad-drop.active {
          border-color: var(--red);
          background: var(--red-soft);
        }
        .nzad-drop-icon { font-size: 28px; margin-bottom: 6px; }
        .nzad-drop-title { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
        .nzad-drop-sub { font-size: 11.5px; color: var(--gray-400); }

        /* upload rows */
        .nzad-uploads { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .nzad-upload {
          padding: 9px 12px;
          background: #fff;
          border: 1px solid var(--gray-200);
          border-radius: var(--r-sm);
          transition: border-color .2s;
        }
        .nzad-upload.done { border-color: #B8E0C8; background: #F3FAF6; }
        .nzad-upload.err { border-color: #F0C2C5; background: #FCF3F4; }
        .nzad-upload-info {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 6px; gap: 12px;
        }
        .nzad-upload-name {
          font-size: 12.5px; font-weight: 600; color: var(--ink);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nzad-upload-status {
          font-size: 11.5px; font-weight: 700; color: var(--gray-400); flex-shrink: 0;
        }
        .nzad-upload.done .nzad-upload-status { color: var(--teal, #1B8A5A); }
        .nzad-upload.err .nzad-upload-status { color: var(--red); }
        .nzad-upload-bar { height: 4px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
        .nzad-upload-fill {
          height: 100%; background: var(--red);
          transition: width .25s ease-out;
        }
        .nzad-upload.done .nzad-upload-fill { background: var(--teal, #1B8A5A); }

        /* URL toggle */
        .nzad-url-toggle { margin-top: 14px; text-align: center; }
        .nzad-link {
          background: none; border: none; padding: 0;
          font-size: 12px; font-weight: 600; color: var(--gray-400);
          text-decoration: underline; cursor: pointer; font-family: inherit;
        }
        .nzad-link:hover { color: var(--ink); }
        .nzad-photo-add { display: flex; gap: 8px; margin-top: 10px; }
        .nzad-photo-add input {
          flex: 1; padding: 10px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; outline: none;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// MANAGERS PANEL — admin creates hotel-partner accounts that log into /partner
// =============================================================================
// =============================================================================
// TAGS PICKER — toggleable chips for AI-search tags
// =============================================================================
function TagsPicker({ selected, onChange }) {
  const [tags, setTags] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminTags().then(setTags).catch((e) => setErr(e.message));
  }, []);

  function toggle(key) {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else onChange([...selected, key]);
  }

  return (
    <div className="nzad-tagspicker">
      <div className="nzad-tagspicker-head">
        <h4>Tags</h4>
        <span>How travelers find this hotel through search ({selected.length} selected)</span>
      </div>
      {err && <ErrorBox msg={err} />}
      {!tags && !err && <span className="nzad-dim">Loading…</span>}
      {tags && (
        <div className="nzad-tag-grid">
          {tags.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`ad-tag-chip ${selected.includes(t.key) ? "on" : ""}`}
              onClick={() => toggle(t.key)}
            >
              {t.en}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .nzad-tagspicker { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--gray-100); }
        .nzad-tagspicker-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .nzad-tagspicker h4 { font-size: 13px; font-weight: 700; color: var(--ink); }
        .nzad-tagspicker-head span { font-size: 12px; color: var(--gray-400); }
        .nzad-tag-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .nzad-tag-chip {
          padding: 8px 14px; border-radius: 980px;
          border: 1.5px solid var(--gray-200); background: #fff;
          font-size: 13px; font-weight: 600; color: var(--ink-2);
          cursor: pointer; font-family: inherit;
          transition: all .15s;
        }
        .nzad-tag-chip:hover { border-color: var(--ink); }
        .nzad-tag-chip.on {
          background: var(--ink); color: #fff; border-color: var(--ink);
        }
        .nzad-dim { color: var(--gray-400); font-size: 13px; }
      `}</style>
    </div>
  );
}

function ManagersPanel({ hotelId }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });

  const load = useCallback(() => {
    adminHotelManagers(hotelId).then(setList).catch((e) => setErr(e.message));
  }, [hotelId]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setErr("");
    try {
      await adminAddHotelManager(hotelId, form);
      setForm({ email: "", password: "", firstName: "", lastName: "" });
      setCreating(false);
      load();
    } catch (e) { setErr(e.message); }
  }
  async function remove(userId) {
    if (!window.confirm("Remove this partner's access to this hotel?")) return;
    try { await adminRemoveHotelManager(hotelId, userId); load(); }
    catch (e) { setErr(e.message); }
  }

  async function resetPwd(userId, email) {
    const newPwd = window.prompt(`Reset password for ${email}\n\nEnter a new password (min 6 characters):`);
    if (!newPwd) return;
    if (newPwd.length < 6) { setErr("Password must be at least 6 characters."); return; }
    try {
      await adminResetHotelManagerPassword(hotelId, userId, newPwd);
      window.alert(`Password reset for ${email}.\n\nGive the partner their new password.`);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="nzad-panel ad-mgr">
      <div className="nzad-panel-head">
        <h3>Hotel partner accounts</h3>
        {!creating && <button className="nzad-btn" onClick={() => setCreating(true)}>+ Add partner</button>}
      </div>
      <p className="nzad-sub">These are the people at the hotel who log into the partner portal to confirm bookings and manage availability.</p>
      {err && <ErrorBox msg={err} />}

      {creating && (
        <div className="nzad-mgr-form">
          <div className="nzad-grid2">
            <div className="nzad-mgr-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="reception@hotel.dz" />
            </div>
            <div className="nzad-mgr-field">
              <label>Password (initial)</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <div className="nzad-mgr-field">
              <label>First name</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="nzad-mgr-field">
              <label>Last name</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="nzad-mgr-actions">
            <button className="nzad-btn ghost" onClick={() => { setCreating(false); setForm({ email: "", password: "", firstName: "", lastName: "" }); }}>Cancel</button>
            <button className="nzad-btn primary" onClick={create}>Create partner account</button>
          </div>
        </div>
      )}

      {list && list.length === 0 && !creating && (
        <span className="nzad-empty-inline">No partner accounts yet for this hotel.</span>
      )}
      {list && list.length > 0 && (
        <table className="nzad-table">
          <thead><tr><th>Email</th><th>Name</th><th>Added</th><th></th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.email}</strong></td>
                <td>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</td>
                <td className="nzad-dim">{fmtDT(u.createdAt)}</td>
                <td>
                  <button className="nzad-link" onClick={() => resetPwd(u.id, u.email)}>Reset password</button>
                  <span className="nzad-sep">·</span>
                  <button className="nzad-link-danger" onClick={() => remove(u.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .nzad-mgr { margin-top: 28px; }
        .nzad-sub { font-size: 13px; color: var(--gray-400); margin-bottom: 14px; line-height: 1.5; }
        .nzad-mgr-form { background: var(--cream); padding: 18px; border-radius: var(--r-sm); margin-bottom: 16px; }
        .nzad-mgr-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
        .nzad-link-danger { background: none; border: none; color: var(--red); font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; padding: 0; }
        .nzad-link { background: none; border: none; color: var(--ink); font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; padding: 0; text-decoration: underline; }
        .nzad-sep { color: var(--gray-300); margin: 0 8px; font-size: 12px; }
        .nzad-dim { color: var(--gray-400); font-size: 12px; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        .nzad-mgr-field label { display: block; font-size: 11.5px; font-weight: 700; color: var(--gray-400); margin-bottom: 5px; }
        .nzad-mgr-field input {
          width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; outline: none; font-family: inherit;
        }
        .nzad-mgr-field input:focus { border-color: var(--red); }
      `}</style>
    </div>
  );
}

// =============================================================================
// BOOKINGS MANAGER
// =============================================================================
// =============================================================================
// Pagination — compact numbered-page control
// -----------------------------------------------------------------------------
// Reusable for any list that uses offset/limit pagination. Shows first,
// last, and a window around the current page with ellipses where ranges
// are skipped:
//
//   1 … 5 [6] 7 … 24
//
// Props:
//   - page: current 1-indexed page
//   - totalPages: total number of pages
//   - onChange: (newPage) => void
// =============================================================================
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  // Build the list of page numbers to render with ellipsis placeholders.
  // Strategy: always show 1 and totalPages; show page ± 1 if in range; use
  // "…" sentinel where there's a gap.
  function pagesList() {
    const out = new Set([1, totalPages, page, page - 1, page + 1]);
    const valid = [...out].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of valid) {
      if (prev && p - prev > 1) result.push("…");
      result.push(p);
      prev = p;
    }
    return result;
  }

  return (
    <nav className="nzad-pg" aria-label="Pagination">
      <button
        className="nzad-pg-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      {pagesList().map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="nzad-pg-gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            className={`nzad-pg-num${p === page ? " on" : ""}`}
            onClick={() => onChange(p)}
            disabled={p === page}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className="nzad-pg-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
      <style jsx>{`
        .nzad-pg {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          margin-top: 18px;
          flex-wrap: wrap;
        }
        .nzad-pg-btn, .nzad-pg-num {
          background: #fff;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          padding: 7px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          color: var(--ink);
          min-width: 36px;
          transition: border-color 0.15s, background 0.15s;
        }
        .nzad-pg-btn:hover:not(:disabled),
        .nzad-pg-num:hover:not(:disabled) {
          border-color: var(--ink);
        }
        .nzad-pg-btn:disabled, .nzad-pg-num:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .nzad-pg-num.on {
          background: var(--ink);
          color: #fff;
          border-color: var(--ink);
          opacity: 1;
          cursor: default;
        }
        .nzad-pg-gap {
          padding: 0 4px;
          color: var(--gray-400);
          font-size: 12.5px;
          font-weight: 700;
        }
      `}</style>
    </nav>
  );
}

function BookingsManager() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null); // booking id for the detail panel

  // ---- Filter state -------------------------------------------------------
  // Each filter is a simple controlled value. `searchInput` is what the
  // user is typing; `search` is the debounced value actually sent to the
  // API (so we don't fire a request on every keystroke).
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // ---- Pagination state ---------------------------------------------------
  // Page is 1-indexed (matches the backend's pagination shape).
  // pageSize is admin-controlled via a dropdown (10 / 25 / 50 / 100) so
  // power users can scan large volumes without paging through them.
  // total/totalPages come from the backend response on every load.
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce the search box — 300ms after the user stops typing, we promote
  // searchInput to search, which triggers a re-fetch via the load callback.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Whenever filters OR pageSize change, reset to page 1. Otherwise a user
  // on page 5 who applies a new filter (or switches from 25 to 100 per
  // page) would land on "page 5 of 1" — meaningless.
  useEffect(() => {
    setPage(1);
  }, [status, paymentStatus, from, to, search, pageSize]);

  const load = useCallback(() => {
    const params = { page, limit: pageSize };
    if (status) params.status = status;
    if (paymentStatus) params.paymentStatus = paymentStatus;
    if (from) params.from = from;
    if (to) params.to = to;
    if (search) params.search = search;
    adminBookings(params).then((r) => {
      setData(r.data || []);
      // Backend returns { data, pagination: { page, limit, total, totalPages } }
      setTotal(r.pagination?.total ?? (r.data || []).length);
      setTotalPages(r.pagination?.totalPages ?? 1);
    }).catch((e) => setErr(e.message));
  }, [status, paymentStatus, from, to, search, page, pageSize]);
  useEffect(() => { load(); }, [load]);

  const hasFilters = !!(status || paymentStatus || from || to || search);
  function clearFilters() {
    setStatus(""); setPaymentStatus(""); setFrom(""); setTo("");
    setSearchInput(""); setSearch("");
  }

  async function setBookingStatus(id, newStatus) {
    try {
      await adminUpdateBookingStatus(id, newStatus);
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <PageHead title="Bookings" subtitle="All reservations across every hotel" />
      {err && <ErrorBox msg={err} />}

      {/* ---- Filter bar ---- */}
      <div className="nzad-filters">
        <input
          type="text"
          className="nzad-filter-search"
          placeholder="Search reference, name, or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW", "REFUNDED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payments</option>
          {["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="nzad-filter-date">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="nzad-filter-date">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        {hasFilters && (
          <button className="nzad-btn-ghost nzad-filter-clear" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {!data && !err && <Loading />}

      {data && data.length === 0 && (
        <div className="nzad-panel">
          <span className="nzad-empty-inline">
            {hasFilters
              ? "No bookings match these filters. Try clearing them or widening the search."
              : "No bookings yet."}
          </span>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="nzad-panel">
          <div className="nzad-result-row">
            <div className="nzad-result-count">
              {total === 0
                ? `0 bookings${hasFilters ? " (filtered)" : ""}`
                : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}${hasFilters ? " (filtered)" : ""}`}
            </div>
            <label className="nzad-page-size">
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>per page</span>
            </label>
          </div>
          <table className="nzad-table">
            <thead>
              <tr><th>Reference</th><th>Guest</th><th>Hotel</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="nzad-brow" onClick={() => setSelected(b.id)}>
                  <td><strong>{b.reference}</strong></td>
                  <td>{b.guest?.firstName} {b.guest?.lastName}<br /><span className="nzad-dim">{b.guest?.phone}</span></td>
                  <td>{b.hotel?.name}</td>
                  <td className="nzad-dim">{(b.checkIn || "").slice(0, 10)} → {(b.checkOut || "").slice(0, 10)}</td>
                  <td>{fmt(b.pricing?.total)}</td>
                  <td><span className={`ad-bstatus s-${b.status}`}>{b.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={b.status} onChange={(e) => setBookingStatus(b.id, e.target.value)}>
                      {["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW", "REFUNDED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---- Pagination controls ----
              Shown when there's more than one page. Prev/Next buttons plus
              a compact page-number row (first, current ± 1, last with
              ellipses) — keeps the UI tidy even with many pages. */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {selected && (
        <BookingDetailPanel
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); }}
        />
      )}

      <style jsx>{`
        .nzad-filters {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
          padding: 14px; background: var(--cream); border-radius: var(--r-md);
          margin-bottom: 18px;
        }
        .nzad-filters input[type="text"],
        .nzad-filters select,
        .nzad-filters input[type="date"] {
          padding: 9px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; font-family: inherit;
          background: white;
        }
        .nzad-filter-search { flex: 1; min-width: 240px; }
        .nzad-filter-date {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--gray-400); font-weight: 600;
        }
        .nzad-filter-clear { padding: 9px 14px; }
        .nzad-result-row {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; margin-bottom: 12px; flex-wrap: wrap;
        }
        .nzad-result-count {
          font-size: 12px; color: var(--gray-400); font-weight: 600;
          margin-bottom: 0;
        }
        .nzad-page-size {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--gray-400); font-weight: 600;
        }
        .nzad-page-size select {
          padding: 5px 8px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          font-size: 12.5px;
          font-weight: 700;
          background: #fff;
          color: var(--ink);
          font-family: inherit;
          cursor: pointer;
        }
        .nzad-page-size select:hover { border-color: var(--ink); }
        .nzad-brow { cursor: pointer; }
        .nzad-brow:hover { background: var(--gray-100); }
        .nzad-dim { color: var(--gray-400); font-size: 12px; }
        .nzad-empty-inline { color: var(--gray-400); font-size: 13px; }
        .nzad-bstatus { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 980px; }
        .s-CONFIRMED, .s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
        .s-PENDING { background: #FFF4E0; color: #9A6700; }
        .s-REJECTED, .s-CANCELLED, .s-NO_SHOW, .s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }
        select { padding: 6px 8px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 12px; }
        @media (max-width: 720px) {
          .nzad-filters { flex-direction: column; align-items: stretch; }
          .nzad-filter-search { min-width: 0; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Booking detail modal — shows everything about one booking and lets
// the admin confirm or reject it directly.
// =============================================================================
function BookingDetailPanel({ id, onClose, onChanged }) {
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminBookingDetail(id).then(setB).catch((e) => setErr(e.message));
  }, [id]);

  async function confirm() {
    setBusy(true);
    try {
      await adminUpdateBookingStatus(id, "CONFIRMED");
      onChanged();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function reject() {
    if (!window.confirm("Reject this booking? The guest will need to be refunded.")) return;
    setBusy(true);
    try {
      await adminUpdateBookingStatus(id, "REJECTED");
      onChanged();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="bd-back" onClick={onClose}>
      <div className="bd-panel" onClick={(e) => e.stopPropagation()}>
        <button className="bd-close" onClick={onClose} aria-label="Close">×</button>
        {err && <ErrorBox msg={err} />}
        {!b && !err && <Loading />}
        {b && (
          <>
            <div className="bd-head">
              <div>
                <div className="bd-ref">{b.reference}</div>
                <span className={`ad-bstatus s-${b.status}`}>{b.status}</span>
              </div>
              <div className="bd-total">
                <span>Total</span>
                <strong>{fmt(b.pricing?.total)}</strong>
              </div>
            </div>

            <div className="bd-grid">
              <Section title="Guest">
                <Row label="Name" value={`${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim()} />
                <Row label="Email" value={b.guest?.email} link={b.guest?.email ? `mailto:${b.guest.email}` : null} />
                <Row label="Phone" value={b.guest?.phone} link={b.guest?.phone ? `https://wa.me/${(b.guest.phone || "").replace(/\D/g, "")}` : null} />
              </Section>

              <Section title="Stay">
                <Row label="Hotel" value={b.hotel?.name} />
                <Row label="City" value={b.hotel?.city} />
                <Row label="Check-in" value={(b.checkIn || "").slice(0, 10)} />
                <Row label="Check-out" value={(b.checkOut || "").slice(0, 10)} />
                <Row label="Nights" value={b.nights} />
              </Section>

              <Section title="Rooms">
                {(b.rooms || []).map((r, i) => (
                  <Row key={i} label={r.type || `Room ${i + 1}`} value={`× ${r.quantity} · ${fmt(r.pricePerNight)} / night`} />
                ))}
              </Section>

              <Section title="Pricing">
                <Row label="Subtotal" value={fmt(b.pricing?.subtotal)} />
                {b.pricing?.discount > 0 && (
                  <Row label="Discount" value={`− ${fmt(b.pricing.discount)}`} />
                )}
                <Row label="Taxes & fees" value="Included" />
                <Row label="Total" value={fmt(b.pricing?.total)} strong />
              </Section>

              <Section title="Payment">
                <Row label="Method" value={b.payment?.method} />
                <Row label="Status" value={b.payment?.status} />
              </Section>

              {b.specialRequests && (
                <Section title="Special requests" full>
                  <p className="bd-notes">{b.specialRequests}</p>
                </Section>
              )}

              <Section title="Timestamps" full>
                <Row label="Created" value={fmtDT(b.createdAt)} />
                {b.confirmedAt && <Row label="Confirmed" value={fmtDT(b.confirmedAt)} />}
                {b.cancelledAt && <Row label="Cancelled" value={fmtDT(b.cancelledAt)} />}
                {b.cancellationReason && <Row label="Reason" value={b.cancellationReason} />}
              </Section>
            </div>

            {b.status === "PENDING" && (
              <div className="bd-actions">
                <button className="bd-reject" onClick={reject} disabled={busy}>Reject booking</button>
                <button className="bd-confirm" onClick={confirm} disabled={busy}>Confirm booking</button>
              </div>
            )}
          </>
        )}

        <style jsx>{`
          .bd-back {
            position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.45);
            display: flex; align-items: center; justify-content: center;
            padding: 24px; overflow-y: auto;
          }
          .bd-panel {
            position: relative; background: #fff; border-radius: var(--r-lg);
            max-width: 760px; width: 100%; max-height: 92vh; overflow-y: auto;
            padding: 28px 32px;
          }
          .bd-close {
            position: absolute; top: 14px; right: 14px;
            width: 36px; height: 36px; border-radius: 50%; border: none;
            background: var(--gray-100); font-size: 22px; line-height: 1; cursor: pointer;
          }
          .bd-head {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--gray-100);
          }
          .bd-ref { font-size: 22px; font-weight: 800; letter-spacing: 0.02em; margin-bottom: 8px; color: var(--ink); }
          .bd-total { text-align: right; }
          .bd-total span { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 4px; }
          .bd-total strong { font-size: 22px; font-weight: 800; color: var(--ink); }
          .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .bd-notes { font-size: 14px; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; }
          .bd-actions {
            display: flex; gap: 10px; justify-content: flex-end;
            margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--gray-100);
          }
          .bd-confirm, .bd-reject {
            padding: 12px 22px; border-radius: var(--r-sm); border: none; cursor: pointer;
            font-size: 14px; font-weight: 700; font-family: inherit;
          }
          .bd-confirm { background: var(--teal); color: #fff; }
          .bd-reject { background: var(--red-soft); color: var(--red-deep); }
          .bd-confirm:disabled, .bd-reject:disabled { opacity: 0.6; cursor: default; }
          @media (max-width: 640px) {
            .bd-grid { grid-template-columns: 1fr; }
            .bd-panel { padding: 22px; }
          }
        `}</style>
      </div>
    </div>
  );
}

// =============================================================================
// CUSTOMERS MANAGER — registered customer accounts
// -----------------------------------------------------------------------------
// Read-only list of CUSTOMER-role users. Search by name / email / phone,
// click a row to open a detail panel showing the user's bookings + totals.
// Pagination via the same Pagination component used by BookingsManager.
//
// Deferred to a later wave:
//   - editing user details (needs audit logging)
//   - disabling / deleting (needs GDPR-style deletion policy)
//   - exporting to CSV
// =============================================================================
function CustomersManager() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  // Search + pagination — same pattern as BookingsManager for consistency.
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);
  // Reset to page 1 when search OR pageSize changes.
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const load = useCallback(() => {
    const params = { page, limit: pageSize };
    if (search) params.search = search;
    adminUsers(params).then((r) => {
      setData(r.data || []);
      setTotal(r.pagination?.total ?? (r.data || []).length);
      setTotalPages(r.pagination?.totalPages ?? 1);
    }).catch((e) => setErr(e.message));
  }, [search, page, pageSize]);
  useEffect(() => { load(); }, [load]);

  function clearSearch() {
    setSearchInput(""); setSearch("");
  }

  return (
    <div>
      <div className="nzad-page-head">
        <h1 className="display">Customers</h1>
        <p>Registered customer accounts. Read-only view.</p>
      </div>

      {err && <div className="nzad-err">{err}</div>}

      <div className="nzad-filters">
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="nzad-filter-search"
        />
        {search && (
          <button className="nzad-clear" onClick={clearSearch}>Clear</button>
        )}
      </div>

      {data === null && <div className="nzad-load">Loading…</div>}
      {data !== null && data.length === 0 && (
        <div className="nzad-empty">
          {search ? "No customers match that search." : "No customer accounts yet."}
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <div className="nzad-result-row">
            <div className="nzad-result-count">
              {total === 0
                ? "0 customers"
                : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}${search ? " (filtered)" : ""}`}
            </div>
            <label className="nzad-page-size">
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>per page</span>
            </label>
          </div>
          <table className="nzad-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Bookings</th>
                <th>Lifetime spend</th>
                <th>Joined</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="nzad-brow" onClick={() => setSelected(u.id)}>
                  <td>
                    <strong>{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}</strong>
                    <br />
                    <span className="nzad-dim">{u.email}</span>
                  </td>
                  <td className="nzad-dim">{u.phone || "—"}</td>
                  <td><strong>{u.bookingsCount}</strong></td>
                  <td>{u.lifetimeRevenue > 0 ? fmt(u.lifetimeRevenue) : <span className="nzad-dim">—</span>}</td>
                  <td className="nzad-dim">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="nzad-dim">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : <span className="nzad-dim">never</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={(p) => setPage(p)} />
          )}
        </div>
      )}

      {selected && (
        <CustomerDetailPanel id={selected} onClose={() => setSelected(null)} />
      )}

      <style jsx>{`
        .nzad-page-head { margin-bottom: 22px; }
        .nzad-page-head h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 4px; }
        .nzad-page-head p { font-size: 13.5px; color: var(--gray-400); }
        .nzad-filters {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
          padding: 14px; background: var(--cream); border-radius: var(--r-md);
          margin-bottom: 18px;
        }
        .nzad-filter-search {
          flex: 1; min-width: 240px; padding: 9px 12px;
          border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          font-size: 13.5px; font-family: inherit; outline: none; background: #fff;
        }
        .nzad-filter-search:focus { border-color: var(--ink); }
        .nzad-clear {
          background: var(--red-soft); color: var(--red-deep); border: none;
          border-radius: 980px; padding: 7px 14px; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }
        .nzad-result-row {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; margin-bottom: 10px; flex-wrap: wrap;
        }
        .nzad-result-count { font-size: 12.5px; color: var(--gray-400); margin-bottom: 0; font-weight: 600; }
        .nzad-page-size {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--gray-400); font-weight: 600;
        }
        .nzad-page-size select {
          padding: 5px 8px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm);
          font-size: 12.5px;
          font-weight: 700;
          background: #fff;
          color: var(--ink);
          font-family: inherit;
          cursor: pointer;
        }
        .nzad-page-size select:hover { border-color: var(--ink); }
        .nzad-err { background: var(--red-soft); color: var(--red-deep); padding: 12px 14px; border-radius: var(--r-sm); margin-bottom: 14px; font-size: 13.5px; }
        .nzad-load, .nzad-empty { padding: 40px; text-align: center; color: var(--gray-400); font-size: 14px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// Customer detail panel — modal showing one customer's profile + bookings.
// -----------------------------------------------------------------------------
// Uses the same modal pattern (portal + global styles) we adopted for the
// /account booking modal so it positions reliably regardless of ancestor
// layout. Read-only.
// =============================================================================
function CustomerDetailPanel({ id, onClose }) {
  const [u, setU] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminUserDetail(id).then(setU).catch((e) => setErr(e.message));
  }, [id]);

  // ESC closes the panel.
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock page scroll while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const fullName = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "";
  const totalSpend = u && u.bookings
    ? u.bookings
        .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
        .reduce((sum, b) => sum + Number(b.pricing?.total || 0), 0)
    : 0;
  const bookingCount = u && u.bookings ? u.bookings.length : 0;

  return (
    <div className="cd-back" onClick={onClose}>
      <div className="cd-panel" onClick={(e) => e.stopPropagation()}>
        <button className="cd-close" onClick={onClose} aria-label="Close">×</button>

        {err && <div className="cd-err">{err}</div>}
        {!u && !err && <div className="cd-load">Loading…</div>}

        {u && (
          <>
            <div className="cd-head">
              <div>
                <div className="cd-name display">{fullName || u.email}</div>
                <div className="cd-email">{u.email}</div>
                {u.phone && <div className="cd-phone">{u.phone}</div>}
              </div>
              <div className="cd-badges">
                {u.isActive ? (
                  <span className="cd-badge ok">Active</span>
                ) : (
                  <span className="cd-badge off">Disabled</span>
                )}
                {u.emailVerified && <span className="cd-badge soft">Email verified</span>}
                <span className="cd-badge soft">{(u.preferredLang || "fr").toUpperCase()}</span>
              </div>
            </div>

            <div className="cd-stats">
              <div className="cd-stat">
                <div className="cd-stat-k">Bookings</div>
                <div className="cd-stat-v">{bookingCount}</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-k">Lifetime spend</div>
                <div className="cd-stat-v">{totalSpend > 0 ? fmt(totalSpend) : "—"}</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-k">Joined</div>
                <div className="cd-stat-v small">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-k">Last seen</div>
                <div className="cd-stat-v small">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "never"}</div>
              </div>
            </div>

            <div className="cd-section">
              <h3>Booking history</h3>
              {bookingCount === 0 ? (
                <div className="cd-empty">No bookings yet.</div>
              ) : (
                <table className="cd-bookings">
                  <thead>
                    <tr><th>Reference</th><th>Hotel</th><th>Dates</th><th>Total</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {u.bookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>{b.reference}</strong></td>
                        <td>{b.hotel?.name}</td>
                        <td className="cd-dim">{(b.checkIn || "").slice(0, 10)} → {(b.checkOut || "").slice(0, 10)}</td>
                        <td>{fmt(b.pricing?.total)}</td>
                        <td><span className={`cd-st s-${b.status}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        <style jsx>{`
          .cd-back {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            padding: 24px; overflow-y: auto;
          }
          .cd-panel {
            position: relative; background: #fff;
            border-radius: var(--r-lg);
            max-width: 760px; width: 100%; max-height: 92vh;
            overflow-y: auto;
            padding: 32px 36px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.3);
          }
          .cd-close {
            position: absolute; top: 14px; right: 14px;
            width: 36px; height: 36px; border-radius: 50%;
            border: none; background: var(--gray-100);
            font-size: 22px; line-height: 1; cursor: pointer;
          }
          .cd-close:hover { background: var(--gray-200); }
          .cd-err { background: var(--red-soft); color: var(--red-deep); padding: 12px; border-radius: var(--r-sm); }
          .cd-load { padding: 40px; text-align: center; color: var(--gray-400); }

          .cd-head {
            display: flex; justify-content: space-between; align-items: flex-start;
            gap: 18px; margin-bottom: 22px; padding-bottom: 20px;
            border-bottom: 1px solid var(--gray-100);
          }
          .cd-name { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px; color: var(--ink); }
          .cd-email { font-size: 14px; color: var(--ink-2); font-weight: 600; }
          .cd-phone { font-size: 13px; color: var(--gray-400); margin-top: 2px; }
          .cd-badges { display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
          .cd-badge { font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 980px; letter-spacing: 0.04em; }
          .cd-badge.ok { background: var(--teal-soft); color: var(--teal); }
          .cd-badge.off { background: var(--red-soft); color: var(--red-deep); }
          .cd-badge.soft { background: var(--gray-100); color: var(--ink-2); }

          .cd-stats {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
            margin-bottom: 26px;
          }
          .cd-stat {
            background: var(--cream); border: 1px solid var(--gray-100);
            border-radius: var(--r-sm); padding: 12px 14px;
          }
          .cd-stat-k {
            font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em;
            text-transform: uppercase; color: var(--gray-400); margin-bottom: 6px;
          }
          .cd-stat-v { font-size: 17px; font-weight: 700; color: var(--ink); }
          .cd-stat-v.small { font-size: 13.5px; }

          .cd-section h3 {
            font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--gray-400); margin-bottom: 12px;
          }
          .cd-empty {
            padding: 28px; text-align: center; color: var(--gray-400);
            background: var(--cream); border-radius: var(--r-sm); font-size: 13.5px;
          }
          .cd-bookings {
            width: 100%; border-collapse: collapse;
            background: #fff; border: 1px solid var(--gray-100); border-radius: var(--r-sm);
            overflow: hidden;
          }
          .cd-bookings th, .cd-bookings td {
            padding: 10px 14px; font-size: 13px; text-align: left;
            border-bottom: 1px solid var(--gray-100);
          }
          .cd-bookings th {
            font-size: 10.5px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.06em; color: var(--gray-400); background: var(--cream);
          }
          .cd-bookings tr:last-child td { border-bottom: none; }
          .cd-dim { color: var(--gray-400); }
          .cd-st {
            font-size: 10.5px; font-weight: 700; padding: 3px 9px;
            border-radius: 980px; letter-spacing: 0.04em;
          }
          .cd-st.s-CONFIRMED, .cd-st.s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
          .cd-st.s-PENDING { background: #FFF4E0; color: #9A6700; }
          .cd-st.s-REJECTED, .cd-st.s-CANCELLED, .cd-st.s-NO_SHOW, .cd-st.s-REFUNDED {
            background: var(--red-soft); color: var(--red-deep);
          }

          @media (max-width: 720px) {
            .cd-panel { padding: 24px 22px; }
            .cd-head { flex-direction: column; }
            .cd-stats { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </div>
    </div>
  );
}

function Section({ title, children, full }) {
  return (
    <div className={`bd-section ${full ? "full" : ""}`}>
      <h4>{title}</h4>
      <div className="bd-rows">{children}</div>
      <style jsx>{`
        .bd-section.full { grid-column: 1 / -1; }
        h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 10px; }
        .bd-rows { display: flex; flex-direction: column; gap: 6px; }
      `}</style>
    </div>
  );
}
function Row({ label, value, link, strong }) {
  if (!value && value !== 0) return null;
  return (
    <div className="bd-row">
      <span>{label}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer"><strong>{value}</strong></a>
            : <strong className={strong ? "is-strong" : ""}>{value}</strong>}
      <style jsx>{`
        .bd-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; }
        .bd-row > span { color: var(--gray-400); font-weight: 500; }
        .bd-row strong { color: var(--ink); font-weight: 700; }
        .bd-row .is-strong { font-size: 15px; }
        .bd-row a { text-decoration: none; color: var(--red); }
        .bd-row a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
function fmtDT(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

// =============================================================================
// SHARED BITS
// =============================================================================
function PageHead({ title, subtitle, action }) {
  return (
    <div className="nzad-pagehead">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
      <style jsx>{`
        .nzad-pagehead { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
        .nzad-pagehead h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .nzad-pagehead p { font-size: 13.5px; color: var(--gray-400); margin-top: 3px; }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="nzad-stat">
      <div className="nzad-stat-value display">{value}</div>
      <div className="nzad-stat-label">{label}</div>
      <style jsx>{`
        .nzad-stat { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 18px; }
        .nzad-stat-value { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
        .nzad-stat-label { font-size: 12px; color: var(--gray-400); font-weight: 600; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function Field({ label, v, onChange, type = "text", area, rtl, required }) {
  return (
    <div className="nzad-field">
      <label>
        {label}
        {required && <span className="nzad-req">*</span>}
      </label>
      {area
        ? <textarea value={v} onChange={(e) => onChange(e.target.value)} dir={rtl ? "rtl" : "ltr"} rows={3} />
        : <input type={type} value={v} onChange={(e) => onChange(e.target.value)} dir={rtl ? "rtl" : "ltr"} />}
      <style jsx>{`
        .nzad-field label { display: block; font-size: 11.5px; font-weight: 700; color: var(--gray-400); margin-bottom: 5px; }
        .nzad-req { color: var(--red); font-weight: 800; margin-left: 3px; }
        .nzad-field input, .nzad-field textarea {
          width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; outline: none; font-family: inherit;
        }
        .nzad-field input:focus, .nzad-field textarea:focus { border-color: var(--red); }
        .nzad-field textarea { resize: vertical; }
      `}</style>
    </div>
  );
}

function Toggle({ label, v, onChange }) {
  return (
    <button
      className={`nzad-toggle ${v ? "on" : ""}`}
      onClick={() => onChange(!v)}
      type="button"
      role="switch"
      aria-checked={v}
    >
      <span className="nzad-toggle-track">
        <span className="nzad-toggle-thumb" />
      </span>
      <span className="nzad-toggle-label">{label}</span>
      <style jsx>{`
        .nzad-toggle {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 14px 8px 8px;
          border: 1.5px solid var(--gray-200);
          background: #fff;
          border-radius: 980px;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
        }
        .nzad-toggle:hover { border-color: var(--gray-300); }
        .nzad-toggle.on {
          border-color: var(--red);
          background: #fff;
          box-shadow: 0 1px 3px rgba(230, 57, 70, 0.18);
        }
        .nzad-toggle-track {
          position: relative;
          display: inline-block;
          width: 32px;
          height: 18px;
          border-radius: 999px;
          background: var(--gray-200);
          transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }
        .nzad-toggle.on .nzad-toggle-track { background: var(--red); }
        .nzad-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nzad-toggle.on .nzad-toggle-thumb { transform: translateX(14px); }
        .nzad-toggle-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--gray-400);
          transition: color 0.18s;
          white-space: nowrap;
        }
        .nzad-toggle.on .nzad-toggle-label { color: var(--ink); }
      `}</style>
    </button>
  );
}

function Loading() {
  return <div className="nzad-loading">Loading…<style jsx>{`
    .nzad-loading { padding: 40px; text-align: center; color: var(--gray-400); font-size: 14px; }
  `}</style></div>;
}

function ErrorBox({ msg }) {
  return <div className="nzad-errbox">{msg}<style jsx>{`
    .nzad-errbox {
      padding: 12px 14px; background: var(--red-soft); color: var(--red-deep);
      border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-bottom: 16px;
    }
  `}</style></div>;
}
