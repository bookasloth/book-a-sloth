import Reveal from "../home/Reveal";
import { story } from "./aboutContent";

export default function StoryTimeline() {
  return (
    <section className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal as="h2" className="font-heading text-3xl font-bold sm:text-4xl">
          {story.heading}
        </Reveal>
        <ol className="mt-10 space-y-8 border-l border-white/15 pl-8">
          {story.nodes.map((n, i) => (
            <Reveal
              as="li"
              key={i}
              delay={i * 0.08}
              className="relative"
              {...(n.swap ? { "data-swap": n.swap } : {})}
            >
              <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-ink" />
              <h3 className="font-heading text-lg font-semibold">{n.title}</h3>
              <p className="mt-1 text-white/70">{n.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
