import { Card, Badge } from '../../../components/admin/ui';
import { countdown } from './coldCallUtils';

function Row({ item, active, onSelect, right }) {
  const l = item.lead;
  const cc = l.attributes?.cold_call || {};
  return (
    <button type="button" onClick={() => onSelect(l.id)}
      className={`w-full text-left px-3 py-2 rounded-lg adm-hoverable ${active ? 'adm-card' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate text-[13px] ${active ? 'font-semibold adm-t1' : 'adm-t2'}`}>{l.business_name || l.name || l.phone}</span>
        {right}
      </div>
      <div className="text-[11.5px] adm-t3 truncate">{[cc.day, cc.priority && `#${cc.priority}`, l.profession].filter(Boolean).join(' · ')}</div>
    </button>
  );
}

function Group({ title, items, currentId, onSelect, right, empty }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wide adm-t3 px-3 mb-1">{title} ({items.length})</div>
      {items.length === 0 ? <div className="text-[12px] adm-t3 px-3">{empty}</div>
        : items.map((it) => <Row key={it.lead.id} item={it} active={it.lead.id === currentId} onSelect={onSelect} right={right?.(it)} />)}
    </div>
  );
}

export default function ColdCallQueue({ queue, currentId, onSelect, now }) {
  const cb = (it) => <Badge tone={it.overdue ? 'danger' : 'warn'}>{countdown(it.dueAt, now)}</Badge>;
  return (
    <Card className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
      <Group title="Callbacks due" items={queue.callbacksDue} currentId={currentId} onSelect={onSelect} right={cb} empty="None due" />
      <Group title="Retries" items={queue.retries} currentId={currentId} onSelect={onSelect} empty="None due" />
      <Group title="Fresh" items={queue.fresh} currentId={currentId} onSelect={onSelect} empty="Everyone has been called" />
      {queue.upcoming.length > 0 && (
        <Group title="Later callbacks" items={queue.upcoming} currentId={currentId} onSelect={onSelect}
          right={(it) => <Badge tone="neutral">{countdown(it.dueAt, now)}</Badge>} />
      )}
    </Card>
  );
}
