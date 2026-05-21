// =============================================================================
// Nzzor — Booking Voucher
// Opens a new window with a clean print-ready voucher the user can save as
// PDF via the browser's print dialog. No server-side PDF library required.
// Real generated PDFs come later as a server-side feature.
// =============================================================================

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtPrice(n) {
  if (n === undefined || n === null) return "—";
  return `${Number(n).toLocaleString()} DZD`;
}

export function openVoucher(b) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to download the voucher.");
    return;
  }
  const guestName = `${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim() || "—";
  const rooms = (b.rooms || []).map((r) => `${r.type} × ${r.quantity}`).join(", ");

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Nzzor voucher — ${b.reference}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px 30px; background: #f7f5f0; color: #16161A; }
  .v { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 44px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
  .top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #eee; margin-bottom: 28px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .dot { width: 26px; height: 26px; border-radius: 50%; background: #E63946; }
  .brand-name { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }
  .brand-sub { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-top: 3px; }
  .label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .ref { text-align: right; }
  .ref-code { font-size: 24px; font-weight: 800; letter-spacing: 0.04em; color: #16161A; }
  .status { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 980px; background: #E7F4EC; color: #1B8A5A; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; }
  h2 { font-size: 30px; font-weight: 600; letter-spacing: -0.025em; margin: 0 0 6px; line-height: 1.15; }
  .lead { font-size: 14px; color: #666; margin: 0 0 30px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; margin-bottom: 28px; }
  .block h3 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 10px; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed #eee; font-size: 13.5px; }
  .row:last-child { border-bottom: none; }
  .row span { color: #888; }
  .row strong { color: #16161A; font-weight: 700; text-align: right; }
  .total { display: flex; justify-content: space-between; align-items: baseline; padding: 18px 0; border-top: 2px solid #16161A; margin-top: 8px; }
  .total span { font-size: 14px; font-weight: 700; }
  .total strong { font-size: 26px; font-weight: 800; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; line-height: 1.55; text-align: center; }
  .footer p { margin: 4px 0; }
  .footer .present { color: #16161A; font-weight: 600; font-size: 13px; margin-bottom: 6px; }
  .actions { text-align: center; margin: 28px auto 0; max-width: 760px; }
  .actions button { background: #16161A; color: #fff; border: none; padding: 14px 28px; border-radius: 980px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .actions button:hover { background: #E63946; }
  @media print {
    body { background: #fff; padding: 0; }
    .v { box-shadow: none; border-radius: 0; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="v">
    <div class="top">
      <div class="brand">
        <div class="dot"></div>
        <div>
          <div class="brand-name">Nzzor</div>
          <div class="brand-sub">Booking Voucher</div>
        </div>
      </div>
      <div class="ref">
        <div class="label">Reference</div>
        <div class="ref-code">${b.reference || ""}</div>
        <div class="status">${b.status || ""}</div>
      </div>
    </div>

    <h2>${b.hotel?.name || ""}</h2>
    <p class="lead">${b.hotel?.city || ""}</p>

    <div class="grid">
      <div class="block">
        <h3>Stay</h3>
        <div class="row"><span>Check-in</span><strong>${fmtDate(b.checkIn)}</strong></div>
        <div class="row"><span>Check-out</span><strong>${fmtDate(b.checkOut)}</strong></div>
        <div class="row"><span>Nights</span><strong>${b.nights || ""}</strong></div>
        <div class="row"><span>Rooms</span><strong>${rooms}</strong></div>
      </div>
      <div class="block">
        <h3>Guest</h3>
        <div class="row"><span>Name</span><strong>${guestName}</strong></div>
        <div class="row"><span>Email</span><strong>${b.guest?.email || "—"}</strong></div>
        <div class="row"><span>Phone</span><strong>${b.guest?.phone || "—"}</strong></div>
      </div>
    </div>

    <div class="block">
      <h3>Pricing</h3>
      <div class="row"><span>Subtotal</span><strong>${fmtPrice(b.pricing?.subtotal)}</strong></div>
      ${b.pricing?.discount > 0 ? `<div class="row"><span>Discount</span><strong>− ${fmtPrice(b.pricing.discount)}</strong></div>` : ""}
      <div class="row"><span>Taxes &amp; fees</span><strong>Included</strong></div>
      <div class="total"><span>Total</span><strong>${fmtPrice(b.pricing?.total)}</strong></div>
    </div>

    ${b.specialRequests ? `<div class="block"><h3>Special requests</h3><p style="font-size:13.5px; color:#444; line-height:1.5; margin:0;">${b.specialRequests}</p></div>` : ""}

    <div class="footer">
      <p class="present">Please present this voucher at check-in.</p>
      <p>Operated by Allouni Travel Agency — licensed by the Algerian Ministry of Tourism.</p>
      <p>For assistance: contact Allouni on WhatsApp +213 555 000 000.</p>
    </div>
  </div>

  <div class="actions">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <script>
    // auto-open print dialog after a short delay so the user sees the voucher first
    setTimeout(() => window.print(), 600);
  </script>
</body>
</html>`);
  win.document.close();
}
