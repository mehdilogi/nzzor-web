"use client";

import HotelCard from "./HotelCard";
import Icon from "./Icon";
import { useLang } from "../lib/LangContext";

// The text-bearing homepage sections. Receives featured hotels as a prop
// (fetched server-side in page.js). Everything here is translated.
export default function HomeSections({ featured }) {
  const { t } = useLang();

  return (
    <>
      {/* TRUST BAR */}
      <div className="nz-trustbar">
        <div className="wrap nz-trustbar-inner">
          {[
            ["10", t("trust.hotels")],
            ["8", t("trust.cities")],
            ["5s", t("trust.toconfirm")],
            ["4.9", t("trust.rating")],
            ["24/7", t("trust.support")],
          ].map(([big, lbl], i) => (
            <div className="nz-tstat" key={i}>
              <div className="big display">{big}</div>
              <div className="lbl">{lbl}</div>
            </div>
          ))}
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
        {/* HERO STRIP — full bleed, photograph background */}
        <div className="nz-why-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1800&q=85"
            alt="Algeria hospitality"
            className="nz-why-hero-img"
          />
          <div className="nz-why-hero-shade" />
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

        {/* INLINE SPEED LINE — the "5s" moment, integrated not isolated */}
        <div className="wrap nz-why-speed">
          <span className="nz-why-speed-num display">5s</span>
          <span className="nz-why-speed-text">{t("why.speed_inline")}</span>
        </div>

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
    </>
  );
}
