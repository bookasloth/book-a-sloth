import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';

// DashboardLayout pulls the logged-in host from AuthContext and gates the
// feedback FAB behind a FeatureGate; stub both so we can render the chrome
// in isolation and assert the nav exposes the host's "My Bookings" view.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Doc Strange', email: 'doc@example.com', role: 'host', plan: 'creator' },
    logout: vi.fn(),
  }),
}));
vi.mock('../components/common/FeatureGate', () => ({ default: ({ children }) => children }));

import DashboardLayout from '../components/common/DashboardLayout';

test('host dashboard nav exposes a "My Bookings" link to bookings the host made', () => {
  render(
    <MemoryRouter>
      <DashboardLayout><div /></DashboardLayout>
    </MemoryRouter>
  );

  // Rendered in both the desktop sidebar and the mobile "More" sheet — take any.
  const links = screen.getAllByRole('link', { name: 'My Bookings' });
  expect(links.length).toBeGreaterThan(0);
  expect(links[0].getAttribute('href')).toBe('/dashboard/my-bookings');
});
