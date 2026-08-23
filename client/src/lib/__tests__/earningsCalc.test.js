import { describe, it, expect } from 'vitest';
import {
  ANNUAL_FEE, HOSTPLUS_ANNUAL_CAP, annualBookings, resultsFor,
  pickWinner, annualSaving, ceilingState, starterCommissionPerYear,
} from '../earningsCalc';

describe('earningsCalc', () => {
  it('annual fees come from plans.js (Host+ 1499, Studio 3650)', () => {
    expect(ANNUAL_FEE.hostplus).toBe(1499);
    expect(ANNUAL_FEE.studio).toBe(3650);
    expect(ANNUAL_FEE.starter).toBe(0);
  });

  it('annualBookings floors then x12', () => {
    expect(annualBookings(10)).toBe(120);
    expect(annualBookings(10.9)).toBe(120);
  });

  it('annual net = per-booking take-home x annual volume minus annual fee', () => {
    // Host+ at E=1000: per-booking take-home = 970.20 (morPricing drift test)
    const r = resultsFor(1000, 10, 'annual').find((x) => x.plan.key === 'hostplus');
    expect(r.perBookingTakeHome).toBe(970.2);
    expect(r.grossAnnual).toBe(970.2 * 120);
    expect(r.netAnnual).toBe(970.2 * 120 - 1499);
    expect(r.fee).toBe(1499);
  });

  it('monthly cycle subtracts monthly*12 as the fee', () => {
    const r = resultsFor(1000, 10, 'monthly').find((x) => x.plan.key === 'hostplus');
    expect(r.fee).toBe(229 * 12);
  });

  it('winner is highest net take-home among non-capped (Host+ beats Studio, same per-booking)', () => {
    const results = resultsFor(1000, 10, 'annual');
    expect(pickWinner(results)).toBe('hostplus');
  });

  it('Starter is capped and excluded from winner above 5000/session', () => {
    const results = resultsFor(6000, 10, 'annual');
    const starter = results.find((x) => x.plan.key === 'starter');
    expect(starter.capped).toBe(true);
    expect(pickWinner(results)).not.toBe('starter');
  });

  it('Host+ outgrows when annual bookings exceed 1000; ceiling over', () => {
    const results = resultsFor(1000, 90, 'annual'); // 1080/yr
    const hp = results.find((x) => x.plan.key === 'hostplus');
    expect(hp.outgrows).toBe(true);
    expect(ceilingState(90)).toBe('over');
    expect(ceilingState(75)).toBe('near'); // 900/yr, within 840..1000
    expect(ceilingState(10)).toBe('none');
    expect(HOSTPLUS_ANNUAL_CAP).toBe(1000);
    expect(pickWinner(resultsFor(1000, 90, 'annual'))).toBe('studio');
  });

  it('Starter outgrows above its 300/yr booking cap; Host+ wins mid volume', () => {
    const results = resultsFor(100, 30, 'annual'); // 360/yr
    const starter = results.find((x) => x.plan.key === 'starter');
    expect(starter.outgrows).toBe(true);
    expect(pickWinner(results)).toBe('hostplus');
  });

  it('annual saving = monthly*12 - annual fee', () => {
    expect(annualSaving('hostplus')).toBe(229 * 12 - 1499); // 1249
    expect(annualSaving('studio')).toBe(555 * 12 - 3650);   // 3010
    expect(annualSaving('starter')).toBe(0);
  });

  it('starter commission per year = 5% x price x annual bookings', () => {
    expect(starterCommissionPerYear(1000, 10)).toBe(0.05 * 1000 * 120); // 6000
  });
});
