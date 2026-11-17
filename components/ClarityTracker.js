"use client";

// =============================================================================
// ClarityTracker — Microsoft Clarity: session recordings + heatmaps
// -----------------------------------------------------------------------------
// - Loads Clarity on the public site only. /admin is never recorded: the
//   script is not loaded there, and is stopped if someone walks into it.
// - Pages that show a customer's personal details (booking form, payment
//   result, /pay, account) are masked whole: Clarity records the layout and
//   clicks, but names, emails and phone numbers appear as blocks. Card numbers
//   never reach us anyway — they are typed on SATIM's page.
// - Tags every session so it can be found later in Clarity → Filters:
//     booking = NZR-XXXX-XXXX   (on the payment / result pages)
//     hotel   = <hotel slug>    (on hotel pages)
//     city    = <city slug>     (on city pages)
//     lang    = fr | ar | en
//   Sessions that reach a booking are flagged "upgraded" so Clarity keeps
//   them in full even when it samples.
// =============================================================================

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLang } from "../lib/LangContext";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "zf6099tgas";
const MASKED = [/^\/booking/, /^\/bookings\//, /^\/pay\//, /^\/account/, /^\/reset-password/];

function load() {
  if (typeof window === "undefined" || window.__nzClarity) return;
  window.__nzClarity = true;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
}

function call(...args) {
  try { if (typeof window.clarity === "function") window.clarity(...args); } catch {}
}

function Tracker() {
  const pathname = usePathname() || "/";
  const params = useSearchParams();
  let lang = "fr";
  try { lang = useLang().lang || "fr"; } catch {}

  useEffect(() => {
    const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/partner");
    if (isAdmin) {
      if (window.__nzClarity) call("stop");
      return;
    }

    // Mask before Clarity captures the page.
    const mask = MASKED.some((re) => re.test(pathname));
    if (mask) document.body.setAttribute("data-clarity-mask", "true");
    else document.body.removeAttribute("data-clarity-mask");

    if (!window.__nzClarity) load();
    else call("start");

    call("set", "lang", lang);

    const hotel = pathname.match(/^\/hotels\/([^/]+)$/);
    if (hotel && hotel[1] !== "ville") call("set", "hotel", decodeURIComponent(hotel[1]));
    const city = pathname.match(/^\/hotels\/ville\/([^/]+)/);
    if (city) call("set", "city", decodeURIComponent(city[1]));

    const ref =
      (pathname.match(/^\/pay\/([^/]+)/) || [])[1] ||
      (pathname.match(/^\/bookings\/([^/]+)/) || [])[1] ||
      params.get("ref");
    if (ref && /^NZR-/i.test(ref)) {
      call("set", "booking", decodeURIComponent(ref).toUpperCase());
      call("upgrade", "booking");
    }
    if (pathname.startsWith("/booking")) call("upgrade", "checkout");
  }, [pathname, params, lang]);

  return null;
}

export default function ClarityTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
