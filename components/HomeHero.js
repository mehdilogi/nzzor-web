"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import DateRangePicker from "./DateRangePicker";
import { MOCK_CITIES } from "../lib/mockData";

// search bar steps: city -> dates -> guests, with auto-advance
export default function HomeHero() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [open, setOpen] = useState(null); // 'city' | 'dates' | 'guests' | null
  const barRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (barRef.current && !barRef.current.contains(e.target)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function search() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    const qs = params.toString();
    router.push(qs ? `/hotels?${qs}` : "/hotels");
  }

  function pickCity(c) {
    setCity(c);
    setOpen("dates"); // auto-advance
  }

  const dateLabel =
    checkIn && checkOut
      ? `${fmtDate(checkIn)} — ${fmtDate(checkOut)}`
      : checkIn
      ? `${fmtDate(checkIn)} — …`
      : "Add dates";

  return (
    <header className="nz-hero">
      <div className="nz-hero-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.istockphoto.com/photo/bay-of-algiers-gm1213558494-352743184"
          alt="Algeria"
        />
      </div>

      <div className="nz-hero-inner">
        <div className="nz-hero-badge">
          <span className="pin" />
          Licensed by the Algerian Ministry of Tourism
        </div>
        <h1 className="display">
          <span className="l1">Discover Algeria.</span>
          <span className="l2"><span className="accent">Booked in seconds.</span></span>
        </h1>
        <p>
          Ten verified hotels, from the dunes of Djanet to the Mediterranean coast —
          with instant confirmation and Algerian payments.
        </p>

        {/* SEARCH BAR */}
        <div className="nz-search" ref={barRef}>
          {open && <div className="nzs-backdrop" onClick={() => setOpen(null)} />}
          <div className="nz-search-bar">
            <button
              className={`nzs-field ${open === "city" ? "active" : ""}`}
              onClick={() => setOpen(open === "city" ? null : "city")}
            >
              <span className="nzs-label">Destination</span>
              <span className={`nzs-value ${city ? "" : "ph"}`}>{city || "Where to?"}</span>
            </button>

            <button
              className={`nzs-field ${open === "dates" ? "active" : ""}`}
              onClick={() => setOpen(open === "dates" ? null : "dates")}
            >
              <span className="nzs-label">Dates</span>
              <span className={`nzs-value ${checkIn ? "" : "ph"}`}>{dateLabel}</span>
            </button>

            <button
              className={`nzs-field ${open === "guests" ? "active" : ""}`}
              onClick={() => setOpen(open === "guests" ? null : "guests")}
            >
              <span className="nzs-label">Guests</span>
              <span className="nzs-value">{guests} {guests === 1 ? "guest" : "guests"}</span>
            </button>

            <button className="nzs-submit" onClick={search}>
              <Icon name="search" size={18} strokeWidth={2.4} />
              <span>Search</span>
            </button>
          </div>

          {open === "city" && (
            <div className="nzs-panel">
              <div className="nzs-panel-title">Choose a destination</div>
              <div className="nzs-cities">
                {MOCK_CITIES.map((c) => (
                  <button key={c.key} className="nzs-city" onClick={() => pickCity(c.name)}>
                    <Icon name="pin" size={16} style={{ color: "var(--red)" }} />
                    <span>
                      <strong>{c.name}</strong>
                      <em>{c.hotelCount} hotel{c.hotelCount === 1 ? "" : "s"}</em>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {open === "dates" && (
            <div className="nzs-panel">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={({ checkIn: ci, checkOut: co }) => {
                  setCheckIn(ci);
                  setCheckOut(co);
                }}
                onComplete={() => setOpen("guests")}
              />
            </div>
          )}

          {open === "guests" && (
            <div className="nzs-panel">
              <div className="nzs-panel-title">How many guests?</div>
              <div className="nzs-guests">
                <span>Travelers</span>
                <div className="nzs-stepper">
                  <button onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1}>−</button>
                  <strong>{guests}</strong>
                  <button onClick={() => setGuests((g) => Math.min(10, g + 1))} disabled={guests >= 10}>+</button>
                </div>
              </div>
              <button className="nzs-done" onClick={() => { setOpen(null); search(); }}>
                Search hotels
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nz-hero-foot">
        <div className="nz-hero-foot-trust">
          <span>✓ Instant confirmation</span>
          <span>✓ CIB &amp; Eddahabia</span>
          <span>✓ 24/7 WhatsApp support</span>
        </div>
        <div className="nz-hero-credit">Tassili n&apos;Ajjer, Djanet</div>
      </div>

      <style jsx>{`
        .nz-hero { position: relative; height: 100vh; min-height: 720px; }
        .nz-hero-photo { position: absolute; inset: 0; overflow: hidden; }
        .nz-hero-photo img {
          width: 100%; height: 100%; object-fit: cover;
          animation: kenburns 24s ease-out infinite alternate;
        }
        .nz-hero-photo::after {
          content: ''; position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(20,20,26,0.32) 0%, transparent 22%, transparent 50%, rgba(20,20,26,0.55) 100%),
            linear-gradient(105deg, rgba(20,20,26,0.45) 0%, transparent 55%);
        }
        .nz-hero-inner {
          position: absolute; inset: 0; z-index: 10;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 52px; max-width: 1100px;
        }
        .nz-hero-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(14px); padding: 9px 17px; border-radius: 980px;
          font-size: 12.5px; font-weight: 600; color: #fff; width: fit-content;
          margin-bottom: 28px;
          opacity: 0; animation: rise .9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards;
        }
        .nz-hero-badge .pin {
          width: 7px; height: 7px; border-radius: 50%; background: #1B8A5A;
          animation: pinpulse 2s infinite;
        }
        .nz-hero h1 {
          font-size: clamp(50px, 7.5vw, 104px); line-height: 0.96; font-weight: 600;
          letter-spacing: -0.035em; color: #fff; margin-bottom: 26px; max-width: 900px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.3);
        }
        .nz-hero h1 .l1 { display: block; opacity: 0; animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; }
        .nz-hero h1 .l2 { display: block; opacity: 0; animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.42s forwards; }
        .nz-hero h1 .accent {
          white-space: nowrap;
          background: linear-gradient(120deg, #fff 30%, var(--red));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nz-hero p {
          font-size: 18px; color: rgba(255,255,255,0.92); max-width: 480px; line-height: 1.6;
          font-weight: 500; margin-bottom: 40px; text-shadow: 0 1px 20px rgba(0,0,0,0.3);
          opacity: 0; animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.55s forwards;
        }

        .nz-search {
          position: relative; max-width: 820px; z-index: 30;
          opacity: 0; animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.7s forwards;
        }
        .nz-search-bar {
          background: rgba(255,255,255,0.97); border-radius: var(--r-lg);
          padding: 8px; display: flex; gap: 4px;
          box-shadow: 0 32px 64px -24px rgba(0,0,0,0.5);
        }
        .nzs-field {
          flex: 1; text-align: left; border: none; background: transparent;
          padding: 12px 18px; border-radius: 14px; cursor: pointer; transition: background .15s;
          display: flex; flex-direction: column; gap: 3px; min-width: 0;
        }
        .nzs-field:hover { background: var(--gray-100); }
        .nzs-field.active { background: var(--gray-100); }
        .nzs-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--gray-400);
        }
        .nzs-value {
          font-size: 14px; font-weight: 700; color: var(--ink);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nzs-value.ph { color: var(--gray-300); font-weight: 500; }
        .nzs-submit {
          background: var(--red); color: #fff; border: none; border-radius: 14px;
          padding: 0 28px; font-family: 'Clash Display', sans-serif; font-size: 15px; font-weight: 600;
          display: flex; align-items: center; gap: 9px; transition: background .2s;
          white-space: nowrap;
        }
        .nzs-submit:hover { background: var(--red-deep); }

        /* panel: a centered modal anchored to the VIEWPORT, so it can never
           hang off-screen regardless of where the search bar sits */
        .nzs-backdrop {
          display: block; position: fixed; inset: 0;
          background: rgba(12,12,16,0.45); z-index: 240;
        }
        .nzs-panel {
          position: fixed; z-index: 250;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: min(520px, calc(100vw - 40px));
          background: #fff; border-radius: var(--r-lg); padding: 24px;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
          max-height: 80vh; overflow-y: auto;
        }
        .nzs-panel-title { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 16px; }
        .nzs-cities { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .nzs-city {
          display: flex; align-items: center; gap: 10px; padding: 11px 12px;
          border: none; background: transparent; border-radius: var(--r-sm);
          cursor: pointer; text-align: left; transition: background .15s;
        }
        .nzs-city:hover { background: var(--cream); }
        .nzs-city strong { display: block; font-size: 14px; font-weight: 700; color: var(--ink); }
        .nzs-city em { font-size: 12px; color: var(--gray-400); font-style: normal; }
        .nzs-guests {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0 16px;
        }
        .nzs-guests > span { font-size: 14px; font-weight: 700; }
        .nzs-stepper { display: flex; align-items: center; gap: 16px; }
        .nzs-stepper button {
          width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--gray-300);
          background: #fff; font-size: 18px; color: var(--ink); cursor: pointer; line-height: 1;
        }
        .nzs-stepper button:disabled { opacity: 0.3; cursor: default; }
        .nzs-stepper strong { font-size: 16px; min-width: 20px; text-align: center; }
        .nzs-done {
          width: 100%; padding: 13px; background: var(--red); color: #fff; border: none;
          border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .nzs-done:hover { background: var(--red-deep); }

        .nz-hero-foot {
          position: absolute; left: 52px; right: 52px; bottom: 32px; z-index: 5;
          display: flex; justify-content: space-between; align-items: center;
          opacity: 0; animation: fade 1.2s ease 1s forwards;
        }
        .nz-hero-foot-trust { display: flex; gap: 26px; }
        .nz-hero-foot-trust span { font-size: 12.5px; color: rgba(255,255,255,0.85); font-weight: 600; }
        .nz-hero-credit {
          font-size: 11px; color: rgba(255,255,255,0.65); letter-spacing: 0.06em;
          text-transform: uppercase; font-weight: 600;
        }

        @media (max-width: 860px) {
          .nz-hero-inner { padding: 0 22px; }
          .nz-hero-foot { left: 22px; right: 22px; }
          .nz-hero-foot-trust { display: none; }
        }
        @media (max-width: 560px) {
          .nz-hero { height: auto; min-height: 100svh; padding: 92px 0 120px; }
          .nz-hero-photo img { animation: none; }
          .nz-hero-inner { position: relative; padding: 0 20px; }
          .nz-hero-badge { font-size: 11px; padding: 8px 14px; margin-bottom: 20px; }
          .nz-hero h1 { font-size: 38px; line-height: 1.03; margin-bottom: 18px; }
          .nz-hero h1 .accent { white-space: normal; }
          .nz-hero p { font-size: 15px; margin-bottom: 24px; }
          .nz-search-bar { flex-direction: column; padding: 6px; gap: 2px; }
          .nzs-field { padding: 13px 16px; }
          .nzs-field:not(:last-of-type) { border-bottom: 1px solid var(--gray-100); }
          .nzs-submit { padding: 15px; justify-content: center; margin-top: 4px; }
          .nzs-cities { grid-template-columns: 1fr; }
          .nz-hero-foot { bottom: 20px; }
          /* panels become a bottom sheet on mobile — never clipped */
          .nzs-backdrop {
            display: block; position: fixed; inset: 0;
            background: rgba(12,12,16,0.5); z-index: 240;
          }
          .nzs-panel {
            position: fixed; top: auto; left: 0; right: 0; bottom: 0;
            transform: none; width: auto;
            border-radius: var(--r-lg) var(--r-lg) 0 0;
            padding: 22px 20px 28px;
            max-height: 80vh; overflow-y: auto;
            z-index: 250;
            box-shadow: 0 -20px 60px -10px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </header>
  );
}

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("en", { day: "numeric", month: "short" });
}
