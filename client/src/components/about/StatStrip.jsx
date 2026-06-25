import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../home/Reveal";
import { stats } from "./aboutContent";

const fmt = (s) => `${s.prefix || ""}${s.value}${s.suffix || ""}`;

export default function StatStrip() {
  const reduce = useReducedMotion();
  return (
    <section className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="text-center font-heading text-3xl font-bold sm:text-4xl">
          {stats.heading}
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {stats.items.map((s, i) => (
            <motion.div
              key={i}
              data-swap={s.swap}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="font-heading text-4xl font-extrabold tracking-tight">{fmt(s)}</div>
              <div className="mt-2 text-sm text-white/60">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
