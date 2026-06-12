import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'];
const AdminDisputes = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Disputes</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Resolve booking and payment disputes</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-red-50" iconColor="text-red-500"
      title="Dispute Management" description="Booking disputes between guests and providers will be listed here. Review evidence, mediate, and issue resolutions or refunds." />
  </div>
);
export default AdminDisputes;
