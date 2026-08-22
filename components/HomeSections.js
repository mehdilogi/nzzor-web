"use client";

import { useState, useEffect, useRef } from "react";
import HotelCard from "./HotelCard";
import Icon from "./Icon";
import CitiesTicker from "./CitiesTicker";
import { useLang } from "../lib/LangContext";

// ---------------------------------------------------------------------------
// Animation hooks for the stats band
// ---------------------------------------------------------------------------
// Defined at module scope rather than as sub-components on purpose: styled-jsx
// scopes CSS per component, so a child component's markup would not pick up
// the styled-jsx rules declared below in HomeSections. Hooks return values,
// the JSX stays in the one component, and the scoping stays intact.

// Fires once when the element first enters view, then disconnects. Stats that
// re-animate every time you scroll past are irritating rather than delightful.
function useInView(ref, threshold = 0.35) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, seen]);
  return seen;
}

// Eases a number from 0 to target on rAF. Honours prefers-reduced-motion by
// jumping straight to the value — the information is the point, the motion is
// decoration, and some people get motion sick from it.
function useCountUp(target, active, { duration = 1100, decimals = 0 } = {}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(target); return; }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic — matches the cubic-bezier(0.16,1,0.3,1) feel used in the
      // hero, so the page has one motion vocabulary rather than two.
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return decimals > 0 ? val.toFixed(decimals) : Math.round(val);
}

