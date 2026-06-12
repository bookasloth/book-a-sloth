import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'];
const AdminFooterBuilder = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Footer Builder</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Manage footer columns and links</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-gray-100" iconColor="text-gray-500"
      title="Footer Builder" description="Configure footer columns, social links, legal pages, and copyright text. Supports multi-column layouts and custom HTML blocks." />
  </div>
);
export default AdminFooterBuilder;
