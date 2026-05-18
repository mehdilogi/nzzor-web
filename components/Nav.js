"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Nzzor top navigation. Transparent over hero, solid white on scroll.
// `overHero` = render in transparent mode initially (homepage only).
export default function Nav({ overHero = false }) {
  const [scrolled, setScrolled] = useState(!overHero);
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <nav className={`nz-nav ${solid ? "solid" : "transparent"} ${overHero ? "fixed" : "sticky"}`}>
      <Link href="/" className="nz-nav-logo">
        <span className="nz-logo-mark" />
        <span className="nz-logo-words">
          <span className="nz-logo-name display">Nzzor</span>
          <span className="nz-logo-sub">By Allouni Travel Agency</span>
        </span>
      </Link>

      <div className="nz-nav-links">
        <Link href="/hotels">Hotels</Link>
        <Link href="/hotels">Destinations</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/#allouni">About Allouni</Link>
      </div>

      <div className="nz-nav-right">
        <div className="nz-lang">
          {["en", "fr", "ar"].map((l) => (
            <button
              key={l}
              className={lang === l ? "on" : ""}
              onClick={() => setLang(l)}
            >
              {l === "ar" ? "عر" : l.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="nz-nav-cta">Sign in</button>
        <button
          className="nz-burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className={menuOpen ? "x" : ""} />
          <span className={menuOpen ? "x" : ""} />
          <span className={menuOpen ? "x" : ""} />
        </button>
      </div>

      {/* mobile drawer */}
      <div className={`nz-drawer ${menuOpen ? "open" : ""}`}>
        <Link href="/hotels" onClick={() => setMenuOpen(false)}>Hotels</Link>
        <Link href="/hotels" onClick={() => setMenuOpen(false)}>Destinations</Link>
        <Link href="/#how" onClick={() => setMenuOpen(false)}>How it works</Link>
        <Link href="/#allouni" onClick={() => setMenuOpen(false)}>About Allouni</Link>
        <button className="nz-drawer-cta">Sign in</button>
      </div>

      <style jsx>{`
        .nz-nav {
          left: 0; right: 0; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 52px; transition: all .35s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-nav.fixed { position: fixed; }
        .nz-nav.sticky { position: sticky; }
        .nz-nav.solid {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid var(--gray-200);
          padding: 14px 52px;
        }
        .nz-nav.transparent { background: transparent; }
        .nz-nav-logo { display: flex; align-items: center; gap: 11px; }
        .nz-logo-mark {
          width: 30px; height: 30px; border-radius: 50%; background: var(--red);
          position: relative; flex-shrink: 0;
        }
        .nz-logo-mark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .nz-logo-words { line-height: 1; }
        .nz-logo-name {
          display: block; font-size: 21px; font-weight: 600; letter-spacing: -0.02em;
          color: ${solid ? "var(--ink)" : "#fff"};
        }
        .nz-logo-sub {
          display: block; font-size: 9px; letter-spacing: 0.07em; text-transform: uppercase;
          font-weight: 700; margin-top: 2px;
          color: ${solid ? "var(--gray-400)" : "rgba(255,255,255,0.6)"};
        }
        .nz-nav-links { display: flex; align-items: center; gap: 34px; }
        .nz-nav-links :global(a) {
          font-size: 14px; font-weight: 600; transition: color .2s;
          color: ${solid ? "var(--ink-2)" : "rgba(255,255,255,0.9)"};
        }
        .nz-nav-links :global(a:hover) { color: var(--red); }
        .nz-nav-right { display: flex; align-items: center; gap: 14px; }
        .nz-lang {
          display: flex; gap: 2px; padding: 3px; border-radius: 980px;
          background: ${solid ? "var(--gray-100)" : "rgba(255,255,255,0.15)"};
          border: 1px solid ${solid ? "var(--gray-200)" : "rgba(255,255,255,0.25)"};
        }
        .nz-lang button {
          border: none; background: transparent; font-size: 12px; font-weight: 700;
          padding: 5px 11px; border-radius: 980px; transition: all .2s;
          color: ${solid ? "var(--gray-400)" : "rgba(255,255,255,0.85)"};
        }
        .nz-lang button.on {
          background: ${solid ? "var(--ink)" : "#fff"};
          color: ${solid ? "#fff" : "var(--ink)"};
        }
        .nz-nav-cta {
          background: ${solid ? "var(--ink)" : "#fff"};
          color: ${solid ? "#fff" : "var(--ink)"};
          border: none; padding: 10px 22px; border-radius: 980px;
          font-size: 13px; font-weight: 700; transition: transform .2s;
        }
        .nz-nav-cta:hover { transform: translateY(-1px); }

        /* burger — hidden on desktop */
        .nz-burger {
          display: none; flex-direction: column; gap: 4px; justify-content: center;
          width: 38px; height: 38px; border: none; background: transparent; padding: 0;
        }
        .nz-burger span {
          display: block; width: 20px; height: 2px; border-radius: 2px;
          background: ${solid ? "var(--ink)" : "#fff"};
          transition: transform .25s, opacity .2s; margin: 0 auto;
        }
        .nz-burger span.x:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .nz-burger span.x:nth-child(2) { opacity: 0; }
        .nz-burger span.x:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        /* mobile drawer */
        .nz-drawer {
          position: fixed; top: 64px; left: 0; right: 0; bottom: 0; z-index: 99;
          background: #fff; padding: 20px;
          display: flex; flex-direction: column; gap: 4px;
          transform: translateX(100%); transition: transform .3s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-drawer.open { transform: translateX(0); }
        .nz-drawer :global(a) {
          padding: 16px 12px; font-size: 17px; font-weight: 700; color: var(--ink);
          border-bottom: 1px solid var(--gray-100);
        }
        .nz-drawer-cta {
          margin-top: 16px; padding: 15px; background: var(--red); color: #fff;
          border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700;
        }

        @media (max-width: 860px) {
          .nz-nav, .nz-nav.solid { padding: 14px 20px; }
          .nz-nav-links { display: none; }
          .nz-burger { display: flex; }
          .nz-nav-cta { display: none; }
          .nz-lang { display: none; }
        }
        @media (min-width: 861px) {
          .nz-drawer { display: none; }
        }
      `}</style>
    </nav>
  );
}
