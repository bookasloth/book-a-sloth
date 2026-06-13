import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  adminFinanceJournals, adminFinanceJournal, adminFinanceAccounts,
  adminFinanceAdjustment, adminFinanceReversal, adminFinanceBankTransfer,
} from '../../services/api';
import toast from 'react-hot-toast';

// Journal browser — append-only double-entry record. Corrections happen ONLY
// through adjustment/reversal entries (the modal); nothing is ever edited.

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');
const SOURCES = ['ORDER_PAYMENT', 'SUBSCRIPTION_PAYMENT', 'BANK_TRANSFER', 'ADJUSTMENT', 'REVERSAL', 'BACKFILL', 'BACKFILL_SETTLEMENT'];

const emptyLine = () => ({ account_code: '', debit: '', credit: '' });

const AdminJournal = () => {
  const [journals, setJournals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ source_type: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);   // journal id → { entry, lines }
  const [lineCache, setLineCache] = useState({});
  const [modal, setModal] = useState(null);          // 'adjustment' | 'transfer' | null
  const [accounts, setAccounts] = useState([]);
  const [adjLines, setAdjLines] = useState([emptyLine(), emptyLine()]);
  const [adjDesc, setAdjDesc] = useState('');
  const [transfer, setTransfer] = useState({ amount: '', reference: '' });
  const [saving, setSaving] = useState(false);
  const limit = 25;

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.source_type) params.source_type = filters.source_type;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await adminFinanceJournals(params);
      setJournals(data.journals || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchJournals(); }, [fetchJournals]);
  useEffect(() => { adminFinanceAccounts().then((r) => setAccounts(r.data.accounts || [])).catch(() => {}); }, []);

  const toggle = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    if (!lineCache[id]) {
      try {
        const { data } = await adminFinanceJournal(id);
        setLineCache((c) => ({ ...c, [id]: data.lines || [] }));
      } catch { toast.error('Failed to load lines'); }
    }
  };

  const reverse = async (id) => {
    if (!window.confirm('Post a reversal entry mirroring this journal entry?')) return;
    try {
      await adminFinanceReversal({ journal_entry_id: id });
      toast.success('Reversal posted');
      fetchJournals();
    } catch (e) { toast.error(e.response?.data?.message || 'Reversal failed'); }
  };

  const submitAdjustment = async () => {
    setSaving(true);
    try {
      const lines = adjLines
        .filter((l) => l.account_code)
        .map((l) => ({ account_code: l.account_code, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 }));
      await adminFinanceAdjustment({ description: adjDesc, lines });
      toast.success('Adjustment posted');
      setModal(null); setAdjLines([emptyLine(), emptyLine()]); setAdjDesc('');
      fetchJournals();
    } catch (e) { toast.error(e.response?.data?.message || 'Adjustment failed'); }
    finally { setSaving(false); }
  };

  const submitTransfer = async () => {
    setSaving(true);
    try {
      await adminFinanceBankTransfer({ amount: Number(transfer.amount), reference: transfer.reference });
      toast.success('Bank transfer recorded');
      setModal(null); setTransfer({ amount: '', reference: '' });
      fetchJournals();
    } catch (e) { toast.error(e.response?.data?.message || 'Transfer failed'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const entryAmount = (id) => {
    const lines = lineCache[id];
    if (!lines) return null;
    return lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  };

  // Client-side balance gate for the adjustment modal — catch an unbalanced or
  // single-sided entry before the server 400 round-trip.
  const adjFilled = adjLines.filter((l) => l.account_code);
  const adjDebit = Math.round(adjFilled.reduce((s, l) => s + (Number(l.debit) || 0), 0) * 100) / 100;
  const adjCredit = Math.round(adjFilled.reduce((s, l) => s + (Number(l.credit) || 0), 0) * 100) / 100;
  const adjBalanced = adjFilled.length >= 2 && adjDebit > 0 && adjDebit === adjCredit;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Journal</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Append-only double-entry record. {total} entr{total === 1 ? 'y' : 'ies'}.</p>
        </div>
        <div className="flex gap-2">
          <button className="fb-btn fb-btn--secondary text-xs" onClick={() => setModal('transfer')}>Record bank transfer</button>
          <button className="fb-btn text-xs" onClick={() => setModal('adjustment')}>New adjustment</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">Source</label>
          <select className="fb-input text-sm" value={filters.source_type}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, source_type: e.target.value })); }}>
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">From</label>
          <input type="date" className="fb-input text-sm" value={filters.from}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, from: e.target.value })); }} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">To</label>
          <input type="date" className="fb-input text-sm" value={filters.to}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, to: e.target.value })); }} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : journals.length === 0 ? (
        <div className="bg-white border rounded-2xl py-16 text-center text-gray-400">No journal entries match these filters.</div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b">
                <th className="px-4 py-3 font-semibold">Entry</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Description</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <Fragment key={j.id}>
                  <tr className="border-b last:border-0 hover:bg-gray-50/60 cursor-pointer" onClick={() => toggle(j.id)}>
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-gray-700">{j.journal_number}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{fmt(j.journal_date)}</td>
                    <td className="px-4 py-3"><span className="text-[11px] font-mono px-2 py-1 rounded bg-gray-100 text-gray-700">{j.source_type}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell text-[12px] text-gray-500 truncate max-w-[280px]">{j.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-[11px] text-gray-500 underline min-h-[44px] px-2" onClick={(e) => { e.stopPropagation(); reverse(j.id); }}>Reverse</button>
                    </td>
                  </tr>
                  {expanded === j.id && (
                    <tr className="bg-gray-50/60 border-b">
                      <td colSpan={5} className="px-6 py-3">
                        {!lineCache[j.id] ? (
                          <div className="h-8 bg-gray-100 rounded animate-pulse" />
                        ) : (
                          <table className="w-full text-[12px]">
                            <tbody>
                              {lineCache[j.id].map((l) => (
                                <tr key={l.id}>
                                  <td className="py-1 pr-3 font-mono text-gray-500">{l.chart_of_accounts?.code}</td>
                                  <td className="py-1 pr-3 text-gray-700">{l.chart_of_accounts?.name}</td>
                                  <td className="py-1 pr-3 text-right tabular-nums">{Number(l.debit) > 0 ? inr(l.debit) : ''}</td>
                                  <td className="py-1 text-right tabular-nums text-gray-500">{Number(l.credit) > 0 ? inr(l.credit) : ''}</td>
                                </tr>
                              ))}
                              <tr className="border-t">
                                <td colSpan={2} className="py-1 pr-3 text-gray-400">Entry total</td>
                                <td className="py-1 pr-3 text-right tabular-nums font-semibold">{inr(entryAmount(j.id))}</td>
                                <td className="py-1 text-right tabular-nums font-semibold text-gray-500">{inr(entryAmount(j.id))}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="fb-btn fb-btn--secondary text-xs disabled:opacity-40">Previous</button>
          <span className="text-[12px] text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="fb-btn fb-btn--secondary text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Manual-entry modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            {modal === 'transfer' ? (
              <>
                <h2 className="font-bold text-gray-900 mb-1">Record bank transfer</h2>
                <p className="text-[12px] text-gray-400 mb-4">Razorpay settlement received in the bank account. DR Bank / CR Razorpay Receivable.</p>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Amount (₹)</label>
                <input type="number" min="0.01" step="0.01" className="fb-input text-sm w-full mb-3" value={transfer.amount}
                  onChange={(e) => setTransfer((t) => ({ ...t, amount: e.target.value }))} />
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Settlement reference</label>
                <input type="text" className="fb-input text-sm w-full mb-5" value={transfer.reference} placeholder="setl_..."
                  onChange={(e) => setTransfer((t) => ({ ...t, reference: e.target.value }))} />
                <div className="flex justify-end gap-2">
                  <button className="fb-btn fb-btn--secondary text-xs" onClick={() => setModal(null)}>Cancel</button>
                  <button className="fb-btn text-xs disabled:opacity-40" disabled={saving || !(Number(transfer.amount) > 0)} onClick={submitTransfer}>
                    {saving ? 'Posting…' : 'Post entry'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-bold text-gray-900 mb-1">New adjustment entry</h2>
                <p className="text-[12px] text-gray-400 mb-4">Debits must equal credits. Posted entries are permanent.</p>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Description</label>
                <input type="text" className="fb-input text-sm w-full mb-3" value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} />
                {adjLines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select className="fb-input text-sm flex-1" value={l.account_code}
                      onChange={(e) => setAdjLines((ls) => ls.map((x, j) => (j === i ? { ...x, account_code: e.target.value } : x)))}>
                      <option value="">Account…</option>
                      {accounts.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="Debit" className="fb-input text-sm w-24 tabular-nums" value={l.debit}
                      onChange={(e) => setAdjLines((ls) => ls.map((x, j) => (j === i ? { ...x, debit: e.target.value, credit: '' } : x)))} />
                    <input type="number" min="0" step="0.01" placeholder="Credit" className="fb-input text-sm w-24 tabular-nums" value={l.credit}
                      onChange={(e) => setAdjLines((ls) => ls.map((x, j) => (j === i ? { ...x, credit: e.target.value, debit: '' } : x)))} />
                  </div>
                ))}
                <button className="text-[11px] text-gray-500 underline mb-4" onClick={() => setAdjLines((ls) => [...ls, emptyLine()])}>+ Add line</button>
                <div className={`text-[12px] mb-4 tabular-nums ${adjBalanced ? 'text-green-600' : 'text-gray-400'}`}>
                  Debits {inr(adjDebit)} · Credits {inr(adjCredit)}
                  {!adjBalanced && <span className="ml-1 text-gray-400">— must balance (≥2 lines, debits = credits)</span>}
                </div>
                <div className="flex justify-end gap-2">
                  <button className="fb-btn fb-btn--secondary text-xs" onClick={() => setModal(null)}>Cancel</button>
                  <button className="fb-btn text-xs disabled:opacity-40" disabled={saving || !adjBalanced} onClick={submitAdjustment}>
                    {saving ? 'Posting…' : 'Post entry'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJournal;
