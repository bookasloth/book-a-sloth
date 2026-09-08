// client/src/pages/admin/__tests__/AdminSeo.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSeo from '../AdminSeo';

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
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('AdminSeo', () => {
  it('renders the overall health score from the latest crawl', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    expect(screen.getByText(/Overall/i)).toBeTruthy();
  });
});
