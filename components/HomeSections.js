"use client";

import HotelCard from "./HotelCard";
import Icon from "./Icon";
import CitiesTicker from "./CitiesTicker";
import { useLang } from "../lib/LangContext";

// The text-bearing homepage sections. Receives featured hotels as a prop
// (fetched server-side in page.js). Everything here is translated.
//
// COUNTS: hotelCount / wilayaCount are props with defaults so there is exactly
// ONE place to update them, and so page.js can pass live values later without
// touching this file. They were previously hardcoded as "10" and "8" in two
// separate places and both went stale.
//
// Current source of truth (Railway, 2026-08-20):
//   SELECT COUNT(*) FILTER (WHERE "isActive")            -> 25 hotels
//   SELECT COUNT(DISTINCT city) FILTER (WHERE "isActive") -> 9
// The `city` column stores wilaya keys (see lib/wilayas.js), so that second
// number is WILAYAS, not cities.
export default function HomeSections({ featured, hotelCount = 25, wilayaCount = 9 }) {
  const { t } = useLang();

  return (
    <>
      {/* ---- STATS BAND ----
          Replaces the old five-equal-columns row. Five numbers given equal
          visual weight reads as a spec sheet and makes the two that actually
          matter — inventory and coverage — disappear into the noise. Here the
          two scale numbers lead at display size with a supporting line each,
          and the three service proof points sit beside them as a quieter
          list. */}
      <div className="nz-stats">
        <div className="wrap nz-stats-inner">
          <div className="nz-stats-lead">
            <div className="nz-stats-kicker">
              <span className="rule" />
              {t("trust.kicker")}
            </div>
            <div className="nz-stats-pair">
              <div className="nz-stats-big">
                <div className="num display">{hotelCount}</div>
                <div className="lbl">{t("trust.hotels")}</div>
                <div className="sub">{t("trust.hotels_sub")}</div>
              </div>
              <div className="nz-stats-big">
                <div className="num display">{wilayaCount}</div>
                <div className="lbl">{t("trust.cities")}</div>
                <div className="sub">{t("trust.wilayas_sub")}</div>
              </div>
            </div>
          </div>

          <div className="nz-stats-side">
            {[
              ["5s", t("trust.toconfirm")],
              ["4.9", t("trust.rating")],
              ["24/7", t("trust.support")],
            ].map(([val, lbl]) => (
              <div className="nz-stats-row" key={lbl}>
                <span className="val display">{val}</span>
                <span className="lbl">{lbl}</span>
              </div>
            ))}
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
              <span className="num display">{hotelCount}</span>
              <span className="lbl">{t("trust.hotels")}</span>
            </div>
            <div className="nz-why-close-divider" />
            <div className="nz-why-close-stat">
              <span className="num display">{wilayaCount}</span>
              <span className="lbl">{t("trust.cities")}</span>
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
           globals.css; these rules are scoped here so the new band ships as a
           single self-contained change. The old .nz-trustbar rules in
           globals.css are now unused and can be deleted later. */
        .nz-stats {
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
          background: #fff;
        }
        .nz-stats-inner {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 56px;
          padding: 46px 0 44px;
        }

        .nz-stats-lead { flex: 1 1 auto; min-width: 0; }

        .nz-stats-kicker {
          display: flex; align-items: center; gap: 10px;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gray-400);
          margin-bottom: 26px;
        }
        .nz-stats-kicker .rule {
          display: block; width: 26px; height: 2px;
          background: var(--red); border-radius: 2px;
          flex-shrink: 0;
        }

        .nz-stats-pair { display: flex; gap: 64px; flex-wrap: wrap; }
        .nz-stats-big { min-width: 0; }
        .nz-stats-big .num {
          font-size: 62px; font-weight: 600; line-height: 1;
          letter-spacing: -0.035em; color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .nz-stats-big .lbl {
          margin-top: 10px;
          font-size: 15px; font-weight: 700; color: var(--ink);
        }
        .nz-stats-big .sub {
          margin-top: 3px;
          font-size: 13px; font-weight: 500; color: var(--gray-400);
          line-height: 1.45; max-width: 30ch;
        }

        /* Quieter service proof points. Separated by a hairline rather than
           given their own headline weight — they support the two numbers on
           the left, they do not compete with them. */
        .nz-stats-side {
          flex: 0 0 auto;
          display: flex; flex-direction: column; justify-content: center;
          gap: 14px;
          padding-left: 56px;
          border-left: 1px solid var(--gray-200);
        }
        .nz-stats-row {
          display: flex; align-items: baseline; gap: 12px;
        }
        .nz-stats-row .val {
          font-size: 21px; font-weight: 600; color: var(--red);
          letter-spacing: -0.02em;
          min-width: 52px;
          font-variant-numeric: tabular-nums;
        }
        .nz-stats-row .lbl {
          font-size: 13.5px; font-weight: 600; color: var(--gray-400);
        }

        @media (max-width: 980px) {
          .nz-stats-inner { flex-direction: column; gap: 34px; padding: 38px 0 34px; }
          .nz-stats-side {
            padding-left: 0; padding-top: 28px;
            border-left: none; border-top: 1px solid var(--gray-200);
          }
          .nz-stats-pair { gap: 44px; }
        }
        @media (max-width: 560px) {
          .nz-stats-big .num { font-size: 48px; }
          .nz-stats-pair { gap: 28px; }
          .nz-stats-big .sub { font-size: 12.5px; }
          .nz-stats-row .val { min-width: 46px; font-size: 19px; }
        }
      `}</style>
    </>
  );
}
