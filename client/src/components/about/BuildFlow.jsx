import { useRef } from "react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { build } from "./aboutContent";

export default function BuildFlow() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Mobile / tablet / reduced-motion: simple stacked reveal.
      mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
        gsap.from(".js-head", {
          opacity: 0,
          y: 28,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        });
        gsap.from(".js-step", {
          opacity: 0,
          y: 50,
          duration: 0.7,
          ease: EASE,
          stagger: 0.1,
          scrollTrigger: { trigger: ".js-track", start: "top 80%" },
        });
      });

      // Desktop + motion: pin the section, steps slide horizontally as you scroll.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        const track = section.querySelector(".js-track");

        gsap.set(section, {
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        });
        gsap.set(track, { display: "flex", flexDirection: "row", flexWrap: "nowrap", width: "max-content" });
        gsap.set(".js-step", { width: "min(70vw, 380px)", flexShrink: 0 });

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 96);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        // Progress bar fills as the track scrolls.
        gsap.fromTo(
          ".js-progress",
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + distance(),
              scrub: true,
            },
          }
        );

        // Each step fades/rises as it enters from the right (driven by the horizontal tween).
        gsap.utils.toArray(".js-step").forEach((step) => {
          gsap.from(step, {
            opacity: 0,
            y: 40,
            duration: 0.4,
            ease: EASE,
            scrollTrigger: {
              trigger: step,
              containerAnimation: tween,
              start: "left 85%",
              toggleActions: "play none none reverse",
            },
          });
        });

        return () => {
          gsap.set([section, track, ".js-step"], { clearProps: "all" });
        };
      });
    },
    { scope: root }
  );

  return (
    <section id="how-we-build" ref={root} className="relative overflow-hidden bg-ink py-20 text-white lg:py-0">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:py-16">
        <h2 className="js-head font-heading text-3xl font-bold sm:text-4xl">{build.heading}</h2>
        <div className="mt-3 h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
          <div className="js-progress h-full w-full bg-primary" />
        </div>
      </div>
      <div className="js-track mt-2 grid gap-5 px-5 pb-4 sm:px-8 lg:gap-8 lg:px-12">
        {build.steps.map((s, i) => (
          <div
            key={i}
            className="js-step rounded-[6px] border border-white/10 bg-white/5 p-6 lg:p-8"
          >
            <span className="font-heading text-3xl font-extrabold text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 font-heading text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-white/60">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
