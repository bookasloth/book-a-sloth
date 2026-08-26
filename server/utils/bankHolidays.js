'use strict';
/**
 * bankHolidays.js — India bank (RBI) holidays = the days Razorpay does NOT settle to
 * a bank. We follow Razorpay's settlement schedule; this mirrors it so we can tell a
 * host when a holiday will push their payout out by a working day.
 *
 * National fixed-date holidays are listed with certainty; movable festival dates
 * (Holi, Eid, Diwali, Dussehra, …) shift each year — ADD them from the RBI holiday
 * calendar annually, or promote this to an admin-editable `bank_holidays` table.
 * Dates are YYYY-MM-DD in IST. Sundays are always non-settlement (handled in code).
 */

// date (YYYY-MM-DD, IST) -> display name
const BANK_HOLIDAYS = {
  '2026-10-02': 'Gandhi Jayanti',
  '2026-12-25': 'Christmas',
  '2027-01-26': 'Republic Day',
  '2027-08-15': 'Independence Day',
  '2027-10-02': 'Gandhi Jayanti',
  '2027-12-25': 'Christmas',
  // TODO(yearly): add movable festival bank holidays from the RBI calendar
  // (Holi, Eid-ul-Fitr, Eid-ul-Adha, Dussehra, Diwali, Guru Nanak Jayanti, etc.).
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// The IST calendar date for an epoch/Date, as { ymd:'YYYY-MM-DD', dow:0..6 } (0=Sun).
function istDate(now = Date.now()) {
  const d = new Date((typeof now === 'number' ? now : now.getTime()) + IST_OFFSET_MS);
  const ymd = d.toISOString().slice(0, 10);
  return { ymd, dow: d.getUTCDay() };
}

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dowOf = (ymd) => new Date(`${ymd}T00:00:00Z`).getUTCDay();

const isBankHoliday = (ymd) => Object.prototype.hasOwnProperty.call(BANK_HOLIDAYS, ymd);
const holidayName = (ymd) => BANK_HOLIDAYS[ymd] || null;
// Non-settlement = Sunday or a listed bank holiday. (Saturday nuance — RBI 2nd/4th
// Saturdays — omitted for MVP; add if needed.)
const isNonSettlementDay = (ymd) => dowOf(ymd) === 0 || isBankHoliday(ymd);

// First settlement day strictly after `ymd`.
function nextSettlementDay(ymd) {
  let d = addDays(ymd, 1);
  for (let i = 0; i < 15 && isNonSettlementDay(d); i++) d = addDays(d, 1);
  return d;
}

/**
 * The next WEEKDAY bank holiday within `windowDays` of `fromYmd` — i.e. a holiday
 * that adds delay beyond the normal weekend. Returns { date, name } or null.
 */
function upcomingDelayingHoliday(fromYmd, windowDays = 4) {
  for (let i = 1; i <= windowDays; i++) {
    const d = addDays(fromYmd, i);
    if (isBankHoliday(d) && dowOf(d) !== 0 && dowOf(d) !== 6) return { date: d, name: holidayName(d) };
  }
  return null;
}

module.exports = {
  BANK_HOLIDAYS, istDate, addDays, dowOf, isBankHoliday, holidayName,
  isNonSettlementDay, nextSettlementDay, upcomingDelayingHoliday,
};
