"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "./Icon";
import { formatPriceShort } from "../lib/format";
import { useLang } from "../lib/LangContext";

// Cloudflare Image Transformations. Off until the zone has it enabled, so the
// card keeps working untouched in the meantime — set NEXT_PUBLIC_CF_IMAGES=true
// once Transformations are switched on for nzzor.com.
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

  function step(e, dir) {
    // These controls sit inside a <Link>; without this a tap on an arrow
    // navigates to the hotel instead of changing the photo.
    e.preventDefault();
    e.stopPropagation();
    const next = (idx + dir + photos.length) % photos.length;
    setIdx(next);
    setSeen((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }

  // Warm the second photo on hover so the first arrow click feels instant,
  // without paying for it on cards nobody touches.
  function warm() {
    if (photos.length < 2) return;
    setSeen((prev) => (prev.has(1) ? prev : new Set(prev).add(1)));
  }

  const multi = photos.length > 1;

  return (
    <Link href={href} className="nz-hcard" onMouseEnter={warm}>
      <div className="nz-hcard-media">
        {hotel.reviewCount > 0 && (
          <span className="nz-hcard-score">
            <Icon name="star" size={10} style={{ color: "var(--red)" }} strokeWidth={0} />
            {hotel.rating}
          </span>
        )}

        <span className="nz-hcard-fav" aria-hidden="true">
          <Icon name="heart" size={15} />
        </span>

        {photos.map((src, i) =>
          seen.has(i) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={cf(src, 480)}
              srcSet={srcSet(src)}
              sizes="(max-width: 520px) 100vw, (max-width: 980px) 50vw, (max-width: 1240px) 33vw, 25vw"
              alt={i === 0 ? hotel.name : ""}
              className={i === idx ? "on" : ""}
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

        {multi && (
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

        <span className="nz-hcard-cta">
          {t("card.view_rooms")} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
        </span>
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

      <style jsx>{`
        .nz-hcard { display: block; background: transparent; }

        .nz-hcard-media {
          position: relative;
          aspect-ratio: 4 / 5;
          border-radius: 14px;
          overflow: hidden;
          background: var(--gray-100, #eee);
        }
        .nz-hcard-media img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          opacity: 0; transition: opacity .3s, transform .8s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-hcard-media img.on { opacity: 1; }
        .nz-hcard:hover .nz-hcard-media img.on { transform: scale(1.05); }

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
        .nz-hcard:hover .nz-hcard-fav { opacity: 1; }
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
        .nz-hcard:hover .nz-hcard-arrow { opacity: 1; }

        .nz-hcard-dots {
          position: absolute; inset-inline: 0; bottom: 36px; z-index: 3;
          display: flex; gap: 4px; justify-content: center;
          opacity: 0; transition: opacity .2s;
        }
        .nz-hcard:hover .nz-hcard-dots { opacity: 1; }
        .nz-hcard-dots span {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.5);
        }
        .nz-hcard-dots span.on { background: #fff; }

        .nz-hcard-cta {
          position: absolute; inset-inline: 0; bottom: 0; z-index: 3;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          padding: 9px; background: rgba(0,0,0,0.58);
          color: #fff; font-size: 12px; font-weight: 600;
          transform: translateY(100%); transition: transform .25s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-hcard:hover .nz-hcard-cta { transform: translateY(0); }

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
        .nz-hcard:hover .nz-hcard-name { text-decoration: underline; text-underline-offset: 3px; }
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
          .nz-hcard-media { aspect-ratio: 3 / 2; }
          .nz-hcard-fav, .nz-hcard-dots { opacity: 1; }
          .nz-hcard-cta { transform: translateY(0); }
          .nz-hcard-name { font-size: 17px; min-height: 0; }
          .nz-hcard-price .amt { font-size: 17px; }
        }
      `}</style>
    </Link>
  );
}
