"use client";

import Link from "next/link";
import Icon from "./Icon";
import { formatPriceShort } from "../lib/format";

export default function HotelCard({ hotel }) {
  return (
    <Link href={`/hotels/${hotel.slug}`} className="nz-hcard">
      <div className="nz-hcard-media">
        {hotel.trustSignals?.instantConfirmation && (
          <span className="nz-hcard-tag">
            <span className="nz-live" /> Instant confirmation
          </span>
        )}
        <span className="nz-hcard-score">
          <Icon name="star" size={11} style={{ color: "var(--red)" }} strokeWidth={0} />
          {hotel.rating}
        </span>
        <span className="nz-hcard-fav" aria-hidden="true">
          <Icon name="heart" size={17} />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hotel.primaryPhoto} alt={hotel.name} loading="lazy" />
      </div>
      <div className="nz-hcard-info">
        <div className="nz-hcard-loc">
          {"★".repeat(hotel.stars)} · {hotel.city}
        </div>
        <div className="nz-hcard-name display">{hotel.name}</div>
        <div className="nz-hcard-foot">
          <div className="nz-hcard-price">
            <span className="amt display">{formatPriceShort(hotel.priceFrom)}</span>
            <span className="unit">DZD / night</span>
          </div>
          <span className="nz-hcard-book">Book now</span>
        </div>
      </div>

      <style jsx>{`
        .nz-hcard {
          display: block; background: var(--white); border-radius: var(--r-lg);
          overflow: hidden; border: 1px solid var(--gray-100);
          transition: transform .35s cubic-bezier(0.16,1,0.3,1), box-shadow .35s;
        }
        .nz-hcard:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .nz-hcard-media { position: relative; height: 280px; overflow: hidden; }
        .nz-hcard-media img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform .8s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-hcard:hover .nz-hcard-media img { transform: scale(1.07); }
        .nz-hcard-tag {
          position: absolute; top: 14px; left: 14px; z-index: 2;
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          padding: 7px 12px; border-radius: 980px;
          font-size: 11.5px; font-weight: 700; color: var(--ink);
        }
        .nz-live {
          width: 6px; height: 6px; border-radius: 50%; background: var(--red);
          animation: blink 1.6s infinite;
        }
        .nz-hcard-score {
          position: absolute; top: 14px; right: 14px; z-index: 2;
          background: var(--ink); color: #fff;
          font-family: 'Clash Display', sans-serif; font-weight: 600; font-size: 14px;
          padding: 6px 10px; border-radius: 9px;
          display: flex; align-items: center; gap: 4px;
        }
        .nz-hcard-fav {
          position: absolute; bottom: 14px; right: 14px; z-index: 2;
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          border: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink); transition: all .2s;
        }
        .nz-hcard:hover .nz-hcard-fav { background: var(--red); border-color: var(--red); color: #fff; }
        .nz-hcard-info { padding: 20px; }
        .nz-hcard-loc {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em;
          color: var(--gray-400); margin-bottom: 7px;
        }
        .nz-hcard-name {
          font-size: 21px; font-weight: 600; letter-spacing: -0.02em;
          margin-bottom: 16px; line-height: 1.15; color: var(--ink);
        }
        .nz-hcard-foot {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 16px; border-top: 1px solid var(--gray-100);
        }
        .nz-hcard-price .amt { font-size: 21px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .nz-hcard-price .unit { font-size: 12px; color: var(--gray-400); font-weight: 600; margin-left: 4px; }
        .nz-hcard-book {
          background: var(--ink); color: #fff; padding: 11px 22px; border-radius: 980px;
          font-size: 13px; font-weight: 700; transition: background .2s, transform .15s;
        }
        .nz-hcard:hover .nz-hcard-book { background: var(--red); }

        @media (max-width: 560px) {
          .nz-hcard-media { height: 210px; }
          .nz-hcard-info { padding: 16px; }
          .nz-hcard-name { font-size: 19px; margin-bottom: 14px; }
          .nz-hcard-foot { padding-top: 14px; }
          .nz-hcard-price .amt { font-size: 19px; }
          .nz-hcard-book { padding: 10px 18px; }
          /* on touch, hover lift never fires — keep a subtle resting shadow instead */
          .nz-hcard { box-shadow: var(--shadow-sm); }
        }
      `}</style>
    </Link>
  );
}
