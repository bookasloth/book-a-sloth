// Reports — what works: calls and results by category and by area, so weak
// segments can be dropped from the next lists.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Table, Skeleton } from '../../../components/admin/ui';
import { crmColdCallReports } from '../../../services/api';
import { Chips, Kpi, SectionTitle, Bar, pct } from './ccUi';
import { OUTCOMES } from './coldCallUtils';

const columns = (label) => [
  { key: 'key', label, render: (r) => <span className="font-semibold adm-t1">{r.key}</span> },
  { key: 'calls', label: 'Calls' },
  { key: 'connected', label: 'Connected', render: (r) => `${r.connected} · ${pct(r.connected, r.calls)}%` },
  { key: 'interested', label: 'Interested', render: (r) => <span className={r.interested ? 'text-emerald-600 font-semibold' : ''}>{r.interested} · {pct(r.interested, r.calls)}%</span> },
  { key: 'signedUp', label: 'Signed up' },
];

export default function ColdCallReports() {
  const [days, setDays] = useState(30);
  const [r, setR] = useState(null);
  useEffect(() => {
    let alive = true;
    setR(null);
    crmColdCallReports({ days }).then(({ data }) => { if (alive) setR(data); })
      .catch((e) => { toast.error(e.response?.data?.message || 'Could not load reports'); if (alive) setR(false); });
    return () => { alive = false; };
  }, [days]);

  const t = r?.totals;
  const maxObj = t?.objections?.[0]?.n || 1;
  return (
    <div className="space-y-4">
      <Chips label="Period" value={days} onChange={setDays} options={[
        { value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }, { value: 365, label: 'Year' },
      ]} />
      {r === null ? <Skeleton className="h-64 rounded-2xl" /> : !r ? <Card className="p-10 text-center adm-t3">Couldn't load reports.</Card> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon="phone" value={t.calls} label="Calls" />
            <Kpi icon="users" value={t.connected} label="Connected" sub={`${pct(t.connected, t.calls)}% of calls`} tone="blue" />
            <Kpi icon="star" value={t.interested} label="Interested" sub={`${pct(t.interested, t.calls)}% of calls`} tone="green" />
            <Kpi icon="activity" value={`${pct(t.interested, t.connected)}%`} label="Interested when connected" tone="amber" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="!p-5">
              <SectionTitle>Outcomes</SectionTitle>
              {OUTCOMES.map((o) => (
                <div key={o.key} className="flex items-center gap-3 text-[12.5px] mb-2">
                  <span className="w-32 adm-t2">{o.label}</span>
                  <div className="flex-1"><Bar value={pct(t.byOutcome[o.key] || 0, t.calls)} /></div>
                  <b className="w-10 text-right adm-t1">{t.byOutcome[o.key] || 0}</b>
                </div>
              ))}
            </Card>
            <Card className="!p-5">
              <SectionTitle>Top objections</SectionTitle>
              {t.objections.length === 0 ? <div className="text-[12.5px] adm-t3">None tagged yet. Tag them in the Objections tab on the lead page.</div>
                : t.objections.map((o) => (
                  <div key={o.label} className="flex items-center gap-3 text-[12.5px] mb-2">
                    <span className="w-48 adm-t2 truncate" title={o.label}>{o.label}</span>
                    <div className="flex-1"><Bar value={(o.n / maxObj) * 100} color="#fdba74" /></div>
                    <b className="w-8 text-right adm-t1">{o.n}</b>
                  </div>
                ))}
            </Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div><SectionTitle>By category</SectionTitle>
              <Table columns={columns('Category')} rows={r.byCategory} rowKey={(x) => x.key} empty={<div className="p-8 text-center adm-t3 text-[13px]">No calls in this period.</div>} /></div>
            <div><SectionTitle>By area</SectionTitle>
              <Table columns={columns('Area')} rows={r.byArea} rowKey={(x) => x.key} empty={<div className="p-8 text-center adm-t3 text-[13px]">No calls in this period.</div>} /></div>
          </div>
        </>
      )}
    </div>
  );
}
