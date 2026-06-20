/**
 * emailTemplates.js — seed definitions for every Communication Engine template.
 *
 * html_content is the BODY ONLY. Header (logo + category chip) and footer
 * (company info, links, address, reason) are added by emailLayout.js.
 * No template carries its own layout chrome.
 *
 * Placeholders use {{snake_case}} and are resolved at send time.
 * See placeholderResolver.js for globals always available.
 *
 * email_category: short label rendered in the header chip (right side).
 * email_reason:   legal copy rendered at the bottom of the footer.
 */

// Body helpers — keep seed readable and markup consistent.
const lead    = (t) => `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;
const eyebrow = (t) => `<p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:{{brand_color}};font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;
const h       = (t) => `<h1 style="margin:0 0 18px;font-size:24px;font-weight:800;line-height:1.25;color:#111827;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</h1>`;
const detail  = (label, value) => `<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;width:140px;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${label}</td><td style="padding:6px 0;font-size:15px;color:#111827;font-weight:600;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${value}</td></tr>`;
const card    = (rows) => `<table role="presentation" width="100%" style="margin:8px 0 20px;border-collapse:collapse;background:#f9fafb;border-radius:12px;padding:8px;"><tbody>${rows}</tbody></table>`;
const note    = (t) => `<p style="margin:18px 0 0;font-size:13px;color:#9ca3af;font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">${t}</p>`;

