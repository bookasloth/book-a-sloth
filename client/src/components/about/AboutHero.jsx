import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { hero, ROUTE_START } from "./aboutContent";

export default function AboutHero() {
  const root = useRef(null);
  const aura = useRef(null);
  const magnet = useRef(null);

  useGSAP(
    (ctx, contextSafe) => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Intro: words rise out of their mask, then sub + CTA settle in.
        const tl = gsap.timeline({ defaults: { ease: EASE } });
        tl.from(".js-word", {
          yPercent: 120,
          duration: 0.9,
          stagger: 0.06,
        })
          .from(".js-sub", { opacity: 0, y: 24, duration: 0.7 }, "-=0.45")
          .from(".js-cta", { opacity: 0, y: 20, scale: 0.95, duration: 0.6 }, "-=0.4");

        // Aura: gentle idle drift + parallax toward the pointer.
        gsap.to(aura.current, {
          xPercent: 6,
          yPercent: 8,
          duration: 7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        const onMove = contextSafe((e) => {
          const r = root.current.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(aura.current, { x: dx * 60, y: dy * 40, duration: 0.8, ease: "power2.out" });
          // Magnetic CTA — pulls slightly toward the cursor.
          gsap.to(magnet.current, { x: dx * 18, y: dy * 12, duration: 0.5, ease: "power2.out" });
        });
        const onLeave = contextSafe(() => {
          gsap.to([aura.current, magnet.current], { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
        });
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
    <section
      ref={root}
      className="relative overflow-hidden px-5 py-28 text-center sm:px-8 lg:py-36"
    >
      <div
        ref={aura}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(55% 50% at 50% 30%, #FFE9DD 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
          {hero.h1.split(" ").map((w, i, arr) => (
            <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span className="js-word inline-block">{w}</span>
              {i < arr.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p className="js-sub mx-auto mt-5 max-w-xl text-lg text-ink/70">{hero.sub}</p>
        <div className="js-cta mt-9 flex justify-center">
          <Link
            ref={magnet}
            to={ROUTE_START}
            className="btn inline-flex items-center justify-center gap-1.5 bg-primary-cta px-7 py-3.5 text-white shadow-[var(--shadow-hard-1)] transition-colors hover:bg-primary-dark"
          >
            {hero.ctaPrimary}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
