import { useState, useEffect } from "react";
import { Wallet, Clock, Hourglass, Banknote, Send } from "lucide-react";
import { getPayoutBalance, getPayoutRequests, requestPayout } from "../services/api";
import toast from "react-hot-toast";
import {
  PageHeader, Section, StatCard, DataTable, StatusBadge, Modal, Button,
  FormField, Input, Textarea, EmptyState, SkeletonCard, fmtMoney,
} from "../components/dashboard/ui";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const WithdrawModal = ({ available, onClose, onRequested }) => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }
    if (n > available) {
      toast.error("Cannot exceed available balance");
      return;
    }
    setSaving(true);
    try {
      await requestPayout({ amount: n, notes });
      toast.success("Withdrawal request submitted!");
      onRequested();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Request Withdrawal" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="mb-0.5 text-xs text-gray-500">Available balance</p>
          <p className="text-xl font-bold text-primary">{fmtMoney(available, { decimals: true })}</p>
        </div>
        <FormField label="Amount (INR)" htmlFor="wd-amount" required hint={`Minimum ₹100 · Maximum ${fmtMoney(available, { decimals: true })}`} className="mb-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
            <Input id="wd-amount" type="number" required min={100} max={available} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" className="pl-8" />
          </div>
        </FormField>
        <FormField label="Notes" htmlFor="wd-notes" hint="Optional" className="mb-0">
          <Textarea id="wd-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bank account, UPI ID, or any note for admin…" />
        </FormField>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" full onClick={onClose}>Cancel</Button>
          <Button type="submit" full disabled={saving}>{saving ? "Submitting…" : "Request Withdrawal"}</Button>
        </div>
      </form>
    </Modal>
  );
};

const HISTORY_COLUMNS = [
  { key: "date", header: "Date", render: (r) => <span className="text-gray-600">{fmtDate(r.created_at)}</span> },
  { key: "amount", header: "Amount", render: (r) => <span className="font-semibold text-gray-800">{fmtMoney(r.amount, { decimals: true })}</span> },
  { key: "notes", header: "Notes", render: (r) => <span className="text-gray-400">{r.notes || "—"}</span> },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <div>
        <StatusBadge status={r.status} />
        {r.admin_note && <p className="mt-0.5 text-xs text-gray-400">{r.admin_note}</p>}
      </div>
    ),
  },
];

const Payouts = () => {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const [{ data: bal }, { data: reqs }] = await Promise.all([getPayoutBalance(), getPayoutRequests()]);
      setBalance(bal);
      setRequests(reqs || []);
    } catch {
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const canWithdraw = !!balance?.available && balance.available >= 100;

  if (loading) {
    return (
      <div>
        <PageHeader title="Payouts" subtitle="Request withdrawals of your earned balance." />
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <DataTable columns={HISTORY_COLUMNS} rows={[]} loading />
      </div>
    );
  }

  return (
    <div>
      {showModal && (
        <WithdrawModal available={balance?.available || 0} onClose={() => setShowModal(false)} onRequested={load} />
      )}

      <PageHeader
        title="Payouts"
        subtitle="Request withdrawals of your earned balance."
        actions={
          <Button onClick={() => setShowModal(true)} disabled={!canWithdraw}>
            <Send className="h-4 w-4" />
            Request Withdrawal
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Available Balance" value={fmtMoney(balance?.available, { decimals: true })} icon={Wallet} tone="primary" />
        <StatCard label="Clearing" value={fmtMoney(balance?.clearing, { decimals: true })} icon={Clock} tone="warning" />
        <StatCard label="Pending Completion" value={fmtMoney(balance?.pendingCompletion, { decimals: true })} icon={Hourglass} tone="neutral" />
        <StatCard label="Total Withdrawn" value={fmtMoney(balance?.paidOut, { decimals: true })} icon={Banknote} tone="info" />
      </div>

      <p className="-mt-3 mb-6 text-xs text-gray-500">
        Minimum withdrawal amount is <span className="font-semibold text-gray-700">₹100</span>.{" "}
        {balance?.available != null && balance.available < 100
          ? `${fmtMoney(100 - balance.available, { decimals: true })} more to unlock withdrawals.`
          : "You can request a withdrawal once your available balance reaches it."}
      </p>

      <Section title="Withdrawal History">
        <DataTable
          columns={HISTORY_COLUMNS}
          rows={requests}
          empty={<EmptyState icon={Banknote} title="No withdrawal requests yet" description="Once you request a withdrawal, it shows up here with its status." />}
        />
      </Section>
    </div>
  );
};

export default Payouts;
