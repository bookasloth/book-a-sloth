import { useRef } from "react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { testimonials } from "./aboutContent";

function Avatar({ name, src }) {
  const initials = (name || "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-cta">
      {initials}
    </span>
  );
}

function Card({ t, clone }) {
  return (
    <figure
      aria-hidden={clone || undefined}
      className={`${clone ? "js-clone hidden" : ""} w-80 shrink-0 rounded-[6px] border border-ink/10 bg-surface p-6`}
    >
      <p className="text-ink/80">“{t.quote}”</p>
      <figcaption className="mt-4 flex items-center gap-3">
        <Avatar name={t.name} src={t.avatar} />
        <span>
          <span className="block font-semibold text-ink">{t.name}</span>
          <span className="block text-sm text-ink/50">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function AboutTestimonials() {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".js-head", {
          opacity: 0,
          y: 28,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: root.current, start: "top 82%" },
        });

        // Reveal clones + switch to a seamless single-row marquee.
        gsap.set(".js-clone", { display: "block" });
        gsap.set(track.current, { flexWrap: "nowrap", justifyContent: "flex-start", width: "max-content" });

        const loop = gsap.to(track.current, {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        const enter = () => gsap.to(loop, { timeScale: 0, duration: 0.4 });
        const leave = () => gsap.to(loop, { timeScale: 1, duration: 0.4 });
        root.current.addEventListener("pointerenter", enter);
        root.current.addEventListener("pointerleave", leave);

        return () => {
          root.current?.removeEventListener("pointerenter", enter);
          root.current?.removeEventListener("pointerleave", leave);
          gsap.set(track.current, { clearProps: "all" });
          gsap.set(".js-clone", { clearProps: "display" });
        };
      });
    },
    { scope: root }
  );

  if (!testimonials.items.length) return null;

  return (
    <section ref={root} className="overflow-hidden px-0 py-20 sm:py-28">
      <div className="mx-auto mb-10 max-w-6xl px-5 sm:px-8">
        <h2 className="js-head font-heading text-3xl font-bold sm:text-4xl">{testimonials.heading}</h2>
      </div>
      <div ref={track} className="flex flex-wrap justify-center gap-5 px-5 sm:px-8">
        {testimonials.items.map((t, i) => (
          <Card key={i} t={t} />
        ))}
        {testimonials.items.map((t, i) => (
          <Card key={`c${i}`} t={t} clone />
        ))}
      </div>
    </section>
  );
}
