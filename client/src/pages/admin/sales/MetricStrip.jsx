import { rupees } from './salesConstants';

// Compact, clickable metric strip. Each metric maps to a smart-view key; clicking
// applies that filter. `conv` is display-only (no filter).
export default function MetricStrip({ stats, active, onPick, loading }) {
  const s = stats || {};
  const items = [
    { key: 'all', label: 'Total', value: s.total ?? 0 },
    { key: 'needs_followup', label: 'Needs follow-up', value: s.followUpsDueToday ?? 0, warn: (s.followUpsDueToday ?? 0) > 0 },
    { key: 'overdue', label: 'Overdue', value: s.followUpsOverdue ?? 0, danger: (s.followUpsOverdue ?? 0) > 0 },
    { key: 'qualified', label: 'Qualified', value: s.byStatus?.qualified ?? 0 },
    { key: 'won', label: 'Won', value: s.paidCustomers ?? 0, ok: true },
    { key: null, label: 'Conv. rate', value: `${s.conversionRate ?? 0}%` },
    { key: null, label: 'Pipeline value', value: rupees(s.pipelineValuePaise) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.map((m, i) => {
        const clickable = !!m.key;
        const isActive = clickable && active === m.key;
        return (
          <button key={i} type="button" disabled={!clickable}
            onClick={() => clickable && onPick(m.key)}
            className={`px-3 py-2 rounded-xl border text-left transition min-w-[120px] flex-1
              ${isActive ? 'border-[#FE5100] bg-[#FE5100]/5' : 'adm-card border-transparent'}
              ${clickable ? 'hover:border-[#FE5100]/50 cursor-pointer' : 'cursor-default'}`}>
            <p className="text-[10px] font-semibold adm-t3 uppercase tracking-wide truncate">{m.label}</p>
            <p className={`text-lg font-bold tracking-tight ${m.danger ? 'text-red-500' : m.warn ? 'text-amber-600' : m.ok ? 'text-emerald-600' : 'adm-t1'}`}>
              {loading ? '·' : m.value}
            </p>
          </button>
        );
      })}
    </div>
  );
}
