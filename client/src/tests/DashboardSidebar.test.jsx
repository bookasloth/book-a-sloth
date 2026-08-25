import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// FeatureGate just renders its children so nav items don't depend on the flag
// map, and useAuth feeds a controlled user.
vi.mock('../components/common/FeatureGate', () => ({
  default: ({ children }) => children,
}));

// The topbar notification bell hits the API on mount/open — stub it out.
vi.mock('../services/api', () => ({
  getNotifications: vi.fn(() => Promise.resolve({ data: { notifications: [], unreadCount: 0 } })),
  markAllNotificationsRead: vi.fn(() => Promise.resolve({ data: {} })),
  markNotificationRead: vi.fn(() => Promise.resolve({ data: {} })),
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

const renderAt = (initialPath, user) => {
  mockAuth.current = user;
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <DashboardLayout><div>PAGE</div></DashboardLayout>
    </MemoryRouter>,
  );
};

const openProfile = () => fireEvent.click(screen.getByLabelText('Profile menu'));

describe('dashboard topbar profile menu', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('shows name + category + plan badge on open and never the email', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'sndatarkar@gmail.com', plan: 'supreme', category: 'career-coaching', is_host: true, role: 'host' });
    openProfile();
    expect(screen.getByText('Shubham Datarkar')).toBeInTheDocument();
    expect(screen.getByText('Career Coaching')).toBeInTheDocument();   // humanized category
    expect(screen.getAllByText(/Supreme/).length).toBeGreaterThan(0);
    expect(screen.queryByText('sndatarkar@gmail.com')).toBeNull();      // email never shown
  });

  it('renders the profile photo in the avatar when one is set', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'x@y.com', plan: 'supreme', profile_image: 'https://cdn.example/x.jpg', role: 'host' });
    expect(screen.getByAltText('Shubham Datarkar').getAttribute('src')).toBe('https://cdn.example/x.jpg');
  });

  it('falls back to the name initial when there is no photo', () => {
    renderLayout({ name: 'Shubham Datarkar', email: 'x@y.com', plan: 'supreme', role: 'host' });
    expect(screen.queryByAltText('Shubham Datarkar')).toBeNull();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('offers the membership CTA + host shortcuts', () => {
    renderLayout({ name: 'Host', plan: 'creator', role: 'host', username: 'hosty' });
    openProfile();
    // Scope to the menu surface — some labels (e.g. Availability) also appear in
    // the sidebar nav.
    const menu = within(screen.getByRole('menu', { name: 'Account' }));
    // Membership CTA carries the humanized plan label (creator -> Host+).
    expect(menu.getByText(/Host\+ Member/)).toBeInTheDocument();
    ['Upcoming Bookings', 'Availability', 'View Public Profile', 'Talk to Account Manager', 'Settings'].forEach((label) => {
      expect(menu.getByText(label)).toBeInTheDocument();
    });
  });

  it('holds View Public Profile + Logout (moved out of the sidebar)', () => {
    renderLayout({ name: 'Host', plan: 'creator', role: 'host', username: 'hosty' });
    // Not present until the menu is opened — they no longer live in the sidebar.
    expect(screen.queryByText('Logout')).toBeNull();
    openProfile();
    expect(screen.getByText('View Public Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});

describe('dashboard topbar actions', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('exposes Sloth Support + Notifications controls', () => {
    renderLayout({ name: 'Host', plan: 'creator', role: 'host' });
    expect(screen.getByLabelText('Sloth Support')).toBeInTheDocument();
    expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
  });
});

describe('mobile — popups + nav drawer', () => {
  const setMobile = (matches) => {
    window.matchMedia = vi.fn().mockImplementation((q) => ({
      matches, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
  };
  beforeEach(() => { mockAuth.current = {}; setMobile(true); });
  afterEach(() => setMobile(false));

  it('profile opens as a sheet with a Close control + account actions', () => {
    renderLayout({ name: 'Host', plan: 'creator', role: 'host', username: 'hosty' });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    expect(screen.getByLabelText('Close')).toBeInTheDocument();     // sheet chrome
    expect(screen.getByText('View Public Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('the nav hamburger opens the drawer and Esc closes it', () => {
    renderLayout({ name: 'Host', plan: 'creator', role: 'host', username: 'hosty' });
    fireEvent.click(screen.getByLabelText('Open navigation'));
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Close navigation')).toBeInTheDocument();
    // Section rail + item panel both live inside the drawer.
    expect(within(drawer).getByLabelText('Sections')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).toBeNull();
  });
});

describe('console sidebar — two-level nav', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('marks the active item with aria-current and selects its parent section', () => {
    renderAt('/dashboard/bookings', { name: 'Host', plan: 'creator', role: 'host' });
    // Community is the active section (rail glyph carries aria-current).
    expect(screen.getByRole('button', { name: 'Community' })).toHaveAttribute('aria-current', 'true');
    // Bookings item is the active page.
    expect(screen.getByRole('link', { name: 'Bookings' })).toHaveAttribute('aria-current', 'page');
  });

  it('deep pages highlight their parent item (longest-prefix match)', () => {
    renderAt('/dashboard/services/42/edit', { name: 'Host', plan: 'supreme', role: 'host' });
    expect(screen.getByRole('button', { name: 'Content' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page');
  });

  it('plan-locked items render disabled with a locked accessible name', () => {
    // Starter host: Products is Supreme-only -> shown but locked.
    renderAt('/dashboard/products', { name: 'Host', plan: 'starter', role: 'host' });
    const products = screen.getByLabelText('Products (locked)');
    expect(products).toHaveAttribute('aria-disabled', 'true');
    expect(products).toHaveAttribute('tabindex', '-1');
  });

  it('shows a rose attention badge with an accessible count when KYC is pending', () => {
    renderAt('/dashboard/kyc', { name: 'Host', plan: 'creator', role: 'host', kyc_status: 'pending' });
    // Verification item's SR name carries the count + noun.
    expect(screen.getByLabelText('Verification, 1 action needed')).toBeInTheDocument();
  });
});

describe('console sidebar — tier-aware bottom slot', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('pitches Studio to Starter hosts', () => {
    renderAt('/dashboard', { name: 'H', plan: 'starter', role: 'host' });
    expect(screen.getByRole('link', { name: 'Upgrade to Studio. Go Studio' }))
      .toHaveAttribute('href', '/dashboard/upgrade');
  });

  it('pitches Studio to Host+ hosts', () => {
    renderAt('/dashboard', { name: 'H', plan: 'creator', role: 'host' });
    expect(screen.getByRole('link', { name: 'Level up to Studio. Go Studio' }))
      .toHaveAttribute('href', '/dashboard/upgrade');
  });

  it('shows Refer & Earn (no upsell) for Studio hosts', () => {
    renderAt('/dashboard', { name: 'H', plan: 'professional', role: 'host' });
    expect(screen.queryByRole('link', { name: /Upgrade to Studio/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Refer & Earn. Invite a host' }))
      .toHaveAttribute('href', '/dashboard/referrals');
  });

  it('shows concierge (no upsell, never advertises Supreme) for Supreme hosts', () => {
    renderAt('/dashboard', { name: 'H', plan: 'supreme', role: 'host' });
    expect(screen.queryByRole('link', { name: /Upgrade|Studio/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Priority concierge. Talk to your manager' }))
      .toHaveAttribute('href', '/bolt958');
  });
});

describe('dashboard sidebar — no premium / manage-plan card', () => {
  beforeEach(() => { mockAuth.current = {}; });

  it('never renders the old premium upsell card', () => {
    renderLayout({ name: 'Free User', plan: 'explorer', role: 'host' });
    expect(screen.queryByText('Upgrade to Host+')).toBeNull();
    expect(screen.queryByText('Upgrade — 20% off')).toBeNull();
  });

  it('shows no plan card for paid tiers either', () => {
    renderLayout({ name: 'Pro User', plan: 'supreme', role: 'host' });
    expect(screen.queryByText('Supreme access')).toBeNull();
    expect(screen.queryByText('Manage plan')).toBeNull();
  });
});
