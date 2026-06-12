import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z','M8 10h8','M8 14h4'];
const AdminBlogs = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Blog</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Publish articles and announcements</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-indigo-50" iconColor="text-indigo-600"
      title="Blog Manager" description="Write and publish blog posts to drive SEO and keep your community informed. Supports categories, tags, and scheduling." ctaLabel="New Post" ctaOnClick={() => {}} />
  </div>
);
export default AdminBlogs;
