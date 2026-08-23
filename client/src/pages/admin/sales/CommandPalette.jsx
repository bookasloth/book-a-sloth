import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmListLeads } from '../../../services/api';

// Notion-style ⌘K command bar. Opens on Cmd/Ctrl+K anywhere it's mounted.
// Searches leads live + offers quick actions/navigation. Keyboard-first.
export default function CommandPalette({ onOpenLead, onNewLead }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const t = useRef();

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { if (open) { setQ(''); setResults([]); setSel(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  // Debounced lead search.
  useEffect(() => {
    clearTimeout(t.current);
    if (!q.trim()) { setResults([]); return; }
    t.current = setTimeout(() => {
      crmListLeads({ q, pageSize: 6 }).then(({ data }) => setResults(data.rows || [])).catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(t.current);
  }, [q]);

  const actions = useMemo(() => {
    const base = [
      { id: 'a-new', label: 'New lead', hint: 'Create', run: () => { setOpen(false); onNewLead?.(); } },
      { id: 'a-leads', label: 'Go to Leads', run: () => { setOpen(false); nav('/admin/sales/leads'); } },
      { id: 'a-pipeline', label: 'Go to Pipeline', run: () => { setOpen(false); nav('/admin/sales/pipeline'); } },
      { id: 'a-followups', label: 'Go to Follow-ups', run: () => { setOpen(false); nav('/admin/sales/follow-ups'); } },
      { id: 'a-templates', label: 'Go to Templates', run: () => { setOpen(false); nav('/admin/sales/templates'); } },
    ];
    const ql = q.trim().toLowerCase();
    return ql ? base.filter((a) => a.label.toLowerCase().includes(ql)) : base;
  }, [q, nav, onNewLead]);

  const items = [
    ...actions.map((a) => ({ type: 'action', ...a })),
    ...results.map((r) => ({
      type: 'lead', id: r.id, label: r.name || 'Unnamed lead',
      hint: [r.business_name, r.phone, r.email].filter(Boolean)[0] || '',
      run: () => { setOpen(false); onOpenLead ? onOpenLead(r.id) : nav(`/admin/sales/leads/${r.id}`); },
    })),
  ];
  const clampedSel = Math.min(sel, Math.max(0, items.length - 1));

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[clampedSel]?.run(); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-xl rounded-2xl adm-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey}
          placeholder="Search leads or run a command…"
          className="w-full px-4 py-3 text-[15px] bg-transparent outline-none border-b border-gray-100" />
        <div className="max-h-80 overflow-auto py-1">
          {items.length === 0 && <p className="px-4 py-6 text-center text-[13px] adm-t3">No matches.</p>}
          {items.map((it, i) => (
            <button key={it.type + it.id} type="button"
              onMouseEnter={() => setSel(i)} onClick={() => it.run()}
              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 ${i === clampedSel ? 'bg-[#FE5100]/10' : ''}`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] uppercase adm-t3 w-9 flex-shrink-0">{it.type === 'lead' ? 'Lead' : 'Cmd'}</span>
                <span className="text-[13px] adm-t1 truncate">{it.label}</span>
              </span>
              {it.hint && <span className="text-[11px] adm-t3 truncate flex-shrink-0 max-w-[45%]">{it.hint}</span>}
            </button>
          ))}
        </div>
        <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] adm-t3 flex gap-3">
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span><span className="ml-auto">⌘K</span>
        </div>
      </div>
    </div>
  );
}
