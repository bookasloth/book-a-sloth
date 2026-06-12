// Task 9: Reviews and ratings system
const { supabaseAdmin } = require("../config/supabase");

// POST /api/reviews — submit a review for a completed booking
const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating)
      return res.status(400).json({ message: "booking_id and rating are required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    // Verify the booking belongs to this guest and is completed
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("id, guest_id, host_id, status")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "completed")
      return res.status(400).json({ message: "You can only review a completed booking" });
    if (req.user.id !== booking.guest_id)
      return res.status(403).json({ message: "Only the guest can review this booking" });

    // Check no duplicate review
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("booking_id", booking_id)
      .single();
    if (existing) return res.status(400).json({ message: "You have already reviewed this booking" });

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert({ booking_id, reviewer_id: req.user.id, host_id: booking.host_id, rating, comment })
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });

    // Event-driven badge evaluation for this vendor (fire-and-forget)
    require("../services/badgeEngine")
      .evaluate({ vendorIds: [booking.host_id] })
      .catch((e) => console.error("Badge evaluation error:", e.message));

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:username — public; returns reviews + aggregate for a vendor
const getHostReviews = async (req, res) => {
  try {
    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", req.params.username)
      .single();

    if (!host) return res.status(404).json({ message: "Host not found" });

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, comment, created_at, profiles!reviews_reviewer_id_fkey(name, profile_image)")
      .eq("host_id", host.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    const count = reviews?.length || 0;
    const avg = count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    res.json({ reviews: reviews || [], count, avg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/booking/:id — check if current user has reviewed a booking
const getBookingReview = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("booking_id", req.params.id)
      .single();

    if (error && error.code !== "PGRST116") return res.status(500).json({ message: error.message });
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getHostReviews, getBookingReview };
