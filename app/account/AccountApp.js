"use client";

// =============================================================================
// Nzzor — Account App
// Customer self-service: list/detail of bookings, profile editing, password
// change, and the printable voucher.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useLang } from "../../lib/LangContext";
import { myBookings, myBookingDetail, userUpdateProfile, userChangePassword, cancelMyBooking } from "../../lib/accountApi";
import { formatPrice } from "../../lib/format";
import { openVoucher } from "../../lib/voucher";

export default function AccountApp() {
  const { user, loading, signOut, refresh } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    // bounce to sign-in if not logged in (once we know)
    if (!loading && !user) router.push("/signin?next=/account");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="ac-loading">Loading…<style jsx>{`.ac-loading{min-height:50vh;display:flex;align-items:center;justify-content:center;color:var(--gray-400);font-size:14px;}`}</style></div>;
  }

  return (
    <div className="ac-shell">
      <div className="wrap ac-head">
        <div>
          <h1 className="display">{t("acc.title")}</h1>
          <p>{user.firstName ? `${user.firstName} · ` : ""}{user.email}</p>
        </div>
        <button className="ac-signout" onClick={() => { signOut(); router.push("/"); }}>{t("auth.signout")}</button>
      </div>

      <nav className="wrap ac-tabs">
        <button className={tab === "bookings" ? "on" : ""} onClick={() => setTab("bookings")}>{t("acc.tab_bookings")}</button>
        <button className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>{t("acc.tab_profile")}</button>
        <button className={tab === "password" ? "on" : ""} onClick={() => setTab("password")}>{t("acc.tab_password")}</button>
      </nav>

      <main className="wrap ac-main">
        {tab === "bookings" && <MyBookingsPanel />}
        {tab === "profile" && <ProfilePanel user={user} onSaved={refresh} />}
        {tab === "password" && <PasswordPanel />}
      </main>

      <style jsx>{`
        .ac-shell { min-height: 60vh; background: var(--cream); padding-bottom: 80px; }
        .ac-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px 0 24px; flex-wrap: wrap; gap: 14px; }
        h1 { font-size: 30px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 6px; }
        .ac-head p { font-size: 14px; color: var(--gray-400); }
        .ac-signout { background: #fff; border: 1.5px solid var(--gray-200); border-radius: 980px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ac-signout:hover { border-color: var(--ink); }
        .ac-tabs { display: flex; gap: 26px; border-bottom: 1px solid var(--gray-200); margin-bottom: 26px; padding-bottom: 0; }
        .ac-tabs button { background: none; border: none; padding: 14px 0; font-size: 14.5px; font-weight: 600; color: var(--gray-400); cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
        .ac-tabs button.on { color: var(--ink); border-bottom-color: var(--red); }
      `}</style>
    </div>
  );
}

