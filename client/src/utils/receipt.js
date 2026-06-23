// Shared, dependency-free receipt / invoice generator.
// Used by the booking confirmation screen (ServiceBooking) and My Bookings
// (CustomerBookings) so there is a single source of truth for what a receipt
// looks like. `buildReceiptHTML` is a pure function (unit-tested); the document
// auto-prints on open, so "download" doubles as Save-as-PDF.

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Build a printable receipt as an HTML string.
 * @param {object} d - normalized receipt data:
 *   receiptId, whenText, serviceTitle, hostName, guestName, guestEmail,
 *   status, paymentStatus ('paid'|'unpaid'|'refunded'), paymentId,
 *   price, platformFee, platformFeeGst, total
 */
export function buildReceiptHTML(d = {}) {
  const {
    receiptId = "—",
    whenText = "",
    serviceTitle = "Service",
    hostName = "Host",
    guestName = "",
    guestEmail = "",
    status = "",
    paymentStatus = "",
    paymentId = "",
    price = 0,
    platformFee = 0,
    platformFeeGst = 0,
    total = 0,
  } = d;

  const isFree = Number(price) === 0;
  const isPaid = !isFree && paymentStatus === "paid";
  const docTitle = isPaid ? "Payment Receipt" : isFree ? "Booking Confirmation" : "Booking Invoice";

  let moneyRows;
  if (isPaid) {
    const grandTotal = Number(total) || Number(price);
    moneyRows =
      `<tr><td>${esc(serviceTitle)}</td><td>${inr(price)}</td></tr>` +
      (Number(platformFee) > 0 ? `<tr><td>Platform fee</td><td>${inr(platformFee)}</td></tr>` : "") +
      (Number(platformFeeGst) > 0 ? `<tr><td>GST</td><td>${inr(platformFeeGst)}</td></tr>` : "") +
      `<tr class="total"><td>Total paid</td><td>${inr(grandTotal)}</td></tr>`;
  } else {
    const amount = isFree
      ? "Free"
      : paymentStatus === "refunded"
        ? `${inr(price)} (refunded)`
        : "Unpaid";
    moneyRows = `<tr class="total"><td>Amount</td><td>${esc(amount)}</td></tr>`;
  }

  const metaRows = [
    `<tr><td>Receipt / Booking ID</td><td>${esc(receiptId)}</td></tr>`,
    whenText ? `<tr><td>Date</td><td>${esc(whenText)}</td></tr>` : "",
    `<tr><td>Service</td><td>${esc(serviceTitle)}</td></tr>`,
    `<tr><td>Host</td><td>${esc(hostName)}</td></tr>`,
    guestName ? `<tr><td>Customer</td><td>${esc(guestName)}</td></tr>` : "",
    guestEmail ? `<tr><td>Email</td><td>${esc(guestEmail)}</td></tr>` : "",
    paymentId ? `<tr><td>Payment ID</td><td>${esc(paymentId)}</td></tr>` : "",
    status ? `<tr><td>Status</td><td>${esc(status)}</td></tr>` : "",
  ].join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(docTitle)} ${esc(receiptId)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#1E1E1E;max-width:640px;margin:40px auto;padding:0 20px}
  h1{color:#FE5100;margin:0 0 2px;font-size:24px}
  .sub{color:#888;font-size:13px;margin:0 0 8px}
  h2{font-size:15px;margin:28px 0 4px}
  table{width:100%;border-collapse:collapse;margin:8px 0 4px}
  td{padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
  td:last-child{text-align:right;font-weight:600}
  .total td{border-top:2px solid #1E1E1E;border-bottom:none;font-size:16px;padding-top:12px}
  .foot{color:#888;font-size:12px;margin-top:28px}
</style></head><body>
<h1>Book A Sloth</h1>
<p class="sub">${esc(docTitle)}</p>
<table>${metaRows}</table>
<h2>${isPaid ? "Payment summary" : "Summary"}</h2>
<table>${moneyRows}</table>
<p class="foot">Thank you for booking with Book A Sloth. This is a system-generated ${isPaid ? "receipt" : "document"}.</p>
<script>window.onload=function(){window.print&&setTimeout(function(){window.print()},300)}</script>
</body></html>`;
}

/** Trigger a browser download of the receipt (opens print dialog on view). */
export function downloadReceipt(d = {}) {
  const html = buildReceiptHTML(d);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeId = String(d.receiptId || "booking").replace(/[^a-zA-Z0-9]/g, "");
  a.download = `receipt-${safeId}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
