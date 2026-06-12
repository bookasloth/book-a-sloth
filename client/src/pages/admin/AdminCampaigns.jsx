import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminCampaigns, adminCampCreate, adminCampLaunch,
  adminCampSegments, adminCampSegPreview, adminCampSyncContacts,
  adminEmailTemplates, adminCampWaTemplates, adminCampWaCreate,
} from '../../services/api';

const STATUS = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-50 text-blue-600',
  sending: 'bg-amber-50 text-amber-600', sent: 'bg-emerald-50 text-emerald-600',
  paused: 'bg-violet-50 text-violet-600', failed: 'bg-red-50 text-red-600' };
const Pill = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>;

const BLANK = { name: '', channel: 'email', segment_id: '', template_id: '', whatsapp_template_id: '', subject_override: '', throttle_per_min: 120 };

const AdminCampaigns = () => {
  const [list, setList] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [waTemplates, setWaTemplates] = useState([]);
  const [building, setBuilding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [count, setCount] = useState(null);

  // WhatsApp template registry
  const [waManage, setWaManage] = useState(false);
  const [waForm, setWaForm] = useState({ name: '', aisensy_campaign_name: '', fields: '' });

  const load = useCallback(() => { adminCampaigns().then((r) => setList(r.data)).catch(() => toast.error('Failed to load campaigns')); }, []);
  const loadWa = useCallback(() => { adminCampWaTemplates().then((r) => setWaTemplates(r.data)).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminCampSegments().then((r) => setSegments(r.data)).catch(() => {});
    adminEmailTemplates({ status: 'active' }).then((r) => setTemplates(r.data)).catch(() => {});
    loadWa();
  }, [loadWa]);

  const previewCount = async (segId, channel) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return setCount(null);
    try { const r = await adminCampSegPreview(seg.definition, channel); setCount(r.data.count); } catch { setCount(null); }
  };

  const save = async () => {
    const isWa = form.channel === 'whatsapp';
    if (!form.name || !form.segment_id) return toast.error('Name and segment are required');
    if (isWa && !form.whatsapp_template_id) return toast.error('Select an approved WhatsApp template');
    if (!isWa && !form.template_id) return toast.error('Select an email template');
    try {
      await adminCampCreate(form); toast.success('Draft saved');
      setBuilding(false); setForm(BLANK); setCount(null); load();
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

  const saveWaTemplate = async () => {
    if (!waForm.name || !waForm.aisensy_campaign_name) return toast.error('Name and AiSensy campaign name are required');
    // "fields" = comma-separated contact fields for {{1}},{{2}}… → variable_map.
    const fields = waForm.fields.split(',').map((f) => f.trim()).filter(Boolean);
    const variable_map = {}; fields.forEach((f, i) => { variable_map[i + 1] = f; });
    try {
      await adminCampWaCreate({ name: waForm.name, aisensy_campaign_name: waForm.aisensy_campaign_name, variable_map, param_count: fields.length });
      toast.success('WhatsApp template added'); setWaForm({ name: '', aisensy_campaign_name: '', fields: '' }); loadWa();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
  };

  const isWa = form.channel === 'whatsapp';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Targeted Email &amp; WhatsApp campaigns to consented segments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setWaManage((v) => !v)} className="border px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">WhatsApp templates</button>
          <button onClick={syncContacts} className="border px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Sync contacts</button>
          <button onClick={() => setBuilding(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">New campaign</button>
        </div>
      </div>

      {/* WhatsApp template registry */}
      {waManage && (
        <div className="bg-white border rounded-xl p-5 mb-6 max-w-2xl">
          <p className="text-sm font-semibold text-gray-800 mb-3">Approved AiSensy templates</p>
          <div className="space-y-1 mb-4">
            {waTemplates.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                <span className="font-medium text-gray-800">{t.name} <span className="text-gray-400 font-mono text-xs">({t.aisensy_campaign_name})</span></span>
                <span className="text-[11px] text-gray-400">{t.param_count} vars · {t.approval_status}</span>
              </div>
            ))}
            {waTemplates.length === 0 && <p className="text-xs text-gray-400">No WhatsApp templates yet.</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className="fb-input text-sm" placeholder="Label" value={waForm.name} onChange={(e) => setWaForm({ ...waForm, name: e.target.value })} />
            <input className="fb-input text-sm" placeholder="AiSensy campaign name" value={waForm.aisensy_campaign_name} onChange={(e) => setWaForm({ ...waForm, aisensy_campaign_name: e.target.value })} />
            <input className="fb-input text-sm" placeholder="Fields for {{1}},{{2}}… (comma-sep)" value={waForm.fields} onChange={(e) => setWaForm({ ...waForm, fields: e.target.value })} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">e.g. <code>first_name, service_name, vendor_name</code> maps to {'{{1}} {{2}} {{3}}'}.</p>
          <button onClick={saveWaTemplate} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Add template</button>
        </div>
      )}

      {building && (
        <div className="bg-white border rounded-xl p-5 mb-6 max-w-2xl space-y-3">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Channel</label>
            <select className="fb-input text-sm" value={form.channel}
              onChange={(e) => { const channel = e.target.value; setForm({ ...form, channel }); if (form.segment_id) previewCount(form.segment_id, channel); }}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Campaign name</label>
            <input className="fb-input text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Audience (segment)</label>
            <select className="fb-input text-sm" value={form.segment_id}
              onChange={(e) => { setForm({ ...form, segment_id: e.target.value }); previewCount(e.target.value, form.channel); }}>
              <option value="">Select a segment…</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {count !== null && <p className="text-[11px] text-gray-500 mt-1">≈ {count} consented {isWa ? 'WhatsApp' : 'email'} recipients</p>}
          </div>

          {isWa ? (
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Approved WhatsApp template</label>
              <select className="fb-input text-sm" value={form.whatsapp_template_id} onChange={(e) => setForm({ ...form, whatsapp_template_id: e.target.value })}>
                <option value="">Select a template…</option>
                {waTemplates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.param_count} vars)</option>)}
              </select>
              {waTemplates.length === 0 && <p className="text-[11px] text-amber-600 mt-1">No WhatsApp templates yet — add one via “WhatsApp templates”.</p>}
            </div>
          ) : (
            <>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email template</label>
                <select className="fb-input text-sm" value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
                  <option value="">Select a template…</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Subject override (optional)</label>
                <input className="fb-input text-sm" value={form.subject_override} onChange={(e) => setForm({ ...form, subject_override: e.target.value })} /></div>
            </>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <button onClick={save} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Save draft</button>
            <button onClick={() => { setBuilding(false); setForm(BLANK); setCount(null); }} className="border px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
            <th className="px-4 py-2.5">Campaign</th><th className="px-4 py-2.5">Channel</th><th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Sent/Total</th><th className="px-4 py-2.5">Created</th><th className="px-4 py-2.5">Actions</th>
          </tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-2.5 text-xs capitalize text-gray-500">{c.channel}</td>
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
            {list.length === 0 && <tr><td colSpan="6" className="text-center text-sm text-gray-400 py-8">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCampaigns;
