import { useParams } from 'react-router-dom';
import AdminEmptyState from '../../components/admin/AdminEmptyState';

const ICON = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4';

const AdminKYC = () => {
  const { status = 'pending' } = useParams();
  const titles = { pending: 'Pending KYC', approved: 'Approved KYC', rejected: 'Rejected KYC' };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{titles[status] || 'KYC'}</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Identity verification management</p>
      </div>
      <AdminEmptyState icon={ICON} iconBg="bg-blue-50" iconColor="text-blue-500"
        title="KYC Module" description="Provider identity verification and document review will be managed from here. KYC submissions will appear once the collection flow is implemented." />
    </div>
  );
};
export default AdminKYC;
