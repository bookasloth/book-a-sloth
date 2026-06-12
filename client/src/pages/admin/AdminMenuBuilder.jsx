import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M4 6h16','M4 12h8','M4 18h16'];
const AdminMenuBuilder = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Menu Builder</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Configure navigation menus</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-indigo-50" iconColor="text-indigo-600"
      title="Menu Builder" description="Drag-and-drop builder for the site's header and footer navigation. Add links, dropdowns, and custom labels without writing code." />
  </div>
);
export default AdminMenuBuilder;
