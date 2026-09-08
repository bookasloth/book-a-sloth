// /services/:profession — SEO landing page: every bookable service for one profession.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';
import { SITE_URL, faqJsonLd } from '../../utils/seo';
import ServiceCategoryCard from '../../components/services/ServiceCategoryCard';
import { getProfessionServices } from '../../services/api';
import { professionSeo, cardBlurb } from './professionSeoContent';

export default function ProfessionServices() {
  const { profession } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProfessionServices(profession)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) navigate('/404', { replace: true });
        else setData({ error: true });
      })
      .finally(() => setLoading(false));
  }, [profession, navigate]);

  if (loading) return <div className="app-container py-16">Loading…</div>;
  if (!data || data.error) return <div className="app-container py-16">Could not load this page. Please retry.</div>;

  const { profession: prof, services } = data;
  const canonical = `${SITE_URL}/services/${prof.slug}`;
  const { intro, faqs, forLanding } = professionSeo(prof, services);
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: services.map((s, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: {
          '@type': 'Service', name: s.name, description: s.description,
          url: `${SITE_URL}/explore?category=${encodeURIComponent(prof.slug)}&service=${encodeURIComponent(s.slug)}`,
        },
      })),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Services', item: `${SITE_URL}/services` },
        { '@type': 'ListItem', position: 2, name: prof.label, item: canonical },
      ],
    },
    faqJsonLd({ faqs }),
  ];

  return (
    <div className="app-container py-12">
      <Seo
        title={`${prof.label} Services — Book Online | Book A Sloth`}
        description={`Browse ${services.length} bookable ${prof.label.toLowerCase()} services — ${services.slice(0, 3).map((s) => s.name).join(', ')} and more. Compare hosts and book online.`}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <nav className="mb-6 text-sm text-[#64748b]">
        <Link to="/services" className="hover:underline">Services</Link> / {prof.label}
      </nav>
      <h1 className="font-heading text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-[#1E1E1E] xl:text-[2.7rem]">
        Book a {prof.label} online
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#475569]">{intro}</p>

      <h2 className="mt-12 font-heading text-xl font-bold text-[#1E1E1E]">
        {prof.label} services you can book today
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <ServiceCategoryCard
            key={s.slug}
            service={{ ...s, description: cardBlurb(s.name, prof.label, i) }}
            profession={prof.slug}
          />
        ))}
      </div>

      {faqs.length > 0 && (
        <section className="mt-14 max-w-2xl">
          <h2 className="font-heading text-xl font-bold text-[#1E1E1E]">
            {prof.label} bookings — frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-[#1E1E1E]">{f.q}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-[#475569]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-14 border-t-2 border-[#1E1E1E]/10 pt-8">
        <h2 className="font-heading text-lg font-bold text-[#1E1E1E]">Keep exploring</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/services" className="rounded-full border-2 border-[#1E1E1E] px-4 py-1.5 font-semibold hover:bg-[#1E1E1E] hover:text-white">
            All professions
          </Link>
          <Link to="/explore" className="rounded-full border-2 border-[#1E1E1E] px-4 py-1.5 font-semibold hover:bg-[#1E1E1E] hover:text-white">
            Explore all services
          </Link>
          {forLanding && (
            <Link to={`/for/${forLanding}`} className="rounded-full border-2 border-[#1E1E1E] px-4 py-1.5 font-semibold hover:bg-[#1E1E1E] hover:text-white">
              Why {prof.label.toLowerCase()}s choose Book A Sloth
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
