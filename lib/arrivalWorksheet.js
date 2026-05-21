// =============================================================================
// Nzzor — Hotel Arrival Worksheet (printable)
// Opens a clean, paper-friendly view of the booking in a new tab and triggers
// the browser print dialog. Designed for hotel reception desks — operational,
// not branded marketing. Black-and-white friendly, large legible fields,
// checkbox space for the receptionist to tick things off at check-in.
// =============================================================================

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function fmtPrice(n) {
  if (n === undefined || n === null) return "—";
  return `${Number(n).toLocaleString()} DZD`;
}

export function printArrivalWorksheet(b) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to print the worksheet.");
    return;
  }

  const guestName = `${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim() || "—";
  const rooms = (b.rooms || []).map((r) => `${r.type} × ${r.quantity}`).join(", ");
  const notes = b.specialRequests || "";

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Arrival worksheet — ${b.reference}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 28px; color: #000; background: #fff; }
  .ws { max-width: 720px; margin: 0 auto; }
  .ws-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 20px; }
  .ws-brand { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .ws-brand strong { display: block; font-size: 24px; letter-spacing: -0.01em; text-transform: none; margin-top: 2px; }
  .ws-ref { text-align: right; }
  .ws-ref-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #555; }
  .ws-ref-code { font-size: 26px; font-weight: 800; letter-spacing: 0.04em; margin-top: 4px; }
  .ws-status { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 980px; background: #000; color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; }
  h2 { font-size: 26px; font-weight: 700; margin: 0 0 4px; }
  .lead { color: #555; margin: 0 0 22px; font-size: 13px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 22px; }
  .block { border: 1.5px solid #000; padding: 14px 16px; border-radius: 4px; }
  .block h3 { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 13.5px; border-bottom: 1px dashed #ccc; }
  .row:last-child { border-bottom: none; }
  .row span { color: #555; }
  .row strong { font-weight: 700; text-align: right; }
  .notes { border: 1.5px solid #000; padding: 14px 16px; border-radius: 4px; margin-bottom: 22px; min-height: 70px; }
  .notes h3 { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px; }
  .notes p { margin: 0; font-size: 13.5px; line-height: 1.6; }
  .check { border: 1.5px solid #000; padding: 14px 16px; border-radius: 4px; }
  .check h3 { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px; }
  .check ul { list-style: none; margin: 0; padding: 0; columns: 2; gap: 16px; }
  .check li { padding: 4px 0; font-size: 13px; break-inside: avoid; }
  .check li::before { content: "☐"; font-size: 16px; margin-right: 8px; vertical-align: -1px; }
  .foot { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 11px; color: #555; line-height: 1.55; }
  .actions { text-align: center; margin: 22px auto 0; }
  .actions button { background: #000; color: #fff; border: none; padding: 12px 24px; border-radius: 980px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
  @media print {
    body { padding: 14px; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="ws">
    <div class="ws-head">
      <div class="ws-brand">
        Nzzor
        <strong>${b.hotel?.name || ""}</strong>
      </div>
      <div class="ws-ref">
        <div class="ws-ref-label">Booking Reference</div>
        <div class="ws-ref-code">${b.reference || ""}</div>
        <span class="ws-status">${b.status || ""}</span>
      </div>
    </div>

    <h2>Arrival worksheet</h2>
    <p class="lead">For hotel reception use — Allouni-confirmed booking.</p>

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

    <div class="block" style="margin-bottom: 22px;">
      <h3>Payment</h3>
      <div class="row"><span>Total</span><strong>${fmtPrice(b.pricing?.total)}</strong></div>
      <div class="row"><span>Method</span><strong>${b.payment?.method || "—"}</strong></div>
      <div class="row"><span>Payment status</span><strong>${b.payment?.status || "—"}</strong></div>
    </div>

    <div class="notes">
      <h3>Special requests</h3>
      <p>${notes || "<em style='color:#888;'>No special requests.</em>"}</p>
    </div>

    <div class="check">
      <h3>At check-in</h3>
      <ul>
        <li>Verify guest ID</li>
        <li>Confirm phone number</li>
        <li>Assign room key</li>
        <li>Note arrival time</li>
        <li>Cover any payment due at hotel</li>
        <li>Address special requests above</li>
      </ul>
    </div>

    <div class="foot">
      Booking received via Nzzor — operated by Allouni Travel Agency, licensed by the Algerian Ministry of Tourism.
      For any issues with this booking, contact Allouni on WhatsApp +213 555 000 000.
    </div>
  </div>

  <div class="actions">
    <button onclick="window.print()">Print this worksheet</button>
  </div>

  <script>
    setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`);
  win.document.close();
}
