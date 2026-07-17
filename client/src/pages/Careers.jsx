import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import useAboutMotion from '../components/about/useAboutMotion';
import CareersHero from '../components/careers/CareersHero';
import WhyWorkHere from '../components/careers/WhyWorkHere';
import Perks from '../components/careers/Perks';
import CultureStrip from '../components/careers/CultureStrip';
import OpenRoles from '../components/careers/OpenRoles';
import CareersCta from '../components/careers/CareersCta';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Careers at Book A Sloth',
  url: 'https://bookasloth.com/careers',
  description: 'Open roles at Book A Sloth — build the calm way to get booked.',
};

export default function Careers() {
  useAboutMotion();
  return (
    <main className="bg-[var(--bg)]">
      <Seo
        title="Careers at Book A Sloth — build the calm way to get booked"
        description="Join Book A Sloth. Open roles across marketing, engineering, and sales. Remote-first, creators-first."
        image={ogCard('careers')}
        canonical="https://bookasloth.com/careers"
        jsonLd={JSON_LD}
      />
      <CareersHero />
      <WhyWorkHere />
      <Perks />
      <CultureStrip />
      <OpenRoles />
      <CareersCta />
    </main>
  );
}
