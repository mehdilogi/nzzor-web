"use client";

// =============================================================================
// Nzzor — Booking Alert Hook
// Plays a distinctive sound, flashes the tab title, and shows browser
// notifications when new PENDING bookings arrive in the partner portal.
//
// Escalation pattern:
//  - First arrival of a booking ID: loud alert (longer tone, browser notif)
//  - Then a gentler reminder every ~90 seconds while still pending
//  - After ~5 cycles, the audio quiets — but the visual badge and tab title
//    keep flashing as long as bookings are pending. Allouni's ops dashboard
//    is the second tier; it lights up when bookings sit unanswered.
// =============================================================================

import { useEffect, useRef, useState } from "react";

// Tunables — easy to adjust if Allouni feedback says "too aggressive" or
// "too quiet" once it's running with real hotels.
const POLL_INTERVAL_MS = 20_000;
const REMINDER_INTERVAL_MS = 90_000;
const MAX_AUDIBLE_REMINDERS = 5;

// Build a "reception desk bell" chime via WebAudio — no external file needed,
// no asset hosting, works anywhere. Two short bright tones, descending.
function playReceptionBell(volume = 0.4) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function ding(when, freq, dur = 0.45) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // crisp attack, smooth decay — classic bell envelope
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume, when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    }

    // two tones, slight pitch drop — feels like a real reception bell
    ding(now, 1320);                 // high tone
    ding(now + 0.18, 990);           // lower tone
    // brief pause then a third softer tone for distinctness
    ding(now + 0.55, 1180, 0.35);

    // close the context shortly after to release the audio thread
    setTimeout(() => { try { ctx.close(); } catch {} }, 1500);
  } catch (e) {
    // audio not supported / blocked — silent fallback is fine
  }
}

// Flash the tab title to grab attention even when the user is on another tab.
function useTitleFlash(active, message = "New booking!") {
  const originalTitle = useRef(typeof document !== "undefined" ? document.title : "");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (active) {
      let toggle = false;
      intervalRef.current = setInterval(() => {
        document.title = toggle ? originalTitle.current : `🔔 ${message}`;
        toggle = !toggle;
      }, 900);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.title = originalTitle.current;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof document !== "undefined") document.title = originalTitle.current;
    };
  }, [active, message]);
}

// Ask for browser notification permission once. Returns the current state.
function useNotificationPermission() {
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      // delay slightly so the prompt doesn't fire during initial page mount
      const t = setTimeout(() => {
        Notification.requestPermission().then(setPermission).catch(() => {});
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);
  return permission;
}

function showBrowserNotification(title, body) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "nzzor-booking",
      requireInteraction: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}

// Main hook: tracks the list of pending bookings, fires alerts on new arrivals
// and reminders for ones still pending after a while.
//
// Usage:
//   const { hasPending, muted, setMuted } = useBookingAlerts(pendingBookings);
export function useBookingAlerts(pendingBookings, opts = {}) {
  const [muted, setMuted] = useState(false);
  const seenRef = useRef(new Map()); // bookingId -> { firstSeen, reminders, lastAlertAt }
  const audioUnlockedRef = useRef(false);

  // Most browsers require a user gesture before audio can play. Wire a
  // one-time gesture listener that unlocks audio.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function unlock() {
      audioUnlockedRef.current = true;
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    }
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  useNotificationPermission();
  useTitleFlash(pendingBookings.length > 0, `${pendingBookings.length} pending booking${pendingBookings.length === 1 ? "" : "s"}`);

  useEffect(() => {
    if (!pendingBookings || pendingBookings.length === 0) {
      // no pending bookings — clear out the seen state so a fresh booking
      // tomorrow triggers properly
      seenRef.current.clear();
      return;
    }
    const now = Date.now();
    let shouldAlertLoud = false;
    let shouldRemind = false;

    for (const b of pendingBookings) {
      const seen = seenRef.current.get(b.id);
      if (!seen) {
        // first time we've seen this booking
        seenRef.current.set(b.id, { firstSeen: now, reminders: 0, lastAlertAt: now });
        shouldAlertLoud = true;
      } else if (
        seen.reminders < MAX_AUDIBLE_REMINDERS &&
        now - seen.lastAlertAt >= REMINDER_INTERVAL_MS
      ) {
        seen.reminders += 1;
        seen.lastAlertAt = now;
        shouldRemind = true;
      }
    }

    // remove entries for bookings that are no longer pending
    for (const id of Array.from(seenRef.current.keys())) {
      if (!pendingBookings.find((b) => b.id === id)) {
        seenRef.current.delete(id);
      }
    }

    if (!muted && audioUnlockedRef.current) {
      if (shouldAlertLoud) {
        playReceptionBell(0.5);
        // a second chime after a beat for emphasis on truly new bookings
        setTimeout(() => playReceptionBell(0.45), 700);
        showBrowserNotification(
          "New Nzzor booking",
          `${pendingBookings.length} booking${pendingBookings.length === 1 ? "" : "s"} awaiting your confirmation.`
        );
      } else if (shouldRemind) {
        playReceptionBell(0.3); // softer
      }
    }
  }, [pendingBookings, muted]);

  return {
    hasPending: pendingBookings.length > 0,
    muted,
    setMuted,
  };
}
