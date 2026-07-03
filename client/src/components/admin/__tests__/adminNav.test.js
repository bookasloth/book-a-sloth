// client/src/components/admin/__tests__/adminNav.test.js
import { describe, it, expect } from 'vitest';
import { NAV, ROADMAP, PATH_LABELS, flattenDestinations, sessionCan } from '../adminNav';

const SUPER = { permissions: ['*'] };

describe('adminNav', () => {
  it('roadmap groups are all inactive (comingSoon, no `to` anywhere)', () => {
    expect(ROADMAP.length).toBeGreaterThan(0);
    ROADMAP.forEach(sec => sec.items.forEach(item => {
      expect(item.comingSoon).toBe(true);
      expect(item.to).toBeUndefined();
      (item.children || []).forEach(ch => expect(ch.to).toBeUndefined());
    }));
  });

  it('flattenDestinations returns only active, navigable destinations', () => {
    const dests = flattenDestinations(NAV, SUPER);
    expect(dests.length).toBeGreaterThan(0);
    dests.forEach(d => {
      expect(typeof d.to).toBe('string');
      expect(d.to.length).toBeGreaterThan(0);
      expect(d.section).toBeTruthy();
    });
    // No disabled / coming-soon labels leak in
    expect(dests.find(d => d.label === 'Coupons')).toBeUndefined();
    expect(dests.find(d => /CRM/.test(d.label))).toBeUndefined();
  });

  it('flattenDestinations honours permissions', () => {
    const limited = { permissions: ['bookings.view'] };
    const dests = flattenDestinations(NAV, limited);
    expect(dests.every(d => d.section)).toBe(true);
    expect(dests.find(d => d.to === '/admin/users')).toBeUndefined();
    expect(dests.find(d => d.to === '/admin/bookings')).toBeTruthy();
  });

  it('sessionCan: wildcard passes, missing perm fails', () => {
    expect(sessionCan({ permissions: ['*'] }, 'anything')).toBe(true);
    expect(sessionCan({ permissions: ['x'] }, 'y')).toBe(false);
    expect(sessionCan({ permissions: ['x'] }, null)).toBe(true);
  });

  it('no duplicate destinations across NAV', () => {
    const tos = [];
    NAV.forEach(sec => sec.items.forEach(item => {
      if (item.to) tos.push(item.to);
      (item.children || []).forEach(ch => { if (ch.to) tos.push(ch.to); });
    }));
    const dupes = tos.filter((t, i) => tos.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it('every NAV path segment has a PATH_LABELS entry', () => {
    const segs = new Set();
    NAV.forEach(sec => sec.items.forEach(item => {
      [item.to, ...(item.children || []).map(c => c.to)]
        .filter(Boolean)
        .forEach(p => p.split('/').filter(Boolean).forEach(s => segs.add(s)));
    }));
    [...segs].forEach(s => {
      expect(PATH_LABELS[s], `missing PATH_LABELS entry for segment "${s}"`).toBeDefined();
    });
  });

  it('roadmap is a single collapsed coming-soon group', () => {
    expect(ROADMAP).toHaveLength(1);
    expect(ROADMAP[0].items).toHaveLength(1);
    expect(ROADMAP[0].items[0].comingSoon).toBe(true);
    expect(ROADMAP[0].items[0].children.length).toBeGreaterThanOrEqual(7);
  });

  it('sidebar is slimmed to Important + Department (no Main Dashboard section)', () => {
    expect(NAV.find(s => s.id === 'dashboard')).toBeUndefined();
    const sections = NAV.map(s => s.section);
    expect(sections).toEqual(['Important', 'DEPARTMENT']);
  });
});
