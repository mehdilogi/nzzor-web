"use client";

// =============================================================================
// Nzzor — Booking Alert Hook (v2)
//
// Plays a sustained reception-bell chime, drives an on-page banner, flashes
// the tab title, and shows browser notifications when new PENDING bookings
// arrive in the partner portal.
//
// Key design notes:
//  - Audio needs a user gesture to unlock. We listen for the FIRST click or
//    tap anywhere and unlock immediately — including the sign-in button on
//    the partner login page. By the time the partner reaches the bookings
//    tab, audio is unlocked.
//  - We expose a playTestChime() function so partners can verify audio
//    works before a real booking arrives.
//  - Console logs every poll cycle so it's possible to verify the alert
//    system is alive even before any booking exists.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";

const REMINDER_INTERVAL_MS = 90_000;
const MAX_AUDIBLE_REMINDERS = 5;
const CHIME_DURATION_S = 10; // total ring duration on first alert

// Track audio-unlocked state at module level so it persists across navigation
let audioUnlocked = false;
let sharedAudioCtx = null;

function ensureAudioCtx() {
  if (typeof window === "undefined") return null;
  if (sharedAudioCtx && sharedAudioCtx.state !== "closed") return sharedAudioCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  sharedAudioCtx = new AudioCtx();
  return sharedAudioCtx;
}

function installAudioUnlocker() {
  if (typeof window === "undefined") return;
  if (audioUnlocked) return;
  const unlock = () => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
    } catch {}
    window.removeEventListener("click", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
  window.addEventListener("click", unlock);
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock);
}

export function playReceptionBell({ sustained = false, volume = 0.55 } = {}) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const startAt = ctx.currentTime;

  function ding(when, freq, dur = 0.45, vol = volume) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(vol, when + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    } catch {}
  }

  if (sustained) {
    let t = 0;
    while (t < CHIME_DURATION_S) {
      ding(startAt + t,        1320, 0.45);
      ding(startAt + t + 0.18, 990,  0.45);
      ding(startAt + t + 0.55, 1180, 0.35, volume * 0.7);
      t += 1.8;
    }
  } else {
    ding(startAt,        1320, 0.4);
    ding(startAt + 0.18, 990,  0.4);
  }
}

export function playTestChime() {
  installAudioUnlocker();
  playReceptionBell({ sustained: false, volume: 0.5 });
}

function useTitleFlash(active, message) {
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

function useNotificationPermission() {
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
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
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}

export function useBookingAlerts(pendingBookings) {
  const [muted, setMuted] = useState(false);
  const [newBookingBanner, setNewBookingBanner] = useState(null);
  const seenRef = useRef(new Map());

  useEffect(() => { installAudioUnlocker(); }, []);

  useNotificationPermission();
  useTitleFlash(
    pendingBookings.length > 0,
    `${pendingBookings.length} pending booking${pendingBookings.length === 1 ? "" : "s"}`
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(`[Nzzor alerts] tick — ${pendingBookings.length} pending, ${seenRef.current.size} seen`);
    }
    if (!pendingBookings || pendingBookings.length === 0) {
      seenRef.current.clear();
      return;
    }
    const now = Date.now();
    let firstNewBooking = null;
    let shouldRemind = false;

    for (const b of pendingBookings) {
      const seen = seenRef.current.get(b.id);
      if (!seen) {
        seenRef.current.set(b.id, { firstSeen: now, reminders: 0, lastAlertAt: now });
        if (!firstNewBooking) firstNewBooking = b;
      } else if (
        seen.reminders < MAX_AUDIBLE_REMINDERS &&
        now - seen.lastAlertAt >= REMINDER_INTERVAL_MS
      ) {
        seen.reminders += 1;
        seen.lastAlertAt = now;
        shouldRemind = true;
      }
    }

    for (const id of Array.from(seenRef.current.keys())) {
      if (!pendingBookings.find((b) => b.id === id)) {
        seenRef.current.delete(id);
      }
    }

    if (firstNewBooking) {
      console.log(`[Nzzor alerts] NEW BOOKING detected: ${firstNewBooking.reference}`);
      setNewBookingBanner(firstNewBooking);
      if (!muted) {
        playReceptionBell({ sustained: true, volume: 0.55 });
        showBrowserNotification(
          "New Nzzor booking",
          `${firstNewBooking.reference} — ${firstNewBooking.guest?.firstName || "Guest"} needs your confirmation.`
        );
      }
    } else if (shouldRemind && !muted) {
      console.log("[Nzzor alerts] reminder chime");
      playReceptionBell({ sustained: false, volume: 0.35 });
    }
  }, [pendingBookings, muted]);

  const dismissBanner = useCallback(() => setNewBookingBanner(null), []);

  return {
    hasPending: pendingBookings.length > 0,
    newBookingBanner,
    dismissBanner,
    muted,
    setMuted,
    playTest: playTestChime,
  };
}
