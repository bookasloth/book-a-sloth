// client/src/components/admin/seo/SeoNetwork.jsx
// Interactive internal-link network for the latest crawl. Nodes = crawled pages
// (dot size = inbound links = "how well linked-to is this page"), edges = internal
// links. Force-directed layout on a plain <canvas> — no new dependency, just a small
// velocity-Verlet sim that's smooth at one crawl's few-hundred-node scale. Drag a dot
// and the web re-settles; scroll to zoom, drag empty space to pan; click a dot to open
// the same SeoInspector the list rows use (node id === crawl_page id).
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Ic from '../Ic';
import { IC } from '../adminNav';
import { Card, Skeleton, Btn } from '../ui';
import { adminSeoLinkGraph } from '../../../services/api';
import SeoInspector from './SeoInspector';

// Categorical colour per page type — distinct hues that read on both admin themes.
const TYPE_COLOR = {
  static: '#f59e0b', blog: '#16a34a', service: '#2563eb', host: '#7c3aed',
  unknown: '#6b7280', other: '#6b7280',
};
const typeColor = (t) => TYPE_COLOR[t] || TYPE_COLOR.other;
const TYPE_ORDER = ['static', 'blog', 'service', 'host', 'other'];
const typeLabel = (t) => (t === 'other' || t === 'unknown' ? 'Other' : t.charAt(0).toUpperCase() + t.slice(1));

// Physics — tuned for a spring-electrical layout at a few hundred nodes. Forces are
// scaled by a cooling `alpha` so the graph animates in and then settles.
const REPULSION = 900;      // node-node push (Fruchterman–Reingold k²/d)
const SPRING = 0.08;        // edge pull strength
const SPRING_LEN = 64;      // resting edge length
const GRAVITY = 0.05;       // pull toward centre (keeps disconnected bits on screen)
const VELOCITY_DECAY = 0.6; // per-tick velocity retention (heavy damping = stable)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const nodeRadius = (n) => clamp(4 + 2.2 * Math.sqrt(n.inbound || 0), 4, 26);
const isOrphan = (n) => n.links_crawled && (n.inbound || 0) === 0;

