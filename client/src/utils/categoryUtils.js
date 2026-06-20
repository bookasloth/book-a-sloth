// Client-side mirror of the server's category plan rules (UX only — the server
// at PUT /host/categories is authoritative). Plan slugs: starter/creator/professional.
export function getCategoryRules(plan) {
  const p = (plan || '').toLowerCase();
  if (p === 'creator') return { locked: false, max: 1 };
  if (p === 'professional') return { locked: false, max: 3 };
  return { locked: true, max: 1 }; // starter / explorer / unknown = free, locked
}

// [{ group, items: [...] }] grouped by group_label, preserving first-seen order.
export function groupCategories(list) {
  const order = [];
  const byGroup = new Map();
  (list || []).forEach((c) => {
    const g = c.group_label || 'Other';
    if (!byGroup.has(g)) { byGroup.set(g, []); order.push(g); }
    byGroup.get(g).push(c);
  });
  return order.map((g) => ({ group: g, items: byGroup.get(g) }));
}
