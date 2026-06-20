import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getCategories: vi.fn(),
  suggestCategory: vi.fn(),
  updateOnboardingStep: vi.fn(() => Promise.resolve({ data: {} })),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ slug: 'jane' }) };
});

import { getCategories, updateOnboardingStep } from '../services/api';
import CategoryStep from '../pages/onboarding/CategoryStep';

const CATS = [
  { slug: 'life-coach', label: 'Life Coach', group_label: 'Coaching & Consulting' },
  { slug: 'ai-engineer', label: 'AI Engineer', group_label: 'Technology & Product' },
];

beforeEach(() => {
  getCategories.mockResolvedValue({ data: CATS });
  updateOnboardingStep.mockResolvedValue({ data: {} });
});

test('shows the Primary Category heading', async () => {
  render(<MemoryRouter><CategoryStep /></MemoryRouter>);
  expect(await screen.findByText(/Pick Your Primary Service Category/i)).toBeTruthy();
});

test('is single-select and saves primary_category + single-item array', async () => {
  render(<MemoryRouter><CategoryStep /></MemoryRouter>);
  fireEvent.click(await screen.findByText('Life Coach'));
  fireEvent.click(screen.getByText('AI Engineer')); // selecting another replaces
  fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }));
  await waitFor(() => expect(updateOnboardingStep).toHaveBeenCalled());
  const payload = updateOnboardingStep.mock.calls[0][0];
  expect(payload.step).toBe(4);
  expect(payload.data.primary_category).toBe('ai-engineer');
  expect(payload.data.categories).toEqual(['ai-engineer']);
});
