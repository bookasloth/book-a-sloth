import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z';
const AdminReviews = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Reviews Moderation</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Moderate guest reviews across the platform</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-pink-50" iconColor="text-pink-500"
      title="Reviews Moderation" description="Flag, hide, or remove inappropriate reviews. Respond to reviews on behalf of the platform and manage review disputes." />
  </div>
);
export default AdminReviews;
