import { useEffect, useState, useCallback, useRef } from 'react';
import { PageHeader, Card, Btn, Badge, Table, Skeleton } from '../../../components/admin/ui';
import LeadDrawer from './LeadDrawer';
import {
  crmListLeads, crmCreateLead, crmBulk, crmLeadsExportCsv, crmImportPreview, crmImportCommit,
  crmListTags, crmCreateTag, crmUpdateTag, crmDeleteTag, crmDashboard, crmListFollowUps,
  crmUpdateLead, crmSetStatus, crmAddTag, crmRemoveTag,
  crmListViews, crmCreateView, crmDeleteView,
} from '../../../services/api';
import LeadsBoard from './LeadsBoard';
import { ALL_STATUSES, STATUS_LABEL, STATUS_TONE, SOURCES, SMART_VIEWS, rupees, relTime } from './salesConstants';
import { colorMap, TAG_PALETTE, swatchClass } from './salesTagColors';
import TagChip from './TagChip';
import TagPicker from './TagPicker';
import MetricStrip from './MetricStrip';
import EmptyState from './EmptyState';
import { InlineText, InlineStatus } from './InlineCell';
import CommandPalette from './CommandPalette';
import toast from 'react-hot-toast';

const PAGE_SIZE = 25;

// Minimal CSV parse (handles quoted fields + escaped quotes).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; } if (c === '\r' && text[i + 1] === '\n') i++; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const HEADER_MAP = { name: 'name', phone: 'phone', whatsapp: 'whatsapp', email: 'email', business: 'business', company: 'business', profession: 'profession', city: 'city', source: 'source', tags: 'tags' };

