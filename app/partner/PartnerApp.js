"use client";

// =============================================================================
// Nzzor — Hotel Partner Portal
// Receptionists log in here to confirm/reject pending bookings and mark days
// as closed. Designed mobile-first because partners work on phones.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import LogoMark from "../../components/LogoMark";
import { useBookingAlerts } from "../../lib/bookingAlerts";
import { printArrivalWorksheet } from "../../lib/arrivalWorksheet";
import {
  getPartnerToken, clearPartnerToken, partnerLogin,
  partnerMe, partnerBookings, partnerBookingDetail,
  partnerConfirmBooking, partnerRejectBooking,
  partnerAvailability, partnerSetAvailability,
} from "../../lib/partnerApi";

export default function PartnerApp() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [tab, setTab] = useState("bookings");
  const [hotelIdx, setHotelIdx] = useState(0); // which hotel is selected (if multiple)

  useEffect(() => {
    if (!getPartnerToken()) { setLoadingMe(false); return; }
    partnerMe().then(setMe).catch(() => clearPartnerToken()).finally(() => setLoadingMe(false));
  }, []);

  if (loadingMe) {
    return <div className="p-loading">Loading…<style jsx>{`.p-loading{min-height:60vh;display:flex;align-items:center;justify-content:center;color:var(--gray-400);font-size:14px;}`}</style></div>;
  }
  if (!me) return <PartnerLogin onLogin={() => partnerMe().then(setMe)} />;

  const hotels = me.hotels || [];
  const hotel = hotels[hotelIdx] || null;

  return (
    <div className="p-shell">
      {/* TOP BAR */}
      <header className="p-top">
        <Link href="/" className="p-brand">
          <LogoMark size={24} />
          <span>Nzzor <em>Partner</em></span>
        </Link>
        <div className="p-top-right">
          <span className="p-user">{me.user?.firstName || me.user?.email}</span>
          <button className="p-logout" onClick={() => { clearPartnerToken(); setMe(null); }}>Sign out</button>
        </div>
      </header>

      {/* HOTEL SELECTOR (if more than one) */}
      {hotels.length > 1 && (
        <div className="p-hotelsel">
          <span>Hotel:</span>
          <select value={hotelIdx} onChange={(e) => setHotelIdx(Number(e.target.value))}>
            {hotels.map((h, i) => <option key={h.id} value={i}>{h.nameEn || h.nameFr}</option>)}
          </select>
        </div>
      )}

      {/* TABS */}
      <nav className="p-tabs">
        <button className={`p-tab ${tab === "bookings" ? "on" : ""}`} onClick={() => setTab("bookings")}>Bookings</button>
        <button className={`p-tab ${tab === "availability" ? "on" : ""}`} onClick={() => setTab("availability")}>Availability</button>
      </nav>

      <main className="p-main">
        {!hotel && <div className="p-empty">No hotel is linked to this account yet. Contact Allouni.</div>}
        {hotel && tab === "bookings" && <PartnerBookings hotelId={hotel.id} hotelName={hotel.nameEn || hotel.nameFr} />}
        {hotel && tab === "availability" && <PartnerAvailability hotelId={hotel.id} hotelName={hotel.nameEn || hotel.nameFr} />}
      </main>

      <style jsx>{`
        .p-shell { min-height: 100vh; background: var(--cream); }
        .p-top {
          background: var(--ink); color: #fff;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 22px;
        }
        .p-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #fff; font-weight: 600; font-size: 15px; }
        .p-brand em { font-style: normal; font-weight: 500; color: rgba(255,255,255,0.7); margin-inline-start: 4px; font-size: 13px; }
        .p-top-right { display: flex; align-items: center; gap: 14px; }
        .p-user { font-size: 13px; color: rgba(255,255,255,0.8); }
        .p-logout { background: rgba(255,255,255,0.12); color: #fff; border: none; padding: 7px 14px; border-radius: 980px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .p-hotelsel { background: #fff; border-bottom: 1px solid var(--gray-200); padding: 12px 22px; display: flex; align-items: center; gap: 10px; font-size: 13px; }
        .p-hotelsel select { padding: 7px 10px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 13px; font-family: inherit; }
        .p-tabs { display: flex; background: #fff; border-bottom: 1px solid var(--gray-200); padding: 0 22px; }
        .p-tab { background: none; border: none; padding: 16px 4px; margin-inline-end: 24px; font-size: 14px; font-weight: 600; color: var(--gray-400); cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
        .p-tab.on { color: var(--ink); border-bottom-color: var(--red); }
        .p-main { padding: 22px; max-width: 1100px; margin: 0 auto; }
        .p-empty { background: #fff; border-radius: var(--r-lg); padding: 40px; text-align: center; color: var(--gray-400); font-size: 14px; }
        @media (max-width: 560px) {
          .p-top { padding: 12px 16px; }
          .p-brand em { display: none; }
          .p-user { display: none; }
          .p-main { padding: 16px; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// LOGIN
// =============================================================================
function PartnerLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await partnerLogin(email, password); onLogin(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="pl-shell">
      <form className="pl-card" onSubmit={submit}>
        <div className="pl-head">
          <LogoMark size={32} />
          <div>
            <strong>Nzzor</strong>
            <em>Hotel partner portal</em>
          </div>
        </div>
        <h1>Sign in</h1>
        <p>For hotel staff. Use the credentials Allouni gave you.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="pl-err">{err}</div>}
        <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <style jsx>{`
        .pl-shell { min-height: 100vh; background: var(--ink); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .pl-card { background: #fff; border-radius: var(--r-lg); padding: 36px 32px; width: 100%; max-width: 420px; }
        .pl-head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .pl-head strong { display: block; font-size: 18px; font-weight: 700; }
        .pl-head em { display: block; font-style: normal; font-size: 11px; color: var(--gray-400); letter-spacing: 0.06em; text-transform: uppercase; margin-top: 2px; }
        h1 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px; }
        p { font-size: 13.5px; color: var(--gray-400); margin-bottom: 20px; }
        label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 12px; }
        input { width: 100%; padding: 12px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; }
        input:focus { border-color: var(--ink); }
        .pl-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
        button { width: 100%; margin-top: 18px; padding: 14px; background: var(--red); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        button:disabled { opacity: 0.6; cursor: default; }
      `}</style>
    </div>
  );
}

// =============================================================================
// BOOKINGS TAB — pending first, then everything else
// =============================================================================
function PartnerBookings({ hotelId, hotelName }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  // Initial load shows the spinner. Subsequent polls refresh silently
  // so the page doesn't blank out every 20 seconds.
  const initialLoad = useCallback(() => {
    setList(null); setErr("");
    partnerBookings({ hotelId }).then(setList).catch((e) => setErr(e.message));
  }, [hotelId]);
  const silentRefresh = useCallback(() => {
    partnerBookings({ hotelId }).then((next) => setList(next)).catch(() => {});
  }, [hotelId]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // Poll for new bookings every 20 seconds so the partner doesn't have to
  // refresh manually. Combined with the alert hook below, this is how new
  // bookings ring in.
  useEffect(() => {
    const t = setInterval(silentRefresh, 20_000);
    return () => clearInterval(t);
  }, [silentRefresh]);

  const pending = (list || []).filter((b) => b.status === "PENDING");
  const others = (list || []).filter((b) => b.status !== "PENDING");

  // Drive the audible + visual alert system from the live pending list.
  const { muted, setMuted } = useBookingAlerts(pending);

  if (err) return <div className="p-err">{err}</div>;
  if (!list) return <div className="p-loading2">Loading…</div>;

  return (
    <div>
      <div className="pb-head">
        <h2>Bookings <span>· {hotelName}</span></h2>
        <div className="pb-head-right">
          {pending.length > 0 && (
            <span className="pb-badge">{pending.length} awaiting your decision</span>
          )}
          <button
            className={`pb-mute ${muted ? "on" : ""}`}
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Sounds are muted — click to unmute" : "Mute booking sounds for this session"}
          >
            {muted ? "🔕 Muted" : "🔔 Sound on"}
          </button>
        </div>
      </div>

      {pending.length === 0 && others.length === 0 && (
        <div className="pb-empty">No bookings yet for this hotel.</div>
      )}

      {pending.length > 0 && (
        <section className="pb-section pending">
          <h3>Awaiting your decision</h3>
          <div className="pb-cards">
            {pending.map((b) => <BookingCard key={b.id} b={b} highlight onOpen={() => setSelected(b.id)} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="pb-section">
          <h3>All other bookings</h3>
          <div className="pb-cards">
            {others.map((b) => <BookingCard key={b.id} b={b} onOpen={() => setSelected(b.id)} />)}
          </div>
        </section>
      )}

      {selected && (
        <BookingDetailModal id={selected} onClose={() => setSelected(null)} onChanged={silentRefresh} />
      )}

      <style jsx>{`
        .pb-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .pb-head-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .pb-mute {
          background: #fff; border: 1.5px solid var(--gray-200); border-radius: 980px;
          padding: 7px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: inherit; color: var(--ink); transition: all .15s;
        }
        .pb-mute:hover { border-color: var(--ink); }
        .pb-mute.on { background: var(--gray-100); color: var(--gray-400); border-color: var(--gray-200); }
        h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        h2 span { font-size: 14px; font-weight: 500; color: var(--gray-400); }
        h3 { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 12px; }
        .pb-badge { background: #FFF4E0; color: #9A6700; padding: 6px 12px; border-radius: 980px; font-size: 12.5px; font-weight: 700; }
        .pb-empty { background: #fff; border-radius: var(--r-lg); padding: 40px; text-align: center; color: var(--gray-400); font-size: 14px; }
        .pb-section { margin-bottom: 30px; }
        .pb-section.pending h3 { color: #9A6700; }
        .pb-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
        .p-err { background: var(--red-soft); color: var(--red-deep); padding: 14px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600; }
        .p-loading2 { padding: 60px; text-align: center; color: var(--gray-400); font-size: 14px; }
      `}</style>
    </div>
  );
}

function BookingCard({ b, highlight, onOpen }) {
  return (
    <button className={`bc ${highlight ? "highlight" : ""}`} onClick={onOpen}>
      <div className="bc-top">
        <strong>{b.reference}</strong>
        <span className={`bc-st s-${b.status}`}>{b.status}</span>
      </div>
      <div className="bc-guest">{b.guest?.firstName} {b.guest?.lastName}</div>
      <div className="bc-dates">{(b.checkIn || "").slice(0, 10)} → {(b.checkOut || "").slice(0, 10)} <em>· {b.nights} {b.nights === 1 ? "night" : "nights"}</em></div>
      <div className="bc-foot">
        <span>{(b.rooms || []).map((r) => r.type).join(", ")}</span>
        <strong>{(b.pricing?.total || 0).toLocaleString()} DZD</strong>
      </div>
      <style jsx>{`
        .bc { background: #fff; border: 1.5px solid var(--gray-200); border-radius: var(--r-lg); padding: 16px; text-align: left; cursor: pointer; font-family: inherit; transition: border-color .15s, transform .15s; }
        .bc:hover { border-color: var(--ink); transform: translateY(-2px); }
        .bc.highlight { border-color: #E0B260; background: #FFFCF5; }
        .bc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .bc-top strong { font-size: 14px; font-weight: 800; letter-spacing: 0.02em; color: var(--ink); }
        .bc-st { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 980px; }
        .s-PENDING { background: #FFF4E0; color: #9A6700; }
        .s-CONFIRMED, .s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
        .s-REJECTED, .s-CANCELLED, .s-NO_SHOW, .s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }
        .bc-guest { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
        .bc-dates { font-size: 13px; color: var(--ink-2); margin-bottom: 12px; }
        .bc-dates em { font-style: normal; color: var(--gray-400); }
        .bc-foot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 10px; border-top: 1px solid var(--gray-100); }
        .bc-foot span { font-size: 12px; color: var(--gray-400); }
        .bc-foot strong { font-size: 14px; font-weight: 700; color: var(--ink); }
      `}</style>
    </button>
  );
}

// detail modal — confirm / reject buttons
function BookingDetailModal({ id, onClose, onChanged }) {
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { partnerBookingDetail(id).then(setB).catch((e) => setErr(e.message)); }, [id]);

  async function confirm() {
    setBusy(true); setErr("");
    try { await partnerConfirmBooking(id); onChanged(); onClose(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function reject() {
    const reason = window.prompt("Reason for rejecting this booking? (optional)");
    if (reason === null) return; // user pressed cancel
    setBusy(true); setErr("");
    try { await partnerRejectBooking(id, reason || ""); onChanged(); onClose(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="bd-back" onClick={onClose}>
      <div className="bd-panel" onClick={(e) => e.stopPropagation()}>
        <button className="bd-close" onClick={onClose} aria-label="Close">×</button>
        {err && <div className="bd-err">{err}</div>}
        {!b && !err && <div className="bd-loading">Loading…</div>}
        {b && (
          <>
            <div className="bd-head">
              <div>
                <div className="bd-ref">{b.reference}</div>
                <span className={`bc-st s-${b.status}`}>{b.status}</span>
              </div>
              <div className="bd-total">
                <span>Total</span>
                <strong>{(b.pricing?.total || 0).toLocaleString()} DZD</strong>
              </div>
            </div>

            <div className="bd-section">
              <h4>Guest</h4>
              <div className="bd-rows">
                <Row label="Name" value={`${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim()} />
                <Row label="Email" value={b.guest?.email} link={b.guest?.email ? `mailto:${b.guest.email}` : null} />
                <Row label="Phone" value={b.guest?.phone} link={b.guest?.phone ? `https://wa.me/${(b.guest.phone || "").replace(/\D/g, "")}` : null} />
              </div>
            </div>

            <div className="bd-section">
              <h4>Stay</h4>
              <div className="bd-rows">
                <Row label="Check-in" value={(b.checkIn || "").slice(0, 10)} />
                <Row label="Check-out" value={(b.checkOut || "").slice(0, 10)} />
                <Row label="Nights" value={b.nights} />
                {(b.rooms || []).map((r, i) => (
                  <Row key={i} label={`Room: ${r.type || ""}`} value={`× ${r.quantity}`} />
                ))}
              </div>
            </div>

            {b.specialRequests && (
              <div className="bd-section">
                <h4>Special requests</h4>
                <p className="bd-notes">{b.specialRequests}</p>
              </div>
            )}

            {b.status === "PENDING" && (
              <div className="bd-actions">
                <button className="bd-reject" onClick={reject} disabled={busy}>Reject</button>
                <button className="bd-confirm" onClick={confirm} disabled={busy}>Confirm booking</button>
              </div>
            )}

            <button className="bd-print" onClick={() => printArrivalWorksheet(b)}>
              🖨️ Print arrival worksheet
            </button>
          </>
        )}
        <style jsx>{`
          .bd-back { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; }
          .bd-panel { position: relative; background: #fff; border-radius: var(--r-lg); max-width: 560px; width: 100%; max-height: 92vh; overflow-y: auto; padding: 26px 28px; }
          .bd-close { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--gray-100); font-size: 22px; line-height: 1; cursor: pointer; }
          .bd-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--gray-100); }
          .bd-ref { font-size: 20px; font-weight: 800; letter-spacing: 0.02em; margin-bottom: 6px; color: var(--ink); }
          .bd-total { text-align: right; }
          .bd-total span { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 4px; }
          .bd-total strong { font-size: 19px; font-weight: 800; color: var(--ink); }
          .bd-section { margin-bottom: 18px; }
          .bd-section h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 10px; }
          .bd-rows { display: flex; flex-direction: column; gap: 7px; }
          .bd-notes { font-size: 14px; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; background: var(--cream); padding: 12px 14px; border-radius: var(--r-sm); }
          .bd-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--gray-100); }
          .bd-confirm, .bd-reject { padding: 13px 22px; border-radius: var(--r-sm); border: none; cursor: pointer; font-size: 14px; font-weight: 700; font-family: inherit; }
          .bd-confirm { background: var(--teal); color: #fff; }
          .bd-reject { background: var(--red-soft); color: var(--red-deep); }
          .bd-confirm:disabled, .bd-reject:disabled { opacity: 0.6; cursor: default; }
          .bd-print {
            display: block; width: 100%; margin-top: 14px; padding: 12px;
            background: var(--ink); color: #fff; border: none; border-radius: var(--r-sm);
            font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          }
          .bd-print:hover { background: #000; }
          .bd-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-bottom: 14px; }
          .bd-loading { padding: 40px; text-align: center; color: var(--gray-400); }
          .bc-st { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 980px; }
          .s-PENDING { background: #FFF4E0; color: #9A6700; }
          .s-CONFIRMED, .s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
          .s-REJECTED, .s-CANCELLED, .s-NO_SHOW, .s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }
        `}</style>
      </div>
    </div>
  );
}

function Row({ label, value, link }) {
  if (!value && value !== 0) return null;
  return (
    <div className="row">
      <span>{label}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer"><strong>{value}</strong></a>
            : <strong>{value}</strong>}
      <style jsx>{`
        .row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; }
        .row > span { color: var(--gray-400); font-weight: 500; }
        .row strong { color: var(--ink); font-weight: 700; text-align: right; }
        .row a { text-decoration: none; color: var(--red); }
        .row a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

// =============================================================================
// AVAILABILITY TAB — simple property-level "closed days" calendar
// =============================================================================
function PartnerAvailability({ hotelId, hotelName }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [closed, setClosed] = useState(new Set()); // YYYY-MM-DD strings
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // load the closed days for the visible month (+ a bit either side for safety)
  const load = useCallback(() => {
    const from = ymd(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    const to = ymd(new Date(month.getFullYear(), month.getMonth() + 2, 0));
    partnerAvailability(hotelId, from, to)
      .then((rows) => setClosed(new Set(rows.filter((r) => r.isClosed).map((r) => r.date))))
      .catch((e) => setErr(e.message));
  }, [hotelId, month]);
  useEffect(() => { load(); }, [load]);

  async function toggleDay(day) {
    const key = ymd(day);
    if (day < today) return; // can't edit the past
    setSaving(true); setErr("");
    const isCurrentlyClosed = closed.has(key);
    // optimistic update
    const next = new Set(closed);
    if (isCurrentlyClosed) next.delete(key); else next.add(key);
    setClosed(next);
    try {
      await partnerSetAvailability(hotelId, { dates: [key], isClosed: !isCurrentlyClosed });
    } catch (e) {
      setErr(e.message);
      // revert
      const revert = new Set(closed);
      if (isCurrentlyClosed) revert.add(key); else revert.delete(key);
      setClosed(revert);
    }
    setSaving(false);
  }

  // calendar grid
  const monthLabel = month.toLocaleDateString("en", { month: "long", year: "numeric" });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (firstDay.getDay() + 6) % 7; // mon-first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  return (
    <div>
      <div className="pa-head">
        <h2>Availability <span>· {hotelName}</span></h2>
        <p>Tap a day to mark the whole hotel as <em>closed</em>. Closed days are removed from search.</p>
      </div>
      {err && <div className="p-err">{err}</div>}

      <div className="pa-card">
        <div className="pa-nav">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
          <strong>{monthLabel}</strong>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button>
        </div>
        <div className="pa-dow">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="pa-grid">
          {cells.map((day, i) => {
            if (!day) return <span key={i} className="pa-cell empty" />;
            const key = ymd(day);
            const isPast = day < today;
            const isClosed = closed.has(key);
            return (
              <button
                key={i}
                className={`pa-cell ${isPast ? "past" : ""} ${isClosed ? "closed" : ""}`}
                disabled={isPast || saving}
                onClick={() => toggleDay(day)}
                aria-label={`${key} ${isClosed ? "closed" : "open"}`}
              >
                <span>{day.getDate()}</span>
              </button>
            );
          })}
        </div>
        <div className="pa-legend">
          <span><i className="lg-open" /> Open</span>
          <span><i className="lg-closed" /> Closed</span>
          <span><i className="lg-past" /> Past</span>
        </div>
      </div>

      <style jsx>{`
        .pa-head { margin-bottom: 18px; }
        h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin-bottom: 6px; }
        h2 span { font-size: 14px; font-weight: 500; color: var(--gray-400); }
        .pa-head p { color: var(--gray-400); font-size: 13.5px; line-height: 1.55; }
        .pa-head em { font-style: normal; color: var(--red); font-weight: 600; }
        .p-err { background: var(--red-soft); color: var(--red-deep); padding: 12px 14px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-bottom: 14px; }
        .pa-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 22px; max-width: 540px; }
        .pa-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .pa-nav strong { font-size: 15px; font-weight: 700; color: var(--ink); }
        .pa-nav button { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--gray-200); background: #fff; cursor: pointer; font-size: 18px; color: var(--ink); }
        .pa-dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; }
        .pa-dow span { text-align: center; font-size: 11px; font-weight: 700; color: var(--gray-400); }
        .pa-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .pa-cell { aspect-ratio: 1; border: 1.5px solid var(--gray-200); background: #fff; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ink); font-family: inherit; padding: 0; transition: background .15s, border-color .15s; }
        .pa-cell.empty { border: none; cursor: default; background: transparent; }
        .pa-cell.past { color: var(--gray-300); border-color: transparent; background: var(--gray-100); cursor: default; }
        .pa-cell.closed { background: var(--red); color: #fff; border-color: var(--red); }
        .pa-cell:not(.past):not(.closed):hover { border-color: var(--ink); }
        .pa-legend { display: flex; gap: 16px; margin-top: 14px; font-size: 12px; color: var(--gray-400); }
        .pa-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: middle; }
        .lg-open { background: #fff; border: 1.5px solid var(--gray-200); }
        .lg-closed { background: var(--red); }
        .lg-past { background: var(--gray-100); }
      `}</style>
    </div>
  );
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
