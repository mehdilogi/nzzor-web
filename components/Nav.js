"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LogoMark from "./LogoMark";

// Nzzor top navigation. Transparent over hero, solid white on scroll.
export default function Nav({ overHero = false }) {
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
          <Link href="/hotels">Hotels</Link>
          <Link href="/hotels">Destinations</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#allouni">About Allouni</Link>
        </div>

        <div className="nzn-right">
          <button className="nzn-signin">Sign in</button>
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
            <Link href="/hotels" onClick={() => setMenuOpen(false)}>Hotels</Link>
            <Link href="/hotels" onClick={() => setMenuOpen(false)}>Destinations</Link>
            <Link href="/#how" onClick={() => setMenuOpen(false)}>How it works</Link>
            <Link href="/#allouni" onClick={() => setMenuOpen(false)}>About Allouni</Link>
          </nav>
          <button className="nzn-menu-cta">Sign in</button>
          <p className="nzn-menu-foot">
            Operated by Allouni Travel Agency · Licensed by the Algerian Ministry of Tourism
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
        .nzn-menu-cta {
          width: 100%; padding: 16px; background: var(--red); color: #fff;
          border: none; border-radius: var(--r-sm);
          font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 20px;
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
          .nzn-burger { display: flex; }
        }
      `}</style>
    </>
  );
}
