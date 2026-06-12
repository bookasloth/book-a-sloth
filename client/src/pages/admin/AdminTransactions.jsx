import AdminEmptyState from '../../components/admin/AdminEmptyState';
const ICON = ['M12 1v22','M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6'];
const AdminTransactions = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">Full platform transaction ledger</p>
    </div>
    <AdminEmptyState icon={ICON} iconBg="bg-emerald-50" iconColor="text-emerald-600"
      title="Transaction Ledger" description="Every payment, refund, and platform fee will be recorded here in a searchable, filterable table. Connect Razorpay webhooks to auto-populate." />
  </div>
);
export default AdminTransactions;
