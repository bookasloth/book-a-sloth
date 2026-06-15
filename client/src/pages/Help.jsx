import { Link } from "react-router-dom";

/**
 * /help — Help Center. Placeholder copy; refine before launch (or wire to the
 * FAQ admin at /admin/content/faq later).
 */
const FAQ = [
  {
    q: "How do I book an appointment?",
    a: "Open a host's profile, pick a service and an available slot, then confirm. You'll verify with an OTP or your account and (for paid services) pay securely via Razorpay.",
  },
  {
    q: "How do I reschedule or cancel?",
    a: "Open the booking from My Bookings and use Reschedule or Cancel. Some hosts may charge a reschedule fee, shown before you confirm.",
  },
  {
    q: "I didn't get my confirmation email.",
    a: "Check spam, and confirm the email address you booked with. Confirmations are transactional and always sent. Still missing? Contact support below.",
  },
  {
    q: "How do payments and refunds work?",
    a: "Payments are processed by Razorpay. Refunds, when applicable, follow the host's policy and are returned to your original payment method.",
  },
  {
    q: "How do I become a host?",
    a: "Head to Be a Sloth to start onboarding — set up your profile, services and availability, then go live.",
  },
];

const Help = () => (
  <div className="app-container py-8 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-gray-500 mb-8">
        Answers to common questions. Need more help? Email us — we're happy to assist.
      </p>

      <div className="space-y-4">
        {FAQ.map(({ q, a }) => (
          <div key={q} className="page-card p-5">
            <h2 className="text-base font-semibold mb-1.5">{q}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <div className="page-card p-5 mt-6 text-center">
        <p className="text-sm text-gray-600">
          Still stuck?{" "}
          <a href="mailto:support@bookasloth.in" className="text-primary hover:underline">
            support@bookasloth.in
          </a>
        </p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
          Go home
        </Link>
      </div>
    </div>
  </div>
);

export default Help;
