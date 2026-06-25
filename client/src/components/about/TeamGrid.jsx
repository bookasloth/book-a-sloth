import Reveal from "../home/Reveal";
import Placeholder from "./Placeholder";
import { team } from "./aboutContent";

export default function TeamGrid() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-heading text-3xl font-bold sm:text-4xl">
          {team.heading}
        </Reveal>
        <Reveal as="p" delay={0.06} className="mt-3 max-w-xl text-ink/70">
          {team.sub}
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m, i) => (
            <Reveal
              key={i}
              delay={i * 0.06}
              className="rounded-[6px] border border-ink/10 bg-surface p-6 text-center transition-transform hover:-translate-y-1"
            >
              <Placeholder swap={m.swap} label={m.name} shape="avatar" className="mx-auto h-20 w-20" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-primary">{m.role}</p>
              <p className="mt-2 text-sm text-ink/60">{m.quip}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