// The text-bearing homepage sections. Receives featured hotels as a prop
// (fetched server-side in page.js). Everything here is translated.
//
// COUNTS: wilayaCount is a prop with a default so there is exactly ONE place
// to update it, and so page.js can pass a live value later without touching
// this file. It was previously hardcoded as "8" in two separate places and
// both went stale.
//
// Source of truth (Railway, 2026-08-20):
//   SELECT COUNT(DISTINCT city) FILTER (WHERE "isActive") -> 9
// The `city` column stores wilaya keys (see lib/wilayas.js), so this is
// WILAYAS, not cities — the stronger and more accurate claim locally.
//
// The hotel count is deliberately absent from the UI. See the stats band.
export default function HomeSections({ featured, wilayaCount = 9 }) {
  const { t } = useLang();

  const statsRef = useRef(null);
  const statsIn = useInView(statsRef);
  const nWilayas = useCountUp(wilayaCount, statsIn, { duration: 1000 });
  const nSeconds = useCountUp(5, statsIn, { duration: 900 });
  const nRating = useCountUp(4.9, statsIn, { duration: 1300, decimals: 1 });

  return (
    <>
      {/* ---- STATS BAND ----
          A single spacious row of values, no dividers, no boxes. Five items of
          equal weight with generous air between them; the restraint is what
          makes it read as considered rather than as a dashboard.

          The hotels item carries NO number. A count that grows every month
          goes stale in prose and undersells the actual claim, which is not
          "how many" but "every one of these was visited and contracted". A
          check mark that draws itself on scroll says verification happened;
          a digit would only invite comparison with aggregator inventory.

          Numbers count up once when the band first enters view. */}
      <div className={`nz-stats ${statsIn ? "in" : ""}`} ref={statsRef}>
        <div className="wrap nz-stats-row">

          <div className="nz-stat" style={{ transitionDelay: "0ms" }}>
            <div className="v display">
              <svg className="tick" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path
                  d="M9 20.5L16.5 28L31 13"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="l">{t("trust.hotels")}</div>
          </div>

          <div className="nz-stat" style={{ transitionDelay: "90ms" }}>
            <div className="v display">{nWilayas}</div>
            <div className="l">{t("trust.cities")}</div>
          </div>

          <div className="nz-stat" style={{ transitionDelay: "180ms" }}>
            <div className="v display">{nSeconds}s</div>
            <div className="l">{t("trust.toconfirm")}</div>
          </div>

          <div className="nz-stat" style={{ transitionDelay: "270ms" }}>
            <div className="v display">{nRating}</div>
            <div className="l">{t("trust.rating")}</div>
          </div>

          <div className="nz-stat" style={{ transitionDelay: "360ms" }}>
            <div className="v display">24/7</div>
            <div className="l">{t("trust.support")}</div>
          </div>

        </div>
      </div>

      {/* FEATURED HOTELS */}
      <section className="wrap nz-section">
        <div className="nz-section-head">
          <div>
            <div className="nz-kicker">{t("featured.kicker")}</div>
            <h2 className="display">{t("featured.title")}</h2>
            <p>{t("featured.subtitle")}</p>
          </div>
          <a href="/hotels" className="nz-viewall">
            {t("featured.all")} <Icon name="arrow" size={15} strokeWidth={2.5} />
          </a>
        </div>
        <div className="nz-hotels-grid">
          {featured.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
      </section>

      {/* WHY NZZOR */}
      <section className="nz-why-v2" id="how">
        {/* HERO STRIP — designed background (real photo swaps in here later) */}
        <div className="nz-why-hero">
          <div className="nz-why-hero-bg" />
          <div className="nz-why-hero-grain" />
          <div className="wrap nz-why-hero-inner">
            <div className="nz-why-hero-kicker">{t("why.kicker")}</div>
            <h2 className="display nz-why-hero-title">
              {t("why.title1")}<br />{t("why.title2")}
            </h2>
            <p className="nz-why-hero-sub">{t("why.hero_sub")}</p>
            <div className="nz-why-badges">
              <span className="nz-why-badge">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("allouni.badge1")}
              </span>
              <span className="nz-why-badge">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("allouni.badge2")}
              </span>
              <span className="nz-why-badge">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("allouni.badge3")}
              </span>
            </div>
          </div>
        </div>

        {/* CITIES TICKER — three layered horizontal scrolling rows of the
            wilayas we cover. NOTE: CitiesTicker may still carry its own
            hardcoded list; check it against the live count. */}
        <CitiesTicker />

        {/* FOUR CLEAN FEATURE COLUMNS */}
        <div className="wrap nz-why-cols">
          <div className="nz-why-col">
            <Icon name="clock" size={26} strokeWidth={1.7} style={{ color: "var(--red)" }} />
            <h3 className="display">{t("why.instant_t")}</h3>
            <p>{t("why.instant_d")}</p>
          </div>
          <div className="nz-why-col">
            <Icon name="card" size={26} strokeWidth={1.7} style={{ color: "var(--red)" }} />
            <h3 className="display">{t("why.pay_t")}</h3>
            <p>{t("why.pay_d")}</p>
          </div>
          <div className="nz-why-col">
            <Icon name="whatsapp" size={26} strokeWidth={1.7} style={{ color: "var(--red)" }} />
            <h3 className="display">{t("why.support_t")}</h3>
            <p>{t("why.support_d")}</p>
          </div>
          <div className="nz-why-col">
            <Icon name="shield" size={26} strokeWidth={1.7} style={{ color: "var(--red)" }} />
            <h3 className="display">{t("why.allouni_t")}</h3>
            <p>{t("why.allouni_d")}</p>
          </div>
        </div>

        {/* CLOSING BAND — wraps the section emotionally */}
        <div className="wrap nz-why-close">
          <div className="nz-why-close-stats">
            <div className="nz-why-close-stat">
              <span className="num display">{wilayaCount}</span>
              <span className="lbl">{t("trust.cities")}</span>
            </div>
            <div className="nz-why-close-divider" />
            <div className="nz-why-close-stat">
              <span className="num display">4.9</span>
              <span className="lbl">{t("trust.rating")}</span>
            </div>
            <div className="nz-why-close-divider" />
            <div className="nz-why-close-stat">
              <span className="num display">24/7</span>
              <span className="lbl">{t("trust.support")}</span>
            </div>
          </div>
          <p className="nz-why-close-line">{t("why.closing")}</p>
          <a href="/hotels" className="nz-why-close-cta">
            {t("why.cta")} <Icon name="arrow" size={15} strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ALLOUNI STRIP */}
      <div className="nz-allouni" id="allouni">
        <div className="wrap nz-allouni-inner">
          <div className="nz-allouni-left">
            <div className="nz-allouni-seal"><Icon name="shield" size={32} style={{ color: "#fff" }} /></div>
            <div>
              <h4 className="display">{t("allouni.title")}</h4>
              <p>{t("allouni.desc")}</p>
            </div>
          </div>
          <div className="nz-allouni-badges">
            {[t("allouni.badge1"), t("allouni.badge2"), t("allouni.badge3")].map((b) => (
              <div className="nz-allouni-badge" key={b}>
                <Icon name="check" size={16} strokeWidth={2.5} style={{ color: "var(--teal)" }} />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        /* ---- STATS BAND ----
           One styled-jsx block only. The rest of this component's CSS lives in
           globals.css; these rules are scoped here so the band ships as a
           single self-contained change. The old .nz-trustbar rules in
           globals.css are now unused and can be deleted later. */
        .nz-stats {
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
          background: #fff;
        }
        .nz-stats-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 52px 0 50px;
        }

        /* Each item rises in on its own delay (set inline). Transform +
           opacity only, so the whole thing stays on the compositor. */
        .nz-stat {
          flex: 1 1 0;
          min-width: 0;
          text-align: center;
          opacity: 0;
          transform: translateY(14px);
          transition:
            opacity .7s cubic-bezier(0.16, 1, 0.3, 1),
            transform .7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nz-stats.in .nz-stat { opacity: 1; transform: translateY(0); }

        /* Font comes from the global "display" class on the element (Clash
           Display), exactly as the old trust bar did — do NOT set font-family
           here. An earlier revision guessed at a --font-display variable that
           does not exist, fell through to the inherit fallback, and quietly
           rendered these in Manrope.
           NOTE: no backticks anywhere inside this block. It is a template
           literal, so a stray backtick terminates the CSS string and the file
           fails to parse. */
        .nz-stat .v {
          font-size: 46px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.035em;
          color: var(--ink);
          /* Tabular figures stop the row juddering sideways while the numbers
             count up — proportional digits change width as they cycle. */
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
        }
        .nz-stat .l {
          margin-top: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-400);
          line-height: 1.4;
        }

        /* Check mark draws itself once, after its item has risen in. 60 is
           comfortably longer than the path, so the dash fully clears it. */
        .nz-stat .tick { color: var(--red); }
        .nz-stat .tick path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
        }
        .nz-stats.in .nz-stat .tick path {
          animation: nz-tick-draw .75s cubic-bezier(0.16, 1, 0.3, 1) .25s forwards;
        }
        @keyframes nz-tick-draw {
          to { stroke-dashoffset: 0; }
        }

        /* Motion is decoration; the numbers are the point. Anyone who has
           asked their OS for less movement gets the final state immediately.
           useCountUp checks the same preference in JS. */
        @media (prefers-reduced-motion: reduce) {
          .nz-stat {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .nz-stats.in .nz-stat .tick path { animation: none; stroke-dashoffset: 0; }
        }

        @media (max-width: 860px) {
          .nz-stats-row {
            flex-wrap: wrap;
            gap: 34px 12px;
            padding: 40px 0 38px;
          }
          .nz-stat { flex: 0 0 calc(33.333% - 8px); }
          .nz-stat .v { font-size: 34px; min-height: 34px; }
          .nz-stat .tick { width: 32px; height: 32px; }
          .nz-stat .l { font-size: 12px; margin-top: 9px; }
        }
        @media (max-width: 480px) {
          .nz-stat { flex: 0 0 calc(50% - 6px); }
          .nz-stat .v { font-size: 30px; min-height: 30px; }
        }
      `}</style>
    </>
  );
}
