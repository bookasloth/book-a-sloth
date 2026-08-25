/**
 * emailTemplates.js — seed definitions for every Communication Engine template.
 *
 * html_content is the BODY ONLY. Header (constant logo + accent category pill)
 * and footer (company info, links, address) are added by emailLayout.js. No
 * template carries its own layout chrome.
 *
 * Bodies compose accent-aware hero blocks from emailComponents (otpBox, heroDate,
 * statusTags, infoCard, countdown, banner, celebration, amountRow), keyed by the
 * category theme from emailThemes — so each email reads distinct without bespoke
 * markup. The CTA stays brand orange (added by the layout); per-category accent
 * colors the eyebrow + hero only.
 *
 * Placeholders use {{snake_case}} and are resolved at send time.
 * See placeholderResolver.js for globals always available.
 *
 * email_category: short label rendered in the header pill (right side) + the key
 *                 the theme/glyph is resolved from.
 * email_reason:   legal copy rendered at the bottom of the footer.
 */

const { themeForCategory } = require('../services/email/emailThemes');
const C = require('../services/email/emailComponents');

// Prose helpers — keep seed readable and markup consistent.
// eyebrow takes the per-category accent color (not {{brand_color}}, which the CTA owns).
const lead    = (t) => `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;
const eyebrow = (color, t) => `<p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${color};font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;
const h       = (t) => `<h1 style="margin:0 0 18px;font-size:24px;font-weight:800;line-height:1.25;color:#111827;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</h1>`;
const note    = (t) => `<p style="margin:18px 0 0;font-size:13px;color:#9ca3af;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;

const TEMPLATES = [

  // ── Authentication ──────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Security Check'); return {
    event_key: 'BOOKING_OTP', audience: 'all', category: 'Authentication',
    name: 'OTP Verification', subject: 'Your verification code is {{otp}}',
    preview_text: 'Use {{otp}} to verify — expires in 10 minutes.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a sign-in verification was requested for your account.',
    html_content:
      eyebrow(t.text, 'Verification') + h('Your verification code') +
      lead('Enter this code to verify your identity. It expires in <strong>10 minutes</strong>.') +
      C.otpBox(t, '{{otp}}') +
      note("If you didn't request this, you can safely ignore this email."),
    cta_label: '', cta_url: '',
  }; })(),

  (() => { const t = themeForCategory('Security Check'); return {
    event_key: 'AUTH_EMAIL_VERIFICATION', audience: 'all', category: 'Authentication',
    name: 'Email Verification', subject: 'Verify your email address',
    preview_text: 'Confirm your email to finish setting up your account.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a verification request was made for your account.',
    html_content:
      eyebrow(t.text, 'Welcome') + h('Confirm your email, {{first_name}}') +
      lead('Tap the button below to verify your email address and activate your Book A Sloth account.') +
      note('This link expires in 24 hours.'),
    cta_label: 'Verify email', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Security Check'); return {
    event_key: 'PASSWORD_RESET', audience: 'all', category: 'Authentication',
    name: 'Password Reset', subject: 'Your Book A Sloth password reset code',
    preview_text: 'Use {{otp}} to reset your password — expires in 10 minutes.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a password reset was requested for your account.',
    html_content:
      eyebrow(t.text, 'Password reset') + h('Reset your password') +
      lead('Use this code to reset your password. It expires in <strong>10 minutes</strong>.') +
      C.otpBox(t, '{{otp}}') +
      note("If you didn't request this, your password stays unchanged — no action needed."),
    cta_label: '', cta_url: '',
  }; })(),

  // ── Security ────────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Security Alert'); return {
    event_key: 'SECURITY_PASSWORD_CHANGED', audience: 'all', category: 'Security',
    name: 'Password Changed', subject: 'Your password was changed',
    preview_text: 'Your Book A Sloth password was just updated.',
    email_category: 'Security Alert',
    email_reason: 'You are receiving this email because your account password was recently changed.',
    html_content:
      eyebrow(t.text, 'Security') + h('Your password was changed') +
      lead('This is a confirmation that the password for your account was just changed.') +
      C.banner(t, { title: 'Password updated', sub: '{{email}}' }) +
      note("If this wasn't you, reset your password immediately and contact {{support_email}}."),
    cta_label: 'Secure my account', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Security Alert'); return {
    event_key: 'SECURITY_LOGIN_ALERT', audience: 'all', category: 'Security',
    name: 'Login Alert', subject: 'New sign-in to your account',
    preview_text: 'A new sign-in was detected on your account.',
    email_category: 'Security Alert',
    email_reason: 'You are receiving this email because a new sign-in was detected on your account.',
    html_content:
      eyebrow(t.text, 'Security') + h('New sign-in detected') +
      lead('We noticed a new sign-in to your Book A Sloth account.') +
      C.infoCard(t, [['Time', '{{login_time}}'], ['IP address', '{{ip_address}}'], ['Device', '{{device_name}}']]) +
      note("If this was you, no action is needed. Otherwise reset your password and contact {{support_email}}."),
    cta_label: '', cta_url: '',
  }; })(),

  // ── Booking — Confirmed ─────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Booking Confirmed'); return {
    event_key: 'BOOKING_CONFIRMED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Confirmed — Customer', subject: 'Your booking with {{vendor_name}} is confirmed',
    preview_text: 'Your appointment with {{vendor_name}} is confirmed.',
    email_category: 'Booking Confirmed',
    email_reason: 'You are receiving this email because you made a booking on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Booking confirmed') + h("You're all set, {{first_name}}") +
      lead('Your appointment is confirmed. Here are the details:') +
      C.heroDate(t, { day: '{{booking_day}}', mon: '{{booking_month}}', year: '{{booking_year}}', title: '{{service_name}}', time: '{{booking_time}}', sub: 'with {{vendor_name}}' }) +
      C.statusTags([{ label: 'Confirmed', tone: 'confirmed' }]) +
      lead('Your GST tax invoice is ready — <a href="{{invoice_url}}" style="color:#FE5100;font-weight:600;text-decoration:none">view or download the PDF</a>. It is also under My Bookings in your dashboard.'),
    // CTA → the public manage/cancel page (works without a login, unlike the
    // dashboard) so anonymous OTP guests can self-serve (#516).
    cta_label: 'View or manage booking', cta_url: '{{manage_url}}',
  }; })(),

  (() => { const t = themeForCategory('New Booking'); return {
    event_key: 'BOOKING_CONFIRMED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Confirmed — Vendor', subject: 'New booking: {{service_name}}',
    preview_text: 'You have a new booking from {{user_name}}.',
    email_category: 'New Booking',
    email_reason: 'You are receiving this email because you received a new booking on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'New booking') + h('A new client booked you') +
      lead("You've received a new booking. Please review your schedule.") +
      C.infoCard(t, [['Service', '{{service_name}}'], ['Client', '{{user_name}}'], ['When', '{{booking_date}} at {{booking_time}}']]) +
      C.statusTags([{ label: 'Confirmed', tone: 'confirmed' }]),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Booking — Reminder ──────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Reminder'); return {
    event_key: 'BOOKING_REMINDER_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Reminder — Customer', subject: 'Reminder: {{service_name}} is coming up',
    preview_text: 'Your session with {{vendor_name}} is almost here.',
    email_category: 'Reminder',
    email_reason: 'You are receiving this email as a reminder about your upcoming appointment.',
    html_content:
      eyebrow(t.text, 'Upcoming appointment') + h('See you soon, {{first_name}}') +
      C.countdown(t, { lead: 'Your appointment is coming up at', big: '{{booking_time}}' }) +
      C.infoCard(t, [['Service', '{{service_name}}'], ['Host', '{{vendor_name}}'], ['When', '{{booking_date}}']]),
    cta_label: '{{action_label}}', cta_url: '{{action_link}}',
  }; })(),

  (() => { const t = themeForCategory('Reminder'); return {
    event_key: 'BOOKING_REMINDER_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Reminder — Vendor', subject: 'Reminder: session with {{user_name}}',
    preview_text: 'You have a session coming up with {{user_name}}.',
    email_category: 'Reminder',
    email_reason: 'You are receiving this email as a reminder about an upcoming session.',
    html_content:
      eyebrow(t.text, 'Upcoming session') + h('You have a session soon') +
      C.countdown(t, { lead: 'Your session is coming up at', big: '{{booking_time}}' }) +
      C.infoCard(t, [['Client', '{{user_name}}'], ['Service', '{{service_name}}'], ['When', '{{booking_date}}']]),
    cta_label: '{{action_label}}', cta_url: '{{action_link}}',
  }; })(),

  // ── Booking — Cancelled ─────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Booking Cancelled'); return {
    event_key: 'BOOKING_CANCELLED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Cancelled — Customer', subject: 'Your booking was cancelled',
    preview_text: 'Your booking with {{vendor_name}} was cancelled.',
    email_category: 'Booking Cancelled',
    email_reason: 'You are receiving this email because a booking on your account was cancelled.',
    html_content:
      eyebrow(t.text, 'Booking cancelled') + h('Your booking was cancelled') +
      lead('The following booking has been cancelled:') +
      C.banner(t, { title: '{{service_name}}', sub: '{{booking_date}} at {{booking_time}} · with {{vendor_name}}' }) +
      note('Questions? Reach us at {{support_email}}.'),
    cta_label: 'Book again', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Booking Cancelled'); return {
    event_key: 'BOOKING_CANCELLED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Cancelled — Vendor', subject: 'A booking was cancelled',
    preview_text: 'A booking with {{user_name}} was cancelled.',
    email_category: 'Booking Cancelled',
    email_reason: 'You are receiving this email because a booking was cancelled.',
    html_content:
      eyebrow(t.text, 'Booking cancelled') + h('A booking was cancelled') +
      lead('This booking has been cancelled:') +
      C.banner(t, { title: '{{service_name}}', sub: '{{booking_date}} at {{booking_time}} · {{user_name}}' }),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Booking — Completed ─────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Session Complete'); return {
    event_key: 'BOOKING_COMPLETED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Completed — Customer', subject: 'Thanks for booking with {{vendor_name}}',
    preview_text: 'How was your session with {{vendor_name}}?',
    email_category: 'Session Complete',
    email_reason: 'You are receiving this email because your session was marked as complete.',
    html_content:
      eyebrow(t.text, 'Session complete') + h('Thanks, {{first_name}}!') +
      lead('We hope your session with {{vendor_name}} went well.') +
      C.infoCard(t, [['Service', '{{service_name}}'], ['When', '{{booking_date}} at {{booking_time}}']]) +
      lead("We'd love your feedback — share a quick review of your session with {{vendor_name}}."),
    cta_label: 'Leave a review', cta_url: '{{review_url}}',
  }; })(),

  (() => { const t = themeForCategory('Session Complete'); return {
    event_key: 'BOOKING_COMPLETED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Completed — Vendor', subject: 'Session with {{user_name}} marked complete',
    preview_text: 'Your session with {{user_name}} is complete.',
    email_category: 'Session Complete',
    email_reason: 'You are receiving this email because a session was marked complete on your account.',
    html_content:
      eyebrow(t.text, 'Session complete') + h('Session completed') +
      lead('Your session has been marked complete:') +
      C.infoCard(t, [['Client', '{{user_name}}'], ['Service', '{{service_name}}'], ['When', '{{booking_date}} at {{booking_time}}']]),
    cta_label: 'View earnings', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Session Complete'); return {
    event_key: 'REBOOK_NUDGE_CUSTOMER', audience: 'all', category: 'Marketing',
    name: 'Rebook Nudge — Customer', subject: 'Ready for another session with {{vendor_name}}?',
    preview_text: 'Book {{vendor_name}} again in a tap.',
    email_category: 'Session Complete',
    email_reason: 'You are receiving this because you recently booked a session on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Come back soon') + h('Hi {{first_name}},') +
      lead('Hope your session with {{vendor_name}} went well. Ready for another?') +
      C.infoCard(t, [['Last service', '{{service_name}}']]) +
      lead('Booking your next session takes just a tap.'),
    cta_label: 'Book again', cta_url: '{{profile_url}}',
  }; })(),

  // ── Booking — Rescheduled ───────────────────────────────────────────────────

  (() => { const t = themeForCategory('Rescheduled'); return {
    event_key: 'BOOKING_RESCHEDULED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Rescheduled — Customer', subject: 'Please confirm your rescheduled booking',
    preview_text: 'Your appointment time changed — please confirm.',
    email_category: 'Rescheduled',
    email_reason: 'You are receiving this email because your booking was rescheduled.',
    html_content:
      eyebrow(t.text, 'Rescheduled') + h('Please confirm the new time') +
      lead('Your appointment with {{vendor_name}} has been rescheduled:') +
      C.infoCard(t, [['Service', '{{service_name}}'], ['New time', '{{booking_date}} at {{booking_time}}']]) +
      lead('Please confirm the new time works for you.'),
    cta_label: 'Confirm new time', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Rescheduled'); return {
    event_key: 'BOOKING_RESCHEDULED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Rescheduled — Vendor', subject: 'A booking was rescheduled',
    preview_text: 'A booking with {{user_name}} was rescheduled.',
    email_category: 'Rescheduled',
    email_reason: 'You are receiving this email because a booking was rescheduled.',
    html_content:
      eyebrow(t.text, 'Rescheduled') + h('A booking was rescheduled') +
      lead('This booking has a new time:') +
      C.infoCard(t, [['Client', '{{user_name}}'], ['Service', '{{service_name}}'], ['New time', '{{booking_date}} at {{booking_time}}']]),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Profile ─────────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'PROFILE_COMPLETION_REMINDER', audience: 'all', category: 'Profile',
    name: 'Profile Completion Reminder', subject: 'Your profile is {{completion_percentage}}% complete',
    preview_text: 'Finish your profile to start getting booked.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your Book A Sloth profile is incomplete.',
    html_content:
      eyebrow(t.text, 'Almost there') + h('Complete your profile, {{first_name}}') +
      lead('Finish your profile to start getting discovered and booked.') +
      C.banner(t, { title: '{{completion_percentage}}% complete', sub: 'A few steps left to go live.' }),
    cta_label: 'Complete profile', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'PROFILE_VERIFIED', audience: 'all', category: 'Profile',
    name: 'Verification Approved', subject: "You're verified on Book A Sloth",
    preview_text: 'Your verification was approved.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your account verification status was updated.',
    html_content:
      eyebrow(t.text, 'Verified') + h("You're verified, {{first_name}}!") +
      lead('A verified badge now appears on your public profile.') +
      C.banner(t, { title: 'Verified', sub: 'Status: {{verification_status}}' }),
    cta_label: 'View profile', cta_url: '{{profile_url}}',
  }; })(),

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'PROFILE_REJECTED', audience: 'all', category: 'Profile',
    name: 'Verification Rejected', subject: 'Update needed on your verification',
    preview_text: 'Your verification needs another look.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because action is required on your account verification.',
    html_content:
      eyebrow(t.text, 'Verification') + h('Your verification needs attention') +
      lead("We couldn't approve your verification this time. Review the requirements and resubmit.") +
      C.banner(t, { title: 'Needs attention', sub: 'Status: {{verification_status}}' }) +
      note('Questions? Email {{support_email}}.'),
    cta_label: 'Review & resubmit', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'KYC_APPROVED', audience: 'vendor', category: 'Profile',
    name: 'KYC Approved', subject: 'Your KYC is verified — payouts unlocked',
    preview_text: 'Your identity verification was approved.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your KYC verification status was updated.',
    html_content:
      eyebrow(t.text, 'KYC verified') + h("You're verified, {{first_name}}!") +
      lead('Your identity verification was approved. You can now request payouts from your dashboard.') +
      C.banner(t, { title: 'Verified', sub: 'Payouts are now unlocked' }),
    cta_label: 'Go to payouts', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'KYC_REJECTED', audience: 'vendor', category: 'Profile',
    name: 'KYC Rejected', subject: 'Action needed on your KYC verification',
    preview_text: 'Your KYC needs another look.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because action is required on your KYC verification.',
    html_content:
      eyebrow(t.text, 'KYC verification') + h('Your KYC needs attention') +
      lead("We couldn't approve your KYC this time. Review the reason below and resubmit.") +
      C.banner(t, { title: 'Needs attention', sub: '{{review_note}}' }) +
      note('Questions? Email {{support_email}}.'),
    cta_label: 'Review & resubmit', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Badge ────────────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Achievement Unlocked'); return {
    event_key: 'BADGE_UNLOCKED', audience: 'all', category: 'Badge',
    name: 'Badge Unlocked', subject: 'You earned the {{badge_name}} badge',
    preview_text: 'A new badge just landed on your profile.',
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you earned a new achievement on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Achievement unlocked') + h('You earned a badge, {{first_name}}!') +
      C.celebration(t, { title: '{{badge_name}}' }) +
      lead('{{badge_description}}'),
    cta_label: 'See my badges', cta_url: '{{profile_url}}/badges',
  }; })(),

  // ── Milestones ───────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Achievement Unlocked'); return {
    event_key: 'MILESTONE_FIRST_BOOKING', audience: 'all', category: 'Badge', sender_key: 'durga',
    name: 'Milestone — First Booking', subject: 'Your first booking on Book A Sloth!',
    preview_text: 'You just landed your first booking.',
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Milestone') + h('Your first booking, {{first_name}}!') +
      C.celebration(t, { title: 'First booking' }) +
      lead('Congratulations on your first booking. This is the start of something good.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Achievement Unlocked'); return {
    event_key: 'MILESTONE_10_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 10 Bookings', subject: '10 bookings and counting!',
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Milestone') + h('10 bookings, {{first_name}}!') +
      C.celebration(t, { title: '{{milestone_value}} bookings' }) +
      lead('Momentum is building.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Achievement Unlocked'); return {
    event_key: 'MILESTONE_50_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 50 Bookings', subject: "50 bookings — you're on a roll",
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Milestone') + h('50 bookings!') +
      C.celebration(t, { title: '{{milestone_value}} bookings' }) +
      lead('Your clients clearly love working with you.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Achievement Unlocked'); return {
    event_key: 'MILESTONE_100_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 100 Bookings', subject: '100 bookings — incredible!',
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Milestone') + h('100 bookings, {{first_name}}!') +
      C.celebration(t, { title: '{{milestone_value}} bookings' }) +
      lead("That's a serious achievement."),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Subscription ─────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Payment Receipt'); return {
    event_key: 'SUBSCRIPTION_PURCHASED', audience: 'all', category: 'Subscription',
    name: 'Premium Activated', subject: "You're officially on {{plan_name}} 🎉",
    preview_text: "{{plan_name}} is live — your booking link's ready to get you paid.",
    email_category: 'Payment Receipt',
    email_reason: 'You are receiving this email because you made a purchase on Book A Sloth.',
    html_content:
      eyebrow(t.text, "You're in") + h("You're officially a {{plan_name}} Sloth, {{first_name}} 🦥") +
      C.celebration(t, { title: '{{plan_name}} — unlocked' }) +
      lead("Some people spend weeks 'thinking about it.' You just did the thing. Your {{plan_name}} plan is live, and everything you need to get booked and get paid is switched on.") +
      C.banner(t, { title: "Here's what just went live for you", sub: 'Your booking link is ready to share · payments land straight in your account · every guest gets automatic reminders and confirmations' }) +
      lead("Next move: get your page in front of people. One link in your bio beats a hundred “DM me to book” replies — and it works while you sleep.") +
      C.infoCard(t, [['Plan', '{{plan_name}}'], ['Amount paid', '{{amount_charged}}'], ['Renews', '{{expiry_date}}']]) +
      note('GST tax invoice: <a href="{{invoice_url}}" style="color:#FE5100;font-weight:600;text-decoration:none">view or download the PDF</a> — also filed under Transactions in your dashboard.'),
    cta_label: 'Set up your page', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Account Update'); return {
    event_key: 'SUBSCRIPTION_EXPIRING', audience: 'all', category: 'Subscription',
    name: 'Premium Expiring', subject: 'Your {{plan_name}} plan expires soon',
    preview_text: 'Renew before {{expiry_date}} to keep your features.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your subscription is due to expire soon.',
    html_content:
      eyebrow(t.text, 'Subscription') + h('Your plan expires soon') +
      lead('Renew to keep your premium features without interruption.') +
      C.banner(t, { title: 'Expires {{expiry_date}}', sub: '{{plan_name}} plan' }),
    cta_label: 'Renew now', cta_url: '{{dashboard_url}}',
  }; })(),

  (() => { const t = themeForCategory('Payment Receipt'); return {
    event_key: 'SUBSCRIPTION_RENEWED', audience: 'all', category: 'Subscription',
    name: 'Premium Renewed', subject: 'Your {{plan_name}} plan is renewed',
    preview_text: 'Your subscription was renewed successfully.',
    email_category: 'Payment Receipt',
    email_reason: 'You are receiving this email because your Book A Sloth subscription was renewed.',
    html_content:
      eyebrow(t.text, 'Subscription') + h("You're renewed, {{first_name}}") +
      lead('Your {{plan_name}} plan has been renewed.') +
      C.infoCard(t, [['Plan', '{{plan_name}}'], ['Amount paid', '{{amount_charged}}'], ['Renews', '{{expiry_date}}']]) +
      lead('Your GST tax invoice is ready — <a href="{{invoice_url}}" style="color:#FE5100;font-weight:600;text-decoration:none">view or download the PDF</a>. It is also under Transactions in your dashboard.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Celebrations ─────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Community Update'); return {
    event_key: 'BIRTHDAY', audience: 'all', category: 'Celebrations',
    name: 'Birthday', subject: 'Happy birthday, {{first_name}}!',
    preview_text: 'A little birthday note from Book A Sloth.',
    email_category: 'Community Update',
    email_reason: 'You are receiving this email because you are a valued member of the Book A Sloth community.',
    html_content:
      eyebrow(t.text, 'Celebration') + h('Happy birthday, {{first_name}}!') +
      C.celebration(t, { title: 'Happy birthday!' }) +
      lead('Everyone at Book A Sloth wishes you a wonderful day. Thanks for being part of our community.'),
    cta_label: '', cta_url: '',
  }; })(),

  (() => { const t = themeForCategory('Community Update'); return {
    event_key: 'ACCOUNT_ANNIVERSARY', audience: 'all', category: 'Celebrations',
    name: 'Account Anniversary', subject: "It's your Book A Sloth anniversary!",
    preview_text: 'Celebrating another year with you.',
    email_category: 'Community Update',
    email_reason: 'You are receiving this email because you are a valued member of the Book A Sloth community.',
    html_content:
      eyebrow(t.text, 'Celebration') + h('Happy anniversary, {{first_name}}!') +
      C.celebration(t, { title: 'Another year together' }) +
      lead("It's been another year with Book A Sloth. Thank you for trusting us with your bookings."),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Vendor welcome ────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Welcome'); return {
    event_key: 'VENDOR_WELCOME', audience: 'all', category: 'Profile', sender_key: 'tithi',
    name: 'Vendor Welcome', subject: 'Welcome to Book A Sloth, {{first_name}}',
    preview_text: "Let's get your booking page ready.",
    email_category: 'Welcome',
    email_reason: 'You are receiving this email because you recently created a Book A Sloth host account.',
    html_content:
      eyebrow(t.text, 'Welcome') + h('Welcome aboard, {{first_name}}!') +
      C.celebration(t, { title: "You're in" }) +
      lead('Your Book A Sloth account is ready. Set up your services and availability to start taking bookings.'),
    cta_label: 'Set up my page', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── First earning → payouts (reframed: lead with the win, KYC as how-to-claim) ─

  (() => { const t = themeForCategory('Payment Receipt'); return {
    event_key: 'KYC_EARN_NUDGE', audience: 'all', category: 'Payments', sender_key: 'tithi',
    name: 'First Earning — Set Up Payouts', subject: "You've earned {{earned_amount}} 🎉",
    preview_text: "It's yours — here's how to get it into your account.",
    email_category: 'Payment Receipt',
    email_reason: 'You are receiving this email because you have earnings waiting on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Earnings') + h("You've earned {{earned_amount}}, {{first_name}}") +
      lead('Real money, from a real booking. One quick step to receive it — add your PAN and bank details so we can pay you out. About 2 minutes, one time only.') +
      C.amountRow(t, 'Ready to withdraw', '{{earned_amount}}') +
      lead('After this, every rupee you earn lands in your account automatically.'),
    cta_label: 'Set up payouts', cta_url: '{{kyc_url}}',
  }; })(),

  // ── Engagement ───────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Product Feedback'); return {
    event_key: 'FEEDBACK_STATUS_CHANGED', audience: 'vendor', category: 'Engagement',
    name: 'Feedback Status Update', subject: 'Update on your feedback: {{feedback_subject}}',
    preview_text: 'Your feedback is now {{status_label}}.',
    email_category: 'Product Feedback',
    email_reason: 'You are receiving this email because you submitted feedback on Book A Sloth.',
    html_content:
      eyebrow(t.text, 'Your feedback') + h('Your feedback is now {{status_label}}') +
      lead('Thanks for helping us improve Book A Sloth. Here is where your feedback stands:') +
      C.banner(t, { title: '{{status_label}}', sub: '{{feedback_subject}}' }) +
      lead('{{admin_response}}') +
      note('Have more to share? Open Feedback in your dashboard any time.'),
    cta_label: 'Open my feedback', cta_url: '{{dashboard_url}}',
  }; })(),

  // ── Marketing ─────────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Upgrade'); return {
    event_key: 'UPGRADE_COMMISSION_NUDGE', audience: 'all', category: 'Marketing', sender_key: 'sujata',
    name: 'Upgrade — Keep Every Rupee', subject: "You've given up {{commission_total}} in commission",
    preview_text: 'On Host+ that number is zero.',
    email_category: 'Upgrade',
    email_reason: 'You are receiving this because you are a Book A Sloth host on the free plan.',
    html_content:
      C.heroBand(t, { kick: 'Commission given up', big: '{{commission_total}}', sub: "On Host+ that's ₹0, {{first_name}}." }) +
      lead("You've earned well — but the free plan takes <strong>5%</strong> of every booking. You've handed back <strong>{{commission_total}}</strong> across {{bookings_count}} bookings.") +
      C.compareRow(t, { leftLabel: 'Starter', leftPct: '5%', leftCap: 'per booking', rightLabel: 'Host+', rightPct: '0%', rightCap: 'you keep it all' }) +
      C.stars({ rating: 5, text: 'Hosts who upgraded keep every rupee they earn.' }),
    cta_label: 'Upgrade to 0% commission', cta_url: '{{upgrade_url}}',
  }; })(),

  // ── Newsletter ────────────────────────────────────────────────────────────────

  (() => { const t = themeForCategory('Newsletter'); return {
    event_key: 'NEWSLETTER_WELCOME', audience: 'all', category: 'Newsletter', sender_key: 'sujata',
    name: 'Newsletter Welcome', subject: 'Welcome to the Collective 🦥',
    preview_text: 'Calm tips, templates and the occasional truth bomb — straight to your inbox.',
    email_category: 'Newsletter',
    email_reason: 'You are receiving this email because you subscribed to the Book A Sloth newsletter.',
    html_content:
      eyebrow(t.text, 'The Collective') + h("You're in.") +
      lead('Thanks for joining the calm side. Every week we send tips, templates and honest lessons on getting booked and paid — without the chaos.') +
      lead('No noise, no spam. Just the good stuff, quietly.') +
      note('Not for you? You can unsubscribe any time using the link below.'),
    cta_label: 'Explore Book A Sloth', cta_url: '{{website_url}}',
  }; })(),

];

module.exports = TEMPLATES;
