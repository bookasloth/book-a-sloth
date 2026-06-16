import { useState, useEffect, useCallback } from 'react';
import { adminGetPayouts, adminApprovePayout, adminRejectPayout, adminMarkPayoutPaid } from '../../services/api';
import toast from 'react-hot-toast';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS = {
  pending:  'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15',
  approved: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/15',
  paid:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15',
};
const TABS = ['pending', 'approved', 'paid', 'rejected', 'all'];

const Modal = ({ title, label, placeholder, confirmText, onClose, onConfirm }) => {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
        <label className="block mb-3">
          <span className="text-[12px] text-gray-500">{label}</span>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder}
            className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FE5100]/30 focus:border-[#FE5100]" />
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button disabled={!val.trim()} onClick={() => onConfirm(val.trim())}
            className="btn px-4 py-2 text-sm font-semibold bg-[#FE5100] text-white hover:bg-[#e54900] disabled:opacity-40">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const AdminPayouts = () => {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { kind: 'reject'|'pay', id }

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminGetPayouts(tab); setRows(data || []); }
    catch { toast.error('Failed to load payouts'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, id, ...args) => {
    try { await fn(id, ...args); toast.success('Done'); load(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Action failed'); }
  };

  return (
    <div className="max-w-[1100px]">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Payouts</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Approve, reject, and mark vendor payout requests as paid.</p>
      </div>

      <div className="flex gap-1.5 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium capitalize transition-colors
              ${t === tab ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-white border border-gray-200/70 rounded-xl animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl py-16 text-center text-[13px] text-gray-400">No {tab === 'all' ? '' : tab} payout requests.</div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-xl overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-gray-50/60 text-[11px] uppercase tracking-wide text-gray-400 text-left">
                <th className="px-4 py-2.5 font-semibold">Vendor</th>
                <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                <th className="px-4 py-2.5 font-semibold">Requested</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.profiles?.name || '—'}</p>
                    {r.profiles?.username && <p className="text-[11.5px] text-gray-400">@{r.profiles.username}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS[r.status] || STATUS.pending}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => act(adminApprovePayout, r.id)} className="btn px-2.5 py-1 text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700">Approve</button>
                          <button onClick={() => setModal({ kind: 'reject', id: r.id })} className="btn btn--outline px-2.5 py-1 text-[12px] font-medium text-rose-600 hover:bg-rose-50">Reject</button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => setModal({ kind: 'pay', id: r.id })} className="btn px-2.5 py-1 text-[12px] font-medium bg-[#FE5100] text-white hover:bg-[#e54900]">Mark Paid</button>
                      )}
                      {r.status === 'paid' && <span className="text-[11.5px] text-gray-400 font-mono">{r.payment_reference || '—'}</span>}
                      {r.status === 'rejected' && <span className="text-[11.5px] text-gray-400 truncate max-w-[200px]" title={r.admin_note}>{r.admin_note || '—'}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.kind === 'reject' && (
        <Modal title="Reject payout request" label="Reason (shown to vendor)" placeholder="e.g. Bank details missing" confirmText="Reject"
          onClose={() => setModal(null)}
          onConfirm={(reason) => { setModal(null); act(adminRejectPayout, modal.id, reason); }} />
      )}
      {modal?.kind === 'pay' && (
        <Modal title="Mark payout as paid" label="Payment reference (UTR / txn id)" placeholder="e.g. UTR1234567890" confirmText="Mark Paid"
          onClose={() => setModal(null)}
          onConfirm={(ref) => { setModal(null); act(adminMarkPayoutPaid, modal.id, ref); }} />
      )}
    </div>
  );
};

export default AdminPayouts;
