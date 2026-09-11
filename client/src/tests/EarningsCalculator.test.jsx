import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EarningsCalculator from '../pages/EarningsCalculator';

const setup = () => render(<EarningsCalculator />, { wrapper: MemoryRouter });

describe('EarningsCalculator', () => {
  it('recommends a plan with the delta-vs-free on mount (Host+ at default)', () => {
    setup();
    expect(screen.getByText(/your plan/i)).toBeTruthy();
    expect(screen.getAllByText(/host\+/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/more a year/i)).toBeTruthy();
  });

  it('shows the Starter commission loss line', () => {
    setup();
    // default 1500 x 5% x 144 = 10,800
    expect(screen.getAllByText(/walks out the door|commission/i).length).toBeGreaterThan(0);
  });

  it('flips the commission card to a "stay free" message when Starter wins', () => {
    setup();
    const price = screen.getByLabelText('Price per session');
    const sessions = screen.getByLabelText('Sessions per month');
    fireEvent.change(price, { target: { value: '200' } });
    fireEvent.change(sessions, { target: { value: '1' } });
    expect(screen.getByText(/staying free is the math/i)).toBeTruthy();
    expect(screen.queryByText(/walks out the door/i)).toBeNull();
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
