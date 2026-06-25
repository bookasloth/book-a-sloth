import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../home/Reveal";
import { finalCta, ROUTE_START } from "./aboutContent";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8 lg:py-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, #FFE9DD 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-2xl">
        <Reveal as="h2" className="font-heading text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          {finalCta.heading}
        </Reveal>
        <Reveal as="p" delay={0.08} className="mt-4 text-lg text-ink/70">
          {finalCta.sub}
        </Reveal>
        <Reveal delay={0.16} className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={ROUTE_START}
            className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-7 py-3 text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            {finalCta.ctaPrimary}
            <ArrowRight size={16} />
          </Link>
          <Link to={ROUTE_START} className="btn btn--outline px-7 py-3">
            {finalCta.ctaGhost}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
