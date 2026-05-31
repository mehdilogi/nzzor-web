"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import DateRangePicker from "./DateRangePicker";
import { MOCK_CITIES } from "../lib/mockData";
import { useLang } from "../lib/LangContext";
import { parseQuery } from "../lib/nlSearch";

// Show the BETA natural-language search toggle? Off = cleaner mobile UX
// (no typing input, no auto-popping keyboard, just the structured picker).
// The AI parser code stays in the build so flipping this back to true
// restores the toggle without another deploy.
const SHOW_AI_SEARCH = true;

// search bar steps: city -> dates -> guests, with auto-advance
export default function HomeHero() {
  const { t } = useLang();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [open, setOpen] = useState(null); // 'city' | 'dates' | 'guests' | null
  const [aiMode, setAiMode] = useState(false); // natural-language search toggle
  const [aiQuery, setAiQuery] = useState("");
  const barRef = useRef(null);

  // Live hotel counts per wilaya — overlaid on MOCK_CITIES so the picker
  // stays accurate as the partner adds hotels, without needing a redeploy.
  // Falls back gracefully to "no count shown" if the API is unreachable.
  const [liveCounts, setLiveCounts] = useState({});
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    if (!API) return;
    fetch(`${API}/api/hotels/meta/cities`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !Array.isArray(j.data)) return;
        const m = {};
        for (const c of j.data) m[c.key] = c.hotelCount;
        setLiveCounts(m);
      })
      .catch(() => {});
  }, []);

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
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    // keep `guests` for any code still reading the old param (total heads)
    params.set("guests", String(adults + children));
    const qs = params.toString();
    router.push(qs ? `/hotels?${qs}` : "/hotels");
  }

  // natural-language search — parse the sentence locally, then hand the
  // resulting structured filter to the results page as URL params.
  function aiSearch() {
    const q = aiQuery.trim();
    if (!q) return;
    const { filter } = parseQuery(q);
    const params = new URLSearchParams();
    if (filter.city) params.set("city", filter.city);
    if (filter.minStars) params.set("stars", String(filter.minStars));
    if (filter.maxPrice) params.set("maxPrice", String(filter.maxPrice));
    if (filter.minPrice) params.set("minPrice", String(filter.minPrice));
    if (filter.tags && filter.tags.length) params.set("tags", filter.tags.join(","));
    params.set("q", q); // keep the raw query so the results page can echo it
    params.set("ai", "1");
    router.push(`/hotels?${params.toString()}`);
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
          src="/hero-courtyard.jpg"
          alt="Algeria"
        />
      </div>

      <div className="nz-hero-inner">
        <div className="nz-hero-badge">
          <span className="pin" />
          {t("hero.badge")}
        </div>
        <h1 className="display">
          <span className="l1">{t("hero.title1")}</span>
          <span className="l2"><span className="accent">{t("hero.title2")}</span></span>
        </h1>
        <p>
          {t("hero.subtitle")}
        </p>

        {/* SEARCH BAR */}
        <div className="nz-search" ref={barRef}>
          {open && <div className="nzs-backdrop" onClick={() => setOpen(null)} />}

          {aiMode ? (
            /* ---- NATURAL-LANGUAGE SEARCH BOX ---- */
            <div className="nz-search-bar nz-ai-bar">
              <div className="nz-ai-input">
                <Icon name="search" size={18} style={{ color: "var(--gray-400)" }} />
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") aiSearch(); }}
                  placeholder={t("ai.placeholder")}
                  aria-label={t("ai.toggle")}
                />
              </div>
              <button className="nzs-submit" onClick={aiSearch}>
                <Icon name="search" size={18} strokeWidth={2.4} />
                <span>{t("ai.search")}</span>
              </button>
            </div>
          ) : (
            /* ---- STRUCTURED SEARCH BAR ---- */
            <div className="nz-search-bar">
              <button
                className={`nzs-field ${open === "city" ? "active" : ""}`}
                onClick={() => setOpen(open === "city" ? null : "city")}
              >
                <span className="nzs-label">{t("search.destination")}</span>
                <span className={`nzs-value ${city ? "" : "ph"}`}>
                  {city
                    ? (MOCK_CITIES.find((w) => w.key === city)?.name || city)
                    : t("search.destination_ph")}
                </span>
              </button>

              <button
                className={`nzs-field ${open === "dates" ? "active" : ""}`}
                onClick={() => setOpen(open === "dates" ? null : "dates")}
              >
                <span className="nzs-label">{t("search.dates")}</span>
                <span className={`nzs-value ${checkIn ? "" : "ph"}`}>{dateLabel}</span>
              </button>

              <button
                className={`nzs-field ${open === "guests" ? "active" : ""}`}
                onClick={() => setOpen(open === "guests" ? null : "guests")}
              >
                <span className="nzs-label">{t("search.guests")}</span>
                <span className="nzs-value">
                  {adults + children} {(adults + children) === 1 ? t("search.guest") : t("search.guests_plural")} · {rooms} {rooms === 1 ? t("search.room") || "room" : t("search.rooms") || "rooms"}
                </span>
              </button>

              <button className="nzs-submit" onClick={search}>
                <Icon name="search" size={18} strokeWidth={2.4} />
                <span>{t("search.search")}</span>
              </button>
            </div>
          )}

          {/* AI toggle — VRBO-style, sits under the bar */}
          {SHOW_AI_SEARCH && (
            <button
              className={`nz-ai-toggle ${aiMode ? "on" : ""}`}
              onClick={() => { setAiMode(!aiMode); setOpen(null); }}
            >
              <span className={`nz-ai-switch ${aiMode ? "on" : ""}`}>
                <span className="knob" />
              </span>
              <span className="nz-ai-toggle-label">{t("ai.toggle")}</span>
              <span className="nz-ai-badge">{t("ai.beta")}</span>
            </button>
          )}

          {!aiMode && open === "city" && (
            <div className="nzs-panel">
              <div className="nzs-panel-title">{t("search.choose_dest")}</div>
              <div className="nzs-cities">
                {MOCK_CITIES.map((c) => {
                  // Prefer live API count; fall back to static fallback.
                  // A count of 0 (or unknown wilaya) means "no count shown"
                  // — the wilaya still renders and is clickable, leading
                  // to the standard "no hotels yet" empty state.
                  const count = liveCounts[c.key] ?? c.hotelCount;
                  return (
                    <button key={c.key} className="nzs-city" onClick={() => pickCity(c.key)}>
                      <Icon name="pin" size={16} style={{ color: "var(--red)" }} />
                      <span>
                        <strong>{c.name}</strong>
                        {count > 0 && (
                          <em>{count} hotel{count === 1 ? "" : "s"}</em>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!aiMode && open === "dates" && (
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

          {!aiMode && open === "guests" && (
            <div className="nzs-panel">
              <div className="nzs-panel-title">{t("search.how_many")}</div>
              <div className="nzs-occ">
                <div className="nzs-occ-row">
                  <div className="nzs-occ-label">
                    <strong>{t("search.adults") || "Adults"}</strong>
                  </div>
                  <div className="nzs-stepper">
                    <button onClick={() => setAdults((a) => Math.max(1, a - 1))} disabled={adults <= 1} aria-label="decrease adults">−</button>
                    <strong>{adults}</strong>
                    <button onClick={() => setAdults((a) => Math.min(30, a + 1))} disabled={adults >= 30} aria-label="increase adults">+</button>
                  </div>
                </div>
                <div className="nzs-occ-row">
                  <div className="nzs-occ-label">
                    <strong>{t("search.children") || "Children"}</strong>
                  </div>
                  <div className="nzs-stepper">
                    <button onClick={() => setChildren((c) => Math.max(0, c - 1))} disabled={children <= 0} aria-label="decrease children">−</button>
                    <strong>{children}</strong>
                    <button onClick={() => setChildren((c) => Math.min(20, c + 1))} disabled={children >= 20} aria-label="increase children">+</button>
                  </div>
                </div>
                <div className="nzs-occ-row">
                  <div className="nzs-occ-label">
                    <strong>{t("search.rooms") || "Rooms"}</strong>
                  </div>
                  <div className="nzs-stepper">
                    <button onClick={() => setRooms((r) => Math.max(1, r - 1))} disabled={rooms <= 1} aria-label="decrease rooms">−</button>
                    <strong>{rooms}</strong>
                    <button onClick={() => setRooms((r) => Math.min(10, r + 1))} disabled={rooms >= 10} aria-label="increase rooms">+</button>
                  </div>
                </div>
              </div>
              <button className="nzs-done" onClick={() => { setOpen(null); search(); }}>
                {t("search.search_hotels")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nz-hero-foot">
        <div className="nz-hero-foot-trust">
          <span>✓ {t("hero.foot1")}</span>
          <span>✓ {t("hero.foot2")}</span>
          <span>✓ {t("hero.foot3")}</span>
        </div>
        <div className="nz-hero-credit">
          <span className="nz-hero-credit-title">{t("hero.credit_title")}</span>
          <span className="nz-hero-credit-attr">{t("hero.credit_attr")}</span>
        </div>
      </div>

      <style jsx>{`
        .nz-hero { position: relative; height: 100vh; min-height: 720px; }
        .nz-hero-photo { position: absolute; inset: 0; overflow: hidden; }
        .nz-hero-photo img {
          width: 100%; height: 100%; object-fit: cover;
          animation: kenburns 24s ease-out infinite alternate;
        }
        /* Readability scrim — keeps the painting visible by darkening
           primarily on the left where the text sits, fading toward the
           right where the courtyard is the visual focus. */
        .nz-hero-photo::after {
          content: ''; position: absolute; inset: 0;
          background:
            linear-gradient(105deg,
              rgba(15, 17, 26, 0.72) 0%,
              rgba(15, 17, 26, 0.55) 30%,
              rgba(15, 17, 26, 0.25) 55%,
              rgba(15, 17, 26, 0.05) 75%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              rgba(15, 17, 26, 0.25) 0%,
              transparent 18%,
              transparent 75%,
              rgba(15, 17, 26, 0.45) 100%
            );
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
          /* Position relative so the ::before halo can anchor to the
             headline area without affecting the rest of the hero. */
          position: relative;
        }
        /* Soft localized dark halo that sits behind only the headline text.
           This is what gives the gradient enough contrast to read cleanly
           without a heavy overlay on the whole image. The halo is huge
           and blurred, so it fades out softly and doesn't look like a box. */
        .nz-hero h1::before {
          content: '';
          position: absolute;
          inset: -40px -60px;
          background: radial-gradient(
            ellipse at 30% 50%,
            rgba(15, 17, 26, 0.55) 0%,
            rgba(15, 17, 26, 0.35) 40%,
            transparent 75%
          );
          z-index: -1;
          pointer-events: none;
        }
        .nz-hero h1 .l1 {
          display: block; opacity: 0;
          animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
        }
        .nz-hero h1 .l2 {
          display: block; opacity: 0;
          animation: rise 1s cubic-bezier(0.16,1,0.3,1) 0.42s forwards;
        }
        .nz-hero h1 .accent {
          /* Keep nowrap in English (the headline rhythm of 3 lines depends
             on "Booked in seconds." being a single line, which it always
             is). But French "Réservé en secondes." at clamp() max font
             is too wide for the viewport — let it wrap naturally. */
          white-space: nowrap;
          background: linear-gradient(120deg, #fff 30%, var(--red));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        /* Locale-specific override: French and Arabic translations are
           longer than English. The <html lang="..."> attribute is set
           dynamically by LangContext, so :lang() matches at runtime. */
        :global(html[lang="fr"]) .nz-hero h1 .accent,
        :global(html[lang="ar"]) .nz-hero h1 .accent {
          white-space: normal;
        }
        /* Slightly smaller max font in FR/AR so the headline doesn't
           dominate the hero at very wide viewports where the wrapped
           accent could push the layout taller than intended. */
        :global(html[lang="fr"]) .nz-hero h1,
        :global(html[lang="ar"]) .nz-hero h1 {
          font-size: clamp(46px, 6.4vw, 88px);
        }
        .nz-hero p {
          font-size: 18px; color: #fff; max-width: 480px; line-height: 1.6;
          font-weight: 500; margin-bottom: 40px;
          /* Stronger shadow for the subtitle — it's where readability
             struggles most against the bright painted areas. */
          text-shadow:
            0 1px 16px rgba(0, 0, 0, 0.7),
            0 1px 3px rgba(0, 0, 0, 0.5);
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

        /* ---- AI / NATURAL-LANGUAGE SEARCH ---- */
        /* The AI bar only has one input + submit, so the standard 820px
           feels cramped. Let it breathe a little wider on desktop. */
        .nz-search:has(.nz-ai-bar) { max-width: 960px; }
        .nz-ai-bar { align-items: stretch; }
        .nz-ai-input {
          flex: 1; display: flex; align-items: center; gap: 12px;
          padding: 0 22px; min-width: 0;
        }
        .nz-ai-input input {
          flex: 1; border: none; background: transparent; outline: none;
          font-size: 15.5px; font-weight: 600; color: var(--ink); min-width: 0;
          padding: 16px 0;
          font-family: inherit;
        }
        .nz-ai-input input::placeholder { color: var(--gray-300); font-weight: 500; }

        .nz-ai-toggle {
          display: flex; align-items: center; gap: 10px;
          margin-top: 12px; padding: 9px 14px; border: none; cursor: pointer;
          background: rgba(255,255,255,0.16); border-radius: 980px;
          backdrop-filter: blur(14px); width: fit-content;
          transition: background .2s;
        }
        .nz-ai-toggle:hover { background: rgba(255,255,255,0.24); }
        .nz-ai-switch {
          width: 38px; height: 22px; border-radius: 980px; flex-shrink: 0;
          background: rgba(255,255,255,0.35); position: relative; transition: background .2s;
        }
        .nz-ai-switch.on { background: var(--red); }
        .nz-ai-switch .knob {
          position: absolute; top: 2px; left: 2px;
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          transition: transform .2s;
        }
        .nz-ai-switch.on .knob { transform: translateX(16px); }
        .nz-ai-toggle-label {
          font-size: 13px; font-weight: 600; color: #fff;
        }
        .nz-ai-badge {
          font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
          background: var(--red); color: #fff; padding: 3px 8px; border-radius: 980px;
          text-transform: uppercase;
        }

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
        .nzs-cities {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
          max-height: 60vh; overflow-y: auto; padding-right: 4px;
        }
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
        .nzs-occ { padding: 4px 0 12px; }
        .nzs-occ-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0;
        }
        .nzs-occ-row:not(:last-child) { border-bottom: 1px solid var(--gray-100); }
        .nzs-occ-label strong { font-size: 14.5px; font-weight: 700; color: var(--ink); }
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
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 2px;
          text-align: right;
        }
        .nz-hero-credit-title {
          font-size: 11px; color: rgba(255,255,255,0.85); letter-spacing: 0.02em;
          font-weight: 600; font-style: italic;
        }
        .nz-hero-credit-attr {
          font-size: 10px; color: rgba(255,255,255,0.55); letter-spacing: 0.06em;
          font-weight: 500; text-transform: uppercase;
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
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en", { day: "numeric", month: "short" });
}