export default function SeoNetwork() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selectedId, setSelectedId] = useState(null);
  const [hover, setHover] = useState(null);            // { id, title, path, page_type, inbound, outbound, sx, sy }
  const [activeTypes, setActiveTypes] = useState(null); // Set of enabled page types (null = all)
  const [showLabels, setShowLabels] = useState(true);
  const [highlightOrphans, setHighlightOrphans] = useState(true);
  const [lowInboundOnly, setLowInboundOnly] = useState(false);
  const [query, setQuery] = useState('');

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const probeRef = useRef(null);
  const simRef = useRef(null);      // { nodes:[{...,x,y,vx,vy}], edges:[{s,t}], alpha }
  const viewRef = useRef({ offsetX: 0, offsetY: 0, zoom: 1, W: 0, H: 0, dpr: 1 });
  const themeRef = useRef({ t1: [30, 41, 59], muted: [148, 163, 184], accent: [254, 81, 0] });
  const dragRef = useRef(null);     // active pointer interaction
  const dirtyRef = useRef(true);
  const rafRef = useRef(0);
  const drawRef = useRef(() => {});
  const flagsRef = useRef({});      // draw-affecting state, read fresh inside the loop
  const posCacheRef = useRef(new Map()); // keep positions stable across filter toggles

  // ── Load the graph ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await adminSeoLinkGraph();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || 'Failed to load link network', data: null });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Full set of page types present, for the filter chips.
  const allTypes = useMemo(() => {
    const set = new Set((state.data?.nodes || []).map((n) => n.page_type || 'other'));
    return TYPE_ORDER.filter((t) => set.has(t)).concat([...set].filter((t) => !TYPE_ORDER.includes(t)));
  }, [state.data]);

  const typeOn = useCallback((t) => !activeTypes || activeTypes.has(t), [activeTypes]);

  // ── Build / rebuild the simulation (topology-affecting inputs only) ───────────
  useEffect(() => {
    const data = state.data;
    const cv = canvasRef.current;
    if (!data || !cv) return;
    const { W, H } = viewRef.current;
    const cx = (W || cv.clientWidth || 800) / 2;
    const cy = (H || cv.clientHeight || 500) / 2;

    const visible = (data.nodes || []).filter((n) => {
      if (!typeOn(n.page_type || 'other')) return false;
      if (lowInboundOnly && (n.inbound || 0) > 2) return false;
      return true;
    });
    const cache = posCacheRef.current;
    const byId = new Map();
    const nodes = visible.map((n) => {
      const prev = cache.get(n.id);
      const spread = Math.min(W || 800, H || 500) / 3 || 200;
      const node = {
        ...n,
        x: prev ? prev.x : cx + (Math.random() * 2 - 1) * spread,
        y: prev ? prev.y : cy + (Math.random() * 2 - 1) * spread,
        vx: 0, vy: 0, r: nodeRadius(n),
      };
      byId.set(n.id, node);
      return node;
    });
    const edges = [];
    for (const e of data.edges || []) {
      const s = byId.get(e.source); const t = byId.get(e.target);
      if (s && t) edges.push({ s, t });
    }
    simRef.current = { nodes, edges, alpha: 1 };
    dirtyRef.current = true;
  }, [state.data, activeTypes, lowInboundOnly, typeOn]);

  // Mirror draw-only state into a ref so the rAF loop always sees fresh values.
  useEffect(() => {
    flagsRef.current = { showLabels, highlightOrphans, query: query.trim().toLowerCase(), focusId: hover?.id || selectedId };
    dirtyRef.current = true;
  }, [showLabels, highlightOrphans, query, hover, selectedId]);

  // ── Canvas sizing (DPR-aware) + theme + one rAF loop ──────────────────────────
  // Resolve admin token colours to [r,g,b] via a hidden probe (so canvas strokes can
  // carry an alpha). Reads the text colour the token classes actually compute — theme-
  // agnostic and format-agnostic — rather than guessing the raw custom-property value.
  const readTheme = useCallback(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const parse = (fb) => { const m = getComputedStyle(probe).color.match(/\d+/g); return (m && m.length >= 3) ? [+m[0], +m[1], +m[2]] : fb; };
    probe.style.color = ''; probe.className = 'adm-t1'; const t1 = parse([30, 41, 59]);
    probe.className = 'adm-t3'; const muted = parse([148, 163, 184]);
    probe.className = ''; probe.style.color = 'var(--adm-accent)'; const accent = parse([254, 81, 0]);
    probe.style.color = '';
    themeRef.current = { t1, muted, accent };
    dirtyRef.current = true;
  }, []);

  const resize = useCallback(() => {
    const cv = canvasRef.current; const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth; const H = wrap.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    viewRef.current = { ...viewRef.current, W, H, dpr };
    dirtyRef.current = true;
  }, []);

  const step = useCallback(() => {
    const s = simRef.current; if (!s) return;
    const { nodes, edges } = s;
    const { W, H } = viewRef.current;
    const cx = W / 2; const cy = H / 2;
    const drag = dragRef.current?.node || null;
    s.alpha *= 0.985; if (s.alpha < 0.02) s.alpha = 0;
    const a = s.alpha;
    if (a === 0) return;
    for (const n of nodes) {
      if (n === drag) continue;
      n.vx += (cx - n.x) * GRAVITY * a;
      n.vy += (cy - n.y) * GRAVITY * a;
    }
    for (let i = 0; i < nodes.length; i++) {
      const ni = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j];
        let dx = ni.x - nj.x; let dy = ni.y - nj.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random() * 2 - 1; dy = Math.random() * 2 - 1; }
        const d = Math.sqrt(d2);
        const f = (REPULSION * a) / d;   // k²/d along the unit vector
        const fx = (dx / d) * f; const fy = (dy / d) * f;
        ni.vx += fx; ni.vy += fy; nj.vx -= fx; nj.vy -= fy;
      }
    }
    for (const e of edges) {
      const dx = e.t.x - e.s.x; const dy = e.t.y - e.s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - SPRING_LEN) * SPRING * a;
      const fx = (dx / d) * f; const fy = (dy / d) * f;
      if (e.s !== drag) { e.s.vx += fx; e.s.vy += fy; }
      if (e.t !== drag) { e.t.vx -= fx; e.t.vy -= fy; }
    }
    for (const n of nodes) {
      if (n === drag) { n.vx = 0; n.vy = 0; continue; }
      n.vx *= VELOCITY_DECAY; n.vy *= VELOCITY_DECAY;
      n.x += n.vx; n.y += n.vy;
      posCacheRef.current.set(n.id, { x: n.x, y: n.y });
    }
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current; const s = simRef.current;
    if (!cv || !s) return;
    const ctx = cv.getContext('2d');
    const { W, H, dpr, offsetX, offsetY, zoom } = viewRef.current;
    const { showLabels: labels, highlightOrphans: orphans, query: q, focusId } = flagsRef.current;
    const th = themeRef.current;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    const focus = focusId ? s.nodes.find((n) => n.id === focusId) : null;
    const near = new Set();
    if (focus) { near.add(focus.id); for (const e of s.edges) { if (e.s === focus) near.add(e.t.id); if (e.t === focus) near.add(e.s.id); } }
    const matches = (n) => q && ((n.title || '').toLowerCase().includes(q) || (n.path || '').toLowerCase().includes(q));

    // Edges first, under the nodes.
    for (const e of s.edges) {
      const hot = focus && (e.s === focus || e.t === focus);
      const dim = (focus && !hot) || (q && !matches(e.s) && !matches(e.t));
      ctx.strokeStyle = hot ? rgba(th.accent, 0.9) : rgba(th.muted, dim ? 0.05 : 0.22);
      ctx.lineWidth = (hot ? 1.6 : 1) / zoom;
      ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y); ctx.stroke();
      if (hot) {
        // Arrowhead at the target end shows link direction (source → target).
        const ang = Math.atan2(e.t.y - e.s.y, e.t.x - e.s.x);
        const ax = e.t.x - Math.cos(ang) * (e.t.r + 2); const ay = e.t.y - Math.sin(ang) * (e.t.r + 2);
        const h = 6 / zoom;
        ctx.fillStyle = rgba(th.accent, 0.9);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - Math.cos(ang - 0.5) * h, ay - Math.sin(ang - 0.5) * h);
        ctx.lineTo(ax - Math.cos(ang + 0.5) * h, ay - Math.sin(ang + 0.5) * h);
        ctx.closePath(); ctx.fill();
      }
    }

    // Nodes.
    for (const n of s.nodes) {
      const dim = (focus && !near.has(n.id)) || (q && !matches(n));
      const alpha = dim ? 0.18 : 1;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = typeColor(n.page_type);
      ctx.fill();
      // Rings: red for a non-200 / noindex page; amber for an orphan (no inbound links).
      const bad = (n.http_status && n.http_status !== 200) || n.indexable === false;
      if (bad) { ctx.lineWidth = 2 / zoom; ctx.strokeStyle = '#dc2626'; ctx.stroke(); }
      else if (orphans && isOrphan(n)) { ctx.lineWidth = 2 / zoom; ctx.strokeStyle = '#f59e0b'; ctx.stroke(); }
      if (n.id === focusId || matches(n)) { ctx.lineWidth = 2.5 / zoom; ctx.strokeStyle = rgba(th.accent, 1); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // Labels: only the well-linked hubs (or the focused node), so it stays readable.
    if (labels) {
      ctx.font = `${11 / zoom}px 'Poppins', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const n of s.nodes) {
        const show = n.id === focusId || matches(n) || n.r >= 12;
        if (!show) continue;
        if (focus && !near.has(n.id)) continue;
        const label = n.title || n.path || '';
        const short = label.length > 34 ? `${label.slice(0, 33)}…` : label;
        ctx.fillStyle = rgba(th.t1, 0.92);
        ctx.fillText(short, n.x, n.y + n.r + 2 / zoom);
      }
    }
  }, []);

  useEffect(() => { drawRef.current = draw; });

  // The canvas only mounts once there's a graph to show, so gate the sizing/observer/
  // loop setup on that — otherwise it runs against null refs during the loading state
  // and never re-attaches after data arrives.
  const ready = !state.loading && !state.error && !!state.data?.nodes?.length;
  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return undefined;
    resize(); readTheme();
    const ro = new ResizeObserver(() => resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const mo = new MutationObserver(() => readTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const frame = () => {
      const s = simRef.current;
      if (s && s.alpha > 0) { step(); dirtyRef.current = true; }
      if (dirtyRef.current) { drawRef.current(); dirtyRef.current = false; }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); mo.disconnect(); };
  }, [resize, readTheme, step, ready]);

  // ── Pointer + wheel interaction ───────────────────────────────────────────────
  const toWorld = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const { offsetX, offsetY, zoom } = viewRef.current;
    const sx = clientX - rect.left; const sy = clientY - rect.top;
    return { sx, sy, x: (sx - offsetX) / zoom, y: (sy - offsetY) / zoom };
  };
  const nodeAt = (wx, wy) => {
    const s = simRef.current; if (!s) return null;
    for (let i = s.nodes.length - 1; i >= 0; i--) {
      const n = s.nodes[i]; const dx = n.x - wx; const dy = n.y - wy;
      if (dx * dx + dy * dy <= (n.r + 3) * (n.r + 3)) return n;
    }
    return null;
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const { sx, sy, x, y } = toWorld(e.clientX, e.clientY);
    const n = nodeAt(x, y);
    dragRef.current = n
      ? { node: n, moved: false, downSX: sx, downSY: sy }
      : { pan: true, moved: false, downSX: sx, downSY: sy, startOX: viewRef.current.offsetX, startOY: viewRef.current.offsetY };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    const { sx, sy, x, y } = toWorld(e.clientX, e.clientY);
    if (d) {
      if (Math.abs(sx - d.downSX) + Math.abs(sy - d.downSY) > 4) d.moved = true;
      if (d.node) {
        d.node.x = x; d.node.y = y; d.node.vx = 0; d.node.vy = 0;
        if (simRef.current) simRef.current.alpha = Math.max(simRef.current.alpha, 0.5);
        posCacheRef.current.set(d.node.id, { x, y });
      } else if (d.pan) {
        viewRef.current.offsetX = d.startOX + (sx - d.downSX);
        viewRef.current.offsetY = d.startOY + (sy - d.downSY);
      }
      dirtyRef.current = true;
      return;
    }
    // Hover (no active drag): update tooltip target + follow the cursor.
    const n = nodeAt(x, y);
    if (n) setHover({ id: n.id, title: n.title, path: n.path, page_type: n.page_type, inbound: n.inbound, outbound: n.outbound, links_crawled: n.links_crawled, sx, sy });
    else if (hover) setHover(null);
    if (canvasRef.current) canvasRef.current.style.cursor = n ? 'pointer' : 'grab';
  };
  const onPointerUp = (e) => {
    const d = dragRef.current; dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (d?.node && !d.moved) setSelectedId(d.node.id); // click, not drag → open inspector
  };
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
      const v = viewRef.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const zoom = clamp(v.zoom * factor, 0.15, 4);
      // Keep the point under the cursor fixed while zooming.
      v.offsetX = sx - ((sx - v.offsetX) / v.zoom) * zoom;
      v.offsetY = sy - ((sy - v.offsetY) / v.zoom) * zoom;
      v.zoom = zoom;
      dirtyRef.current = true;
    };
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => cv.removeEventListener('wheel', onWheel);
  }, [ready]);

  // Fit all nodes into view.
  const fit = useCallback(() => {
    const s = simRef.current; const v = viewRef.current;
    if (!s || !s.nodes.length) return;
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const n of s.nodes) { minX = Math.min(minX, n.x - n.r); minY = Math.min(minY, n.y - n.r); maxX = Math.max(maxX, n.x + n.r); maxY = Math.max(maxY, n.y + n.r); }
    const gw = maxX - minX || 1; const gh = maxY - minY || 1;
    const zoom = clamp(Math.min(v.W / gw, v.H / gh) * 0.9, 0.15, 4);
    v.zoom = zoom;
    v.offsetX = v.W / 2 - ((minX + maxX) / 2) * zoom;
    v.offsetY = v.H / 2 - ((minY + maxY) / 2) * zoom;
    dirtyRef.current = true;
  }, []);

  const reheat = useCallback(() => { if (simRef.current) { simRef.current.alpha = 1; dirtyRef.current = true; } }, []);

  const toggleType = (t) => {
    setActiveTypes((prev) => {
      const base = prev || new Set(allTypes);
      const next = new Set(base);
      if (next.has(t)) next.delete(t); else next.add(t);
      if (next.size === 0) return new Set(allTypes); // never blank the canvas
      return next.size === allTypes.length ? null : next;
    });
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const nodes = state.data?.nodes || [];
    const shown = nodes.filter((n) => typeOn(n.page_type || 'other') && !(lowInboundOnly && (n.inbound || 0) > 2));
    const orphanCount = shown.filter(isOrphan).length;
    return { pages: shown.length, links: state.data?.edges?.length || 0, orphans: orphanCount, notCrawled: shown.filter((n) => !n.links_crawled).length };
  }, [state.data, activeTypes, lowInboundOnly, typeOn]);

  // ── Render ─────────────────────────────────────────────────────────────────────
  if (state.loading) return <Skeleton className="h-[70vh]" />;
  if (state.error) {
    return (
      <Card className="text-sm">
        <p className="adm-t2 mb-3">{state.error}</p>
        <Btn size="sm" variant="outline" icon="refresh" onClick={load}>Retry</Btn>
      </Card>
    );
  }
  if (!state.data?.nodes?.length) {
    return (
      <Card className="text-center py-10">
        <p className="adm-t1 font-semibold mb-1">No link network yet</p>
        <p className="adm-t3 text-sm mb-4">Run <b>Run crawl + sync</b> above — the network is built from the latest crawl&apos;s pages and their internal links.</p>
      </Card>
    );
  }

  const chip = (on) => `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium border transition-colors ${on ? 'adm-t1' : 'adm-t3 opacity-55'}`;

  return (
    <div>
      <span ref={probeRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Ic d={IC.search} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 adm-t3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a page…" className="fb-input text-sm w-full pl-8" />
        </div>
        {allTypes.map((t) => (
          <button key={t} onClick={() => toggleType(t)} className={chip(typeOn(t))} style={{ borderColor: typeOn(t) ? typeColor(t) : 'var(--adm-border)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: typeColor(t) }} />{typeLabel(t)}
          </button>
        ))}
        <button onClick={() => setLowInboundOnly((v) => !v)} className={chip(lowInboundOnly)} style={{ borderColor: lowInboundOnly ? 'var(--adm-warn)' : 'var(--adm-border)' }} title="Show only pages with 2 or fewer inbound links">Weakly linked</button>
        <button onClick={() => setHighlightOrphans((v) => !v)} className={chip(highlightOrphans)} style={{ borderColor: highlightOrphans ? 'var(--adm-warn)' : 'var(--adm-border)' }}>Ring orphans</button>
        <button onClick={() => setShowLabels((v) => !v)} className={chip(showLabels)} style={{ borderColor: 'var(--adm-border)' }}>Labels</button>
        <div className="flex gap-1.5 ml-auto">
          <Btn size="sm" variant="outline" onClick={fit}>Fit</Btn>
          <Btn size="sm" variant="outline" icon="refresh" onClick={reheat}>Re-layout</Btn>
        </div>
      </div>

      {/* Stat strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[12px] adm-t3">
        <span><b className="adm-t1">{stats.pages}</b> pages</span>
        <span><b className="adm-t1">{stats.links}</b> internal links</span>
        <span className={stats.orphans ? '' : 'opacity-60'}><b style={{ color: stats.orphans ? 'var(--adm-warn)' : undefined }}>{stats.orphans}</b> orphans (no inbound links)</span>
        {stats.notCrawled > 0 && <span className="opacity-80">· {stats.notCrawled} host/service pages are meta-only — their outbound links aren&apos;t mapped yet</span>}
      </div>

      {/* Canvas */}
      <Card className="p-0 overflow-hidden">
        <div ref={wrapRef} className="relative w-full" style={{ height: '68vh', minHeight: 460 }}>
          <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none select-none"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
          />
          {/* Hover tooltip */}
          {hover && hover.sx != null && (
            <div className="absolute z-10 pointer-events-none rounded-lg px-2.5 py-1.5 text-[11.5px] shadow-lg adm-card border"
              style={{ left: clamp(hover.sx + 12, 0, (viewRef.current.W || 400) - 220), top: Math.max(0, hover.sy + 12), maxWidth: 220 }}>
              <div className="font-semibold adm-t1 truncate">{hover.title || hover.path}</div>
              <div className="adm-t3 truncate">{hover.path}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: typeColor(hover.page_type) }} />{typeLabel(hover.page_type)}</span>
                <span className="adm-t2">· {hover.inbound} in / {hover.outbound} out</span>
              </div>
              {!hover.links_crawled && <div className="adm-t3 mt-0.5">outbound links not crawled</div>}
            </div>
          )}
          {/* Legend */}
          <div className="absolute bottom-2 left-2 rounded-lg adm-card border px-2.5 py-1.5 text-[10.5px] adm-t3 leading-relaxed">
            <div className="font-semibold adm-t2 mb-0.5">Dot size = inbound links</div>
            <div className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#f59e0b' }} /> orphan &nbsp; <span className="inline-block w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#dc2626' }} /> noindex / error</div>
          </div>
        </div>
      </Card>

      {selectedId && <SeoInspector pageId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
