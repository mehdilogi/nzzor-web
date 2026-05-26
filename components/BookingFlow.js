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

export default function BookingFlow({ hotel, room, nights, checkIn, checkOut }) {
  const { t } = useLang();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);

  // guest details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
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
  const subtotal = room.price * nights;
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const total = subtotal - discount;

  // ---- validation ----------------------------------------------------------
  function validateStep1() {
    const e = {};
    if (!name.trim() || name.trim().length < 3) e.name = t("bk.err_name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t("bk.err_email");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) e.phone = t("bk.err_phone");
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

    // backend payment-method codes are uppercase
    const methodCode = payMethod === "edahabia" ? "EDDAHABIA" : "CIB";

    // payload shaped exactly as the backend's bookings route expects
    const payload = {
      hotelId: hotel.id,
      rooms: [{ roomId: room.id, quantity: 1 }],
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
      // extra context the backend can ignore safely if it doesn't use it
      createAccount,
      promoCode: coupon?.code || undefined,
    };
    const result = await createBooking(payload);
    setProcessing(false);
    if (result.ok) {
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

      <div className="wrap bk-body">
        <div className="bk-main">
          {/* ================= STEP 1 — DETAILS ================= */}
          {step === 1 && (
            <div className="bk-card">
              <h2 className="display">{t("bk.guest_details")}</h2>

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
                    onChange={(e) => setCreateAccount(e.target.checked)}
                  />
                  <span>{t("bk.account_offer")}</span>
                </label>
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
            <div className="bk-card bk-confirm">
              <div className="bk-confirm-seal">
                <Icon name="check" size={34} strokeWidth={3} style={{ color: "#fff" }} />
              </div>
              <h2 className="display">{t("bk.pending_title")}</h2>
              <p className="bk-confirm-sub">{t("bk.pending_sub")}</p>

              <div className="bk-ref">
                <span className="bk-ref-label">{t("bk.your_ref")}</span>
                <span className="bk-ref-code">{reference}</span>
              </div>

              <div className="bk-next">
                <h3>{t("bk.next_title")}</h3>
                <ol>
                  <li><span>1</span>{t("bk.next1")}</li>
                  <li><span>2</span>{t("bk.next2")}</li>
                  <li><span>3</span>{t("bk.next3")}</li>
                </ol>
              </div>

              <div className="bk-confirm-actions">
                {createAccount && !user ? (
                  <Link
                    href={`/signup?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(name.split(/\s+/)[0] || "")}&next=/account`}
                    className="bk-confirm-home"
                  >
                    {t("auth.signup")}
                  </Link>
                ) : (
                  <Link href="/" className="bk-confirm-home">{t("bk.back_home")}</Link>
                )}
                <Link href="/hotels" className="bk-confirm-hotels">{t("bk.view_hotels")}</Link>
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
                <span>{t("bk.room_x_nights")} {nights} {nightLabel}</span>
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

        /* confirmation */
        .bk-confirm { text-align: center; }
        .bk-confirm-seal {
          width: 72px; height: 72px; border-radius: 50%; background: var(--teal);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
        }
        .bk-confirm h2 { margin-bottom: 8px; }
        .bk-confirm-sub { color: var(--gray-400); font-size: 15px; max-width: 420px; margin: 0 auto 24px; line-height: 1.6; }
        .bk-ref {
          background: var(--cream); border: 1px dashed var(--gray-300); border-radius: var(--r-sm);
          padding: 18px; margin-bottom: 28px;
        }
        .bk-ref-label { display: block; font-size: 12px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .bk-ref-code { font-size: 26px; font-weight: 800; color: var(--ink); letter-spacing: 0.04em; }
        .bk-next { text-align: left; margin-bottom: 28px; }
        .bk-next h3 { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 14px; }
        .bk-next ol { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .bk-next li {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 13.5px; color: var(--ink-2); font-weight: 500; line-height: 1.5;
        }
        .bk-next li span {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: var(--ink); color: #fff; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .bk-confirm-actions { display: flex; gap: 10px; }
        .bk-confirm-home, .bk-confirm-hotels {
          flex: 1; padding: 14px; border-radius: var(--r-sm); font-size: 14px;
          font-weight: 700; text-decoration: none; text-align: center;
        }
        .bk-confirm-home { background: var(--ink); color: #fff; }
        .bk-confirm-hotels { background: var(--gray-100); color: var(--ink); }

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
