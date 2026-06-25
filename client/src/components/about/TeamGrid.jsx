import { useRef } from "react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import Placeholder from "./Placeholder";
import { team } from "./aboutContent";

export default function TeamGrid() {
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
          y: 60,
          scale: 0.94,
          duration: 0.9,
          ease: EASE,
          stagger: 0.12,
          scrollTrigger: { trigger: ".js-grid", start: "top 75%" },
        });
        // Avatar pops with an overshoot once its card is in.
        gsap.from(".js-avatar", {
          scale: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
          stagger: 0.12,
          delay: 0.25,
          scrollTrigger: { trigger: ".js-grid", start: "top 75%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="js-head font-heading text-3xl font-bold sm:text-4xl">{team.heading}</h2>
        <p className="js-head mt-3 max-w-xl text-ink/70">{team.sub}</p>
        <div className="js-grid mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m, i) => (
            <div
              key={i}
              className="js-card rounded-[6px] border border-ink/10 bg-surface p-6 text-center"
            >
              <Placeholder swap={m.swap} label={m.name} shape="avatar" className="js-avatar mx-auto h-20 w-20" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-primary">{m.role}</p>
              <p className="mt-2 text-sm text-ink/60">{m.quip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
