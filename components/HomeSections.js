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
      <section className="nz-why" id="how">
        <div className="wrap">
          <div className="nz-section-head">
            <div>
              <div className="nz-kicker">{t("why.kicker")}</div>
              <h2 className="display">{t("why.title1")}<br />{t("why.title2")}</h2>
            </div>
          </div>
          <div className="nz-bento">
            <div className="nz-bento-card feature">
              <div className="nz-bento-icon"><Icon name="shield" size={30} /></div>
              <div>
                <h3 className="display">{t("why.allouni_t")}</h3>
                <p>{t("why.allouni_d")}</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-icon"><Icon name="clock" size={22} /></div>
              <div>
                <h3 className="display">{t("why.instant_t")}</h3>
                <p>{t("why.instant_d")}</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-stat display"><span className="red">5s</span></div>
              <div><p>{t("why.speed_d")}</p></div>
            </div>
            <div className="nz-bento-card wide">
              <div className="nz-bento-icon"><Icon name="card" size={22} /></div>
              <div>
                <h3 className="display">{t("why.pay_t")}</h3>
                <p>{t("why.pay_d")}</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-icon"><Icon name="whatsapp" size={22} /></div>
              <div>
                <h3 className="display">{t("why.support_t")}</h3>
                <p>{t("why.support_d")}</p>
              </div>
            </div>
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
