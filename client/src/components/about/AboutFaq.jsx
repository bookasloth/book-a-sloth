import { useState } from "react";
import { Plus } from "lucide-react";
import Reveal from "../home/Reveal";
import { faq } from "./aboutContent";

export default function AboutFaq() {
  const [open, setOpen] = useState(-1);
  return (
    <section className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal as="h2" className="font-heading text-3xl font-bold sm:text-4xl">
          {faq.heading}
        </Reveal>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-heading text-lg font-semibold">{item.q}</span>
                  <Plus
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="overflow-hidden text-white/70">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
