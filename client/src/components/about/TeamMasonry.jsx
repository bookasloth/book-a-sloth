import { useRef, useState } from "react";
import useGsapReveal from "./useGsapReveal";
import { team } from "./aboutContent";
import TeamModal from "./TeamModal";

const OFFSETS = ["mt-0", "mt-10", "mt-4", "mt-14", "mt-6", "mt-2"];

export default function TeamMasonry() {
  const root = useRef(null);
  useGsapReveal(root, ".js-item");
  const [active, setActive] = useState(null);

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{team.sub}</p>
        <h2 className="js-head mt-3 font-heading text-3xl font-bold sm:text-4xl">{team.heading}</h2>

        <div className="mt-10 columns-2 gap-5 sm:columns-3">
          {team.members.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(m)}
              className={`js-item group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[12px] border border-ink/10 bg-surface text-left ${OFFSETS[i % OFFSETS.length]}`}
            >
              <div className="aspect-[4/5] bg-sand" data-swap={m.swap}>
                <div className="flex h-full w-full items-center justify-center text-ink/30">Photo</div>
              </div>
              <div className="p-4">
                <div className="font-heading font-semibold">{m.name}</div>
                <div className="text-sm text-ink/60">{m.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {active && <TeamModal member={active} onClose={() => setActive(null)} />}
    </section>
  );
}
