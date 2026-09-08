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
  adminSeoReports: vi.fn(() => Promise.resolve({ data: { pages: [] } })),
  adminSeoCategories: vi.fn(() => Promise.resolve({ data: { rollups: [
    { category: 'Static', total: 8, indexable: 8, pass: 6, warning: 1, fail: 1, avg_health: 84, critical_issues: 1, duplicate_title_rate: 0, metadata_uniqueness: 100 },
  ] } })),
  adminSeoChanges: vi.fn(() => Promise.resolve({ data: { latest: 'c1', previous: null, added: 0, resolved: 0, total_latest: 4, total_previous: 0 } })),
  adminSeoFixes: vi.fn(() => Promise.resolve({ data: { fixes: [
    { id: 'f1', approval_level: 'AUTO', rule_key: 'technical.missing_canonical', url: 'https://bookasloth.com/pricing', target: 'meta_builder', evidence_maturity: 'DEVELOPING', old_value: null, new_value: 'https://bookasloth.com/pricing', context: {} },
  ], summary: { total: 1, byLevel: { AUTO: 1 }, byStatus: { proposed: 1 } }, dryRun: true } })),
  adminSeoGenerateFixes: vi.fn(() => Promise.resolve({ data: { crawlId: 'c1', proposed: 1, byLevel: { AUTO: 1 } } })),
  adminSeoDecideFix: vi.fn(() => Promise.resolve({ data: { ok: true, fix: { status: 'approved' } } })),
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

  it('renders category rollups in the Categories tab', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    fireEvent.click(screen.getByText('Categories'));
    await waitFor(() => expect(screen.getByText('Static')).toBeTruthy());
    expect(screen.getByText('84')).toBeTruthy(); // avg_health
  });

  it('renders the fix queue with a dry-run banner in the Fixes tab', async () => {
    render(<MemoryRouter><AdminSeo /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('82')).toBeTruthy());
    fireEvent.click(screen.getByText('Fixes'));
    await waitFor(() => expect(screen.getByText('DRY RUN')).toBeTruthy());
    expect(screen.getByText('technical.missing_canonical')).toBeTruthy();
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
