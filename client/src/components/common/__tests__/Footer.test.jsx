import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

afterEach(cleanup);

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('<Footer>', () => {
  test('CTA primary points at the start route', () => {
    renderFooter();
    expect(screen.getByText(/Power up your/i)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: "Let's Get Started" }).getAttribute('href'),
    ).toBe('/be-a-sloth');
  });

  test('renders representative links from each column', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Enterprise' }).getAttribute('href')).toBe('/enterprise');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: 'Help' }).getAttribute('href')).toBe('/help');
    expect(screen.getByRole('link', { name: 'Explore' }).getAttribute('href')).toBe('/explore');
  });

  test('links the previously-orphaned marketing pages (features / for / compare / wall of love)', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Payments' }).getAttribute('href')).toBe('/features/payments');
    expect(screen.getByRole('link', { name: 'Analytics' }).getAttribute('href')).toBe('/features/analytics');
    expect(screen.getByRole('link', { name: 'Agencies' }).getAttribute('href')).toBe('/for/agencies');
    expect(screen.getByRole('link', { name: 'Freelancers' }).getAttribute('href')).toBe('/for/freelancers');
    expect(screen.getByRole('link', { name: 'vs Calendly' }).getAttribute('href')).toBe('/lp/calendly-alternative');
    expect(screen.getByRole('link', { name: 'vs Zoho Bookings' }).getAttribute('href')).toBe('/lp/zoho-bookings-alternative');
    expect(screen.getByRole('link', { name: 'Wall of Love' }).getAttribute('href')).toBe('/wall-of-love');
  });

  test('drops redundant links that duplicate the CTA and the navbar', () => {
    renderFooter();
    expect(screen.queryByRole('link', { name: 'Be a Host' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Host log in' })).toBeNull();
  });

  test('renders the Company & Product column and support/legal rows', () => {
    renderFooter();
    // Brand column doubles as Company & Product
    expect(screen.getByRole('link', { name: 'How it works' }).getAttribute('href')).toBe('/how-it-works');
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/blog');
    // Support row
    expect(screen.getByRole('link', { name: 'Documentation' }).getAttribute('href')).toBe('/help/docs');
    // Newsletter form was removed in the mega-footer redesign
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });

  test('on-page section links are root-relative so they work from any page', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'How it works' }).getAttribute('href')).toBe('/how-it-works');
    expect(screen.getByRole('link', { name: 'Pricing' }).getAttribute('href')).toBe('/pricing');
    expect(screen.getByRole('link', { name: 'FAQ' }).getAttribute('href')).toBe('/#faq');
  });

  test('legal bar has Terms, Privacy, Refund and the support email', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'Refund' }).getAttribute('href')).toBe('/refund');
    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/contact');
    // Company ownership line — required by the Google OAuth verification checklist.
    expect(screen.getByText(/Operated by Timewheel Internet Private Limited/i)).toBeTruthy();
    const mail = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === 'mailto:bolt@bookasloth.in');
    expect(mail).toBeTruthy();
  });

  test('social links are safe external links with aria-labels', () => {
    renderFooter();
    ['Instagram', 'X', 'LinkedIn', 'Facebook', 'WhatsApp'].forEach((name) => {
      const link = screen.getByLabelText(name);
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });
  });

  test('minimal variant keeps CTA + legal bar but drops columns, socials, newsletter', () => {
    render(<MemoryRouter><Footer variant="minimal" /></MemoryRouter>);
    // CTA band survives
    expect(screen.getByText(/Power up your/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: "Let's Get Started" })).toBeTruthy();
    // legal bar survives (Bolt attribution + a legal link)
    expect(screen.getByRole('link', { name: 'Bolt the Sloth' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
    // link columns + socials + newsletter are gone
    expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
    expect(screen.queryByLabelText('Instagram')).toBeNull();
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });
});
