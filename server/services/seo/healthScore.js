// Deterministic per-category health. Never AI-generated.
const PENALTY = { P0: 40, P1: 20, P2: 10, P3: 4, P4: 1 };
const CATEGORIES = ['technical', 'onpage', 'indexability', 'internal_linking'];
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

function score(issues = []) {
  const deducted = {}; const breakdown = {};
  for (const c of CATEGORIES) { deducted[c] = 0; breakdown[c] = []; }
  for (const i of issues) {
    const c = CATEGORIES.includes(i.category) ? i.category : 'onpage';
    deducted[c] += PENALTY[i.severity] ?? 1;
    breakdown[c].push({ ruleKey: i.ruleKey, severity: i.severity, penalty: PENALTY[i.severity] ?? 1 });
  }
  const technical = clamp(100 - deducted.technical);
  const onpage = clamp(100 - deducted.onpage);
  const indexability = clamp(100 - deducted.indexability);
  const internal_linking = clamp(100 - deducted.internal_linking);
  const content = onpage; // P1: no separate content analysis yet
  const overall = clamp((technical + onpage + indexability + internal_linking + content) / 5);
  return { overall, technical, onpage, content, indexability, internal_linking, breakdown };
}
module.exports = { score, PENALTY };
