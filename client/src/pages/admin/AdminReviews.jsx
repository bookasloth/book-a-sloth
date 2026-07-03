import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminGetReviews, adminModerateReview, adminDeleteReview } from '../../services/api';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { PageHeader, Badge, Btn, Skeleton } from '../../components/admin/ui';

const ICON = 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z';

const STATUS_TABS = [
  { key: '',        label: 'All' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'visible', label: 'Visible' },
  { key: 'hidden',  label: 'Hidden' },
];
const STATUS_TONE = { visible: 'ok', flagged: 'warn', hidden: 'danger' };
const DIR_LABEL = { guest_to_host: 'Guest → Host', host_to_guest: 'Host → Guest' };

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const Stars = ({ n }) => (
  <span className="text-amber-500 tracking-tight" title={`${n}/5`}>
    {'★'.repeat(n)}<span className="adm-t3">{'★'.repeat(Math.max(0, 5 - n))}</span>
  </span>
);
const Person = ({ p, fallback = '—' }) => (
  <div className="min-w-0">
    <p className="font-medium adm-t2 truncate">{p?.name || fallback}</p>
    {p?.username && <p className="text-[11px] adm-t3 truncate">@{p.username}</p>}
  </div>
);

const AdminReviews = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(
    STATUS_TABS.some(t => t.key === searchParams.get('status')) ? searchParams.get('status') : ''
  );
  const [direction, setDirection] = useState('');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status) params.status = status;
      if (direction) params.direction = direction;
      if (rating) params.rating = rating;
      if (search.trim()) params.search = search.trim();
      const { data } = await adminGetReviews(params);
      setRows(data.reviews || []);
      setTotal(data.total || 0);
      setPageSize(data.pageSize || 25);
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }, [status, direction, rating, search, page]);

  useEffect(() => { load(); }, [load]);
  // Reset to first page whenever a filter changes.
  useEffect(() => { setPage(1); }, [status, direction, rating, search]);

  const act = async (id, fn) => {
    setBusyId(id);
    try { await fn(); toast.success('Done'); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Action failed'); }
    finally { setBusyId(null); }
  };

  const setReviewStatus = (r, next) => act(r.id, () => adminModerateReview(r.id, { status: next }));
  const remove = (r) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    act(r.id, () => adminDeleteReview(r.id));
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-[1200px]">
      <PageHeader title="Reviews Moderation" subtitle={`${total} review${total !== 1 ? 's' : ''} across the platform`} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 adm-card rounded-xl p-1">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
                ${status === t.key ? 'bg-[#FE5100] text-white' : 'adm-t2 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={direction} onChange={e => setDirection(e.target.value)}
          className="border adm-border rounded-lg px-3 py-2 text-[12.5px] outline-none focus:ring-2 focus:ring-[#FE5100]/30">
          <option value="">All directions</option>
          <option value="guest_to_host">Guest → Host</option>
          <option value="host_to_guest">Host → Guest</option>
        </select>
        <select value={rating} onChange={e => setRating(e.target.value)}
          className="border adm-border rounded-lg px-3 py-2 text-[12.5px] outline-none focus:ring-2 focus:ring-[#FE5100]/30">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comment…"
          className="border adm-border rounded-lg px-3 py-2 text-[12.5px] outline-none focus:ring-2 focus:ring-[#FE5100]/30 flex-1 min-w-[160px]" />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <AdminEmptyState icon={ICON} iconBg="bg-pink-50" iconColor="text-pink-500"
          title="No reviews found"
          description="No reviews match the current filters. Flag, hide, or remove reviews from here as they come in." />
      ) : (
        <div className="adm-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="adm-table w-full text-[13px]">
              <thead className="bg-gray-50 border-b adm-border">
                <tr>{['Reviewer', 'Subject', 'Rating', 'Comment', 'Direction', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold adm-t3 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y adm-border">
                {rows.map(r => (
                  <tr key={r.id} className="adm-hoverable align-top">
                    <td className="px-3 py-3 max-w-[140px]"><Person p={r.reviewer} /></td>
                    <td className="px-3 py-3 max-w-[140px]">
                      <Person p={r.subject} />
                      {r.service?.title && <p className="text-[11px] adm-t3 truncate mt-0.5">· {r.service.title}</p>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap"><Stars n={r.rating} /></td>
                    <td className="px-3 py-3 max-w-[260px]">
                      <p className="adm-t2 whitespace-pre-wrap break-words line-clamp-4">{r.comment || <span className="adm-t3">— no comment —</span>}</p>
                      {r.admin_note && <p className="text-[11px] text-amber-600 mt-1">Note: {r.admin_note}</p>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[11.5px] adm-t2">{DIR_LABEL[r.direction] || r.direction}</td>
                    <td className="px-3 py-3"><Badge tone={STATUS_TONE[r.status] || 'neutral'}><span className="capitalize">{r.status}</span></Badge></td>
                    <td className="px-3 py-3 whitespace-nowrap text-[12px] adm-t3">{fmt(r.created_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5 items-stretch min-w-[92px]">
                        {r.status !== 'flagged' && r.status !== 'hidden' && (
                          <Btn size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setReviewStatus(r, 'flagged')}>Flag</Btn>
                        )}
                        {r.status === 'flagged' && (
                          <Btn size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setReviewStatus(r, 'visible')}>Unflag</Btn>
                        )}
                        {r.status !== 'hidden' ? (
                          <Btn size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setReviewStatus(r, 'hidden')} className="!text-amber-600">Hide</Btn>
                        ) : (
                          <Btn size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setReviewStatus(r, 'visible')}>Unhide</Btn>
                        )}
                        <Btn size="sm" variant="outline" disabled={busyId === r.id} onClick={() => remove(r)} className="!text-red-600">Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > pageSize && (
        <div className="flex items-center justify-between mt-4 text-[12.5px] adm-t3">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Btn size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Btn>
            <Btn size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
