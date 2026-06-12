import { useState, useEffect, useCallback } from "react";
import { getTransactions } from "../services/api";
import toast from "react-hot-toast";

const PAY_COLORS = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-gray-100 text-gray-500",
  refunded: "bg-orange-100 text-orange-600",
};

const fmtMoney = (n) =>
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

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
    <span
      className={`text-xs text-gray-800 font-medium text-right ${mono ? "font-mono" : ""}`}
    >
      {value || "-"}
    </span>
  </div>
);

const TxModal = ({ tx, onClose }) => {
  const dt = new Date(tx.scheduled_at || tx.created_at);
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <div>
            <h3 className="font-bold">Transaction Details</h3>
            <p className="text-xs text-gray-400 font-mono">
              #{tx.id?.slice(0, 8).toUpperCase()}
            </p>
          </div>
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
        <div className="p-5 space-y-4">
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Customer
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Name" value={tx.guest_name || "Guest"} />
              <Row label="Email" value={tx.guest_email} />
              <Row label="Phone" value={tx.guest_phone} />
            </div>
          </section>
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Booking
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Service" value={tx.services?.title} />
              <Row
                label="Date"
                value={fmtDate(tx.scheduled_at || tx.created_at)}
              />
              <Row
                label="Duration"
                value={(tx.services?.duration || 30) + " min"}
              />
              <Row label="Notes" value={tx.notes} />
            </div>
          </section>
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Earnings Breakdown
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row
                label="Total Amount"
                value={
                  tx.services?.price === 0
                    ? "Free"
                    : fmtMoney(tx.services?.price)
                }
              />
              <Row label="Your Earnings" value={fmtMoney(tx.vendor_amount)} />
              <Row
                label="Platform Fee"
                value={fmtMoney(tx.platform_fee_amount)}
              />
              <div className="flex items-center justify-between pt-1 border-t mt-1">
                <span className="text-xs text-gray-500">Payment Status</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[tx.payment_status] || ""}`}
                >
                  {tx.payment_status}
                </span>
              </div>
            </div>
          </section>
          {(tx.razorpay_order_id || tx.razorpay_payment_id) && (
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Gateway Reference
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {tx.razorpay_order_id && (
                  <Row label="Order ID" value={tx.razorpay_order_id} mono />
                )}
                {tx.razorpay_payment_id && (
                  <Row label="Payment ID" value={tx.razorpay_payment_id} mono />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 20;

const Transactions = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await getTransactions({
        page,
        limit: PAGE_SIZE,
        search,
        status,
        sort,
      });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="w-full max-w-6xl">
      {selected && <TxModal tx={selected} onClose={() => setSelected(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-gray-400">{total} total transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email..."
          className="fb-input sm:w-56"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="fb-input"
        >
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="fb-input"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm fb-table">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">
                  Service
                </th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Earned
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                data.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td data-label="Customer" className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {tx.guest_name || "Guest"}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">
                        {tx.guest_email || "-"}
                      </p>
                    </td>
                    <td
                      data-label="Service"
                      className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600 max-w-[140px] truncate"
                    >
                      {tx.services?.title || "-"}
                    </td>
                    <td
                      data-label="Date"
                      className="px-4 py-3 hidden md:table-cell text-xs text-gray-500"
                    >
                      {fmtDate(tx.scheduled_at || tx.created_at)}
                    </td>
                    <td
                      data-label="Total"
                      className="px-4 py-3 font-semibold text-gray-800"
                    >
                      {tx.services?.price === 0
                        ? "Free"
                        : fmtMoney(tx.services?.price)}
                    </td>
                    <td
                      data-label="Earned"
                      className="px-4 py-3 hidden md:table-cell text-primary font-semibold"
                    >
                      {fmtMoney(tx.vendor_amount)}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[tx.payment_status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {tx.payment_status}
                      </span>
                    </td>
                    <td data-label="View" className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(tx)}
                        title="View details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
