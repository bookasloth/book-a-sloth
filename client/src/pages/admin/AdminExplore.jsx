/**
 * AdminExplore.jsx
 * Manage all Explore page revenue placements.
 * Tabs: Featured Slots | Sponsored Keywords | Collections | Boosts | Verified Badges
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle, Star, Zap, BookMarked, Tag, BadgeCheck } from 'lucide-react';
import {
  adminGetExploreFeatured, adminCreateExploreFeatured, adminDeleteExploreFeatured,
  adminGetExploreCollections, adminCreateExploreCollection, adminUpdateExploreCollection,
  adminAddToExploreCollection, adminRemoveFromExploreCollection,
  adminGetExploreBoosts, adminCreateExploreBoost, adminRevokeExploreBoost,
  adminGetExploreVerified, adminGrantExploreVerified, adminRevokeExploreVerified,
  adminGetExploreKeywords, adminCreateExploreKeyword, adminRevokeExploreKeyword,
} from '../../services/api';

// ── Shared empty-state ────────────────────────────────────────
const Empty = ({ label }) => (
  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-[6px]">
    <p className="text-gray-400 text-sm font-medium">{label}</p>
  </div>
);

// ── Shared section card ───────────────────────────────────────
const Section = ({ children }) => (
  <div className="bg-white border-2 border-[#1E1E1E] rounded-[6px] shadow-[4px_4px_0_#1E1E1E] p-6 space-y-4">
    {children}
  </div>
);

const Btn = ({ onClick, variant = 'primary', disabled, children, className = '' }) => {
  const base = 'btn inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold transition-shadow disabled:opacity-50';
  const v = {
    primary: 'bg-[#FE5100] text-white shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]',
    ghost:   'btn--outline bg-white text-[#1E1E1E] shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]',
    danger:  'bg-[#EF4444] text-white shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]',
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>{children}</button>;
};

const Input = ({ label, ...props }) => (
  <label className="block">
    <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wide mb-1 block">{label}</span>
    <input className="w-full border-2 border-[#1E1E1E] rounded-[4px] px-3 py-2 text-sm font-medium
                      bg-white outline-none focus:border-[#FE5100] transition-colors" {...props} />
  </label>
);

// ── TAB: Featured Slots ───────────────────────────────────────
function FeaturedTab() {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ vendor_id: '', slot_position: 1, starts_at: '', ends_at: '', price_paid: '', notes: '' });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetExploreFeatured();
      setSlots(res.data.slots || []);
    } catch { toast.error('Failed to load featured slots'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.vendor_id || !form.starts_at || !form.ends_at) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      await adminCreateExploreFeatured(form);
      toast.success('Featured slot created');
      setForm({ vendor_id: '', slot_position: 1, starts_at: '', ends_at: '', price_paid: '', notes: '' });
      load();
    } catch { toast.error('Failed to create slot'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this featured slot?')) return;
    try { await adminDeleteExploreFeatured(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-6">
      <Section>
        <h3 className="font-bold text-[#1E1E1E] flex items-center gap-2"><Star size={16} className="text-[#FE5100]" /> Add Featured Slot</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor ID *" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} placeholder="profiles.id (UUID)" />
          <div>
            <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wide mb-1 block">Slot Position (1–5) *</span>
            <select value={form.slot_position} onChange={e => setForm(f => ({ ...f, slot_position: Number(e.target.value) }))}
              className="w-full border-2 border-[#1E1E1E] rounded-[4px] px-3 py-2 text-sm font-medium bg-white outline-none">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>Slot {n}</option>)}
            </select>
          </div>
          <Input label="Starts at *" type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
          <Input label="Ends at *"   type="datetime-local" value={form.ends_at}   onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
          <Input label="Price paid (₹)" type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))} />
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <Btn onClick={create} disabled={saving}><Plus size={14} /> {saving ? 'Saving…' : 'Add Slot'}</Btn>
      </Section>

      <Section>
        <h3 className="font-bold text-[#1E1E1E]">Active Featured Slots ({slots.length})</h3>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : slots.length === 0 ? <Empty label="No featured slots yet" /> : (
          <div className="space-y-2">
            {slots.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border-2 border-[#E5E5E5] rounded-[4px] bg-[#FFF8EE]">
                <div>
                  <p className="font-bold text-sm text-[#1E1E1E]">Slot {s.slot_position} — {s.profiles?.name || s.vendor_id}</p>
                  <p className="text-xs text-[#64748b]">{new Date(s.starts_at).toLocaleDateString()} → {new Date(s.ends_at).toLocaleDateString()} · ₹{s.price_paid}</p>
                </div>
                <Btn variant="danger" onClick={() => remove(s.id)}><Trash2 size={13} /></Btn>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── TAB: Sponsored Keywords ───────────────────────────────────
function KeywordsTab() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ vendor_id: '', keyword: '', bid_amount: '', starts_at: '', ends_at: '' });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetExploreKeywords(); setKeywords(r.data.keywords || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.vendor_id || !form.keyword || !form.starts_at || !form.ends_at) return toast.error('Fill all fields');
    setSaving(true);
    try { await adminCreateExploreKeyword(form); toast.success('Keyword created'); setForm({ vendor_id: '', keyword: '', bid_amount: '', starts_at: '', ends_at: '' }); load(); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const revoke = async (id) => {
    try { await adminRevokeExploreKeyword(id); toast.success('Revoked'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <Section>
        <h3 className="font-bold text-[#1E1E1E] flex items-center gap-2"><Tag size={16} className="text-[#FE5100]" /> Add Sponsored Keyword</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor ID *" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} />
          <Input label="Keyword / Category slug *" value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder="e.g. yoga, fitness" />
          <Input label="Bid amount (₹) *" type="number" value={form.bid_amount} onChange={e => setForm(f => ({ ...f, bid_amount: e.target.value }))} />
          <div />
          <Input label="Starts at *" type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
          <Input label="Ends at *"   type="datetime-local" value={form.ends_at}   onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
        </div>
        <Btn onClick={create} disabled={saving}><Plus size={14} /> {saving ? 'Saving…' : 'Add Keyword'}</Btn>
      </Section>
      <Section>
        <h3 className="font-bold text-[#1E1E1E]">Active Sponsorships ({keywords.length})</h3>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : keywords.length === 0 ? <Empty label="No sponsored keywords yet" /> : (
          <div className="space-y-2">
            {keywords.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 border-2 border-[#E5E5E5] rounded-[4px]">
                <div>
                  <p className="font-bold text-sm text-[#1E1E1E]">"{k.keyword}" → {k.profiles?.name || k.vendor_id}</p>
                  <p className="text-xs text-[#64748b]">₹{k.bid_amount}/period · until {new Date(k.ends_at).toLocaleDateString()}</p>
                </div>
                <Btn variant="danger" onClick={() => revoke(k.id)}><Trash2 size={13} /></Btn>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── TAB: Collections ──────────────────────────────────────────
function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ title: '', subtitle: '', slug: '', icon_emoji: '✨', is_paid: false });
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetExploreCollections(); setCollections(r.data.collections || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.title || !form.slug) return toast.error('Title and slug are required');
    setSaving(true);
    try { await adminCreateExploreCollection(form); toast.success('Collection created'); setForm({ title: '', subtitle: '', slug: '', icon_emoji: '✨', is_paid: false }); load(); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (col) => {
    try { await adminUpdateExploreCollection(col.id, { is_active: !col.is_active }); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <Section>
        <h3 className="font-bold text-[#1E1E1E] flex items-center gap-2"><BookMarked size={16} className="text-[#FE5100]" /> New Collection</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Slug *"  value={form.slug}  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}  placeholder="e.g. top-picks" />
          <Input label="Subtitle" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          <Input label="Icon emoji" value={form.icon_emoji} onChange={e => setForm(f => ({ ...f, icon_emoji: e.target.value }))} />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input type="checkbox" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} className="accent-[#FE5100]" />
          Paid collection (vendors paid to be included)
        </label>
        <Btn onClick={create} disabled={saving}><Plus size={14} /> {saving ? 'Saving…' : 'Create Collection'}</Btn>
      </Section>
      <Section>
        <h3 className="font-bold text-[#1E1E1E]">Collections ({collections.length})</h3>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : collections.length === 0 ? <Empty label="No collections yet" /> : (
          <div className="space-y-3">
            {collections.map(col => (
              <div key={col.id} className="border-2 border-[#E5E5E5] rounded-[4px] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-[#1E1E1E]">{col.icon_emoji} {col.title} {col.is_paid && <span className="text-[10px] bg-[#FE5100] text-white px-1.5 py-0.5 rounded ml-1">Paid</span>}</p>
                    <p className="text-xs text-[#64748b]">{col.subtitle} · {(col.explore_collection_vendors || []).length} vendors</p>
                  </div>
                  <Btn variant={col.is_active ? 'ghost' : 'primary'} onClick={() => toggle(col)}>
                    {col.is_active ? 'Deactivate' : 'Activate'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── TAB: Boosts ───────────────────────────────────────────────
function BoostsTab() {
  const [boosts, setBoosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ vendor_id: '', boost_type: 'standard', starts_at: '', ends_at: '', price_paid: '' });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetExploreBoosts(); setBoosts(r.data.boosts || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.vendor_id || !form.starts_at || !form.ends_at) return toast.error('Fill all fields');
    setSaving(true);
    try { await adminCreateExploreBoost(form); toast.success('Boost created'); setForm({ vendor_id: '', boost_type: 'standard', starts_at: '', ends_at: '', price_paid: '' }); load(); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const revoke = async (id) => {
    try { await adminRevokeExploreBoost(id); toast.success('Boost revoked'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <Section>
        <h3 className="font-bold text-[#1E1E1E] flex items-center gap-2"><Zap size={16} className="text-[#FFB703]" /> Add Boost</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor ID *" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} />
          <div>
            <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wide mb-1 block">Boost Type *</span>
            <select value={form.boost_type} onChange={e => setForm(f => ({ ...f, boost_type: e.target.value }))}
              className="w-full border-2 border-[#1E1E1E] rounded-[4px] px-3 py-2 text-sm font-medium bg-white outline-none">
              <option value="standard">Standard (1.5×)</option>
              <option value="premium">Premium (2.5×)</option>
            </select>
          </div>
          <Input label="Starts at *" type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
          <Input label="Ends at *"   type="datetime-local" value={form.ends_at}   onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
          <Input label="Price paid (₹)" type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))} />
        </div>
        <Btn onClick={create} disabled={saving}><Plus size={14} /> {saving ? 'Saving…' : 'Add Boost'}</Btn>
      </Section>
      <Section>
        <h3 className="font-bold text-[#1E1E1E]">Active Boosts ({boosts.length})</h3>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : boosts.length === 0 ? <Empty label="No active boosts" /> : (
          <div className="space-y-2">
            {boosts.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 border-2 border-[#E5E5E5] rounded-[4px]">
                <div>
                  <p className="font-bold text-sm text-[#1E1E1E]">{b.profiles?.name || b.vendor_id} · {b.boost_type === 'premium' ? '2.5×' : '1.5×'}</p>
                  <p className="text-xs text-[#64748b]">until {new Date(b.ends_at).toLocaleDateString()} · ₹{b.price_paid}</p>
                </div>
                <Btn variant="danger" onClick={() => revoke(b.id)}><Trash2 size={13} /></Btn>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── TAB: Verified Badges ──────────────────────────────────────
function VerifiedTab() {
  const [verified, setVerified] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ vendor_id: '', expires_at: '', price_paid: '' });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetExploreVerified(); setVerified(r.data.verified || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const grant = async () => {
    if (!form.vendor_id) return toast.error('Vendor ID required');
    setSaving(true);
    try { await adminGrantExploreVerified(form); toast.success('Badge granted'); setForm({ vendor_id: '', expires_at: '', price_paid: '' }); load(); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const revoke = async (id) => {
    try { await adminRevokeExploreVerified(id); toast.success('Badge revoked'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <Section>
        <h3 className="font-bold text-[#1E1E1E] flex items-center gap-2"><BadgeCheck size={16} className="text-[#FE5100]" /> Grant Verified Badge</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor ID *" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} />
          <Input label="Expires at (leave blank = never)" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          <Input label="Price paid (₹)" type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))} />
        </div>
        <Btn onClick={grant} disabled={saving}><CheckCircle size={14} /> {saving ? 'Saving…' : 'Grant Badge'}</Btn>
      </Section>
      <Section>
        <h3 className="font-bold text-[#1E1E1E]">Verified Vendors ({verified.length})</h3>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : verified.length === 0 ? <Empty label="No verified vendors yet" /> : (
          <div className="space-y-2">
            {verified.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 border-2 border-[#E5E5E5] rounded-[4px]">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={16} className="text-[#FE5100]" />
                  <div>
                    <p className="font-bold text-sm text-[#1E1E1E]">{v.profiles?.name || v.vendor_id}</p>
                    <p className="text-xs text-[#64748b]">
                      {v.expires_at ? `Expires ${new Date(v.expires_at).toLocaleDateString()}` : 'Never expires'} · ₹{v.price_paid}
                    </p>
                  </div>
                </div>
                <Btn variant="danger" onClick={() => revoke(v.id)}><Trash2 size={13} /></Btn>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
const TABS = [
  { key: 'featured',    label: 'Featured Slots',       icon: Star },
  { key: 'keywords',   label: 'Sponsored Keywords',   icon: Tag },
  { key: 'collections',label: 'Collections',          icon: BookMarked },
  { key: 'boosts',     label: 'Boosts',               icon: Zap },
  { key: 'verified',   label: 'Verified Badges',      icon: BadgeCheck },
];

export default function AdminExplore() {
  const [tab, setTab] = useState('featured');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1E1E1E]">Explore Page</h1>
        <p className="text-sm text-[#64748b] mt-1">Manage paid placements and revenue features on the public Explore page.</p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#E5E5E5] pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold border-2 border-b-0 rounded-t-[4px]
                          transition-colors
                          ${active
                            ? 'bg-white border-[#1E1E1E] text-[#FE5100]'
                            : 'bg-[#FFF8EE] border-transparent text-[#64748b] hover:text-[#1E1E1E]'
                          }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'featured'     && <FeaturedTab />}
        {tab === 'keywords'    && <KeywordsTab />}
        {tab === 'collections' && <CollectionsTab />}
        {tab === 'boosts'      && <BoostsTab />}
        {tab === 'verified'    && <VerifiedTab />}
      </div>
    </div>
  );
}
