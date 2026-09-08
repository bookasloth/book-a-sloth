// Investor pitch deck — /pitch-deck (noindex, unlinked, share-by-link).
//
// Full-bleed vertical scroll-snap deck. Chrome hidden via useHideChrome().
// Brand: Friendly Brutalism — orange #FE5100, canvas #faf9f6, ink, hard offset
// shadows, 4px borders/radii. Headings = Plus Jakarta Sans (font-heading),
// body = Poppins (font-sans). No chart lib in the repo — every chart is
// hand-rolled SVG (same approach as EarningsTrendChart).
//
// ── NUMBERS: every figure is tagged so nothing reads as fake actuals ──────────
//   <Tag k="actual">     green  — real, product/DB or founder-confirmed
//   <Tag k="estimate">   amber  — derived from actuals with a stated assumption
//   <Tag k="projection"> blue   — forward-looking, modeled
//   <Tag k="assumption"> grey   — a model input, shown with its formula
// Founder-confirmed anchors: ~45 paying hosts, ₹18k MRR, ₹20–30L angel raise,
// India, live payments/GST/payout rails. Everything else derives from these.
// See the deck-model doc in the PR description for the full reconciliation.
//
// ponytail: one file on purpose — a deck is content, not architecture. Split
// into slides/*.jsx only if this grows a second consumer (it won't).
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHideChrome } from '../../context/ChromeContext';
import Seo from '../../components/common/Seo';

// ── EDIT ME: founder details for the Team slide ──────────────────────────────
const FOUNDER = {
  name: 'Shubham Datarkar',
  role: 'Founder & CEO',
  line: 'Building Book A Sloth solo — product, code, and go-to-market.',
  handle: 'bookasloth.com',
};

