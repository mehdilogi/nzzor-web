"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "./Icon";
import { formatPriceShort } from "../lib/format";
import { useLang } from "../lib/LangContext";

// Cloudflare Image Transformations. Off until the zone has it enabled, so the
// card keeps working untouched in the meantime — set NEXT_PUBLIC_CF_IMAGES=true
// once Transformations are switched on for nzzor.com.
//
// While this is false there is no srcSet at all, so a 250px grid slot downloads
// the full-resolution original straight from R2 — several MB of PNG per card,
// twenty-four at a time. That is the real reason the grid fills in raggedly.
//
// The width ladder is deliberately short and fixed. Cloudflare bills per unique
// source+parameter combination, so letting device pixel ratios generate
// arbitrary widths would multiply the transformation count for no visible gain.
const CF_IMAGES = process.env.NEXT_PUBLIC_CF_IMAGES === "true";
const WIDTHS = [320, 480, 768, 1200];

function cf(url, width) {
  if (!CF_IMAGES || !url) return url;
  // onerror=redirect serves the original rather than an error image if the
  // monthly transformation allowance is exhausted.
  return `/cdn-cgi/image/width=${width},format=auto,quality=80,fit=cover,onerror=redirect/${encodeURIComponent(url)}`;
}

function srcSet(url) {
  if (!CF_IMAGES || !url) return undefined;
  return WIDTHS.map((w) => `${cf(url, w)} ${w}w`).join(", ");
}

// A finger has to travel this far before the gesture counts as a swipe rather
// than a tap. Below it, the tap falls through to the link as normal.
const AXIS_LOCK_PX = 8;
const TAP_SLOP_PX = 10;

