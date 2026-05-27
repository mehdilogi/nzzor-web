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
// The visitorId cookie is set server-side by /api/analytics/beacon and
// auto-included on subsequent fetches via the credentials:"include" flag
// in fetch (matters for the trackEvent path that uses fetch instead of
// sendBeacon).
// =============================================================================

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BEACON_URL = `${API_URL}/api/analytics/beacon`;
const EVENT_URL = `${API_URL}/api/analytics/event`;

// trackEvent is callable from anywhere in the app, but it can only fire
// after the beacon component has mounted (it needs to know the API URL).
// In practice the layout always mounts before any user interaction, so
// this is fine; we still no-op safely if API_URL isn't set.
export function trackEvent(type, meta = null) {
  if (!API_URL || typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  const payload = JSON.stringify({ type, path, meta });

  // Prefer sendBeacon for true fire-and-forget; fall back to fetch.
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(EVENT_URL, blob);
      if (ok) return;
    }
  } catch {}
  // Fallback — keepalive: true ensures the request survives page unload.
  fetch(EVENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}

function sendPageview() {
  if (!API_URL || typeof window === "undefined") return;

  const payload = JSON.stringify({
    path: window.location.pathname,
    fullUrl: window.location.href,
    referrer: document.referrer || null,
    lang: navigator.language || null,
    webdriver: !!navigator.webdriver,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(BEACON_URL, blob)) return;
    }
  } catch {}
  fetch(BEACON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
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
