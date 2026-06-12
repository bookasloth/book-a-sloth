import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M21 12V7H5a2 2 0 010-4h14v4','M21 12v5H5a2 2 0 010-4h16z','M21 12H3'];
const AdminEarnings = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Provider Earnings</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Payout tracking per provider</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-violet-50" iconColor="text-violet-600"
      title="Provider Earnings" description="Track how much each provider has earned, pending payouts, and commission deducted. Provider payout requests already flow through the host dashboard." />
  </div>
);
export default AdminEarnings;
