// client/src/pages/admin/__tests__/AdminSeo.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSeo from '../AdminSeo';
import * as api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  adminSeoOverview: vi.fn(() => Promise.resolve({ data: {
    crawl: { id: 'c1', status: 'done', page_count: 12, issue_count: 4, started_at: new Date().toISOString() },
    scores: { overall: 82, technical: 90, onpage: 75, content: 75, indexability: 88, internal_linking: 100 },
    counts: { P0: 1, P1: 1, P2: 2, P3: 0, P4: 0 },
  } })),
  adminSeoIssues: vi.fn(() => Promise.resolve({ data: { issues: [], total: 0 } })),
  adminSeoPages: vi.fn(() => Promise.resolve({ data: { pages: [], total: 0 } })),
  adminSeoRunCrawl: vi.fn(() => Promise.resolve({ data: { crawlId: 'c2' } })),
  adminSeoCrawlStatus: vi.fn(() => Promise.resolve({ data: { crawl: { status: 'done' } } })),
  adminSeoMuteIssue: vi.fn(() => Promise.resolve({ data: {} })),
  adminSeoScoreHistory: vi.fn(() => Promise.resolve({ data: { snapshots: [] } })),
  adminSeoGsc: vi.fn(() => Promise.resolve({ data: { gsc: [
    { url: 'https://bookasloth.com/x', coverage_state: 'Submitted and indexed', impressions: 42, clicks: 3, position: 5.2 },
  ], configured: true } })),
  adminSeoGscSync: vi.fn(() => Promise.resolve({ data: { configured: true, started: true } })),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('AdminSeo', () => {
  it('renders the overall health score from the latest crawl', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    expect(screen.getByText(/Overall/i)).toBeTruthy();
  });

  it('renders GSC data in the Search Console tab', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    fireEvent.click(screen.getByText('Search Console'));
    await waitFor(() => expect(screen.getByText('42')).toBeTruthy());
    expect(screen.getByText('Submitted and indexed')).toBeTruthy();
  });

  it('triggers a manual GSC sync from the Search Console tab', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    fireEvent.click(screen.getByText('Search Console'));
    await waitFor(() => expect(screen.getByText('42')).toBeTruthy());
    fireEvent.click(screen.getByText('Sync GSC now'));
    await waitFor(() => expect(api.adminSeoGscSync).toHaveBeenCalled());
  });

  it('shows a not-connected toast when GSC sync is triggered while unconfigured', async () => {
    const toast = (await import('react-hot-toast')).default;
    api.adminSeoGscSync.mockResolvedValueOnce({ data: { configured: false, started: false } });
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    fireEvent.click(screen.getByText('Search Console'));
    await waitFor(() => expect(screen.getByText('42')).toBeTruthy());
    fireEvent.click(screen.getByText('Sync GSC now'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not connected')));
  });
});
