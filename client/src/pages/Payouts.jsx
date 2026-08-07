import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wallet, Clock, Hourglass, Banknote, Send, ShieldCheck } from "lucide-react";
import { getPayoutBalance, getPayoutRequests, requestPayout, getMyKyc, getPayoutOnboarding, startPayoutOnboarding } from "../services/api";
import toast from "react-hot-toast";
import {
  PageHeader, Section, StatCard, DataTable, StatusBadge, Modal, Button,
  FormField, Input, Textarea, EmptyState, ErrorState, SuccessState, SkeletonCard, StickyActionBar, fmtMoney,
} from "../components/dashboard/ui";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Single source of truth for the minimum withdrawable balance (₹).
const MIN_WITHDRAWAL = 100;

const WithdrawModal = ({ available, onClose, onRequested }) => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(null); // amount once the request lands

  const submit = async (e) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (n > available) {
      toast.error("Cannot exceed available balance");
      return;
    }
    setSaving(true);
    try {
      await requestPayout({ amount: n, notes });
      onRequested();          // refresh balance/history behind the sheet
      setSubmitted(n);        // show the success confirmation (pattern #13)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={submitted ? "" : "Request Withdrawal"} size="sm">
      {submitted ? (
        <SuccessState
          title="Withdrawal requested"
          message={`${fmtMoney(submitted, { decimals: true })} is on its way. Track it in your Withdrawal History.`}
          action={<Button full onClick={onClose}>Done</Button>}
        />
      ) : (
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="mb-0.5 text-xs text-gray-500">Available balance</p>
          <p className="text-xl font-bold text-primary">{fmtMoney(available, { decimals: true })}</p>
        </div>
        <FormField label="Amount (INR)" htmlFor="wd-amount" required hint={`Minimum ₹${MIN_WITHDRAWAL} · Maximum ${fmtMoney(available, { decimals: true })}`} className="mb-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
            <Input id="wd-amount" type="number" required min={MIN_WITHDRAWAL} max={available} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" className="pl-8" />
          </div>
        </FormField>
        <FormField label="Notes" htmlFor="wd-notes" hint="Optional" className="mb-0">
          <Textarea id="wd-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bank account, UPI ID, or any note for admin…" />
        </FormField>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:gap-3">
          <Button type="button" size="lg" variant="outline" full onClick={onClose}>Cancel</Button>
          <Button type="submit" size="lg" full disabled={saving}>{saving ? "Submitting…" : "Request Withdrawal"}</Button>
        </div>
      </form>
      )}
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

// "Set up payouts" — Razorpay Route onboarding. Reflects the server state:
//   coming_soon (fee-only mode) · not_started · created (verifying) · active.
// While fee-only mode is on this shows a soft "launching soon" note and no action.
const PayoutSetupCard = () => {
  const [state, setState] = useState(undefined); // undefined = loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPayoutOnboarding()
      .then((r) => setState(r.data?.state || "not_started"))
      .catch(() => setState(null));
  }, []);

  if (state === undefined || state === null) return null;

  if (state === "coming_soon") return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      Paid bookings and payouts are launching soon. You’ll set up your payout account here.
    </div>
  );

  if (state === "active") return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
      <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
      <p className="text-sm font-semibold text-green-800">Payouts active — you can receive payments from paid bookings.</p>
    </div>
  );

  if (state === "created") return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Payout verification in progress</p>
        <p className="text-xs text-amber-700">Our payment partner is verifying your details. Payouts unlock automatically once approved.</p>
      </div>
    </div>
  );

  // not_started
  const start = async () => {
    setBusy(true);
    try {
      const { data } = await startPayoutOnboarding();
      setState(data?.state || "created");
      toast.success("Payout setup started");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not start payout setup");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
      <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">Set up payouts</p>
        <p className="text-xs text-gray-600">Connect your account with our payment partner to receive money from paid bookings.</p>
      </div>
      <Button size="sm" onClick={start} disabled={busy}>{busy ? "Starting…" : "Set up"}</Button>
    </div>
  );
};