// =============================================================================
// MY BOOKINGS
// =============================================================================
function MyBookingsPanel() {
  const { lang, t } = useLang();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setList(null); setErr("");
    myBookings(lang).then(setList).catch((e) => setErr(e.message));
  }, [lang]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="ac-err">{err}</div>;
  if (!list) return <div className="ac-load">…</div>;
  if (list.length === 0) {
    return (
      <div className="ac-empty">
        <p>{t("acc.no_bookings")}</p>
        <Link href="/hotels">{t("acc.browse_hotels")} →</Link>
        <style jsx>{`
          .ac-empty { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 60px 30px; text-align: center; }
          .ac-empty p { color: var(--gray-400); font-size: 14.5px; margin-bottom: 14px; }
          .ac-empty :global(a) { color: var(--ink); font-weight: 700; text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mb-list">
      {list.map((b) => (
        <button key={b.id} className="mb-card" onClick={() => setSelected(b.id)}>
          <div className="mb-top">
            <strong>{b.reference}</strong>
            <span className={`mb-st s-${b.status}`}>{b.status}</span>
          </div>
          <div className="mb-hotel">{b.hotel?.name}</div>
          <div className="mb-dates">{(b.checkIn || "").slice(0, 10)} → {(b.checkOut || "").slice(0, 10)} <em>· {b.nights} {b.nights === 1 ? "night" : "nights"}</em></div>
          <div className="mb-foot">
            <span>{(b.rooms || []).map((r) => r.type).join(", ")}</span>
            <strong>{formatPrice(b.pricing?.total)}</strong>
          </div>
        </button>
      ))}

      {selected && (
        <BookingDetailModal
          id={selected}
          onClose={() => setSelected(null)}
          onCancelled={() => {
            // refresh the list so the cancelled booking shows new status,
            // then close the modal (the success state was visible inside
            // the modal for a moment before this callback fires).
            load();
            setSelected(null);
          }}
        />
      )}

      <style jsx>{`
        .mb-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
        .mb-card { background: #fff; border: 1.5px solid var(--gray-200); border-radius: var(--r-lg); padding: 18px; text-align: left; cursor: pointer; font-family: inherit; transition: border-color .15s, transform .15s; }
        .mb-card:hover { border-color: var(--ink); transform: translateY(-2px); }
        .mb-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .mb-top strong { font-size: 14px; font-weight: 800; letter-spacing: 0.02em; color: var(--ink); }
        .mb-st { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 980px; }
        .s-PENDING { background: #FFF4E0; color: #9A6700; }
        .s-CONFIRMED, .s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
        .s-REJECTED, .s-CANCELLED, .s-NO_SHOW, .s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }
        .mb-hotel { font-size: 15.5px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
        .mb-dates { font-size: 13px; color: var(--ink-2); margin-bottom: 12px; }
        .mb-dates em { font-style: normal; color: var(--gray-400); }
        .mb-foot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 10px; border-top: 1px solid var(--gray-100); }
        .mb-foot span { font-size: 12px; color: var(--gray-400); }
        .mb-foot strong { font-size: 14px; font-weight: 700; color: var(--ink); }
      `}</style>
    </div>
  );
}

function BookingDetailModal({ id, onClose, onCancelled }) {
  const { t, lang } = useLang();
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  // ---- Cancellation state -------------------------------------------------
  // Two-step UX: clicking Cancel first reveals a confirmation row with a
  // reason textarea (optional) and Confirm/Back buttons. This avoids
  // accidental cancellation from a misclick on the primary action.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelErr, setCancelErr] = useState(null);   // { code, message, details? }
  const [cancelDone, setCancelDone] = useState(false);

  // Portal mounting — `document` doesn't exist server-side, so we only
  // enable the portal after the component has mounted on the client.
  // Without this, Next.js's SSR pass crashes.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ESC closes the modal (standard modal behavior). The listener runs on
  // window so it catches keypresses regardless of focus location.
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while the modal is open so the page behind doesn't
  // jump or scroll. We save and restore the user's previous overflow
  // value to avoid stomping any other component's scroll-locking.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => { myBookingDetail(id, lang).then(setB).catch((e) => setErr(e.message)); }, [id, lang]);

  // Pre-compute cancellation eligibility client-side so we can disable
  // the button immediately. The backend re-checks authoritatively — this
  // is just for the UI. "Within 48h" means we KNOW the backend will
  // refuse, so we show the support-contact path instead.
  const isCancellable = b && (b.status === "PENDING" || b.status === "CONFIRMED");
  const hoursUntilCheckIn = b && b.checkIn
    ? (new Date(b.checkIn).getTime() - Date.now()) / (1000 * 60 * 60)
    : null;
  const within48h = hoursUntilCheckIn != null && hoursUntilCheckIn < 48;

  async function doCancel() {
    setCancelBusy(true);
    setCancelErr(null);
    try {
      await cancelMyBooking(id, cancelReason.trim() || undefined);
      setCancelDone(true);
      // Give the user 1.5s to read "Cancelled" before refreshing the
      // list (which closes this modal via onCancelled).
      setTimeout(() => { if (onCancelled) onCancelled(); }, 1500);
    } catch (e) {
      setCancelErr({
        code: e.code || null,
        message: e.message,
        details: e.details || null,
      });
    }
    setCancelBusy(false);
  }

  // WhatsApp deep-link to support, with the booking ref pre-populated in
  // the message body so the agent can look it up immediately.
  const waNumber = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WHATSAPP) || "213XXXXXXXXX";
  const waMessage = b ? encodeURIComponent(`Hi, I need help cancelling booking ${b.reference}.`) : "";
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  // Portal not yet mounted (SSR pass or first render before useEffect):
  // return nothing rather than rendering inline, which would create the
  // exact bug we're trying to fix (modal showing as flow content).
  if (!mounted) return null;

  return createPortal(
    <div className="md-back" onClick={onClose}>
      <div className="md-panel" onClick={(e) => e.stopPropagation()}>
        <button className="md-close" onClick={onClose} aria-label={t("auth.close")}>×</button>
        {err && <div className="md-err">{err}</div>}
        {!b && !err && <div className="md-load">…</div>}
        {b && (
          <>
            {/* ---- HEADER ----
                Reference is the dominant element (visual anchor). Status pill
                sits underneath. Total is right-aligned and substantial — the
                user wants to see what they're paying at a glance. */}
            <div className="md-head">
              <div className="md-head-left">
                <div className="md-ref-label">{t("bk.your_ref")}</div>
                <div className="md-ref">{b.reference}</div>
                <span className={`md-st s-${b.status}`}>{b.status}</span>
              </div>
              <div className="md-head-right">
                <div className="md-total-label">{t("detail.total")}</div>
                <div className="md-total">{formatPrice(b.pricing?.total)}</div>
              </div>
            </div>

            {/* ---- HOTEL HERO ----
                Single prominent line for the hotel name + city. Keeps the
                user's eye on the destination, not the metadata. */}
            <div className="md-hotel">
              <div className="md-hotel-name">{b.hotel?.name}</div>
              <div className="md-hotel-city">{b.hotel?.city}</div>
            </div>

            {/* ---- TRIP DATES ----
                Three big stat boxes: check-in, check-out, nights. More
                scannable than label/value rows for the most-important info. */}
            <div className="md-trip">
              <div className="md-trip-cell">
                <div className="md-trip-k">{t("bk.checkin")}</div>
                <div className="md-trip-v">{(b.checkIn || "").slice(0, 10)}</div>
              </div>
              <div className="md-trip-cell">
                <div className="md-trip-k">{t("bk.checkout")}</div>
                <div className="md-trip-v">{(b.checkOut || "").slice(0, 10)}</div>
              </div>
              <div className="md-trip-cell">
                <div className="md-trip-k">{b.nights === 1 ? t("bk.night") : t("bk.nights")}</div>
                <div className="md-trip-v">{b.nights}</div>
              </div>
            </div>

            {/* ---- ROOMS + PAYMENT side-by-side ---- */}
            <div className="md-2col">
              <Section title={t("acc.section_rooms")}>
                {(b.rooms || []).map((r, i) => (
                  <Row key={i} label={r.type} value={`× ${r.quantity}`} />
                ))}
              </Section>
              <Section title={t("acc.section_payment")}>
                <Row label={t("acc.payment_method")} value={b.payment?.method} />
                {/* Status removed — already shown as a pill in the header
                    above. No need to duplicate it inside the modal body. */}
              </Section>
            </div>

            {/* ---- PRICING ----
                Subtotal hidden when it equals total (no discount). The user
                doesn't need to see "Subtotal: 70k DZD / Total: 70k DZD" —
                it's noise. Only break it out when there's actual nuance. */}
            <Section title={t("acc.section_pricing")}>
              {b.pricing?.discount > 0 && (
                <>
                  <Row label={t("acc.subtotal")} value={formatPrice(b.pricing?.subtotal)} />
                  <Row label={t("acc.discount")} value={`− ${formatPrice(b.pricing.discount)}`} />
                </>
              )}
              <Row label={t("detail.total")} value={formatPrice(b.pricing?.total)} strong />
            </Section>

            {b.specialRequests && (
              <Section title={t("acc.section_requests")}>
                <p className="md-notes">{b.specialRequests}</p>
              </Section>
            )}

            {/* voucher available for CONFIRMED bookings */}
            {(b.status === "CONFIRMED" || b.status === "COMPLETED") && (
              <button className="md-voucher" onClick={() => openVoucher(b)}>{t("vch.download")}</button>
            )}

            {/* ---- Cancellation area ---- */}
            {isCancellable && !cancelDone && (
              <div className="md-cancel-zone">
                {!showCancelConfirm ? (
                  // Initial state — show the Cancel button (disabled if
                  // within 48h) and the WhatsApp fallback link.
                  <>
                    <button
                      className="md-cancel-btn"
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={within48h}
                    >
                      {t("acc.cancel_booking")}
                    </button>
                    {within48h && (
                      <div className="md-cancel-window">
                        <div className="md-cancel-window-title">
                          {t("acc.cancellation_window_title")}
                        </div>
                        <div className="md-cancel-window-body">
                          {t("acc.cancellation_window_msg")}
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="md-cancel-wa"
                        >
                          {t("acc.contact_support_wa")}
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  // Confirmation step — optional reason + Confirm/Back.
                  <div className="md-cancel-confirm">
                    <div className="md-cancel-confirm-title">{t("acc.cancel_confirm_title")}</div>
                    <div className="md-cancel-confirm-body">{t("acc.cancel_confirm_body")}</div>
                    <label>{t("acc.cancel_reason")}</label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={t("acc.cancel_reason_ph")}
                    />
                    {cancelErr && (
                      <div className="md-cancel-err">
                        {/* Localize known error codes; fall back to the
                            backend message. WITHIN_CANCELLATION_WINDOW
                            shouldn't happen here (we disabled the button)
                            but if it does we show the WhatsApp option. */}
                        {cancelErr.code === "WITHIN_CANCELLATION_WINDOW"
                          ? t("acc.cancellation_window_msg")
                          : cancelErr.message}
                      </div>
                    )}
                    <div className="md-cancel-actions">
                      <button
                        type="button"
                        className="md-cancel-back"
                        onClick={() => { setShowCancelConfirm(false); setCancelErr(null); }}
                        disabled={cancelBusy}
                      >
                        ← {t("acc.cancel_back")}
                      </button>
                      <button
                        type="button"
                        className="md-cancel-confirm-btn"
                        onClick={doCancel}
                        disabled={cancelBusy}
                      >
                        {cancelBusy ? t("acc.cancelling") : t("acc.cancel_confirm_action")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cancelDone && (
              <div className="md-cancel-done" role="status">
                ✓ {t("acc.cancelled")}
              </div>
            )}
          </>
        )}

        <style jsx global>{`
          /* The modal positioning styles use 'global' rather than scoped
             jsx because we hit a class of bugs where the scoped styles
             didn't apply at runtime (likely a styled-jsx scoping edge
             case with conditional rendering). Global guarantees the
             styles win regardless of any hash-matching issues. The
             selectors are prefixed enough (.md-*) that there's no risk
             of bleeding into unrelated components. */

          /* Modal backdrop — fixed full-viewport overlay with a dark
             background and a blur. Using !important on the positioning
             properties as belt-and-braces against any inherited overrides. */
          .md-back {
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 1000 !important;
            background: rgba(0, 0, 0, 0.72) !important;
            backdrop-filter: saturate(160%) blur(6px);
            -webkit-backdrop-filter: saturate(160%) blur(6px);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 24px;
            overflow-y: auto;
            animation: md-fade 0.18s ease-out;
          }
          @keyframes md-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .md-panel {
            position: relative;
            background: #fff;
            border-radius: 16px;
            max-width: 680px;
            width: 100%;
            max-height: 92vh;
            overflow-y: auto;
            padding: 34px 38px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
            animation: md-rise 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes md-rise {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .md-close {
            position: absolute;
            top: 14px;
            right: 14px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: var(--gray-100);
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            transition: background 0.15s;
            z-index: 1;
          }
          .md-close:hover { background: var(--gray-200); }

          /* ---- HEADER ---- */
          .md-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 24px;
            padding-bottom: 22px;
            border-bottom: 1px solid var(--gray-100);
          }
          .md-head-left { flex: 1; min-width: 0; }
          .md-head-right { text-align: right; flex-shrink: 0; }
          .md-ref-label, .md-total-label {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--gray-400);
            margin-bottom: 6px;
          }
          .md-ref {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: var(--ink);
            font-family: ui-monospace, SFMono-Regular, monospace;
            margin-bottom: 8px;
            word-break: break-all;
          }
          .md-total {
            font-size: 24px;
            font-weight: 800;
            color: var(--ink);
            white-space: nowrap;
          }
          .md-st {
            display: inline-block;
            font-size: 10.5px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 980px;
            letter-spacing: 0.04em;
          }
          .md-st.s-PENDING { background: #FFF4E0; color: #9A6700; }
          .md-st.s-CONFIRMED, .md-st.s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
          .md-st.s-REJECTED, .md-st.s-CANCELLED, .md-st.s-NO_SHOW, .md-st.s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }

          /* ---- HOTEL HERO ---- */
          .md-hotel {
            margin-bottom: 20px;
          }
          .md-hotel-name {
            font-size: 20px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: var(--ink);
            line-height: 1.2;
            margin-bottom: 4px;
          }
          .md-hotel-city {
            font-size: 13.5px;
            color: var(--gray-400);
            font-weight: 600;
          }

          /* ---- TRIP DATES (3-cell stat row) ---- */
          .md-trip {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 24px;
          }
          .md-trip-cell {
            background: var(--cream);
            border: 1px solid var(--gray-100);
            border-radius: var(--r-sm);
            padding: 14px 16px;
          }
          .md-trip-k {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--gray-400);
            margin-bottom: 6px;
          }
          .md-trip-v {
            font-size: 15px;
            font-weight: 700;
            color: var(--ink);
            font-family: ui-monospace, SFMono-Regular, monospace;
          }

          /* ---- 2-COL SECTIONS (rooms + payment) ---- */
          .md-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 4px;
          }

          .md-err {
            background: var(--red-soft);
            color: var(--red-deep);
            padding: 12px;
            border-radius: var(--r-sm);
          }
          .md-load {
            padding: 40px;
            text-align: center;
            color: var(--gray-400);
          }
          .md-notes {
            font-size: 13.5px;
            line-height: 1.6;
            color: var(--ink-2);
            white-space: pre-wrap;
            background: var(--cream);
            padding: 12px 14px;
            border-radius: var(--r-sm);
            margin: 0;
          }
          .md-voucher {
            width: 100%;
            margin-top: 18px;
            padding: 14px;
            background: var(--ink);
            color: #fff;
            border: none;
            border-radius: var(--r-sm);
            font-size: 14.5px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: background 0.15s;
          }
          .md-voucher:hover { background: var(--red); }

          /* ---- Cancellation styles ---- */
          .md-cancel-zone {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid var(--gray-100);
          }
          .md-cancel-btn {
            width: 100%;
            padding: 13px;
            background: transparent;
            color: var(--red-deep);
            border: 1.5px solid var(--red);
            border-radius: var(--r-sm);
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: background .15s, color .15s;
          }
          .md-cancel-btn:hover:not(:disabled) {
            background: var(--red);
            color: #fff;
          }
          .md-cancel-btn:disabled {
            border-color: var(--gray-200);
            color: var(--gray-400);
            cursor: not-allowed;
          }
          .md-cancel-window {
            margin-top: 14px;
            padding: 14px 16px;
            background: var(--cream);
            border: 1px solid var(--gray-200);
            border-radius: var(--r-sm);
          }
          .md-cancel-window-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 6px;
          }
          .md-cancel-window-body {
            font-size: 12.5px;
            line-height: 1.55;
            color: var(--ink-2);
            margin-bottom: 12px;
          }
          .md-cancel-wa {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 16px;
            background: #25D366;
            color: #fff;
            border-radius: 980px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
          }
          .md-cancel-wa:hover { background: #1FB855; }

          .md-cancel-confirm {
            padding: 16px 18px;
            background: var(--red-soft);
            border: 1px solid rgba(230,57,70,0.25);
            border-radius: var(--r-sm);
          }
          .md-cancel-confirm-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--red-deep);
            margin-bottom: 6px;
          }
          .md-cancel-confirm-body {
            font-size: 13px;
            line-height: 1.5;
            color: var(--ink-2);
            margin-bottom: 14px;
          }
          .md-cancel-confirm label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: var(--ink-2);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .md-cancel-confirm textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1.5px solid var(--gray-200);
            border-radius: var(--r-sm);
            font-size: 13.5px;
            font-family: inherit;
            outline: none;
            resize: vertical;
            background: #fff;
          }
          .md-cancel-confirm textarea:focus { border-color: var(--ink); }
          .md-cancel-err {
            margin-top: 10px;
            padding: 10px 12px;
            background: #fff;
            color: var(--red-deep);
            border-radius: var(--r-sm);
            font-size: 12.5px;
            font-weight: 600;
          }
          .md-cancel-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-top: 14px;
          }
          .md-cancel-back {
            background: none;
            border: none;
            color: var(--ink-2);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
          }
          .md-cancel-back:disabled { opacity: 0.5; cursor: default; }
          .md-cancel-confirm-btn {
            padding: 11px 22px;
            background: var(--red);
            color: #fff;
            border: none;
            border-radius: var(--r-sm);
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
          }
          .md-cancel-confirm-btn:disabled {
            background: var(--gray-300);
            cursor: default;
          }
          .md-cancel-done {
            margin-top: 22px;
            padding: 14px;
            background: var(--teal-soft);
            color: var(--teal);
            border-radius: var(--r-sm);
            font-size: 14px;
            font-weight: 700;
            text-align: center;
          }

          /* ---- MOBILE ---- */
          @media (max-width: 600px) {
            .md-panel { padding: 26px 22px; }
            .md-head {
              flex-direction: column;
              align-items: flex-start;
            }
            .md-head-right { text-align: left; }
            .md-ref { font-size: 20px; }
            .md-total { font-size: 22px; }
            .md-trip {
              grid-template-columns: 1fr;
              gap: 6px;
            }
            .md-trip-cell {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 14px;
            }
            .md-trip-k { margin-bottom: 0; }
            .md-2col { grid-template-columns: 1fr; gap: 12px; }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}

