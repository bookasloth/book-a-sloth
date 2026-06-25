import { ArrowRight } from "lucide-react";
import Reveal from "../home/Reveal";
import { problem } from "./aboutContent";

export default function ProblemSplit() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
          {problem.heading}
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {problem.rows.map((r, i) => (
            <Reveal key={i} delay={i * 0.06} className="rounded-[6px] border border-ink/10 bg-surface p-6">
              <p className="text-ink/40 line-through">{r.pain}</p>
              <div className="my-3 border-t border-dashed border-ink/15" />
              <p className="flex items-start gap-2 font-semibold text-ink">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                {r.fix}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
