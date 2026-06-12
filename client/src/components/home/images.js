/**
 * Centralized image placeholders for the homepage.
 * ───────────────────────────────────────────────────────────
 * All images are royalty-free Unsplash photos served via the
 * Unsplash CDN with on-the-fly crop + format params.
 *
 * TO REPLACE: swap the photo ID (the `photo-xxxxx` slug) below,
 * or point `u()` at your own CDN. Everything else stays.
 *
 * u(id, w, h) → cropped, auto-format, q80 URL.
 */
export const u = (id, w = 800, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// Hero — calm professional at desk
export const HERO = u("1573497019940-1c28c88b4f3e", 1100, 1320); // woman professional

// "Who it's for" — Indian-looking professionals across roles
export const PERSONAS = {
  freelancer: u("1600880292203-757bb62b4baf", 900, 1100), // laptop creative
  tutor: u("1577896851231-70ef18881754", 900, 1100), // teaching
  coach: u("1559839734-2b71ea197ec2", 900, 1100), // coaching
  therapist: u("1594824476967-48c8b964273f", 900, 1100), // calm therapist
  consultant: u("1556157382-97eda2d62296", 900, 1100), // consultant
  studio: u("1522071820081-009f0129c71c", 900, 1100), // agency team
};

// Testimonial avatars (small, square)
export const FACES = [
  u("1494790108377-be9c29b29330", 200, 200),
  u("1507003211169-0a1dd7228f2d", 200, 200),
  u("1438761681033-6461ffad8d80", 200, 200),
  u("1500648767791-00dcc994a43e", 200, 200),
  u("1534528741775-53994a69daeb", 200, 200),
  u("1517841905240-472988babdf9", 200, 200),
  u("1544005313-94ddf0286df2", 200, 200),
  u("1463453091185-61582044d556", 200, 200),
  u("1531123897727-8f129e1688ce", 200, 200),
  u("1489424731084-a5d8b219a5bb", 200, 200),
  u("1492562080023-ab3db95bfbce", 200, 200),
  u("1573496359142-b8d87734a5a2", 200, 200),
];

// Final CTA — wide calm lifestyle
export const FINAL = u("1499209974431-9dddcece7f88", 1600, 900);

// Newsletter illustration / calm scene
export const NEWSLETTER = u("1506126613408-eca07ce68773", 800, 600);