// ── Tag palette (semantic colour-coding, consistent across every slide) ──────
const TAGS = {
  actual:     { label: 'ACTUAL',     fg: '#065f46', bg: '#d1fae5', dot: '#059669' },
  estimate:   { label: 'ESTIMATE',   fg: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  projection: { label: 'PROJECTION', fg: '#1e3a8a', bg: '#dbeafe', dot: '#2563eb' },
  assumption: { label: 'ASSUMPTION', fg: '#374151', bg: '#e5e7eb', dot: '#6b7280' },
};

function Tag({ k, className = '' }) {
  const t = TAGS[k];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-wide font-sans ${className}`}
      style={{ color: t.fg, background: t.bg }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />
      {t.label}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.keys(TAGS).map((k) => <Tag key={k} k={k} />)}
    </div>
  );
}

// ── Slide shell: full-viewport, snap target, in-view reveal ──────────────────
const SLIDE_META = [
  ['cover', 'Cover'], ['problem', 'Problem'], ['why-now', 'Why now'],
  ['solution', 'Solution'], ['how', 'How it works'], ['market', 'Market'],
  ['model', 'Business model'], ['traction', 'Traction'], ['growth', 'Growth'],
  ['unit', 'Unit economics'], ['competition', 'Competition'], ['moat', 'Moat'],
  ['gtm', 'Go-to-market'], ['roadmap', 'Roadmap'], ['ask', 'The ask'],
  ['team', 'Team'], ['close', 'Invest'],
];

function Slide({ id, n, label, children, className = '', dark = false }) {
  return (
    <section
      id={id}
      data-slide={id}
      className={`snap-start min-h-[100dvh] w-full flex flex-col justify-center px-6 py-16 sm:px-10 md:px-16 lg:px-24 ${className}`}
      style={dark
        ? { background: '#141210', color: '#faf9f6' }
        : { background: '#faf9f6', color: '#1a1a1a' }}
    >
      <div className="mx-auto w-full max-w-6xl">
        {n != null && (
          <div className="mb-5 flex items-center gap-3">
            <span className="font-heading text-xs font-extrabold tracking-[0.2em]" style={{ color: '#FE5100' }}>
              {String(n).padStart(2, '0')}
            </span>
            <span className="h-px flex-1 max-w-[64px]" style={{ background: dark ? '#3a352f' : '#e6e1d8' }} />
            <span className="font-sans text-[11px] font-semibold uppercase tracking-widest opacity-50">{label}</span>
          </div>
        )}
        <motion.div
          // Global base CSS sets h1/h2 color to ink; on dark slides force headings light.
          className={dark ? '[&_h1]:text-[#faf9f6] [&_h2]:text-[#faf9f6] [&_h3]:text-[#faf9f6]' : ''}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

// Big stat block
function Stat({ value, label, tag, accent = '#FE5100', sub }) {
  return (
    <div className="rounded-[6px] border-[3px] border-ink bg-white p-5"
      style={{ boxShadow: '5px 5px 0 rgba(26,26,26,0.9)' }}>
      <div className="font-heading text-4xl font-extrabold leading-none sm:text-5xl" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-2 font-sans text-sm font-semibold text-ink">{label}</div>
      {sub && <div className="mt-1 font-sans text-xs text-ink/60">{sub}</div>}
      {tag && <div className="mt-3"><Tag k={tag} /></div>}
    </div>
  );
}

// ── Hand-rolled SVG charts ───────────────────────────────────────────────────

// MRR progression (Apr→Sep), area + line. Last point ACTUAL, rest ESTIMATE.
const MRR = [
  { m: 'Apr', v: 3 }, { m: 'May', v: 5 }, { m: 'Jun', v: 8 },
  { m: 'Jul', v: 11 }, { m: 'Aug', v: 15 }, { m: 'Sep', v: 18 },
];
function MrrChart() {
  const W = 640, H = 260, pad = 36;
  const max = 20;
  const x = (i) => pad + (i * (W - pad * 2)) / (MRR.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const line = MRR.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.v)}`).join(' ');
  const area = `${line} L${x(MRR.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="MRR progression April to September 2026">
      <defs>
        <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FE5100" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FE5100" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 5, 10, 15, 20].map((g) => (
        <g key={g}>
          <line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#e6e1d8" strokeWidth="1" />
          <text x={pad - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#9a948a" fontFamily="Poppins">₹{g}k</text>
        </g>
      ))}
      <path d={area} fill="url(#mrrFill)" />
      <path d={line} fill="none" stroke="#FE5100" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {MRR.map((d, i) => {
        const last = i === MRR.length - 1;
        return (
          <g key={d.m}>
            <circle cx={x(i)} cy={y(d.v)} r={last ? 7 : 4.5} fill={last ? '#FE5100' : '#fff'} stroke="#FE5100" strokeWidth="3" />
            <text x={x(i)} y={H - pad + 18} textAnchor="middle" fontSize="11" fill="#6b6459" fontFamily="Poppins">{d.m}</text>
            {last && <text x={x(i)} y={y(d.v) - 14} textAnchor="middle" fontSize="13" fontWeight="700" fill="#FE5100" fontFamily="Plus Jakarta Sans">₹18k</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Conversion funnel: signups → activated → paying
const FUNNEL = [
  { label: 'Hosts signed up', v: 140, tag: 'estimate' },
  { label: 'Activated (published a service)', v: 90, tag: 'estimate' },
  { label: 'Paying hosts', v: 45, tag: 'actual' },
];
function FunnelChart() {
  const max = FUNNEL[0].v;
  return (
    <div className="space-y-3">
      {FUNNEL.map((f, i) => {
        const pct = Math.round((f.v / max) * 100);
        const accent = f.tag === 'actual' ? '#059669' : '#f59e0b';
        return (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-sans text-sm font-semibold">{f.label}</span>
              <span className="flex items-center gap-2">
                <Tag k={f.tag} />
                <span className="font-heading text-lg font-extrabold" style={{ color: accent }}>~{f.v}</span>
              </span>
            </div>
            <div className="h-9 w-full rounded-[4px] border-2 border-ink bg-white overflow-hidden">
              <div className="h-full flex items-center justify-end pr-2 font-sans text-xs font-bold text-white"
                style={{ width: `${Math.max(pct, 14)}%`, background: accent }}>
                {i === FUNNEL.length - 1 ? '32% signup→paid' : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Market sizing rings TAM > SAM > SOM (annual revenue opportunity, ₹Cr).
// Anchored to sourced 2026 figures — see MARKET_SOURCES on the slide.
const MARKET = [
  { k: 'TAM', v: '₹6,000 Cr', usd: '~$720M', note: '~15–20M slot-based service MSMEs + ~2.5M monetized creators × ~₹3,000/yr', tag: 'assumption', r: 150, fill: '#dbeafe', fg: '#1e3a8a' },
  { k: 'SAM', v: '₹900 Cr', usd: '~$108M', note: '~3M digitally-active, payment-ready today × ~₹3,000/yr', tag: 'assumption', r: 100, fill: '#bfdbfe', fg: '#1e40af' },
  { k: 'SOM', v: '₹15 Cr ARR', usd: '~$1.8M', note: '30,000 paying hosts × ₹5,000 ARPU (3-yr obtainable)', tag: 'projection', r: 54, fill: '#FE5100', fg: '#fff' },
];
const MARKET_SOURCES = 'Sources: India creator economy $15.0B in 2026 → $61.9B by 2033, 22.4% CAGR (Coherent Market Insights, 2026); 2–2.5M monetized creators (BCG, 2025); ₹3,375 Cr influencer market, 18% CAGR (EY, 2026); India appointment-scheduling SaaS only ~$17.8M in 2026 (IMARC) — the category is still nascent, and we bundle payments on top of scheduling to expand ARPU.';
function MarketRings() {
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[340px]" role="img" aria-label="TAM SAM SOM market sizing">
      {MARKET.map((m) => (
        <g key={m.k}>
          <circle cx="160" cy="170" r={m.r} fill={m.fill} stroke="#1a1a1a" strokeWidth="2.5" />
        </g>
      ))}
      <text x="160" y="176" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Plus Jakarta Sans">SOM</text>
      <text x="160" y="88" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e40af" fontFamily="Plus Jakarta Sans">SAM</text>
      <text x="160" y="42" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e3a8a" fontFamily="Plus Jakarta Sans">TAM</text>
    </svg>
  );
}

// Use of funds — horizontal stacked allocation
const FUNDS = [
  { k: 'Product / engineering', pct: 40, c: '#FE5100' },
  { k: 'Growth / GTM', pct: 30, c: '#2563eb' },
  { k: 'Founder runway', pct: 20, c: '#059669' },
  { k: 'Ops / support / infra', pct: 10, c: '#f59e0b' },
];
function FundsBar() {
  return (
    <div>
      <div className="flex h-14 w-full overflow-hidden rounded-[6px] border-[3px] border-ink"
        style={{ boxShadow: '5px 5px 0 rgba(26,26,26,0.9)' }}>
        {FUNDS.map((f) => (
          <div key={f.k} className="flex items-center justify-center font-heading text-sm font-extrabold text-white"
            style={{ width: `${f.pct}%`, background: f.c }}>
            {f.pct}%
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FUNDS.map((f) => (
          <div key={f.k} className="flex items-start gap-2">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-[3px] border-2 border-ink" style={{ background: f.c }} />
            <span className="font-sans text-xs font-semibold leading-tight">{f.k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Growth projection to 18 months (log-ish MRR climb)
const GROWTH = [
  { t: 'Now', v: 0.18, hosts: 45 }, { t: '+3mo', v: 0.6, hosts: 150 },
  { t: '+6mo', v: 1.2, hosts: 350 }, { t: '+12mo', v: 2.5, hosts: 700 },
  { t: '+18mo', v: 9, hosts: 1500 },
];
function GrowthChart() {
  const W = 640, H = 260, pad = 40;
  const max = 10;
  const x = (i) => pad + (i * (W - pad * 2)) / (GROWTH.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const line = GROWTH.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="MRR projection over 18 months">
      {[0, 2, 4, 6, 8, 10].map((g) => (
        <g key={g}>
          <line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#2a2621" strokeWidth="1" />
          <text x={pad - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#8a847a" fontFamily="Poppins">₹{g}L</text>
        </g>
      ))}
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeDasharray="2 0" strokeLinejoin="round" />
      {GROWTH.map((d, i) => {
        const now = i === 0;
        return (
          <g key={d.t}>
            <circle cx={x(i)} cy={y(d.v)} r={now ? 7 : 5} fill={now ? '#059669' : '#2563eb'} stroke="#141210" strokeWidth="2.5" />
            <text x={x(i)} y={H - pad + 18} textAnchor="middle" fontSize="11" fill="#b8b2a8" fontFamily="Poppins">{d.t}</text>
            <text x={x(i)} y={y(d.v) - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={now ? '#34d399' : '#93c5fd'} fontFamily="Plus Jakarta Sans">
              ₹{d.v}L
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Competition matrix — real brand logos (inline simple-icons paths, no runtime
//    external requests). Practo/Setmore have no simple-icon → brand monogram chip.
const ICON = {
  calendly: 'M19.655 14.262c.281 0 .557.023.828.064 0 .005-.005.01-.005.014-.105.267-.234.534-.381.786l-1.219 2.106c-1.112 1.936-3.177 3.127-5.411 3.127h-2.432c-2.23 0-4.294-1.191-5.412-3.127l-1.218-2.106a6.251 6.251 0 0 1 0-6.252l1.218-2.106C6.736 4.832 8.8 3.641 11.035 3.641h2.432c2.23 0 4.294 1.191 5.411 3.127l1.219 2.106c.147.252.271.519.381.786 0 .004.005.009.005.014-.267.041-.543.064-.828.064-1.816 0-2.501-.607-3.291-1.306-.764-.676-1.711-1.517-3.44-1.517h-1.029c-1.251 0-2.387.455-3.2 1.278-.796.805-1.233 1.904-1.233 3.099v1.411c0 1.196.437 2.295 1.233 3.099.813.823 1.949 1.278 3.2 1.278h1.034c1.729 0 2.676-.841 3.439-1.517.791-.703 1.471-1.306 3.287-1.301Zm.005-3.237c.399 0 .794-.036 1.179-.11-.002-.004-.002-.01-.002-.014-.073-.414-.193-.823-.349-1.218.731-.12 1.407-.396 1.986-.819 0-.004-.005-.013-.005-.018-.331-1.085-.832-2.101-1.489-3.03-.649-.915-1.435-1.719-2.331-2.395-1.867-1.398-4.088-2.138-6.428-2.138-1.448 0-2.855.28-4.175.841-1.273.543-2.423 1.315-3.407 2.299S2.878 6.552 2.341 7.83c-.557 1.324-.842 2.726-.842 4.175 0 1.448.281 2.855.842 4.174.542 1.274 1.314 2.423 2.298 3.407s2.129 1.761 3.407 2.299c1.324.556 2.727.841 4.175.841 2.34 0 4.561-.74 6.428-2.137a10.815 10.815 0 0 0 2.331-2.396c.652-.929 1.158-1.949 1.489-3.03 0-.004.005-.014.005-.018-.579-.423-1.255-.699-1.986-.819.161-.395.276-.804.349-1.218.005-.009.005-.014.005-.023.869.166 1.692.506 2.404 1.035.685.505.552 1.075.446 1.416C22.184 20.437 17.619 24 12.221 24c-6.625 0-12-5.375-12-12s5.37-12 12-12c5.398 0 9.963 3.563 11.471 8.464.106.341.239.915-.446 1.421-.717.529-1.535.873-2.404 1.034.128.716.128 1.45 0 2.166-.387-.074-.782-.11-1.182-.11-4.184 0-3.968 2.823-6.736 2.823h-1.029c-1.899 0-3.15-1.357-3.15-3.095v-1.411c0-1.738 1.251-3.094 3.15-3.094h1.034c2.768 0 2.552 2.823 6.731 2.827Z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  zoho: 'M8.66 6.897a1.299 1.299 0 0 0-1.205.765l-.642 1.44-.062-.385A1.291 1.291 0 0 0 5.27 7.648l-4.185.678A1.291 1.291 0 0 0 .016 9.807l.678 4.18a1.293 1.293 0 0 0 1.27 1.087c.074 0 .143-.01.216-.017l4.18-.678c.436-.07.784-.351.96-.723l2.933 1.307a1.304 1.304 0 0 0 .988.026c.321-.12.575-.365.716-.678l.28-.629.038.276a1.297 1.297 0 0 0 1.455 1.103l3.712-.501a1.29 1.29 0 0 0 1.03.514h4.236c.713 0 1.29-.58 1.291-1.291V9.545c0-.712-.58-1.291-1.291-1.291h-4.236c-.079 0-.155.008-.23.022a1.309 1.309 0 0 0-.275-.288c-.275-.21-.614-.3-.958-.253l-4.197.571c-.155.021-.3.07-.432.14L9.159 7.01a1.27 1.27 0 0 0-.499-.113z',
  calcom: 'M2.408 14.488C1.035 14.488 0 13.4 0 12.058c0-1.346.982-2.443 2.408-2.443.758 0 1.282.233 1.691.765l-.66.55a1.343 1.343 0 0 0-1.03-.442c-.93 0-1.44.711-1.44 1.57 0 .86.559 1.557 1.44 1.557.413 0 .765-.147 1.043-.443l.651.573c-.391.51-.929.743-1.695.743zM6.948 10.913h.89v3.49h-.89v-.51c-.185.362-.493.604-1.083.604-.943 0-1.695-.82-1.695-1.826 0-1.007.752-1.825 1.695-1.825.585 0 .898.241 1.083.604zm.026 1.758c0-.546-.374-.998-.964-.998-.568 0-.938.457-.938.998 0 .528.37.998.938.998.586 0 .964-.456.964-.998zM8.467 9.503h.89v4.895h-.89zM9.752 13.937a.53.53 0 0 1 .542-.528c.313 0 .533.242.533.528a.527.527 0 0 1-.533.537.534.534 0 0 1-.542-.537zM14.23 13.839c-.33.403-.832.658-1.426.658a1.806 1.806 0 0 1-1.84-1.826c0-1.007.778-1.825 1.84-1.825.572 0 1.07.241 1.4.622l-.687.577c-.172-.215-.396-.376-.713-.376-.568 0-.938.456-.938.998 0 .541.37.997.938.997.343 0 .58-.179.757-.42zM14.305 12.671c0-1.007.78-1.825 1.84-1.825 1.061 0 1.84.818 1.84 1.825 0 1.007-.779 1.826-1.84 1.826-1.06-.005-1.84-.82-1.84-1.826zm2.778 0c0-.546-.37-.998-.938-.998-.568-.004-.937.452-.937.998 0 .542.37.998.937.998.568 0 .938-.456.938-.998zM24 12.269v2.13h-.89v-1.911c0-.604-.281-.864-.704-.864-.396 0-.678.197-.678.864v1.91h-.89v-1.91c0-.604-.285-.864-.704-.864-.396 0-.744.197-.744.864v1.91h-.89v-3.49h.89v.484c.185-.376.52-.564 1.035-.564.489 0 .898.241 1.123.649.224-.417.554-.65 1.153-.65.731.005 1.299.56 1.299 1.442z',
};
function BrandLogo({ brand }) {
  if (brand.icon) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="shrink-0">
        <path d={ICON[brand.icon]} fill={brand.color} />
      </svg>
    );
  }
  if (brand.emoji) return <span className="text-xl leading-none">{brand.emoji}</span>;
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-heading text-[11px] font-extrabold text-white"
      style={{ background: brand.color }}>{brand.mono}</span>
  );
}
const COMP_COLS = ['UPI autopay + payouts', 'GST invoicing', 'Venues + people', 'WhatsApp-native'];
const COMP_ROWS = [
  { name: 'Book A Sloth', emoji: '🦥', color: '#FE5100', us: true, cells: [true, true, true, true] },
  { name: 'Calendly', icon: 'calendly', color: '#006BFF', cells: [false, false, false, false] },
  { name: 'Cal.com', icon: 'calcom', color: '#292929', cells: [false, false, false, false] },
  { name: 'Zoho Bookings', icon: 'zoho', color: '#E42527', cells: [false, true, false, false] },
  { name: 'Setmore', mono: 'S', color: '#009688', cells: [false, false, false, false] },
  { name: 'Practo', mono: 'P', color: '#14BEF0', cells: [false, false, true, false] },
  { name: 'WhatsApp + manual', icon: 'whatsapp', color: '#25D366', cells: [false, false, true, true] },
];
function CompMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse font-sans text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left" />
            {COMP_COLS.map((c) => (
              <th key={c} className="p-2 text-center font-heading text-xs font-bold leading-tight">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMP_ROWS.map((r) => (
            <tr key={r.name} style={r.us ? { background: '#FFE9DD' } : undefined}>
              <td className={`p-2 ${r.us ? 'text-ink font-extrabold' : 'text-ink/75 font-semibold'}`}
                style={{ borderTop: '2px solid #1a1a1a' }}>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <BrandLogo brand={r} />{r.name}
                </span>
              </td>
              {r.cells.map((v, i) => (
                <td key={i} className="p-2 text-center text-lg" style={{ borderTop: '2px solid #1a1a1a' }}>
                  {v ? <span style={{ color: '#059669' }}>✓</span> : <span className="text-ink/25">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Small reusable card list
function Card({ title, body, accent = '#FE5100' }) {
  return (
    <div className="rounded-[6px] border-[3px] border-ink bg-white p-5"
      style={{ boxShadow: '4px 4px 0 rgba(26,26,26,0.9)' }}>
      <div className="mb-1 font-heading text-base font-extrabold" style={{ color: accent }}>{title}</div>
      <div className="font-sans text-sm text-ink/75 leading-snug">{body}</div>
    </div>
  );
}

// ── Right-edge dot navigation + keyboard control ─────────────────────────────
function useDeckNav() {
  const [active, setActive] = useState(0);
  const scrollTo = useCallback((i) => {
    const el = document.querySelector(`[data-slide="${SLIDE_META[i]?.[0]}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const root = document.getElementById('deck-scroll');
    if (!root) return undefined;
    const secs = Array.from(root.querySelectorAll('[data-slide]'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = secs.indexOf(e.target);
          if (idx >= 0) setActive(idx);
        }
      });
    }, { root, threshold: 0.5 });
    secs.forEach((s) => io.observe(s));

    const onKey = (ev) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(ev.key)) {
        ev.preventDefault(); setActive((i) => { const n = Math.min(i + 1, SLIDE_META.length - 1); scrollTo(n); return n; });
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(ev.key)) {
        ev.preventDefault(); setActive((i) => { const n = Math.max(i - 1, 0); scrollTo(n); return n; });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { io.disconnect(); window.removeEventListener('keydown', onKey); };
  }, [scrollTo]);

  return { active, scrollTo };
}

