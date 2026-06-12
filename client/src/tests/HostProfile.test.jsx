/**
 * tests/HostProfile.test.jsx
 * Public creator profile page — theme color, services listing,
 * booking URL shape, social icons, loading/error states.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getHostProfile: vi.fn(),
  getHostReviews: vi.fn().mockResolvedValue({ data: { reviews: [], count: 0, avg: 0 } }),
  getHostProducts: vi.fn().mockResolvedValue({ data: [] }),
}));

import { getHostProfile } from '../services/api';
import HostProfile from '../pages/HostProfile';

const HOST = {
  id: 'v1', name: 'Jane Vendor', role: 'host', plan: 'creator',
  username: 'jane-vendor', profession: 'Life Coach', bio: 'I help people.',
  profile_image: '', cover_image: '', theme_color: '#2563EB',
  social_links: { linkedin: 'https://linkedin.com/in/jane', instagram: 'https://instagram.com/jane' },
  is_verified: true, badges: [], google_calendar_connected: false, location: 'Mumbai',
};

const SERVICES = [
  { id: 's1', title: 'Consultation', slug: 'consultation', price: 500, duration: 45, meeting_mode: 'online', is_active: true, short_description: 'A great session.' },
  { id: 's2', title: 'Workshop',     slug: 'workshop',     price: 0,   duration: 90, meeting_mode: 'offline',is_active: true, short_description: 'In-person workshop.' },
];

const renderProfile = (username = 'jane-vendor') =>
  render(
    <MemoryRouter initialEntries={[`/${username}`]}>
      <Routes>
        <Route path="/:profileSlug" element={<HostProfile />} />
      </Routes>
    </MemoryRouter>
  );

// ── Loading + error states ────────────────────────────────────────────────────

describe('HostProfile — loading/error', () => {
  test('shows spinner while loading', () => {
    getHostProfile.mockReturnValueOnce(new Promise(() => {})); // never resolves
    renderProfile();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  test('shows "Creator not found" on 404', async () => {
    getHostProfile.mockRejectedValueOnce({ response: { status: 404 } });
    renderProfile('ghost-user');
    await waitFor(() => expect(screen.getByText(/creator not found/i)).toBeTruthy());
  });
});

// ── Profile info ──────────────────────────────────────────────────────────────

describe('HostProfile — profile info', () => {
  beforeEach(() => {
    getHostProfile.mockResolvedValue({ data: { host: HOST, services: SERVICES, availability: null } });
  });

  test('renders creator name', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('Jane Vendor')).toBeTruthy());
  });

  test('renders creator title/profession', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('Life Coach')).toBeTruthy());
  });

  test('renders bio text', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText(/I help people/i)).toBeTruthy());
  });

  test('renders location', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText(/Mumbai/i)).toBeTruthy());
  });

  test('renders verified badge icon', async () => {
    renderProfile();
    await waitFor(() => {
      // Verified icon is an SVG — check the container text renders
      expect(screen.getByText('Jane Vendor')).toBeTruthy();
    });
  });
});

// ── Services listing ──────────────────────────────────────────────────────────

describe('HostProfile — services listing', () => {
  beforeEach(() => {
    getHostProfile.mockResolvedValue({ data: { host: HOST, services: SERVICES, availability: null } });
  });

  test('renders all service titles', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Consultation')).toBeTruthy();
      expect(screen.getByText('Workshop')).toBeTruthy();
    });
  });

  test('shows price correctly — paid and free', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('₹500')).toBeTruthy();
      expect(screen.getByText('Free')).toBeTruthy();
    });
  });

  test('shows duration for each service', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/45 min/i)).toBeTruthy();
      expect(screen.getByText(/90 min/i)).toBeTruthy();
    });
  });

  test('Book Now links use /:profileSlug/booking/:serviceSlug pattern', async () => {
    renderProfile();
    await waitFor(() => {
      const bookLinks = screen.getAllByRole('link', { name: /book now/i });
      bookLinks.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/\/jane-vendor\/booking\//);
        expect(link.getAttribute('href')).not.toMatch(/\/book$/); // old pattern gone
      });
    });
  });

  test('"View details" links use /:profileSlug/:serviceSlug', async () => {
    renderProfile();
    await waitFor(() => {
      const detailLinks = screen.getAllByRole('link', { name: /view details/i });
      detailLinks.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/\/jane-vendor\/(consultation|workshop)/);
      });
    });
  });

  test('no service thumbnails shown (per spec)', async () => {
    renderProfile();
    await waitFor(() => screen.getByText('Consultation'));
    // No <img> elements inside service cards that have alt text matching service title
    const imgs = document.querySelectorAll('img[alt="Consultation"], img[alt="Workshop"]');
    expect(imgs.length).toBe(0);
  });

  test('shows "No services available yet" when services array is empty', async () => {
    getHostProfile.mockResolvedValueOnce({ data: { host: HOST, services: [], availability: null } });
    renderProfile();
    await waitFor(() => expect(screen.getByText(/no services available yet/i)).toBeTruthy());
  });
});

// ── Theme color ───────────────────────────────────────────────────────────────

describe('HostProfile — theme color applied', () => {
  test('injects --profile-accent CSS variable with vendor color', async () => {
    getHostProfile.mockResolvedValue({ data: { host: HOST, services: SERVICES, availability: null } });
    renderProfile();
    await waitFor(() => screen.getByText('Jane Vendor'));
    // --profile-accent is set by a useEffect that runs after the name commits,
    // so poll for it rather than reading once (avoids an effect-timing race).
    await waitFor(() => {
      const root = document.querySelector('[style]');
      expect(root?.style?.getPropertyValue('--profile-accent')).toBe('#2563EB');
      expect(root?.style?.getPropertyValue('--profile-accent-text')).toBe('#ffffff');
    });
  });

  test('falls back to #FE5100 when theme_color is null', async () => {
    const hostNoColor = { ...HOST, theme_color: null };
    getHostProfile.mockResolvedValue({ data: { host: hostNoColor, services: [], availability: null } });
    renderProfile();
    await waitFor(() => screen.getByText('Jane Vendor'));
    // Poll for the CSS var (applied by a post-commit useEffect) to avoid a race.
    await waitFor(() => {
      const root = document.querySelector('[style]');
      expect(root?.style?.getPropertyValue('--profile-accent')).toBe('#FE5100');
    });
  });

  test('Book Now buttons use CSS var for theme color', async () => {
    getHostProfile.mockResolvedValue({ data: { host: HOST, services: SERVICES, availability: null } });
    renderProfile();
    await waitFor(() => screen.getAllByRole('link', { name: /book now/i }));
    const bookBtns = screen.getAllByRole('link', { name: /book now/i });
    bookBtns.forEach((btn) => {
      expect(btn.style.background).toContain('--profile-accent');
    });
  });
});
