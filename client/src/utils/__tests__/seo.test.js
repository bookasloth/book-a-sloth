import { describe, test, expect } from 'vitest';
import { resolveServiceSeo, resolveProfileSeo, serviceJsonLd, profileJsonLd } from '../seo';

const SITE = 'https://bookasloth.com';
const VENDOR = { name: 'John Doe', username: 'john-doe', profile_image: 'https://img/john.jpg' };

describe('resolveServiceSeo — admin overrides win, fallbacks otherwise', () => {
  const base = { title: 'Business Consultation', slug: 'business-consultation', short_description: 'A 1:1 call.' };

  test('falls back to service title + vendor + brand suffix when no seo_title', () => {
    const seo = resolveServiceSeo({ service: base, vendor: VENDOR, siteUrl: SITE });
    expect(seo.title).toBe('Business Consultation with John Doe | Book A Sloth');
    expect(seo.description).toBe('A 1:1 call.');
  });

  test('uses admin seo_title / seo_description verbatim when set', () => {
    const seo = resolveServiceSeo({
      service: { ...base, seo_title: 'Hire a Top Consultant', seo_description: 'Custom meta.' },
      vendor: VENDOR, siteUrl: SITE,
    });
    expect(seo.title).toBe('Hire a Top Consultant');
    expect(seo.description).toBe('Custom meta.');
  });

  test('canonical is the CURRENT username + slug, always absolute', () => {
    const seo = resolveServiceSeo({ service: base, vendor: VENDOR, siteUrl: SITE });
    expect(seo.canonical).toBe('https://bookasloth.com/john-doe/business-consultation');
  });

  test('robots reflects is_indexable; default (undefined) is indexable', () => {
    expect(resolveServiceSeo({ service: base, vendor: VENDOR, siteUrl: SITE }).robots).toBe('index,follow');
    expect(resolveServiceSeo({ service: { ...base, is_indexable: false }, vendor: VENDOR, siteUrl: SITE }).robots)
      .toBe('noindex,nofollow');
  });

  test('og image falls back thumbnail -> brand card', () => {
    expect(resolveServiceSeo({ service: { ...base, thumbnail_url: 'https://img/t.jpg' }, vendor: VENDOR, siteUrl: SITE }).image)
      .toBe('https://img/t.jpg');
    expect(resolveServiceSeo({ service: base, vendor: VENDOR, siteUrl: SITE }).image)
      .toBe('https://bookasloth.com/og-image.png');
    expect(resolveServiceSeo({ service: { ...base, seo_image: 'https://img/seo.jpg' }, vendor: VENDOR, siteUrl: SITE }).image)
      .toBe('https://img/seo.jpg');
  });

  test('description is truncated to ~160 chars', () => {
    const long = 'x'.repeat(300);
    const seo = resolveServiceSeo({ service: { ...base, short_description: long }, vendor: VENDOR, siteUrl: SITE });
    expect(seo.description.length).toBeLessThanOrEqual(160);
  });
});

describe('resolveProfileSeo', () => {
  const host = { name: 'John Doe', username: 'john-doe', profession: 'Consultant', bio: 'I help founders.' };

  test('builds title from name + profession when no override', () => {
    expect(resolveProfileSeo({ host, siteUrl: SITE }).title).toBe('John Doe — Consultant | Book A Sloth');
  });
  test('canonical is the profile root URL', () => {
    expect(resolveProfileSeo({ host, siteUrl: SITE }).canonical).toBe('https://bookasloth.com/john-doe');
  });
  test('noindex when host.is_indexable === false', () => {
    expect(resolveProfileSeo({ host: { ...host, is_indexable: false }, siteUrl: SITE }).robots).toBe('noindex,nofollow');
  });
});

describe('serviceJsonLd', () => {
  test('emits a Service schema with provider + INR offer + canonical url', () => {
    const ld = serviceJsonLd({
      service: { title: 'Business Consultation', slug: 'business-consultation', short_description: 'A call.', price: 500 },
      vendor: VENDOR, siteUrl: SITE,
    });
    expect(ld['@type']).toBe('Service');
    expect(ld.name).toBe('Business Consultation');
    expect(ld.provider).toMatchObject({ '@type': 'Person', name: 'John Doe' });
    expect(ld.offers).toMatchObject({ '@type': 'Offer', price: '500', priceCurrency: 'INR' });
    expect(ld.url).toBe('https://bookasloth.com/john-doe/business-consultation');
  });

  test('includes aggregateRating only when there are reviews', () => {
    const withReviews = serviceJsonLd({ service: { title: 'X', slug: 'x', price: 0 }, vendor: VENDOR, siteUrl: SITE, avgRating: 4.5, reviewCount: 12 });
    expect(withReviews.aggregateRating).toMatchObject({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 12 });
    const noReviews = serviceJsonLd({ service: { title: 'X', slug: 'x', price: 0 }, vendor: VENDOR, siteUrl: SITE, reviewCount: 0 });
    expect(noReviews.aggregateRating).toBeUndefined();
  });
});

describe('profileJsonLd', () => {
  test('emits a ProfilePage with a Person main entity', () => {
    const ld = profileJsonLd({ host: { name: 'John Doe', username: 'john-doe', profession: 'Consultant' }, siteUrl: SITE });
    expect(ld['@type']).toBe('ProfilePage');
    expect(ld.mainEntity).toMatchObject({ '@type': 'Person', name: 'John Doe', url: 'https://bookasloth.com/john-doe' });
  });
});
