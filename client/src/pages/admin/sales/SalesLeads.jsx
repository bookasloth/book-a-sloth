import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Btn, Badge, Table } from '../../../components/admin/ui';
import {
  crmListLeads, crmCreateLead, crmBulk, crmLeadsExportCsv, crmImportPreview, crmImportCommit,
  crmListTags, crmCreateTag, crmUpdateTag, crmDeleteTag,
} from '../../../services/api';
import { ALL_STATUSES, STATUS_LABEL, STATUS_TONE, SOURCES, rupees, relTime } from './salesConstants';
import { colorMap, TAG_PALETTE, swatchClass } from './salesTagColors';
import TagChip from './TagChip';
import toast from 'react-hot-toast';

const PAGE_SIZE = 25;

// Minimal CSV parse (handles quoted fields + escaped quotes). ponytail: good
// enough for pasted lead lists; swap for papaparse only if imports get gnarly.
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
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [sel, setSel] = useState(new Set());
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tagCatalog, setTagCatalog] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    crmListLeads({ q: q || undefined, status: status || undefined, source: source || undefined, tag: tag || undefined, page, pageSize: PAGE_SIZE })
      .then(({ data }) => { setRows(data.rows || []); setTotal(data.total || 0); })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, status, source, tag, page]);

  const loadTags = useCallback(() => crmListTags().then(({ data }) => setTagCatalog(Array.isArray(data) ? data : [])).catch(() => setTagCatalog([])), []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { setSel(new Set()); }, [rows]);
  const tagColors = colorMap(tagCatalog);

  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const bulk = async (action, value) => {
    if (!sel.size) return;
    try { const { data } = await crmBulk({ ids: [...sel], action, value }); toast.success(`${data.done}/${data.total} updated`); load(); }
    catch { toast.error('Bulk action failed'); }
  };

  const exportCsv = async () => {
    try {
      const { data } = await crmLeadsExportCsv({ q: q || undefined, status: status || undefined, source: source || undefined, tag: tag || undefined });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = [
    { key: 'sel', label: <input type="checkbox" checked={allSelected} onChange={toggleAll} onClick={(e) => e.stopPropagation()} />,
      className: 'w-8', render: (r) => <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} onClick={(e) => e.stopPropagation()} /> },
    { key: 'name', label: 'Lead', render: (r) => (
      <div className="min-w-0">
        <p className="font-semibold adm-t1 truncate">{r.name || '—'}</p>
        {r.business_name && <p className="text-[11px] adm-t3 truncate">{r.business_name}</p>}
      </div>
    )},
    { key: 'contact', label: 'Contact', render: (r) => (
      <div className="min-w-0">
        {r.phone && <p className="text-[12px] adm-t2 truncate">{r.phone}</p>}
        {r.email && <p className="text-[11px] adm-t3 truncate">{r.email}</p>}
      </div>
    )},
    { key: 'profession', label: 'Profession', render: (r) => <span className="adm-t2">{r.profession || '—'}{r.city ? ` · ${r.city}` : ''}</span> },
    { key: 'source', label: 'Source', render: (r) => <span className="text-[11px] adm-t3">{r.source}</span> },
    { key: 'tags', label: 'Tags', render: (r) => (
      <div className="flex flex-wrap gap-1 max-w-[180px]">
        {(r.tags || []).slice(0, 3).map((t) => <TagChip key={t} name={t} color={tagColors[t]} />)}
        {(r.tags || []).length > 3 && <span className="text-[10px] adm-t3">+{r.tags.length - 3}</span>}
      </div>
    )},
    { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{STATUS_LABEL[r.status] || r.status}</Badge> },
    { key: 'revenue_paise', label: 'Revenue', render: (r) => <span className="adm-t2">{r.revenue_paise ? rupees(r.revenue_paise) : '—'}</span> },
    { key: 'last', label: 'Activity', render: (r) => <span className="text-[11px] adm-t3">{relTime(r.last_activity_at || r.created_at)}</span> },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Leads" subtitle={`${total} total`}
        actions={<div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={() => setShowTags(true)}>Manage tags</Btn>
          <Btn variant="outline" size="sm" onClick={exportCsv}>Export</Btn>
          <Btn variant="outline" size="sm" onClick={() => setShowImport(true)}>Import CSV</Btn>
          <Btn size="sm" onClick={() => setShowNew(true)}>+ New lead</Btn>
        </div>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="fb-input text-sm flex-1 min-w-[200px]" placeholder="Search name, business, phone, email…"
          value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <select className="fb-input text-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select className="fb-input text-sm" value={source} onChange={(e) => { setPage(1); setSource(e.target.value); }}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="fb-input text-sm" value={tag} onChange={(e) => { setPage(1); setTag(e.target.value); }}>
          <option value="">All tags</option>
          {tagCatalog.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
      </div>

      {sel.size > 0 && (
        <Card className="mb-3 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold adm-t1">{sel.size} selected</span>
          <select className="fb-input text-xs py-1" defaultValue="" onChange={(e) => { if (e.target.value) bulk('status', e.target.value); e.target.value = ''; }}>
            <option value="">Set status…</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <Btn variant="outline" size="sm" onClick={() => { const t = prompt('Tag to add:'); if (t) bulk('tag_add', t.trim()); }}>Add tag</Btn>
          <Btn variant="outline" size="sm" onClick={() => { if (confirm('Mark selected as Do Not Contact?')) bulk('dnc'); }}>Do Not Contact</Btn>
        </Card>
      )}

      {loading ? <p className="adm-t3">Loading…</p> : (
        <Table columns={columns} rows={rows} rowKey={(r) => r.id}
          onRowClick={(r) => nav(`/admin/sales/leads/${r.id}`)}
          empty={<div className="p-10 text-center adm-t3">No leads match.</div>} />
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-[12px] adm-t3">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Btn>
          <Btn variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Btn>
        </div>
      </div>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
      {showTags && <ManageTagsModal tags={tagCatalog} onClose={() => setShowTags(false)} onChanged={() => { loadTags(); load(); }} />}
    </div>
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
    try { const { data } = await crmImportPreview(parsed); setPreview(data); }
    catch { toast.error('Preview failed'); }
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
                    <td className="px-2 py-1">{p.row}</td>
                    <td className="px-2 py-1">{p.name || '—'}</td>
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-auto" >
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
