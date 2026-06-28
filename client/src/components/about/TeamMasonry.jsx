import { useRef } from "react";
import useGsapReveal from "./useGsapReveal";
import { team } from "./aboutContent";
import ImgWithSkeleton from "./ImgWithSkeleton";
import TeamSocials from "./TeamSocials";

const OFFSETS = ["mt-0", "mt-10", "mt-4", "mt-14", "mt-6", "mt-2"];

export default function TeamMasonry() {
  const root = useRef(null);
  useGsapReveal(root, ".js-item");

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{team.sub}</p>
        <h2 className="js-head mt-3 font-heading text-3xl font-bold sm:text-4xl">{team.heading}</h2>

        <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {team.members.map((m, i) => (
            <article
              key={m.name}
              className={`js-item mb-5 block w-full break-inside-avoid overflow-hidden rounded-[12px] border border-ink/10 bg-surface text-left ${OFFSETS[i % OFFSETS.length]}`}
            >
              <div className="aspect-[4/5] bg-sand" data-swap={`team-${i + 1}`}>
                <ImgWithSkeleton src={m.photo} alt={`${m.name} — ${m.role}`} fallbackLabel={m.name} />
              </div>
              <div className="p-5">
                <div className="font-heading text-lg font-semibold">{m.name}</div>
                <div className="text-sm font-medium text-primary">{m.role}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{m.bio}</p>
                <TeamSocials socials={m.socials} name={m.name} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
