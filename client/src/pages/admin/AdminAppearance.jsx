import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z'];
const AdminAppearance = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Appearance</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Customize platform branding and theme</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-pink-50" iconColor="text-pink-500"
      title="Theme Customizer" description="Set your platform's primary color, logo, favicon, typography, and layout style. Changes apply platform-wide across all public-facing pages." />
  </div>
);
export default AdminAppearance;