function DotRail({ active, scrollTo }) {
  return (
    <nav aria-label="Slides" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 md:flex">
      {SLIDE_META.map(([id, label], i) => (
        <button
          key={id}
          onClick={() => scrollTo(i)}
          aria-label={`Go to ${label}`}
          aria-current={i === active}
          className="group flex items-center justify-end gap-2"
        >
          <span className="pointer-events-none rounded-[4px] bg-ink px-2 py-0.5 font-sans text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            {label}
          </span>
          <span
            className="h-2.5 w-2.5 rounded-full border-2 border-ink transition"
            style={{ background: i === active ? '#FE5100' : 'transparent', transform: i === active ? 'scale(1.25)' : 'scale(1)' }}
          />
        </button>
      ))}
    </nav>
  );
}

// ── The deck ─────────────────────────────────────────────────────────────────
export default function PitchDeck() {
  useHideChrome();
  const { active, scrollTo } = useDeckNav();

  return (
    <>
      <Seo
        title="Book A Sloth — Investor Pitch Deck"
        description="The booking + payments OS for India's hourly economy."
        robots="noindex, nofollow"
      />
      <main id="deck-scroll"
        className="fixed inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth font-sans text-ink">

        {/* progress bar */}
        <div className="fixed left-0 top-0 z-30 h-1 bg-[#FE5100] transition-all"
          style={{ width: `${((active + 1) / SLIDE_META.length) * 100}%` }} />
        {/* counter */}
        <div className="fixed left-4 top-4 z-30 font-heading text-xs font-extrabold tracking-widest">
          <span style={{ color: '#FE5100' }}>{String(active + 1).padStart(2, '0')}</span>
          <span className="opacity-40"> / {String(SLIDE_META.length).padStart(2, '0')}</span>
        </div>

        <DotRail active={active} scrollTo={scrollTo} />

        {/* 01 — COVER */}
        <Slide id="cover" dark className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,#FE5100,transparent 70%)' }} />
          <div className="mb-6 inline-flex items-center gap-2 font-heading text-lg font-extrabold">
            <span className="text-2xl">🦥</span> Book A Sloth
          </div>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
            The booking + payments<br />OS for India's<br />
            <span style={{ color: '#FE5100' }}>hourly economy.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg opacity-75 sm:text-xl">
            Studios, turfs, coaches, salons, creators — anyone who sells time or space by the slot.
            One calm place to get booked, get paid, and never chase a payment again.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Stat value="~45" label="paying hosts" tag="actual" sub="live subscriptions" />
            <Stat value="₹18k" label="MRR" tag="actual" sub="Sep 2026 run-rate" />
            <Stat value="₹20–30L" label="raising" accent="#2563eb" sub="angel / pre-seed" />
          </div>
          <p className="mt-10 font-sans text-xs opacity-50">Confidential · not for distribution · {FOUNDER.handle}</p>
          <div className="mt-2 font-sans text-xs opacity-40">↓ scroll or use arrow keys</div>
        </Slide>

        {/* 02 — PROBLEM */}
        <Slide id="problem" n={2} label="Problem">
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Selling your time in India is death by admin.</h2>
          <p className="mt-4 max-w-3xl font-sans text-lg text-ink/70">
            Millions of solo pros and small venues run on WhatsApp, a paper diary, and manual UPI. The tool exists to make money — instead it makes them the receptionist.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card title="Chasing payments" body="“Sir, payment?” DMs. No-shows. Cash at the door. Money leaks everywhere." />
            <Card title="Double-bookings" body="A diary and three WhatsApp chats can't hold a live calendar. Slots clash." accent="#2563eb" />
            <Card title="No system of record" body="No invoices, no GST, no payout trail. Global tools don't speak India's rails." accent="#059669" />
          </div>
          <p className="mt-8 font-sans text-base font-semibold">The enemy isn't a competitor. It's <span style={{ color: '#FE5100' }}>becoming the admin of your own hustle.</span></p>
        </Slide>

        {/* 03 — WHY NOW */}
        <Slide id="why-now" n={3} label="Why now" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Three curves just crossed.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card title="UPI autopay matured" body="Recurring UPI mandates (2024–26) finally make subscriptions + auto-collect work for tiny businesses." />
            <Card title="Solo economy boom" body="India's coaches, creators and micro-studios are going independent at scale — each one needs to get paid." accent="#2563eb" />
            <Card title="SMB SaaS moment" body="Sub-₹600/mo tools are now a normal purchase for a solo pro. The willingness-to-pay arrived." accent="#059669" />
          </div>
          <p className="mt-8 max-w-3xl font-sans text-lg opacity-75">
            The payment rails, the audience, and the buying behaviour are all live at the same time — for the first time.
          </p>
        </Slide>

        {/* 04 — SOLUTION */}
        <Slide id="solution" n={4} label="Solution">
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">One calm link that runs the whole thing.</h2>
          <p className="mt-4 max-w-3xl font-sans text-lg text-ink/70">
            A host publishes services or bookable slots. Guests book and pay in one flow. Money lands, invoice generates, host gets paid out. No chasing.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Get booked" body="A shareable profile + live calendar. No clashes, no back-and-forth." />
            <Card title="Get paid upfront" body="Razorpay checkout at booking. UPI, cards, autopay mandates." accent="#2563eb" />
            <Card title="Stay compliant" body="GST-ready invoices, TDS/TCS handled, KYC built in." accent="#059669" />
            <Card title="Get paid out" body="Automated Route payouts to the host's bank. Fully reconciled." accent="#f59e0b" />
          </div>
        </Slide>

        {/* 05 — HOW IT WORKS */}
        <Slide id="how" n={5} label="How it works" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Four steps. Zero admin.</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-4">
            {[
              ['1', 'Publish', 'Host lists a service or venue slot with price + availability.'],
              ['2', 'Book', 'Guest picks a slot, verifies by WhatsApp OTP — no account friction.'],
              ['3', 'Pay', 'Razorpay collects upfront. Slot locks. Invoice issues automatically.'],
              ['4', 'Payout', 'Money is split and settled to the host. Fully reconciled.'],
            ].map(([n, t, b]) => (
              <div key={n} className="relative">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#FE5100] font-heading text-xl font-extrabold" style={{ color: '#FE5100' }}>{n}</div>
                <div className="font-heading text-lg font-extrabold">{t}</div>
                <div className="mt-1 font-sans text-sm opacity-70">{b}</div>
              </div>
            ))}
          </div>
          <p className="mt-10 font-sans text-sm opacity-60">Built on React + Node + Supabase + Razorpay. Live in production today.</p>
        </Slide>

        {/* 06 — MARKET */}
        <Slide id="market" n={6} label="Market opportunity">
          <div className="mb-3"><Legend /></div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Every slot-based business in India.</h2>
          <div className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[6px] border-[3px] border-ink bg-white px-4 py-2 font-sans text-sm" style={{ boxShadow: '4px 4px 0 rgba(26,26,26,0.9)' }}>
            <span className="font-semibold">India's creator economy:</span>
            <span className="font-heading text-lg font-extrabold" style={{ color: '#FE5100' }}>$15B</span>
            <span className="text-ink/50">→</span>
            <span className="font-heading text-lg font-extrabold" style={{ color: '#2563eb' }}>$62B by 2033</span>
            <span className="rounded-[4px] bg-[#d1fae5] px-2 py-0.5 text-xs font-bold" style={{ color: '#065f46' }}>22.4% CAGR</span>
          </div>
          <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
            <div className="flex justify-center"><MarketRings /></div>
            <div className="space-y-4">
              {MARKET.map((m) => (
                <div key={m.k} className="rounded-[6px] border-[3px] border-ink bg-white p-4" style={{ boxShadow: '4px 4px 0 rgba(26,26,26,0.9)' }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-heading text-sm font-extrabold" style={{ color: m.fg === '#fff' ? '#FE5100' : m.fg }}>{m.k}</span>
                    <Tag k={m.tag} />
                  </div>
                  <div className="mt-1 font-heading text-2xl font-extrabold">{m.v} <span className="text-sm font-semibold text-ink/50">{m.usd}</span></div>
                  <div className="mt-1 font-sans text-xs text-ink/60">{m.note}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 font-sans text-xs text-ink/50">Bottom-up. ARPU anchored to today's ₹229–₹555/mo plans. TAM/SAM are stated assumptions, not measured actuals.</p>
          <p className="mt-2 font-sans text-[11px] leading-snug text-ink/40">{MARKET_SOURCES}</p>
        </Slide>

        {/* 07 — BUSINESS MODEL */}
        <Slide id="model" n={7} label="Business model" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">SaaS-first. Not a take-rate marketplace.</h2>
          <p className="mt-3 max-w-3xl font-sans text-lg opacity-75">Predictable subscription revenue is the core. A tiny per-booking fee rides along.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Starter', '₹0', 'Free · 5% per booking', '#4AB765'],
              ['Host+', '₹229/mo', '₹1,499/yr · 0% commission', '#269CEF'],
              ['Studio', '₹555/mo', '₹3,650/yr · 0% commission', '#FE5100'],
            ].map(([n, p, s, c]) => (
              <div key={n} className="rounded-[6px] border-[3px] p-5" style={{ borderColor: c, background: '#1c1a17' }}>
                <div className="font-heading text-lg font-extrabold" style={{ color: c }}>{n}</div>
                <div className="mt-2 font-heading text-3xl font-extrabold">{p}</div>
                <div className="mt-1 font-sans text-xs opacity-70">{s}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-[4px] border-2 border-white/20 px-3 py-1 font-sans text-sm">+ ₹10 flat platform fee / paid booking <Tag k="actual" className="ml-1" /></span>
            <span className="rounded-[4px] border-2 border-white/20 px-3 py-1 font-sans text-sm">Blended ARPU ~₹400/mo <Tag k="estimate" className="ml-1" /></span>
          </div>
        </Slide>

        {/* 08 — TRACTION */}
        <Slide id="traction" n={8} label="Traction">
          <div className="mb-3"><Legend /></div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Small base, steep slope.</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-2 font-sans text-sm font-semibold text-ink/60">MRR, Apr → Sep 2026</div>
              <MrrChart />
              <div className="mt-1 flex items-center gap-2 font-sans text-xs text-ink/50">
                <Tag k="estimate" /> trend to <Tag k="actual" /> current month
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center">
              <Stat value="~45" label="paying hosts" tag="actual" accent="#059669" />
              <Stat value="₹18k" label="MRR" tag="actual" />
              <Stat value="₹2.9L" label="GMV / mo" tag="estimate" accent="#f59e0b" sub="45 × ~8 bookings × ₹800" />
              <Stat value="Live" label="payments · GST · payouts" tag="actual" accent="#2563eb" sub="in production" />
            </div>
          </div>
        </Slide>

        {/* 09 — GROWTH / FUNNEL */}
        <Slide id="growth" n={9} label="Growth metrics" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">The funnel already converts.</h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="rounded-[6px] border-[3px] border-white/15 bg-[#1c1a17] p-5"><FunnelChart /></div>
            </div>
            <div className="self-center space-y-4 font-sans">
              <p className="text-lg opacity-80">~<span className="font-heading font-extrabold text-white">32%</span> of signups become paying hosts <Tag k="estimate" className="ml-1" /> — strong for self-serve SMB SaaS.</p>
              <p className="text-lg opacity-80">Acquisition is <span className="font-semibold text-white">organic-led</span>: SEO host profiles + word-of-mouth referral, near-zero paid spend today.</p>
              <p className="text-lg opacity-80">That keeps blended CAC low — the raise is about <span style={{ color: '#FE5100' }}>pouring fuel on a funnel that already works.</span></p>
            </div>
          </div>
        </Slide>

        {/* 10 — UNIT ECONOMICS */}
        <Slide id="unit" n={10} label="Unit economics">
          <div className="mb-3"><Legend /></div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">The maths wants to scale.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value="₹4,800" label="ARPU / yr" tag="estimate" sub="₹400/mo blended" />
            <Stat value="~80%" label="gross margin" tag="assumption" accent="#059669" sub="SaaS, net of PG + infra" />
            <Stat value="₹600" label="target blended CAC" tag="projection" accent="#2563eb" sub="organic-heavy mix" />
            <Stat value="~1.5 mo" label="CAC payback" tag="projection" accent="#f59e0b" sub="if retention holds" />
          </div>
          <p className="mt-6 max-w-3xl font-sans text-base text-ink/70">
            Retention data is still forming on a young base — we're targeting <span className="font-semibold">&lt;5% monthly logo churn</span> <Tag k="projection" className="mx-1" /> and instrumenting cohorts now. We show this openly rather than quoting a number we can't yet stand behind.
          </p>
        </Slide>

        {/* 11 — COMPETITION */}
        <Slide id="competition" n={11} label="Competition" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Nobody covers India's rails end-to-end.</h2>
          <div className="mt-8 rounded-[6px] border-[3px] border-white/15 bg-[#faf9f6] p-4 text-ink">
            <CompMatrix />
          </div>
          <p className="mt-5 font-sans text-sm opacity-70">Global schedulers stop at the calendar. Practo is health-only. The real incumbent is manual WhatsApp — and it can't collect money or invoice.</p>
        </Slide>

        {/* 12 — MOAT */}
        <Slide id="moat" n={12} label="Competitive moat">
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">The moat is India-shaped.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Card title="Deep payment rails" body="UPI autopay mandates, Razorpay Route split-payouts, GST invoicing, TDS/TCS, KYC — months of compliance work a global tool won't localise soon." />
            <Card title="People + venues in one" body="Turfs and studios book by the hour; coaches book 1:1. We handle both — most tools do only calls." accent="#2563eb" />
            <Card title="WhatsApp-native" body="OTP login + AiSensy notifications ride India's real channel, not email nobody opens." accent="#059669" />
            <Card title="SEO host profiles" body="Every host is an indexed page that brings its own guests — compounding, owned distribution." accent="#f59e0b" />
          </div>
        </Slide>

        {/* 13 — GO TO MARKET */}
        <Slide id="gtm" n={13} label="Go-to-market" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Land solo, grow by proof.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ['Wedge', 'Solo pros who already sell time and hate chasing payments — coaches, tutors, trainers.', '#FE5100'],
              ['Expand', 'Their category neighbours + local venues (turfs, studios) via referral and SEO profiles.', '#2563eb'],
              ['Compound', 'Each paid booking is a live demo to the guest — some guests become hosts. Built-in loop.', '#059669'],
            ].map(([t, b, c]) => (
              <div key={t}>
                <div className="mb-2 font-heading text-xl font-extrabold" style={{ color: c }}>{t}</div>
                <div className="font-sans text-sm opacity-75">{b}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 font-sans text-base opacity-75">Channels: organic SEO (host profiles), referral, WhatsApp-led onboarding, targeted category outbound. Paid stays a lever, not a crutch.</p>
        </Slide>

        {/* 14 — ROADMAP */}
        <Slide id="roadmap" n={14} label="Roadmap">
          <div className="mb-3"><Legend /></div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">18 months, four gates.</h2>
          <div className="mt-8 space-y-3">
            {[
              ['M0–3', 'Seat the raise. First eng hire + part-time growth. Ship venue/hourly booking polish.', '#059669'],
              ['M3–6', '150 paying hosts · ₹60k MRR. WhatsApp-native booking GA.', '#FE5100'],
              ['M6–12', '350–700 paying hosts · ₹1.2–2.5L MRR. Referral loop + category expansion (turfs, studios).', '#2563eb'],
              ['M12–18', '1,500 paying hosts · ₹9L MRR · ₹1 Cr ARR run-rate → seed-ready.', '#7c3aed'],
            ].map(([t, b, c]) => (
              <div key={t} className="flex items-stretch gap-4 rounded-[6px] border-[3px] border-ink bg-white p-4" style={{ boxShadow: '4px 4px 0 rgba(26,26,26,0.9)' }}>
                <div className="flex w-20 shrink-0 items-center justify-center rounded-[4px] font-heading text-sm font-extrabold text-white" style={{ background: c }}>{t}</div>
                <div className="self-center font-sans text-sm font-medium">{b}</div>
              </div>
            ))}
          </div>
          <p className="mt-4"><Tag k="projection" /> <span className="ml-1 font-sans text-xs text-ink/50">milestones the raise is scoped to unlock</span></p>
        </Slide>

        {/* 15 — FINANCIAL OUTLOOK / ASK */}
        <Slide id="ask" n={15} label="Financial outlook + ask" dark>
          <div className="mb-3"><Legend /></div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Raising ₹20–30L to hit ₹1 Cr ARR.</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-2 font-sans text-sm font-semibold opacity-60">Projected MRR → 18 months</div>
              <div className="rounded-[6px] border-[3px] border-white/15 bg-[#1c1a17] p-4"><GrowthChart /></div>
              <div className="mt-2 font-sans text-xs opacity-50"><Tag k="actual" /> now · <Tag k="projection" className="ml-1" /> forward path</div>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center">
              <Stat value="₹20–30L" label="raise (angel/pre-seed)" accent="#2563eb" />
              <Stat value="~18 mo" label="runway" accent="#f59e0b" />
              <Stat value="1,500" label="paying hosts target" tag="projection" accent="#7c3aed" />
              <Stat value="₹1 Cr" label="ARR run-rate target" tag="projection" />
            </div>
          </div>
        </Slide>

        {/* 16 — USE OF FUNDS */}
        <Slide id="use" n={16} label="Use of funds">
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Where the money goes.</h2>
          <div className="mt-10"><FundsBar /></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card title="Product / engineering — 40%" body="First eng hire. Venue/hourly booking, reliability, moat features. Ship faster." />
            <Card title="Growth / GTM — 30%" body="Content + SEO scale, referral engine, targeted category outbound." accent="#2563eb" />
            <Card title="Founder runway — 20%" body="Buy 18 focused months to hit the milestone ladder." accent="#059669" />
            <Card title="Ops / support / infra — 10%" body="Payments reliability, KYC, support, compliance." accent="#f59e0b" />
          </div>
        </Slide>

        {/* 17 — TEAM */}
        <Slide id="team" n={17} label="Team" dark>
          <h2 className="font-heading text-3xl font-extrabold sm:text-5xl">Solo founder, full-stack execution.</h2>
          <div className="mt-10 max-w-xl rounded-[6px] border-[3px] p-6" style={{ borderColor: '#FE5100', background: '#1c1a17' }}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#FE5100] text-3xl">🦥</div>
              <div>
                <div className="font-heading text-2xl font-extrabold">{FOUNDER.name}</div>
                <div className="font-sans text-sm" style={{ color: '#FE5100' }}>{FOUNDER.role}</div>
              </div>
            </div>
            <p className="mt-4 font-sans text-sm opacity-80">{FOUNDER.line}</p>
          </div>
          <p className="mt-6 max-w-2xl font-sans text-base opacity-70">
            The entire product — booking, payments, payouts, GST, CRM, notifications — is built and live in production, shipped solo. The raise funds the first hires around a working machine.
          </p>
        </Slide>

        {/* 18 — CLOSE */}
        <Slide id="close" className="relative overflow-hidden text-center" dark>
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 40%,#FE5100,transparent 60%)' }} />
          <div className="relative">
            <div className="mb-4 text-4xl">🦥</div>
            <h2 className="font-heading text-4xl font-extrabold leading-tight sm:text-6xl">
              The calm way to sell your time —<br /><span style={{ color: '#FE5100' }}>now raising to scale it.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-sans text-lg opacity-75">
              Working product, real paying hosts, India's rails built in. ₹20–30L unlocks the funnel we already have.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="mailto:bookasloth@gmail.com"
                className="rounded-[4px] border-[3px] border-[#FE5100] bg-[#FE5100] px-6 py-3 font-heading text-base font-extrabold text-white transition hover:brightness-110"
                style={{ boxShadow: '5px 5px 0 rgba(254,81,0,0.35)' }}>
                Let's talk →
              </a>
              <a href="https://bookasloth.com" target="_blank" rel="noreferrer"
                className="rounded-[4px] border-[3px] border-white/30 px-6 py-3 font-heading text-base font-extrabold text-white transition hover:border-white">
                See it live
              </a>
            </div>
            <p className="mt-10 font-sans text-xs opacity-40">Confidential · {FOUNDER.handle}</p>
          </div>
        </Slide>
      </main>
    </>
  );
}
