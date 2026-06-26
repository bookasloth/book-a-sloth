import { useRef } from "react";
import { gsap, useGSAP, EASE } from "./gsapSetup";
import { stats } from "./aboutContent";

const decimals = (v) => {
  const s = String(v);
  return s.includes(".") ? s.split(".")[1].length : 0;
};
const fmt = (s, n) =>
  `${s.prefix || ""}${Number(n).toFixed(decimals(s.value))}${s.suffix || ""}`;

export default function StatStrip() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nums = gsap.utils.toArray(".js-num");

        // Pin the band briefly and scrub the count + rise as you scroll through.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=60%",
            pin: true,
            scrub: 0.5,
          },
        });

        tl.from(".js-head", { opacity: 0, y: 24, duration: 0.4, ease: EASE });
        tl.from(".js-stat", { opacity: 0, y: 40, stagger: 0.08, duration: 0.5, ease: EASE }, "<");

        nums.forEach((el) => {
          const s = stats.items[Number(el.dataset.i)];
          const target = Number(s.value);
          const obj = { v: 0 };
          gsap.set(el, { textContent: fmt(s, 0) });
          tl.to(
            obj,
            {
              v: target,
              duration: 0.8,
              ease: "none",
              onUpdate: () => {
                el.textContent = fmt(s, obj.v);
              },
            },
            "<"
          );
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="js-head text-center font-heading text-3xl font-bold sm:text-4xl">
          {stats.heading}
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {stats.items.map((s, i) => (
            <div key={i} data-swap={s.swap} className="js-stat text-center">
              <div
                className="js-num font-heading text-4xl font-extrabold tracking-tight"
                data-i={i}
              >
                {fmt(s, Number(s.value))}
              </div>
              <div className="mt-2 text-sm text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
