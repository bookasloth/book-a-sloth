import { useState, useEffect } from "react";
import {
  getPayoutBalance,
  getPayoutRequests,
  requestPayout,
} from "../services/api";
import toast from "react-hot-toast";

const STATUS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const fmt = (n) =>
  "Rs." +
  (n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const WithdrawModal = ({ available, onClose, onRequested }) => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n < 100) {
      toast.error("Minimum withdrawal is Rs.100");
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold">Request Withdrawal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-xs text-gray-500 mb-0.5">Available balance</p>
            <p className="text-xl font-bold text-primary">{fmt(available)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                Rs.
              </span>
              <input
                type="number"
                required
                min={100}
                max={available}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="fb-input pl-10 pr-3"
                placeholder="100.00"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Minimum Rs.100 | Maximum {fmt(available)}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank account, UPI ID, or any note for admin..."
              className="fb-input resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn--outline flex-1 py-2.5 text-sm text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn flex-1 bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {saving ? "Submitting..." : "Request Withdrawal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Payouts = () => {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const [{ data: bal }, { data: reqs }] = await Promise.all([
        getPayoutBalance(),
        getPayoutRequests(),
      ]);
      setBalance(bal);
      setRequests(reqs || []);
    } catch {
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const balCards = [
    {
      label: "Available Balance",
      value: fmt(balance?.available),
      color: "text-primary",
      big: true,
    },
    {
      label: "Pending Payouts",
      value: fmt(balance?.pending),
      color: "text-amber-600",
    },
    {
      label: "Total Withdrawn",
      value: fmt(balance?.totalWithdrawn),
      color: "text-gray-700",
    },
    {
      label: "Total Earned",
      value: fmt(balance?.totalEarned),
      color: "text-gray-700",
    },
  ];

  return (
    <div className="w-full max-w-4xl">
      {showModal && (
        <WithdrawModal
          available={balance?.available || 0}
          onClose={() => setShowModal(false)}
          onRequested={load}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payouts</h1>
          <p className="text-sm text-gray-400">
            Request withdrawals of your earned balance.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!balance?.available || balance.available < 100}
          className="btn inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-primary/90"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Request Withdrawal
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {balCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p
              className={`font-bold ${c.big ? "text-xl" : "text-base"} ${c.color}`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Request history */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">Withdrawal History</h2>
        </div>
        {requests.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No withdrawal requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm fb-table">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td
                      data-label="Date"
                      className="px-4 py-3 text-xs text-gray-600"
                    >
                      {fmtDate(r.created_at)}
                    </td>
                    <td data-label="Amount" className="px-4 py-3 font-semibold">
                      {fmt(r.amount)}
                    </td>
                    <td
                      data-label="Notes"
                      className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate"
                    >
                      {r.notes || "-"}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS[r.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {r.status}
                      </span>
                      {r.admin_note && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.admin_note}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payouts;
