"use client";

import { useState, useEffect, useRef } from "react";
import HotelCard from "./HotelCard";
import Icon from "./Icon";
import CitiesTicker from "./CitiesTicker";
import RegionStage from "./RegionStage";
import { useLang } from "../lib/LangContext";
import { DM_Serif_Display } from "next/font/google";

// The stats band's serif. Loaded here rather than site-wide because this band
// is the only place it appears; next/font self-hosts it, so there is no
// request to Google at runtime and no layout shift when it arrives.
const bandSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], display: "swap" });

// Algeria's outline from Simplemaps (simplemaps.com, free for commercial use,
// attribution appreciated), unioned from its 58 wilayas and simplified from
// 300 KB to about 2 KB. Drawn behind the wilaya count.
const DZ_OUTLINE = "M392.2 117.6l-17.5 10.8l-2.5 9.7l-5.4 4.7l-7.8 2l-9.5 8.1l-19.5 2.5l20.9 17.7l-4.7 6.5l7 6.9l-4.2 5.3l6 15.2l-1 17.7l-3 3.9l6.3 5l-3.3 17l8.6 10.9l-0.2 4.6l-2.8 1.5l7 11.3l16.9 11.8l-11 9.9l0.3 6.4l-2.5 2l4.5 -0.3l1.9 3.1l-18.9 1l-18.1 -4.4l-38.7 3.4l-2.4 4.3l4.8 12.2l-37.2 8.2l0.8 12.4l-4.5 1.7l-1.6 6.6l0.7 5.6l3 -2.7l2.5 4.3l0.3 -4l4.6 8l-5.1 8.7l0 8.5l-29.6 7.7l-12.2 12.2l-14.7 7.5l-15.5 12.4l-12.3 20.8l-5.3 -2.7l-2.7 1.1l1.2 -3.6l-3.3 -1.3l-29.3 2.6l-13.7 5.1l-16.6 -2.9l-10.3 7.1l-10 0.6l-36.9 28.5l-9.4 4.4l0 69.8l169.1 113.5l263.9 185.5l-0.6 17.9l6.5 -0.2l3.3 4.1l9 2.6l3.3 3.2l0.1 5.8l5.6 5.1l3.8 0.1l1.8 3.4l4.6 -3l3.5 1.5l4.2 -3.8l7.9 8.1l-0.3 4.7l5.8 -2.3l3.3 3l4.3 -3.2l2.1 4.9l10.6 2l12.5 6.4l-1.1 11.8l2.9 9.4l-8 10.6l8.2 7.1l3 1.3l106.6 -22.4l74.2 -66.7l197.3 -125.6l-17.3 -35.3l-6.6 2.6l-18.3 -13.3l-12.9 -4.6l-12.9 4.3l-7.5 -6.1l-1.5 -7.1l-7.2 -4.2l-1.2 -24.1l-27.7 -42.3l5.6 -8.9l15 -6.8l2.3 -6.3l0.5 -10.5l-6.5 -20.4l4.2 -14.1l-2 -0.6l3.8 -4.7l2 -9.5l-5.5 -21.3l3 -23.9l-5.4 -33.4l-16 -31.2l-1.3 -6.2l7.1 -4.2l-20.9 -94.5l-31.6 -21.6l-1.5 -16.8l-9.6 -11.9l1.7 -1.7l-14.7 -6.5l-12.3 -31.5l-0.1 -13.7l5.6 -7.2l3 1.7l3.3 -2.3l2.5 -10.4l16.2 -9.2l2.5 -4.1l-1.7 -1.9l3.5 -2.3l-3.3 -10.1l3.1 -1.4l1.1 -6.6l5.9 -9.1l-7.2 -4.1l0.2 -5.3l3.1 -3.5l-1.3 -10.3l-4.1 -3.3l-0.5 -8.4l6.9 -28.8l-11.5 -4.4l13.1 -6.8l1.7 -4.3l-2.4 -3.5l10.6 -3.2l-2 -1.9l0.7 -4.9l-9.5 2.6l-8.7 -3.2l-16.7 6.1l-3.7 -1.9l1 -5.1l-7.4 0.4l-10.2 -6.7l-7.7 -0.3l-1.8 0.7l3.8 2.8l-2.4 4.6l-12 3.4l-3.6 -4.1l-9.3 -0.1l-3.9 -5.5l-6.3 -1.6l-6.2 3.3l-2.6 6.6l-14.1 5l-8.4 -0.1l-8.4 7.6l-9.1 2.2l-8.9 -3.5l0.7 -4.1l-15.4 -6.6l-37.9 -1.5l-17.8 8.6l-11.6 -2.6l-2.8 4l-8.6 -4.1l-18.4 12.4l-8.9 -3l-13.4 4.1l-23.3 2.3l-6.8 -1.4l-3.3 2.6l-8.8 0.7l-6.3 2.4l-2.9 4.2l-23.4 9.8l-9.3 8.4l-4.6 9.8l-5.5 3.7l-8 -1.7l-0.5 -2.9l-4.3 -1.8l-4.4 1.8l-0.5 4.6l-5.3 4.2l-7.8 -3.3z";

