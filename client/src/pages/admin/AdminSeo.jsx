// AdminSeo.jsx — /admin/seo read-only SEO audit dashboard. Mirrors AdminGstOverview's
// load/loading/toast shape. Three tabs: Overview (scores + crawl-stats + run-crawl),
// Issues (filterable table + detail drawer + mute), Pages (crawled-page table).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, StatCard, Badge, Skeleton } from '../../components/admin/ui';
import {
  adminSeoOverview, adminSeoIssues, adminSeoReports,
  adminSeoCategories, adminSeoChanges,
  adminSeoFixes, adminSeoGenerateFixes, adminSeoDecideFix,
  adminSeoApplyFix, adminSeoMarkApplied, adminSeoRollbackFix, adminSeoRetestFix,
  adminSeoRunCrawl, adminSeoCrawlStatus, adminSeoMuteIssue, adminSeoGsc, adminSeoGscSync,
} from '../../services/api';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'issues', label: 'Issues' },
  { key: 'categories', label: 'Categories' },
  { key: 'pages', label: 'Pages' },
  { key: 'fixes', label: 'Fixes' },
  { key: 'gsc', label: 'Search Console' },
];

const SEVERITY_TONE = { P0: 'danger', P1: 'danger', P2: 'warn', P3: 'neutral', P4: 'neutral' };
const STATUS_TONE = { PASS: 'ok', WARNING: 'warn', FAIL: 'danger' };
const LEVEL_TONE = { AUTO: 'ok', REVIEW: 'warn', DO_NOT: 'danger' };
const MATURITY_TONE = { NEW: 'neutral', DEVELOPING: 'neutral', ESTABLISHED: 'ok', STRONG: 'ok' };
const CATEGORIES = ['technical', 'onpage', 'content', 'semantic', 'structured_data', 'indexability', 'internal_linking'];
const actionFor = (p) => (p.status === 'FAIL' ? 'Fix critical issue' : p.status === 'WARNING' ? 'Review warnings' : 'OK');

