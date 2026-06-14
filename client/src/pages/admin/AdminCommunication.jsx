import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminEmailTemplates, adminEmailTemplate, adminEmailUpdate, adminEmailDuplicate,
  adminEmailArchive, adminEmailPreview, adminEmailTest,
  adminEmailLogs, adminEmailRetry, adminEmailSettings, adminEmailSaveSettings, adminEmailEvents,
} from '../../services/api';

const STATUS_PILL = {
  active: 'bg-emerald-50 text-emerald-600', draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-amber-50 text-amber-600', sent: 'bg-emerald-50 text-emerald-600',
  queued: 'bg-blue-50 text-blue-600', failed: 'bg-red-50 text-red-600', test: 'bg-violet-50 text-violet-600',
};

const Pill = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_PILL[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>;

const AdminCommunication = () => {
  const [tab, setTab] = useState('templates');

  // templates
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState('');
  const [testTo, setTestTo] = useState('');
  const [saving, setSaving] = useState(false);

  // logs
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState({ email: '', status: '', event: '' });

  // settings + events
  const [settings, setSettings] = useState(null);
  const [events, setEvents] = useState([]);

  const loadTemplates = useCallback(() => {
    const p = {};
    if (filters.search) p.search = filters.search;
    if (filters.category) p.category = filters.category;
    if (filters.status) p.status = filters.status;
    adminEmailTemplates(p).then((r) => setTemplates(r.data)).catch(() => toast.error('Failed to load templates'));
  }, [filters]);

  const loadLogs = useCallback(() => {
    const p = {};
    if (logFilter.email) p.email = logFilter.email;
    if (logFilter.status) p.status = logFilter.status;
    if (logFilter.event) p.event = logFilter.event;
    adminEmailLogs(p).then((r) => setLogs(r.data)).catch(() => toast.error('Failed to load logs'));
  }, [logFilter]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);
  useEffect(() => { if (tab === 'settings' && !settings) adminEmailSettings().then((r) => setSettings(r.data)).catch(() => {}); }, [tab, settings]);
  useEffect(() => { if (tab === 'events' && !events.length) adminEmailEvents().then((r) => setEvents(r.data.events)).catch(() => {}); }, [tab, events.length]);

  const openEdit = async (t) => {
    const r = await adminEmailTemplate(t.id);
    setEditing(t.id); setForm(r.data); setPreview(''); setTestTo('');
  };

  const doPreview = async () => {
    try {
      // save current edits implicitly is not done; preview uses saved version,
      // so save-then-preview for accuracy
      await adminEmailUpdate(editing, form);
      const r = await adminEmailPreview(editing, {});
      setPreview(r.data.html);
      if (r.data.missing?.length) toast(`Unresolved: ${r.data.missing.join(', ')}`, { icon: '⚠️' });
    } catch (e) { toast.error(e?.response?.data?.message || 'Preview failed'); }
  };

  const save = async () => {
    setSaving(true);
    try { await adminEmailUpdate(editing, form); toast.success('Template saved'); loadTemplates(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    if (!testTo.trim()) return toast.error('Enter a recipient email');
    try { await adminEmailUpdate(editing, form); const r = await adminEmailTest(editing, testTo.trim()); toast.success(r.data.message); }
    catch (e) { toast.error(e?.response?.data?.message || 'Test failed'); }
  };

  const duplicate = async (t) => { try { await adminEmailDuplicate(t.id); toast.success('Duplicated (draft)'); loadTemplates(); } catch { toast.error('Duplicate failed'); } };
  const archive = async (t) => { try { await adminEmailArchive(t.id); toast.success('Archived'); loadTemplates(); } catch (e) { toast.error(e?.response?.data?.message || 'Archive failed'); } };
  const retry = async (l) => { try { await adminEmailRetry(l.id); toast.success('Re-queued'); loadLogs(); } catch { toast.error('Retry failed'); } };

  const saveSettings = async () => {
    try { const r = await adminEmailSaveSettings(settings); setSettings(r.data); toast.success('Settings saved'); }
    catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Communications</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Email templates, delivery logs, provider settings and system events. No campaigns or newsletters.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[['templates', 'Templates'], ['logs', 'Email Logs'], ['settings', 'Settings'], ['events', 'System Events']].map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setEditing(null); }}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${tab === k ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {/* ── Templates ── */}
      {tab === 'templates' && !editing && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <input className="fb-input text-sm w-56" placeholder="Search templates…" value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            <select className="fb-input text-sm w-40" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">All categories</option>
              {['Authentication','Security','Booking','Profile','Badge','Subscription','Celebrations'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="fb-input text-sm w-32" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
            </select>
          </div>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
                <th className="px-4 py-2.5">Template</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last updated</th><th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5"><span className="font-medium text-gray-800">{t.name}</span><div className="text-[11px] text-gray-400 font-mono">{t.event_key}{t.audience !== 'all' ? ` · ${t.audience}` : ''}</div></td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{t.category}</td>
                    <td className="px-4 py-2.5"><Pill s={t.status} /></td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{t.updated_at ? new Date(t.updated_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      <button onClick={() => openEdit(t)} className="text-indigo-600 font-semibold hover:underline mr-3">Edit</button>
                      <button onClick={() => duplicate(t)} className="text-gray-500 font-semibold hover:underline mr-3">Duplicate</button>
                      {t.status !== 'archived' && <button onClick={() => archive(t)} className="text-amber-600 font-semibold hover:underline">Archive</button>}
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && <tr><td colSpan="5" className="text-center text-sm text-gray-400 py-8">No templates.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Template editor ── */}
      {tab === 'templates' && editing && form && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
              <span className="text-[11px] font-mono text-gray-400">{form.event_key}</span>
            </div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Template name</label>
              <input className="fb-input text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
              <input className="fb-input text-sm" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Preview text</label>
              <input className="fb-input text-sm" value={form.preview_text || ''} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">HTML body <span className="font-normal text-gray-400">(no header/footer — added automatically)</span></label>
              <textarea className="fb-input text-xs font-mono" rows="11" value={form.html_content} onChange={(e) => setForm({ ...form, html_content: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">CTA label</label>
                <input className="fb-input text-sm" value={form.cta_label || ''} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">CTA url</label>
                <input className="fb-input text-sm" value={form.cta_url || ''} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} /></div>
            </div>
            <p className="text-[11px] text-gray-400">Variables: <code>{'{{first_name}} {{service_name}} {{vendor_name}} {{booking_date}} {{booking_time}} {{otp}} {{badge_name}} {{plan_name}} {{support_email}}'}</code></p>
            <div className="flex gap-2 pt-2 border-t">
              <button onClick={save} disabled={saving} className="btn bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={doPreview} className="btn btn--outline px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Live Preview</button>
              <input className="fb-input text-sm flex-1" placeholder="test@email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              <button onClick={sendTest} className="btn btn--outline px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50">Send Test</button>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 px-1 pb-2">Live preview (sample data)</p>
            {preview
              ? <iframe title="preview" srcDoc={preview} className="w-full h-[640px] rounded-lg border" />
              : <div className="h-[640px] flex items-center justify-center text-sm text-gray-400">Click “Live Preview” to render.</div>}
          </div>
        </div>
      )}

      {/* ── Logs ── */}
      {tab === 'logs' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex flex-wrap gap-2 p-3 border-b">
            <input className="fb-input text-sm w-52" placeholder="Search by email…" value={logFilter.email} onChange={(e) => setLogFilter((f) => ({ ...f, email: e.target.value }))} />
            <input className="fb-input text-sm w-44" placeholder="Event key…" value={logFilter.event} onChange={(e) => setLogFilter((f) => ({ ...f, event: e.target.value }))} />
            <select className="fb-input text-sm w-32" value={logFilter.status} onChange={(e) => setLogFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All</option><option value="sent">Sent</option><option value="queued">Queued</option><option value="failed">Failed</option>
            </select>
            <button onClick={loadLogs} className="btn btn--outline px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
                <th className="px-4 py-2">Time</th><th className="px-4 py-2">Recipient</th><th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Status</th><th className="px-4 py-2">Tries</th><th className="px-4 py-2">Error</th><th className="px-4 py-2"></th>
              </tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-xs">{l.recipient}</td>
                    <td className="px-4 py-2 font-mono text-[11px]">{l.event_key}</td>
                    <td className="px-4 py-2"><Pill s={l.status} /></td>
                    <td className="px-4 py-2 text-xs">{l.attempts}</td>
                    <td className="px-4 py-2 text-xs text-red-500 max-w-[200px] truncate" title={l.error || ''}>{l.error || '—'}</td>
                    <td className="px-4 py-2">{l.status === 'failed' && <button onClick={() => retry(l)} className="text-xs font-semibold text-indigo-600 hover:underline">Retry</button>}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="7" className="text-center text-sm text-gray-400 py-8">No email logs.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && settings && (
        <div className="bg-white border rounded-xl p-5 max-w-2xl space-y-3">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Provider</label>
            <select className="fb-input text-sm w-44" value={settings.provider} onChange={(e) => setSettings({ ...settings, provider: e.target.value })}>
              <option value="smtp">SMTP</option><option value="resend">Resend</option><option value="ses">Amazon SES</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Swap providers without code changes. SMTP is the default.</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">From name</label>
              <input className="fb-input text-sm" value={settings.from_name || ''} onChange={(e) => setSettings({ ...settings, from_name: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">From email</label>
              <input className="fb-input text-sm" value={settings.from_email || ''} onChange={(e) => setSettings({ ...settings, from_email: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Support email</label>
              <input className="fb-input text-sm" value={settings.support_email || ''} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Website URL</label>
              <input className="fb-input text-sm" value={settings.website_url || ''} onChange={(e) => setSettings({ ...settings, website_url: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Logo URL</label>
              <input className="fb-input text-sm" value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Brand color</label>
              <input className="fb-input text-sm" value={settings.brand_color || ''} onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })} /></div>
          </div>
          <button onClick={saveSettings} className="btn bg-gray-900 text-white px-5 py-2 text-sm font-medium hover:bg-gray-800">Save settings</button>
        </div>
      )}

      {/* ── Events ── */}
      {tab === 'events' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
              <th className="px-4 py-2.5">Event</th><th className="px-4 py-2.5">Templates</th><th className="px-4 py-2.5">Active</th>
            </tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.event_key} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{ev.event_key}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{ev.templates.map((t) => t.name).join(', ')}</td>
                  <td className="px-4 py-2.5">{ev.has_active ? <Pill s="active" /> : <span className="text-xs text-red-500 font-semibold">none</span>}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan="3" className="text-center text-sm text-gray-400 py-8">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCommunication;