// The support stat opens the chat itself. Digits only: wa.me rejects "+",
// spaces and dashes.
const WA_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
const WA_HREF = WA_NUMBER ? "https://wa.me/" + WA_NUMBER : "https://wa.me/";

// Band copy lives here, not in the i18n dictionary: t() humanises a missing
// key in production, so a key present in one language ships as English-looking
// text in the other two instead of failing visibly.
const BAND_COPY = {
  en: {
    aria: "Why book with Nzzor", kicker: "TRAVEL WITH CONFIDENCE",
    h1: "Every detail.", h2: "Taken care of.",
    subB: "Algeria", subRest: ", more than a destination", sub2: "a warm welcome awaits",
    verified: "Verified hotels", verifiedHint: "Checked by Allouni before they list",
    wilayas: "Wilayas covered", wilayasHint: "From the coast to the deep Sahara",
    sec: "s", confirm: "To a confirmed booking", confirmHint: "Voucher in your inbox, no callback",
    support: "WhatsApp support", supportHint: "A real person, in Arabic, French or English",
    go: "Message us \u2192",
    supportAria: "WhatsApp support, available 24 hours a day, 7 days a week. Opens WhatsApp.",
  },
  fr: {
    aria: "Pourquoi réserver avec Nzzor", kicker: "VOYAGEZ EN CONFIANCE",
    h1: "Chaque détail.", h2: "Pris en charge.",
    subB: "L\u2019Algérie", subRest: ", plus qu\u2019une destination", sub2: "un accueil chaleureux vous attend",
    verified: "Hôtels vérifiés", verifiedHint: "Contrôlés par Allouni avant leur mise en ligne",
    wilayas: "Wilayas couvertes", wilayasHint: "De la côte au Grand Sud",
    sec: "s", confirm: "Pour une réservation confirmée", confirmHint: "Bon dans votre boîte mail, sans rappel",
    support: "Assistance WhatsApp", supportHint: "Une vraie personne, en arabe, français ou anglais",
    go: "Écrivez-nous \u2192",
    supportAria: "Assistance WhatsApp, 24 heures sur 24, 7 jours sur 7. Ouvre WhatsApp.",
  },
  ar: {
    aria: "لماذا تحجز مع نزور", kicker: "سافر بثقة",
    h1: "كل التفاصيل.", h2: "في أيدٍ أمينة.",
    subB: "الجزائر", subRest: "، أكثر من مجرد وجهة", sub2: "ترحيب دافئ في انتظارك",
    verified: "فنادق موثّقة", verifiedHint: "تتحقق منها وكالة علوني قبل نشرها",
    wilayas: "ولاية مغطاة", wilayasHint: "من الساحل إلى عمق الصحراء",
    sec: " ث", confirm: "لتأكيد الحجز", confirmHint: "القسيمة في بريدك، دون انتظار اتصال",
    support: "دعم عبر واتساب", supportHint: "شخص حقيقي، بالعربية أو الفرنسية أو الإنجليزية",
    go: "\u2190 راسلنا",
    supportAria: "دعم عبر واتساب على مدار الساعة طوال أيام الأسبوع. يفتح واتساب.",
  },
};

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
// COUNTS ARE LIVE. page.js reads them from the API — the hotel total from the
// pagination envelope, the wilaya total from /meta/cities — and passes them in.
// The defaults below exist only so this component still renders if it is ever
// used without them; they are not a source of truth and should never be
// updated by hand.
//
// This is the third framing of these numbers. They were hardcoded as "8", then
// centralised here as 9, and both went stale against a catalogue that reached
// 215 hotels across 47 wilayas. Copy that states a count will always drift,
// because nothing breaks when it does.
//
// The `city` column stores wilaya keys (see lib/wilayas.js), so this is
// WILAYAS, not cities — the stronger and more accurate claim locally.
export default function HomeSections({ featured, cities = [], wilayaCount = 0, hotelCount = 0 }) {
  const { t, lang } = useLang();
  const bc = BAND_COPY[lang] || BAND_COPY.en;
  const isAr = lang === "ar";

  const statsRef = useRef(null);
  const statsIn = useInView(statsRef);

  // The four promise columns animate in on first sight, reusing the same
  // observer hook as the stats band rather than adding a second mechanism.
  const colsRef = useRef(null);
  const colsIn = useInView(colsRef, 0.3);
  const nWilayas = useCountUp(wilayaCount, statsIn, { duration: 1000 });
  const nHotels = useCountUp(hotelCount, statsIn, { duration: 1200 });
  const nSeconds = useCountUp(5, statsIn, { duration: 900 });

  return (
    <>
      {/* ---- STATS BAND ----
          Statement on the left, four proofs on the right. The drawings sit
          INSIDE their numbers so they scale together; the 24/7 stat is the
          WhatsApp link it describes. Numbers count up once on first sight. */}
      <section
        className={`nz-band ${statsIn ? "in" : ""} ${isAr ? "is-ar" : ""}`}
        ref={statsRef}
        aria-label={bc.aria}
      >
        <img className="nz-band-town nz-band-rise" src="/stats-town.webp" alt="" aria-hidden="true" width="372" height="265" />
        <img className="nz-band-olive nz-band-rise" src="/stats-olive.webp" alt="" aria-hidden="true" width="216" height="109" />

        <div className="nz-band-inner">
          <div className="nz-band-statement nz-band-rise">
            <div className="nz-band-kicker">{bc.kicker}</div>
            {/* The Latin serif has no Arabic glyphs, so Arabic keeps the site face. */}
            <h2 className={`nz-band-h2 ${isAr ? "" : bandSerif.className}`}>
              {bc.h1}<br />{bc.h2}
            </h2>
            <div className="nz-band-redrule" />
            <p className="nz-band-sub"><b>{bc.subB}</b>{bc.subRest}<br />{bc.sub2}</p>
          </div>

          <div className="nz-band-stat">
            <img className="nz-band-arch nz-band-rise" src="/stats-arch.webp" alt="" aria-hidden="true" width="203" height="210" />
            <div className="nz-band-label">{bc.verified}</div>
            <p className="nz-band-hint">{bc.verifiedHint}</p>
          </div>

          <div className="nz-band-stat">
            <div className={`nz-band-num ${bandSerif.className}`} dir="ltr">
              <span className="nz-band-n">{nWilayas}</span>
              <svg className="nz-band-map" viewBox="25 -10 950 985" aria-hidden="true">
                <path
                  className="nz-band-ol"
                  pathLength="1"
                  d={DZ_OUTLINE}
                  fill="none"
                  stroke="#C4AE9A"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <g className="nz-band-pin">
                  <path
                    fill="var(--red)"
                    transform="translate(562 67) scale(3.4) translate(-12 -22)"
                    d="M12 2c-4.4 0-8 3.4-8 7.6C4 15.4 12 22 12 22s8-6.6 8-12.4C20 5.4 16.4 2 12 2z"
                  />
                  <circle fill="#FBF7EF" cx="562" cy="24" r="10" />
                </g>
              </svg>
            </div>
            <div className="nz-band-label">{bc.wilayas}</div>
            <p className="nz-band-hint">{bc.wilayasHint}</p>
          </div>

          <div className="nz-band-stat">
            <div className={`nz-band-num ${bandSerif.className}`}>
              <span className="nz-band-n">{nSeconds}{bc.sec}</span>
              <img className="nz-band-clock nz-band-rise" src="/stats-clock.webp" alt="" aria-hidden="true" width="102" height="112" />
            </div>
            <div className="nz-band-label">{bc.confirm}</div>
            <p className="nz-band-hint">{bc.confirmHint}</p>
          </div>

          {/* A plain <a>, not next/link: this leaves the site, and styled-jsx
              cannot scope the anchor next/link renders anyway. */}
          <a
            className="nz-band-stat nz-band-link"
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={bc.supportAria}
          >
            <div className={`nz-band-num ${bandSerif.className}`} dir="ltr">
              24/7<span className="nz-band-live" aria-hidden="true" />
            </div>
            <div className="nz-band-label">{bc.support}</div>
            <p className="nz-band-hint">{bc.supportHint}</p>
            <span className="nz-band-go" aria-hidden="true">{bc.go}</span>
          </a>
        </div>
      </section>

      {/* FEATURED HOTELS */}
      <section className="wrap nz-section">
        <div className="nz-section-head">
          <div>
            <div className="nz-kicker">{t("featured.kicker")}</div>
            <h2 className="display">{t("featured.title")}</h2>
            <p>{t("featured.subtitle")}</p>
          </div>
          {/* The count is interpolated, not baked into the string — the copy
              used to read "All 10 hotels" on a catalogue of 215. */}
          <a href="/hotels" className="nz-viewall">
            {hotelCount
              ? `${t("featured.all")} ${hotelCount}`
              : t("featured.all_plain")}{" "}
            <Icon name="arrow" size={15} strokeWidth={2.5} />
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

        {/* CITIES TICKER — three layered scrolling rows covering every wilaya
            we operate in. The list is live: it used to be eight hardcoded
            cities with prices copied from mockData.js. */}
        <CitiesTicker initialCities={cities} />

        {/* REGION STAGE — one region at a time, photograph on the background,
            numbered index with the red rule running for as long as each one
            holds the frame. Sits directly under the ticker: the ticker names
            every wilaya, this gives five of them somewhere to go.

            Full-bleed by design. .nz-why-v2 sets only a background and bottom
            padding, so it does not constrain this. Needs five images at
            /public/regions/ — see the note at the top of RegionStage.js. */}
        <RegionStage />

        {/* FOUR CLEAN FEATURE COLUMNS */}
        <div className={`wrap nz-why-promises ${colsIn ? "in" : ""}`} ref={colsRef}>
          <div className="nz-why-cols">
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
        </div>

        {/* The closing band that used to sit here — 47 / 4.9 / 24-7, a line of
            copy and an "explore all hotels" button — has been removed. Every
            one of those claims is already made above: the counts are in the
            stats band, the trust line is in the Allouni strip below, and the
            call to action now lives on the region stage where someone has just
            been given a reason to press it. Saying it twice weakened both. */}

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
        /* ---- THE FOUR PROMISES ----
           Two things happen here, both built from transitions rather than
           keyframes so that hovering never replays the entrance.

           1. On first sight each icon rises and settles, and a short red rule
              draws under each title — staggered left to right so the row reads
              as one gesture rather than four.
           2. On hover the rule runs the full width of the column and the icon
              performs a motion that belongs to what it means: the clock turns,
              the card swipes, the bubble pops, the seal stamps.

           The icon selector has to be :global(svg) — the markup comes from the
           Icon component, so styled-jsx never puts its scoping class on it.
           globals.css already targets it the same way. */
        /* Longhand only — this element carries .wrap, and the shorthand would
           reset the horizontal padding .wrap supplies. */
        .nz-why-promises { padding-top: 84px; padding-bottom: 8px; }

        .nz-why-col :global(svg) {
          opacity: 0;
          transform: translateY(12px) scale(.82);
          transition: opacity .55s ease, transform .6s cubic-bezier(.16, 1, .3, 1);
        }
        .nz-why-promises.in .nz-why-col :global(svg) { opacity: 1; transform: none; }

        .nz-why-col h3 { position: relative; padding-bottom: 14px; }
        .nz-why-col h3::after {
          content: "";
          position: absolute; inset-inline-start: 0; bottom: 0;
          height: 2px; width: 0; background: var(--red);
          transition: width .42s cubic-bezier(.16, 1, .3, 1);
        }
        .nz-why-col:hover h3::after { width: 100%; }

        /* Left to right, 110ms apart — enough for the order to register
           without the last column feeling late. */
        .nz-why-promises.in .nz-why-col:nth-child(1) :global(svg) { transition-delay: .04s; }
        .nz-why-promises.in .nz-why-col:nth-child(2) :global(svg) { transition-delay: .15s; }
        .nz-why-promises.in .nz-why-col:nth-child(3) :global(svg) { transition-delay: .26s; }
        .nz-why-promises.in .nz-why-col:nth-child(4) :global(svg) { transition-delay: .37s; }

        /* The clock turns its HANDS, not its case. Rotating the whole <svg>
           spun the dial with them, which is why it read as a wheel rather
           than a clock.
           Feather-style icons draw the case as <circle> and the hands as a
           <polyline> or <line>, so those are what get rotated, about the centre
           of the viewBox. steps(12) gives the movement a tick instead of a
           glide — a sweep would read as a stopwatch, and the claim here is
           seconds passing.
           If nothing moves after this, the Icon component draws its clock some
           other way and I need to see it. */
        .nz-why-col:nth-child(1):hover :global(svg polyline),
        .nz-why-col:nth-child(1):hover :global(svg line),
        .nz-why-col:nth-child(1):hover :global(svg path) {
          transform-box: view-box;
          transform-origin: 50% 50%;
          animation: nz-icon-turn 1.6s steps(12, end);
        }
        /* The case must never rotate, whatever it is drawn with. */
        .nz-why-col:nth-child(1):hover :global(svg circle) { animation: none; }
        .nz-why-col:nth-child(2):hover :global(svg) { animation: nz-icon-swipe .8s cubic-bezier(.16, 1, .3, 1); }
        .nz-why-col:nth-child(3):hover :global(svg) { animation: nz-icon-pop .78s cubic-bezier(.34, 1.56, .64, 1); }
        .nz-why-col:nth-child(4):hover :global(svg) { animation: nz-icon-stamp .7s cubic-bezier(.34, 1.56, .64, 1); }

        @keyframes nz-icon-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nz-icon-swipe {
          0%, 100% { transform: none; }
          42% { transform: translateX(9px) rotate(5deg); }
          70% { transform: translateX(-2px); }
        }
        @keyframes nz-icon-pop {
          0%, 100% { transform: none; }
          34% { transform: scale(1.22) translateY(-3px); }
          62% { transform: scale(.96); }
        }
        @keyframes nz-icon-stamp {
          0%, 100% { transform: none; }
          28% { transform: scale(.82); }
          62% { transform: scale(1.14) rotate(-5deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .nz-why-col :global(svg) { opacity: 1; transform: none; transition: none; }
          .nz-why-col h3::after { transition: none; }
          .nz-why-col:nth-child(n):hover :global(svg),
          .nz-why-col:nth-child(n):hover :global(svg *) { animation: none; }
        }

        @media (max-width: 860px) {
          .nz-why-promises { padding-top: 56px; }
        }

        /* ---- STATS BAND ----
           Warm paper under the hero painting; a white band there reads as the
           page running out. The illustrations are the approved reference
           artwork, lifted out with the paper keyed to transparency, so they
           sit on this background with no visible edges. Every word and number
           on top is live text: it translates, counts up, and reads out to a
           screen reader. The files live in /public as stats-*.webp.

           Sizes come from CONTAINER units, not the viewport. The headline is
           sized from its own column and each numeral from its own stat, so
           neither can overflow at any width: "Taken care of." measures about
           6 em in this face, and "24/7" about 1.9 em. */
        .nz-band {
          position: relative; overflow: hidden;
          background:
            radial-gradient(90% 120% at 80% 0%, #fff 0, transparent 55%),
            linear-gradient(180deg, #FBF7EF, #F5EEE3);
          border-bottom: 1px solid #DCC9B8;
        }
        .nz-band::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
          background-image: radial-gradient(rgba(120, 90, 60, .09) .6px, transparent .7px);
          background-size: 4px 4px;
        }
        .nz-band-town {
          position: absolute; top: 14px; inset-inline-end: 0; z-index: 1;
          width: clamp(230px, 21vw, 330px); height: auto; pointer-events: none; opacity: .95;
        }
        .nz-band-olive {
          position: absolute; bottom: -4px; inset-inline-start: 0; z-index: 1;
          width: clamp(120px, 11vw, 180px); height: auto; pointer-events: none;
        }
        .nz-band-inner {
          position: relative; z-index: 2; max-width: 1440px; margin: 0 auto;
          padding-top: 42px; padding-bottom: 44px; padding-inline: 52px;
          display: grid; grid-template-columns: minmax(300px, 1.95fr) repeat(4, minmax(0, 1fr));
          align-items: end;
        }

        .nz-band-statement { align-self: center; padding-bottom: 6px; container-type: inline-size; }
        .nz-band-kicker {
          display: flex; align-items: center; gap: 14px;
          font-size: 11px; font-weight: 600; letter-spacing: .36em; color: var(--red);
        }
        .nz-band-kicker::after { content: ""; width: 74px; height: 1px; background: #DCC9B8; }
        .nz-band-h2 {
          font-weight: 400; color: #1E1512; margin-top: 16px;
          font-size: clamp(34px, 15.4cqi, 72px); line-height: .97; letter-spacing: -.022em;
          white-space: nowrap;
        }
        .nz-band-redrule { width: 44px; height: 2px; background: var(--red); margin-top: 18px; }
        .nz-band-sub {
          margin-top: 16px; font-size: 10.5px; font-weight: 600; letter-spacing: .3em;
          line-height: 2; color: #8E8177; text-transform: uppercase;
        }
        .nz-band-sub b { color: #4A3F39; font-weight: 700; }

        .nz-band-stat {
          position: relative; height: 246px; container-type: inline-size;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          text-align: center; color: inherit; text-decoration: none;
        }
        .nz-band-stat + .nz-band-stat::before {
          content: ""; position: absolute; inset-inline-start: 0; top: 12px; bottom: 6px; width: 1px;
          background-image: linear-gradient(#DCC9B8 50%, transparent 50%); background-size: 1px 6px;
        }
        .nz-band-num {
          position: relative; z-index: 2; color: #1E1512;
          font-size: clamp(44px, 39cqi, 96px); line-height: .92; letter-spacing: -.035em;
        }
        .nz-band-n { position: relative; z-index: 2; }
        .nz-band-label {
          position: relative; z-index: 2; margin-top: 14px;
          font-size: 15px; font-weight: 700; color: #1E1512; letter-spacing: -.005em;
          text-wrap: balance; transition: color .2s ease;
        }
        /* Two lines reserved for every hint, so the labels line up across the
           row whatever each hint says. */
        .nz-band-hint {
          position: relative; z-index: 2; margin-top: 6px; max-width: 24ch; min-height: 3em;
          font-size: 12.5px; font-weight: 500; line-height: 1.5; color: #8E8177; text-wrap: balance;
        }

        /* The drawings live INSIDE their numbers, sized in em, so they scale
           and move with the digits: the country wraps the 47, the stopwatch
           arc hooks over the s. */
        .nz-band-arch { width: min(146px, 70cqi); height: auto; margin-bottom: -4px; }
        .nz-band-map {
          position: absolute; z-index: 1; left: -.14em; top: -.58em; width: 1.62em; height: auto;
          pointer-events: none; overflow: visible;
        }
        .nz-band-clock {
          position: absolute; z-index: 1; left: .6em; top: -.66em; width: 1.06em; height: auto;
          pointer-events: none;
        }

        /* 24/7 is a link: it IS the support it describes. */
        .nz-band-link { cursor: pointer; }
        .nz-band-go {
          position: absolute; left: 0; right: 0; bottom: -26px;
          font-size: 12.5px; font-weight: 700; color: #2F8A55;
          opacity: 0; transform: translateY(-4px); transition: opacity .25s ease, transform .25s ease;
        }
        .nz-band-link:hover .nz-band-label,
        .nz-band-link:focus-visible .nz-band-label { color: #2F8A55; }
        .nz-band-link:hover .nz-band-go,
        .nz-band-link:focus-visible .nz-band-go { opacity: 1; transform: none; }
        .nz-band-link:focus-visible { outline: 2px solid #7FAE83; outline-offset: 6px; border-radius: 12px; }
        @media (hover: none) { .nz-band-go { opacity: 1; transform: none; } }

        .nz-band-live {
          position: absolute; top: .16em; right: -.34em; width: .16em; height: .16em;
          border-radius: 50%; background: #3FA25F; animation: nz-live-blink 1.6s ease-in-out infinite;
        }
        .nz-band-live::after {
          content: ""; position: absolute; inset: 0; border-radius: 50%; background: #3FA25F;
          animation: nz-live-ping 1.6s cubic-bezier(0, 0, .2, 1) infinite;
        }
        @keyframes nz-live-blink { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
        @keyframes nz-live-ping {
          0% { transform: scale(1); opacity: .55; }
          80%, 100% { transform: scale(2.8); opacity: 0; }
        }

        /* Arabic joins its letters: tracking breaks the joins, and it has no
           capitals to transform. */
        .nz-band.is-ar .nz-band-kicker,
        .nz-band.is-ar .nz-band-sub { letter-spacing: 0; text-transform: none; }
        .nz-band.is-ar .nz-band-sub { font-size: 13px; }
        .nz-band.is-ar .nz-band-h2 { line-height: 1.25; letter-spacing: 0; }

        /* entrance: art rises, the map draws itself, the pin drops */
        .nz-band-rise { opacity: 0; transform: translateY(10px); transition: opacity .9s ease, transform 1s cubic-bezier(.16, 1, .3, 1); }
        .nz-band.in .nz-band-rise { opacity: 1; transform: none; }
        .nz-band-ol { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.6s cubic-bezier(.65, 0, .35, 1) .2s; }
        .nz-band.in .nz-band-ol { stroke-dashoffset: 0; }
        .nz-band-pin { opacity: 0; transform: translateY(-10px); transition: opacity .4s ease 1.4s, transform .6s cubic-bezier(.34, 1.56, .64, 1) 1.4s; }
        .nz-band.in .nz-band-pin { opacity: 1; transform: none; }

        @media (max-width: 1100px) {
          .nz-band-inner { grid-template-columns: repeat(4, minmax(0, 1fr)); row-gap: 28px; padding-inline: 36px; }
          .nz-band-statement { grid-column: 1 / -1; }
          .nz-band-town { opacity: .5; }
        }
        @media (max-width: 720px) {
          .nz-band-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-top: 36px; padding-bottom: 40px; padding-inline: 22px; }
          .nz-band-stat { height: 200px; }
          .nz-band-stat:nth-child(4)::before { display: none; }
          .nz-band-town { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nz-band-rise, .nz-band-pin { opacity: 1; transform: none; transition: none; }
          .nz-band-ol { stroke-dashoffset: 0; transition: none; }
          .nz-band-live, .nz-band-live::after { animation: none; }
        }
      `}</style>
    </>
  );
}
