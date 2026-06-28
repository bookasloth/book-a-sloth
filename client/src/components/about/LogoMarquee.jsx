import { useRef } from "react";
import { gsap, useGSAP } from "./gsapSetup";
import { logos } from "./aboutContent";
import ImgWithSkeleton from "./ImgWithSkeleton";

function LogoChip({ item }) {
  return (
    <div
      title={item.name}
      className="group flex h-20 w-40 shrink-0 items-center justify-center rounded-[10px] border border-ink/10 bg-surface px-6"
    >
      <div className="h-10 w-full grayscale transition-all duration-300 group-hover:grayscale-0">
        <ImgWithSkeleton
          src={item.src}
          alt={item.name}
          fallbackLabel={item.name}
          imgClassName="object-contain"
        />
      </div>
    </div>
  );
}

// Single track scrolling right → left (content drifts leftward).
function Marquee({ items }) {
  const track = useRef(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          track.current,
          { xPercent: 0 },
          { xPercent: -50, duration: 45, ease: "none", repeat: -1 }
        );
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
    <section className="overflow-hidden py-10">
      <p className="mb-8 px-5 text-center text-sm font-medium uppercase tracking-[0.2em] text-ink/40 sm:px-8">
        {logos.eyebrow}
      </p>
      <Marquee items={logos.brands} />
    </section>
  );
}
