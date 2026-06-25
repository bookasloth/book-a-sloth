import Reveal from "../home/Reveal";
import Placeholder from "./Placeholder";
import { behind } from "./aboutContent";

export default function BehindProduct() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
          {behind.heading}
        </Reveal>
        <Reveal as="p" delay={0.06} className="mt-3 max-w-xl text-ink/70">
          {behind.sub}
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {behind.tiles.map((t, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <Placeholder swap={t.swap} label={t.caption} className="h-48 w-full" />
              <p className="mt-3 font-semibold text-ink">{t.caption}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
