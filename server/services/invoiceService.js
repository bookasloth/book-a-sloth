'use strict';
const { round2 } = require('../lib/pricingEngine');
const { seller, SAC_SUBSCRIPTION, SAC_BOOKING, SAC_COMMISSION, SERIES } = require('../config/sellerIdentity');

// Indian FY (Apr–Mar). 2-digit START year for the invoice serial (Jun 2026 -> '26').
function fiscalYearFor(date = new Date()) {
  const d = new Date(date);
  const startYear = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return String(startYear % 100).padStart(2, '0');
}
function fiscalYearLabel(date = new Date()) {
  const d = new Date(date);
  const start = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
function isValidGstin(g) { return typeof g === 'string' && GSTIN_RE.test(g.trim().toUpperCase()); }
function stateCodeFromGstin(g) { return isValidGstin(g) ? g.trim().slice(0, 2) : null; }

// Place of supply state code: buyer GSTIN wins, else selected state, else seller.
function placeOfSupply({ gstin, stateCode } = {}) {
  return stateCodeFromGstin(gstin) || (stateCode ? String(stateCode) : seller.stateCode);
}

// Split the ALREADY-CHARGED gst amount (never recompute from a rate). Intra-state
// -> CGST+SGST (sums exactly to gstAmount); inter-state -> IGST.
function computeTaxSplit(gstAmount, posStateCode, sellerStateCode = seller.stateCode) {
  const g = round2(gstAmount);
  if (String(posStateCode) === String(sellerStateCode)) {
    const cgst = round2(g / 2);
    return { cgst, sgst: round2(g - cgst), igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: g };
}

const SAC_FOR = { subscription: SAC_SUBSCRIPTION, booking: SAC_BOOKING, commission: SAC_COMMISSION };

// Idempotent invoice minting. Best-effort: returns null (never throws) so a
// captured payment is never failed by an invoicing problem. The create_invoice
// RPC guarantees gap-free serials and one row per (sourceType, sourceId).
async function generateInvoice({ sourceType, sourceId, paymentId = null, issuedAt, buyer, taxableValue, gstAmount }) {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const series = SERIES[sourceType];
    if (!series) throw new Error(`unknown sourceType ${sourceType}`);
    const when = issuedAt ? new Date(issuedAt) : new Date();
    const pos = placeOfSupply(buyer || {});
    const { cgst, sgst, igst } = computeTaxSplit(gstAmount, pos);
    const total = round2(round2(taxableValue) + round2(gstAmount));

    const { data, error } = await supabaseAdmin.rpc('create_invoice', {
      p_series: series.code,
      p_number_prefix: series.prefix,
      p_fiscal_year: fiscalYearFor(when),
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_payment_id: paymentId,
      p_buyer_name: buyer?.name || 'Customer',
      p_buyer_address: buyer?.address || null,
      p_buyer_state: buyer?.stateName || null,
      p_buyer_state_code: pos,
      p_buyer_gstin: buyer?.gstin || null,
      p_buyer_pan: buyer?.pan || null,
      p_seller_snapshot: seller,
      p_taxable_value: round2(taxableValue),
      p_cgst: cgst, p_sgst: sgst, p_igst: igst, p_total: total,
      p_place_of_supply: pos,
      p_sac_code: SAC_FOR[sourceType],
    });
    if (error) { console.error('generateInvoice RPC error (non-fatal):', error.message); return null; }
    return data;
  } catch (e) {
    console.error('generateInvoice failed (non-fatal):', e.message);
    return null;
  }
}

module.exports = {
  fiscalYearFor, fiscalYearLabel, isValidGstin, stateCodeFromGstin,
  placeOfSupply, computeTaxSplit, generateInvoice,
};
