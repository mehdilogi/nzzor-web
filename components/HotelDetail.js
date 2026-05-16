"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon, { AMENITY_ICON } from "./Icon";
import { formatPrice, formatPriceShort, ratingLabel } from "../lib/format";

export default function HotelDetail({ hotel }) {
  const router = useRouter();
  const rooms = hotel.rooms || [];
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // nights — default to 3 for preview if dates not set
  let nights = 3;
  if (checkIn && checkOut) {
    const d = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
    if (d > 0) nights = d;
  }
  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;

  function reserve() {
    if (!selectedRoom) return;
    const params = new URLSearchParams({
      hotel: hotel.slug,
      room: selectedRoom.id,
      nights: String(nights),
    });
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    router.push(`/booking?${params.toString()}`);
  }

  const photos = hotel.photos || [];

  return (
    <div className="nz-detail">
      {/* breadcrumb */}
      <div className="wrap nz-bc">
        <Link href="/">Home</Link><span>/</span>
        <Link href="/hotels">Hotels</Link><span>/</span>
        <Link href={`/hotels?city=${hotel.city}`}>{hotel.city}</Link><span>/</span>
        <span className="cur">{hotel.name}</span>
      </div>

      {/* gallery */}
      <div className="wrap">
        <div className="nz-gallery">
          {photos.slice(0, 5).map((p, i) => (
            <div className={`nz-gal-item ${i === 4 && photos.length > 5 ? "more" : ""}`} key={p.id || i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={hotel.name} loading={i === 0 ? "eager" : "lazy"} />
              {i === 4 && photos.length > 5 && (
                <div className="nz-gal-overlay">
                  <Icon name="view" size={18} style={{ color: "#fff" }} />
                  +{photos.length - 5} photos
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* layout */}
      <div className="wrap nz-detail-layout">
        <div className="nz-detail-main">
          {/* header */}
          <div className="nz-hotel-head">
            <div className="nz-hotel-badges">
              <span className="nz-badge stars">{"★".repeat(hotel.stars)}</span>
              {hotel.trustSignals?.verifiedPartner && (
                <span className="nz-badge verified">
                  <Icon name="check" size={13} strokeWidth={2.2} /> Verified by Allouni
                </span>
              )}
              {hotel.trustSignals?.instantConfirmation && (
                <span className="nz-badge instant"><span className="live" /> Instant confirmation</span>
              )}
            </div>
            <h1 className="display">{hotel.name}</h1>
            <div className="nz-hotel-sub">
              <span className="loc"><Icon name="pin" size={16} /> {hotel.city} · {hotel.region}</span>
              <span className="rate">
                <span className="pill">{hotel.rating}</span>
                <span className="rtext"><strong>{ratingLabel(hotel.rating)}</strong> · {hotel.reviewCount} reviews</span>
              </span>
            </div>
          </div>

          {/* about */}
          <section className="nz-dsection">
            <h2 className="display">About this hotel</h2>
            <p className="nz-about">{hotel.description}</p>
          </section>

          {/* rooms */}
          <section className="nz-dsection">
            <h2 className="display">Choose your room</h2>
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
                        <span><Icon name="guest" size={15} /> {r.capacity} guests</span>
                        {r.sizeSqm && <span><Icon name="size" size={15} /> {r.sizeSqm} m²</span>}
                        <span><Icon name="bed" size={15} /> {r.bedType}</span>
                      </div>
                      <div className="nz-room-perks">
                        <span><Icon name="check" size={13} strokeWidth={2.5} /> Free cancellation</span>
                        <span><Icon name="check" size={13} strokeWidth={2.5} /> Breakfast included</span>
                      </div>
                    </div>
                    <div className="nz-room-action">
                      <div className="nz-room-price">
                        <span className="amt display">{formatPriceShort(r.price)}</span>
                        <span className="unit">DZD / night</span>
                      </div>
                      <button
                        className={`nz-room-btn ${selected ? "sel" : ""}`}
                        onClick={() => setSelectedRoom(r)}
                      >
                        {selected ? "Selected ✓" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* amenities */}
          <section className="nz-dsection">
            <h2 className="display">What this place offers</h2>
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
          <section className="nz-dsection">
            <h2 className="display">Hotel policies</h2>
            <div className="nz-policies">
              <Policy icon="clock" label="Check-in" value={`From ${hotel.checkInTime}`} />
              <Policy icon="clock" label="Check-out" value={`Until ${hotel.checkOutTime}`} />
              <Policy icon="check" label="Cancellation"
                value={`Free up to ${hotel.policies?.cancellationHours || 48}h before arrival`} good />
              <Policy icon="child" label="Children"
                value={hotel.policies?.childrenAllowed ? "All ages welcome" : "Not suitable for children"} />
              <Policy icon="pet" label="Pets"
                value={hotel.policies?.petsAllowed ? "Pets allowed" : "Not allowed"} />
              <Policy icon="parking" label="Parking"
                value={hotel.policies?.parkingFree ? "Free on-site parking" : "Paid parking"}
                good={hotel.policies?.parkingFree} />
            </div>
          </section>
        </div>

        {/* sticky booking widget */}
        <aside>
          <div className="nz-widget">
            <div className="nz-widget-head">
              <span className="live" /> Instant confirmation — confirmed in seconds
            </div>
            <div className="nz-widget-body">
              <div className="nz-widget-price">
                <span className="amt display">{selectedRoom ? formatPriceShort(selectedRoom.price) : "—"}</span>
                <span className="unit">DZD / night</span>
              </div>

              <div className="nz-widget-dates">
                <div className="wf">
                  <label>Check in</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div className="wf">
                  <label>Check out</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>

              {selectedRoom && (
                <div className="nz-widget-room">
                  <div className="wr-label">Selected room</div>
                  <div className="wr-name display">{selectedRoom.type}</div>
                  <div className="wr-calc">
                    <span>{formatPrice(selectedRoom.price)} × {nights} nights</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              <div className="nz-widget-breakdown">
                <div className="bd-row"><span>Taxes &amp; fees</span><span>Included</span></div>
                <div className="bd-row total">
                  <span>Total</span>
                  <span className="display">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button className="nz-widget-cta" onClick={reserve}>Reserve now</button>
              <div className="nz-widget-reassure">
                <Icon name="check" size={14} strokeWidth={2.5} />
                Free cancellation · You won&apos;t be charged yet
              </div>

              <a
                className="nz-widget-wa"
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || "213XXXXXXXXX"}`}
                target="_blank" rel="noopener noreferrer"
              >
                <span className="ww-ic"><Icon name="whatsapp" size={20} style={{ color: "#fff" }} strokeWidth={0} /></span>
                <span className="ww-tx">
                  <strong>Prefer to book by WhatsApp?</strong>
                  <span>Our Algerian team will help you</span>
                </span>
              </a>
            </div>
            <div className="nz-widget-foot">
              <Icon name="shield" size={24} style={{ color: "var(--gray-300)" }} />
              Secured by SATIM · Operated by Allouni Travel Agency, licensed by the Ministry of Tourism
            </div>
          </div>
        </aside>
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
      .nz-gal-item { position: relative; overflow: hidden; background: var(--gray-100); }
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

      .nz-dsection { margin-bottom: 44px; }
      .nz-dsection h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 18px; }
      .nz-about { font-size: 15.5px; line-height: 1.75; color: var(--ink-2); }

      .nz-rooms { display: flex; flex-direction: column; gap: 16px; }
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
      .wf { border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); padding: 9px 12px; }
      .wf label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); display: block; margin-bottom: 3px; }
      .wf input { border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: var(--ink); }
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
      .nz-widget-cta:hover { background: var(--red-deep); transform: scale(1.01); }
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
    `}</style>
  );
}
