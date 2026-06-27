import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  svcCreate: vi.fn(),
  svcUpdate: vi.fn(),
  uploadImage: vi.fn(),
  hostGetCategories: vi.fn(),
  getCategories: vi.fn(),
  listServiceCategories: vi.fn(),
}));
// FeatureGate → render children so the gated sections (Overview, FAQ, etc.) show.
vi.mock('../components/common/FeatureGate', () => ({ default: ({ children }) => children }));

import { hostGetCategories, getCategories, listServiceCategories } from '../services/api';
import ServiceForm from '../pages/services/ServiceForm';

// Two parents that share child names — flat this looked like duplicate options.
const TAXONOMY = [
  { id: 'p1', name: 'Technology & Engineering', slug: 'tech', parent_id: null },
  { id: 'p2', name: 'Health & Wellness', slug: 'health', parent_id: null },
  { id: 'c1', name: '1:1 Consultation', slug: 'tech-consult', parent_id: 'p1' },
  { id: 'c2', name: 'Mentorship', slug: 'tech-mentor', parent_id: 'p1' },
  { id: 'c3', name: '1:1 Consultation', slug: 'health-consult', parent_id: 'p2' },
  { id: 'c4', name: 'Mentorship', slug: 'health-mentor', parent_id: 'p2' },
];

beforeEach(() => {
  vi.clearAllMocks();
  hostGetCategories.mockResolvedValue({ data: { categories: [], primary_category: null } });
  getCategories.mockResolvedValue({ data: [] });
  listServiceCategories.mockResolvedValue({ data: { categories: TAXONOMY } });
});

test('service category dropdown groups children under their parent (no flat duplicates)', async () => {
  const { container } = render(<MemoryRouter><ServiceForm /></MemoryRouter>);

  await waitFor(() => expect(container.querySelectorAll('optgroup').length).toBeGreaterThan(0));

  const labels = Array.from(container.querySelectorAll('optgroup')).map((g) => g.label);
  expect(labels).toContain('Technology & Engineering');
  expect(labels).toContain('Health & Wellness');

  // The shared child name appears once per parent — now disambiguated by group,
  // not a flat run of identical options.
  expect(screen.getAllByRole('option', { name: '1:1 Consultation' }).length).toBe(2);
});

test('Overview and FAQ sections both render (FAQ moved beside Overview)', async () => {
  render(<MemoryRouter><ServiceForm /></MemoryRouter>);
  await waitFor(() => screen.getByText('Overview'));
  expect(screen.getByText('Overview')).toBeInTheDocument();
  expect(screen.getByText('FAQs')).toBeInTheDocument();

  // Overview precedes FAQs in document order (left column, stacked).
  const overview = screen.getByText('Overview');
  const faqs = screen.getByText('FAQs');
  expect(overview.compareDocumentPosition(faqs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
