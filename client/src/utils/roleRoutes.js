// Maps a host-space (/dashboard/*) path that a guest tried to open to the closest
// guest-space (/user/*) equivalent. Only bookings and profile have a true 1:1
// counterpart; everything else (earnings, services, availability, products,
// upgrade, payments, feedback) has no guest analogue → guest home.
export function hostPathToGuestPath(pathname) {
  if (pathname.startsWith('/dashboard/bookings')) return '/user/my-bookings';
  if (pathname.startsWith('/dashboard/profile')) return '/user/profile';
  return '/user/my-bookings';
}

// True for accounts that own the host space (/dashboard/*). superadmin is
// included so platform admins are never bounced into guest space by the guards.
export function isHost(user) {
  return user?.role === 'host' || user?.role === 'superadmin';
}
