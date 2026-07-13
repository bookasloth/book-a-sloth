import Seo from "../components/common/Seo";
import { ORG_SAME_AS } from "../utils/seo";
import useAboutMotion from "../components/about/useAboutMotion";
import HeroV2 from "../components/about/HeroV2";
import LogoMarquee from "../components/about/LogoMarquee";
import JoinSplit from "../components/about/JoinSplit";
import StackingCards from "../components/about/StackingCards";
import TestimonialsFlip from "../components/about/TestimonialsFlip";
import FaqAccordion from "../components/about/FaqAccordion";
import TeamMasonry from "../components/about/TeamMasonry";
// Appended (kept) original sections:
import BeliefGrid from "../components/about/BeliefGrid";
// Removed: ProblemSplit, BehindProduct, StatStrip, BuildFlow, FinalCta, TrustGrid

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Book A Sloth",
  url: "https://bookasloth.com",
  description:
    "Book A Sloth helps creators publish services, get booked, and get paid — with 0% commission.",
  sameAs: ORG_SAME_AS,
};

export default function About() {
  useAboutMotion();
  return (
    <main className="bg-[var(--bg)]">
      <Seo
        title="About Book A Sloth — the calm way to get booked"
        description="Why we exist, who we are, and how we help creators get booked and paid without commission."
        jsonLd={JSON_LD}
      />
      {/* Sequence: Hero → Brands → How it works → Team → Belief → Join → Testimonials → FAQ */}
      <HeroV2 />
      <LogoMarquee />
      <StackingCards />
      <TeamMasonry />
      <BeliefGrid />
      <JoinSplit />
      <TestimonialsFlip />
      <FaqAccordion />
    </main>
  );
}