function Section({ title, children }) {
  return (
    <div className="sect">
      <h4>{title}</h4>
      <div className="rows">{children}</div>
      <style jsx>{`
        .sect { margin-bottom: 18px; }
        h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 10px; }
        .rows { display: flex; flex-direction: column; gap: 7px; }
      `}</style>
    </div>
  );
}

function Row({ label, value, strong }) {
  if (!value && value !== 0) return null;
  return (
    <div className="row">
      <span>{label}</span>
      <strong className={strong ? "big" : ""}>{value}</strong>
      <style jsx>{`
        .row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; }
        .row > span { color: var(--gray-400); font-weight: 500; }
        .row strong { color: var(--ink); font-weight: 700; text-align: right; }
        .row strong.big { font-size: 16px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// PROFILE PANEL
// =============================================================================
function ProfilePanel({ user, onSaved }) {
  const { t } = useLang();
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setOk(false);
    try {
      await userUpdateProfile({ firstName, lastName, phone });
      await onSaved();
      setOk(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <form className="pn-card" onSubmit={save}>
      <label>{t("auth.email")}</label>
      <input type="email" value={user.email} disabled />

      <label>{t("auth.first_name")}</label>
      <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); setOk(false); }} />

      <label>{t("auth.last_name")}</label>
      <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); setOk(false); }} />

      <label>{t("auth.phone")}</label>
      <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setOk(false); }} />

      {err && <div className="pn-err">{err}</div>}
      {ok && <div className="pn-ok">{t("acc.saved")}</div>}

      <button type="submit" disabled={busy}>{t("acc.save_changes")}</button>

      <style jsx>{`
        .pn-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 30px; max-width: 520px; }
        label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 14px; }
        input { width: 100%; padding: 12px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; }
        input:focus { border-color: var(--ink); }
        input:disabled { background: var(--gray-100); color: var(--gray-400); }
        button { margin-top: 20px; padding: 12px 24px; background: var(--ink); color: #fff; border: none; border-radius: var(--r-sm); font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .pn-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
        .pn-ok { background: var(--teal-soft); color: var(--teal); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
      `}</style>
    </form>
  );
}

// =============================================================================
// PASSWORD PANEL
// =============================================================================
function PasswordPanel() {
  const { t } = useLang();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setOk(false);
    try {
      await userChangePassword(current, next);
      setCurrent(""); setNext(""); setOk(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <form className="pn-card" onSubmit={save}>
      <label>{t("acc.current_password")}</label>
      <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />

      <label>{t("acc.new_password")}</label>
      <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
      <span className="hint">{t("auth.password_hint")}</span>

      {err && <div className="pn-err">{err}</div>}
      {ok && <div className="pn-ok">{t("acc.password_changed")}</div>}

      <button type="submit" disabled={busy}>{t("acc.change_password")}</button>

      <style jsx>{`
        .pn-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 30px; max-width: 520px; }
        label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 14px; }
        input { width: 100%; padding: 12px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; }
        input:focus { border-color: var(--ink); }
        .hint { display: block; font-size: 11.5px; color: var(--gray-400); margin-top: 5px; }
        button { margin-top: 20px; padding: 12px 24px; background: var(--ink); color: #fff; border: none; border-radius: var(--r-sm); font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .pn-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
        .pn-ok { background: var(--teal-soft); color: var(--teal); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
      `}</style>
    </form>
  );
}
