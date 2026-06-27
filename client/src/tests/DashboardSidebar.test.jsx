import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Isolate the sidebar identity block. FeatureGate just renders its children so
// nav items don't depend on the flag map, and useAuth feeds a controlled user.
vi.mock('../components/common/FeatureGate', () => ({
  default: ({ children }) => children,
}));

const mockAuth = { current: {} };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockAuth.current, logout: () => {} }),
}));

import DashboardLayout from '../components/common/DashboardLayout';

const renderLayout = (user) => {
  mockAuth.current = user;
  return render(
    <MemoryRouter>
      <DashboardLayout><div>PAGE</div></DashboardLayout>
    </MemoryRouter>,
  );
};

describe('dashboard sidebar identity block', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('shows name + plan badge and never the email', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'sndatarkar@gmail.com', plan: 'supreme', is_host: true, role: 'host' });
    expect(screen.getByText('Shubham Datarkar')).toBeInTheDocument();
    expect(screen.getByText(/Supreme/)).toBeInTheDocument();        // supreme plan label resolves
    expect(screen.queryByText('sndatarkar@gmail.com')).toBeNull();  // email dropped
  });

  it('renders the profile photo when one is set', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'x@y.com', plan: 'supreme', profile_image: 'https://cdn.example/x.jpg', role: 'host' });
    expect(screen.getByAltText('Shubham Datarkar').getAttribute('src')).toBe('https://cdn.example/x.jpg');
  });

  it('falls back to the name initial when there is no photo', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'x@y.com', plan: 'supreme', role: 'host' });
    expect(screen.queryByAltText('Shubham Datarkar')).toBeNull();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('shows the Upgrade hint + Starter badge for the free tier', () => {
    renderLayout({ name: 'Free User', email: 'f@y.com', plan: 'explorer', role: 'host' });
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    expect(screen.getByText(/Starter/)).toBeInTheDocument();
  });
});
