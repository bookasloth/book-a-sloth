// /services/:profession — SEO landing page: every bookable service for one profession.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';
import { SITE_URL } from '../../utils/seo';
import ServiceCategoryCard from '../../components/services/ServiceCategoryCard';
import { getProfessionServices } from '../../services/api';

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
        {prof.label} services you can book today
      </h1>
      <p className="mt-3 max-w-2xl text-[#64748b]">
        Every service below is offered by verified {prof.label.toLowerCase()} hosts on Book A Sloth.
        Pick one to see professionals, prices and reviews.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCategoryCard key={s.slug} service={s} profession={prof.slug} />
        ))}
      </div>
    </div>
  );
}