const Payouts = () => {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [{ data: bal }, { data: reqs }, kyc] = await Promise.all([
        getPayoutBalance(),
        getPayoutRequests(),
        getMyKyc().then((r) => r.data).catch(() => ({ status: "not_started" })),
      ]);
      setBalance(bal);
      setRequests(reqs || []);
      setKycStatus(kyc?.status || "not_started");
    } catch {
      setError(true);
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kycApproved = kycStatus === "approved";
  // Payouts require a completed KYC — gate withdrawal on approval.
  const canWithdraw = kycApproved && !!balance?.available && balance.available >= MIN_WITHDRAWAL;

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

  if (error) {
    return (
      <div>
        <PageHeader title="Payouts" subtitle="Request withdrawals of your earned balance." />
        <ErrorState message="Couldn’t load your payout data." onRetry={load} />
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
          <Button className="hidden md:inline-flex" onClick={() => setShowModal(true)} disabled={!canWithdraw}>
            <Send className="h-4 w-4" />
            Request Withdrawal
          </Button>
        }
      />

      <PayoutSetupCard />

      {!kycApproved && (
        <Link to="/dashboard/kyc" className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {kycStatus === "pending" ? "Verification under review" : "Complete verification to withdraw"}
            </p>
            <p className="text-xs text-amber-700">
              {kycStatus === "pending"
                ? "Payouts unlock automatically once your KYC is approved."
                : "You must complete identity verification (KYC) before requesting a payout. Tap to start."}
            </p>
          </div>
        </Link>
      )}

      {/* Balance — Available leads full-width on mobile, then a compact grid.
          One responsive grid (no duplicated markup). */}
      <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Available Balance" value={fmtMoney(balance?.available, { decimals: true })} icon={Wallet} tone="primary" />
        </div>
        <StatCard label="Clearing" value={fmtMoney(balance?.clearing, { decimals: true })} icon={Clock} tone="warning" />
        <StatCard label="Pending Completion" value={fmtMoney(balance?.pendingCompletion, { decimals: true })} icon={Hourglass} tone="neutral" />
        <StatCard label="Total Withdrawn" value={fmtMoney(balance?.paidOut, { decimals: true })} icon={Banknote} tone="info" />
      </div>

      <p className="mb-6 mt-4 text-xs text-gray-500">
        Minimum withdrawal amount is <span className="font-semibold text-gray-700">₹{MIN_WITHDRAWAL}</span>.{" "}
        {balance?.available != null && balance.available < MIN_WITHDRAWAL
          ? `${fmtMoney(MIN_WITHDRAWAL - balance.available, { decimals: true })} more to unlock withdrawals.`
          : "You can request a withdrawal once your available balance reaches it."}
      </p>

      <Section title="Withdrawal History">
        <DataTable
          columns={HISTORY_COLUMNS}
          rows={requests}
          empty={<EmptyState icon={Banknote} title="No withdrawal requests yet" description="Once you request a withdrawal, it shows up here with its status." />}
        />
      </Section>

      {/* Mobile: sticky primary action within thumb reach */}
      <StickyActionBar className="md:hidden">
        <div className="w-full">
          {!canWithdraw && (
            <p className="mb-2 text-center text-xs text-gray-500">
              {!kycApproved
                ? "Complete verification (KYC) to withdraw"
                : balance?.available != null && balance.available < MIN_WITHDRAWAL
                ? `${fmtMoney(MIN_WITHDRAWAL - balance.available, { decimals: true })} more to withdraw`
                : `Minimum balance ₹${MIN_WITHDRAWAL} required`}
            </p>
          )}
          <Button full size="lg" onClick={() => setShowModal(true)} disabled={!canWithdraw}>
            <Send className="h-4 w-4" />
            Request Withdrawal
          </Button>
        </div>
      </StickyActionBar>
    </div>
  );
};

export default Payouts;
