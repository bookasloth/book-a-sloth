import Seo from "../components/common/Seo";
import useAboutMotion from "../components/about/useAboutMotion";
import HeroV2 from "../components/about/HeroV2";
import LogoMarquee from "../components/about/LogoMarquee";
import JoinSplit from "../components/about/JoinSplit";
import StackingCards from "../components/about/StackingCards";
import CaseStudyGrid from "../components/about/CaseStudyGrid";
import TestimonialsFlip from "../components/about/TestimonialsFlip";
import FaqAccordion from "../components/about/FaqAccordion";
import TeamMasonry from "../components/about/TeamMasonry";
// Appended (kept) original sections:
import ProblemSplit from "../components/about/ProblemSplit";
import BeliefGrid from "../components/about/BeliefGrid";
import BehindProduct from "../components/about/BehindProduct";
import StatStrip from "../components/about/StatStrip";
import BuildFlow from "../components/about/BuildFlow";
import TrustGrid from "../components/about/TrustGrid";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Book A Sloth",
  url: "https://bookasloth.com",
  description:
    "Book A Sloth helps creators publish services, get booked, and get paid — with 0% commission.",
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
      {/* New design block */}
      <HeroV2 />
      <LogoMarquee />
      <JoinSplit />
      <StackingCards />
      <CaseStudyGrid />
      <TestimonialsFlip />
      <FaqAccordion />
      <TeamMasonry />
      {/* Appended original sections */}
      <ProblemSplit />
      <BeliefGrid />
      <BehindProduct />
      <StatStrip />
      <BuildFlow />
      <TrustGrid />
    </main>
  );
}
