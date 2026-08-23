import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card } from '../../../components/admin/ui';
import { crmListLeads } from '../../../services/api';
import { FUNNEL, STATUS_LABEL, rupees, relTime } from './salesConstants';

export default function SalesPipeline() {
  const nav = useNavigate();
  const [cols, setCols] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(FUNNEL.map((s) => crmListLeads({ status: s, pageSize: 25 }).then(({ data }) => [s, data]).catch(() => [s, { rows: [], total: 0 }])))
      .then((pairs) => setCols(Object.fromEntries(pairs)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Pipeline" subtitle="Lead → Contacted → Replied → Qualified → Demo → Trial → Activated → Paid" />
      {loading ? <p className="adm-t3">Loading…</p> : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {FUNNEL.map((s) => {
            const col = cols[s] || { rows: [], total: 0 };
            return (
              <div key={s} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-[12px] font-bold adm-t1 uppercase tracking-wide">{STATUS_LABEL[s]}</h3>
                  <span className="text-[11px] adm-t3">{col.total}</span>
                </div>
                <div className="space-y-2">
                  {col.rows.length === 0 && <p className="text-[11px] adm-t3 px-1">—</p>}
                  {col.rows.map((r) => (
                    <Card key={r.id} className="rounded-xl p-3 cursor-pointer adm-hoverable" onClick={() => nav(`/admin/sales/leads/${r.id}`)}>
                      <p className="text-[13px] font-semibold adm-t1 truncate">{r.name || 'Unnamed'}</p>
                      {r.business_name && <p className="text-[11px] adm-t3 truncate">{r.business_name}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] adm-t3">{relTime(r.last_activity_at || r.created_at)}</span>
                        {r.revenue_paise > 0 && <span className="text-[10px] font-semibold text-emerald-600">{rupees(r.revenue_paise)}</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
