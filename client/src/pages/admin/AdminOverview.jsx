import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetStats } from '../../services/api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats?.users || 0, color: 'text-blue-600', to: '/admin/users?role=guest' },
    { label: 'Total Vendors', value: stats?.vendors || 0, color: 'text-green-600', to: '/admin/users?role=host' },
    { label: 'Total Bookings', value: stats?.bookings || 0, color: 'text-purple-600', to: '/admin/bookings' },
    { label: 'Total Services', value: stats?.services || 0, color: 'text-orange-500', to: '/admin/services' },
    { label: 'Platform Revenue', value: `₹${(stats?.revenue || 0).toLocaleString()}`, color: 'text-primary' },
    { label: 'Paid Bookings', value: stats?.confirmed || 0, color: 'text-emerald-600' },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
      <p className="text-sm text-gray-400 mb-6">Platform-wide stats at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            {c.to && <Link to={c.to} className="text-[10px] text-primary hover:underline mt-2 inline-block">View all</Link>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/users" className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
          <h3 className="font-semibold mb-1">Manage Users</h3>
          <p className="text-xs text-gray-400">View, edit, verify, ban, or delete users and vendors.</p>
        </Link>
        <Link to="/admin/bookings" className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
          <h3 className="font-semibold mb-1">Manage Bookings</h3>
          <p className="text-xs text-gray-400">View all bookings, update statuses, resolve disputes.</p>
        </Link>
        <Link to="/admin/services" className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
          <h3 className="font-semibold mb-1">Manage Services</h3>
          <p className="text-xs text-gray-400">Review and moderate vendor services.</p>
        </Link>
        <Link to="/admin/settings" className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
          <h3 className="font-semibold mb-1">Platform Settings</h3>
          <p className="text-xs text-gray-400">Configure platform name, fees, and maintenance mode.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminOverview;
