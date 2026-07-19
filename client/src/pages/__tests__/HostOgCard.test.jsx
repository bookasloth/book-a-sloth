import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HostOgCard from '../HostOgCard';

const renderCard = (query) =>
  render(
    <MemoryRouter initialEntries={[`/og/host/priya?${query}`]}>
      <Routes>
        <Route path="/og/host/:username" element={<HostOgCard />} />
      </Routes>
    </MemoryRouter>,
  );

describe('HostOgCard (share-card render target)', () => {
  it('renders name, profession, username and real stats', () => {
    renderCard('name=Priya+Sharma&profession=Clinical+Psychologist&username=priya&rating=4.9&reviews=247&bookings=820&since=2025&verified=1&online=1');
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('Clinical Psychologist')).toBeTruthy();
    expect(screen.getByText('bookasloth.com/priya')).toBeTruthy();
    expect(screen.getByText('4.9')).toBeTruthy();
    expect(screen.getByText('247 Reviews')).toBeTruthy();
    expect(screen.getByText('820+')).toBeTruthy();        // compact() rounds 820 -> "820+"
    expect(screen.getByText('VERIFIED HOST')).toBeTruthy();
  });

  it('shows an honest empty state for a brand-new host (no reviews/bookings)', () => {
    renderCard('name=New+Host&username=newbie&rating=0&reviews=0&bookings=0&since=2026');
    expect(screen.getByText('New')).toBeTruthy();          // rating slot, not "0.0"
    expect(screen.getByText('Just launched')).toBeTruthy();
    expect(screen.queryByText('VERIFIED HOST')).toBeNull(); // verified flag absent
  });

  it('is noindex — it is an art board, never a page', () => {
    renderCard('name=Priya&username=priya');
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex');
  });
});
