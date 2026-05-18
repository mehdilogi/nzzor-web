"use client";

import Icon from "./Icon";

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP || "213XXXXXXXXX";
  return (
    <a
      className="nz-wa"
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="nz-wa-icon">
        <svg viewBox="0 0 24 24" width={27} height={27} fill="#fff" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.6-1.4-3.6-3.1-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-1 2.6 0 1.5 1.1 3 1.2 3.2.1.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.7.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.6 15l-1.3 4.7L7 20.4A10 10 0 1012 2" />
        </svg>
      </span>
      <span className="nz-wa-label">Chat with us</span>
      <style jsx>{`
        .nz-wa {
          position: fixed; bottom: 26px; right: 26px; z-index: 200;
          display: flex; align-items: center; height: 56px;
          background: #25D366; border-radius: 980px; overflow: hidden;
          box-shadow: 0 12px 32px rgba(37,211,102,0.4);
          transition: padding-right .35s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-wa:hover { padding-right: 22px; }
        .nz-wa-icon {
          width: 56px; height: 56px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .nz-wa-label {
          font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap;
          max-width: 0; opacity: 0; transition: all .35s cubic-bezier(0.16,1,0.3,1);
        }
        .nz-wa:hover .nz-wa-label { max-width: 160px; opacity: 1; margin-right: 4px; }
        @media (max-width: 1080px) {
          .nz-wa { bottom: 84px; right: 16px; }
        }
        @media (max-width: 560px) {
          .nz-wa { width: 52px; height: 52px; }
          .nz-wa-icon { width: 52px; height: 52px; }
        }
      `}</style>
    </a>
  );
}
