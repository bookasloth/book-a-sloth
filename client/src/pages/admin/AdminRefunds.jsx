import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M1 4v6h6','M23 20v-6h-6','M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15'];
const AdminRefunds = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Refunds</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Manage and process refund requests</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-red-50" iconColor="text-red-500"
      title="Refund Management" description="Cancelled bookings with refund requests will appear here. Approve or reject refunds and track Razorpay refund statuses." />
  </div>
);
export default AdminRefunds;
