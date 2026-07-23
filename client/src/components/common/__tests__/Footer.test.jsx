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
    expect(screen.getByRole('link', { name: 'Be a Host' }).getAttribute('href')).toBe('/be-a-sloth');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: 'Help' }).getAttribute('href')).toBe('/help');
    expect(screen.getByRole('link', { name: 'Explore' }).getAttribute('href')).toBe('/explore');
  });

  test('on-page section links are root-relative so they work from any page', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'How it works' }).getAttribute('href')).toBe('/#how-it-works');
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

  test('minimal variant keeps CTA + legal bar but drops link columns and socials', () => {
    render(<MemoryRouter><Footer variant="minimal" /></MemoryRouter>);
    // CTA band survives
    expect(screen.getByText(/Power up your/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: "Let's Get Started" })).toBeTruthy();
    // legal bar survives (Bolt attribution)
    expect(screen.getByRole('link', { name: 'Bolt the Sloth' })).toBeTruthy();
    // link columns + socials are gone
    expect(screen.queryByRole('link', { name: 'Be a Host' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
    expect(screen.queryByLabelText('Instagram')).toBeNull();
  });
});
