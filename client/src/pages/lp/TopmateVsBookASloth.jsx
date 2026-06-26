import { useEffect } from "react";
import { Link } from "react-router-dom";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";

import { CtaButton } from "../../components/lp/LpKit";
import LpHero from "../../components/lp/LpHero";
import LpCreatorsCarousel from "../../components/lp/LpCreatorsCarousel";
import LpFlash from "../../components/lp/LpFlash";
import LpAccordion from "../../components/lp/LpAccordion";
import LpTestimonials from "../../components/lp/LpTestimonials";
import LpBento from "../../components/lp/LpBento";
import LpFaq from "../../components/lp/LpFaq";

/* ════════════════════════════════════════════════════════════════════
   /lp/topmate-vs-bookasloth — Topmate-style conversion landing page.
   Single goal: start a 0%-commission host signup (→ /be-a-sloth).
   No global Navbar/footer (App.jsx hides nav on /lp). No exit links.
   Blocks live in client/src/components/lp/*; content in lpData.js.
   ════════════════════════════════════════════════════════════════════ */

const SLUG = "topmate-vs-bookasloth";

const TopmateVsBookASloth = () => {
  const utm = useUtm();

  useDocumentMeta({
    title: "Book A Sloth — the 0% commission Topmate alternative",
    description:
      "Switching from Topmate? Keep what you earn — 0% commission, flat ₹499/month, UPI & GST built in. Start free.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas text-ink">
      {/* ───── Minimal header (no nav links = no exit) ───── */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-extrabold tracking-tight text-ink">
              Book A Sloth
            </span>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">
              0% commission
            </span>
          </div>
          <CtaButton
            slot="header"
            className="!rounded-full !px-4 !py-2 !text-[13px]"
          >
            Start My Page
          </CtaButton>
        </div>
      </header>

      {/* ───── Blocks ───── */}
      <LpHero />
      <LpCreatorsCarousel />
      <LpFlash />
      <LpAccordion />
      <LpTestimonials />
      <LpBento />
      <LpFaq />

      {/* ───── Final CTA ───── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-ink px-6 py-16 text-center text-white sm:py-20">
          <h2 className="mx-auto max-w-xl text-3xl leading-tight text-white sm:text-5xl">
            Stop paying commission on your own work.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Move to flat ₹499/month. Keep what you earn — starting with your next
            booking.
          </p>
          <div className="mt-9 flex justify-center">
            <CtaButton slot="final" variant="light" />
          </div>
        </div>
      </section>

      {/* ───── Minimal footer ───── */}
      <footer className="px-5 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 border-t border-black/5 pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Book A Sloth</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-ink hover:no-underline">
              Privacy
            </Link>
            <Link to="/help" className="hover:text-ink hover:no-underline">
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:text-ink hover:no-underline">
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TopmateVsBookASloth;
