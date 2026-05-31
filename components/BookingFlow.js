"use client";

// =============================================================================
// Nzzor — Booking Flow
// Step 1: guest details · Step 2: payment + promo · Step 3: confirmation
// Guest checkout by default; optional account creation. CIB & Edahabia.
// Cash-at-hotel intentionally omitted. CIB completes as pending-payment
// (Option B) — the real SATIM redirect slots into payNow() later.
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "../lib/LangContext";
import { useAuth } from "../lib/AuthContext";
import { formatPrice } from "../lib/format";
import { validateCoupon, couponDiscount } from "../lib/coupons";
import { createBooking } from "../lib/api";
import { validateBookingDates, localizeDateError } from "../lib/dates";
import { setUserToken } from "../lib/accountApi";

export default function BookingFlow({ hotel, room, nights, checkIn, checkOut }) {
  const { t } = useLang();
  const router = useRouter();
  const { user, refresh: refreshAuth } = useAuth();

  // How many units of this room to book, carried from the search picker via
  // ?rooms=N. Read from the URL on mount in an effect (client-only, so it does
  // NOT force a <Suspense> boundary the way next/navigation useSearchParams
  // would). Defaults to 1, clamped to 1..10 so a tampered URL can't request
  // 9999 units. The availability guard re-checks units server-side regardless.
  const [roomsQty, setRoomsQty] = useState(1);
  useEffect(() => {
    try {
      const n = parseInt(new URLSearchParams(window.location.search).get("rooms") || "1", 10);
      if (!Number.isNaN(n)) setRoomsQty(Math.min(10, Math.max(1, n)));
    } catch {
      /* SSR / no window — keep default 1 */
    }
  }, []);

  const [step, setStep] = useState(1);

  // guest details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  // The password is only collected when createAccount is checked. When
  // submitted to the backend, the booking route hashes it and creates the
  // user as part of the same request (no separate signup needed).
  const [accountPassword, setAccountPassword] = useState("");
  const [errors, setErrors] = useState({});

  // prefill the form when a signed-in user starts a booking
  useEffect(() => {
    if (user) {
      setName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // payment
  const [payMethod, setPayMethod] = useState("cib");
  const [promoInput, setPromoInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [promoError, setPromoError] = useState(false);
  const [processing, setProcessing] = useState(false);

  // confirmation
  const [reference, setReference] = useState("");
  // ---- Booking submission error state -------------------------------------
  // When the API rejects a booking (past dates, hotel inactive, payment
  // gateway error, etc.) we keep the user on the payment step and show the
  // error inline. Previously the UI would synthesize a fake booking
  // reference on any error and pretend the booking succeeded — a serious
  // bug because the customer believes they have a reservation that doesn't
  // exist in any database. The `bookingError` slot holds either null
  // (no error) or { message, code? }.
  const [bookingError, setBookingError] = useState(null);

  // Copy-to-clipboard state for the confirmation step's reference. After
  // the user clicks Copy, we flash a "Copied!" label for 2 seconds.
  const [copied, setCopied] = useState(false);
  function copyReference() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard permission denied — fail silently */ });
  }

  // ---- guard: missing booking context -------------------------------------
  if (!hotel || !room) {
    return (
      <div className="bk-missing">
        <Icon name="shield" size={40} style={{ color: "var(--gray-300)" }} />
        <h1 className="display">{t("bk.missing")}</h1>
        <p>{t("bk.missing_sub")}</p>
        <Link href="/hotels" className="bk-missing-btn">{t("bk.view_hotels")}</Link>
        <style jsx>{`
          .bk-missing {
            max-width: 480px; margin: 80px auto; padding: 0 24px; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 12px;
          }
          .bk-missing h1 { font-size: 26px; font-weight: 600; color: var(--ink); }
          .bk-missing p { color: var(--gray-400); font-size: 15px; }
          .bk-missing-btn {
            margin-top: 12px; background: var(--ink); color: #fff;
            padding: 13px 26px; border-radius: 980px; font-weight: 700;
            font-size: 14px; text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  // ---- guard: dates are invalid (past, reversed, or missing) ---------------
  // Catches the "old shared booking link" case — a customer clicks a link
  // for dates that have since passed, or for a checkin >= checkout. Render
  // a clear error with a way back to the hotel page rather than letting them
  // submit a request the backend will reject with a generic 400.
  const dateError = validateBookingDates(checkIn, checkOut);
  if (dateError) {
    return (
      <div className="bk-missing">
        <Icon name="shield" size={40} style={{ color: "var(--gray-300)" }} />
        <h1 className="display">{t("bk.dates_invalid") || "Those dates won't work"}</h1>
        <p>{localizeDateError(dateError, t)}</p>
        <Link href={`/hotels/${hotel.slug}`} className="bk-missing-btn">
          {t("bk.pick_new_dates") || "Pick new dates"}
        </Link>
        <style jsx>{`
          .bk-missing {
            max-width: 480px; margin: 80px auto; padding: 0 24px; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 12px;
          }
          .bk-missing h1 { font-size: 26px; font-weight: 600; color: var(--ink); }
          .bk-missing p { color: var(--gray-400); font-size: 15px; }
          .bk-missing-btn {
            margin-top: 12px; background: var(--ink); color: #fff;
            padding: 13px 26px; border-radius: 980px; font-weight: 700;
            font-size: 14px; text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  // ---- pricing -------------------------------------------------------------
  const subtotal = room.price * nights * roomsQty;
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const total = subtotal - discount;

  // ---- validation ----------------------------------------------------------
  function validateStep1() {
    const e = {};
    if (!name.trim() || name.trim().length < 3) e.name = t("bk.err_name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t("bk.err_email");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) e.phone = t("bk.err_phone");
    // If the user opted to create an account, require a password of at
    // least 8 chars (matches backend Zod min and the password reset min).
    // We don't validate password complexity beyond length — same policy
    // as register.
    if (createAccount && !user) {
      if (!accountPassword || accountPassword.length < 8) {
        e.accountPassword = t("auth.password_too_short");
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goToPayment() {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ---- promo ---------------------------------------------------------------
  function applyPromo() {
    const c = validateCoupon(promoInput);
    if (c) {
      setCoupon(c);
      setPromoError(false);
    } else {
      setCoupon(null);
      setPromoError(true);
    }
  }
  function removePromo() {
    setCoupon(null);
    setPromoInput("");
    setPromoError(false);
  }

  // ---- confirm -------------------------------------------------------------
  async function payNow() {
    setProcessing(true);
    setBookingError(null);
    // split the full name into first / last for the backend
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || name.trim();
    const lastName = parts.slice(1).join(" ") || parts[0] || "-";

    // backend payment-method codes are uppercase. Explicit map — do NOT use a
    // binary fallback here: a "anything-else -> CIB" ternary silently mis-files
    // Visa/Mastercard bookings as CIB. Every selectable method maps explicitly,
    // and an unknown value throws rather than guessing.
    const METHOD_CODES = {
      cib: "CIB",
      edahabia: "EDDAHABIA",
      visa: "VISA",
      mastercard: "MASTERCARD",
    };
    const methodCode = METHOD_CODES[payMethod];
    if (!methodCode) {
      setBookingError(t("bk.pay_method_error") || "Please choose a payment method.");
      return;
    }

    // payload shaped exactly as the backend's bookings route expects
    const payload = {
      hotelId: hotel.id,
      rooms: [{ roomId: room.id, quantity: roomsQty }],
      checkIn,
      checkOut,
      guest: {
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim(),
      },
      specialRequests: notes.trim() || undefined,
      paymentMethod: methodCode,
      lang: "en",
      // Account creation at booking time. The backend hashes the password
      // and creates a user IF createAccount is true, password is provided,
      // and no account with that email already exists. If the email is
      // already registered the backend silently skips account creation
      // (we don't want to leak account existence, and we don't want a
      // failed signup to fail the booking either).
      createAccount,
      password: createAccount && !user ? accountPassword : undefined,
      promoCode: coupon?.code || undefined,
    };
    const result = await createBooking(payload);
    setProcessing(false);
    if (result.ok) {
      // If the backend just created an account for this booking, it
      // returns an auth token. Persist it and refresh AuthContext so the
      // confirmation page (step 3) shows the customer as signed in.
      // If no account was created (already existed, didn't ask for one)
      // result.account will be null and we skip this branch.
      if (result.account && result.account.token) {
        setUserToken(result.account.token);
        // refreshAuth re-fetches /api/auth/me which will return the new
        // user. We await so the UI doesn't briefly show "signed out" state.
        await refreshAuth();
      }
      setReference(result.data.reference);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Real error from the backend. We surface it to the user on the
      // current step (payment) so they understand what happened and can
      // act on it — either fix something (re-pick dates, change payment
      // method, retry) or contact us.
      //
      // We DO NOT invent a synthetic booking reference and pretend success.
      // That was the previous behavior and it was actively dangerous —
      // a customer believing they had a confirmed reservation that didn't
      // exist in any database would show up at the hotel to no record.
      setBookingError({
        message: result.error || t("bk.err_generic"),
        code: result.code || null,
      });
      // Don't auto-scroll — the error renders just above the pay button
      // in the same viewport position the user is already looking at.
    }
  }

  const nightLabel = nights === 1 ? t("bk.night") : t("bk.nights");

  return (
    <div className="bk">
      {/* progress steps */}
      <div className="bk-steps">
        <div className="wrap bk-steps-inner">
          {[
            [1, t("bk.step1")],
            [2, t("bk.step2")],
            [3, t("bk.step3")],
          ].map(([n, label]) => (
            <div key={n} className={`bk-step ${step >= n ? "done" : ""} ${step === n ? "current" : ""}`}>
              <span className="bk-step-num">
                {step > n ? <Icon name="check" size={14} strokeWidth={3} /> : n}
              </span>
              <span className="bk-step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`wrap bk-body${step === 3 ? " bk-body-confirm" : ""}`}>
        <div className="bk-main">
          {/* ================= STEP 1 — DETAILS ================= */}
          {step === 1 && (
            <div className="bk-card">
              <h2 className="display">{t("bk.guest_details")}</h2>

              {/* Prominent sign-in prompt at the top of step 1, only for
                  unauthenticated users. The link includes ?next= so they
                  return to the booking flow after signing in (their form
                  data won't persist through the round-trip — but they'll
                  pre-fill from their profile in the new flow). */}
              {!user && (
                <div className="bk-have-account">
                  <Icon name="user" size={16} style={{ color: "var(--ink-2)" }} />
                  <div>
                    <strong>{t("bk.have_account_q")}</strong>
                    <Link
                      href={`/signin?next=${encodeURIComponent(
                        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/account"
                      )}`}
                    >
                      {t("bk.signin_to_prefill")} →
                    </Link>
                  </div>
                </div>
              )}

              <div className="bk-field">
                <label>{t("bk.full_name")} <span className="bk-req">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("bk.full_name_ph")}
                  className={errors.name ? "err" : ""}
                />
                {errors.name && <span className="bk-err">{errors.name}</span>}
              </div>

              <div className="bk-field-row">
                <div className="bk-field">
                  <label>{t("bk.email")} <span className="bk-req">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("bk.email_ph")}
                    className={errors.email ? "err" : ""}
                  />
                  {errors.email && <span className="bk-err">{errors.email}</span>}
                  {!user && !errors.email && email && (
                    /* Reassures the user that their booking will surface
                       under any existing account with this email — without
                       confirming whether one exists (anti-enumeration). */
                    <span className="bk-field-hint">{t("bk.email_link_hint")}</span>
                  )}
                </div>
                <div className="bk-field">
                  <label>{t("bk.phone")} <span className="bk-req">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("bk.phone_ph")}
                    className={errors.phone ? "err" : ""}
                  />
                  {errors.phone && <span className="bk-err">{errors.phone}</span>}
                </div>
              </div>

              <div className="bk-field">
                <label>{t("bk.notes")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("bk.notes_ph")}
                  rows={3}
                />
              </div>

              {!user && (
                <label className="bk-check">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => {
                      setCreateAccount(e.target.checked);
                      if (!e.target.checked) setAccountPassword(""); // clear if unchecked
                    }}
                  />
                  <span>{t("bk.account_offer")}</span>
                </label>
              )}

              {/* Password field appears only when createAccount is on.
                  Min 8 chars matches the backend Zod schema. We do not
                  send the password down a payment-method route — only the
                  /bookings POST handles it, and only when this checkbox
                  is true. */}
              {createAccount && !user && (
                <div className="bk-field">
                  <label htmlFor="bk-account-pw">{t("auth.password")}</label>
                  <input
                    id="bk-account-pw"
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    minLength={8}
                    placeholder={t("auth.password_hint")}
                    autoComplete="new-password"
                  />
                  {errors.accountPassword && <span className="bk-err">{errors.accountPassword}</span>}
                </div>
              )}

              <button className="bk-cta" onClick={goToPayment}>
                {t("bk.continue_payment")}
                <Icon name="arrow" size={16} strokeWidth={2.5} />
              </button>

              {!user && (
                <div className="bk-signin">
                  <Link href="/signin">{t("bk.have_account")}</Link>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2 — PAYMENT ================= */}
          {step === 2 && (
            <div className="bk-card">
              <h2 className="display">{t("bk.pay_method")}</h2>

              <div className="bk-pay-methods">
                <button
                  className={`bk-pay ${payMethod === "cib" ? "on" : ""}`}
                  onClick={() => setPayMethod("cib")}
                >
                  <span className="bk-pay-radio" />
                  <span className="bk-pay-info">
                    <strong>CIB</strong>
                    <em>{t("bk.cib_desc")}</em>
                  </span>
                  <span className="bk-pay-logo">CIB</span>
                </button>

                <button
                  className={`bk-pay ${payMethod === "edahabia" ? "on" : ""}`}
                  onClick={() => setPayMethod("edahabia")}
                >
                  <span className="bk-pay-radio" />
                  <span className="bk-pay-info">
                    <strong>Edahabia</strong>
                    <em>{t("bk.edahabia_desc")}</em>
                  </span>
                  <span className="bk-pay-logo gold">ED</span>
                </button>

                <button
                  className={`bk-pay ${payMethod === "visa" ? "on" : ""}`}
                  onClick={() => setPayMethod("visa")}
                >
                  <span className="bk-pay-radio" />
                  <span className="bk-pay-info">
                    <strong>Visa</strong>
                    <em>{t("bk.visa_desc")}</em>
                  </span>
                  <span className="bk-pay-logo card">
                    <Icon name="visa" size={22} />
                  </span>
                </button>

                <button
                  className={`bk-pay ${payMethod === "mastercard" ? "on" : ""}`}
                  onClick={() => setPayMethod("mastercard")}
                >
                  <span className="bk-pay-radio" />
                  <span className="bk-pay-info">
                    <strong>Mastercard</strong>
                    <em>{t("bk.mastercard_desc")}</em>
                  </span>
                  <span className="bk-pay-logo card">
                    <Icon name="mastercard" size={22} />
                  </span>
                </button>
              </div>

              {/* promo code */}
              <div className="bk-promo">
                <label>{t("bk.promo")}</label>
                {coupon ? (
                  <div className="bk-promo-applied">
                    <Icon name="check" size={15} strokeWidth={3} style={{ color: "var(--teal)" }} />
                    <span><strong>{coupon.code}</strong> · {t("bk.promo_applied")}</span>
                    <button onClick={removePromo}>{t("bk.promo_remove")}</button>
                  </div>
                ) : (
                  <div className="bk-promo-input">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
                      placeholder={t("bk.promo_ph")}
                      onKeyDown={(e) => { if (e.key === "Enter") applyPromo(); }}
                    />
                    <button onClick={applyPromo}>{t("bk.promo_apply")}</button>
                  </div>
                )}
                {promoError && <span className="bk-err">{t("bk.promo_invalid")}</span>}
              </div>

              {/* Surfaces backend errors when a booking creation request is
                  rejected. Replaces the previous "show fake confirmation"
                  behavior which silently lied to users about successful
                  reservations that didn't exist. We try to localize the
                  message via the error code; if the code isn't in our
                  strings table (or wasn't provided), we fall back to the
                  raw English message from the backend. */}
              {bookingError && (
                <div className="bk-booking-err" role="alert">
                  <Icon name="shield" size={18} style={{ color: "var(--red)" }} />
                  <div>
                    <strong>{t("bk.err_could_not_create")}</strong>
                    <p>
                      {bookingError.code && t(`errors.dates.${bookingError.code}`) !== `errors.dates.${bookingError.code}`
                        ? t(`errors.dates.${bookingError.code}`)
                        : bookingError.message}
                    </p>
                  </div>
                </div>
              )}

              <button className="bk-cta" onClick={payNow} disabled={processing}>
                {processing ? t("bk.processing") : `${t("bk.pay_now")} · ${formatPrice(total)}`}
              </button>

              <button className="bk-back" onClick={() => setStep(1)}>
                <Icon name="arrow" size={15} strokeWidth={2.5} className="icon-flip" />
                {t("bk.back")}
              </button>

              <p className="bk-secure">
                <Icon name="shield" size={14} style={{ color: "var(--gray-400)" }} />
                {t("detail.secured")}
              </p>
            </div>
          )}

          {/* ================= STEP 3 — CONFIRMATION ================= */}
          {step === 3 && (
            <div className="bk-confirm-wrap">
              {/* ---- HERO — seal + headline + reference ---- */}
              <div className="bk-confirm-hero">
                <div className="bk-confirm-glow" aria-hidden="true" />
                <div className="bk-confirm-seal">
                  <Icon name="check" size={42} strokeWidth={3} style={{ color: "#fff" }} />
                </div>
                <h2 className="bk-confirm-title display">{t("bk.pending_title")}</h2>
                <p className="bk-confirm-sub">{t("bk.pending_sub")}</p>

                {/* Reference card with copy-to-clipboard. The ref is the
                    artifact the user will share with the hotel and use to
                    look up their booking — making it copy-able is small
                    but actually useful. */}
                <div className="bk-confirm-ref">
                  <span className="bk-confirm-ref-label">{t("bk.your_ref")}</span>
                  <div className="bk-confirm-ref-row">
                    <span className="bk-confirm-ref-code">{reference}</span>
                    <button
                      type="button"
                      className="bk-confirm-copy"
                      onClick={copyReference}
                      aria-label={copied ? t("bk.copied") : t("bk.copy")}
                    >
                      {copied ? t("bk.copied") : t("bk.copy")}
                    </button>
                  </div>
                </div>
              </div>

              {/* ---- TRIP RECAP — what they actually booked ----
                  The user might be paying attention or might be skim-
                  reading this page. Showing the hotel + dates + total
                  once more reassures them and reduces "wait did I book
                  the right hotel?" anxiety. */}
              <div className="bk-confirm-trip">
                {(room.photos?.[0] || hotel.primaryPhoto) && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={room.photos?.[0] || hotel.primaryPhoto}
                    alt={hotel.name}
                    className="bk-confirm-trip-img"
                  />
                )}
                <div className="bk-confirm-trip-body">
                  <div className="bk-confirm-trip-hotel">{hotel.name}</div>
                  <div className="bk-confirm-trip-room">{room.type}</div>
                  <div className="bk-confirm-trip-dates">
                    {fmt(checkIn)} → {fmt(checkOut)} · {nights} {nights === 1 ? t("bk.night") : t("bk.nights")}
                  </div>
                  <div className="bk-confirm-trip-total">{formatPrice(total)}</div>
                </div>
              </div>

              {/* ---- WHAT HAPPENS NEXT — visual timeline ---- */}
              <div className="bk-confirm-next">
                <h3>{t("bk.next_title")}</h3>
                <ol className="bk-confirm-timeline">
                  <li>
                    <span className="bk-confirm-step">1</span>
                    <div>
                      <strong>{t("bk.next1_title")}</strong>
                      <em>{t("bk.next1")}</em>
                    </div>
                  </li>
                  <li>
                    <span className="bk-confirm-step">2</span>
                    <div>
                      <strong>{t("bk.next2_title")}</strong>
                      <em>{t("bk.next2")}</em>
                    </div>
                  </li>
                  <li>
                    <span className="bk-confirm-step">3</span>
                    <div>
                      <strong>{t("bk.next3_title")}</strong>
                      <em>{t("bk.next3")}</em>
                    </div>
                  </li>
                </ol>
              </div>

              {/* ---- ACTIONS ---- */}
              <div className="bk-confirm-actions">
                {/* Primary CTA varies based on auth state. If the user is
                    signed in (or just had an account created at booking
                    time), the most useful next action is "view my booking
                    in /account." Otherwise, suggest browsing more hotels. */}
                {user ? (
                  <Link href="/account" className="bk-confirm-primary">
                    {t("bk.view_my_booking")}
                  </Link>
                ) : createAccount ? (
                  // Guest who asked to create an account but the email was
                  // already registered (silent skip on backend). Send them
                  // to sign-in to access the booking we just attached by
                  // email-ownership rule.
                  <Link
                    href={`/signin?email=${encodeURIComponent(email)}&next=/account`}
                    className="bk-confirm-primary"
                  >
                    {t("bk.signin_to_view")}
                  </Link>
                ) : (
                  <Link href="/hotels" className="bk-confirm-primary">
                    {t("bk.browse_more")}
                  </Link>
                )}
                <Link href="/" className="bk-confirm-secondary">{t("bk.back_home")}</Link>
              </div>

              <div className="bk-confirm-tip">
                {t("bk.confirm_email_tip")} <strong>{email}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ================= SUMMARY SIDEBAR ================= */}
        {step < 3 && (
          <aside className="bk-summary">
            <div className="bk-sum-hotel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={room.photos?.[0] || hotel.primaryPhoto} alt={hotel.name} />
              <div>
                <strong>{hotel.name}</strong>
                <span>{room.type}</span>
              </div>
            </div>

            <div className="bk-sum-trip">
              <div className="bk-sum-row">
                <span>{t("bk.checkin")}</span>
                <strong>{fmt(checkIn)}</strong>
              </div>
              <div className="bk-sum-row">
                <span>{t("bk.checkout")}</span>
                <strong>{fmt(checkOut)}</strong>
              </div>
            </div>

            <div className="bk-sum-prices">
              <div className="bk-sum-row">
                <span>
                  {roomsQty > 1 ? `${roomsQty} ${t("bk.rooms") || "rooms"} · ` : ""}
                  {t("bk.room_x_nights")} {nights} {nightLabel}
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="bk-sum-row discount">
                  <span>{t("bk.discount")} ({coupon.code})</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="bk-sum-row">
                <span>{t("bk.taxes")}</span>
                <span className="bk-inc">{t("bk.taxes_inc")}</span>
              </div>
              <div className="bk-sum-total">
                <span>{t("bk.total")}</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
          </aside>
        )}
      </div>

      <style jsx>{`
        .bk { min-height: 70vh; background: var(--cream); padding-bottom: 80px; }

        /* progress steps */
        .bk-steps { background: #fff; border-bottom: 1px solid var(--gray-200); }
        .bk-steps-inner { display: flex; gap: 8px; padding: 20px 0; }
        .bk-step { display: flex; align-items: center; gap: 9px; opacity: 0.45; }
        .bk-step.done { opacity: 1; }
        .bk-step.current .bk-step-label { color: var(--ink); }
        .bk-step:not(:last-child) { flex: 1; }
        .bk-step:not(:last-child)::after {
          content: ''; flex: 1; height: 2px; background: var(--gray-200); margin-left: 4px;
        }
        .bk-step.done:not(:last-child)::after { background: var(--ink); }
        .bk-step-num {
          width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--gray-200); color: var(--gray-400);
          font-size: 13px; font-weight: 700;
        }
        .bk-step.done .bk-step-num { background: var(--ink); color: #fff; }
        .bk-step-label { font-size: 13.5px; font-weight: 600; color: var(--gray-400); white-space: nowrap; }

        /* layout */
        .bk-body {
          display: grid; grid-template-columns: 1fr 360px; gap: 28px;
          padding-top: 32px; align-items: start;
        }
        /* When we're on step 3 (confirmation), the right-column summary
           sidebar is removed. The grid still reserves the 360px track
           though, which leaves the confirmation card centered within
           a narrower-than-page left column — looks left-aligned to the
           user. Switching to a single column with the confirmation wrap
           handling its own max-width + auto margins gives proper page
           centering. */
        .bk-body-confirm {
          grid-template-columns: 1fr;
        }
        .bk-card {
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg);
          padding: 32px;
        }
        .bk-card h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin-bottom: 22px; }

        /* fields */
        .bk-field { margin-bottom: 18px; }
        .bk-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .bk-field label {
          display: block; font-size: 13px; font-weight: 700; color: var(--ink-2);
          margin-bottom: 7px;
        }
        .bk-req { color: var(--red); font-weight: 800; }
        .bk-field input, .bk-field textarea {
          width: 100%; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          padding: 13px 15px; font-size: 14.5px; font-family: inherit; color: var(--ink);
          outline: none; transition: border-color .15s; background: #fff;
        }
        .bk-field input:focus, .bk-field textarea:focus { border-color: var(--ink); }
        .bk-field input.err { border-color: var(--red); }
        .bk-field textarea { resize: vertical; }
        .bk-err { display: block; color: var(--red); font-size: 12.5px; font-weight: 600; margin-top: 6px; }

        /* Booking-creation error banner — appears above the Pay button when
           the backend rejects a booking. Designed to be visible without
           being alarming: red accent + clear heading, but tucked into the
           existing form flow rather than a modal interruption. */
        .bk-booking-err {
          display: flex; gap: 12px;
          padding: 14px 16px;
          margin: 14px 0 16px;
          background: rgba(230, 57, 70, 0.06);
          border: 1px solid rgba(230, 57, 70, 0.25);
          border-left: 3px solid var(--red);
          border-radius: var(--r-sm);
        }
        .bk-booking-err strong {
          display: block; font-size: 13.5px; color: var(--ink); margin-bottom: 4px;
        }
        .bk-booking-err p {
          margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.45;
        }

        .bk-check {
          display: flex; align-items: center; gap: 10px; margin: 6px 0 24px;
          cursor: pointer; font-size: 14px; font-weight: 600; color: var(--ink-2);
        }
        .bk-check input { width: 18px; height: 18px; accent-color: var(--red); cursor: pointer; }

        .bk-cta {
          width: 100%; background: var(--red); color: #fff; border: none;
          border-radius: var(--r-sm); padding: 16px; font-size: 15.5px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          font-family: inherit; transition: background .2s;
        }
        .bk-cta:hover { background: var(--red-deep); }
        .bk-cta:disabled { opacity: 0.6; cursor: default; }

        .bk-signin { text-align: center; margin-top: 18px; }
        .bk-signin :global(a) {
          font-size: 13.5px; font-weight: 600; color: var(--ink-2); text-decoration: underline;
        }

        .bk-back {
          width: 100%; background: none; border: none; margin-top: 14px;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          font-size: 14px; font-weight: 600; color: var(--gray-400); cursor: pointer;
          font-family: inherit;
        }

        /* payment methods */
        .bk-pay-methods { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .bk-pay {
          display: flex; align-items: center; gap: 14px; width: 100%;
          border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          padding: 16px 18px; background: #fff; cursor: pointer; text-align: left;
          transition: border-color .15s, background .15s;
        }
        .bk-pay:hover { border-color: var(--gray-300); }
        .bk-pay.on { border-color: var(--red); background: var(--red-soft); }
        .bk-pay-radio {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid var(--gray-300); position: relative;
        }
        .bk-pay.on .bk-pay-radio { border-color: var(--red); }
        .bk-pay.on .bk-pay-radio::after {
          content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--red);
        }
        .bk-pay-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .bk-pay-info strong { font-size: 15px; font-weight: 700; color: var(--ink); }
        .bk-pay-info em { font-size: 12.5px; font-style: normal; color: var(--gray-400); }
        .bk-pay-logo {
          font-weight: 800; font-size: 13px; color: #fff; background: var(--ink);
          padding: 6px 10px; border-radius: 6px; letter-spacing: 0.02em;
        }
        .bk-pay-logo.gold { background: #C8951C; }
        /* For icon-based marks (Visa/Mastercard). Neutral chrome — holds the
           Icon glyph centred. Replace the placeholder glyph in Icon.js with the
           official brand SVGs; this box just frames them. */
        .bk-pay-logo.card {
          background: var(--cream); border: 1px solid var(--gray-200);
          padding: 5px 9px; display: inline-flex; align-items: center; color: var(--ink);
        }

        /* promo */
        .bk-promo { margin-bottom: 24px; }
        .bk-promo label {
          display: block; font-size: 13px; font-weight: 700; color: var(--ink-2); margin-bottom: 7px;
        }
        .bk-promo-input { display: flex; gap: 8px; }
        .bk-promo-input input {
          flex: 1; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          padding: 12px 14px; font-size: 14px; font-family: inherit; outline: none;
          text-transform: uppercase;
        }
        .bk-promo-input input:focus { border-color: var(--ink); }
        .bk-promo-input button {
          border: none; background: var(--ink); color: #fff; padding: 0 22px;
          border-radius: var(--r-sm); font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: inherit;
        }
        .bk-promo-applied {
          display: flex; align-items: center; gap: 9px;
          background: var(--teal-soft); border-radius: var(--r-sm); padding: 12px 14px;
        }
        .bk-promo-applied span { flex: 1; font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .bk-promo-applied button {
          border: none; background: none; color: var(--gray-400); font-size: 12.5px;
          font-weight: 700; cursor: pointer; text-decoration: underline; font-family: inherit;
        }

        .bk-secure {
          display: flex; align-items: center; gap: 7px; justify-content: center;
          margin-top: 18px; font-size: 11.5px; color: var(--gray-400); font-weight: 500;
          line-height: 1.5; text-align: center;
        }

        /* =====================================================
           CONFIRMATION STEP — full redesign 2026-05-26
           =====================================================
           Replaces the previous plain white card with a richer,
           more celebratory layout: hero block with a glow behind
           the seal, a copy-able reference, a trip recap card with
           the hotel photo, a visual timeline for "what happens
           next", and clearer dual CTAs. The goal is to make the
           post-booking moment feel like a small win rather than
           a transactional acknowledgment.
        */
        .bk-confirm-wrap {
          max-width: 580px;
          margin: 0 auto;
          padding: 0;
        }

        /* ---- Hero with glow ---- */
        .bk-confirm-hero {
          position: relative;
          background: #fff;
          border-radius: var(--r-lg);
          padding: 48px 36px 36px;
          margin-bottom: 16px;
          text-align: center;
          overflow: hidden;
          border: 1px solid var(--gray-100);
        }
        .bk-confirm-glow {
          position: absolute;
          top: 0; left: 50%;
          width: 320px; height: 320px;
          transform: translateX(-50%) translateY(-50%);
          background: radial-gradient(closest-side, rgba(27,138,90,0.18), rgba(27,138,90,0));
          pointer-events: none;
        }
        .bk-confirm-seal {
          position: relative;
          width: 84px; height: 84px;
          border-radius: 50%;
          background: var(--teal);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 12px 30px rgba(27,138,90,0.28);
          animation: seal-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes seal-pop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .bk-confirm-title {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: var(--ink);
          margin-bottom: 10px;
          position: relative;
        }
        .bk-confirm-sub {
          color: var(--gray-400);
          font-size: 14.5px;
          max-width: 420px;
          margin: 0 auto 28px;
          line-height: 1.6;
          position: relative;
        }

        /* ---- Reference card with copy ---- */
        .bk-confirm-ref {
          background: var(--cream);
          border: 1px dashed var(--gray-300);
          border-radius: var(--r-md);
          padding: 18px 20px;
          position: relative;
        }
        .bk-confirm-ref-label {
          display: block;
          font-size: 10.5px;
          font-weight: 700;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        .bk-confirm-ref-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .bk-confirm-ref-code {
          font-size: 22px;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: 0.04em;
          font-family: ui-monospace, SFMono-Regular, monospace;
          word-break: break-all;
        }
        .bk-confirm-copy {
          flex-shrink: 0;
          background: #fff;
          border: 1.5px solid var(--gray-200);
          border-radius: 980px;
          padding: 6px 14px;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--ink);
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .bk-confirm-copy:hover {
          border-color: var(--ink);
        }
        .bk-confirm-copy:active {
          background: var(--ink);
          color: #fff;
        }

        /* ---- Trip recap (what you booked) ---- */
        .bk-confirm-trip {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid var(--gray-100);
          border-radius: var(--r-lg);
          padding: 14px;
          margin-bottom: 16px;
        }
        .bk-confirm-trip-img {
          width: 96px;
          height: 96px;
          object-fit: cover;
          border-radius: var(--r-sm);
          flex-shrink: 0;
        }
        .bk-confirm-trip-body { flex: 1; min-width: 0; }
        .bk-confirm-trip-hotel {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.01em;
          margin-bottom: 2px;
        }
        .bk-confirm-trip-room {
          font-size: 12.5px;
          color: var(--gray-400);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .bk-confirm-trip-dates {
          font-size: 12.5px;
          color: var(--ink-2);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .bk-confirm-trip-total {
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
        }

        /* ---- What happens next — visual timeline ---- */
        .bk-confirm-next {
          background: #fff;
          border: 1px solid var(--gray-100);
          border-radius: var(--r-lg);
          padding: 22px 24px;
          margin-bottom: 18px;
        }
        .bk-confirm-next h3 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gray-400);
          margin-bottom: 16px;
        }
        .bk-confirm-timeline {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
        }
        /* Vertical line that visually connects the numbered steps. */
        .bk-confirm-timeline::before {
          content: "";
          position: absolute;
          left: 13px;
          top: 24px;
          bottom: 24px;
          width: 2px;
          background: var(--gray-100);
          z-index: 0;
        }
        .bk-confirm-timeline li {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          position: relative;
          z-index: 1;
        }
        .bk-confirm-step {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--ink);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #fff;
        }
        .bk-confirm-timeline li strong {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 2px;
        }
        .bk-confirm-timeline li em {
          font-style: normal;
          display: block;
          font-size: 12.5px;
          color: var(--ink-2);
          line-height: 1.5;
        }

        /* ---- Actions ---- */
        .bk-confirm-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .bk-confirm-primary, .bk-confirm-secondary {
          flex: 1;
          padding: 15px;
          border-radius: var(--r-sm);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .bk-confirm-primary {
          background: var(--ink);
          color: #fff;
        }
        .bk-confirm-primary:hover { background: var(--red); }
        .bk-confirm-secondary {
          background: #fff;
          color: var(--ink);
          border: 1.5px solid var(--gray-200);
        }
        .bk-confirm-secondary:hover { border-color: var(--ink); }

        /* ---- Email tip ---- */
        .bk-confirm-tip {
          text-align: center;
          font-size: 12px;
          color: var(--gray-400);
          line-height: 1.5;
          padding: 4px 8px;
        }

        /* ---- Mobile tightening ---- */
        @media (max-width: 560px) {
          .bk-confirm-hero { padding: 36px 22px 28px; }
          .bk-confirm-title { font-size: 24px; }
          .bk-confirm-ref { padding: 14px 16px; }
          .bk-confirm-ref-code { font-size: 18px; }
          .bk-confirm-ref-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .bk-confirm-trip-img { width: 80px; height: 80px; }
          .bk-confirm-trip-hotel { font-size: 14px; }
          .bk-confirm-actions { flex-direction: column; gap: 8px; }
          .bk-confirm-next { padding: 18px 18px; }
        }

        /* summary sidebar */
        .bk-summary {
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg);
          padding: 22px; position: sticky; top: 24px;
        }
        .bk-sum-hotel { display: flex; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid var(--gray-100); }
        .bk-sum-hotel img { width: 64px; height: 64px; border-radius: var(--r-sm); object-fit: cover; flex-shrink: 0; }
        .bk-sum-hotel div { display: flex; flex-direction: column; gap: 3px; justify-content: center; }
        .bk-sum-hotel strong { font-size: 14.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .bk-sum-hotel span { font-size: 13px; color: var(--gray-400); }
        .bk-sum-trip { padding: 16px 0; border-bottom: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 9px; }
        .bk-sum-prices { padding-top: 16px; display: flex; flex-direction: column; gap: 9px; }
        .bk-sum-row { display: flex; justify-content: space-between; font-size: 13.5px; color: var(--ink-2); }
        .bk-sum-row strong { font-weight: 700; color: var(--ink); }
        .bk-sum-row.discount { color: var(--teal); font-weight: 600; }
        .bk-inc { color: var(--teal); font-weight: 600; }
        .bk-sum-total {
          display: flex; justify-content: space-between; align-items: baseline;
          padding-top: 14px; margin-top: 6px; border-top: 1px solid var(--gray-200);
        }
        .bk-sum-total span { font-size: 14px; font-weight: 700; color: var(--ink); }
        .bk-sum-total strong { font-size: 22px; font-weight: 800; color: var(--ink); }

        @media (max-width: 860px) {
          .bk-body { grid-template-columns: 1fr; }
          .bk-card { padding: 22px; }
          .bk-field-row { grid-template-columns: 1fr; gap: 0; }
          .bk-step-label { display: none; }
          .bk-step:not(:last-child) { flex: 1; }
          .bk-summary { position: static; order: -1; }
          .bk-steps-inner { padding: 16px 0; }
        }
      `}</style>
    </div>
  );
}

// format a YYYY-MM-DD string as a local date label
function fmt(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}
