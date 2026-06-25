import Reveal from "../home/Reveal";
import { testimonials } from "./aboutContent";

function Avatar({ name, src }) {
  const initials = (name || "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-cta">
      {initials}
    </span>
  );
}

export default function AboutTestimonials() {
  if (!testimonials.items.length) return null;
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-heading text-3xl font-bold sm:text-4xl">
          {testimonials.heading}
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <Reveal key={i} delay={(i % 3) * 0.05} className="rounded-[6px] border border-ink/10 bg-surface p-6">
              <p className="text-ink/80">“{t.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={t.name} src={t.avatar} />
                <div>
                  <div className="font-semibold text-ink">{t.name}</div>
                  <div className="text-sm text-ink/50">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
