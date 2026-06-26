import { useRef } from "react";
import { gsap, useGSAP } from "./gsapSetup";
import { logos } from "./aboutContent";

function LogoChip({ item }) {
  return (
    <span
      data-swap={item.swap}
      className="flex h-12 shrink-0 items-center justify-center rounded-[8px] border border-ink/10 bg-surface px-7 font-heading text-lg font-bold text-ink/40 grayscale transition-all duration-300 hover:text-primary hover:grayscale-0"
    >
      {item.name}
    </span>
  );
}

function Row({ items, dir }) {
  const track = useRef(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const from = dir === "rtl" ? 0 : -50;
        const to = dir === "rtl" ? -50 : 0;
        gsap.fromTo(track.current, { xPercent: from }, { xPercent: to, duration: 30, ease: "none", repeat: -1 });
      });
    },
    { scope: track }
  );
  return (
    <div className="flex w-max gap-5" ref={track}>
      {[...items, ...items].map((item, i) => (
        <LogoChip key={i} item={item} />
      ))}
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section className="overflow-hidden py-14">
      <p className="mb-8 px-5 text-center text-sm font-medium uppercase tracking-[0.2em] text-ink/40 sm:px-8">
        {logos.eyebrow}
      </p>
      <div className="space-y-4">
        <Row items={logos.row1} dir="ltr" />
        <Row items={logos.row2} dir="rtl" />
      </div>
    </section>
  );
}
