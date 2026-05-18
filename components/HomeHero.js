"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

export default function HomeHero() {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [guests, setGuests] = useState(2);

  function search() {
    const params = new URLSearchParams();
    const q = dest.trim();
    if (q) params.set("q", q);
    if (guests) params.set("guests", String(guests));
    const qs = params.toString();
    router.push(qs ? `/hotels?${qs}` : "/hotels");
  }

  return (
    <header className="nz-hero">
      <div className="nz-hero-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1600&q=85"
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
          <span className="l2">
            <span className="accent">Booked in seconds.</span>
          </span>
        </h1>
        <p>
          Ten verified hotels, from the dunes of Djanet to the Mediterranean coast —
          with instant confirmation and Algerian payments.
        </p>

        <div className="nz-hero-search">
          <div className="hsf">
            <label>Destination</label>
            <input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Algiers, Oran, Djanet…"
            />
          </div>
          <div className="hsf">
            <label>Check in</label>
            <input type="date" />
          </div>
          <div className="hsf">
            <label>Check out</label>
            <input type="date" />
          </div>
          <div className="hsf">
            <label>Guests</label>
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
          </div>
          <button className="hs-submit" onClick={search}>
            Search <Icon name="arrow" size={17} strokeWidth={2.5} />
          </button>
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
        .nz-hero { position: relative; height: 100vh; min-height: 720px; overflow: hidden; }
        .nz-hero-photo { position: absolute; inset: 0; }
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
        .nz-hero-search {
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.32);
          backdrop-filter: blur(28px) saturate(1.4);
          border-radius: var(--r-lg); padding: 9px;
          display: flex; gap: 6px; max-width: 860px;
          box-shadow: 0 32px 64px -24px rgba(0,0,0,0.5);
          opacity: 0; animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.7s forwards;
        }
        .hsf { flex: 1; padding: 12px 20px; border-radius: 13px; transition: background .2s; }
        .hsf:hover { background: rgba(255,255,255,0.16); }
        .hsf label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255,255,255,0.7); display: block; margin-bottom: 5px;
        }
        .hsf input {
          border: none; background: transparent; outline: none; width: 100%;
          font-size: 14px; font-weight: 600; color: #fff;
        }
        .hsf select {
          border: none; background: transparent; outline: none; width: 100%;
          font-size: 14px; font-weight: 600; color: #fff; cursor: pointer;
          -webkit-appearance: none; appearance: none;
        }
        .hsf select option { color: var(--ink); }
        .hsf input::placeholder { color: rgba(255,255,255,0.6); font-weight: 500; }
        .hsf input[type="date"] { color-scheme: dark; }
        .hs-submit {
          background: var(--red); color: #fff; border: none; border-radius: 13px;
          padding: 0 32px; font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 600;
          display: flex; align-items: center; gap: 9px; transition: background .2s, transform .15s;
          white-space: nowrap;
        }
        .hs-submit:hover { background: var(--red-deep); transform: scale(1.02); }
        .nz-hero-foot {
          position: absolute; left: 52px; right: 52px; bottom: 32px; z-index: 10;
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
          .nz-hero-search { flex-direction: column; gap: 2px; }
          .nz-hero-foot { left: 22px; right: 22px; }
          .nz-hero-foot-trust { display: none; }
        }
        @media (max-width: 560px) {
          .nz-hero { height: auto; min-height: 100svh; padding: 96px 0 130px; }
          .nz-hero-photo img { animation: none; }
          .nz-hero-inner { position: relative; padding: 0 20px; }
          .nz-hero-badge { font-size: 11px; padding: 8px 14px; margin-bottom: 20px; }
          .nz-hero h1 { font-size: 40px; line-height: 1.02; margin-bottom: 18px; }
          .nz-hero h1 .accent { white-space: normal; }
          .nz-hero p { font-size: 15px; margin-bottom: 26px; }
          .nz-hero-search { padding: 7px; }
          .hsf { padding: 11px 16px; }
          .hsf:not(:last-of-type) { border-bottom: 1px solid rgba(255,255,255,0.14); }
          .hs-submit { padding: 14px; margin-top: 4px; justify-content: center; }
          .nz-hero-foot { bottom: 22px; }
          .nz-hero-credit { font-size: 10px; }
        }
      `}</style>
    </header>
  );
}
