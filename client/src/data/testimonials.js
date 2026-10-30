/**
 * Real-host testimonials — single source of truth for the homepage carousel
 * AND landing-page social proof. Quotes reflect each profession's use of
 * Book A Sloth. Avatars are self-hosted in client/public/images/testimonials
 * (112px webp; were 256px JPGs on the .in CDN — PageSpeed image-delivery);
 * the TAvatar component falls back to initials if an image is missing.
 *
 * COMPLIANCE — endorsement/testimonial rules (FTC 16 CFR Part 255, ASCI code):
 * every entry here is published as a REAL named person's endorsement. Each one
 * must be a genuine quote from that host, kept only with their documented
 * consent to be used publicly. Do NOT add invented, composite, or
 * "placeholder" people to this list — fabricated endorsements are unlawful.
 * Before adding/keeping an entry, confirm the quote is real and consent is on
 * file; remove anyone who withdraws consent.
 */
export const TESTIMONIALS = [
  { quote: "Stuck the link in my Insta bio. Looks way better than sending a GPay QR after the call.", name: "Happy Singh", role: "Creative Lead", avatar: "/images/testimonials/happy-singh.webp" },
];
