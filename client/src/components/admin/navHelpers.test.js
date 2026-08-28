import { describe, it, expect } from 'vitest';
import {
  itemActive, activeSection, itemBadge, sectionBadgeCount, formatBadge, visibleSections,
} from './navHelpers';

// Minimal NAV fixture exercising the tricky cases: an exact index route that is
// a prefix of its siblings, and a deep item under the same section.
const NAV = [
  { key: 'overview', label: 'Overview', items: [
    { label: 'Dashboard', to: '/super-dashboard', exact: true, perm: 'ops.view' },
    { label: 'Revenue',   to: '/super-dashboard/revenue', perm: 'analytics.view' },
  ]},
  { key: 'revenue', label: 'Revenue', items: [
    { label: 'Finance', to: '/admin/finance', exact: true, perm: 'finance.view' },
    { label: 'Ledger',  to: '/admin/finance/ledger', perm: 'finance.view' },
    { label: 'Payouts', to: '/admin/finance/payouts', perm: 'payouts.view', badge: 'pending_payouts' },
  ]},
];

describe('itemActive', () => {
  it('exact item matches only the exact path', () => {
    expect(itemActive('/admin/finance', { to: '/admin/finance', exact: true })).toBe(true);
    expect(itemActive('/admin/finance/ledger', { to: '/admin/finance', exact: true })).toBe(false);
  });
  it('prefix item matches the path and its sub-paths', () => {
    expect(itemActive('/admin/bookings', { to: '/admin/bookings' })).toBe(true);
    expect(itemActive('/admin/bookings/abandoned', { to: '/admin/bookings' })).toBe(true);
  });
  it('does not treat a sibling with a shared string prefix as a sub-path', () => {
    // /admin/finance-x must NOT match /admin/finance (guarded by the "/" separator).
    expect(itemActive('/admin/finance-x', { to: '/admin/finance' })).toBe(false);
  });
  it('handles missing item/to', () => {
    expect(itemActive('/x', null)).toBe(false);
    expect(itemActive('/x', { label: 'no-to' })).toBe(false);
  });
});

describe('activeSection', () => {
  it('resolves an exact root route to its section', () => {
    expect(activeSection('/admin/finance', NAV).key).toBe('revenue');
  });
  it('longest prefix wins over a shorter sibling index', () => {
    // /admin/finance/ledger matches both "/admin/finance" and "/admin/finance/ledger"
    expect(activeSection('/admin/finance/ledger', NAV).key).toBe('revenue');
  });
  it('resolves a sub-path (query-less) under the deep item', () => {
    expect(activeSection('/admin/finance/payouts', NAV).key).toBe('revenue');
  });
  it('resolves overview tabs', () => {
    expect(activeSection('/super-dashboard', NAV).key).toBe('overview');
    expect(activeSection('/super-dashboard/revenue', NAV).key).toBe('overview');
  });
  it('returns null for an unknown route', () => {
    expect(activeSection('/nowhere', NAV)).toBe(null);
  });
});

describe('itemBadge / sectionBadgeCount / formatBadge', () => {
  const counts = { pending_payouts: 3, pending_reviews: 0 };
  it('reads a live count, 0 when unset or zero', () => {
    expect(itemBadge({ badge: 'pending_payouts' }, counts)).toBe(3);
    expect(itemBadge({ badge: 'pending_reviews' }, counts)).toBe(0);
    expect(itemBadge({ badge: 'missing' }, counts)).toBe(0);
    expect(itemBadge({ /* no badge */ }, counts)).toBe(0);
  });
  it('sums a section, ignoring unbadged items', () => {
    expect(sectionBadgeCount(NAV[1], counts)).toBe(3); // only Payouts carries a badge
    expect(sectionBadgeCount(NAV[0], counts)).toBe(0);
    expect(sectionBadgeCount(null, counts)).toBe(0);
  });
  it('handles a missing counts map', () => {
    expect(sectionBadgeCount(NAV[1], undefined)).toBe(0);
  });
  it('formats overflow', () => {
    expect(formatBadge(0)).toBe('0');
    expect(formatBadge(99)).toBe('99');
    expect(formatBadge(100)).toBe('99+');
    expect(formatBadge(4210)).toBe('99+');
  });
});

describe('visibleSections', () => {
  it('keeps only items the session may see, drops empty sections', () => {
    const session = { permissions: ['finance.view'] }; // no payouts.view, no ops/analytics
    const vis = visibleSections(NAV, session);
    expect(vis.map(s => s.key)).toEqual(['revenue']); // overview items all gated out
    expect(vis[0].items.map(i => i.label)).toEqual(['Finance', 'Ledger']); // Payouts gated out
  });
  it('wildcard sees everything', () => {
    const vis = visibleSections(NAV, { permissions: ['*'] });
    expect(vis.map(s => s.key)).toEqual(['overview', 'revenue']);
    expect(vis[1].items).toHaveLength(3);
  });
  it('no session sees nothing', () => {
    expect(visibleSections(NAV, null)).toEqual([]);
  });
});
