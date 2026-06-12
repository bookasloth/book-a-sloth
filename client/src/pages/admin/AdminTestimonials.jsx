import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
const AdminTestimonials = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Testimonials</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Curate social proof for the homepage</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-yellow-50" iconColor="text-yellow-500"
      title="Testimonials" description="Manually add or pull top reviews to showcase on your homepage and marketing pages. Approve, feature, or remove testimonials." ctaLabel="Add Testimonial" ctaOnClick={() => {}} />
  </div>
);
export default AdminTestimonials;
