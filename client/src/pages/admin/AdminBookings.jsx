import { useState, useEffect } from 'react';
import { adminGetBookings, adminUpdateBooking, adminDeleteBooking } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-600',
  cancelled: 'bg-red-100 text-red-600',
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await adminGetBookings({ status: filter, page, limit: 15 });
      setBookings(data.bookings);
      setTotal(data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filter, page]);

  const handleStatusChange = async (id, status) => {
    try {
      await adminUpdateBooking(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchBookings();
    } catch { toast.error('Failed'); }
  };

  const handlePaymentChange = async (id, payment_status) => {
    try {
      await adminUpdateBooking(id, { payment_status });
      toast.success(`Payment marked as ${payment_status}`);
      fetchBookings();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try {
      await adminDeleteBooking(id);
      toast.success('Deleted');
      fetchBookings();
    } catch { toast.error('Failed'); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">All Bookings</h1>
      <p className="text-sm text-gray-400 mb-6">View and manage every booking on the platform.</p>

      <div className="flex gap-1 mb-5">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === s ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        <>
          <div className="space-y-3">
            {bookings.map(b => {
              const dt = new Date(b.scheduled_at);
              return (
                <div key={b.id} className="bg-white border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{b.services?.title || 'Service'}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Guest: <strong>{b.guest_name || '—'}</strong> ({b.guest_email || '—'})
                      </p>
                      <p className="text-xs text-gray-500">
                        Host: <strong>{b.profiles?.name || '—'}</strong> (@{b.profiles?.username || '—'})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{b.services?.price || 0}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {b.payment_status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                    <select className="border rounded px-2 py-1 text-xs" value={b.status}
                      onChange={e => handleStatusChange(b.id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <select className="border rounded px-2 py-1 text-xs" value={b.payment_status}
                      onChange={e => handlePaymentChange(b.id, e.target.value)}>
                      <option value="unpaid">unpaid</option>
                      <option value="paid">paid</option>
                      <option value="refunded">refunded</option>
                    </select>
                    {b.meeting_link && (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Meet</a>
                    )}
                    <button onClick={() => handleDelete(b.id)} className="text-xs text-red-500 hover:underline ml-auto">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium ${page === i + 1 ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBookings;
