// client/src/components/admin/__tests__/adminNav.test.js
import { describe, it, expect } from 'vitest';
import { NAV, IC, PATH_LABELS, flattenDestinations, flattenAllDestinations, sessionCan } from '../adminNav';

const SUPER = { permissions: ['*'] };

describe('adminNav', () => {
  it('has 9 or fewer priority-ordered sections, each with a shape the rail needs', () => {
    // Rail is full-height (fixed inset-y-0) with ~48px slots — 9 sections fit on
    // any lg viewport. Bumped from 8 when GST got its own top-level section.
    expect(NAV.length).toBeGreaterThan(0);
    expect(NAV.length).toBeLessThanOrEqual(9);
    NAV.forEach(sec => {
      expect(sec.key).toBeTruthy();
      expect(sec.label).toBeTruthy();
      expect(IC[sec.icon], `section "${sec.key}" icon "${sec.icon}" missing from IC`).toBeDefined();
      expect(sec.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(Array.isArray(sec.items)).toBe(true);
      expect(sec.items.length).toBeGreaterThan(0);
    });
  });

  it('section keys are unique', () => {
    const keys = NAV.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every item has a real IC icon and a permission string', () => {
    NAV.forEach(sec => sec.items.forEach(item => {
      expect(item.to).toMatch(/^\//);
      expect(IC[item.icon], `item "${item.label}" icon "${item.icon}" missing from IC`).toBeDefined();
      expect(typeof item.perm, `item "${item.label}" needs a perm`).toBe('string');
    }));
  });

  it('flattenDestinations returns permission-filtered, deduped destinations', () => {
    const dests = flattenDestinations(NAV, SUPER);
    expect(dests.length).toBeGreaterThan(0);
    dests.forEach(d => {
      expect(typeof d.to).toBe('string');
      expect(d.to.length).toBeGreaterThan(0);
      expect(d.section).toBeTruthy();
    });
    const tos = dests.map(d => d.to);
    expect(new Set(tos).size).toBe(tos.length); // deduped
  });

  it('flattenAllDestinations is the back-compat alias', () => {
    expect(flattenAllDestinations).toBe(flattenDestinations);
  });

  it('flattenDestinations honours permissions', () => {
    const limited = { permissions: ['bookings.view'] };
    const dests = flattenDestinations(NAV, limited);
    expect(dests.find(d => d.to === '/admin/bookings')).toBeTruthy();
    expect(dests.find(d => d.to === '/admin/settings')).toBeUndefined();
  });

  it('sessionCan: wildcard passes, missing perm fails, empty perm allows', () => {
    expect(sessionCan({ permissions: ['*'] }, 'anything')).toBe(true);
    expect(sessionCan({ permissions: ['x'] }, 'y')).toBe(false);
    expect(sessionCan({ permissions: ['x'] }, null)).toBe(true);
    expect(sessionCan(null, 'x')).toBe(false);
  });

  it('no duplicate destination across the whole NAV', () => {
    const tos = [];
    NAV.forEach(sec => sec.items.forEach(item => { if (item.to) tos.push(item.to); }));
    const dupes = tos.filter((t, i) => tos.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it('every NAV path segment has a PATH_LABELS entry (breadcrumbs)', () => {
    const segs = new Set();
    NAV.forEach(sec => sec.items.forEach(item => {
      item.to.split('/').filter(Boolean).forEach(s => segs.add(s));
    }));
    [...segs].forEach(s => {
      expect(PATH_LABELS[s], `missing PATH_LABELS entry for segment "${s}"`).toBeDefined();
    });
  });

  it('no retired /admin/dept links remain in the config', () => {
    NAV.forEach(sec => sec.items.forEach(item => {
      expect(item.to.startsWith('/admin/dept')).toBe(false);
    }));
  });
});
