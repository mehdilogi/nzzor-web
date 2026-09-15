"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLang } from "../lib/LangContext";

// =============================================================================
// RegionStage — the band under the wilaya marquee
// -----------------------------------------------------------------------------
// One region at a time: photograph on the background, the place name set large,
// a numbered index down the side, and a red rule that runs for as long as the
// region holds the frame.
//
// IMAGES
// Five photographs, one per region, expected at /public/regions/. Until they
// exist this renders as dark panels with the type — readable, just not the
// point. Keep each one under about 200 KB as WebP or AVIF: this section is on
// the homepage, and most of this traffic is on mobile data in Algeria. Do NOT
// point these at the R2 hotel photos — those are multi-megabyte PNGs and five
// of them would cost more than the rest of the page put together.
//
// COPY
// Region names and season lines are held here rather than in the i18n
// dictionary on purpose. t() humanises a missing key in production, so a key
// that exists in only one language ships as English-looking text in the other
// two instead of failing loudly.
// =============================================================================

const DWELL_MS = 7500;

const REGIONS = [
  {
    key: "coast",
    img: "/regions/coast.jpg",
    hotels: 42,
    from: "8 000",
    href: "/hotels?city=B%C3%A9ja%C3%AFa",
    en: { pre: "The", main: "Mediterranean", short: "Coast", season: "Best June — September",
          wilayas: "Béjaïa, Skikda, El Tarf, Algiers, Oran, Jijel, Tipaza", cta: "Explore the Mediterranean" },
    fr: { pre: "La", main: "Méditerranée", short: "Côte", season: "Juin — septembre",
          wilayas: "Béjaïa, Skikda, El Tarf, Alger, Oran, Jijel, Tipaza", cta: "Découvrir la Méditerranée" },
    ar: { pre: "الساحل", main: "المتوسط", short: "الساحل", season: "الأفضل: جوان — سبتمبر",
          wilayas: "بجاية، سكيكدة، الطارف، الجزائر، وهران، جيجل، تيبازة", cta: "اكتشف الساحل المتوسط" },
  },
  {
    key: "tell",
    img: "/regions/tell.jpg",
    hotels: 70,
    from: "4 500",
    href: "/hotels?city=Setif",
    en: { pre: "Kabylie &", main: "the Tell", short: "Tell", season: "Best April — October",
          wilayas: "Setif, Tizi Ouzou, Batna, Mila, Guelma, Constantine, Khenchela", cta: "Explore Kabylie & the Tell" },
    fr: { pre: "La Kabylie &", main: "le Tell", short: "Tell", season: "Avril — octobre",
          wilayas: "Sétif, Tizi Ouzou, Batna, Mila, Guelma, Constantine, Khenchela", cta: "Découvrir la Kabylie et le Tell" },
    ar: { pre: "القبائل و", main: "التل", short: "التل", season: "الأفضل: أفريل — أكتوبر",
          wilayas: "سطيف، تيزي وزو، باتنة، ميلة، قالمة، قسنطينة، خنشلة", cta: "اكتشف القبائل والتل" },
  },
  {
    key: "plateau",
    img: "/regions/plateau.jpg",
    hotels: 23,
    from: "5 000",
    href: "/hotels?city=Laghouat",
    en: { pre: "The High", main: "Plateau", short: "Plateau", season: "Best March & October",
          wilayas: "Naama, El Bayadh, Laghouat, Tissemsilt, Relizane, Tiaret", cta: "Explore the High Plateau" },
    fr: { pre: "Les Hauts", main: "Plateaux", short: "Plateaux", season: "Mars & octobre",
          wilayas: "Naâma, El Bayadh, Laghouat, Tissemsilt, Relizane, Tiaret", cta: "Découvrir les Hauts Plateaux" },
    ar: { pre: "الهضاب", main: "العليا", short: "الهضاب", season: "الأفضل: مارس وأكتوبر",
          wilayas: "النعامة، البيض، الأغواط، تيسمسيلت، غليزان، تيارت", cta: "اكتشف الهضاب العليا" },
  },
  {
    key: "gate",
    img: "/regions/gate.jpg",
    hotels: 30,
    from: "7 000",
    href: "/hotels?city=Ouargla",
    en: { pre: "The Saharan", main: "Gate", short: "Gate", season: "Best October — March",
          wilayas: "Ouargla, Hassi Messaoud, El Meniaa, Ghardaia, Biskra, Béchar", cta: "Explore the Saharan Gate" },
    fr: { pre: "La Porte du", main: "Sahara", short: "Porte", season: "Octobre — mars",
          wilayas: "Ouargla, Hassi Messaoud, El Meniaa, Ghardaïa, Biskra, Béchar", cta: "Découvrir la Porte du Sahara" },
    ar: { pre: "بوابة", main: "الصحراء", short: "البوابة", season: "الأفضل: أكتوبر — مارس",
          wilayas: "ورقلة، حاسي مسعود، المنيعة، غرداية، بسكرة، بشار", cta: "اكتشف بوابة الصحراء" },
  },
  {
    key: "sahara",
    img: "/regions/sahara.jpg",
    hotels: 40,
    from: "9 500",
    href: "/hotels?city=Timimoun",
    en: { pre: "The Deep", main: "Sahara", short: "Sahara", season: "Best November — March",
          wilayas: "Timimoun, Adrar, Beni Abbes, Tamanrasset, Djanet, In Salah", cta: "Explore the Deep Sahara" },
    fr: { pre: "Le Grand", main: "Sud", short: "Grand Sud", season: "Novembre — mars",
          wilayas: "Timimoun, Adrar, Béni Abbès, Tamanrasset, Djanet, In Salah", cta: "Découvrir le Grand Sud" },
    ar: { pre: "الصحراء", main: "الكبرى", short: "الجنوب", season: "الأفضل: نوفمبر — مارس",
          wilayas: "تيميمون، أدرار، بني عباس، تمنراست، جانت، عين صالح", cta: "اكتشف الصحراء الكبرى" },
  },
];

