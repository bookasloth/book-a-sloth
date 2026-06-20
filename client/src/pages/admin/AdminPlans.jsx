import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminListPlans, adminCreatePlan, adminUpdatePlan, adminArchivePlan,
  adminRestorePlan, adminClonePlan, adminReorderPlans, adminAssignPlan, adminGetUsers,
} from '../../services/api';

const LIMIT_KEYS = [
  ['services', 'Services'],
  ['bookings_per_year', 'Bookings / year'],
  ['digital_products', 'Digital products'],
  ['calendar_integrations', 'Calendar integrations'],
  ['profile_theme_colors', 'Theme colors'],
  ['reminder_flows', 'Reminder flows'],
  ['followup_flows', 'Follow-up flows'],
];

const FEATURE_KEYS = [
  'booking_page', 'online_appointments', 'offline_appointments', 'payment_collection',
  'email_notifications', 'whatsapp_notifications', 'booking_confirmation', 'booking_cancellation',
  'booking_completion_notifications', 'client_records', 'booking_history', 'client_history',
  'auto_invoices', 'invoice_history', 'basic_reports', 'advanced_reports', 'client_notes', 'data_export',
];

const CALENDAR_APPS = ['google_calendar', 'zoom', 'ical'];

// RBI: auto-debit e-mandates run without per-charge re-auth only under ₹15,000.
// gross = price + 18% GST; warn admins when a cadence crosses the ceiling.
const AUTO_DEBIT_THRESHOLD = 15000;
const grossWithGst = (price) => Math.round((Number(price) || 0) * 1.18);

