import { useRef } from "react";
import useGsapReveal from "./useGsapReveal";
import { caseStudies } from "./aboutContent";

function Tile({ t }) {
  return (
    <article className="js-item group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-[14px] bg-ink p-6 text-white" data-swap={t.swap}>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
      <div className="relative">
        <h3 className="font-heading text-xl font-bold text-white">{t.title}</h3>
        <p className="mt-1 text-sm text-white/70">{t.blurb}</p>
      </div>
    </article>
  );
}

export default function CaseStudyGrid() {
  const root = useRef(null);
  useGsapReveal(root);
  const [a, b, c, d, e] = caseStudies.tiles;
  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Case studies</p>
        <h2 className="js-head mt-3 font-heading text-3xl font-bold sm:text-4xl">{caseStudies.heading}</h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-[7fr_3fr]">
          <Tile t={a} />
          <Tile t={b} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Tile t={c} />
          <Tile t={d} />
          <Tile t={e} />
        </div>
      </div>
    </section>
  );
}
