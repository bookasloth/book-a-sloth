'use strict';
const { round2 } = require('../lib/pricingEngine');
const { seller } = require('../config/sellerIdentity');

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

module.exports = {
  fiscalYearFor, fiscalYearLabel, isValidGstin, stateCodeFromGstin,
  placeOfSupply, computeTaxSplit,
};
