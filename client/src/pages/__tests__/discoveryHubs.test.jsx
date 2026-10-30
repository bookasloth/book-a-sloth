import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Compare from '../Compare';

afterEach(cleanup);

const renderAt = (Comp) => render(<MemoryRouter><Comp /></MemoryRouter>);

// The /compare hub de-orphans every /compare/* landing page: each must be reachable
// from a crawlable static link. (/solutions was scrapped; profession discovery now
// lives on /appointment-booking-software.)
describe('<Compare> hub', () => {
  test('links every competitor comparison page (/compare/*)', () => {
    const { container } = renderAt(Compare);
    ['/compare/calendly-alternative', '/compare/acuity-alternative', '/compare/setmore-alternative',
      '/compare/simplybook-alternative', '/compare/zoho-bookings-alternative', '/compare/topmate-alternative']
      .forEach((href) => expect(container.querySelector(`a[href="${href}"]`), `missing ${href}`).toBeTruthy());
  });

  test('has an h1 and cross-links to the profession hub', () => {
    const { container } = renderAt(Compare);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(container.querySelector('a[href="/appointment-booking-software"]')).toBeTruthy();
  });
});
