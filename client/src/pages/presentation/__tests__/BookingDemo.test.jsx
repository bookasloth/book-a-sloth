import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import BookingDemo from '../BookingDemo';
import { FALLBACK_HOST } from '../demoData';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const apiSpy = vi.hoisted(() => vi.fn());
vi.mock('../../../services/api', () => new Proxy({}, { get: () => apiSpy }));

describe('BookingDemo (pure simulation)', () => {
  it('advances service → date → time → confirmed and calls no API', () => {
    render(<BookingDemo host={FALLBACK_HOST} />);
    // pick first service
    fireEvent.click(screen.getByRole('button', { name: /Discovery Call/i }));
    // pick a selectable day (first enabled day cell)
    const day = screen.getAllByRole('button', { name: /^day-/ }).find((b) => !b.disabled);
    fireEvent.click(day);
    // pick first time slot
    const slot = screen.getAllByRole('button', { name: /slot-/ })[0];
    fireEvent.click(slot);
    // confirm
    fireEvent.click(screen.getByRole('button', { name: /Confirm booking/i }));
    expect(screen.getByText(/You're booked/i)).toBeTruthy();
    expect(apiSpy).not.toHaveBeenCalled();
  });
});
