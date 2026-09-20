// =============================================================================
// Nzzor — Client-side Analytics Beacon
// =============================================================================
// Mounted once in app/layout.js as <AnalyticsBeacon />. Listens to Next.js
// route changes and fires a pageview to /api/analytics/beacon on every
// navigation. Uses navigator.sendBeacon() so the request doesn't delay
// page transitions or get cancelled when the user clicks away mid-flight.
//
// Also exports trackEvent(type, meta) which the rest of the app uses to
// log custom events (WhatsApp click, booking CTA click, etc.).
//
// IDENTITY — why this is no longer a cookie
// -----------------------------------------------------------------------------
// The visitorId used to be a cookie set by the API. nzzor.com and
// api.nzzor.com are different origins, so from the browser's point of view
// that is a THIRD-PARTY cookie: Safari blocks it outright, Chrome increasingly
// does, and sendBeacon cannot reliably carry credentials cross-origin in any
// case. The result was that every request arrived with no identity, so every
// pageview counted as a fresh visitor and a fresh session — which is why
// sessions, visitors and pageviews were all the same number and pages/session
// was pinned at exactly 1.00.
//
// The IDs are now generated here and kept in first-party storage on
// nzzor.com itself, then sent in the payload. No cookie, no CORS credential
// negotiation, nothing for an ad blocker or ITP to strip.
//
//   visitorId  localStorage, permanent — one person across visits
//   sessionId  localStorage, rolls after 30 minutes of inactivity or at
//              midnight Algiers time, matching what every analytics tool
//              means by "session"
//
// Both are random. Neither is derived from anything about the person.
// =============================================================================

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BEACON_URL = `${API_URL}/api/analytics/beacon`;
const EVENT_URL = `${API_URL}/api/analytics/event`;

const VISITOR_KEY = "nz_vid";
const SESSION_KEY = "nz_sid";
const SEEN_KEY = "nz_seen";
const SESSION_MINUTES = 30;

function uid() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Private browsing and locked-down profiles throw on localStorage access
// rather than returning null, so every touch is guarded. When storage is
// unavailable the beacon still fires — it just cannot stitch the visit
// together, which is the old behaviour rather than a new failure.
function read(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { window.localStorage.setItem(key, value); } catch {}
}

// Algiers is UTC+1 with no daylight saving, so "today" is a fixed offset.
// A session that runs past midnight should still end there: otherwise a
// single overnight visitor smears across two days of reporting.
function algiersDay(ts) {
  return Math.floor((ts + 60 * 60 * 1000) / 86400000);
}

function identity() {
  const now = Date.now();

  let vid = read(VISITOR_KEY);
  if (!vid) { vid = uid(); write(VISITOR_KEY, vid); }

  let sid = read(SESSION_KEY);
  const seen = Number(read(SEEN_KEY) || 0);
  const expired =
    !sid ||
    !seen ||
    now - seen > SESSION_MINUTES * 60 * 1000 ||
    algiersDay(now) !== algiersDay(seen);

  // `entry` marks the first pageview of a session. The referrer is only
  // meaningful there: a soft navigation in the App Router does not change
  // document.referrer, so without this flag the original external referrer is
  // reattached to every pageview of the visit and inflates whichever source
  // sent them — one Facebook click reported as eight.
  const entry = expired;
  if (expired) { sid = uid(); write(SESSION_KEY, sid); }
  write(SEEN_KEY, String(now));

  return { visitorId: vid, sessionId: sid, entry };
}

// Fire and forget. sendBeacon first; fetch with keepalive when it refuses,
// which it does once the queued payload budget is spent.
function post(url, payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {}
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}

// trackEvent is callable from anywhere in the app, but it can only fire
// after the beacon component has mounted (it needs to know the API URL).
// In practice the layout always mounts before any user interaction, so
// this is fine; we still no-op safely if API_URL isn't set.
export function trackEvent(type, meta = null) {
  if (!API_URL || typeof window === "undefined") return;
  const { visitorId, sessionId } = identity();
  post(EVENT_URL, {
    type,
    path: window.location.pathname + window.location.search,
    meta,
    visitorId,
    sessionId,
  });
}

function sendPageview() {
  if (!API_URL || typeof window === "undefined") return;
  const { visitorId, sessionId, entry } = identity();

  post(BEACON_URL, {
    path: window.location.pathname,
    fullUrl: window.location.href,
    // Sent on every pageview so the server can keep ignoring it on non-entry
    // hits without having to remember which visit it belonged to.
    referrer: document.referrer || null,
    entry,
    lang: navigator.language || null,
    webdriver: !!navigator.webdriver,
    visitorId,
    sessionId,
    // Useful, free, and impossible to reconstruct later: it distinguishes the
    // phone traffic this platform mostly serves from desktop.
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });
}

// The inner component uses useSearchParams, which would opt the entire
// host route into client-side rendering unless we isolate it behind a
// Suspense boundary. See:
// https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
//
// PostHog's well-publicised bug (analytics silently broken across a whole
// site because the provider wasn't Suspense-wrapped) is the cautionary
// tale we're following.
function BeaconInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousKey = useRef(null);

  useEffect(() => {
    // The combined key handles the case where searchParams change but
    // pathname stays — e.g. /hotels?city=algiers → /hotels?city=oran
    // should count as two pageviews.
    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (key === previousKey.current) return;
    previousKey.current = key;
    sendPageview();
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsBeacon() {
  return (
    <Suspense fallback={null}>
      <BeaconInner />
    </Suspense>
  );
}
