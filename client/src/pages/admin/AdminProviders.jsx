import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminGetUsers, adminUpdateUser, adminGetUser } from '../../services/api';
import toast from 'react-hot-toast';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import SeoDrawer from '../../components/admin/SeoDrawer';

const PROVIDER_ICON = 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M16 11l2 2 4-4';

const STATUS_FILTER = {
  active:    { label: 'Active',    role: 'host', verified: true,  banned: false },
  pending:   { label: 'Pending',   role: 'host', verified: false, banned: false },
  suspended: { label: 'Suspended', role: 'host', verified: null,  banned: true },
};

const AdminProviders = () => {
  const { status = 'active' } = useParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [seoEntity, setSeoEntity] = useState(null);

  // List rows lack the SEO columns, so load the full profile before opening.
  const openSeo = async (p) => {
    try {
      const { data } = await adminGetUser(p.id);
      setSeoEntity(data.user);
    } catch { toast.error('Failed to load SEO'); }
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data } = await adminGetUsers({ role: 'host', page, limit: 20 });
      let list = data.users || [];
      const filter = STATUS_FILTER[status];
      if (filter) {
        if (filter.banned !== null) list = list.filter(u => u.is_banned === filter.banned);
        if (filter.verified !== null) list = list.filter(u => u.is_verified === filter.verified);
      }
      setProviders(list);
      setTotal(data.total || list.length);
    } catch { toast.error('Failed to load providers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProviders(); }, [status, page]);

  const handleVerify = async (u) => {
    try {
      await adminUpdateUser(u.id, { is_verified: !u.is_verified });
      toast.success(u.is_verified ? 'Unverified' : 'Verified');
      fetchProviders();
    } catch { toast.error('Failed'); }
  };

  const handleBan = async (u) => {
    if (!window.confirm(`${u.is_banned ? 'Unban' : 'Suspend'} ${u.name}?`)) return;
    try {
      await adminUpdateUser(u.id, { is_banned: !u.is_banned });
      toast.success(u.is_banned ? 'Unbanned' : 'Suspended');
      fetchProviders();
    } catch { toast.error('Failed'); }
  };

  const titles = { active: 'Active Providers', pending: 'Pending Providers', suspended: 'Suspended Providers' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{titles[status] || 'Providers'}</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">{total} provider{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {Object.keys(STATUS_FILTER).map(s => (
            <Link key={s} to={`/admin/providers/${s}`}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize
                ${status === s ? 'bg-[#FE5100] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </Link>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl py-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : providers.length === 0 ? (
        <AdminEmptyState icon={PROVIDER_ICON} iconBg="bg-blue-50" iconColor="text-blue-500"
          title={`No ${status} providers`} description={`No providers with ${status} status found.`} />
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Provider','Username','Plan','Status','Joined','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-blue-500">
                          {(p.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-[13px]">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">@{p.username || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize
                        ${p.plan === 'professional' ? 'bg-purple-50 text-purple-700' : p.plan === 'creator' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.plan || 'explorer'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_banned ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Suspended</span>
                        : p.is_verified ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Verified</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleVerify(p)} className="text-[11px] text-[#FE5100] hover:underline">
                          {p.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button onClick={() => handleBan(p)} className="text-[11px] text-amber-600 hover:underline">
                          {p.is_banned ? 'Unban' : 'Suspend'}
                        </button>
                        <button onClick={() => openSeo(p)} className="text-[11px] text-[#FE5100] hover:underline">
                          SEO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {seoEntity && (
        <SeoDrawer
          kind="provider"
          entity={seoEntity}
          onClose={() => setSeoEntity(null)}
        />
      )}
    </div>
  );
};

export default AdminProviders;
