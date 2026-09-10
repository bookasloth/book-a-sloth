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

  test('is minimal — no link columns (discovery lives in the navbar now)', () => {
    renderFooter();
    // The old 4-column link grid moved into the navbar mega-menus.
    expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Payments' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Enterprise' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'vs Calendly' })).toBeNull();
    // No newsletter form.
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });

  test('drops redundant links that duplicate the CTA and the navbar', () => {
    renderFooter();
    expect(screen.queryByRole('link', { name: 'Be a Host' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Host log in' })).toBeNull();
  });

  test('legal strip has the legal + support links, operator line and support email', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'FAQ' }).getAttribute('href')).toBe('/#faq');
    expect(screen.getByRole('link', { name: 'Documentation' }).getAttribute('href')).toBe('/help/docs');
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'Refund' }).getAttribute('href')).toBe('/refund');
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
