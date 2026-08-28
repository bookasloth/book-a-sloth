// client/src/components/admin/navHelpers.js
// Pure nav resolution helpers — no React, no DOM. Unit-tested in navHelpers.test.js.
// Consumed by the primary rail, secondary sidebar, and AdminLayout.

import { sessionCan } from './adminNav';

// Is a single item the active one for this path?
// `exact` items highlight only on an exact match (index routes that are a prefix
// of their siblings, e.g. /admin/finance vs /admin/finance/ledger). Others match
// the exact path or any sub-path (/admin/bookings → /admin/bookings/abandoned).
export const itemActive = (pathname, item) => {
  if (!item || !item.to) return false;
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + '/');
};

// Which section owns this path? Longest-matching `to` wins, so a deep item
// (/admin/finance/ledger) resolves to its own section over a shorter sibling
// index (/admin/finance). Returns null for a path no item matches.
// Note: uses prefix matching for resolution regardless of an item's `exact`
// flag — `exact` only governs highlight, not which section is active.
export const activeSection = (pathname, nav) => {
  let best = null;
  let bestLen = -1;
  nav.forEach(sec => {
    sec.items.forEach(item => {
      if (!item.to) return;
      const match = pathname === item.to || pathname.startsWith(item.to + '/');
      if (match && item.to.length > bestLen) { best = sec; bestLen = item.to.length; }
    });
  });
  return best;
};

// Live count for one item's badge, from the ops-summary counts map. 0 if unset.
export const itemBadge = (item, counts) => {
  const n = item && item.badge ? counts?.[item.badge] : 0;
  return n > 0 ? n : 0;
};

// Section attention count = sum of its items' badges. Drives the rail dot.
export const sectionBadgeCount = (section, counts) => {
  if (!section || !section.items) return 0;
  return section.items.reduce((sum, item) => sum + itemBadge(item, counts), 0);
};

// Overflow-safe display for a badge pill/dot.
export const formatBadge = (n) => (n > 99 ? '99+' : String(n));

// Sections with ≥1 item the session may see. Items are permission-filtered;
// empty sections drop out entirely (nothing to show → no rail icon).
export const visibleSections = (nav, session) =>
  nav
    .map(sec => ({ ...sec, items: sec.items.filter(item => sessionCan(session, item.perm)) }))
    .filter(sec => sec.items.length > 0);
