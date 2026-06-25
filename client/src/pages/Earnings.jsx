import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { getHostBookings } from "../services/api";
import EarningsTrendChart from "../components/EarningsTrendChart";
import {
  PageHeader, Section, Card, EmptyState, SkeletonCard, fmtMoney,
} from "../components/dashboard/ui";

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

  if (loading) {
    return (
      <div>
        <PageHeader title="Earnings" subtitle="Track your revenue and per-service performance." />
        <SkeletonCard className="mb-6 h-72" />
        <SkeletonCard />
      </div>
    );
  }

  const paid = bookings.filter((b) => b.payment_status === "paid");

  // Per-service breakdown (net vs gross)
  const serviceMap = {};
  paid.forEach((b) => {
    const title = b.services?.title || "Unknown";
    if (!serviceMap[title]) serviceMap[title] = { count: 0, gross: 0, net: 0 };
    serviceMap[title].count++;
    serviceMap[title].gross += b.services?.price || 0;
    serviceMap[title].net += b.vendor_amount != null ? b.vendor_amount : b.services?.price || 0;
  });
  const serviceBreakdown = Object.entries(serviceMap).sort((a, b) => b[1].net - a[1].net);

  return (
    <div>
      <PageHeader title="Earnings" subtitle="Track your revenue and per-service performance." />

      {/* Interactive trend chart — metric cards double as the KPI row */}
      <div className="mb-6">
        <EarningsTrendChart paid={paid} />
      </div>

      <Section title="Revenue by Service">
        <Card>
          {serviceBreakdown.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No paid bookings yet" description="Revenue by service appears here once you have paid bookings." />
          ) : (
            <div className="space-y-3">
              {serviceBreakdown.map(([title, data]) => (
                <div key={title} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{title}</p>
                    <p className="text-xs text-gray-400">{data.count} booking{data.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmtMoney(data.net)}</p>
                    {data.gross !== data.net && <p className="text-xs text-gray-400">{fmtMoney(data.gross)} gross</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
};

export default Earnings;
