import { useState, useEffect, useCallback } from "react";
import { Receipt, User, CalendarDays, IndianRupee, CreditCard, Copy } from "lucide-react";
import { getTransactions } from "../services/api";
import toast from "react-hot-toast";
import {
  PageHeader, DataTable, StatusBadge, Modal, Button,
  SearchInput, Select, EmptyState, fmtMoney, cn,
} from "../components/dashboard/ui";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Maps a date-filter preset to an ISO lower bound on the transaction date.
// Returns undefined for "all time" so the param is omitted entirely.
const dateFromFor = (preset) => {
  if (!preset) return undefined;
  const d = new Date();
  if (preset === "today") d.setHours(0, 0, 0, 0);
  else if (preset === "7d") d.setDate(d.getDate() - 7);
  else if (preset === "30d") d.setDate(d.getDate() - 30);
  else if (preset === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); }
  return d.toISOString();
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="flex-shrink-0 text-xs text-gray-500">{label}</span>
    <span className={cn("text-right text-xs font-medium text-gray-800", mono && "break-all font-mono")}>{value || "-"}</span>
  </div>
);

const copy = (text, label) => {
  if (!text) return;
  navigator.clipboard?.writeText(String(text)).then(() => toast.success(`${label} copied`)).catch(() => {});
};

// Copyable mono row for gateway reference ids.
const RowCopy = ({ label, value }) => (
  <button type="button" onClick={() => copy(value, label)} className="flex w-full items-start justify-between gap-4 text-left">
    <span className="flex-shrink-0 text-xs text-gray-500">{label}</span>
    <span className="inline-flex items-center gap-1 break-all text-right font-mono text-xs font-medium text-gray-800 transition-colors hover:text-primary">
      {value} <Copy className="h-3 w-3 shrink-0" />
    </span>
  </button>
);

// Icon-led card grouping the transaction's fields into clean sections.
const Section = ({ icon: Icon, title, children }) => (
  <section className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />{title}
    </h4>
    <div className="space-y-2">{children}</div>
  </section>
);

const Detail = ({ tx }) => {
  const isFree = tx.services?.price === 0;
  return (
    <div>
      {/* Summary band — emphasized earnings + payment status, copyable id */}
      <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Your earnings</p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900">{fmtMoney(tx.vendor_amount, { decimals: true })}</p>
          <button
            type="button"
            onClick={() => copy(tx.id, "Transaction ID")}
            title="Copy transaction ID"
            className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-gray-400 transition-colors hover:text-primary"
          >
            #{tx.id?.slice(0, 8).toUpperCase()}
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="shrink-0 text-right">
          <StatusBadge status={tx.payment_status} />
          <p className="mt-1.5 text-[11px] text-gray-400">{fmtDate(tx.scheduled_at || tx.created_at)}</p>
        </div>
      </div>

      {/* Two-column section grid; stacks on mobile with equal-height rows. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Section icon={User} title="Customer">
          <Row label="Name" value={tx.guest_name || "Guest"} />
          <Row label="Email" value={tx.guest_email} />
          <Row label="Phone" value={tx.guest_phone} />
        </Section>

        <Section icon={CalendarDays} title="Booking">
          <Row label="Service" value={tx.services?.title} />
          <Row label="Date" value={fmtDate(tx.scheduled_at || tx.created_at)} />
          <Row label="Duration" value={(tx.services?.duration || 30) + " min"} />
          {tx.notes && <Row label="Notes" value={tx.notes} />}
        </Section>

        <Section icon={IndianRupee} title="Earnings breakdown">
          <Row label="Total Amount" value={isFree ? "Free" : fmtMoney(tx.services?.price, { decimals: true })} />
          <Row label="Your Earnings" value={fmtMoney(tx.vendor_amount, { decimals: true })} />
          <Row label="Platform Fee" value={fmtMoney(tx.platform_fee_amount, { decimals: true })} />
          <div className="mt-1 flex items-center justify-between border-t border-gray-200/70 pt-2">
            <span className="text-xs text-gray-500">Payment Status</span>
            <StatusBadge status={tx.payment_status} />
          </div>
        </Section>

        <Section icon={CreditCard} title="Gateway reference">
          {tx.razorpay_order_id || tx.razorpay_payment_id ? (
            <>
              {tx.razorpay_order_id && <RowCopy label="Order ID" value={tx.razorpay_order_id} />}
              {tx.razorpay_payment_id && <RowCopy label="Payment ID" value={tx.razorpay_payment_id} />}
            </>
          ) : (
            <p className="text-xs text-gray-400">No gateway reference on this transaction.</p>
          )}
        </Section>
      </div>
    </div>
  );
};

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
  const [dateRange, setDateRange] = useState("");
  const [sort, setSort] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await getTransactions({ page, limit: PAGE_SIZE, search, status, sort, dateFrom: dateFromFor(dateRange) });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort, dateRange]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${total} total transactions`} />

      {/* Toolbar — search ~70% + status/date/sort inline on one row;
          stacks on mobile (search on top, the 3 dropdowns in a row under). */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search name, email…"
          className="w-full sm:w-[70%]"
        />
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-1">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full sm:w-auto sm:flex-1" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setPage(1); }} className="w-full sm:w-auto sm:flex-1" aria-label="Filter by date">
            <option value="">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This month</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-auto sm:flex-1" aria-label="Sort order">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
        </div>
      </div>

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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Details" size="lg">
        {selected && <Detail tx={selected} />}
      </Modal>
    </div>
  );
};

export default Transactions;
