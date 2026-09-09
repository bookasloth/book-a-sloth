// AdminSeo.jsx — /admin/seo control center. A secondary rail switches between the
// Dashboard, list-first views (Services / Profiles / Blog / Pages) each with a
// right-side inspector drawer, and the operational tabs (Issues / Fixes / Search
// Console). View is the :view route param so every tab is a real, linkable URL.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import { PageHeader, Card, Badge, Skeleton, Btn } from '../../components/admin/ui';
import {
  adminSeoIssues, adminSeoFixes, adminSeoGenerateFixes, adminSeoDecideFix,
  adminSeoApplyFix, adminSeoMarkApplied, adminSeoRollbackFix, adminSeoRetestFix,
  adminSeoRunCrawl, adminSeoCrawlStatus, adminSeoMuteIssue, adminSeoGsc, adminSeoGscSync,
} from '../../services/api';
import SeoDashboard from '../../components/admin/seo/SeoDashboard';
import SeoList from '../../components/admin/seo/SeoList';

const VIEWS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'services', label: 'Services', icon: 'layers' },
  { key: 'profiles', label: 'Profiles', icon: 'users' },
  { key: 'blogs', label: 'Blog', icon: 'news' },
  { key: 'pages', label: 'Pages', icon: 'file' },
  { key: 'issues', label: 'Issues', icon: 'alert' },
  { key: 'fixes', label: 'Fixes', icon: 'checkCircle' },
  { key: 'search-console', label: 'Search Console', icon: 'search' },
];

const SEVERITY_TONE = { P0: 'danger', P1: 'danger', P2: 'warn', P3: 'neutral', P4: 'neutral' };
const LEVEL_TONE = { AUTO: 'ok', REVIEW: 'warn', DO_NOT: 'danger' };
const CATEGORIES = ['technical', 'onpage', 'content', 'semantic', 'structured_data', 'indexability', 'internal_linking'];