export default function SalesLeads() {
  const [drawerId, setDrawerId] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');          // debounced query
  const [view, setView] = useState('all');   // smart-view key
  const [stage, setStage] = useState('');     // explicit stage override
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');

  const [sel, setSel] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [followMap, setFollowMap] = useState({}); // lead_id -> next due iso
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tagCatalog, setTagCatalog] = useState([]);

  // Debounce the search box (300ms) so we don't hammer the API per keystroke.
  const t = useRef();
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t.current); }, [q]);

  const viewFilter = SMART_VIEWS.find((v) => v.key === view)?.filter || {};
  const params = {
    ...viewFilter,
    status: stage || viewFilter.status || undefined,
    source: source || undefined,
    tag: tag || undefined,
    q: dq || undefined,
    hasValue: viewFilter.hasValue || undefined,
  };

  const load = useCallback(() => {
    setLoading(true); setError(false);
    crmListLeads({ ...params, page, pageSize: PAGE_SIZE })
      .then(({ data }) => { setRows(data.rows || []); setTotal(data.total || 0); })
      .catch(() => { setError(true); setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, stage, source, tag, dq, page]);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    crmDashboard().then(({ data }) => setStats(data)).catch(() => setStats(null)).finally(() => setStatsLoading(false));
  }, []);
  const loadTags = useCallback(() => crmListTags().then(({ data }) => setTagCatalog(Array.isArray(data) ? data : [])).catch(() => setTagCatalog([])), []);
  const loadFollowups = useCallback(() => crmListFollowUps({}).then(({ data }) => {
    const m = {};
    (Array.isArray(data) ? data : []).forEach((f) => { if (!m[f.lead_id] || f.due_at < m[f.lead_id]) m[f.lead_id] = f.due_at; });
    setFollowMap(m);
  }).catch(() => setFollowMap({})), []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); loadTags(); loadFollowups(); }, [loadStats, loadTags, loadFollowups]);
  useEffect(() => { setSel(new Set()); }, [rows]);

  const tagColors = colorMap(tagCatalog);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = view !== 'all' || stage || source || tag || dq;

  const pickView = (key) => { setView(key); setStage(''); setPage(1); };
  const clearFilters = () => { setView('all'); setStage(''); setSource(''); setTag(''); setQ(''); setDq(''); setPage(1); };

  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const bulk = async (action, value) => {
    if (!sel.size) return;
    try { const { data } = await crmBulk({ ids: [...sel], action, value }); toast.success(`${data.done}/${data.total} updated`); load(); loadStats(); }
    catch { toast.error('Bulk action failed'); }
  };

  const exportCsv = async () => {
    try {
      const { data } = await crmLeadsExportCsv(params);
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  // Row helpers
  const nextFollow = (r) => followMap[r.id];

  // Optimistic inline edits — patch the row in place (Notion-fast), no reload.
  const patchRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const saveField = async (id, field, value) => {
    patchRow(id, { [field]: value });
    try { await crmUpdateLead(id, { [field]: value }); } catch { toast.error('Save failed'); load(); }
  };
  const saveStage = async (id, status) => {
    patchRow(id, { status });
    try { await crmSetStatus(id, status); loadStats(); } catch { toast.error('Save failed'); load(); }
  };
  const [tagEditId, setTagEditId] = useState(null);
  const [viewType, setViewType] = useState('table'); // 'table' | 'board' | 'list'
  const [savedViews, setSavedViews] = useState([]);
  useEffect(() => { crmListViews().then(({ data }) => setSavedViews(Array.isArray(data) ? data : [])).catch(() => setSavedViews([])); }, []);

  const applyView = (v) => {
    const f = v.definition?.filters || {};
    setView(f.smartView || 'all'); setStage(f.stage || ''); setSource(f.source || '');
    setTag(f.tag || ''); setQ(f.q || ''); setDq(f.q || '');
    setViewType(v.definition?.viewType || 'table'); setPage(1);
  };
  const saveView = async () => {
    const name = prompt('Name this view:'); if (!name || !name.trim()) return;
    try {
      const { data } = await crmCreateView({ name: name.trim(), definition: { viewType, filters: { smartView: view, stage, source, tag, q: dq } } });
      setSavedViews((vs) => [...vs, data]); toast.success(`Saved “${data.name}”`);
    } catch (e) { toast.error(e.response?.data?.message || 'Could not save'); }
  };
  const deleteView = async (id) => { try { await crmDeleteView(id); setSavedViews((vs) => vs.filter((v) => v.id !== id)); } catch { toast.error('Failed'); } };

  const addTagInline = async (id, name) => {
    patchRow(id, { tags: Array.from(new Set([...(rows.find((r) => r.id === id)?.tags || []), name])) });
    setTagEditId(null);
    try { await crmAddTag(id, name); } catch { toast.error('Failed'); load(); }
  };
  const createTagInline = async (id, name, color) => {
    try { await crmCreateTag({ name, color }); loadTags(); } catch { /* dup ok */ }
    addTagInline(id, name);
  };
  const removeTagInline = async (id, name) => {
    patchRow(id, { tags: (rows.find((r) => r.id === id)?.tags || []).filter((t) => t !== name) });
    try { await crmRemoveTag(id, name); } catch { toast.error('Failed'); load(); }
  };

  const columns = [
    { key: 'sel', label: <input type="checkbox" checked={allSelected} onChange={toggleAll} onClick={(e) => e.stopPropagation()} />,
      className: 'w-8', render: (r) => <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} onClick={(e) => e.stopPropagation()} /> },
    { key: 'name', label: 'Lead', render: (r) => (
      <div className="min-w-0">
        <div className="font-semibold adm-t1"><InlineText value={r.name} onSave={(v) => saveField(r.id, 'name', v)} placeholder="Unnamed" /></div>
        <p className="text-[11px] adm-t3 truncate px-1.5">{[r.phone, r.email].filter(Boolean).join(' · ') || '—'}</p>
      </div>
    )},
    { key: 'business', label: 'Business', render: (r) => (
      <div className="adm-t2 min-w-0"><InlineText value={r.business_name} onSave={(v) => saveField(r.id, 'business_name', v)} placeholder={r.profession || '—'} /></div>
    )},
    { key: 'source', label: 'Source', render: (r) => <span className="text-[11px] adm-t3">{r.source}</span> },
    { key: 'stage', label: 'Stage', render: (r) => <InlineStatus value={r.status} onSave={(s) => saveStage(r.id, s)} /> },
    { key: 'tags', label: 'Tags', render: (r) => (
      <div className="flex flex-wrap items-center gap-1 max-w-[190px]" onClick={(e) => e.stopPropagation()}>
        {(r.tags || []).map((tg) => <TagChip key={tg} name={tg} color={tagColors[tg]} onRemove={() => removeTagInline(r.id, tg)} />)}
        <div className="relative">
          <button type="button" onClick={() => setTagEditId(tagEditId === r.id ? null : r.id)}
            className="text-[11px] w-4 h-4 leading-none rounded border border-dashed border-gray-300 adm-t3 hover:border-[#FE5100]">+</button>
          {tagEditId === r.id && (
            <TagPicker tags={tagCatalog} exclude={r.tags || []}
              onSelect={(name) => addTagInline(r.id, name)} onCreate={(name, color) => createTagInline(r.id, name, color)}
              onClose={() => setTagEditId(null)} />
          )}
        </div>
      </div>
    )},
    { key: 'next', label: 'Next action', render: (r) => {
      const due = nextFollow(r);
      if (due) { const overdue = new Date(due) < new Date(); return <span className={`text-[12px] ${overdue ? 'text-red-500 font-medium' : 'adm-t2'}`}>Follow up {relTime(due)}</span>; }
      return <span className="text-[11px] adm-t3">—</span>;
    }},
    { key: 'last', label: 'Last activity', render: (r) => <span className="text-[11px] adm-t3">{r.last_activity_at ? relTime(r.last_activity_at) : relTime(r.created_at)}</span> },
    { key: 'revenue_paise', label: 'Value', render: (r) => <span className="adm-t2">{r.revenue_paise ? rupees(r.revenue_paise) : '—'}</span> },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <PageHeader title="Leads" subtitle="Manage prospects, follow-ups and conversations from one place."
        actions={<div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:inline-flex items-center gap-1.5 text-[12px] adm-t3 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-[#FE5100]">
            Search <kbd className="text-[10px] adm-card px-1 rounded border border-gray-200">⌘K</kbd>
          </button>
          <Btn variant="outline" size="sm" onClick={() => setShowTags(true)}>Manage tags</Btn>
          <Btn variant="outline" size="sm" onClick={exportCsv}>Export</Btn>
          <Btn variant="outline" size="sm" onClick={() => setShowImport(true)}>Import</Btn>
          <Btn size="sm" onClick={() => setShowNew(true)}>+ Add Lead</Btn>
        </div>} />

      <MetricStrip stats={stats} active={view} loading={statsLoading} onPick={pickView} />

      {/* Smart views + filters + search */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {SMART_VIEWS.map((v) => (
            <button key={v.key} type="button" onClick={() => pickView(v.key)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition ${view === v.key && !stage ? 'bg-[#FE5100] text-white border-[#FE5100]' : 'adm-t2 border-gray-200 hover:border-[#FE5100]'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {/* View toggle + saved views */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          {['table', 'board', 'list'].map((vt) => (
            <button key={vt} type="button" onClick={() => setViewType(vt)}
              className={`text-[12px] px-3 py-1 capitalize ${viewType === vt ? 'bg-[#FE5100] text-white' : 'adm-t2 hover:bg-black/[0.04]'}`}>
              {vt}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {savedViews.map((v) => (
            <span key={v.id} className="group inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full border border-gray-200 adm-t2 hover:border-[#FE5100]">
              <button type="button" onClick={() => applyView(v)}>{v.name}</button>
              <button type="button" onClick={() => deleteView(v.id)} className="opacity-0 group-hover:opacity-100 adm-t3 hover:text-red-500">×</button>
            </span>
          ))}
          <button type="button" onClick={saveView} className="text-[12px] px-2 py-1 rounded-full border border-dashed border-gray-300 adm-t3 hover:border-[#FE5100]">+ Save view</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="fb-input text-sm flex-1 min-w-[200px]" placeholder="Search name, business, phone, email…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="fb-input text-sm" value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}>
          <option value="">Any stage</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select className="fb-input text-sm" value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
          <option value="">Any source</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="fb-input text-sm" value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }}>
          <option value="">Any tag</option>
          {tagCatalog.map((tg) => <option key={tg.id} value={tg.name}>{tg.name}</option>)}
        </select>
        {filtersActive && <Btn variant="outline" size="sm" onClick={clearFilters}>Clear</Btn>}
      </div>

      {/* Bulk bar */}
      {sel.size > 0 && (
        <Card className="mb-3 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold adm-t1">{sel.size} selected</span>
          <select className="fb-input text-xs py-1" defaultValue="" onChange={(e) => { if (e.target.value) bulk('status', e.target.value); e.target.value = ''; }}>
            <option value="">Set stage…</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <Btn variant="outline" size="sm" onClick={() => { const tg = prompt('Tag to add:'); if (tg) bulk('tag_add', tg.trim()); }}>Add tag</Btn>
          <Btn variant="outline" size="sm" onClick={() => { if (confirm('Mark selected as Do Not Contact?')) bulk('dnc'); }}>Do Not Contact</Btn>
          <button className="text-[12px] adm-t3 ml-auto" onClick={() => setSel(new Set())}>Clear selection</button>
        </Card>
      )}

      {/* Body: board / list / table */}
      {viewType === 'board' ? (
        <LeadsBoard filters={{ source: source || undefined, tag: tag || undefined, q: dq || undefined, followup: viewFilter.followup, hasValue: viewFilter.hasValue }} onOpen={(id) => setDrawerId(id)} />
      ) : error ? (
        <Card className="rounded-2xl p-10 text-center">
          <p className="adm-t1 font-semibold mb-1">Couldn't load leads</p>
          <p className="adm-t3 text-sm mb-4">Something went wrong reaching the server.</p>
          <Btn size="sm" onClick={load}>Retry</Btn>
        </Card>
      ) : loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl"><EmptyState filtered={filtersActive} onAdd={() => setShowNew(true)} onImport={() => setShowImport(true)} onClear={clearFilters} /></Card>
      ) : viewType === 'list' ? (
        <Card className="rounded-2xl divide-y divide-gray-100">
          {rows.map((r) => {
            const due = nextFollow(r); const overdue = due && new Date(due) < new Date();
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 adm-hoverable cursor-pointer" onClick={() => setDrawerId(r.id)}>
                <span className="font-medium adm-t1 truncate flex-1 min-w-0">{r.name || '—'}</span>
                <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{STATUS_LABEL[r.status] || r.status}</Badge>
                <span className={`text-[11px] w-28 text-right ${overdue ? 'text-red-500' : 'adm-t3'}`}>{due ? `Follow up ${relTime(due)}` : relTime(r.last_activity_at || r.created_at)}</span>
                <span className="text-[12px] adm-t2 w-20 text-right">{(r.expected_value_paise || r.revenue_paise) ? rupees(r.expected_value_paise || r.revenue_paise) : '—'}</span>
              </div>
            );
          })}
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Table columns={columns} rows={rows} rowKey={(r) => r.id}
              onRowClick={(r) => setDrawerId(r.id)}
              empty={null} />
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {rows.map((r) => {
              const due = nextFollow(r); const overdue = due && new Date(due) < new Date();
              return (
                <Card key={r.id} className="rounded-xl p-3 cursor-pointer adm-hoverable" onClick={() => setDrawerId(r.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold adm-t1 truncate">{r.name || '—'}</p>
                      <p className="text-[11px] adm-t3 truncate">{[r.phone, r.email].filter(Boolean).join(' · ')}</p>
                    </div>
                    <StageBadge s={r.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span className={overdue ? 'text-red-500 font-medium' : 'adm-t3'}>{due ? `Follow up ${relTime(due)}` : `Active ${relTime(r.last_activity_at || r.created_at)}`}</span>
                    {r.revenue_paise > 0 && <span className="font-semibold text-emerald-600">{rupees(r.revenue_paise)}</span>}
                  </div>
                  {(r.tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-2">{r.tags.slice(0, 3).map((tg) => <TagChip key={tg} name={tg} color={tagColors[tg]} />)}</div>}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {viewType !== 'board' && !loading && !error && rows.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] adm-t3">{total} leads · page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Btn>
            <Btn variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Btn>
          </div>
        </div>
      )}

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); loadStats(); }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); loadStats(); }} />}
      {showTags && <ManageTagsModal tags={tagCatalog} onClose={() => setShowTags(false)} onChanged={() => { loadTags(); load(); }} />}
      <LeadDrawer leadId={drawerId} onClose={() => setDrawerId(null)} onChanged={() => { load(); loadStats(); loadFollowups(); }} />
      <CommandPalette onOpenLead={(id) => setDrawerId(id)} onNewLead={() => setShowNew(true)} />
    </div>
  );
}

function NewLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', business_name: '', profession: '', city: '', source: 'manual' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone && !form.email) return toast.error('Phone or email required');
    setBusy(true);
    try { await crmCreateLead(form); toast.success('Lead saved'); onCreated(); }
    catch { toast.error('Could not save'); } finally { setBusy(false); }
  };
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <Modal title="New lead" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="fb-input text-sm" {...f('name')} /></Field>
          <Field label="Business"><input className="fb-input text-sm" {...f('business_name')} /></Field>
          <Field label="Phone"><input className="fb-input text-sm" {...f('phone')} /></Field>
          <Field label="Email"><input className="fb-input text-sm" {...f('email')} /></Field>
          <Field label="Profession"><input className="fb-input text-sm" {...f('profession')} /></Field>
          <Field label="City"><input className="fb-input text-sm" {...f('city')} /></Field>
          <Field label="Source">
            <select className="fb-input text-sm" {...f('source')}>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Btn>
          <Btn size="sm" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save lead'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ onClose, onDone }) {
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const grid = parseCsv(text).filter((r) => r.some((c) => c.trim()));
    if (grid.length < 2) return toast.error('Empty CSV');
    const headers = grid[0].map((h) => HEADER_MAP[h.trim().toLowerCase()] || h.trim().toLowerCase());
    const parsed = grid.slice(1).map((cells) => Object.fromEntries(headers.map((h, i) => [h, (cells[i] || '').trim()])));
    setRows(parsed);
    try { const { data } = await crmImportPreview(parsed); setPreview(data); } catch { toast.error('Preview failed'); }
  };
  const commit = async () => {
    setBusy(true);
    try { const { data } = await crmImportCommit(rows); toast.success(`Imported: ${data.created} new, ${data.merged} merged, ${data.skipped} skipped`); onDone(); }
    catch { toast.error('Import failed'); } finally { setBusy(false); }
  };
  return (
    <Modal title="Import leads (CSV)" onClose={onClose}>
      <p className="text-[12px] adm-t3 mb-3">Headers recognised: name, phone, whatsapp, email, business, profession, city, source, tags.</p>
      <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm mb-3" />
      {preview && (
        <>
          <p className="text-[13px] adm-t2 mb-2">{preview.valid}/{preview.total} valid rows.</p>
          <div className="max-h-52 overflow-auto rounded-lg border adm-card mb-3">
            <table className="w-full text-[12px]">
              <thead><tr className="adm-t3"><th className="px-2 py-1 text-left">#</th><th className="px-2 py-1 text-left">Name</th><th className="px-2 py-1 text-left">Contact</th><th className="px-2 py-1 text-left">Issues</th></tr></thead>
              <tbody>
                {preview.preview.slice(0, 50).map((p) => (
                  <tr key={p.row} className={p.errors.length ? 'text-red-500' : ''}>
                    <td className="px-2 py-1">{p.row}</td><td className="px-2 py-1">{p.name || '—'}</td>
                    <td className="px-2 py-1">{p.phone || p.email || '—'}</td>
                    <td className="px-2 py-1">{[...p.errors, p.dupInBatch ? 'dup in file' : ''].filter(Boolean).join(', ') || 'ok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
            <Btn size="sm" onClick={commit} disabled={busy || !preview.valid}>{busy ? 'Importing…' : `Import ${preview.valid} rows`}</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

function ManageTagsModal({ tags, onClose, onChanged }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('gray');
  const create = async () => {
    if (!newName.trim()) return;
    try { await crmCreateTag({ name: newName.trim(), color: newColor }); setNewName(''); setNewColor('gray'); onChanged(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not create'); }
  };
  const recolor = async (t, color) => { try { await crmUpdateTag(t.id, { color }); onChanged(); } catch { toast.error('Failed'); } };
  const rename = async (t) => { const n = prompt('Rename tag:', t.name); if (n && n.trim() && n !== t.name) { try { await crmUpdateTag(t.id, { name: n.trim() }); onChanged(); } catch { toast.error('Failed'); } } };
  const del = async (t) => { if (confirm(`Delete tag "${t.name}" from the catalogue? (leads keep the label)`)) { try { await crmDeleteTag(t.id); onChanged(); } catch { toast.error('Failed'); } } };
  return (
    <Modal title="Manage tags" onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <input className="fb-input text-sm flex-1" placeholder="New tag name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <div className="flex gap-1">
          {TAG_PALETTE.map((c) => (
            <button key={c} type="button" title={c} onClick={() => setNewColor(c)}
              className={`w-5 h-5 rounded-full ${swatchClass(c)} ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`} />
          ))}
        </div>
        <Btn size="sm" onClick={create}>Add</Btn>
      </div>
      {tags.length === 0 ? <p className="adm-t3 text-sm">No tags yet.</p> : (
        <div className="space-y-1 max-h-72 overflow-auto">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-1 py-1">
              <TagChip name={t.name} color={t.color} />
              <div className="flex gap-1 ml-auto">
                {TAG_PALETTE.map((c) => (
                  <button key={c} type="button" title={c} onClick={() => recolor(t, c)}
                    className={`w-4 h-4 rounded-full ${swatchClass(c)} ${t.color === c ? 'ring-2 ring-gray-500' : 'opacity-60 hover:opacity-100'}`} />
                ))}
              </div>
              <button onClick={() => rename(t)} className="text-[11px] adm-t3 hover:text-[#FE5100]">rename</button>
              <button onClick={() => del(t)} className="text-[11px] text-red-500">delete</button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold adm-t1">{title}</h2>
            <button onClick={onClose} className="adm-t3 text-xl leading-none">×</button>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-[11px] font-medium adm-t2 mb-1">{label}</label>{children}</div>;
}
