import { describe, it, expect } from 'vitest';
import { hostPathToGuestPath } from '../utils/roleRoutes';

describe('hostPathToGuestPath', () => {
  it('maps /dashboard/bookings → /user/my-bookings', () => {
    expect(hostPathToGuestPath('/dashboard/bookings')).toBe('/user/my-bookings');
  });
  it('maps /dashboard/profile → /user/profile', () => {
    expect(hostPathToGuestPath('/dashboard/profile')).toBe('/user/profile');
  });
  it('falls back to /user/my-bookings when there is no guest equivalent', () => {
    expect(hostPathToGuestPath('/dashboard')).toBe('/user/my-bookings');
    expect(hostPathToGuestPath('/dashboard/earnings')).toBe('/user/my-bookings');
    expect(hostPathToGuestPath('/dashboard/payments/payouts')).toBe('/user/my-bookings');
  });
});
