import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { getTransactions } from "../services/api";
import toast from "react-hot-toast";
import {
  PageHeader, DataTable, StatusBadge, Modal, Button,
  SearchInput, Select, FilterBar, EmptyState, fmtMoney, cn,
} from "../components/dashboard/ui";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="flex-shrink-0 text-xs text-gray-500">{label}</span>
    <span className={cn("text-right text-xs font-medium text-gray-800", mono && "font-mono")}>{value || "-"}</span>
  </div>
);

const Detail = ({ tx }) => (
  <div className="space-y-4">
    <p className="-mt-1 font-mono text-xs text-gray-400">#{tx.id?.slice(0, 8).toUpperCase()}</p>
    <section>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</h4>
      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <Row label="Name" value={tx.guest_name || "Guest"} />
        <Row label="Email" value={tx.guest_email} />
        <Row label="Phone" value={tx.guest_phone} />
      </div>
    </section>
    <section>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Booking</h4>
      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <Row label="Service" value={tx.services?.title} />
        <Row label="Date" value={fmtDate(tx.scheduled_at || tx.created_at)} />
        <Row label="Duration" value={(tx.services?.duration || 30) + " min"} />
        <Row label="Notes" value={tx.notes} />
      </div>
    </section>
    <section>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Earnings Breakdown</h4>
      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <Row label="Total Amount" value={tx.services?.price === 0 ? "Free" : fmtMoney(tx.services?.price, { decimals: true })} />
        <Row label="Your Earnings" value={fmtMoney(tx.vendor_amount, { decimals: true })} />
        <Row label="Platform Fee" value={fmtMoney(tx.platform_fee_amount, { decimals: true })} />
        <div className="mt-1 flex items-center justify-between border-t pt-2">
          <span className="text-xs text-gray-500">Payment Status</span>
          <StatusBadge status={tx.payment_status} />
        </div>
      </div>
    </section>
    {(tx.razorpay_order_id || tx.razorpay_payment_id) && (
      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Gateway Reference</h4>
        <div className="space-y-2 rounded-xl bg-gray-50 p-4">
          {tx.razorpay_order_id && <Row label="Order ID" value={tx.razorpay_order_id} mono />}
          {tx.razorpay_payment_id && <Row label="Payment ID" value={tx.razorpay_payment_id} mono />}
        </div>
      </section>
    )}
  </div>
);

const PAGE_SIZE = 20;

const COLUMNS = [
  {
    key: "customer",
    header: "Customer",
    render: (tx) => (
      <div>
        <p className="font-medium text-gray-800">{tx.guest_name || "Guest"}</p>
        <p className="max-w-[160px] truncate text-xs text-gray-400">{tx.guest_email || "—"}</p>
      </div>
    ),
  },
  { key: "service", header: "Service", render: (tx) => <span className="text-gray-600">{tx.services?.title || "—"}</span> },
  { key: "date", header: "Date", render: (tx) => <span className="text-gray-500">{fmtDate(tx.scheduled_at || tx.created_at)}</span> },
  { key: "total", header: "Total", render: (tx) => <span className="font-semibold text-gray-800">{tx.services?.price === 0 ? "Free" : fmtMoney(tx.services?.price, { decimals: true })}</span> },
  { key: "earned", header: "Earned", render: (tx) => <span className="font-semibold text-primary">{fmtMoney(tx.vendor_amount, { decimals: true })}</span> },
  { key: "status", header: "Status", render: (tx) => <StatusBadge status={tx.payment_status} /> },
];

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
      const { data: res } = await getTransactions({ page, limit: PAGE_SIZE, search, status, sort });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${total} total transactions`} />

      <FilterBar className="mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search name, email…"
          className="sm:w-64"
        />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto">
          <option value="">All Bookings</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </FilterBar>

      <DataTable
        columns={COLUMNS}
        rows={data}
        loading={loading}
        onRowClick={setSelected}
        empty={<EmptyState icon={Receipt} title="No transactions found" description="Transactions show up here once guests pay for bookings." />}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Details" size="md">
        {selected && <Detail tx={selected} />}
      </Modal>
    </div>
  );
};

export default Transactions;
