import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePresentationHost } from '../usePresentationHost';
import { FALLBACK_HOST } from '../demoData';

vi.mock('../../../services/api', () => ({ getHostProfile: vi.fn() }));
import { getHostProfile } from '../../../services/api';

describe('usePresentationHost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with fallback host synchronously', () => {
    getHostProfile.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => usePresentationHost());
    expect(result.current.host.name).toBe(FALLBACK_HOST.name);
    expect(result.current.source).toBe('fallback');
  });

  it('swaps to live data on success', async () => {
    getHostProfile.mockResolvedValue({ data: { username: 'sndatarkar', name: 'S N Datarkar', profile_image: 'x', cover_image: 'y', services: [{ id: '1', title: 'Consult', slug: 'consult', price: 500, duration: 30, meeting_mode: 'online' }] } });
    const { result } = renderHook(() => usePresentationHost());
    await waitFor(() => expect(result.current.source).toBe('live'));
    expect(result.current.host.name).toBe('S N Datarkar');
    expect(result.current.services).toHaveLength(1);
  });

  it('stays on fallback when the fetch rejects', async () => {
    getHostProfile.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePresentationHost());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.source).toBe('fallback');
    expect(result.current.host.name).toBe(FALLBACK_HOST.name);
  });
});
