'use strict';
const { seller } = require('../config/sellerIdentity');
const { fiscalYearLabel } = require('./invoiceService');

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

function buildTaxInvoiceHTML(inv = {}) {
  const s = { ...seller, ...(inv.seller_snapshot || {}) };
  const isSub = inv.source_type === 'subscription';
  const itemDesc = isSub ? 'Book A Sloth — subscription plan'
    : inv.source_type === 'commission' ? 'Book A Sloth — platform commission'
    : 'Booking convenience / platform fee';
  const intra = Number(inv.igst) === 0 && (Number(inv.cgst) > 0 || Number(inv.sgst) > 0);
  const taxRows = intra
    ? `<div class="row"><span class="mut">CGST @ 9%</span><span>${inr(inv.cgst)}</span></div>
       <div class="row"><span class="mut">SGST @ 9%</span><span>${inr(inv.sgst)}</span></div>`
    : `<div class="row"><span class="mut">IGST @ 18%</span><span>${inr(inv.igst)}</span></div>`;
  const bookingNote = isSub ? ''
    : inv.source_type === 'commission'
      ? `<div class="note">This invoice covers Book A Sloth's platform commission for facilitating the host's booking.</div>`
      : `<div class="note">This invoice covers Book A Sloth's platform fee only. The booked service is supplied by the host, who invoices separately if GST-registered.</div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tax Invoice ${esc(inv.invoice_number)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
 :root{--ink:#1f2430;--mut:#7a828f;--faint:#9aa1ab;--line:#edeef1;--line2:#dfe2e7;
   --z-red:#e42527;--z-yellow:#f7b500;--z-green:#0a9d58;--z-blue:#2266b3}
 *{box-sizing:border-box} html,body{margin:0;background:#eceef1;font-family:'Poppins',sans-serif;color:var(--ink)}
 .page{width:210mm;min-height:297mm;margin:10px auto;background:#fff;display:flex;flex-direction:column;padding:16mm;font-size:10.5pt;line-height:1.5;box-shadow:0 1px 4px rgba(0,0,0,.1)}
 .body{flex:1 0 auto}
 .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px}
 .brand{display:flex;align-items:center;gap:11px}.brand img{width:42px;height:42px;object-fit:contain}
 .brand .co{font-weight:700;font-size:15pt}.brand .tag{font-size:8.5pt;color:var(--mut)}
 .title{text-align:right}.title .t{font-size:17pt;font-weight:700}
 .title .meta{margin-top:8px;font-size:9.5pt;display:grid;grid-template-columns:auto auto;gap:2px 14px;justify-content:end}
 .title .meta .k{color:var(--mut);text-align:right}.title .meta .v{font-weight:600;text-align:right}
 .rule{height:1px;background:var(--line2);margin:0 0 22px}
 .parties{display:flex;gap:34px;margin-bottom:26px}.party{flex:1}
 .party .lbl{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:7px;font-weight:600}
 .party .nm{font-weight:600}.party .mut{color:var(--mut);font-size:9.5pt}.party .gst{margin-top:5px;font-size:9.5pt}
 .amt{font-size:15pt;font-weight:700;margin:2px 0 4px}
 .pill{font-size:8pt;font-weight:700;color:#0a7c46;background:#e9f8ef;border:1px solid #b7e8cd;padding:3px 9px;border-radius:999px;margin-left:8px}
 .paymeta{font-size:9pt;color:var(--mut);margin-bottom:22px}
 table{width:100%;border-collapse:collapse;font-size:9.5pt}
 thead th{text-align:right;font-weight:600;color:var(--mut);font-size:8pt;text-transform:uppercase;padding:0 0 9px;border-bottom:1.5px solid var(--line2)}
 thead th.l{text-align:left} tbody td{padding:12px 0;vertical-align:top;text-align:right;border-bottom:1px solid var(--line)}
 tbody td.l{text-align:left}.desc .sub{color:var(--mut);font-size:8.5pt;margin-top:3px}
 .totals{margin:18px 0 0 auto;width:74mm;font-size:9.5pt}.totals .row{display:flex;justify-content:space-between;padding:6px 0}
 .totals .mut{color:var(--mut)}.totals .grand{border-top:2px solid var(--ink);margin-top:4px;padding-top:9px;font-weight:700;font-size:11.5pt}
 .note{font-size:8.5pt;color:var(--mut);margin-top:20px;padding:9px 12px;background:#f7f8fa;border-radius:6px}
 .foot{flex-shrink:0;margin-top:26px}.fbar{display:flex;height:5px;border-radius:3px;overflow:hidden;margin-bottom:12px}
 .fbar span{flex:1}.fbar .r{background:var(--z-red)}.fbar .y{background:var(--z-yellow)}.fbar .g{background:var(--z-green)}.fbar .b{background:var(--z-blue)}
 .fmeta{display:flex;justify-content:space-between;font-size:8pt;color:var(--faint);line-height:1.6}
 @page{size:A4;margin:0} @media print{html,body{background:#fff}.page{box-shadow:none;margin:0}}
</style></head>
<body><div class="page"><div class="body">
 <div class="head">
   <div class="brand"><img src="${esc(s.logoUrl || seller.logoUrl)}" alt="Book A Sloth">
     <div><div class="co">Book A Sloth</div><div class="tag">${esc(seller.brandSubline)}</div></div></div>
   <div class="title"><div class="t">TAX INVOICE</div>
     <div class="meta">
       <div class="k">Invoice #</div><div class="v">${esc(inv.invoice_number)}</div>
       <div class="k">Date</div><div class="v">${esc(fmtDate(inv.issued_at))}</div>
       <div class="k">${esc(fiscalYearLabel(inv.issued_at))}</div><div class="v">Place: ${esc(inv.place_of_supply)}</div>
       <div class="k">Reverse charge</div><div class="v">No</div>
     </div></div>
 </div>
 <div class="rule"></div>
 <div class="parties">
   <div class="party"><div class="lbl">From</div>
     <div class="nm">${esc(s.legalName)}</div>
     <div class="mut">${esc(s.address)}</div>
     <div class="gst">GSTIN <b>${esc(s.gstin)}</b></div>
     <div class="mut">PAN ${esc(s.pan)} · CIN ${esc(s.cin)}</div>
     <div class="mut">${esc(s.email)} · ${esc(s.phone)}</div></div>
   <div class="party"><div class="lbl">Bill to</div>
     <div class="nm">${esc(inv.buyer_name)}</div>
     ${inv.buyer_address ? `<div class="mut">${esc(inv.buyer_address)}</div>` : ''}
     ${inv.buyer_gstin ? `<div class="gst">GSTIN <b>${esc(inv.buyer_gstin)}</b></div>` : `<div class="mut" style="margin-top:5px">Unregistered (B2C)</div>`}
   </div>
 </div>
 <div class="amt">${inr(inv.total)}<span class="pill">PAID</span></div>
 <div class="paymeta">Paid ${esc(fmtDate(inv.issued_at))} · Razorpay${inv.payment_id ? ` · ${esc(inv.payment_id)}` : ''}</div>
 <table><thead><tr><th class="l">Description</th><th>SAC</th><th>Qty</th><th>Unit price</th><th>Tax</th><th>Amount</th></tr></thead>
   <tbody><tr><td class="l desc">${esc(itemDesc)}</td><td>${esc(inv.sac_code)}</td><td>1</td><td>${inr(inv.taxable_value)}</td><td>18%</td><td>${inr(inv.taxable_value)}</td></tr></tbody></table>
 <div class="totals">
   <div class="row"><span class="mut">Subtotal (taxable value)</span><span>${inr(inv.taxable_value)}</span></div>
   ${taxRows}
   <div class="row grand"><span>Total</span><span>${inr(inv.total)}</span></div>
   <div class="row"><span class="mut">Amount paid</span><span>${inr(inv.total)}</span></div>
 </div>
 ${bookingNote}
 </div>
 <div class="foot"><div class="fbar"><span class="r"></span><span class="y"></span><span class="g"></span><span class="b"></span></div>
   <div class="fmeta"><div>Computer-generated tax invoice — no signature required. Issued by <b>${esc(s.legalName)}</b> for the Book A Sloth platform.</div>
   <div style="text-align:right">${esc(s.website)} · bookasloth.com</div></div></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print&&window.print()},350)}</script>
</body></html>`;
}

module.exports = { buildTaxInvoiceHTML };
