import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../home/Reveal";
import { hero, ROUTE_START } from "./aboutContent";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8 lg:py-32">
      {/* warm ambient aura */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 55% at 50% 30%, #FFE9DD 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-3xl">
        <Reveal as="h1" className="font-heading text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
          {hero.h1}
        </Reveal>
        <Reveal as="p" delay={0.08} className="mx-auto mt-5 max-w-xl text-lg text-ink/70">
          {hero.sub}
        </Reveal>
        <Reveal delay={0.16} className="mt-8 flex justify-center">
          <Link
            to={ROUTE_START}
            className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-7 py-3 text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            {hero.ctaPrimary}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