const EMPTY_PLAN = {
  name: '', annual_price: 0, monthly_price: 0, billing_cycle: 'yearly', commission_percentage: 0,
  support_type: 'standard',
  limits: Object.fromEntries(LIMIT_KEYS.map(([k]) => [k, 0])),
  features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])),
  integrations: { calendar_apps: ['google_calendar'] },
  active: true,
};

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [rules, setRules] = useState({ min_active_plans: 2, max_active_plans: 3 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // plan object or 'new'
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  // assignment
  const [assignQuery, setAssignQuery] = useState('');
  const [assignResults, setAssignResults] = useState([]);
  const [assignPlanSlug, setAssignPlanSlug] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminListPlans()
      .then((r) => { setPlans(r.data.plans); setRules(r.data.rules); })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (plan) => {
    setEditing(plan);
    setForm(plan === 'new' ? EMPTY_PLAN : {
      name: plan.name,
      annual_price: Number(plan.annual_price),
      monthly_price: Number(plan.monthly_price) || 0,
      billing_cycle: plan.billing_cycle || 'yearly',
      commission_percentage: Number(plan.commission_percentage),
      support_type: plan.support_type || 'standard',
      limits: { ...EMPTY_PLAN.limits, ...(plan.limits || {}) },
      features: { ...EMPTY_PLAN.features, ...(plan.features || {}) },
      integrations: { calendar_apps: plan.integrations?.calendar_apps || [], ...(plan.integrations || {}) },
      active: plan.active,
    });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Plan name is required');
    setSaving(true);
    try {
      if (editing === 'new') {
        await adminCreatePlan(form);
        toast.success('Plan created');
      } else {
        await adminUpdatePlan(editing.id, form);
        toast.success('Plan updated — applies to all checks immediately');
      }
      setEditing(null); load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (plan) => {
    try {
      await (plan.active ? adminArchivePlan(plan.id) : adminRestorePlan(plan.id));
      toast.success(plan.active ? 'Plan archived' : 'Plan restored');
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Action failed'); }
  };

  const clone = async (plan) => {
    try {
      await adminClonePlan(plan.id);
      toast.success('Plan cloned (inactive — edit and activate it)');
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Clone failed'); }
  };

  const move = async (index, dir) => {
    const next = [...plans];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setPlans(next);
    try { await adminReorderPlans(next.map((p) => p.id)); } catch { toast.error('Reorder failed'); load(); }
  };

  const searchVendors = async () => {
    if (!assignQuery.trim()) return;
    try {
      const r = await adminGetUsers({ search: assignQuery });
      const rows = Array.isArray(r.data) ? r.data : r.data?.users || [];
      setAssignResults(rows.filter((u) => u.role === 'host').slice(0, 6));
    } catch { toast.error('Search failed'); }
  };

  const assign = async (vendor) => {
    if (!assignPlanSlug) return toast.error('Select a plan first');
    if (!window.confirm(`Move ${vendor.name} to "${assignPlanSlug}"?`)) return;
    try {
      const r = await adminAssignPlan({ vendor_id: vendor.id, plan_slug: assignPlanSlug });
      toast.success(r.data.message);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Assignment failed'); }
  };

  const activeCount = plans.filter((p) => p.active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Database-driven — changes apply without deployment · {activeCount} active (min {rules.min_active_plans}, max {rules.max_active_plans})
          </p>
        </div>
        <button onClick={() => openEdit('new')} className="btn bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New Plan</button>
      </div>

      {loading ? <p className="text-center text-sm text-gray-400 py-10">Loading…</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {plans.map((plan, i) => (
            <div key={plan.id} className={`bg-white border rounded-xl p-5 ${!plan.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-base font-bold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{plan.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.active ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {plan.active ? 'ACTIVE' : 'ARCHIVED'}
                  </span>
                  <div className="flex gap-0.5">
                    <button onClick={() => move(i, -1)} title="Move up" className="text-gray-300 hover:text-gray-600 px-1">↑</button>
                    <button onClick={() => move(i, 1)} title="Move down" className="text-gray-300 hover:text-gray-600 px-1">↓</button>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 mb-0.5">₹{Number(plan.annual_price).toLocaleString('en-IN')}<span className="text-xs font-medium text-gray-400"> / year</span></p>
              <p className="text-sm font-bold text-gray-500 mb-1">{Number(plan.monthly_price) > 0 ? <>₹{Number(plan.monthly_price).toLocaleString('en-IN')}<span className="text-xs font-medium text-gray-400"> / month</span></> : <span className="text-xs font-medium text-gray-300">no monthly price set</span>}</p>
              <p className="text-xs text-gray-500 mb-3">Commission: <strong>{Number(plan.commission_percentage)}%</strong> · {plan.subscriber_count} subscriber{plan.subscriber_count === 1 ? '' : 's'}</p>
              <div className="text-xs text-gray-600 space-y-1 border-t pt-3 mb-4">
                {LIMIT_KEYS.map(([k, label]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold">{plan.limits?.[k] === -1 ? 'Unlimited' : (plan.limits?.[k] ?? 0)}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-400">Calendars</span>
                  <span className="font-semibold">{(plan.integrations?.calendar_apps || []).join(', ') || '—'}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => openEdit(plan)} className="btn btn--outline flex-1 py-2 font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
                <button onClick={() => clone(plan)} className="btn btn--outline flex-1 py-2 font-semibold text-gray-700 hover:bg-gray-50">Clone</button>
                <button onClick={() => archive(plan)} className={`btn btn--outline flex-1 py-2 font-semibold ${plan.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                  {plan.active ? 'Archive' : 'Restore'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual assignment */}
      <div className="bg-white border rounded-xl p-5 max-w-2xl">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Assign Plan to Host</h2>
        <p className="text-xs text-gray-400 mb-3">Manual override for comp plans and support resolutions — activates immediately, 1-year expiry for paid plans.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <input className="fb-input text-sm flex-1 min-w-[200px]" placeholder="Search host by name/email…"
            value={assignQuery} onChange={(e) => setAssignQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchVendors()} />
          <select className="fb-input text-sm w-44" value={assignPlanSlug} onChange={(e) => setAssignPlanSlug(e.target.value)}>
            <option value="">Target plan…</option>
            {plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
          </select>
          <button onClick={searchVendors} className="btn btn--outline px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Search</button>
        </div>
        <div className="space-y-1.5">
          {assignResults.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50">
              <span>{v.name} <span className="text-xs text-gray-400">({v.email}) — current: {v.plan || 'starter'}</span></span>
              <button onClick={() => assign(v)} className="text-xs font-bold text-indigo-600 hover:underline">Assign</button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / create modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing === 'new' ? 'Create Plan' : `Edit — ${editing.name}`}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <input className="fb-input text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹/yr)</label>
                <input type="number" min="0" className="fb-input text-sm" value={form.annual_price}
                  onChange={(e) => setForm((f) => ({ ...f, annual_price: Number(e.target.value) }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹/mo)</label>
                <input type="number" min="0" className="fb-input text-sm" value={form.monthly_price}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_price: Number(e.target.value) }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Commission %</label>
                <input type="number" min="0" max="100" step="0.5" className="fb-input text-sm" value={form.commission_percentage}
                  onChange={(e) => setForm((f) => ({ ...f, commission_percentage: Number(e.target.value) }))} /></div>
            </div>

            {(grossWithGst(form.annual_price) > AUTO_DEBIT_THRESHOLD || grossWithGst(form.monthly_price) > AUTO_DEBIT_THRESHOLD) && (
              <div className="mb-4 -mt-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ A cadence gross (price + 18% GST) exceeds ₹{AUTO_DEBIT_THRESHOLD.toLocaleString('en-IN')}.
                Above this, RBI requires the host to approve <strong>every</strong> auto-debit — auto-renew won't be frictionless for that cadence.
              </div>
            )}

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Limits <span className="normal-case font-normal">(-1 = unlimited)</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {LIMIT_KEYS.map(([k, label]) => (
                <div key={k}><label className="block text-[10px] font-semibold text-gray-500 mb-1">{label}</label>
                  <input type="number" min="-1" className="fb-input text-sm" value={form.limits[k] ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, limits: { ...f.limits, [k]: Number(e.target.value) } }))} /></div>
              ))}
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Calendar integrations</p>
            <div className="flex gap-4 mb-4">
              {CALENDAR_APPS.map((app) => (
                <label key={app} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={(form.integrations.calendar_apps || []).includes(app)}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      integrations: {
                        ...f.integrations,
                        calendar_apps: e.target.checked
                          ? [...(f.integrations.calendar_apps || []), app]
                          : (f.integrations.calendar_apps || []).filter((a) => a !== app),
                      },
                    }))} />
                  {app.replace('_', ' ')}
                </label>
              ))}
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Feature toggles</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-4 text-[12px]">
              {FEATURE_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={!!form.features[k]}
                    onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, [k]: e.target.checked } }))} />
                  {k.replace(/_/g, ' ')}
                </label>
              ))}
            </div>

            <div className="mb-4"><label className="block text-xs font-semibold text-gray-500 mb-1">Support type</label>
              <select className="fb-input text-sm w-56" value={form.support_type} onChange={(e) => setForm((f) => ({ ...f, support_type: e.target.value }))}>
                <option value="standard">Standard</option>
                <option value="priority_email">Priority email</option>
                <option value="priority">Priority</option>
              </select></div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => setEditing(null)} className="btn btn--outline px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="btn bg-gray-900 text-white px-5 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
