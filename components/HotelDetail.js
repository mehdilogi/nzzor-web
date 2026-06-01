"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon, { AMENITY_ICON } from "./Icon";
import Lightbox from "./Lightbox";
import HotelMap from "./HotelMap";
import { formatPrice, formatPriceShort } from "../lib/format";
import { useLang } from "../lib/LangContext";
import { todayInAlgiers, validateBookingDates, localizeDateError } from "../lib/dates";

// Group flat quote options (one per room×board) into one entry per room type,
// each carrying its board rows. Preserves the quote's price sort.
function groupOptionsByRoom(options) {
  const byRoom = new Map();
  for (const o of options) {
    if (!byRoom.has(o.roomId)) {
      byRoom.set(o.roomId, {
        roomId: o.roomId,
        roomType: o.roomType,
        availability: o.availability,
        boards: [],
      });
    }
    byRoom.get(o.roomId).boards.push(o);
  }
  return Array.from(byRoom.values());
}

// Pick a localized string from an {en,fr,ar} object, falling back to en.
function localized(obj, lang) {
  if (!obj) return "";
  return obj[lang] || obj.en || obj.fr || "";
}

export default function HotelDetail({ hotel }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rooms = hotel.rooms || [];
  // How many units the guest is booking, carried from the search picker via
  // ?rooms=N. Named roomsQty to avoid clashing with `rooms` (the hotel's room
  // list above). Clamped 1..10. Drives the widget total so the preview here
  // matches the booking page (which reads the same param).
  const roomsQty = (() => {
    const n = parseInt(searchParams.get("rooms") || "1", 10);
    if (Number.isNaN(n)) return 1;
    return Math.min(10, Math.max(1, n));
  })();
  const { t, lang } = useLang();
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || null);
  // The chosen board for the selected room (e.g. "HALF_BOARD"). Drives the
  // price and is carried to the booking page. null until a board row is picked.
  const [selectedBoard, setSelectedBoard] = useState(null);
  // pre-fill dates from the URL (carried over from the search bar)
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ---- Quote-driven pricing (Phase C2) ------------------------------------
  // When dates are set we fetch /api/quote to get live priced options per
  // room type × board, with Disponible/Sur demande availability. Before dates
  // are picked we show the static room list (so the page is never empty).
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Per-room occupancy carried from search (?occ=2-0_2-1) or derived from
  // ?rooms/?adults/?children. Used as the quote's occupancy input.
  const occupancy = (() => {
    const occ = searchParams.get("occ");
    if (occ) {
      const parsed = occ.split("_").map((r) => {
        const [a, c] = r.split("-").map((n) => parseInt(n, 10));
        return { adults: a || 1, children: c || 0 };
      });
      if (parsed.length) return parsed;
    }
    const adults = parseInt(searchParams.get("adults") || "2", 10) || 2;
    const children = parseInt(searchParams.get("children") || "0", 10) || 0;
    const n = Math.min(10, Math.max(1, parseInt(searchParams.get("rooms") || "1", 10) || 1));
    // Spread total adults/children across N rooms isn't known per-room here, so
    // approximate: each room gets the per-room figures the search implied. The
    // quote prices the same room type × N, so we just need per-room heads.
    const perRoomAdults = Math.max(1, Math.round(adults / n));
    const perRoomChildren = Math.round(children / n);
    return Array.from({ length: n }, () => ({ adults: perRoomAdults, children: perRoomChildren }));
  })();

  useEffect(() => {
    if (!checkIn || !checkOut) { setQuote(null); return; }
    if (validateBookingDates(checkIn, checkOut)) { setQuote(null); return; }
    let live = true;
    setQuoteLoading(true);
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelSlug: hotel.slug, checkIn, checkOut, occupancy }),
    })
      .then((r) => r.json())
      .then((j) => { if (live) setQuote(j.data || null); })
      .catch(() => { if (live) setQuote(null); })
      .finally(() => { if (live) setQuoteLoading(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, hotel.slug]);

  // ---- Date validation for the inline booking widget ----------------------
  // The widget uses native <input type="date"> elements. Native inputs honor
  // a `min` attribute but won't enforce client-side validation past that —
  // a determined user could still paste a past date. So we also re-validate
  // inside reserve() before navigating. If the URL was carried over from a
  // stale search ("yesterday's dates") this also catches that on render.
  const today = todayInAlgiers();
  const dateError = checkIn && checkOut
    ? validateBookingDates(checkIn, checkOut)
    : null;

  // ---- Sticky scroll-spy tabs (item #4) ------------------------------------
  // The four sections (about, rooms, amenities, policies) are anchored by ID
  // so the tab bar can scroll-link to them. An IntersectionObserver watches
  // which section currently sits in the upper viewport and highlights that
  // tab. On click, we set the active tab AND smooth-scroll — the IO will
  // confirm the selection once the scroll lands.
  //
  // We use a one-shot `lockSpyUntil` timestamp to ignore IO updates for
  // ~600ms after a click. Without this, the intermediate sections passing
  // through the viewport during the scroll cause the underline to flicker.
  const TABS = [
    { id: "about",     labelKey: "detail.tab_overview"  },
    { id: "location",  labelKey: "detail.tab_location"  },
    { id: "rooms",     labelKey: "detail.tab_rooms"     },
    { id: "amenities", labelKey: "detail.tab_amenities" },
    { id: "policies",  labelKey: "detail.tab_policies"  },
  ];
  // Fallback labels so a missing translation key never renders as the raw
  // "detail.tab_xxx" string (e.g. before the i18n files get the new keys).
  const TAB_FALLBACKS = {
    "detail.tab_overview": "Overview",
    "detail.tab_location": "Location",
    "detail.tab_rooms": "Rooms",
    "detail.tab_amenities": "Amenities",
    "detail.tab_policies": "Policies",
  };
  const labelFor = (tt, tab) => {
    const out = tt(tab.labelKey);
    // If the translator echoes the key back (missing translation), fall back.
    return !out || out === tab.labelKey ? (TAB_FALLBACKS[tab.labelKey] || tab.id) : out;
  };
  const [activeTab, setActiveTab] = useState("about");
  const lockSpyUntil = useRef(0);

  useEffect(() => {
    // Only the four section IDs we care about. Margin on top pushes the
    // detection line just below the sticky tab bar so the tab flips as a
    // section's heading crosses under the tabs, not as it leaves the screen.
    const sectionIds = TABS.map((t) => t.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockSpyUntil.current) return;
        // Pick the topmost section currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          setActiveTab(visible[0].target.id);
        }
      },
      {
        // Detection line: 140px from the top of the viewport, accounting for
        // the nav (~90px) plus the sticky tab bar (~52px). Bottom margin is
        // negative so a section only "counts" while its top is visible.
        rootMargin: "-140px 0px -60% 0px",
        threshold: 0,
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jumpToTab(id) {
    setActiveTab(id);
    lockSpyUntil.current = Date.now() + 600; // suppress flicker during scroll
    const el = document.getElementById(id);
    if (!el) return;
    // Manual scroll so we control the offset (account for nav + tab bar)
    const top = el.getBoundingClientRect().top + window.scrollY - 132;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // nights — default to 1 for preview if dates not set
  let nights = 1;
  if (checkIn && checkOut) {
    const d = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
    if (d > 0) nights = d;
  }
  // The chosen quote option (room + board), if a board row was picked and a
  // quote is loaded. Its `total` already accounts for nights × rooms × board.
  const chosenOption = (() => {
    if (!quote || !selectedRoom || !selectedBoard) return null;
    return (quote.options || []).find(
      (o) => o.roomId === selectedRoom.id && o.board === selectedBoard
    ) || null;
  })();

  // Widget subtotal: prefer the board-aware quote total; fall back to the
  // static room price × nights × rooms when no board/quote is in play.
  const subtotal = chosenOption
    ? chosenOption.total
    : (selectedRoom ? selectedRoom.price * nights * roomsQty : 0);

  function reserve() {
    if (!selectedRoom) return;
    // Block the navigation if dates are invalid — past, reversed, missing,
    // or stay too long. The booking page also has its own guard (bundle 2),
    // but failing earlier gives the user a much better UX: the error
    // appears under the date inputs they just typed in, not after a route
    // change to a generic error screen.
    if (!checkIn || !checkOut) return; // CTA is disabled in this state too
    if (dateError) return;             // CTA disabled and error visible
    const params = new URLSearchParams({
      hotel: hotel.slug,
      room: selectedRoom.id,
      nights: String(nights),
    });
    if (selectedBoard) params.set("board", selectedBoard);
    if (chosenOption) params.set("bp", String(chosenOption.pricePerNightPerRoom));
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
    // Forward the occupancy the guest chose in the search picker so the
    // booking page books the right number of units (and can show heads).
    // These arrived on this page's URL from the homepage search; without
    // forwarding them here they'd be dropped and the booking would default
    // to 1 room. Only set when present so a direct visit (no search) stays
    // clean.
    const roomsParam = searchParams.get("rooms");
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");
    if (roomsParam) params.set("rooms", roomsParam);
    if (adultsParam) params.set("adults", adultsParam);
    if (childrenParam) params.set("children", childrenParam);
    router.push(`/booking?${params.toString()}`);
  }

  const photos = hotel.photos || [];

  return (
    <div className="nz-detail">
      {/* breadcrumb */}
      <div className="wrap nz-bc">
        <Link href="/">{t("detail.home")}</Link><span>/</span>
        <Link href="/hotels">{t("nav.hotels")}</Link><span>/</span>
        <Link href={`/hotels?city=${hotel.city}`}>{hotel.city}</Link><span>/</span>
        <span className="cur">{hotel.name}</span>
      </div>

      {/* gallery */}
      <div className="wrap">
        <div className="nz-gallery">
          {photos.slice(0, 5).map((p, i) => (
            <button
              className={`nz-gal-item ${i === 4 && photos.length > 5 ? "more" : ""}`}
              key={p.id || i}
              onClick={() => setLightboxIndex(i)}
              aria-label="View photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={hotel.name} loading={i === 0 ? "eager" : "lazy"} />
              {i === 4 && photos.length > 5 && (
                <div className="nz-gal-overlay">
                  <Icon name="view" size={18} style={{ color: "#fff" }} />
                  +{photos.length - 5} photos
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* layout */}
      <div className="wrap nz-detail-layout">
        <div className="nz-detail-main">
          {/* header */}
          <div className="nz-hotel-head">
            <div className="nz-hotel-badges">
              <span className="nz-badge stars">{"★".repeat(hotel.stars)}</span>
              {hotel.trustSignals?.verifiedPartner && (
                <span className="nz-badge verified">
                  <Icon name="check" size={13} strokeWidth={2.2} /> {t("detail.verified")}
                </span>
              )}
              {hotel.trustSignals?.instantConfirmation && (
                <span className="nz-badge instant"><span className="live" /> {t("detail.instant")}</span>
              )}
            </div>
            <h1 className="display">{hotel.name}</h1>
            <div className="nz-hotel-sub">
              <span className="loc"><Icon name="pin" size={16} /> {hotel.city} · {hotel.region}</span>
              {hotel.reviewCount > 0 && (
                <span className="rate">
                  <span className="pill">{hotel.rating}</span>
                  <span className="rtext"><strong>{t(ratingKey(hotel.rating))}</strong> · {hotel.reviewCount} {t("detail.reviews")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Sticky scroll-spy tabs — click to jump, underline tracks scroll */}
          <nav className="nz-dtabs">
            {TABS.filter((tab) => tab.id !== "location" || hotel.location).map((tab) => (
              <button
                key={tab.id}
                className={`nz-dtab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => jumpToTab(tab.id)}
                aria-current={activeTab === tab.id ? "true" : undefined}
              >
                {labelFor(t, tab)}
              </button>
            ))}
          </nav>

          {/* about */}
          <section id="about" className="nz-dsection">
            <h2 className="display">{t("detail.about")}</h2>
            <p className="nz-about">{hotel.description}</p>
          </section>

          {/* location — renders nothing if the hotel has no coordinates yet */}
          {hotel.location && (
            <section id="location" className="nz-dsection">
              <h2 className="display">{t("detail.location") || "Location"}</h2>
              <HotelMap hotel={hotel} t={t} />
            </section>
          )}

          {/* rooms */}
          <section id="rooms" className="nz-dsection">
            <h2 className="display">{t("detail.choose_room")}</h2>

            {/* Quote-driven grid: shown once dates are set and a quote loaded.
                Before that (no dates), fall back to the static room list so the
                page is never empty. */}
            {quoteLoading && (
              <div className="nz-quote-loading">{t("detail.loading_rates") || "Loading rates…"}</div>
            )}

            {!quoteLoading && quote && quote.options && quote.options.length > 0 ? (
              <div className="nz-rooms">
                {groupOptionsByRoom(quote.options).map((group) => {
                  const isSel = selectedRoom?.id === group.roomId;
                  const staticRoom = rooms.find((r) => r.id === group.roomId);
                  return (
                    <div className={`nz-room nz-room-q ${isSel ? "selected" : ""}`} key={group.roomId}>
                      <div className="nz-room-photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={staticRoom?.photos?.[0]} alt={localized(group.roomType, lang)} loading="lazy" />
                      </div>
                      <div className="nz-room-qbody">
                        <div className="nz-room-qhead">
                          <h3 className="display">{localized(group.roomType, lang)}</h3>
                          <span className={`nz-avail ${group.availability === "AVAILABLE" ? "ok" : "req"}`}>
                            {group.availability === "AVAILABLE"
                              ? (t("detail.available") || "Available")
                              : (t("detail.on_request") || "On request")}
                          </span>
                        </div>
                        <div className="nz-board-rows">
                          {group.boards.map((opt) => {
                            const chosen = isSel && selectedBoard === opt.board;
                            return (
                              <button
                                type="button"
                                key={opt.board}
                                className={`nz-board-row ${chosen ? "chosen" : ""}`}
                                onClick={() => { setSelectedRoom(staticRoom || null); setSelectedBoard(opt.board); }}
                              >
                                <span className="nz-board-name">
                                  {localized(opt.boardLabel, lang)}
                                  {opt.bestPrice && <span className="nz-best">{t("detail.best_price") || "Best price"}</span>}
                                </span>
                                <span className="nz-board-price">
                                  <span className="amt display">{formatPrice(opt.total)}</span>
                                  <span className="per">{t("detail.total_stay") || "total"}</span>
                                </span>
                                <span className={`nz-board-radio ${chosen ? "on" : ""}`} aria-hidden="true" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !quoteLoading && (
                <div className="nz-rooms">
                  {rooms.map((r) => {
                    const selected = selectedRoom?.id === r.id;
                    return (
                      <div className={`nz-room ${selected ? "selected" : ""}`} key={r.id}>
                        <div className="nz-room-photo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.photos?.[0]} alt={r.type} loading="lazy" />
                        </div>
                        <div className="nz-room-info">
                          <h3 className="display">{r.type}</h3>
                          <div className="nz-room-specs">
                            <span><Icon name="guest" size={15} /> {r.capacity} {t("detail.guests")}</span>
                            {r.sizeSqm && <span><Icon name="size" size={15} /> {r.sizeSqm} m²</span>}
                            <span><Icon name="bed" size={15} /> {r.bedType}</span>
                          </div>
                          <div className="nz-room-perks">
                            <span><Icon name="check" size={13} strokeWidth={2.5} /> {t("detail.free_cancel")}</span>
                          </div>
                        </div>
                        <div className="nz-room-action">
                          <div className="nz-room-price">
                            <span className="amt display">{formatPriceShort(r.price)}</span>
                            <span className="unit">{t("detail.per_night")}</span>
                          </div>
                          <button
                            className={`nz-room-btn ${selected ? "sel" : ""}`}
                            onClick={() => setSelectedRoom(r)}
                          >
                            {selected ? t("detail.selected") + " ✓" : t("detail.select")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!checkIn || !checkOut ? (
                    <p className="nz-rooms-hint">{t("detail.pick_dates_for_rates") || "Choose your dates to see live prices and meal-plan options."}</p>
                  ) : null}
                </div>
              )
            )}
          </section>

          {/* amenities */}
          <section id="amenities" className="nz-dsection">
            <h2 className="display">{t("detail.offers")}</h2>
            <div className="nz-amenities">
              {(hotel.amenities || []).map((a) => (
                <div className="nz-amenity" key={a.key}>
                  <Icon name={AMENITY_ICON[a.key] || "check"} size={19} style={{ color: "var(--red)" }} />
                  {a.name}
                </div>
              ))}
            </div>
          </section>

          {/* policies */}
          <section id="policies" className="nz-dsection">
            <h2 className="display">{t("detail.policies")}</h2>
            <div className="nz-policies">
              <Policy icon="clock" label={t("detail.checkin")} value={`${t("detail.from")} ${hotel.checkInTime}`} />
              <Policy icon="clock" label={t("detail.checkout")} value={`${t("detail.until")} ${hotel.checkOutTime}`} />
              <Policy icon="check" label={t("detail.cancellation")}
                value={`${t("detail.cancel_free")} ${hotel.policies?.cancellationHours || 48}h ${t("detail.before_arrival")}`} good />
              <Policy icon="child" label={t("detail.children")}
                value={hotel.policies?.childrenAllowed ? t("detail.children_ok") : t("detail.children_no")} />
              <Policy icon="pet" label={t("detail.pets")}
                value={hotel.policies?.petsAllowed ? t("detail.pets_ok") : t("detail.pets_no")} />
              <Policy icon="parking" label={t("detail.parking")}
                value={hotel.policies?.parkingFree ? t("detail.parking_free") : t("detail.parking_paid")}
                good={hotel.policies?.parkingFree} />
            </div>
          </section>
        </div>

        {/* sticky booking widget */}
        <aside>
          <div className="nz-widget">
            <div className="nz-widget-head">
              <span className="live" /> {t("detail.widget_head")}
            </div>
            <div className="nz-widget-body">
              <div className="nz-widget-price">
                <span className="amt display">{selectedRoom ? formatPriceShort(selectedRoom.price) : "—"}</span>
                <span className="unit">{t("detail.per_night")}</span>
              </div>

              <div className="nz-widget-dates">
                <div className="wf">
                  <label>Check in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckIn(v);
                      // If the new check-in pushes past check-out, clear
                      // check-out so the user doesn't end up with an
                      // invalid reversed range carried over silently.
                      if (checkOut && v && v >= checkOut) setCheckOut("");
                    }}
                  />
                </div>
                <div className="wf">
                  <label>Check out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              {/* Inline date error. Shows when the URL had stale dates or
                  the user managed to enter an invalid range despite the
                  min attributes (paste, devtools, etc). The Reserve button
                  is disabled in this state so the user can't proceed. */}
              {dateError && (
                <div className="nz-widget-date-err" role="alert">
                  <Icon name="shield" size={15} style={{ color: "var(--red)" }} />
                  <span>{localizeDateError(dateError, t)}</span>
                </div>
              )}

              {selectedRoom && (
                <div className="nz-widget-room">
                  <div className="wr-label">{t("detail.selected_room")}</div>
                  <div className="wr-name display">{selectedRoom.type}</div>
                  <div className="wr-calc">
                    <span>
                      {roomsQty > 1 ? `${roomsQty} × ` : ""}{formatPrice(selectedRoom.price)} × {nights} {nights === 1 ? (t("detail.night") || "night") : (t("detail.nights") || "nights")}
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              <div className="nz-widget-breakdown">
                <div className="bd-row"><span>{t("detail.taxes")}</span><span>{t("detail.included")}</span></div>
                <div className="bd-row total">
                  <span>{t("detail.total")}</span>
                  <span className="display">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                className="nz-widget-cta"
                onClick={reserve}
                disabled={!selectedRoom || !checkIn || !checkOut || !!dateError}
              >
                {t("detail.reserve")}
              </button>
              <div className="nz-widget-reassure">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("detail.reassure")}
              </div>

              <a
                className="nz-widget-wa"
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || "213XXXXXXXXX"}`}
                target="_blank" rel="noopener noreferrer"
              >
                <span className="ww-ic"><Icon name="whatsapp" size={20} style={{ color: "#fff" }} strokeWidth={0} /></span>
                <span className="ww-tx">
                  <strong>{t("detail.wa_title")}</strong>
                  <span>{t("detail.wa_sub")}</span>
                </span>
              </a>
            </div>
            <div className="nz-widget-foot">
              <Icon name="shield" size={24} style={{ color: "var(--gray-300)" }} />
              {t("detail.secured")}
            </div>
          </div>
        </aside>
      </div>

      {/* sticky mobile reserve bar */}
      <div className="nz-mobile-reserve">
        <div className="nz-mr-price">
          <span className="amt display">{selectedRoom ? formatPriceShort(selectedRoom.price) : "—"}</span>
          <span className="unit">{t("detail.per_night")}</span>
        </div>
        <button className="nz-mr-btn" onClick={reserve}>{t("detail.reserve")}</button>
      </div>

      <DetailStyles />
    </div>
  );
}

function Policy({ icon, label, value, good }) {
  return (
    <div className="nz-policy-row">
      <span className="pl"><Icon name={icon} size={17} style={{ color: "var(--gray-400)" }} /> {label}</span>
      <span className={`pv ${good ? "good" : ""}`}>{value}</span>
    </div>
  );
}

function DetailStyles() {
  return (
    <style>{`
      .nz-detail { padding-bottom: 20px; }
      .nz-bc {
        display: flex; align-items: center; gap: 8px; padding-top: 20px;
        font-size: 13px; color: var(--gray-400); font-weight: 600;
      }
      .nz-bc :global(a) { color: var(--gray-400); transition: color .2s; }
      .nz-bc :global(a:hover) { color: var(--red); }
      .nz-bc span { opacity: 0.5; }
      .nz-bc .cur { color: var(--ink); opacity: 1; }

      .nz-gallery {
        display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr;
        gap: 8px; height: 480px; border-radius: var(--r-lg); overflow: hidden; margin-top: 20px;
      }
      .nz-gal-item { position: relative; overflow: hidden; background: var(--gray-100); border: none; padding: 0; cursor: pointer; }
      .nz-gal-item:nth-child(1) { grid-row: span 2; }
      .nz-gal-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(0.16,1,0.3,1); }
      .nz-gal-item:hover img { transform: scale(1.06); }
      .nz-gal-overlay {
        position: absolute; inset: 0; background: rgba(22,22,26,0.6);
        display: flex; align-items: center; justify-content: center; gap: 8px;
        color: #fff; font-weight: 700; font-size: 15px;
      }

      .nz-detail-layout {
        display: grid; grid-template-columns: 1fr 380px; gap: 48px;
        align-items: start; padding-top: 36px; padding-bottom: 60px;
      }
      /* The aside must STRETCH to the full grid track height so the widget
         has room to "scroll within" — that's what makes position:sticky
         actually stick. Without align-self:stretch the aside is exactly
         the widget's height and sticky becomes a no-op. We use align-self
         on the aside specifically rather than removing align-items:start
         from the parent because the start alignment is correct for the
         main column (we want it to size to its content, not stretch).

         z-index keeps the widget above the sticky scroll-spy tabs that
         sit at top:80px in the main column. */
      .nz-detail-layout > aside {
        align-self: stretch;
        position: relative;
        z-index: 2;
      }
      /* Both grid children must be allowed to shrink below their min-content,
         or an over-wide child (e.g. the booking widget on mobile) widens the
         whole single-column track past the viewport and clips siblings. */
      .nz-detail-layout > * { min-width: 0; }
      .nz-hotel-head { margin-bottom: 32px; }
      .nz-hotel-badges { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
      .nz-badge {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 7px 13px; border-radius: 980px; font-size: 12px; font-weight: 700;
      }
      .nz-badge.verified { background: var(--teal-soft); color: var(--teal); }
      .nz-badge.instant { background: var(--red-soft); color: var(--red-deep); }
      .nz-badge.instant .live { width: 6px; height: 6px; border-radius: 50%; background: var(--red); animation: blink 1.6s infinite; }
      .nz-badge.stars { background: var(--ink); color: #fff; }
      .nz-hotel-head h1 { font-size: clamp(32px, 4vw, 46px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 12px; }
      .nz-hotel-sub { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
      .nz-hotel-sub .loc { display: flex; align-items: center; gap: 7px; font-size: 14px; color: var(--gray-400); font-weight: 600; }
      .nz-hotel-sub .rate { display: flex; align-items: center; gap: 9px; }
      .nz-hotel-sub .pill { background: var(--ink); color: #fff; font-family: 'Clash Display', sans-serif; font-weight: 600; font-size: 15px; padding: 5px 10px; border-radius: 9px; }
      .nz-hotel-sub .rtext { font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-hotel-sub .rtext strong { color: var(--ink); }

      /* ---- Sticky scroll-spy tabs ---- */
      /* Sits below the global nav (which is ~90px tall when sticky) and
         tracks the four sections as the user scrolls. The underline slides
         left/right based on which section the IntersectionObserver picks. */
      .nz-dtabs {
        position: sticky;
        top: 80px;
        z-index: 5;
        display: flex;
        gap: 4px;
        margin: 0 -16px 28px;
        padding: 0 16px;
        background: var(--white);
        border-bottom: 1px solid var(--gray-200);
        /* Slight backdrop blur so content scrolling underneath doesn't
           bleed through (e.g. if the user has a complex theme). */
        backdrop-filter: saturate(180%) blur(8px);
        -webkit-backdrop-filter: saturate(180%) blur(8px);
      }
      .nz-dtab {
        position: relative;
        padding: 16px 18px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--gray-400);
        transition: color 0.15s ease;
      }
      .nz-dtab::after {
        content: "";
        position: absolute;
        left: 18px; right: 18px; bottom: -1px;
        height: 2px;
        background: var(--red);
        border-radius: 1px;
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 0.22s ease;
      }
      .nz-dtab:hover { color: var(--ink); }
      .nz-dtab.active {
        color: var(--ink);
      }
      .nz-dtab.active::after {
        transform: scaleX(1);
      }

      .nz-dsection { margin-bottom: 44px; }
      .nz-dsection h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 18px; }
      .nz-about { font-size: 15.5px; line-height: 1.75; color: var(--ink-2); }

      .nz-rooms { display: flex; flex-direction: column; gap: 16px; }
      .nz-rooms-hint { font-size: 13.5px; color: var(--gray-400); margin-top: 4px; }
      .nz-quote-loading { font-size: 14px; color: var(--gray-400); padding: 20px 0; }
      /* quote-driven room card: photo + body with board rows */
      .nz-room-q { display: flex; gap: 0; align-items: stretch; overflow: hidden; }
      .nz-room-q .nz-room-photo { width: 220px; flex-shrink: 0; }
      .nz-room-qbody { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
      .nz-room-qhead { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .nz-room-qhead h3 { font-size: 19px; }
      .nz-avail { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 980px; white-space: nowrap; }
      .nz-avail.ok { background: rgba(27,138,90,0.12); color: #1B8A5A; }
      .nz-avail.req { background: rgba(230,57,70,0.10); color: var(--red-deep); }
      .nz-board-rows { display: flex; flex-direction: column; gap: 8px; }
      .nz-board-row {
        display: flex; align-items: center; gap: 12px; width: 100%;
        padding: 12px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--r-md);
        background: var(--white); cursor: pointer; transition: border-color .15s, background .15s;
        text-align: start;
      }
      .nz-board-row:hover { border-color: var(--gray-300); }
      .nz-board-row.chosen { border-color: var(--red); background: var(--red-soft); }
      .nz-board-name { flex: 1; font-size: 14.5px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 8px; min-width: 0; }
      .nz-best { font-size: 10.5px; font-weight: 800; color: #fff; background: var(--red); padding: 2px 8px; border-radius: 980px; white-space: nowrap; }
      .nz-board-price { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1; }
      .nz-board-price .amt { font-size: 17px; font-weight: 600; color: var(--ink); }
      .nz-board-price .per { font-size: 11px; color: var(--gray-400); font-weight: 600; }
      .nz-board-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--gray-300); flex-shrink: 0; position: relative; }
      .nz-board-radio.on { border-color: var(--red); }
      .nz-board-radio.on::after { content: ""; position: absolute; inset: 3px; border-radius: 50%; background: var(--red); }
      @media (max-width: 640px) {
        .nz-room-q { flex-direction: column; }
        .nz-room-q .nz-room-photo { width: 100%; height: 180px; }
      }
      .nz-room {
        display: grid; grid-template-columns: 200px 1fr auto; gap: 22px; align-items: center;
        padding: 18px; border: 1.5px solid var(--gray-200); border-radius: var(--r-lg);
        transition: border-color .25s, box-shadow .25s, background .25s;
      }
      .nz-room:hover { border-color: var(--gray-300); box-shadow: var(--shadow-md); }
      .nz-room.selected { border-color: var(--red); background: var(--red-soft); }
      .nz-room-photo { height: 140px; border-radius: var(--r-md); overflow: hidden; }
      .nz-room-photo img { width: 100%; height: 100%; object-fit: cover; }
      .nz-room-info h3 { font-size: 19px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 8px; }
      .nz-room-specs { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
      .nz-room-specs span { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-room-perks { display: flex; gap: 14px; flex-wrap: wrap; }
      .nz-room-perks span { display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; color: var(--teal); }
      .nz-room-action { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      .nz-room-price .amt { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
      .nz-room-price .unit { font-size: 12px; color: var(--gray-400); font-weight: 600; }
      .nz-room-btn { background: var(--ink); color: #fff; border: none; padding: 11px 24px; border-radius: 980px; font-size: 13px; font-weight: 700; transition: background .2s; white-space: nowrap; }
      .nz-room-btn:hover { background: var(--red); }
      .nz-room-btn.sel { background: var(--red); }

      .nz-amenities { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .nz-amenity {
        display: flex; align-items: center; gap: 11px; padding: 14px 16px;
        background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--r-md);
        font-size: 13.5px; font-weight: 600;
      }

      .nz-policies { border: 1px solid var(--gray-200); border-radius: var(--r-lg); overflow: hidden; }
      .nz-policy-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-bottom: 1px solid var(--gray-100);
      }
      .nz-policy-row:last-child { border-bottom: none; }
      .nz-policy-row .pl { display: flex; align-items: center; gap: 11px; font-size: 14px; font-weight: 700; }
      .nz-policy-row .pv { font-size: 13.5px; color: var(--gray-400); font-weight: 600; }
      .nz-policy-row .pv.good { color: var(--teal); }

      .nz-widget {
        position: sticky; top: 90px; background: var(--white);
        border: 1px solid var(--gray-200); border-radius: var(--r-lg);
        box-shadow: var(--shadow-lg); overflow: hidden;
        max-width: 100%;
      }
      .nz-widget-head {
        padding: 14px 22px; background: var(--red-soft);
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 700; color: var(--red-deep);
        border-bottom: 1px solid var(--gray-100);
      }
      .nz-widget-head .live { width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: blink 1.6s infinite; }
      .nz-widget-body { padding: 22px; }
      .nz-widget-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 20px; }
      .nz-widget-price .amt { font-size: 32px; font-weight: 600; letter-spacing: -0.025em; }
      .nz-widget-price .unit { font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-widget-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
      .nz-widget-dates > .wf { min-width: 0; }
      .wf { border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); padding: 9px 12px; min-width: 0; }
      .wf label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); display: block; margin-bottom: 3px; }
      .wf input { border: none; outline: none; width: 100%; min-width: 0; font-size: 13px; font-weight: 600; color: var(--ink); }
      .nz-widget-room { padding: 14px; background: var(--cream); border-radius: var(--r-md); margin-bottom: 16px; border: 1px solid var(--gray-100); }
      .wr-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-400); margin-bottom: 5px; }
      .wr-name { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
      .wr-calc { display: flex; justify-content: space-between; font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-widget-breakdown { margin-bottom: 16px; }
      .bd-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13.5px; color: var(--ink-2); font-weight: 600; }
      .bd-row.total { border-top: 1.5px solid var(--gray-200); margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 800; color: var(--ink); }
      .bd-row.total .display { font-size: 20px; font-weight: 600; }
      .nz-widget-cta {
        width: 100%; padding: 15px; background: var(--red); color: #fff; border: none;
        border-radius: var(--r-md); font-family: 'Clash Display', sans-serif;
        font-size: 16px; font-weight: 600; transition: background .2s, transform .15s;
      }
      .nz-widget-cta:hover:not(:disabled) { background: var(--red-deep); transform: scale(1.01); }
      .nz-widget-cta:disabled {
        background: var(--gray-200); color: var(--gray-400);
        cursor: not-allowed; transform: none;
      }

      /* Inline date-error banner shown between the date inputs and the
         booking breakdown. Tighter and more compact than the booking-page
         banner because it sits inside the narrow widget column. */
      .nz-widget-date-err {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px; margin-bottom: 14px;
        background: rgba(230, 57, 70, 0.08);
        border: 1px solid rgba(230, 57, 70, 0.25);
        border-left: 3px solid var(--red);
        border-radius: var(--r-sm);
        font-size: 12.5px; color: var(--ink); line-height: 1.4;
      }
      .nz-widget-reassure {
        text-align: center; margin-top: 12px; font-size: 12px; color: var(--teal); font-weight: 700;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .nz-widget-wa {
        margin-top: 14px; display: flex; align-items: center; gap: 11px;
        padding: 14px 16px; border: 1.5px solid var(--gray-200); border-radius: var(--r-md);
        transition: border-color .2s, background .2s;
      }
      .nz-widget-wa:hover { border-color: #25D366; background: #f4fdf7; }
      .ww-ic { width: 38px; height: 38px; border-radius: 50%; background: #25D366; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .ww-tx { font-size: 12.5px; }
      .ww-tx strong { display: block; color: var(--ink); font-weight: 700; }
      .ww-tx span { color: var(--gray-400); }
      .nz-widget-foot {
        padding: 14px 22px; background: var(--cream); border-top: 1px solid var(--gray-100);
        display: flex; align-items: center; gap: 9px; font-size: 11.5px; color: var(--gray-400); font-weight: 600;
      }

      @media (max-width: 1080px) {
        .nz-detail-layout { grid-template-columns: 1fr; }
        .nz-widget { position: static; }
        /* The floating WhatsApp bubble overlaps the sticky reserve bar and is
           redundant here — the booking widget already has a "book by WhatsApp"
           CTA. Hide it on mobile detail pages only (this global style tag is
           only mounted on detail pages). !important beats WhatsAppButton's own
           scoped display:flex. Desktop keeps the bubble (no reserve bar there). */
        .nz-wa { display: none !important; }
      }
      @media (max-width: 720px) {
        .nz-gallery { grid-template-columns: 1fr 1fr; height: 320px; }
        .nz-gal-item:nth-child(1) { grid-column: span 2; }
        .nz-gal-item:nth-child(4), .nz-gal-item:nth-child(5) { display: none; }
        .nz-room { grid-template-columns: 1fr; }
        .nz-room-photo { height: 180px; }
        .nz-room-action { text-align: left; align-items: flex-start; }
        .nz-amenities { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 560px) {
        .nz-bc { flex-wrap: wrap; row-gap: 4px; font-size: 12px; }
        .nz-gallery { height: 240px; gap: 5px; }
        .nz-detail-layout { padding-top: 24px; gap: 0; padding-bottom: 90px; }
        .nz-hotel-head h1 { font-size: 28px; }
        .nz-hotel-sub { gap: 12px; }
        .nz-dtabs {
          /* Allow horizontal scroll if tabs overflow on small screens */
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .nz-dtabs::-webkit-scrollbar { display: none; }
        .nz-dtab {
          padding: 14px 12px;
          font-size: 13.5px;
          white-space: nowrap;
        }
        .nz-dtab::after { left: 12px; right: 12px; }
        .nz-dsection { margin-bottom: 32px; }
        .nz-dsection h2 { font-size: 21px; }
        .nz-about { font-size: 14.5px; }
        .nz-room { padding: 14px; }
        .nz-room-action {
          flex-direction: row; align-items: center; justify-content: space-between;
          width: 100%; margin-top: 4px;
        }
        .nz-amenities { grid-template-columns: 1fr; }
        .nz-policy-row { padding: 14px 16px; }
        .nz-widget { border-radius: var(--r-md); }
        .nz-room-perks { gap: 10px; }
      }

      /* sticky mobile reserve bar — hidden on desktop */
      .nz-mobile-reserve { display: none; }
      @media (max-width: 1080px) {
        .nz-mobile-reserve {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 90;
          background: #fff; border-top: 1px solid var(--gray-200);
          padding: 12px 20px; box-shadow: 0 -8px 24px -12px rgba(20,20,30,0.2);
        }
        .nz-mr-price .amt { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
        .nz-mr-price .unit { font-size: 11px; color: var(--gray-400); font-weight: 600; margin-inline-start: 4px; }
        .nz-mr-btn {
          flex: 1; max-width: 200px; padding: 14px; background: var(--red); color: #fff;
          border: none; border-radius: var(--r-sm);
          font-family: 'Clash Display', sans-serif; font-size: 15px; font-weight: 600;
        }
      }
    `}</style>
  );
}

function ratingKey(rating) {
  if (rating >= 9) return "rate.exceptional";
  if (rating >= 8.5) return "rate.excellent";
  if (rating >= 8) return "rate.verygood";
  if (rating >= 7) return "rate.good";
  return "rate.pleasant";
}
