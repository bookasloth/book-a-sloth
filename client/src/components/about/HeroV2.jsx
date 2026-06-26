import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { hero, ROUTE_START } from "./aboutContent";

const WORDS = ["get booked.", "get paid.", "stay calm."];

function useTypewriter(words) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let wi = 0, ci = words[0].length, deleting = false, raf;
    const tick = () => {
      const word = words[wi];
      ci += deleting ? -1 : 1;
      setText(word.slice(0, ci));
      let delay = deleting ? 45 : 90;
      if (!deleting && ci === word.length) { deleting = true; delay = 1400; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 250; }
      raf = window.setTimeout(tick, delay);
    };
    raf = window.setTimeout(tick, 1400);
    return () => window.clearTimeout(raf);
  }, [words]);
  return text;
}

export default function HeroV2() {
  const typed = useTypewriter(WORDS);
  const aura = useRef(null);
  const lead = "Your time is worth protecting.";

  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
      <div ref={aura} aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(55% 50% at 30% 30%, #FFE9DD 0%, transparent 70%)" }} />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            {lead}
            <br />
            <span className="text-primary">
              <span aria-hidden="true">{typed}</span>
              <span aria-hidden="true" className="ml-0.5 inline-block w-[2px] animate-pulse bg-primary align-middle" style={{ height: "0.9em" }} />
              <span data-testid="hero-typeword" className="sr-only">{WORDS.join(" ")}</span>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/70">{hero.sub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={ROUTE_START} className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-7 py-3.5 text-white shadow-[var(--shadow-hard-1)] transition-colors hover:bg-primary-dark">
              {hero.ctaPrimary}
              <ArrowRight size={16} />
            </Link>
            <a href="#about-how" className="btn btn--outline inline-flex items-center justify-center px-7 py-3.5">
              {hero.ctaGhost}
            </a>
          </div>
        </div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[10px] bg-sand ring-1 ring-black/5" data-swap="hero-portrait">
          <div className="flex h-full w-full items-center justify-center text-ink/30">Portrait</div>
        </div>
      </div>
    </section>
  );
}
