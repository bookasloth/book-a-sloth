import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'];
const AdminNewsletter = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Newsletter</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Broadcast emails to your subscriber list</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-orange-50" iconColor="text-orange-500"
      title="Newsletter" description="Compose and send newsletters to all subscribers. Build campaigns, manage subscriber lists, and track open rates." ctaLabel="Compose Newsletter" ctaOnClick={() => {}} />
  </div>
);
export default AdminNewsletter;
