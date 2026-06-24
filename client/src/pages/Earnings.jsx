import { useState, useEffect } from "react";
import { getHostBookings } from "../services/api";
import EarningsTrendChart from "../components/EarningsTrendChart";

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

  // Per-service breakdown (net vs gross)
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

  const fmtMoney = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-sm text-gray-400 mb-6">
        Track your revenue and per-service performance.
      </p>

      {/* Interactive trend chart — metric cards double as the KPI row */}
      <EarningsTrendChart paid={paid} />

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
