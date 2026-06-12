import { useState, useEffect, useCallback } from 'react';
import { adminAuditLogs, adminAuditActions } from '../../services/api';
import toast from 'react-hot-toast';

// Read-only viewer for the append-only admin action trail (admin_audit_logs).
// Filter by action + date range; paginated. Every mutating admin endpoint writes
// here, so this is the single place to answer "who did what, when".

const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const AdminAudit = () => {
  const [logs, setLogs]       = useState([]);
  const [actions, setActions] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState({ action: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.action) params.action = filters.action;
      if (filters.from) params.from = new Date(filters.from).toISOString();
      if (filters.to) params.to = new Date(filters.to).toISOString();
      const { data } = await adminAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { adminAuditActions().then((r) => setActions(r.data.actions || [])).catch(() => {}); }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Append-only trail of every admin action. {total} record{total === 1 ? '' : 's'}.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">Action</label>
          <select className="fb-input text-sm" value={filters.action}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, action: e.target.value })); }}>
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
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
        {(filters.action || filters.from || filters.to) && (
          <button onClick={() => { setPage(1); setFilters({ action: '', from: '', to: '' }); }}
            className="fb-btn fb-btn--secondary text-xs">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border rounded-2xl py-16 text-center text-gray-400">No audit records match these filters.</div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Resource</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors align-top">
                  <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{fmt(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{l.admin_email || '—'}</p>
                    {l.admin_role && <p className="text-[11px] text-gray-400">{l.admin_role}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[12px] text-gray-500">
                    {l.resource_type ? <>{l.resource_type}{l.resource_id ? <span className="text-gray-300"> · {l.resource_id}</span> : null}</> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="fb-btn fb-btn--secondary text-xs disabled:opacity-40">Previous</button>
          <span className="text-[12px] text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="fb-btn fb-btn--secondary text-xs disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminAudit;
