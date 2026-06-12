import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'];
const AdminPages = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Pages</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Manage static content pages</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-blue-50" iconColor="text-blue-500"
      title="Page Builder" description="Create and manage static pages like About, Privacy Policy, Terms & Conditions. Pages support rich text and custom slugs." ctaLabel="Create Page" ctaOnClick={() => {}} />
  </div>
);
export default AdminPages;
