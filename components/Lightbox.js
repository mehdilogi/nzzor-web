"use client";

// =============================================================================
// Nzzor — Lightbox
// Fullscreen photo viewer. Click thumb to open, arrows / swipe to navigate,
// Esc or click backdrop to close.
// =============================================================================

import { useEffect, useState, useCallback } from "react";

export default function Lightbox({ photos, startIndex = 0, onClose }) {
  const [i, setI] = useState(startIndex);
  const total = photos.length;

  const next = useCallback(() => setI((x) => (x + 1) % total), [total]);
  const prev = useCallback(() => setI((x) => (x - 1 + total) % total), [total]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [next, prev, onClose]);

  // touch swipe
  const [touchX, setTouchX] = useState(null);
  function onTouchStart(e) { setTouchX(e.touches[0].clientX); }
  function onTouchEnd(e) {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 50) prev();
    else if (dx < -50) next();
    setTouchX(null);
  }

  return (
    <div className="lb" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close">×</button>
      <div className="lb-count">{i + 1} / {total}</div>

      {total > 1 && (
        <button className="lb-arrow left" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
      )}

      <div
        className="lb-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[i]?.url || photos[i]} alt="" />
      </div>

      {total > 1 && (
        <button className="lb-arrow right" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
      )}

      {total > 1 && (
        <div className="lb-thumbs" onClick={(e) => e.stopPropagation()}>
          {photos.map((p, idx) => (
            <button
              key={idx}
              className={`lb-thumb ${idx === i ? "on" : ""}`}
              onClick={() => setI(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p?.url || p} alt="" />
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .lb {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(12,12,16,0.96);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: lbfade .2s ease;
        }
        @keyframes lbfade { from { opacity: 0; } to { opacity: 1; } }
        .lb-close {
          position: absolute; top: 18px; right: 20px; z-index: 2;
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.12); color: #fff; font-size: 26px; line-height: 1;
          cursor: pointer;
        }
        .lb-close:hover { background: rgba(255,255,255,0.22); }
        .lb-count {
          position: absolute; top: 26px; left: 24px;
          color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 600;
        }
        .lb-stage {
          max-width: 90vw; max-height: 76vh;
          display: flex; align-items: center; justify-content: center;
        }
        .lb-stage img {
          max-width: 90vw; max-height: 76vh; object-fit: contain;
          border-radius: 8px;
        }
        .lb-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
          width: 52px; height: 52px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.12); color: #fff; font-size: 30px; line-height: 1;
          cursor: pointer;
        }
        .lb-arrow:hover { background: rgba(255,255,255,0.22); }
        .lb-arrow.left { left: 20px; }
        .lb-arrow.right { right: 20px; }
        .lb-thumbs {
          position: absolute; bottom: 20px; left: 0; right: 0;
          display: flex; gap: 8px; justify-content: center; padding: 0 20px;
          overflow-x: auto;
        }
        .lb-thumb {
          width: 64px; height: 46px; border-radius: 6px; overflow: hidden;
          border: 2px solid transparent; padding: 0; cursor: pointer; flex-shrink: 0;
          opacity: 0.5; transition: opacity .15s, border-color .15s; background: none;
        }
        .lb-thumb.on { opacity: 1; border-color: #fff; }
        .lb-thumb img { width: 100%; height: 100%; object-fit: cover; }
        @media (max-width: 560px) {
          .lb-arrow { width: 42px; height: 42px; font-size: 24px; }
          .lb-arrow.left { left: 8px; }
          .lb-arrow.right { right: 8px; }
          .lb-thumbs { display: none; }
          .lb-stage img { max-height: 70vh; }
        }
      `}</style>
    </div>
  );
}
