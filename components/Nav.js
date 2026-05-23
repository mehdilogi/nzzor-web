"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoMark from "./LogoMark";
import { useLang } from "../lib/LangContext";
import { useAuth } from "../lib/AuthContext";

// Nzzor top navigation. Transparent over hero, solid white on scroll.
export default function Nav({ overHero = false }) {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(!overHero);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const solid = scrolled;
  const dark = !solid; // dark = on transparent hero, use light text

  return (
    <>
      <nav className={`nzn ${solid ? "solid" : "clear"} ${overHero ? "fixed" : "sticky"}`}>
        <Link
          href="/"
          className="nzn-logo"
          style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <LogoMark size={28} />
          <span className="nzn-words" style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span className="nzn-name display">Nzzor</span>
            <span className="nzn-sub">By Allouni Travel Agency</span>
          </span>
        </Link>

        <div className="nzn-links">
          <Link href="/hotels">{t("nav.hotels")}</Link>
          <Link href="/hotels">{t("nav.destinations")}</Link>
          <Link href="/#how">{t("nav.how")}</Link>
          <Link href="/#allouni">{t("nav.about")}</Link>
        </div>

        <div className="nzn-right">
          <div className="nzn-lang">
            <button
              className={lang === "en" ? "on" : ""}
              onClick={() => setLang("en")}
            >EN</button>
            <button
              className={lang === "fr" ? "on" : ""}
              onClick={() => setLang("fr")}
            >FR</button>
            <button
              className={lang === "ar" ? "on" : ""}
              onClick={() => setLang("ar")}
            >ع</button>
          </div>
          <button
            className="nzn-signin"
            onClick={() => router.push(user ? "/account" : "/signin")}
          >
            {user ? (user.firstName || t("nav.signin")) : t("nav.signin")}
          </button>
          {/* Mobile-only language pill — single tap cycles through EN → FR → AR → EN
              so language is always one tap away without opening the menu. */}
          <button
            className="nzn-lang-mobile"
            onClick={() => {
              const next = lang === "en" ? "fr" : lang === "fr" ? "ar" : "en";
              setLang(next);
            }}
            aria-label="Change language"
          >
            {lang === "en" ? "EN" : lang === "fr" ? "FR" : "ع"}
          </button>
          <button
            className="nzn-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* full-screen mobile menu */}
      {menuOpen && (
        <div className="nzn-menu">
          <div className="nzn-menu-top">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="nzn-menu-logo"
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <LogoMark size={28} />
              <span className="nzn-name display">Nzzor</span>
            </Link>
            <button
              className="nzn-menu-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <span /><span />
            </button>
          </div>
          <nav className="nzn-menu-links">
            <Link href="/hotels" onClick={() => setMenuOpen(false)}>{t("nav.hotels")}</Link>
            <Link href="/hotels" onClick={() => setMenuOpen(false)}>{t("nav.destinations")}</Link>
            <Link href="/#how" onClick={() => setMenuOpen(false)}>{t("nav.how")}</Link>
            <Link href="/#allouni" onClick={() => setMenuOpen(false)}>{t("nav.about")}</Link>
          </nav>
          <div className="nzn-menu-lang">
            <button
              className={lang === "en" ? "on" : ""}
              onClick={() => setLang("en")}
            >English</button>
            <button
              className={lang === "fr" ? "on" : ""}
              onClick={() => setLang("fr")}
            >Français</button>
            <button
              className={lang === "ar" ? "on" : ""}
              onClick={() => setLang("ar")}
            >العربية</button>
          </div>
          <button
            className="nzn-menu-cta"
            onClick={() => { setMenuOpen(false); router.push(user ? "/account" : "/signin"); }}
          >
            {user ? t("acc.title") : t("nav.signin")}
          </button>
          <p className="nzn-menu-foot">
            {t("nav.menu_foot")}
          </p>
        </div>
      )}

      <style jsx>{`
        /* ---- NAV BAR ---- */
        .nzn {
          left: 0; right: 0; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 52px;
          transition: background .3s ease, padding .3s ease, border-color .3s ease;
        }
        .nzn.fixed { position: fixed; }
        .nzn.sticky { position: sticky; }
        .nzn.solid {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px) saturate(1.6);
          border-bottom: 1px solid var(--gray-200);
        }
        .nzn.clear { background: transparent; border-bottom: 1px solid transparent; }

        /* logo lockup — strictly horizontal, vertically centred */
        .nzn-logo {
          display: flex; flex-direction: row; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nzn-words { display: flex; flex-direction: column; line-height: 1; }
        .nzn-name {
          font-size: 20px; font-weight: 600; letter-spacing: -0.02em;
          color: ${dark ? "#fff" : "var(--ink)"};
        }
        .nzn-sub {
          font-size: 9px; letter-spacing: 0.07em; text-transform: uppercase;
          font-weight: 700; margin-top: 3px;
          color: ${dark ? "rgba(255,255,255,0.6)" : "var(--gray-400)"};
        }

        .nzn-links { display: flex; align-items: center; gap: 32px; }
        .nzn-links :global(a) {
          font-size: 14px; font-weight: 600; text-decoration: none;
          color: ${dark ? "rgba(255,255,255,0.9)" : "var(--ink-2)"};
          transition: color .2s;
        }
        .nzn-links :global(a:hover) { color: var(--red); }

        .nzn-right { display: flex; align-items: center; gap: 12px; }

        /* mobile-only language pill — tap to cycle EN → FR → AR */
        .nzn-lang-mobile {
          display: none;
          align-items: center; justify-content: center;
          min-width: 38px; height: 34px;
          padding: 0 11px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.22);
          color: #fff;
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.04em;
          border-radius: 980px;
          cursor: pointer;
          font-family: inherit;
          backdrop-filter: blur(10px);
          transition: background 0.18s, border-color 0.18s;
        }
        .nzn-lang-mobile:hover, .nzn-lang-mobile:active {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.35);
        }
        /* When Nav scrolls to its solid state (or on inner pages), it goes
           white-bg, so the pill needs dark text for contrast. */
        .nzn.solid .nzn-lang-mobile {
          background: rgba(15, 17, 26, 0.06);
          border-color: rgba(15, 17, 26, 0.12);
          color: var(--ink);
        }
        .nzn.solid .nzn-lang-mobile:hover {
          background: rgba(15, 17, 26, 0.12);
        }

        /* language toggle */
        .nzn-lang {
          display: flex; gap: 2px; padding: 3px; border-radius: 980px;
          background: ${dark ? "rgba(255,255,255,0.15)" : "var(--gray-100)"};
          border: 1px solid ${dark ? "rgba(255,255,255,0.25)" : "var(--gray-200)"};
        }
        .nzn-lang button {
          border: none; background: transparent; font-size: 12px; font-weight: 700;
          padding: 5px 11px; border-radius: 980px; cursor: pointer; font-family: inherit;
          color: ${dark ? "rgba(255,255,255,0.8)" : "var(--gray-400)"};
          transition: all .15s;
        }
        .nzn-lang button.on {
          background: ${dark ? "#fff" : "var(--ink)"};
          color: ${dark ? "var(--ink)" : "#fff"};
        }
        .nzn-signin {
          background: ${dark ? "#fff" : "var(--ink)"};
          color: ${dark ? "var(--ink)" : "#fff"};
          border: none; padding: 10px 22px; border-radius: 980px;
          font-size: 13px; font-weight: 700; cursor: pointer;
        }

        /* burger */
        .nzn-burger {
          display: none; flex-direction: column; gap: 5px; justify-content: center;
          width: 40px; height: 40px; border: none; background: transparent; padding: 0;
        }
        .nzn-burger span {
          display: block; width: 22px; height: 2.5px; border-radius: 2px;
          background: ${dark ? "#fff" : "var(--ink)"}; margin: 0 auto;
        }

        /* ---- FULL-SCREEN MENU ---- */
        .nzn-menu {
          position: fixed; inset: 0; z-index: 200;
          background: #fff;
          display: flex; flex-direction: column;
          padding: 16px 22px 32px;
          animation: nzn-in .25s ease;
        }
        @keyframes nzn-in { from { opacity: 0; } to { opacity: 1; } }
        .nzn-menu-top {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 24px;
        }
        .nzn-menu-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .nzn-menu-logo .nzn-name { color: var(--ink); font-size: 20px; }
        .nzn-menu-close {
          width: 42px; height: 42px; border: none; background: var(--gray-100);
          border-radius: 50%; position: relative; cursor: pointer;
        }
        .nzn-menu-close span {
          position: absolute; top: 50%; left: 50%; width: 18px; height: 2.5px;
          background: var(--ink); border-radius: 2px;
        }
        .nzn-menu-close span:nth-child(1) { transform: translate(-50%,-50%) rotate(45deg); }
        .nzn-menu-close span:nth-child(2) { transform: translate(-50%,-50%) rotate(-45deg); }

        .nzn-menu-links {
          display: flex; flex-direction: column; flex: 1; padding-top: 8px;
        }
        .nzn-menu-links :global(a) {
          padding: 18px 4px; font-size: 19px; font-weight: 700; color: var(--ink);
          text-decoration: none; border-bottom: 1px solid var(--gray-100);
        }
        .nzn-menu-lang {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .nzn-menu-lang button {
          flex: 1; padding: 12px; border-radius: var(--r-sm);
          border: 1.5px solid var(--gray-200); background: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
          color: var(--gray-400);
        }
        .nzn-menu-lang button.on {
          border-color: var(--red); background: var(--red-soft); color: var(--red-deep);
        }
        .nzn-menu-cta {
          width: 100%; padding: 16px; background: var(--red); color: #fff;
          border: none; border-radius: var(--r-sm);
          font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 12px;
        }
        .nzn-menu-foot {
          font-size: 12px; color: var(--gray-400); text-align: center;
          margin-top: 18px; line-height: 1.5;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 860px) {
          .nzn { padding: 12px 20px; }
          .nzn-links { display: none; }
          .nzn-signin { display: none; }
          .nzn-lang { display: none; }
          .nzn-lang-mobile { display: inline-flex; }
          .nzn-burger { display: flex; }
        }
      `}</style>
    </>
  );
}
