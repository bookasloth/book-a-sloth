import Reveal from "../home/Reveal";
import { build } from "./aboutContent";

export default function BuildFlow() {
  return (
    <section id="how-we-build" className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-heading text-3xl font-bold sm:text-4xl">
          {build.heading}
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {build.steps.map((s, i) => (
            <Reveal as="li" key={i} delay={i * 0.05} className="rounded-[6px] border border-white/10 bg-white/5 p-5">
              <span className="font-heading text-2xl font-extrabold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-heading text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-white/60">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