export default function HotelCard({ hotel, priority = false }) {
  const { t } = useLang();
  const searchParams = useSearchParams();

  // Carry the search context from the current URL through to the hotel page,
  // so occupancy (rooms/adults/children) and dates survive results -> detail
  // -> booking. Without forwarding rooms here, the booking always defaulted to
  // 1 unit no matter what the guest picked. `guests` is kept for back-compat
  // with any older code still reading the single-number param.
  const ci = searchParams.get("checkIn");
  const co = searchParams.get("checkOut");
  const guests = searchParams.get("guests");
  const rooms = searchParams.get("rooms");
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const qs = new URLSearchParams();
  if (ci) qs.set("checkIn", ci);
  if (co) qs.set("checkOut", co);
  if (guests) qs.set("guests", guests);
  if (rooms) qs.set("rooms", rooms);
  if (adults) qs.set("adults", adults);
  if (children) qs.set("children", children);
  const href = qs.toString()
    ? `/hotels/${hotel.slug}?${qs.toString()}`
    : `/hotels/${hotel.slug}`;

  // Cap at five. A 200px-wide card cannot show twenty dots without turning
  // them into a smear, and nobody browses twenty photos from a grid anyway.
  //
  // A gallery entry may be a bare URL string or a record ({ url, ... }) — the
  // API returns records, primaryPhoto is a plain string. Anything not resolved
  // to a string is dropped rather than rendered as [object Object].
  const photos = useMemo(() => {
    const toUrl = (p) => {
      if (!p) return null;
      if (typeof p === "string") return p;
      return p.url || p.src || p.path || p.secure_url || null;
    };
    const gallery = Array.isArray(hotel.photos) ? hotel.photos.map(toUrl).filter(Boolean) : [];
    const primary = toUrl(hotel.primaryPhoto);
    // Keep the primary first and never repeat it if the gallery also has it.
    const ordered = primary ? [primary, ...gallery.filter((u) => u !== primary)] : gallery;
    return ordered.slice(0, 5);
  }, [hotel.photos, hotel.primaryPhoto]);

  const [idx, setIdx] = useState(0);
  // Only the visited images are ever put in the DOM. Rendering five <img> tags
  // per card would mean 120 requests for a full page of 24 — on a mobile
  // connection that page never finishes loading.
  const [seen, setSeen] = useState(() => new Set([0]));
  // Which images have finished downloading. Separate from `seen` on purpose:
  // an <img> in the DOM is not the same thing as an <img> worth showing.
  // Browsers paint a large photo progressively as bytes arrive, so without
  // this gate the card displays images that are half picture, half blank —
  // which reads as a broken page rather than a loading one.
  const [loaded, setLoaded] = useState(() => new Set());

  const markLoaded = useCallback((i) => {
    setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, []);

  // A cached image can finish before React attaches the onLoad handler, in
  // which case the event never fires and the photo would stay hidden forever.
  // The ref callback catches that case on mount.
  const imgRef = useCallback(
    (el) => {
      if (el && el.complete && el.naturalWidth > 0) {
        markLoaded(Number(el.dataset.i));
      }
    },
    [markLoaded]
  );

  const ready = loaded.has(idx);

  // Live gesture state. A ref rather than state because none of it should
  // cause a render — only the final photo change does.
  const dragRef = useRef(null);
  // Set when a gesture turned out to be a swipe, read by the link's click
  // handler. Without it, every swipe ends in a navigation to the hotel page,
  // because a click still fires after the pointer sequence completes.
  const swipedRef = useRef(false);

  function show(next) {
    const n = (next + photos.length) % photos.length;
    setIdx(n);
    setSeen((prev) => (prev.has(n) ? prev : new Set(prev).add(n)));
  }

  function step(e, dir) {
    // These controls sit inside a <Link>; without this a tap on an arrow
    // navigates to the hotel instead of changing the photo.
    e.preventDefault();
    e.stopPropagation();
    show(idx + dir);
  }

  // Warm the second photo on hover so the first arrow click feels instant,
  // without paying for it on cards nobody touches.
  function warm() {
    if (photos.length < 2) return;
    setSeen((prev) => (prev.has(1) ? prev : new Set(prev).add(1)));
  }

  // Both neighbours, because at the moment a swipe is recognised the direction
  // is known but not yet committed — the finger can still reverse. Runs only
  // once a horizontal drag is confirmed, so a plain tap never triggers it.
  function warmNeighbours() {
    if (photos.length < 2) return;
    const next = (idx + 1) % photos.length;
    const prevI = (idx - 1 + photos.length) % photos.length;
    setSeen((prev) => {
      if (prev.has(next) && prev.has(prevI)) return prev;
      const s = new Set(prev);
      s.add(next);
      s.add(prevI);
      return s;
    });
  }

  // Touch and pen only. Mouse is deliberately excluded: on desktop the arrows
  // are visible on hover and already do the job, and claiming mouse drags would
  // break click-to-open and fight the browser's own link dragging.
  function onPointerDown(e) {
    swipedRef.current = false;
    if (!multi || e.pointerType === "mouse") return;
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null };
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;

    if (!d.axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      // Vertical wins ties — scrolling the page past a card must never be
      // mistaken for browsing its photos.
      if (Math.abs(dx) <= Math.abs(dy)) {
        dragRef.current = null;
        return;
      }
      d.axis = "x";
      warmNeighbours();
      // Keep receiving events even once the finger leaves the card, so a fast
      // swipe that exits the image doesn't just stop halfway.
      try {
        e.currentTarget.setPointerCapture(d.id);
      } catch {
        /* capture is best-effort; the gesture still works without it */
      }
    }

    if (Math.abs(dx) > TAP_SLOP_PX) swipedRef.current = true;
  }

  function onPointerUp(e) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.axis !== "x" || e.pointerId !== d.id) return;

    const dx = e.clientX - d.x;
    // Proportional, with a floor. A fixed pixel threshold that feels right on
    // a full-width phone card feels impossible on a 200px one in the grid.
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    if (Math.abs(dx) < Math.max(36, width * 0.12)) return;

    // Read direction off the element rather than from LangContext, so this
    // stays correct wherever the dir attribute is actually set. In Arabic the
    // previous arrow renders on the right, so the swipe has to flip with it.
    const rtl = typeof window !== "undefined"
      && window.getComputedStyle(e.currentTarget).direction === "rtl";
    const dir = dx < 0 ? 1 : -1;
    show(idx + (rtl ? -dir : dir));
  }

  // Fired when the browser takes the gesture over (a vertical scroll winning,
  // an incoming call, the app backgrounding). Abandon quietly.
  function onPointerCancel() {
    dragRef.current = null;
  }

  // Capture phase, so it runs before the arrow buttons' own handlers and
  // before next/link's navigation.
  function onClickCapture(e) {
    if (!swipedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    swipedRef.current = false;
  }

  const multi = photos.length > 1;

  return (
    <Link href={href} className="nz-hcard" onMouseEnter={warm} onClickCapture={onClickCapture}>
      {/* styled-jsx scopes by adding a generated class to the elements it
          renders, and the <a> that next/link produces never receives it — so
          any rule written as `.nz-hcard:hover ...` silently never matches.
          (The old globals.css carried a comment about this: the card's border
          was moved there "so border/shadow survive on the <Link> element".)
          Hovering this inner div instead keeps every rule scoped and working. */}
      <div className="nz-hcard-inner">
        <div
          className={`nz-hcard-media${ready ? " ready" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
        {/* Held in the DOM until the current photo is complete. A flat grey
            rectangle with a floating rating pill on it looks like a failed
            image; a skeleton looks like a page that is still arriving. */}
        {!ready && <span className="nz-hcard-skel" aria-hidden="true" />}

        {/* Every overlay waits for the photo. None of them mean anything on
            top of an empty box, and showing them early is most of what makes
            a half-loaded grid feel broken. */}
        {ready && hotel.reviewCount > 0 && (
          <span className="nz-hcard-score">
            <Icon name="star" size={10} style={{ color: "var(--red)" }} strokeWidth={0} />
            {hotel.rating}
          </span>
        )}

        {ready && (
          <span className="nz-hcard-fav" aria-hidden="true">
            <Icon name="heart" size={15} />
          </span>
        )}

        {photos.map((src, i) =>
          seen.has(i) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              ref={imgRef}
              data-i={i}
              src={cf(src, 480)}
              srcSet={srcSet(src)}
              sizes="(max-width: 520px) 100vw, (max-width: 980px) 50vw, (max-width: 1240px) 33vw, 25vw"
              alt={i === 0 ? hotel.name : ""}
              className={i === idx && loaded.has(i) ? "on" : ""}
              onLoad={() => markLoaded(i)}
              /* A photo that 404s or dies mid-transfer would otherwise leave
                 the skeleton shimmering forever. Treat it as settled and let
                 the empty frame show. */
              onError={() => markLoaded(i)}
              /* The first row is the LCP candidate — queueing it behind
                 twenty lazy images is the difference between a fast page
                 and a slow one. */
              loading={priority && i === 0 ? "eager" : "lazy"}
              fetchpriority={priority && i === 0 ? "high" : undefined}
              decoding="async"
              draggable="false"
            />
          ) : null
        )}

        {multi && ready && (
          <>
            <button
              type="button"
              className="nz-hcard-arrow start"
              aria-label="Previous photo"
              onClick={(e) => step(e, -1)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              type="button"
              className="nz-hcard-arrow end"
              aria-label="Next photo"
              onClick={(e) => step(e, 1)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <span className="nz-hcard-dots" aria-hidden="true">
              {photos.map((_, i) => (
                <span key={i} className={i === idx ? "on" : ""} />
              ))}
            </span>
          </>
        )}

        {ready && (
          <span className="nz-hcard-cta">
            {t("card.view_rooms")} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
          </span>
        )}
      </div>

        <div className="nz-hcard-info">
        <div className="nz-hcard-loc">
          {"★".repeat(hotel.stars)} · {hotel.city}
        </div>
        {/* Fixed two-line box. Without it a hotel with a long name pushes its
            price down and the row stops lining up — which is exactly what a
            four-across grid makes obvious. */}
        <div className="nz-hcard-name display">{hotel.name}</div>
        <div className="nz-hcard-price">
          <span className="amt display">{formatPriceShort(hotel.priceFrom)}</span>
          <span className="unit">{t("card.per_night")}</span>
        </div>
        </div>
      </div>

      <style jsx>{`
        /* globals.css still carries a .nz-hcard rule from the old card — a
           white panel with a border and shadow. Scoped styles cannot remove a
           global rule, so it is nulled explicitly here. */
        /* The <a> itself carries no styling — see the note in the JSX above.
           Everything visual lives on .nz-hcard-inner. */
        .nz-hcard-inner { display: block; background: transparent; }

        .nz-hcard-media {
          position: relative;
          /* 3:2 matches how hotel photography is actually shot. A portrait
             crop at four-across ran too tall and cut the buildings badly. */
          aspect-ratio: 3 / 2;
          border-radius: 14px;
          overflow: hidden;
          background: var(--gray-100, #eee);
          /* Hands vertical panning to the browser and horizontal to us. This
             is what makes the swipe possible without preventDefault, which
             React's passive listeners would refuse anyway. */
          touch-action: pan-y;
        }

        .nz-hcard-skel {
          position: absolute; inset: 0; z-index: 2;
          background: var(--gray-100, #f0f0f2);
          overflow: hidden;
        }
        /* A single slow pass of light. Faster or more contrasty than this and
           a grid of twenty-four of them turns into a disco. */
        .nz-hcard-skel::after {
          content: "";
          position: absolute; inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.55) 50%,
            transparent 100%
          );
          animation: nz-sheen 1.6s ease-in-out infinite;
        }
        @keyframes nz-sheen {
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nz-hcard-skel::after { animation: none; }
        }

        .nz-hcard-media img {
          position: absolute; inset: 0; z-index: 1;
          width: 100%; height: 100%; object-fit: cover;
          /* Zero until the file is complete. The browser paints a large photo
             progressively from the top as bytes land, and this is what stops
             that partial render from ever being visible. */
          opacity: 0;
          transition: opacity .45s ease, transform .8s cubic-bezier(0.16,1,0.3,1);
          /* Stops iOS offering the image to a long press mid-swipe. */
          -webkit-touch-callout: none;
          user-select: none; -webkit-user-select: none;
        }
        .nz-hcard-media img.on { opacity: 1; }
        .nz-hcard-inner:hover .nz-hcard-media.ready img.on { transform: scale(1.05); }

        .nz-hcard-score {
          position: absolute; top: 10px; inset-inline-start: 10px; z-index: 3;
          display: flex; align-items: center; gap: 4px;
          background: var(--white); color: var(--ink);
          font-size: 12px; font-weight: 700;
          padding: 4px 9px; border-radius: 980px;
        }
        .nz-hcard-fav {
          position: absolute; top: 10px; inset-inline-end: 10px; z-index: 3;
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink); transition: all .2s; opacity: 0;
        }
        .nz-hcard-inner:hover .nz-hcard-fav { opacity: 1; }
        .nz-hcard-fav:hover { background: var(--red); color: #fff; }

        .nz-hcard-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
          width: 26px; height: 26px; border-radius: 50%; border: 0; padding: 0;
          background: rgba(255,255,255,0.94); color: var(--ink);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; transition: opacity .2s;
        }
        .nz-hcard-arrow.start { inset-inline-start: 8px; }
        .nz-hcard-arrow.end { inset-inline-end: 8px; }
        .nz-hcard-inner:hover .nz-hcard-arrow { opacity: 1; }

        .nz-hcard-dots {
          position: absolute; inset-inline: 0; bottom: 36px; z-index: 3;
          display: flex; gap: 4px; justify-content: center;
          opacity: 0; transition: opacity .2s;
        }
        .nz-hcard-inner:hover .nz-hcard-dots { opacity: 1; }
        .nz-hcard-dots span {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.5);
          transition: background .2s, width .2s;
        }
        .nz-hcard-dots span.on { background: #fff; }

        .nz-hcard-cta {
          position: absolute; inset-inline: 0; bottom: 0; z-index: 3;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          padding: 9px; background: rgba(0,0,0,0.58);
          color: #fff; font-size: 12px; font-weight: 600;
          transform: translateY(100%); transition: transform .25s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-hcard-inner:hover .nz-hcard-cta { transform: translateY(0); }

        .nz-hcard-info { padding: 11px 2px 0; }
        .nz-hcard-loc {
          font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
          color: var(--gray-400); margin-bottom: 5px;
        }
        .nz-hcard-name {
          font-size: 15.5px; font-weight: 600; letter-spacing: -0.015em;
          line-height: 1.25; color: var(--ink);
          min-height: 2.5em;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .nz-hcard-inner:hover .nz-hcard-name { text-decoration: underline; text-underline-offset: 3px; }
        .nz-hcard-price { margin-top: 6px; }
        .nz-hcard-price .amt {
          font-size: 15.5px; font-weight: 600; letter-spacing: -0.015em; color: var(--ink);
        }
        .nz-hcard-price .unit {
          font-size: 11.5px; color: var(--gray-400); font-weight: 500; margin-inline-start: 4px;
        }

        /* No hover on touch, so the affordances that hover reveals are shown
           permanently instead — there is only one card per row at this width,
           so nothing multiplies. */
        @media (max-width: 520px) {
          .nz-hcard-media { aspect-ratio: 16 / 10; }
          .nz-hcard-fav, .nz-hcard-dots { opacity: 1; }
          .nz-hcard-cta { transform: translateY(0); }
          .nz-hcard-name { font-size: 17px; min-height: 0; }
          .nz-hcard-price .amt { font-size: 17px; }

          /* The arrows stay hidden here and swipe replaces them — but an
             opacity:0 button is still a live tap target. Left as-is they sat
             invisibly on both edges of every photo, swallowing taps meant for
             the hotel link and changing the picture instead. */
          .nz-hcard-arrow { pointer-events: none; }

          /* Slightly larger, and the active dot widens into a pill, because
             at arm's length five identical 5px circles read as one smudge. */
          .nz-hcard-dots span { width: 6px; height: 6px; }
          .nz-hcard-dots span.on { width: 14px; border-radius: 980px; }
        }
      `}</style>
    </Link>
  );
}
