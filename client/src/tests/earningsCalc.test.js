import { describe, it, expect } from 'vitest';
import { resultsFor, pickWinner, deltaVsFree, hostplusCrossover } from '../lib/earningsCalc';

// Pure-math contract for the recommendation-first verdict block. Numbers are the
// published /host-fees figures the calculator renders at the default persona.
describe('earningsCalc — verdict helpers', () => {
  it('deltaVsFree: Host+ keeps ₹9,301 more/year than free at ₹1,500 × 12/mo', () => {
    const results = resultsFor(1500, 12, 'annual');
    const winner = pickWinner(results);
    expect(winner).toBe('hostplus');
    expect(deltaVsFree(results, winner)).toBe(9301);
  });

  it('deltaVsFree: 0 when free Starter is itself the winner (low volume)', () => {
    const results = resultsFor(300, 1, 'annual');
    expect(pickWinner(results)).toBe('starter');
    expect(deltaVsFree(results, 'starter')).toBe(0);
  });

  it('hostplusCrossover: ₹1,500 sessions pay off Host+ past ~2/mo', () => {
    expect(hostplusCrossover(1500)).toBe(2);
  });

  it('hostplusCrossover: cheap ₹300 sessions need ~9/mo to justify Host+', () => {
    expect(hostplusCrossover(300)).toBe(9);
  });

  it('hostplusCrossover: a ₹0 price never justifies paying', () => {
    expect(hostplusCrossover(0)).toBe(Infinity);
  });
});