export default function AdminSeo() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSeoOverview();
      setOverview(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load SEO overview');
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const runCrawl = async () => {
    setCrawling(true);
    try {
      const { data } = await adminSeoRunCrawl();
      let status = 'running';
      let ticks = 0;
      const MAX_TICKS = 60; // ponytail: bounded poll (~2min at 2s/tick), add backoff if crawls run longer.
      while (status === 'running' && ticks < MAX_TICKS && mountedRef.current) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 2000));
        if (!mountedRef.current) break;
        // eslint-disable-next-line no-await-in-loop
        const res = await adminSeoCrawlStatus(data.crawlId);
        status = res.data.crawl?.status;
        ticks += 1;
      }
      if (!mountedRef.current) return;
      if (!status) {
        toast('Crawl still running — check back shortly.');
      } else {
        toast.success('Crawl finished');
      }
      await loadOverview();
    } catch (e) {
      if (mountedRef.current) toast.error(e.response?.data?.message || 'Crawl failed');
    } finally {
      if (mountedRef.current) setCrawling(false);
    }
  };

  const scores = overview?.scores || {};
  const crawl = overview?.crawl || {};
  const counts = overview?.counts || {};

  return (
    <div>
      <PageHeader
        title="SEO"
        subtitle="Read-only site audit — crawl findings, scores, and issues."
        actions={
          <button
            onClick={runCrawl}
            disabled={crawling}
            className="adm-btn adm-btn-primary text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            {crawling ? 'Crawling…' : 'Run crawl now'}
          </button>
        }
      />

      <div className="flex gap-2 mb-6 border-b adm-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-b-2' : 'adm-t3'}`}
            style={tab === t.key ? { borderColor: 'var(--adm-accent)', color: 'var(--adm-accent)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !overview ? (
          <Card>Could not load SEO data.</Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <StatCard label="Overall" value={scores.overall ?? '—'} sub="Composite health score" />
              <StatCard label="Technical" value={scores.technical ?? '—'} />
              <StatCard label="On-page" value={scores.onpage ?? '—'} />
              <StatCard label="Content" value={scores.content ?? '—'} />
              <StatCard label="Indexability" value={scores.indexability ?? '—'} />
              <StatCard label="Internal linking" value={scores.internal_linking ?? '—'} />
            </div>

            <Card>
              <div className="text-sm font-semibold mb-3">Last crawl</div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div><span className="adm-t3">Status</span><div className="font-medium">{crawl.status || '—'}</div></div>
                <div><span className="adm-t3">Pages crawled</span><div className="font-medium">{crawl.page_count ?? '—'}</div></div>
                <div><span className="adm-t3">Issues found</span><div className="font-medium">{crawl.issue_count ?? '—'}</div></div>
                <div><span className="adm-t3">Started</span><div className="font-medium">{crawl.started_at ? new Date(crawl.started_at).toLocaleString() : '—'}</div></div>
                <div className="flex gap-2 items-center">
                  {['P0', 'P1', 'P2', 'P3', 'P4'].map((sev) => (
                    <Badge key={sev} tone={SEVERITY_TONE[sev]}>{sev}: {counts[sev] ?? 0}</Badge>
                  ))}
                </div>
              </div>
            </Card>
            <ChangesCard />
          </>
        )
      )}

      {tab === 'issues' && <IssuesTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'pages' && <PagesTab />}
      {tab === 'fixes' && <FixesTab />}
      {tab === 'gsc' && <GscTab />}
    </div>
  );
}

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
    } finally {
      setLoading(false);
    }
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

      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
              <th className="text-left py-2 px-4">Severity</th>
              <th className="text-left py-2 px-4">Category</th>
              <th className="text-left py-2 px-4">Title</th>
            </tr></thead>
            <tbody>
              {issues.map((iss) => (
                <tr key={iss.id} className="border-b adm-border last:border-0 cursor-pointer hover:adm-hover" onClick={() => setSelected(iss)}>
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
      toast.success('Issue muted');
      onMuted?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Mute failed');
    } finally {
      setMuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">{issue.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div><span className="text-gray-500">Severity</span><div><Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge></div></div>
          <div><span className="text-gray-500">Category</span><div className="capitalize">{issue.category}</div></div>
          {issue.detail && <div><span className="text-gray-500">Why it matters</span><div>{issue.detail}</div></div>}
          {issue.affected_url && <div><span className="text-gray-500">Affected URL</span><div className="break-all">{issue.affected_url}</div></div>}
          {issue.evidence && <div><span className="text-gray-500">Evidence</span><pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{typeof issue.evidence === 'string' ? issue.evidence : JSON.stringify(issue.evidence, null, 2)}</pre></div>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={mute} disabled={muting} className="rounded-lg bg-[#FE5100] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">
            {muting ? 'Muting…' : 'Mute this type'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Change summary since the previous crawl (historical baseline, spec §1h).
function ChangesCard() {
  const [c, setC] = useState(null);
  useEffect(() => {
    (async () => {
      try { const res = await adminSeoChanges(); setC(res.data); } catch { /* non-blocking */ }
    })();
  }, []);
  if (!c || !c.previous) return null;
  return (
    <Card className="mt-4">
      <div className="text-sm font-semibold mb-3">Since previous crawl</div>
      <div className="flex flex-wrap gap-6 text-sm">
        <div><span className="adm-t3">Issues now</span><div className="font-medium">{c.total_latest}</div></div>
        <div><span className="adm-t3">New</span><div className="font-medium text-red-600">+{c.added}</div></div>
        <div><span className="adm-t3">Resolved</span><div className="font-medium" style={{ color: 'var(--adm-ok)' }}>−{c.resolved}</div></div>
        <div><span className="adm-t3">Was</span><div className="font-medium">{c.total_previous}</div></div>
      </div>
    </Card>
  );
}

function CategoriesTab() {
  const [rollups, setRollups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminSeoCategories();
        setRollups(res.data.rollups || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load category rollups');
        setRollups([]);
      } finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <Skeleton className="h-40" />;
  return (
    <Card className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
          <th className="text-left py-2 px-4">Category</th>
          <th className="text-right py-2 px-4">Pages</th>
          <th className="text-right py-2 px-4">Indexable</th>
          <th className="text-right py-2 px-4">Pass</th>
          <th className="text-right py-2 px-4">Warn</th>
          <th className="text-right py-2 px-4">Fail</th>
          <th className="text-right py-2 px-4">Avg health</th>
          <th className="text-right py-2 px-4">Critical</th>
          <th className="text-right py-2 px-4">Meta unique</th>
        </tr></thead>
        <tbody>
          {rollups.map((r) => (
            <tr key={r.category} className="border-b adm-border last:border-0">
              <td className="py-2 px-4 font-medium">{r.category}</td>
              <td className="py-2 px-4 text-right">{r.total}</td>
              <td className="py-2 px-4 text-right">{r.indexable}</td>
              <td className="py-2 px-4 text-right" style={{ color: 'var(--adm-ok)' }}>{r.pass}</td>
              <td className="py-2 px-4 text-right" style={{ color: 'var(--adm-warn)' }}>{r.warning}</td>
              <td className="py-2 px-4 text-right" style={{ color: 'var(--adm-danger)' }}>{r.fail}</td>
              <td className="py-2 px-4 text-right">{r.avg_health}</td>
              <td className="py-2 px-4 text-right">{r.critical_issues}</td>
              <td className="py-2 px-4 text-right">{r.metadata_uniqueness}%</td>
            </tr>
          ))}
          {!rollups.length && <tr><td colSpan={9} className="py-6 text-center adm-t3">No crawled pages yet.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

function PagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminSeoReports();
        setPages(res.data.pages || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load crawled pages');
        setPages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Skeleton className="h-40" />;

  const shown = status ? pages.filter((p) => p.status === status) : pages;

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select className="fb-input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PASS', 'WARNING', 'FAIL'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] uppercase tracking-wide adm-t3 border-b adm-border">
            <th className="text-left py-2 px-4">URL</th>
            <th className="text-left py-2 px-4">Type</th>
            <th className="text-center py-2 px-4">Status</th>
            <th className="text-right py-2 px-4">Health</th>
            <th className="text-right py-2 px-4">Issues</th>
            <th className="text-left py-2 px-4">Evidence</th>
            <th className="text-left py-2 px-4">Action</th>
          </tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id || p.url} className="border-b adm-border last:border-0">
                <td className="py-2 px-4 break-all">{p.url}</td>
                <td className="py-2 px-4">{p.page_type}</td>
                <td className="py-2 px-4 text-center"><Badge tone={STATUS_TONE[p.status] || 'neutral'}>{p.status}</Badge></td>
                <td className="py-2 px-4 text-right">{p.health}</td>
                <td className="py-2 px-4 text-right">{p.issue_count}</td>
                <td className="py-2 px-4"><Badge tone={MATURITY_TONE[p.evidence_maturity] || 'neutral'} title={`Seen in ${p.evidence_seen} crawl(s)`}>{p.evidence_maturity}</Badge></td>
                <td className="py-2 px-4 adm-t3">{actionFor(p)}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="py-6 text-center adm-t3">No crawled pages yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

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
      if (data.skipped) toast(data.skipped);
      else toast.success(`Proposed ${data.proposed} fix(es)`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate proposals');
    } finally { setGenerating(false); }
  };

  const byLevel = summary.byLevel || {};

  return (
    <div>
      <Card className="mb-4 text-sm flex items-center justify-between">
        <div>
          {dryRun ? <Badge tone="warn">DRY RUN</Badge> : <Badge tone="danger">LIVE APPLY</Badge>}
          <span className="ml-3 adm-t3">Proposals only — approving stages a fix; nothing publishes in this phase.</span>
        </div>
        <button onClick={generate} disabled={generating} className="adm-btn adm-btn-primary text-sm px-3 py-1.5 rounded-lg disabled:opacity-50">
          {generating ? 'Generating…' : 'Generate proposals'}
        </button>
      </Card>

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <select className="fb-input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['proposed', 'approved', 'applied', 'failed', 'rejected', 'rolled_back', ''].map((s) => <option key={s || 'all'} value={s}>{s || 'all statuses'}</option>)}
        </select>
        <select className="fb-input text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {['AUTO', 'REVIEW', 'DO_NOT'].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex gap-2">
          {['AUTO', 'REVIEW', 'DO_NOT'].map((l) => <Badge key={l} tone={LEVEL_TONE[l]}>{l}: {byLevel[l] || 0}</Badge>)}
        </div>
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
                <tr key={f.id} className="border-b adm-border last:border-0 cursor-pointer hover:adm-hover" onClick={() => setSelected(f)}>
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
        // Not applied — explain why (dry-run, needs PR, needs config).
        setNote(d.message || d.reason || 'No change applied.');
        if (d.dryRun) toast('DRY_RUN — nothing applied.');
        else if (d.requiresPr) toast('Land this as a PR, then Mark applied.');
        else toast(d.message || 'No change applied.');
      } else if (d.retest) {
        toast(d.resolved ? 'Re-test: issue resolved ✓' : 'Re-test: issue still present');
        setNote(`Re-test → ${d.retest.status} · health ${d.retest.health}${d.resolved != null ? ` · resolved: ${d.resolved}` : ''}`);
      } else {
        toast.success(okMsg);
        onDecided?.(); onClose(); return;
      }
      onDecided?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally { setBusy(false); }
  };

  const st = fix.status;
  const canApprove = fix.approval_level !== 'DO_NOT';
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">{fix.rule_key}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <Badge tone={LEVEL_TONE[fix.approval_level] || 'neutral'}>{fix.approval_level}</Badge>
            <Badge tone="neutral">{st}</Badge>
          </div>
          <div><span className="text-gray-500">URL</span><div className="break-all">{fix.url}</div></div>
          <div><span className="text-gray-500">Target / field</span><div>{fix.target}{fix.field ? ` · ${fix.field}` : ''}</div></div>
          {fix.reason && <div><span className="text-gray-500">Reason</span><div>{fix.reason}</div></div>}
          {fix.new_value != null && (
            <div>
              <span className="text-gray-500">Change</span>
              <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap"><span className="text-red-600">- {fix.old_value ?? '(none)'}</span>{'\n'}<span className="text-green-700">+ {fix.new_value}</span></pre>
            </div>
          )}
          {fix.new_value == null && (
            <div><span className="text-gray-500">Content context</span><pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{JSON.stringify(fix.context || {}, null, 2)}</pre></div>
          )}
          {fix.test_after && Object.keys(fix.test_after).length > 0 && (
            <div><span className="text-gray-500">Re-test</span><div>{fix.test_after.status} · health {fix.test_after.health} · resolved: {String(fix.test_after.resolved)}</div></div>
          )}
          {note && <div className="text-xs rounded bg-amber-50 text-amber-800 p-2">{note}</div>}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={() => run(() => adminSeoRetestFix(fix.id))} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">Re-test</button>
          {st === 'proposed' && (
            <>
              <button onClick={() => run(() => adminSeoDecideFix(fix.id, { decision: 'reject' }), 'Rejected')} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">Reject</button>
              {canApprove && <button onClick={() => run(() => adminSeoDecideFix(fix.id, { decision: 'approve' }), 'Approved (staged)')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Approve (stage)</button>}
            </>
          )}
          {st === 'approved' && (
            <>
              {fix.target === 'db_field'
                ? <button onClick={() => run(() => adminSeoApplyFix(fix.id), 'Applied')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Apply</button>
                : <button onClick={() => run(() => adminSeoMarkApplied(fix.id, {}), 'Marked applied')} disabled={busy} className="rounded-lg bg-[#FE5100] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">Mark applied (PR landed)</button>}
            </>
          )}
          {(st === 'applied' || st === 'failed') && (
            <button onClick={() => run(() => adminSeoRollbackFix(fix.id), 'Rolled back')} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Rollback</button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load Search Console data');
      setGsc([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGsc(); }, [loadGsc]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await adminSeoGscSync();
      if (res.data.configured === false) {
        toast.error('Search Console not connected — set GSC_SA_KEY / GSC_PROPERTY');
      } else {
        toast.success('Sync started — refreshing in ~30s');
        setTimeout(() => { if (mountedRef.current) loadGsc(); }, 30000);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start sync');
    } finally {
      if (mountedRef.current) setSyncing(false);
    }
  };

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div>
      {!configured && (
        <Card className="mb-4 text-sm">
          Google Search Console not connected — set GSC_SA_KEY and GSC_PROPERTY to enable.
        </Card>
      )}
      <div className="flex justify-end mb-3">
        <button
          onClick={runSync}
          disabled={syncing}
          className="adm-btn adm-btn-primary text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync GSC now'}
        </button>
      </div>
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
            {!gsc.length && (
              <tr><td colSpan={5} className="py-6 text-center adm-t3">
                {configured ? 'No Search Console data yet — runs on the next gsc-sync' : 'No data — connect Search Console to enable.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
