import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Card, StatCard, Btn, Badge } from '../../../components/admin/ui';
import { crmDashboard, crmListFollowUps, crmRefreshAttribution } from '../../../services/api';
import { FUNNEL, STATUS_LABEL, STATUS_TONE, rupees, relTime } from './salesConstants';
import toast from 'react-hot-toast';

export default function SalesDashboard() {
  const [stats, setStats] = useState(null);
  const [due, setDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => Promise.all([
    crmDashboard().then(({ data }) => setStats(data)).catch(() => setStats(null)),
    crmListFollowUps({ before: new Date(Date.now() + 864e5).toISOString() }).then(({ data }) => setDue(Array.isArray(data) ? data : [])).catch(() => setDue([])),
  ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    try { const { data } = await crmRefreshAttribution(); toast.success(`Attribution: ${data.linked} linked, ${data.updated} refreshed`); load(); }
    catch { toast.error('Refresh failed'); }
    finally { setRefreshing(false); }
  };

  if (loading) return <div className="p-6"><p className="adm-t3">Loading…</p></div>;
  const s = stats || { byStatus: {}, funnel: [] };
  const maxFunnel = Math.max(1, ...FUNNEL.map((k) => s.byStatus?.[k] || 0));

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Sales Overview" subtitle="Your pipeline at a glance."
        actions={<Btn variant="outline" size="sm" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh revenue'}</Btn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total leads" value={s.total || 0} icon="users2" iconColor="bg-[#FE5100]" to="/admin/sales/leads" />
        <StatCard label="Paid customers" value={s.paidCustomers || 0} icon="userCheck" iconColor="bg-green-500" sub={`${s.conversionRate || 0}% conversion`} />
        <StatCard label="Revenue attributed" value={rupees(s.revenuePaise)} icon="rupee" iconColor="bg-emerald-600" />
        <StatCard label="Added this week" value={s.addedThisWeek || 0} icon="trendUp" iconColor="bg-blue-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard compact label="Contacted today" value={s.contactedToday || 0} icon="send" iconColor="bg-indigo-500" />
        <StatCard compact label="Follow-ups today" value={s.followUpsDueToday || 0} icon="clock" iconColor="bg-amber-500" to="/admin/sales/follow-ups" />
        <StatCard compact label="Overdue" value={s.followUpsOverdue || 0} icon="alert" iconColor="bg-red-500" to="/admin/sales/follow-ups" />
        <StatCard compact label="Lost" value={s.byStatus?.lost || 0} icon="ban" iconColor="bg-gray-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold adm-t1">Funnel</h2>
            <Link to="/admin/sales/pipeline" className="text-xs font-semibold text-[#FE5100]">Open pipeline →</Link>
          </div>
          <div className="space-y-2">
            {FUNNEL.map((k) => {
              const n = s.byStatus?.[k] || 0;
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-24 text-[12px] adm-t2 flex-shrink-0">{STATUS_LABEL[k]}</span>
                  <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                    <div className="h-full bg-[#FE5100]/80 rounded-lg transition-all" style={{ width: `${(n / maxFunnel) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-[12px] font-bold adm-t1">{n}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold adm-t1">Follow-ups due</h2>
            <Link to="/admin/sales/follow-ups" className="text-xs font-semibold text-[#FE5100]">All →</Link>
          </div>
          {due.length === 0 ? <p className="adm-t3 text-sm">Nothing due. 🦥</p> : (
            <ul className="space-y-2">
              {due.slice(0, 8).map((f) => (
                <li key={f.id}>
                  <Link to={`/admin/sales/leads/${f.lead_id}`} className="block rounded-lg px-3 py-2 adm-hoverable">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] adm-t1 font-medium truncate">{f.title}</span>
                      <span className="text-[11px] adm-t3 flex-shrink-0">{relTime(f.due_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
