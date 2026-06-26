import { useRef } from "react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import Placeholder from "./Placeholder";
import { behind } from "./aboutContent";

export default function BehindProduct() {
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
        // Each tile wipes open left-to-right.
        gsap.utils.toArray(".js-tile").forEach((tile, i) => {
          gsap.fromTo(
            tile,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 1,
              ease: "power3.inOut",
              delay: i * 0.12,
              scrollTrigger: { trigger: ".js-tiles", start: "top 75%" },
            }
          );
          // Parallax drift on the placeholder inside.
          gsap.to(tile.querySelector(".js-img"), {
            yPercent: -12,
            ease: "none",
            scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
        gsap.from(".js-cap", {
          opacity: 0,
          y: 14,
          duration: 0.6,
          ease: EASE,
          stagger: 0.12,
          delay: 0.4,
          scrollTrigger: { trigger: ".js-tiles", start: "top 75%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="js-head max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
          {behind.heading}
        </h2>
        <p className="js-head mt-3 max-w-xl text-ink/70">{behind.sub}</p>
        <div className="js-tiles mt-10 grid gap-5 sm:grid-cols-3">
          {behind.tiles.map((t, i) => (
            <div key={i}>
              <div className="js-tile overflow-hidden rounded-[6px]">
                <Placeholder swap={t.swap} label={t.caption} className="js-img h-48 w-full scale-110" />
              </div>
              <p className="js-cap mt-3 font-semibold text-ink">{t.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
