// attribution.js — capture marketing attribution once, remember first touch.
//
// On first arrival we snapshot the URL's UTM params + referrer + landing path
// and persist them (first-touch, sticky). getAttribution() returns that snapshot
// so signup / newsletter / enterprise calls can send it to the CRM. localStorage
// is best-effort — a private window or blocked storage just yields no attribution.

const KEY = 'bas_attribution';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function readStore() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

// Read attribution from the current URL, or null if none present.
function fromUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    const out = {};
    for (const k of UTM) { const v = q.get(k); if (v) out[k] = v.slice(0, 200); }
    const hasUtm = UTM.some((k) => out[k]);
    if (!hasUtm) return null; // only a UTM-tagged arrival counts as a real touch
    if (document.referrer) out.referrer = document.referrer.slice(0, 500);
    out.landing_page = (window.location.pathname + window.location.search).slice(0, 500);
    return out;
  } catch { return null; }
}

// Call once on app load. Stores the FIRST utm-tagged touch and never overwrites
// it — so the acquisition source survives later untagged navigation.
export function captureAttribution() {
  try {
    if (readStore()) return;            // first touch already recorded
    const att = fromUrl();
    if (att) localStorage.setItem(KEY, JSON.stringify({ ...att, at: new Date().toISOString() }));
  } catch { /* storage blocked — no-op */ }
}

// The stored attribution payload to attach to a lead-creating request, or null.
export function getAttribution() {
  const s = readStore();
  if (!s) return null;
  const { at, ...att } = s; // send the fields; the server stamps its own timestamp
  return Object.keys(att).length ? att : null;
}