const TEMPLATES = [

  // ── Authentication ──────────────────────────────────────────────────────────

  {
    event_key: 'BOOKING_OTP', audience: 'all', category: 'Authentication',
    name: 'OTP Verification', subject: 'Your verification code is {{otp}}',
    preview_text: 'Use {{otp}} to verify — expires in 10 minutes.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a sign-in verification was requested for your account.',
    html_content:
      eyebrow('Verification') + h('Your verification code') +
      lead('Enter this code to verify your identity. It expires in <strong>10 minutes</strong>.') +
      `<div style="margin:0 0 8px;padding:20px;background:#FFF4EE;border-radius:12px;text-align:center;">` +
        `<span style="font-size:38px;font-weight:800;letter-spacing:.3em;color:{{brand_color}};font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">{{otp}}</span>` +
      `</div>` +
      note("If you didn't request this, you can safely ignore this email."),
    cta_label: '', cta_url: '',
  },

  {
    event_key: 'AUTH_EMAIL_VERIFICATION', audience: 'all', category: 'Authentication',
    name: 'Email Verification', subject: 'Verify your email address',
    preview_text: 'Confirm your email to finish setting up your account.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a verification request was made for your account.',
    html_content:
      eyebrow('Welcome') + h('Confirm your email, {{first_name}}') +
      lead('Tap the button below to verify your email address and activate your Book A Sloth account.') +
      note('This link expires in 24 hours.'),
    cta_label: 'Verify email', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'PASSWORD_RESET', audience: 'all', category: 'Authentication',
    name: 'Password Reset', subject: 'Your Book A Sloth password reset code',
    preview_text: 'Use {{otp}} to reset your password — expires in 10 minutes.',
    email_category: 'Security Check',
    email_reason: 'You are receiving this email because a password reset was requested for your account.',
    html_content:
      eyebrow('Password reset') + h('Reset your password') +
      lead('Use this code to reset your password. It expires in <strong>10 minutes</strong>.') +
      `<div style="margin:0 0 8px;padding:20px;background:#FFF4EE;border-radius:12px;text-align:center;">` +
        `<span style="font-size:38px;font-weight:800;letter-spacing:.24em;color:{{brand_color}};font-family:'Poppins','Plus Jakarta Sans',Arial,sans-serif;">{{otp}}</span>` +
      `</div>` +
      note("If you didn't request this, your password stays unchanged — no action needed."),
    cta_label: '', cta_url: '',
  },

  // ── Security ────────────────────────────────────────────────────────────────

  {
    event_key: 'SECURITY_PASSWORD_CHANGED', audience: 'all', category: 'Security',
    name: 'Password Changed', subject: 'Your password was changed',
    preview_text: 'Your Book A Sloth password was just updated.',
    email_category: 'Security Alert',
    email_reason: 'You are receiving this email because your account password was recently changed.',
    html_content:
      eyebrow('Security') + h('Your password was changed') +
      lead('This is a confirmation that the password for <strong>{{email}}</strong> was just changed.') +
      note("If this wasn't you, reset your password immediately and contact {{support_email}}."),
    cta_label: 'Secure my account', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'SECURITY_LOGIN_ALERT', audience: 'all', category: 'Security',
    name: 'Login Alert', subject: 'New sign-in to your account',
    preview_text: 'A new sign-in was detected on your account.',
    email_category: 'Security Alert',
    email_reason: 'You are receiving this email because a new sign-in was detected on your account.',
    html_content:
      eyebrow('Security') + h('New sign-in detected') +
      lead('We noticed a new sign-in to your Book A Sloth account.') +
      card(detail('Time', '{{login_time}}') + detail('IP address', '{{ip_address}}') + detail('Device', '{{device_name}}')) +
      note("If this was you, no action is needed. Otherwise reset your password and contact {{support_email}}."),
    cta_label: '', cta_url: '',
  },

  // ── Booking — Confirmed ─────────────────────────────────────────────────────

  {
    event_key: 'BOOKING_CONFIRMED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Confirmed — Customer', subject: 'Your booking with {{vendor_name}} is confirmed',
    preview_text: 'Your appointment with {{vendor_name}} is confirmed.',
    email_category: 'Booking Confirmed',
    email_reason: 'You are receiving this email because you made a booking on Book A Sloth.',
    html_content:
      eyebrow('Booking confirmed') + h("You're all set, {{first_name}}") +
      lead('Your appointment is confirmed. Here are the details:') +
      card(detail('Service', '{{service_name}}') + detail('Host', '{{vendor_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')) +
      lead('We look forward to seeing you. {{location}}'),
    cta_label: 'View booking', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'BOOKING_CONFIRMED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Confirmed — Vendor', subject: 'New booking: {{service_name}}',
    preview_text: 'You have a new booking from {{user_name}}.',
    email_category: 'New Booking',
    email_reason: 'You are receiving this email because you received a new booking on Book A Sloth.',
    html_content:
      eyebrow('New booking') + h('A new client booked you') +
      lead("You've received a new booking. Please review your schedule.") +
      card(detail('Service', '{{service_name}}') + detail('Client', '{{user_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Booking — Reminder ──────────────────────────────────────────────────────

  {
    event_key: 'BOOKING_REMINDER_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Reminder — Customer', subject: 'Reminder: {{service_name}} is coming up',
    preview_text: 'Your session with {{vendor_name}} is almost here.',
    email_category: 'Reminder',
    email_reason: 'You are receiving this email as a reminder about your upcoming appointment.',
    html_content:
      eyebrow('Upcoming appointment') + h('See you soon, {{first_name}}') +
      lead('A friendly reminder about your upcoming appointment:') +
      card(detail('Service', '{{service_name}}') + detail('Host', '{{vendor_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')),
    cta_label: '{{action_label}}', cta_url: '{{action_link}}',
  },

  {
    event_key: 'BOOKING_REMINDER_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Reminder — Vendor', subject: 'Reminder: session with {{user_name}}',
    preview_text: 'You have a session coming up with {{user_name}}.',
    email_category: 'Reminder',
    email_reason: 'You are receiving this email as a reminder about an upcoming session.',
    html_content:
      eyebrow('Upcoming session') + h('You have a session soon') +
      lead('Reminder of your upcoming session:') +
      card(detail('Client', '{{user_name}}') + detail('Service', '{{service_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')),
    cta_label: '{{action_label}}', cta_url: '{{action_link}}',
  },

  // ── Booking — Cancelled ─────────────────────────────────────────────────────

  {
    event_key: 'BOOKING_CANCELLED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Cancelled — Customer', subject: 'Your booking was cancelled',
    preview_text: 'Your booking with {{vendor_name}} was cancelled.',
    email_category: 'Booking Cancelled',
    email_reason: 'You are receiving this email because a booking on your account was cancelled.',
    html_content:
      eyebrow('Booking cancelled') + h('Your booking was cancelled') +
      lead('The following booking has been cancelled:') +
      card(detail('Service', '{{service_name}}') + detail('Host', '{{vendor_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')) +
      note('Questions? Reach us at {{support_email}}.'),
    cta_label: 'Book again', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'BOOKING_CANCELLED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Cancelled — Vendor', subject: 'A booking was cancelled',
    preview_text: 'A booking with {{user_name}} was cancelled.',
    email_category: 'Booking Cancelled',
    email_reason: 'You are receiving this email because a booking was cancelled.',
    html_content:
      eyebrow('Booking cancelled') + h('A booking was cancelled') +
      lead('This booking has been cancelled:') +
      card(detail('Client', '{{user_name}}') + detail('Service', '{{service_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Booking — Completed ─────────────────────────────────────────────────────

  {
    event_key: 'BOOKING_COMPLETED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Completed — Customer', subject: 'Thanks for booking with {{vendor_name}}',
    preview_text: 'How was your session with {{vendor_name}}?',
    email_category: 'Session Complete',
    email_reason: 'You are receiving this email because your session was marked as complete.',
    html_content:
      eyebrow('Session complete') + h('Thanks, {{first_name}}!') +
      lead('We hope your session with {{vendor_name}} went well.') +
      card(detail('Service', '{{service_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')) +
      lead("We'd love your feedback — leave a review on {{vendor_name}}'s profile."),
    cta_label: 'Leave a review', cta_url: '{{profile_url}}',
  },

  {
    event_key: 'BOOKING_COMPLETED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Completed — Vendor', subject: 'Session with {{user_name}} marked complete',
    preview_text: 'Your session with {{user_name}} is complete.',
    email_category: 'Session Complete',
    email_reason: 'You are receiving this email because a session was marked complete on your account.',
    html_content:
      eyebrow('Session complete') + h('Session completed') +
      lead('Your session has been marked complete:') +
      card(detail('Client', '{{user_name}}') + detail('Service', '{{service_name}}') + detail('When', '{{booking_date}} at {{booking_time}}')),
    cta_label: 'View earnings', cta_url: '{{dashboard_url}}',
  },

  // ── Booking — Rescheduled ───────────────────────────────────────────────────

  {
    event_key: 'BOOKING_RESCHEDULED_CUSTOMER', audience: 'all', category: 'Booking',
    name: 'Booking Rescheduled — Customer', subject: 'Please confirm your rescheduled booking',
    preview_text: 'Your appointment time changed — please confirm.',
    email_category: 'Rescheduled',
    email_reason: 'You are receiving this email because your booking was rescheduled.',
    html_content:
      eyebrow('Rescheduled') + h('Please confirm the new time') +
      lead('Your appointment with {{vendor_name}} has been rescheduled:') +
      card(detail('Service', '{{service_name}}') + detail('New time', '{{booking_date}} at {{booking_time}}')) +
      lead('Please confirm the new time works for you.'),
    cta_label: 'Confirm new time', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'BOOKING_RESCHEDULED_VENDOR', audience: 'all', category: 'Booking',
    name: 'Booking Rescheduled — Vendor', subject: 'A booking was rescheduled',
    preview_text: 'A booking with {{user_name}} was rescheduled.',
    email_category: 'Rescheduled',
    email_reason: 'You are receiving this email because a booking was rescheduled.',
    html_content:
      eyebrow('Rescheduled') + h('A booking was rescheduled') +
      lead('This booking has a new time:') +
      card(detail('Client', '{{user_name}}') + detail('Service', '{{service_name}}') + detail('New time', '{{booking_date}} at {{booking_time}}')),
    cta_label: 'Open dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Profile ─────────────────────────────────────────────────────────────────

  {
    event_key: 'PROFILE_COMPLETION_REMINDER', audience: 'all', category: 'Profile',
    name: 'Profile Completion Reminder', subject: 'Your profile is {{completion_percentage}}% complete',
    preview_text: 'Finish your profile to start getting booked.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your Book A Sloth profile is incomplete.',
    html_content:
      eyebrow('Almost there') + h('Complete your profile, {{first_name}}') +
      lead('Your profile is <strong>{{completion_percentage}}%</strong> complete. Finish it to start getting discovered and booked.'),
    cta_label: 'Complete profile', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'PROFILE_VERIFIED', audience: 'all', category: 'Profile',
    name: 'Verification Approved', subject: "You're verified on Book A Sloth",
    preview_text: 'Your verification was approved.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your account verification status was updated.',
    html_content:
      eyebrow('Verified') + h("You're verified, {{first_name}}!") +
      lead('Your verification status is now <strong>{{verification_status}}</strong>. A verified badge now appears on your public profile.'),
    cta_label: 'View profile', cta_url: '{{profile_url}}',
  },

  {
    event_key: 'PROFILE_REJECTED', audience: 'all', category: 'Profile',
    name: 'Verification Rejected', subject: 'Update needed on your verification',
    preview_text: 'Your verification needs another look.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because action is required on your account verification.',
    html_content:
      eyebrow('Verification') + h('Your verification needs attention') +
      lead("We couldn't approve your verification this time (status: {{verification_status}}). Review the requirements and resubmit.") +
      note('Questions? Email {{support_email}}.'),
    cta_label: 'Review & resubmit', cta_url: '{{dashboard_url}}',
  },

  // ── Badge ────────────────────────────────────────────────────────────────────

  {
    event_key: 'BADGE_UNLOCKED', audience: 'all', category: 'Badge',
    name: 'Badge Unlocked', subject: 'You earned the {{badge_name}} badge',
    preview_text: 'A new badge just landed on your profile.',
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you earned a new achievement on Book A Sloth.',
    html_content:
      eyebrow('Achievement unlocked') + h('You earned {{badge_name}}!') +
      lead('{{badge_description}}') +
      lead("It's now showing on your public badge showcase. Nice work, {{first_name}}."),
    cta_label: 'See my badges', cta_url: '{{profile_url}}/badges',
  },

  // ── Milestones ───────────────────────────────────────────────────────────────

  {
    event_key: 'MILESTONE_FIRST_BOOKING', audience: 'all', category: 'Badge',
    name: 'Milestone — First Booking', subject: 'Your first booking on Book A Sloth!',
    preview_text: 'You just landed your first booking.',
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow('Milestone') + h('Your first booking, {{first_name}}!') +
      lead('Congratulations on your first booking. This is the start of something good.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'MILESTONE_10_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 10 Bookings', subject: '10 bookings and counting!',
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow('Milestone') + h('10 bookings, {{first_name}}!') +
      lead("You've completed {{milestone_value}} bookings. Momentum is building."),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'MILESTONE_50_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 50 Bookings', subject: "50 bookings — you're on a roll",
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow('Milestone') + h('50 bookings!') +
      lead('{{milestone_value}} bookings completed. Your clients clearly love working with you.'),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'MILESTONE_100_BOOKINGS', audience: 'all', category: 'Badge',
    name: 'Milestone — 100 Bookings', subject: '100 bookings — incredible!',
    preview_text: "You've reached {{milestone_value}} bookings.",
    email_category: 'Achievement Unlocked',
    email_reason: 'You are receiving this email because you reached a booking milestone on Book A Sloth.',
    html_content:
      eyebrow('Milestone') + h('100 bookings, {{first_name}}!') +
      lead("You've hit {{milestone_value}} bookings on Book A Sloth. That's a serious achievement."),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Subscription ─────────────────────────────────────────────────────────────

  {
    event_key: 'SUBSCRIPTION_PURCHASED', audience: 'all', category: 'Subscription',
    name: 'Premium Activated', subject: 'Your {{plan_name}} plan is active',
    preview_text: 'Welcome to {{plan_name}} — your upgrades are live.',
    email_category: 'Payment Receipt',
    email_reason: 'You are receiving this email because you made a purchase on Book A Sloth.',
    html_content:
      eyebrow('Subscription') + h('Welcome to {{plan_name}}!') +
      lead('Your {{plan_name}} plan is now active. All features are unlocked on your dashboard.') +
      card(detail('Plan', '{{plan_name}}') + detail('Renews', '{{expiry_date}}')),
    cta_label: 'Explore features', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'SUBSCRIPTION_EXPIRING', audience: 'all', category: 'Subscription',
    name: 'Premium Expiring', subject: 'Your {{plan_name}} plan expires soon',
    preview_text: 'Renew before {{expiry_date}} to keep your features.',
    email_category: 'Account Update',
    email_reason: 'You are receiving this email because your subscription is due to expire soon.',
    html_content:
      eyebrow('Subscription') + h('Your plan expires soon') +
      lead('Your {{plan_name}} plan expires on <strong>{{expiry_date}}</strong>. Renew to keep your premium features without interruption.'),
    cta_label: 'Renew now', cta_url: '{{dashboard_url}}',
  },

  {
    event_key: 'SUBSCRIPTION_RENEWED', audience: 'all', category: 'Subscription',
    name: 'Premium Renewed', subject: 'Your {{plan_name}} plan is renewed',
    preview_text: 'Your subscription was renewed successfully.',
    email_category: 'Payment Receipt',
    email_reason: 'You are receiving this email because your Book A Sloth subscription was renewed.',
    html_content:
      eyebrow('Subscription') + h("You're renewed, {{first_name}}") +
      lead('Your {{plan_name}} plan has been renewed.') +
      card(detail('Plan', '{{plan_name}}') + detail('Renews', '{{expiry_date}}')),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Celebrations ─────────────────────────────────────────────────────────────

  {
    event_key: 'BIRTHDAY', audience: 'all', category: 'Celebrations',
    name: 'Birthday', subject: 'Happy birthday, {{first_name}}!',
    preview_text: 'A little birthday note from Book A Sloth.',
    email_category: 'Community Update',
    email_reason: 'You are receiving this email because you are a valued member of the Book A Sloth community.',
    html_content:
      eyebrow('Celebration') + h('Happy birthday, {{first_name}}!') +
      lead('Everyone at Book A Sloth wishes you a wonderful day. Thanks for being part of our community.'),
    cta_label: '', cta_url: '',
  },

  {
    event_key: 'ACCOUNT_ANNIVERSARY', audience: 'all', category: 'Celebrations',
    name: 'Account Anniversary', subject: "It's your Book A Sloth anniversary!",
    preview_text: 'Celebrating another year with you.',
    email_category: 'Community Update',
    email_reason: 'You are receiving this email because you are a valued member of the Book A Sloth community.',
    html_content:
      eyebrow('Celebration') + h('Happy anniversary, {{first_name}}!') +
      lead("It's been another year with Book A Sloth. Thank you for trusting us with your bookings."),
    cta_label: 'View dashboard', cta_url: '{{dashboard_url}}',
  },

  // ── Vendor welcome ────────────────────────────────────────────────────────────

  {
    event_key: 'VENDOR_WELCOME', audience: 'all', category: 'Profile',
    name: 'Vendor Welcome', subject: 'Welcome to Book A Sloth, {{first_name}}',
    preview_text: "Let's get your booking page ready.",
    email_category: 'Welcome',
    email_reason: 'You are receiving this email because you recently created a Book A Sloth host account.',
    html_content:
      eyebrow('Welcome') + h('Welcome aboard, {{first_name}}!') +
      lead('Your Book A Sloth account is ready. Set up your services and availability to start taking bookings.'),
    cta_label: 'Set up my page', cta_url: '{{dashboard_url}}',
  },

  // ── Newsletter ────────────────────────────────────────────────────────────────

  {
    event_key: 'NEWSLETTER_WELCOME', audience: 'all', category: 'Newsletter',
    name: 'Newsletter Welcome', subject: 'Welcome to the Collective 🦥',
    preview_text: 'Calm tips, templates and the occasional truth bomb — straight to your inbox.',
    email_category: 'Newsletter',
    email_reason: 'You are receiving this email because you subscribed to the Book A Sloth newsletter.',
    html_content:
      eyebrow('The Collective') + h("You're in.") +
      lead('Thanks for joining the calm side. Every week we send tips, templates and honest lessons on getting booked and paid — without the chaos.') +
      lead('No noise, no spam. Just the good stuff, quietly.') +
      note('Not for you? You can unsubscribe any time using the link below.'),
    cta_label: 'Explore Book A Sloth', cta_url: '{{website_url}}',
  },

];

module.exports = TEMPLATES;
