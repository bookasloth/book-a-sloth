import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { svcGetAll, svcDelete, svcToggle, svcDuplicate } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_LABEL = { online: 'Online', offline: 'Offline', one_on_one: '1:1', group: 'Group', paid_dm: 'Paid DM' };

const fmtDuration = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const StatusBadge = ({ active }) => (
  <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {active ? 'Active' : 'Disabled'}
  </span>
);

// Shared action icons (used by both the desktop table and the mobile card list).
const PATHS = {
  view:    'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  dup:     'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  disable: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  enable:  'M5 13l4 4L19 7',
  del:     'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
};
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export default function ServicesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // service to confirm delete

  const load = async () => {
    try {
      const { data } = await svcGetAll();
      setServices(data || []);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = services;
    if (filter === 'active')   list = list.filter(s => s.is_active);
    if (filter === 'disabled') list = list.filter(s => !s.is_active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => (s.title || '').toLowerCase().includes(q) || (s.short_description || s.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [services, filter, search]);

  const handleToggle = async (s) => {
    try {
      await svcToggle(s.id);
      toast.success(s.is_active ? 'Service disabled' : 'Service enabled');
      load();
    } catch { toast.error('Failed to toggle'); }
  };

  const handleDuplicate = async (s) => {
    try {
      await svcDuplicate(s.id);
      toast.success('Service duplicated');
      load();
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await svcDelete(confirmDelete.id);
      toast.success('Service deleted');
      setConfirmDelete(null);
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const counts = {
    all: services.length,
    active: services.filter(s => s.is_active).length,
    disabled: services.filter(s => !s.is_active).length,
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const emptyState = (
    <div className="py-14 text-center">
      <div className="text-gray-300 mb-3">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <p className="text-gray-400 text-sm">No services found.</p>
      {filter === 'all' && !search && (
        <Link to="/dashboard/service/add-new" className="inline-block mt-3 text-primary text-sm font-medium hover:underline">
          Create your first service →
        </Link>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl">
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete Service?</h3>
            <p className="text-sm text-gray-500 mb-5">
              "<strong>{confirmDelete.title}</strong>" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 fb-btn fb-btn--secondary">Cancel</button>
              <button onClick={handleDelete} className="flex-1 fb-btn bg-red-500 text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-gray-400">{counts.active} active / {counts.all} total</p>
        </div>
        <Link to="/dashboard/service/add-new"
          className="btn inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Service
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2">
          {['all','active','disabled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services…"
          className="fb-input sm:w-56" />
      </div>

      {/* Table — desktop / tablet only (mobile uses the card list below) */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">Thumb</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Duration</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Bookings</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="text-gray-300 mb-3">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No services found.</p>
                    {filter === 'all' && !search && (
                      <Link to="/dashboard/service/add-new" className="inline-block mt-3 text-primary text-sm font-medium hover:underline">
                        Create your first service →
                      </Link>
                    )}
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    {s.thumbnail_url
                      ? <img src={s.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover"/>
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs font-bold">{(s.title||'?').charAt(0).toUpperCase()}</div>}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium text-gray-800 truncate">{s.title}</p>
                    {(s.short_description || s.description) && (
                      <p className="text-xs text-gray-400 truncate">{s.short_description || s.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                    {TYPE_LABEL[s.meeting_mode] || TYPE_LABEL[s.service_type] || s.meeting_mode || '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {s.price === 0 ? 'Free' : `₹${s.price}`}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{fmtDuration(s.duration)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">{s.total_bookings || 0}</td>
                  <td className="px-4 py-3"><StatusBadge active={s.is_active}/></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* View public */}
                      {s.slug && s.is_active && (
                        <a href={`/${user?.username}/booking/${s.slug}`} target="_blank" rel="noreferrer" title="View public page"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </a>
                      )}
                      {/* Edit */}
                      <button onClick={() => navigate(`/dashboard/service/edit/${s.id}`)} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      {/* Duplicate */}
                      <button onClick={() => handleDuplicate(s)} title="Duplicate"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </button>
                      {/* Toggle */}
                      <button onClick={() => handleToggle(s)} title={s.is_active ? 'Disable' : 'Enable'}
                        className={`p-1.5 rounded-lg transition-colors ${s.is_active ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-green-50 text-green-500 hover:text-green-700'}`}>
                        {s.is_active
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                      </button>
                      {/* Delete */}
                      <button onClick={() => setConfirmDelete(s)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
          Disabled services remain in historical booking records.
        </div>
      </div>

      {/* Mobile card list — actions are always visible (no horizontal scroll needed) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">{emptyState}</div>
        ) : filtered.map(s => {
          const typeLabel = TYPE_LABEL[s.meeting_mode] || TYPE_LABEL[s.service_type] || s.meeting_mode || '—';
          return (
            <div key={s.id} className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-4 ${!s.is_active ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-3">
                {s.thumbnail_url
                  ? <img src={s.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-sm font-bold flex-shrink-0">{(s.title||'?').charAt(0).toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 truncate">{s.title}</p>
                    <StatusBadge active={s.is_active}/>
                  </div>
                  {(s.short_description || s.description) && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{s.short_description || s.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                    <span className="font-semibold text-primary">{s.price === 0 ? 'Free' : `₹${s.price}`}</span>
                    <span>{typeLabel}</span>
                    <span>{fmtDuration(s.duration)}</span>
                    <span>{s.total_bookings || 0} bookings</span>
                  </div>
                </div>
              </div>

              {/* Actions — labeled buttons, always visible */}
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                {s.slug && s.is_active && (
                  <a href={`/${user?.username}/booking/${s.slug}`} target="_blank" rel="noreferrer"
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <Icon d={PATHS.view}/> View public page
                  </a>
                )}
                <button onClick={() => navigate(`/dashboard/service/edit/${s.id}`)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Icon d={PATHS.edit}/> Edit
                </button>
                <button onClick={() => handleDuplicate(s)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Icon d={PATHS.dup}/> Duplicate
                </button>
                <button onClick={() => handleToggle(s)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${s.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                  <Icon d={s.is_active ? PATHS.disable : PATHS.enable}/> {s.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => setConfirmDelete(s)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                  <Icon d={PATHS.del}/> Delete
                </button>
              </div>
            </div>
          );
        })}
        <p className="px-1 pt-1 text-xs text-gray-400">
          Disabled services remain in historical booking records.
        </p>
      </div>
    </div>
  );
}
