import { useState, useEffect } from "react";
import { getHostBookings } from "../services/api";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const Earnings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getHostBookings();
        setBookings(data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading)
    return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const paid = bookings.filter((b) => b.payment_status === "paid");
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // Task 8: use vendor_amount if present, else fall back to full price
  const gross = paid.reduce((s, b) => s + (b.services?.price || 0), 0);
  const netEarnings = paid.reduce(
    (s, b) =>
      s + (b.vendor_amount != null ? b.vendor_amount : b.services?.price || 0),
    0,
  );
  const platformCut = gross - netEarnings;

  const monthlyNet = paid
    .filter((b) => {
      const d = new Date(b.scheduled_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce(
      (s, b) =>
        s +
        (b.vendor_amount != null ? b.vendor_amount : b.services?.price || 0),
      0,
    );

  // Per-service breakdown
  const serviceMap = {};
  paid.forEach((b) => {
    const title = b.services?.title || "Unknown";
    if (!serviceMap[title]) serviceMap[title] = { count: 0, gross: 0, net: 0 };
    serviceMap[title].count++;
    serviceMap[title].gross += b.services?.price || 0;
    serviceMap[title].net +=
      b.vendor_amount != null ? b.vendor_amount : b.services?.price || 0;
  });
  const serviceBreakdown = Object.entries(serviceMap).sort(
    (a, b) => b[1].net - a[1].net,
  );

  // Monthly chart (last 6 months, net)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const m = d.getMonth(),
      y = d.getFullYear();
    const rev = paid
      .filter((b) => {
        const bd = new Date(b.scheduled_at);
        return bd.getMonth() === m && bd.getFullYear() === y;
      })
      .reduce(
        (s, b) =>
          s +
          (b.vendor_amount != null ? b.vendor_amount : b.services?.price || 0),
        0,
      );
    monthlyData.push({
      label: `${MONTHS[m]}${y !== thisYear ? ` '${String(y).slice(2)}` : ""}`,
      revenue: rev,
    });
  }
  const maxRev = Math.max(...monthlyData.map((d) => d.revenue), 1);

  const fmtMoney = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-sm text-gray-400 mb-6">
        Track your revenue and per-service performance.
      </p>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="fb-card p-5">
          <p className="text-xs text-gray-400 mb-1">Total Net Earnings</p>
          <p className="text-3xl font-bold text-primary">
            {fmtMoney(netEarnings)}
          </p>
          {platformCut > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              after {fmtMoney(platformCut)} platform fee
            </p>
          )}
        </div>
        <div className="fb-card p-5">
          <p className="text-xs text-gray-400 mb-1">This Month (Net)</p>
          <p className="text-3xl font-bold text-green-600">
            {fmtMoney(monthlyNet)}
          </p>
        </div>
        <div className="fb-card p-5">
          <p className="text-xs text-gray-400 mb-1">Gross Revenue</p>
          <p className="text-3xl font-bold text-gray-700">{fmtMoney(gross)}</p>
        </div>
        <div className="fb-card p-5">
          <p className="text-xs text-gray-400 mb-1">Paid Bookings</p>
          <p className="text-3xl font-bold">{paid.length}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="fb-card p-5 mb-8">
        <h2 className="font-semibold mb-4 text-sm">
          Net Earnings — Last 6 Months
        </h2>
        <div className="scroll-safe flex items-end gap-3 h-40 pb-1">
          {monthlyData.map((d, i) => (
            <div
              key={i}
              className="flex min-w-12 flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] text-gray-400 font-medium">
                {fmtMoney(d.revenue)}
              </span>
              <div
                className="w-full bg-primary/15 rounded-t-lg relative overflow-hidden transition-all"
                style={{
                  height: `${Math.max((d.revenue / maxRev) * 100, 4)}%`,
                }}
              >
                <div className="absolute inset-0 bg-primary/30 rounded-t-lg" />
              </div>
              <span className="text-[10px] text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-service breakdown with platform fee */}
      <div className="fb-card p-5">
        <h2 className="font-semibold mb-4 text-sm">Revenue by Service</h2>
        {serviceBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400">No paid bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {serviceBreakdown.map(([title, data]) => (
              <div
                key={title}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-gray-400">
                    {data.count} booking{data.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">{fmtMoney(data.net)}</p>
                  {data.gross !== data.net && (
                    <p className="text-xs text-gray-400">
                      {fmtMoney(data.gross)} gross
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
