import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EarningsCalculator from '../pages/EarningsCalculator';

const setup = () => render(<EarningsCalculator />, { wrapper: MemoryRouter });

describe('EarningsCalculator', () => {
  it('shows the estimated earnings for the winning plan on mount', () => {
    setup();
    expect(screen.getByText(/your estimated earnings/i)).toBeTruthy();
    expect(screen.getByText(/with host\+, you keep/i)).toBeTruthy();
    expect(screen.getAllByText(/per year/i).length).toBeGreaterThan(0);
  });

  it('shows how much more the winner keeps than the free plan', () => {
    setup();
    // default ₹5,000 × 12/mo → Host+ wins by well over the fee
    expect(screen.getByText(/more than the free plan/i)).toBeTruthy();
  });

  it('renders all three real plans with take-home + CTAs (Studio is live)', () => {
    setup();
    expect(screen.getAllByText(/you keep per year/i).length).toBe(3);
    expect(screen.getByRole('link', { name: /get started/i })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /start on host\+/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /start on studio/i })).toBeTruthy(); // live, not "coming soon"
  });

  it('billing toggle switches to monthly', () => {
    setup();
    const monthly = screen.getAllByRole('button', { name: /^monthly$/i })[0];
    fireEvent.click(monthly);
    expect(monthly.getAttribute('aria-pressed')).toBe('true');
  });

  it('recommends the free plan at very low volume', () => {
    setup();
    const price = screen.getByLabelText('Set your price per session');
    const sessions = screen.getByLabelText('Set your sessions per month');
    fireEvent.change(price, { target: { value: '600' } });
    fireEvent.change(sessions, { target: { value: '1' } });
    expect(screen.getByText(/free plan keeps the most/i)).toBeTruthy();
    expect(screen.getByText(/with starter, you keep/i)).toBeTruthy();
  });
});
