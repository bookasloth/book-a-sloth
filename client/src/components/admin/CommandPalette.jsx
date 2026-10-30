// client/src/components/admin/CommandPalette.jsx
// The ONE admin command bar (⌘K, opened from AdminLayout). Searches nav
// destinations. Live-lead search + "New lead" were removed in the growth scrape
// (the Sales CRM is gone).
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Ic from './Ic';
import { IC, NAV, flattenAllDestinations } from './adminNav';

const CommandPalette = ({ open, session, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const all = useMemo(() => flattenAllDestinations(NAV, session), [session]);
  const navMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(d => d.label.toLowerCase().includes(q) || d.section.toLowerCase().includes(q));
  }, [query, all]);

  useEffect(() => { if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);

  // Nav destinations only.
  const items = useMemo(() => {
    const out = [];
    navMatches.forEach(d => out.push({ key: `nav-${d.section}-${d.to}`, kind: d.section, label: d.label, run: () => { onClose(); navigate(d.to); } }));
    return out;
  }, [navMatches, navigate, onClose]);

  const clamped = Math.min(active, Math.max(0, items.length - 1));

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[clamped]?.run(); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] bg-black/40" onMouseDown={onClose}>
      <div className="w-full max-w-lg mx-4 adm-card rounded-xl shadow-2xl overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 border-b adm-border">
          <Ic d={IC.search} size={16} className="text-gray-400" />
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown}
            placeholder="Search admin…" aria-label="Search admin" aria-controls="adm-cmd-listbox"
            className="flex-1 py-3.5 text-[14px] outline-none placeholder:text-gray-400" />
          <kbd className="text-[10px] adm-t3 font-mono adm-chip px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <ul id="adm-cmd-listbox" role="listbox" aria-label="Admin destinations" className="max-h-[50vh] overflow-y-auto py-1.5">
          {items.length === 0 && <li className="px-4 py-6 text-center text-[13px] adm-t3">No matches</li>}
          {items.map((it, i) => (
            <li key={it.key} role="option" aria-selected={i === clamped}
              onMouseEnter={() => setActive(i)} onMouseDown={() => it.run()}
              className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-[13px] ${i === clamped ? 'bg-[#FE5100]/10 text-[#FE5100]' : 'adm-t2'}`}>
              <span className="flex-1 truncate">{it.label}</span>
              <span className="text-[10px] uppercase tracking-wider adm-t3">{it.kind}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
