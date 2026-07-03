import { useParams } from 'react-router-dom';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { PageHeader } from '../../components/admin/ui';

const ICON = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4';

const AdminKYC = () => {
  const { status = 'pending' } = useParams();
  const titles = { pending: 'Pending KYC', approved: 'Approved KYC', rejected: 'Rejected KYC' };
  return (
    <div>
      <PageHeader title={titles[status] || 'KYC'} subtitle="Identity verification management" />
      <AdminEmptyState icon={ICON} iconBg="bg-blue-50" iconColor="text-blue-500"
        title="KYC Module" description="Host identity verification and document review will be managed from here. KYC submissions will appear once the collection flow is implemented." />
    </div>
  );
};
export default AdminKYC;
