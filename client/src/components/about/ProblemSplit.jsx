import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { problem } from "./aboutContent";

export default function ProblemSplit() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".js-head", {
          opacity: 0,
          y: 28,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        });
        gsap.from(".js-card", {
          opacity: 0,
          x: (i) => (i % 2 ? 70 : -70),
          y: 28,
          duration: 0.9,
          ease: EASE,
          stagger: 0.12,
          scrollTrigger: { trigger: ".js-grid", start: "top 75%" },
        });
        // Strikethrough draws across the pain text as cards land.
        gsap.fromTo(
          ".js-strike",
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 0.5,
            ease: "power2.inOut",
            stagger: 0.12,
            delay: 0.35,
            scrollTrigger: { trigger: ".js-grid", start: "top 75%" },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="js-head max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
          {problem.heading}
        </h2>
        <div className="js-grid mt-10 grid gap-5 sm:grid-cols-2">
          {problem.rows.map((r, i) => (
            <div key={i} className="js-card rounded-[6px] border border-ink/10 bg-surface p-6">
              <p className="relative inline-block text-ink/45">
                {r.pain}
                <span className="js-strike absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-ink/45" />
              </p>
              <div className="my-3 border-t border-dashed border-ink/15" />
              <p className="flex items-start gap-2 font-semibold text-ink">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                {r.fix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
