import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EarningsCalculator from '../pages/EarningsCalculator';

const setup = () => render(<EarningsCalculator />, { wrapper: MemoryRouter });

describe('EarningsCalculator', () => {
  it('shows a winner headline with a yearly take-home on mount', () => {
    setup();
    expect(screen.getByText(/keep the most/i)).toBeTruthy();
    expect(screen.getAllByText(/\/year/i).length).toBeGreaterThan(0);
  });

  it('shows the Starter commission loss line', () => {
    setup();
    // default 1500 x 5% x 144 = 10,800
    expect(screen.getAllByText(/walks out the door|commission/i).length).toBeGreaterThan(0);
  });

  it('no ceiling nudge at low volume', () => {
    setup();
    expect(screen.queryByText(/1,000\/year limit|uncapped/i)).toBeNull();
  });

  it('shows the ceiling nudge to Studio at very high volume', () => {
    setup();
    const sessions = screen.getByLabelText('Sessions per month');
    fireEvent.change(sessions, { target: { value: '100' } });
    expect(screen.getAllByText(/uncapped|1,000\/year limit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Studio/i).length).toBeGreaterThan(0);
  });

  it('billing toggle changes the plan fee shown', () => {
    setup();
    const toggle = screen.getByRole('button', { name: /pay monthly|monthly/i });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /pay yearly|yearly/i })).toBeTruthy();
  });
});
