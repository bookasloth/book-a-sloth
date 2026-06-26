import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { finalCta, ROUTE_START } from "./aboutContent";

export default function FinalCta() {
  const root = useRef(null);
  const aura = useRef(null);
  const magnet = useRef(null);

  useGSAP(
    (ctx, contextSafe) => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: EASE },
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        tl.from(".js-h", { opacity: 0, y: 40, scale: 0.9, duration: 0.9 })
          .from(".js-p", { opacity: 0, y: 20, duration: 0.6 }, "-=0.5")
          .from(".js-b", { opacity: 0, y: 20, scale: 0.92, duration: 0.6 }, "-=0.4");

        // Aura breathes behind the headline.
        gsap.to(aura.current, {
          scale: 1.12,
          opacity: 0.8,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        // Magnetic CTA.
        const onMove = contextSafe((e) => {
          const r = magnet.current.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          gsap.to(magnet.current, { x: dx * 0.3, y: dy * 0.3, duration: 0.5, ease: "power2.out" });
        });
        const onLeave = contextSafe(() =>
          gsap.to(magnet.current, { x: 0, y: 0, duration: 0.5, ease: "power3.out" })
        );
        root.current.addEventListener("pointermove", onMove);
        root.current.addEventListener("pointerleave", onLeave);
        return () => {
          root.current?.removeEventListener("pointermove", onMove);
          root.current?.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden px-5 py-28 text-center sm:px-8 lg:py-36">
      <div
        ref={aura}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(55% 55% at 50% 45%, #FFE9DD 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-2xl">
        <h2 className="js-h font-heading text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          {finalCta.heading}
        </h2>
        <p className="js-p mt-4 text-lg text-ink/70">{finalCta.sub}</p>
        <div className="js-b mt-8 flex justify-center">
          <Link
            ref={magnet}
            to={ROUTE_START}
            className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-8 py-3.5 text-white shadow-[var(--shadow-hard-1)] transition-colors hover:bg-primary-dark"
          >
            {finalCta.ctaPrimary}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
