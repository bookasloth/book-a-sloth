import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { PageHeader } from '../../components/admin/ui';
const ICON = 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z';
const AdminReviews = () => (
  <div>
    <PageHeader title="Reviews Moderation" subtitle="Moderate guest reviews across the platform" />
    <AdminEmptyState icon={ICON} iconBg="bg-pink-50" iconColor="text-pink-500"
      title="Reviews Moderation" description="Flag, hide, or remove inappropriate reviews. Respond to reviews on behalf of the platform and manage review disputes." />
  </div>
);
export default AdminReviews;
