/**
 * WallOfLove.jsx — testimonial wall, buymeacoffee.com/reviews style.
 * Route: /wall-of-love
 *
 * DESIGN-ONLY: reviews are hardcoded mock data. Wiring to real host/guest
 * reviews is a later job — swap REVIEWS for a fetch when that's built.
 */
import { Heart, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';

// ponytail: hardcoded mock — real reviews come from the reviews table later.
const REVIEWS = [
  { name: 'Ananya Rao', role: 'Yoga guest', avatar: 'AR', rating: 5, text: 'Booked a session in under a minute. The reminder on WhatsApp meant I actually showed up on time for once.' },
  { name: 'Dr. Vikram Nair', role: 'Host · Physiotherapy', avatar: 'VN', rating: 5, text: 'Moved my whole practice off spreadsheets. Payments land before the client walks in. Never going back.' },
  { name: 'Meera Joshi', role: 'Tarot guest', avatar: 'MJ', rating: 5, text: 'Loved that I could pay and pick a slot without making an account. Felt effortless.' },
  { name: 'Rohan Kapoor', role: 'Host · Guitar lessons', avatar: 'RK', rating: 5, text: 'The no-show rate dropped once reminders went out automatically. That alone paid for the plan.' },
  { name: 'Sara Khan', role: 'Nutrition guest', avatar: 'SK', rating: 5, text: 'Rescheduling used to be five back-and-forth messages. Now it is two taps. Bless.' },
  { name: 'Aditya Menon', role: 'Host · Career coaching', avatar: 'AM', rating: 5, text: 'My booking link is basically my business card now. Clean page, my colours, my rules.' },
  { name: 'Priya Sharma', role: 'Consultation guest', avatar: 'PS', rating: 5, text: 'The whole flow felt calmer than every other booking site I have used. Fitting, given the sloth.' },
  { name: 'Karan Desai', role: 'Host · Photography', avatar: 'KD', rating: 4, text: 'Setup took ten minutes and the first booking came the same evening. Wanted more theme colours — apparently that is coming.' },
  { name: 'Nisha Verma', role: 'Astrology guest', avatar: 'NV', rating: 5, text: 'Got my invoice and calendar invite instantly. Small thing, but it made me trust the host more.' },
  { name: 'Farhan Ali', role: 'Host · Mentoring', avatar: 'FA', rating: 5, text: 'Refer & earn is quietly brilliant. Two hosts I referred are now paying customers.' },
  { name: 'Tanvi Iyer', role: 'Makeup guest', avatar: 'TI', rating: 5, text: 'Found a nearby artist, saw real reviews, booked. Three steps, zero phone calls.' },
  { name: 'Sameer Gupta', role: 'Host · Fitness', avatar: 'SG', rating: 5, text: 'Earnings dashboard is honest and clear. I know exactly what settles and when. Rare.' },
];

function Stars({ n }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < n ? 'fill-secondary text-secondary' : 'text-ink/15'}`} />
      ))}
    </div>
  );
}

function ReviewCard({ r }) {
  return (
    <figure className="mb-4 break-inside-avoid rounded-xl border-2 border-ink/10 bg-surface p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <Quote className="mb-3 h-6 w-6 text-primary/30" />
      <blockquote className="text-sm leading-relaxed text-ink">{r.text}</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t-2 border-ink/5 pt-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
          {r.avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{r.name}</span>
          <span className="block truncate text-xs text-muted">{r.role}</span>
        </span>
        <Stars n={r.rating} />
      </figcaption>
    </figure>
  );
}

export default function WallOfLove() {
  return (
    <div className="min-h-screen bg-canvas px-4 pb-24 pt-12 sm:pt-16">
      <Seo
        title="Wall of Love — Book A Sloth"
        description="Real words from hosts and guests who book, get booked, and get paid on Book A Sloth."
      />

      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-semibold text-primary">
          <Heart className="h-4 w-4 fill-primary" />
          Wall of Love
        </span>
        <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Loved by hosts and guests alike
        </h1>
        <p className="mt-3 text-base text-muted">
          Real words from the people who book, get booked, and get paid on Book A Sloth.
        </p>
        <Link
          to="/be-a-sloth"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          <Heart className="h-4 w-4" />
          Become a host
        </Link>
      </header>

      {/* Masonry wall — CSS columns keep the ragged buymeacoffee look with zero JS. */}
      <div className="mx-auto mt-12 max-w-6xl columns-1 gap-4 sm:columns-2 lg:columns-3">
        {REVIEWS.map((r) => (
          <ReviewCard key={r.name} r={r} />
        ))}
      </div>
    </div>
  );
}
