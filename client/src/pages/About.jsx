import Seo from "../components/common/Seo";
import useAboutMotion from "../components/about/useAboutMotion";
import AboutHero from "../components/about/AboutHero";
import ProblemSplit from "../components/about/ProblemSplit";
import BeliefGrid from "../components/about/BeliefGrid";
import BehindProduct from "../components/about/BehindProduct";
import StatStrip from "../components/about/StatStrip";
import TeamGrid from "../components/about/TeamGrid";
import BuildFlow from "../components/about/BuildFlow";
import TrustGrid from "../components/about/TrustGrid";
import AboutTestimonials from "../components/about/AboutTestimonials";
import AboutFaq from "../components/about/AboutFaq";
import FinalCta from "../components/about/FinalCta";

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
      <AboutHero />
      <ProblemSplit />
      <BeliefGrid />
      <BehindProduct />
      <StatStrip />
      <TeamGrid />
      <BuildFlow />
      <TrustGrid />
      <AboutTestimonials />
      <AboutFaq />
      <FinalCta />
    </main>
  );
}
