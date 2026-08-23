import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card } from '../../../components/admin/ui';
import { crmListLeads, crmSetStatus, crmListFollowUps } from '../../../services/api';
import { FUNNEL, STATUS_LABEL, rupees, relTime } from './salesConstants';
import toast from 'react-hot-toast';

const PER_COL = 50;

export default function SalesPipeline() {
  const nav = useNavigate();
  const [cols, setCols] = useState({});      // status -> { rows, total }
  const [followMap, setFollowMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      Promise.all(FUNNEL.map((s) => crmListLeads({ status: s, pageSize: PER_COL }).then(({ data }) => [s, data]).catch(() => [s, { rows: [], total: 0 }]))),
      crmListFollowUps({}).then(({ data }) => data).catch(() => []),
    ]).then(([pairs, fu]) => {
      setCols(Object.fromEntries(pairs));
      const m = {}; (Array.isArray(fu) ? fu : []).forEach((f) => { if (!m[f.lead_id] || f.due_at < m[f.lead_id]) m[f.lead_id] = f.due_at; });
      setFollowMap(m);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Drag-drop: move a lead card to another stage → crmSetStatus (optimistic).
  const onDrop = async (toStatus) => {
    setDragOver(null);
    const raw = window.__crmDrag; window.__crmDrag = null;
    if (!raw || raw.from === toStatus) return;
    const { id, from } = raw;
    const lead = (cols[from]?.rows || []).find((r) => r.id === id);
    if (!lead) return;
    // optimistic move
    setCols((c) => ({
      ...c,
      [from]: { rows: c[from].rows.filter((r) => r.id !== id), total: Math.max(0, (c[from].total || 1) - 1) },
      [toStatus]: { rows: [{ ...lead, status: toStatus }, ...(c[toStatus]?.rows || [])], total: (c[toStatus]?.total || 0) + 1 },
    }));
    try { await crmSetStatus(id, toStatus); toast.success(`${lead.name || 'Lead'} → ${STATUS_LABEL[toStatus]}`); }
    catch { toast.error('Move failed'); load(); }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Pipeline" subtitle="Drag a lead between stages to update it. New → Contacted → Responded → Qualified → Demo → Trial → Won." />
      <p className="text-[11px] adm-t3 mb-3 md:hidden">On mobile, tap a card and change the stage from the lead panel (drag-drop needs a mouse).</p>
      {loading ? <p className="adm-t3">Loading…</p> : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {FUNNEL.map((s) => {
            const col = cols[s] || { rows: [], total: 0 };
            const isOver = dragOver === s;
            return (
              <div key={s} className={`flex-shrink-0 w-64 rounded-xl p-1 transition ${isOver ? 'bg-[#FE5100]/10 ring-1 ring-[#FE5100]/40' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
                onDragLeave={() => setDragOver((d) => (d === s ? null : d))}
                onDrop={() => onDrop(s)}>
                <div className="flex items-center justify-between mb-2 px-2 pt-1">
                  <h3 className="text-[12px] font-bold adm-t1 uppercase tracking-wide">{STATUS_LABEL[s]}</h3>
                  <span className="text-[11px] adm-t3">{col.total}</span>
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {col.rows.length === 0 && <p className="text-[11px] adm-t3 px-2">—</p>}
                  {col.rows.map((r) => {
                    const due = followMap[r.id]; const overdue = due && new Date(due) < new Date();
                    const val = r.expected_value_paise || r.revenue_paise;
                    return (
                      <Card key={r.id} className="rounded-xl p-3 cursor-grab active:cursor-grabbing adm-hoverable"
                        draggable
                        onDragStart={() => { window.__crmDrag = { id: r.id, from: s }; }}
                        onClick={() => nav(`/admin/sales/leads/${r.id}`)}>
                        <p className="text-[13px] font-semibold adm-t1 truncate">{r.name || 'Unnamed'}</p>
                        {r.business_name && <p className="text-[11px] adm-t3 truncate">{r.business_name}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[10px] ${overdue ? 'text-red-500 font-medium' : 'adm-t3'}`}>{due ? `Follow up ${relTime(due)}` : relTime(r.last_activity_at || r.created_at)}</span>
                          {val > 0 && <span className="text-[10px] font-semibold text-emerald-600">{rupees(val)}</span>}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
