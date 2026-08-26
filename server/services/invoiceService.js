'use strict';
const { round2 } = require('../lib/pricingEngine');
const { seller, SAC_SUBSCRIPTION, SAC_BOOKING, SAC_COMMISSION, SERIES } = require('../config/sellerIdentity');
const stateService = require('./stateService');

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

// GSTIN + state helpers now live in the single-source stateService; re-exported
// here so existing callers/tests keep their import path.
const { isValidGstin, stateCodeFromGstin, GSTIN_RE } = stateService;

// Place of supply state code. Precedence (stateService.resolvePlaceOfSupply):
//   valid GSTIN's state → explicit stateCode → typed state NAME → seller (Odisha).
// Routing through stateService is what lets a customer who typed "Maharashtra"
// (name only, no code — the booking-flow gap) resolve to POS 27 instead of
// silently defaulting to the seller state. When NOTHING is on record we fall
// back to the seller state — the lawful supplier-location default (Sec 12(2)(b)(ii)).
function placeOfSupply({ gstin, stateCode, state, stateName } = {}) {
  const resolved = stateService.resolvePlaceOfSupply({ gstin, stateCode, state: state || stateName });
  return resolved ? resolved.code : seller.stateCode;
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
