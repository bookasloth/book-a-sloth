import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../home/Reveal";
import Placeholder from "./Placeholder";
import { hero, ROUTE_START } from "./aboutContent";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
      {/* warm ambient aura */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 50% at 75% 30%, #FFE9DD 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal as="h1" className="font-heading text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            {hero.h1}
          </Reveal>
          <Reveal as="p" delay={0.08} className="mt-5 max-w-xl text-lg text-ink/70">
            {hero.sub}
          </Reveal>
          <Reveal delay={0.16} className="mt-8 flex flex-wrap gap-3">
            <Link
              to={ROUTE_START}
              className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-6 py-3 text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              {hero.ctaPrimary}
              <ArrowRight size={16} />
            </Link>
            <a href="#how-we-build" className="btn btn--outline px-6 py-3">
              {hero.ctaGhost}
            </a>
          </Reveal>
        </div>
        <div className="relative hidden h-80 lg:block" aria-hidden="true">
          <Placeholder swap="hero-main" label="Hero" className="sloth-float--slow absolute inset-6" />
          <Placeholder
            swap="hero-card-1"
            label="Paid"
            className="sloth-float absolute left-0 top-4 h-24 w-40 shadow-[var(--shadow-hard-1)]"
          />
          <Placeholder
            swap="hero-card-2"
            label="Booked"
            className="sloth-float--mid absolute bottom-2 right-0 h-24 w-44 shadow-[var(--shadow-hard-1)]"
          />
        </div>
      </div>
    </section>
  );
}
