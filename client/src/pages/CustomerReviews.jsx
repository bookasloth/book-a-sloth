import { Link } from "react-router-dom";
import { Star, Sparkles } from "lucide-react";

// /reviews — Reviews a guest has RECEIVED from hosts/vendors.
// NOTE: the current data model only has guest→host reviews (table `reviews`).
// Host→guest reviews don't exist yet (no table, no API). This page lays out the
// surface with an empty state until that backend lands (see gap list).

const CustomerReviews = () => (
  <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
    <div className="app-container py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-500 mt-0.5">What hosts say about you after a session.</p>
      </div>

      <div className="bg-white border rounded-2xl p-10 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FE5100]/10 mb-4">
          <Star className="text-[#FE5100]" size={26} />
        </span>
        <p className="font-semibold text-gray-900">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          After your sessions, hosts can leave a rating and a note about you. They'll appear here once you've completed a few bookings.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-4 px-3 py-1.5 rounded-full bg-gray-50 border">
          <Sparkles size={12} /> Host reviews are rolling out soon
        </div>
        <div className="mt-6">
          <Link to="/" className="text-sm font-medium text-[#FE5100] hover:underline">Book a session →</Link>
        </div>
      </div>
    </div>
  </div>
);

export default CustomerReviews;