export default function AdminSeo() {
  const { view = 'dashboard' } = useParams();
  const [crawling, setCrawling] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const runCrawl = async () => {
    setCrawling(true);
    try {
      const { data } = await adminSeoRunCrawl();
      let status = 'running';
      let ticks = 0;
      const MAX_TICKS = 60; // ponytail: bounded ~2min poll, add backoff if crawls run longer.
      while (status === 'running' && ticks < MAX_TICKS && mountedRef.current) {
        await new Promise((r) => setTimeout(r, 2000)); // eslint-disable-line no-await-in-loop
        if (!mountedRef.current) break;
        const res = await adminSeoCrawlStatus(data.crawlId); // eslint-disable-line no-await-in-loop
        status = res.data.crawl?.status;
        ticks += 1;
      }
      if (!mountedRef.current) return;
      toast[status ? 'success' : 'error'](status ? 'Crawl finished — reopen a view to see fresh scores' : 'Crawl still running — check back shortly.');
    } catch (e) {
      if (mountedRef.current) toast.error(e.response?.data?.message || 'Crawl failed');
    } finally {
      if (mountedRef.current) setCrawling(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="SEO & GEO"
        subtitle="Traditional search health + AI/GEO readiness. List → inspect → diagnose → fix → measure."
        actions={<Btn variant="primary" size="sm" icon="refresh" onClick={runCrawl} disabled={crawling}>{crawling ? 'Crawling…' : 'Run crawl'}</Btn>}
      />

      {/* Secondary rail */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {VIEWS.map((v) => {
          const active = view === v.key;
          return (
            <Link key={v.key} to={`/admin/seo/${v.key}`}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${active ? 'text-white' : 'adm-t2 adm-hoverable'}`}
              style={active ? { background: 'var(--adm-accent)' } : undefined}>
              <Ic d={IC[v.icon]} size={14} />{v.label}
            </Link>
          );
        })}
      </div>

      {view === 'dashboard' && <SeoDashboard />}
      {view === 'services' && <SeoList type="service" />}
      {view === 'profiles' && <SeoList type="host" />}
      {view === 'blogs' && <SeoList type="blog" />}
      {view === 'pages' && <SeoList type="static,unknown" />}
      {view === 'issues' && <IssuesTab />}
      {view === 'fixes' && <FixesTab />}
      {view === 'search-console' && <GscTab />}
    </div>
  );
}

// ── Issues (operational) ─────────────────────────────────────────────────────
function IssuesTab() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (severity) params.severity = severity;
      if (category) params.category = category;
      const res = await adminSeoIssues(params);
      setIssues(res.data.issues || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load SEO issues');
      setIssues([]);
    } finally { setLoading(false); }
  }, [severity, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select className="fb-input text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {['P0', 'P1', 'P2', 'P3', 'P4'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="fb-input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <Skeleton className="h-40" /> : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
              <th className="text-left py-2 px-4">Severity</th>
              <th className="text-left py-2 px-4">Category</th>
              <th className="text-left py-2 px-4">Title</th>
            </tr></thead>
            <tbody>
              {issues.map((iss) => (
                <tr key={iss.id} className="border-b adm-border last:border-0 cursor-pointer adm-hoverable" onClick={() => setSelected(iss)}>
                  <td className="py-2 px-4"><Badge tone={SEVERITY_TONE[iss.severity]}>{iss.severity}</Badge></td>
                  <td className="py-2 px-4 capitalize">{iss.category}</td>
                  <td className="py-2 px-4">{iss.title}</td>
                </tr>
              ))}
              {!issues.length && <tr><td colSpan={3} className="py-6 text-center adm-t3">No issues found.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {selected && <IssueDrawer issue={selected} onClose={() => setSelected(null)} onMuted={load} />}
    </div>
  );
}

function IssueDrawer({ issue, onClose, onMuted }) {
  const [muting, setMuting] = useState(false);
  const mute = async () => {
    setMuting(true);
    try {
      await adminSeoMuteIssue(issue.id, { ruleType: true });
      toast.success('Issue muted'); onMuted?.(); onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Mute failed'); } finally { setMuting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto adm-canvas shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold adm-t1">{issue.title}</h2>
          <button onClick={onClose} className="adm-t3" aria-label="Close">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div><span className="adm-t3">Severity</span><div><Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge></div></div>
          <div><span className="adm-t3">Category</span><div className="capitalize">{issue.category}</div></div>
          {issue.detail && <div><span className="adm-t3">Why it matters</span><div>{issue.detail}</div></div>}
          {issue.affected_url && <div><span className="adm-t3">Affected URL</span><div className="break-all">{issue.affected_url}</div></div>}
          {issue.evidence && <div><span className="adm-t3">Evidence</span><pre className="text-xs adm-card p-2 rounded whitespace-pre-wrap">{typeof issue.evidence === 'string' ? issue.evidence : JSON.stringify(issue.evidence, null, 2)}</pre></div>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium adm-t2 adm-hoverable">Cancel</button>
          <button onClick={mute} disabled={muting} className="rounded-lg bg-[#FE5100] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">{muting ? 'Muting…' : 'Mute this type'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Fixes (Phase 2/3 queue) ──────────────────────────────────────────────────
function FixesTab() {
  const [fixes, setFixes] = useState([]);
  const [summary, setSummary] = useState({});
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('proposed');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (level) params.approvalLevel = level;
      const res = await adminSeoFixes(params);
      setFixes(res.data.fixes || []);
      setSummary(res.data.summary || {});
      setDryRun(res.data.dryRun !== false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load fixes');
      setFixes([]);
    } finally { setLoading(false); }
  }, [level, status]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await adminSeoGenerateFixes();
      if (data.skipped) toast(data.skipped); else toast.success(`Proposed ${data.proposed} fix(es)`);
      await load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate proposals'); } finally { setGenerating(false); }
  };

  const byLevel = summary.byLevel || {};
  return (
    <div>
      <Card className="mb-4 text-sm flex items-center justify-between">
        <div>
          {dryRun ? <Badge tone="warn">DRY RUN</Badge> : <Badge tone="danger">LIVE APPLY</Badge>}
          <span className="ml-3 adm-t3">Proposals only — approving stages a fix; nothing publishes in this phase.</span>
        </div>
        <Btn variant="primary" size="sm" onClick={generate} disabled={generating}>{generating ? 'Generating…' : 'Generate proposals'}</Btn>
      </Card>
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <select className="fb-input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['proposed', 'approved', 'applied', 'failed', 'rejected', 'rolled_back', ''].map((s) => <option key={s || 'all'} value={s}>{s || 'all statuses'}</option>)}
        </select>
        <select className="fb-input text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {['AUTO', 'REVIEW', 'DO_NOT'].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex gap-2">{['AUTO', 'REVIEW', 'DO_NOT'].map((l) => <Badge key={l} tone={LEVEL_TONE[l]}>{l}: {byLevel[l] || 0}</Badge>)}</div>
      </div>
      {loading ? <Skeleton className="h-40" /> : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
              <th className="text-left py-2 px-4">Level</th>
              <th className="text-left py-2 px-4">Rule</th>
              <th className="text-left py-2 px-4">URL</th>
              <th className="text-left py-2 px-4">Target</th>
              <th className="text-left py-2 px-4">Evidence</th>
            </tr></thead>
            <tbody>
              {fixes.map((f) => (
                <tr key={f.id} className="border-b adm-border last:border-0 cursor-pointer adm-hoverable" onClick={() => setSelected(f)}>
                  <td className="py-2 px-4"><Badge tone={LEVEL_TONE[f.approval_level] || 'neutral'}>{f.approval_level}</Badge></td>
                  <td className="py-2 px-4">{f.rule_key}</td>
                  <td className="py-2 px-4 break-all">{f.url}</td>
                  <td className="py-2 px-4">{f.target}</td>
                  <td className="py-2 px-4">{f.evidence_maturity || '—'}</td>
                </tr>
              ))}
              {!fixes.length && <tr><td colSpan={5} className="py-6 text-center adm-t3">No proposals — run Generate proposals after a crawl.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {selected && <FixDrawer fix={selected} onClose={() => setSelected(null)} onDecided={load} />}
    </div>
  );
}

function FixDrawer({ fix, onClose, onDecided }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const run = async (fn, okMsg) => {
    setBusy(true); setNote(null);
    try {
      const res = await fn();
      const d = res?.data || {};
      if (d.ok === false) {
        setNote(d.message || d.reason || 'No change applied.');
        if (d.dryRun) toast('DRY_RUN — nothing applied.'); else if (d.requiresPr) toast('Land this as a PR, then Mark applied.'); else toast(d.message || 'No change applied.');
      } else if (d.retest) {
        toast(d.resolved ? 'Re-test: issue resolved ✓' : 'Re-test: issue still present');
        setNote(`Re-test → ${d.retest.status} · health ${d.retest.health}${d.resolved != null ? ` · resolved: ${d.resolved}` : ''}`);
      } else { toast.success(okMsg); onDecided?.(); onClose(); return; }
      onDecided?.();
    } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); } finally { setBusy(false); }
  };
  const st = fix.status;
  const canApprove = fix.approval_level !== 'DO_NOT';
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto adm-canvas shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold adm-t1">{fix.rule_key}</h2>
          <button onClick={onClose} className="adm-t3" aria-label="Close">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2"><Badge tone={LEVEL_TONE[fix.approval_level] || 'neutral'}>{fix.approval_level}</Badge><Badge tone="neutral">{st}</Badge></div>
          <div><span className="adm-t3">URL</span><div className="break-all">{fix.url}</div></div>
          <div><span className="adm-t3">Target / field</span><div>{fix.target}{fix.field ? ` · ${fix.field}` : ''}</div></div>
          {fix.reason && <div><span className="adm-t3">Reason</span><div>{fix.reason}</div></div>}
          {fix.new_value != null && (
            <div><span className="adm-t3">Change</span><pre className="text-xs adm-card p-2 rounded whitespace-pre-wrap"><span className="text-red-600">- {fix.old_value ?? '(none)'}</span>{'\n'}<span className="text-green-700">+ {fix.new_value}</span></pre></div>
          )}
          {fix.new_value == null && <div><span className="adm-t3">Content context</span><pre className="text-xs adm-card p-2 rounded whitespace-pre-wrap">{JSON.stringify(fix.context || {}, null, 2)}</pre></div>}
          {fix.test_after && Object.keys(fix.test_after).length > 0 && (
            <div><span className="adm-t3">Re-test</span><div>{fix.test_after.status} · health {fix.test_after.health} · resolved: {String(fix.test_after.resolved)}</div></div>
          )}
          {note && <div className="text-xs rounded bg-amber-50 text-amber-800 p-2">{note}</div>}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={() => run(() => adminSeoRetestFix(fix.id))} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-medium adm-t2 adm-hoverable disabled:opacity-50">Re-test</button>
          {st === 'proposed' && (
            <>
              <button onClick={() => run(() => adminSeoDecideFix(fix.id, { decision: 'reject' }), 'Rejected')} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-medium adm-t2 adm-hoverable disabled:opacity-50">Reject</button>
              {canApprove && <button onClick={() => run(() => adminSeoDecideFix(fix.id, { decision: 'approve' }), 'Approved (staged)')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Approve (stage)</button>}
            </>
          )}
          {st === 'approved' && (
            fix.target === 'db_field'
              ? <button onClick={() => run(() => adminSeoApplyFix(fix.id), 'Applied')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Apply</button>
              : <button onClick={() => run(() => adminSeoMarkApplied(fix.id, {}), 'Marked applied')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Mark applied (PR landed)</button>
          )}
          {(st === 'applied' || st === 'failed') && (
            <button onClick={() => run(() => adminSeoRollbackFix(fix.id), 'Rolled back')} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Rollback</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Search Console ───────────────────────────────────────────────────────────
function GscTab() {
  const [gsc, setGsc] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const loadGsc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSeoGsc();
      setGsc(res.data.gsc || []);
      setConfigured(!!res.data.configured);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load Search Console data'); setGsc([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadGsc(); }, [loadGsc]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await adminSeoGscSync();
      if (res.data.configured === false) toast.error('Search Console not connected — set GSC_SA_KEY / GSC_PROPERTY');
      else { toast.success('Sync started — refreshing in ~30s'); setTimeout(() => { if (mountedRef.current) loadGsc(); }, 30000); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to start sync'); } finally { if (mountedRef.current) setSyncing(false); }
  };

  if (loading) return <Skeleton className="h-40" />;
  return (
    <div>
      {!configured && <Card className="mb-4 text-sm">Google Search Console not connected — set GSC_SA_KEY and GSC_PROPERTY to enable.</Card>}
      <div className="flex justify-end mb-3"><Btn variant="primary" size="sm" icon="refresh" onClick={runSync} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync GSC now'}</Btn></div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
            <th className="text-left py-2 px-4">URL</th>
            <th className="text-left py-2 px-4">Coverage</th>
            <th className="text-right py-2 px-4">Impressions</th>
            <th className="text-right py-2 px-4">Clicks</th>
            <th className="text-right py-2 px-4">Position</th>
          </tr></thead>
          <tbody>
            {gsc.map((row) => (
              <tr key={row.id || row.url} className="border-b adm-border last:border-0">
                <td className="py-2 px-4 break-all">{row.url}</td>
                <td className="py-2 px-4">{row.coverage_state || '—'}</td>
                <td className="py-2 px-4 text-right">{row.impressions ?? 0}</td>
                <td className="py-2 px-4 text-right">{row.clicks ?? 0}</td>
                <td className="py-2 px-4 text-right">{row.position != null ? Math.round(row.position) : '—'}</td>
              </tr>
            ))}
            {!gsc.length && <tr><td colSpan={5} className="py-6 text-center adm-t3">{configured ? 'No Search Console data yet — runs on the next gsc-sync' : 'No data — connect Search Console to enable.'}</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
