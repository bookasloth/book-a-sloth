import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminCampaigns, adminCampCreate, adminCampLaunch,
  adminCampSegments, adminCampSegPreview, adminCampSyncContacts,
  adminEmailTemplates,
} from '../../services/api';

const STATUS = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-50 text-blue-600',
  sending: 'bg-amber-50 text-amber-600', sent: 'bg-emerald-50 text-emerald-600',
  paused: 'bg-violet-50 text-violet-600', failed: 'bg-red-50 text-red-600' };
const Pill = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>;

const AdminCampaigns = () => {
  const [list, setList] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [building, setBuilding] = useState(false);
  const [form, setForm] = useState({ name: '', segment_id: '', template_id: '', subject_override: '', throttle_per_min: 120 });
  const [count, setCount] = useState(null);

  const load = useCallback(() => { adminCampaigns().then((r) => setList(r.data)).catch(() => toast.error('Failed to load campaigns')); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminCampSegments().then((r) => setSegments(r.data)).catch(() => {});
    adminEmailTemplates({ status: 'active' }).then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  const previewCount = async (segId) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return setCount(null);
    try { const r = await adminCampSegPreview(seg.definition); setCount(r.data.count); } catch { setCount(null); }
  };

  const save = async () => {
    if (!form.name || !form.segment_id || !form.template_id) return toast.error('Name, segment and template are required');
    try { await adminCampCreate(form); toast.success('Draft saved'); setBuilding(false);
      setForm({ name: '', segment_id: '', template_id: '', subject_override: '', throttle_per_min: 120 }); load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
  };

  const launch = async (c) => {
    if (!window.confirm(`Launch "${c.name}"? This sends to all consented recipients in the segment.`)) return;
    try { const r = await adminCampLaunch(c.id); toast.success(r.data.message); load(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Launch failed'); }
  };

  const syncContacts = async () => {
    try { const r = await adminCampSyncContacts(); toast.success(`Synced ${r.data.upserted} contacts`); }
    catch { toast.error('Sync failed'); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Targeted email campaigns to consented segments. WhatsApp coming soon.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncContacts} className="border px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Sync contacts</button>
          <button onClick={() => setBuilding(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">New campaign</button>
        </div>
      </div>

      {building && (
        <div className="bg-white border rounded-xl p-5 mb-6 max-w-2xl space-y-3">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Campaign name</label>
            <input className="fb-input text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Audience (segment)</label>
            <select className="fb-input text-sm" value={form.segment_id}
              onChange={(e) => { setForm({ ...form, segment_id: e.target.value }); previewCount(e.target.value); }}>
              <option value="">Select a segment…</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {count !== null && <p className="text-[11px] text-gray-500 mt-1">≈ {count} consented recipients</p>}
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email template</label>
            <select className="fb-input text-sm" value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
              <option value="">Select a template…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Subject override (optional)</label>
            <input className="fb-input text-sm" value={form.subject_override} onChange={(e) => setForm({ ...form, subject_override: e.target.value })} /></div>
          <div className="flex gap-2 pt-2 border-t">
            <button onClick={save} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Save draft</button>
            <button onClick={() => setBuilding(false)} className="border px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
            <th className="px-4 py-2.5">Campaign</th><th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Sent/Total</th><th className="px-4 py-2.5">Created</th><th className="px-4 py-2.5">Actions</th>
          </tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-2.5"><Pill s={c.status} /></td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{(c.stats?.sent ?? 0)}/{(c.stats?.total ?? 0)}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-2.5 text-xs">
                  {['draft', 'scheduled'].includes(c.status)
                    ? <button onClick={() => launch(c)} className="text-indigo-600 font-semibold hover:underline">Launch</button>
                    : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="5" className="text-center text-sm text-gray-400 py-8">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCampaigns;
