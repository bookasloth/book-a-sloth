import { FAQ, FEATURE_CATEGORIES, INDUSTRIES, DEPLOYMENTS } from '../pages/enterprise/enterpriseData';

describe('enterpriseData', () => {
  it('has at least 20 FAQ with non-empty answers', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(20);
    FAQ.forEach(f => { expect(f.q.length).toBeGreaterThan(0); expect(f.a.length).toBeGreaterThan(20); });
  });
  it('has 6 feature categories with items', () => {
    expect(FEATURE_CATEGORIES).toHaveLength(6);
    FEATURE_CATEGORIES.forEach(c => expect(c.items.length).toBeGreaterThan(0));
  });
  it('has 8 industries with challenge + solution', () => {
    expect(INDUSTRIES).toHaveLength(8);
    INDUSTRIES.forEach(i => { expect(i.challenge).toBeTruthy(); expect(i.solution).toBeTruthy(); });
  });
  it('marks on-premise as coming soon', () => {
    expect(DEPLOYMENTS.find(d => d.name === 'On-premise').badge).toBe('Coming Soon');
  });
  it('uses no banned marketing words', () => {
    const banned = /\b(amazing|revolutionary|magic|ultimate)\b/i;
    const all = JSON.stringify(FAQ) + JSON.stringify(FEATURE_CATEGORIES) + JSON.stringify(INDUSTRIES);
    expect(banned.test(all)).toBe(false);
  });
});
