import { Link } from "react-router-dom";
import { CalendarCheck, ShieldCheck, Sparkles, Heart } from "lucide-react";

// /about — public "About Book A Sloth" page. Static marketing copy; refine the
// wording with final brand copy before launch.

const VALUES = [
  { icon: CalendarCheck, title: "Booking made simple", desc: "Pick a creator, choose a slot, and you're set — no back-and-forth, no friction." },
  { icon: ShieldCheck,   title: "Safe payments",       desc: "Every transaction is secured through Razorpay, with clear pricing up front." },
  { icon: Sparkles,      title: "Built for creators",  desc: "Hosts get the tools to publish services, manage availability and grow." },
  { icon: Heart,         title: "People first",        desc: "We sweat the small details so booking time with someone feels effortless." },
];

const About = () => (
  <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
    <div className="app-container py-10 sm:py-14 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FE5100] mb-3">
          <Sparkles size={14} /> About us
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          Book time with the people worth your time.
        </h1>
        <p className="text-gray-600 mt-4 max-w-xl mx-auto">
          Book A Sloth is an appointment-booking platform that connects creators and
          experts with the people who want to learn from them, work with them, or
          simply spend a session together — all in a few taps.
        </p>
      </div>

      {/* Values */}
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {VALUES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white border rounded-2xl p-5">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FE5100]/10 text-[#FE5100] mb-3">
              <Icon size={20} />
            </span>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="bg-white border rounded-2xl p-6 sm:p-8 mb-10">
        <h2 className="text-lg font-bold mb-2">Why "Sloth"?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Because booking shouldn't be a rush. We believe the best appointments
          happen when both sides show up relaxed and ready — not stressed by
          clunky scheduling. So we built a calm, dependable way to find a time
          that works and lock it in. Slow is smooth; smooth is fast.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link to="/" className="btn inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-[#FE5100] hover:bg-[#d94400] hover:no-underline">
          Explore creators
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Want to host on Book A Sloth?{" "}
          <Link to="/be-a-sloth" className="text-[#FE5100] hover:underline">Become a creator →</Link>
        </p>
      </div>
    </div>
  </div>
);

export default About;
