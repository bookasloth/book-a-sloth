import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Sparkles, Loader2 } from "lucide-react";
import { getReceivedReviews } from "../services/api";

// /reviews — reviews the current user has RECEIVED (from hosts, or from guests
// if they also host). Submission of reviews is gated by the `review_submission`
// kill switch; this page only displays what's been received.

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const Stars = ({ n }) => (
  <span className="text-[#FE5100] text-sm tracking-tight" aria-label={`${n} out of 5`}>
    {"★".repeat(n)}<span className="text-gray-200">{"★".repeat(5 - n)}</span>
  </span>
);

const CustomerReviews = () => {
  const [data, setData] = useState({ reviews: [], count: 0, avg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceivedReviews()
      .then(({ data }) => setData(data || { reviews: [], count: 0, avg: 0 }))
      .catch(() => setData({ reviews: [], count: 0, avg: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const { reviews, count, avg } = data;

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
      <div className="app-container py-8 max-w-2xl">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reviews</h1>
            <p className="text-sm text-gray-500 mt-0.5">What others say about you after a session.</p>
          </div>
          {count > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-[#FE5100] leading-none">{avg}</p>
              <p className="text-xs text-gray-400 mt-1">{count} review{count === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-7 h-7 animate-spin mx-auto text-gray-400" /></div>
        ) : count === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FE5100]/10 mb-4">
              <Star className="text-[#FE5100]" size={26} />
            </span>
            <p className="font-semibold text-gray-900">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              After your sessions, hosts can leave a rating and a note about you. They'll show up here.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-4 px-3 py-1.5 rounded-full bg-gray-50 border">
              <Sparkles size={12} /> Reviews open up as you complete bookings
            </div>
            <div className="mt-6">
              <Link to="/" className="text-sm font-medium text-[#FE5100] hover:underline">Book a session →</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const author = r.profiles || {};
              return (
                <div key={r.id} className="bg-white border rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {author.profile_image ? (
                      <img src={author.profile_image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FE5100] text-white font-bold flex-shrink-0">
                        {author.name ? author.name[0].toUpperCase() : "U"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{author.name || "Someone"}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(r.created_at)}</span>
                      </div>
                      <Stars n={r.rating} />
                      {r.bookings?.services?.title && (
                        <p className="text-xs text-gray-400 mt-0.5">{r.bookings.services.title}</p>
                      )}
                      {r.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;
