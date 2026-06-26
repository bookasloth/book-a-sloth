import { useRef } from "react";
import { Lock, CreditCard, DatabaseBackup, ShieldCheck } from "lucide-react";
import { trust } from "./aboutContent";
import useGsapReveal from "./useGsapReveal";

const ICONS = [Lock, CreditCard, DatabaseBackup, ShieldCheck];
const ACCENTS = ["var(--c-cyan)", "var(--c-emerald)", "var(--c-amber)", "var(--c-blue)"];

export default function TrustGrid() {
  const root = useRef(null);
  useGsapReveal(root);

  return (
    <section ref={root} className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="js-head font-heading text-3xl font-bold sm:text-4xl">{trust.heading}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trust.cards.map((c, i) => {
            const Icon = ICONS[i % ICONS.length];
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <div key={i} className="js-item rounded-[6px] border border-ink/10 bg-surface p-6">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[6px]"
                  style={{ background: `color-mix(in srgb, ${accent} 14%, white)`, color: accent }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-ink/70">{c.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