const LABELS = {
  en: { hotels: "hotels", from: "from", night: "DZD / night", explore: "Explore" },
  fr: { hotels: "hôtels", from: "à partir de", night: "DZD / nuit", explore: "Découvrir" },
  ar: { hotels: "فندقًا", from: "ابتداءً من", night: "دج / ليلة", explore: "اكتشف" },
};

export default function RegionStage() {
  const { lang } = useLang();
  const code = ["en", "fr", "ar"].includes(lang) ? lang : "fr";
  const L = LABELS[code];
  const isArabic = code === "ar";

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const timerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Advance on a timer unless motion is off or someone is hovering. Cleared on
  // every change so a manual click restarts the full dwell rather than
  // inheriting whatever was left of the previous one.
  useEffect(() => {
    if (reduced || paused) return undefined;
    timerRef.current = setTimeout(
      () => setActive((n) => (n + 1) % REGIONS.length),
      DWELL_MS
    );
    return () => clearTimeout(timerRef.current);
  }, [active, paused, reduced]);

  const pick = useCallback((i) => {
    clearTimeout(timerRef.current);
    setActive(i);
  }, []);

  const r = REGIONS[active];
  const t = r[code];

  // Arabic must NOT be split into per-letter spans: the script joins, and
  // breaking it into separate elements severs every ligature and renders the
  // word as disconnected forms. Latin staggers, Arabic rises whole.
  const letters = isArabic ? null : [...t.main];

  return (
    <section
      className="nz-rs"
      ref={stageRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Every backdrop is mounted up front and cross-faded on opacity.
          Swapping one element's background-image flashes, because the file
          only begins downloading at the moment of the swap. */}
      {REGIONS.map((reg, i) => (
        <div
          key={reg.key}
          className={`nz-rs-bg ${i === active ? "on" : ""}`}
          style={{ backgroundImage: `url(${reg.img})` }}
          aria-hidden="true"
        />
      ))}
      <div className="nz-rs-scrim" aria-hidden="true" />
      <div className="nz-rs-vig" aria-hidden="true" />
      <div className="nz-rs-grain" aria-hidden="true" />

      <div className="nz-rs-inner">
        <div className="wrap nz-rs-layout">
          <div className="nz-rs-index">
            {REGIONS.map((reg, i) => (
              <button
                key={reg.key}
                type="button"
                className={`nz-rs-idx ${i === active ? "on" : ""}`}
                onClick={() => pick(i)}
                aria-label={reg[code].short}
                aria-current={i === active ? "true" : undefined}
              >
                {/* The red rule. Keyed on active so React remounts it and the
                    animation restarts from zero on every change. */}
                <i key={`rule-${active}`} aria-hidden="true" />
                {`0${i + 1}`}
                <em>{reg[code].short}</em>
              </button>
            ))}
          </div>

          <div className="nz-rs-title">
            <span key={`pre-${active}`} className="nz-rs-pre">{t.pre}</span>

            <h2 key={`main-${active}`} className={`nz-rs-main ${isArabic ? "whole" : ""}`}>
              {isArabic
                ? t.main
                : letters.map((ch, n) => (
                    <span key={n} style={{ animationDelay: `${n * 26}ms` }}>
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  ))}
            </h2>

            <div key={`meta-${active}`} className="nz-rs-meta">
              <span className="nz-rs-pill season">{t.season}</span>
              <span className="nz-rs-pill">{r.hotels} {L.hotels}</span>
              <span className="nz-rs-pill">{L.from} <b>{r.from}</b> {L.night}</span>
            </div>

            <p key={`wil-${active}`} className="nz-rs-wil">{t.wilayas}</p>

            {/* The action gets its own line and its own weight. Sat among the
                pills it read as a fourth label rather than the thing to press.

                The visual lives on the inner span, NOT on the Link: styled-jsx
                does not add its scoping class to the <a> that next/link
                renders, so a className on Link matches nothing. Same trap as
                .nz-hcard. The :global() rule below strips the anchor's own
                decoration, which a descendant cannot undo on its own. */}
            <div key={`cta-${active}`} className="nz-rs-ctarow">
              <Link href={r.href}>
                <span className="nz-rs-go">
                  <span className="nz-rs-golabel">{t.cta}</span>
                  <span className="nz-rs-goarrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M12 6l6 6-6 6" />
                    </svg>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Horizontal padding is never set with the shorthand on an element that
           also carries .wrap — the shorthand resets what .wrap supplied and the
           section falls out of alignment with the rest of the page. */
        .nz-rs {
          position: relative;
          min-height: 600px; height: 74vh; max-height: 760px;
          overflow: hidden; background: #08080b;
          display: flex; align-items: center;
        }
        .nz-rs-bg {
          position: absolute; inset: -4%; z-index: 0;
          background-size: cover; background-position: center;
          opacity: 0; transition: opacity 1s ease;
        }
        .nz-rs-bg.on { opacity: 1; }

        /* A text field, not a decorative wash. Strong where the type sits, open
           across the right so the photograph is actually visible. */
        .nz-rs-scrim {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: linear-gradient(97deg,
            rgba(6,6,10,.90) 0%, rgba(6,6,10,.78) 30%, rgba(6,6,10,.46) 52%,
            rgba(6,6,10,.12) 74%, rgba(6,6,10,.04) 88%, rgba(6,6,10,.34) 100%);
        }
        .nz-rs-vig {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(130% 100% at 26% 50%, transparent 34%, rgba(0,0,0,.42) 100%);
        }
        .nz-rs-grain {
          position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: .26;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.10) 1px, transparent 0);
          background-size: 3px 3px;
        }

        .nz-rs-inner { position: relative; z-index: 3; width: 100%; }
        .nz-rs-layout {
          display: grid; grid-template-columns: 96px minmax(0, 1fr); align-items: center;
        }

        .nz-rs-index {
          display: flex; flex-direction: column;
          border-inline-start: 1px solid rgba(255,255,255,.16);
        }
        .nz-rs-idx {
          position: relative; display: flex; align-items: center; gap: 10px;
          padding-top: 11px; padding-bottom: 11px; padding-inline-start: 18px;
          border: 0; background: none; cursor: pointer; text-align: start;
          color: rgba(255,255,255,.34); font-family: inherit;
          font-size: 12.5px; letter-spacing: .18em; transition: color .3s ease;
        }
        .nz-rs-idx:hover { color: rgba(255,255,255,.8); }
        .nz-rs-idx.on { color: #fff; }
        .nz-rs-idx i {
          position: absolute; inset-inline-start: -1px; top: 0;
          width: 2px; height: 0; background: var(--red);
        }
        .nz-rs-idx.on i { animation: nz-rs-rule ${DWELL_MS}ms linear forwards; }
        .nz-rs:hover .nz-rs-idx.on i { animation-play-state: paused; }
        @keyframes nz-rs-rule { from { height: 0 } to { height: 100% } }
        .nz-rs-idx em {
          font-style: normal; font-size: 11.5px; font-weight: 600; letter-spacing: 0;
          opacity: 0; transform: translateX(-6px); white-space: nowrap;
          transition: opacity .3s ease, transform .3s ease;
        }
        .nz-rs-idx:hover em { opacity: .75; transform: none; }

        .nz-rs-title { padding-inline-start: 44px; }
        .nz-rs-pre {
          display: block; font-size: clamp(11px, 1.1vw, 13px); font-weight: 700;
          letter-spacing: .34em; text-transform: uppercase; color: rgba(255,255,255,.62);
        }
        .nz-rs-main {
          display: block; font-weight: 600; color: #fff;
          font-size: clamp(46px, 8.4vw, 124px); line-height: .92;
          letter-spacing: -.05em; margin-top: 14px;
        }
        .nz-rs-main span {
          display: inline-block; opacity: 0; transform: translateY(22px);
          animation: nz-rs-letter .62s cubic-bezier(.16,1,.3,1) forwards;
        }
        /* Arabic joins, so it rises as one word. Tighter tracking too — the
           Latin value closes the counters on Arabic letterforms. */
        .nz-rs-main.whole {
          letter-spacing: 0; line-height: 1.12;
          animation: nz-rs-letter .62s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes nz-rs-letter { to { opacity: 1; transform: none } }

        .nz-rs-meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 9px; margin-top: 26px;
          animation: nz-rs-rise .5s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes nz-rs-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        .nz-rs-pill {
          font-size: 12px; font-weight: 700; padding: 8px 15px; border-radius: 980px;
          color: #fff; background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.17);
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        }
        .nz-rs-pill.season { background: var(--red); border-color: transparent; }
        .nz-rs-pill b { font-weight: 800; }
        .nz-rs-ctarow {
          margin-top: 26px;
          animation: nz-rs-rise .5s cubic-bezier(.16,1,.3,1) both;
          animation-delay: .08s;
        }
        .nz-rs-ctarow :global(a) { text-decoration: none; display: inline-block; }

        .nz-rs-go {
          position: relative; display: inline-flex; align-items: center; gap: 16px;
          padding-block: 9px; padding-inline: 26px 9px;
          border-radius: 980px; background: #fff; color: var(--ink);
          font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden;
          box-shadow: 0 16px 40px -16px rgba(0,0,0,.65);
          transition: color .3s ease, box-shadow .3s ease;
        }
        /* The fill sweeps in from the leading edge instead of the whole pill
           flipping colour — the eye follows the direction of travel, which is
           the same direction the arrow is pointing. */
        .nz-rs-go::before {
          content: ""; position: absolute; inset: 0; z-index: 0;
          background: var(--red); transform: scaleX(0); transform-origin: left center;
          transition: transform .42s cubic-bezier(.16,1,.3,1);
        }
        [dir="rtl"] .nz-rs-go::before { transform-origin: right center; }
        .nz-rs-go:hover { color: #fff; box-shadow: 0 20px 46px -16px rgba(230,57,70,.6); }
        .nz-rs-go:hover::before { transform: scaleX(1); }
        .nz-rs-golabel { position: relative; z-index: 1; }
        .nz-rs-goarrow {
          position: relative; z-index: 1; flex: 0 0 auto;
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--red); color: #fff;
          transition: background .3s ease, color .3s ease, transform .42s cubic-bezier(.16,1,.3,1);
        }
        [dir="rtl"] .nz-rs-goarrow svg { transform: scaleX(-1); }
        .nz-rs-go:hover .nz-rs-goarrow {
          background: #fff; color: var(--red); transform: translateX(4px);
        }
        [dir="rtl"] .nz-rs-go:hover .nz-rs-goarrow { transform: translateX(-4px); }
        /* A slow pulse so the button is alive before anyone touches it — this
           is the only thing on the band asking to be pressed. */
        .nz-rs-go::after {
          content: ""; position: absolute; inset: 0; border-radius: 980px;
          border: 2px solid rgba(255,255,255,.5); pointer-events: none;
          animation: nz-rs-pulse 2.8s cubic-bezier(.16,1,.3,1) infinite;
        }
        @keyframes nz-rs-pulse {
          0% { transform: scale(1); opacity: .55 }
          70% { transform: scale(1.14); opacity: 0 }
          100% { transform: scale(1.14); opacity: 0 }
        }
        .nz-rs-go:hover::after { animation: none; opacity: 0; }

        .nz-rs-wil {
          margin-top: 18px; font-size: 12.5px; color: rgba(255,255,255,.5);
          font-weight: 500; line-height: 1.7; max-width: 48ch;
          animation: nz-rs-rise .5s cubic-bezier(.16,1,.3,1) both;
        }

        @media (max-width: 980px) {
          .nz-rs { height: auto; max-height: none; min-height: 0; padding-top: 62px; padding-bottom: 66px; }
          .nz-rs-layout { grid-template-columns: 72px minmax(0, 1fr); }
          .nz-rs-title { padding-inline-start: 26px; }
          .nz-rs-idx em { display: none; }
        }
        @media (max-width: 560px) {
          .nz-rs-layout { grid-template-columns: 1fr; gap: 26px; }
          .nz-rs-index { flex-direction: row; border-inline-start: 0; border-top: 1px solid rgba(255,255,255,.16); }
          .nz-rs-idx { padding-top: 14px; padding-bottom: 0; padding-inline-start: 0; padding-inline-end: 14px; }
          .nz-rs-idx i { inset-inline-start: 0; top: -1px; width: 0; height: 2px; }
          .nz-rs-idx.on i { animation: nz-rs-ruleX ${DWELL_MS}ms linear forwards; }
          @keyframes nz-rs-ruleX { from { width: 0 } to { width: 100% } }
          .nz-rs-title { padding-inline-start: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nz-rs-bg, .nz-rs-go { transition: none; }
          .nz-rs-main span, .nz-rs-main.whole, .nz-rs-meta, .nz-rs-wil, .nz-rs-ctarow { animation: none; opacity: 1; transform: none; }
          .nz-rs-go::after { animation: none; opacity: 0; }
          .nz-rs-idx.on i { animation: none; height: 100%; }
        }
      `}</style>
    </section>
  );
}
