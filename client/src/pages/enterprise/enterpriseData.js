export const HERO = {
  h1: 'Built around your business, not the other way around.',
  sub: 'Book A Sloth Enterprise helps organizations manage teams, locations, bookings, payments, and customer communication through an appointment booking app designed around their workflow.',
  primary: 'Talk to Enterprise Sales',
  secondary: 'Book a Demo',
};

export const TRUST_CARDS = [
  { icon: 'Users', title: 'Unlimited Staff' },
  { icon: 'MapPin', title: 'Multiple Locations' },
  { icon: 'Puzzle', title: 'Custom Integrations' },
  { icon: 'Headset', title: 'Priority Support' },
  { icon: 'Server', title: 'Dedicated Infrastructure' },
  { icon: 'Workflow', title: 'Custom Workflows' },
  { icon: 'ShieldCheck', title: 'Role-based Access' },
  { icon: 'Rocket', title: 'Implementation Support' },
];

export const PROBLEMS = {
  heading: "Enterprise scheduling isn't just booking appointments.",
  points: [
    'Different branches, each with their own staff and calendars.',
    'Different permissions for managers, department heads, and front-desk teams.',
    'Multiple payment gateways and reconciliation across locations.',
    'Reporting that rolls up across the whole organization.',
    'Customer communication over email, WhatsApp, and SMS.',
    'Legacy software and manual operations that slow teams down.',
  ],
  transition: 'Book A Sloth Enterprise adapts to your workflow.',
};

export const FEATURE_CATEGORIES = [
  { key: 'scheduling', title: 'Scheduling', description: 'Configurable calendars for every team, location, and resource.',
    items: ['Multiple calendars', 'Department calendars', 'Location calendars', 'Round robin', 'Resource booking', 'Equipment booking', 'Recurring schedules', 'Buffer rules', 'Holiday management', 'Shift planning'] },
  { key: 'teams', title: 'Teams', description: 'Structure staff, roles, and approvals across your organization.',
    items: ['Unlimited staff', 'Custom permissions', 'Department heads', 'Managers', 'Approval hierarchy', 'Attendance', 'Role management', 'Branch management'] },
  { key: 'cx', title: 'Customer Experience', description: 'Branded booking and communication your customers recognize.',
    items: ['White-label booking pages', 'Custom branding', 'Custom domain', 'Multiple languages', 'Email automation', 'WhatsApp automation', 'SMS support', 'Invoices', 'Customer portal'] },
  { key: 'payments', title: 'Payments', description: 'Your gateways, your invoicing, your reconciliation.',
    items: ['Own Razorpay', 'Own Stripe', 'Own Cashfree', 'Corporate invoicing', 'GST invoices', 'Offline payments', 'Subscriptions', 'Advance payments', 'Split payments'] },
  { key: 'integrations', title: 'Integrations', description: 'Connect the tools your organization already runs on.',
    items: ['Google Calendar', 'Microsoft Outlook', 'Google Meet', 'Zoom', 'WhatsApp Business API', 'REST APIs', 'Webhooks', 'ERP', 'CRM', 'Internal systems'] },
  { key: 'security', title: 'Security', description: 'Access control, audit trails, and data ownership.',
    items: ['SSO', 'Audit logs', 'Permissions', 'Encrypted storage', 'Backups', 'Data export', 'Compliance'] },
];

export const WORKFLOW_STEPS = [
  'Customer', 'Location', 'Department', 'Staff', 'Service', 'Approval',
  'Payment', 'Confirmation', 'WhatsApp', 'Reminder', 'Reports',
];

export const INDUSTRIES = [
  { name: 'Healthcare', challenge: 'Multi-department appointments, referrals, and patient communication across sites.', solution: 'Department and location calendars, approval flows, and automated reminders reduce no-shows.' },
  { name: 'Education', challenge: 'Counselling, admissions, and faculty slots across campuses.', solution: 'Round-robin assignment and per-department calendars route students to the right staff.' },
  { name: 'Fitness', challenge: 'Class schedules, trainer availability, and equipment booking across branches.', solution: 'Resource and equipment booking with recurring schedules keeps every location in sync.' },
  { name: 'Corporate', challenge: 'Internal scheduling, HR interviews, and facility bookings at scale.', solution: 'Role-based access and approval hierarchy match your reporting structure.' },
  { name: 'Government', challenge: 'High-volume citizen appointments with audit and compliance requirements.', solution: 'Audit logs, permissions, and data export support accountability and record-keeping.' },
  { name: 'Consulting', challenge: 'Client sessions across consultants, time zones, and billing terms.', solution: 'Advance payments, invoices, and calendar sync handle scheduling and revenue together.' },
  { name: 'Hospitality', challenge: 'Bookings across properties with branded guest communication.', solution: 'White-label pages, custom domains, and WhatsApp automation keep guests informed.' },
  { name: 'Beauty', challenge: 'Salon and spa chains with staff, services, and buffer rules per branch.', solution: 'Buffer rules, shift planning, and location calendars prevent overbooking.' },
];

export const SERVICES = [
  'Dedicated onboarding', 'Migration', 'Implementation', 'Training', 'Priority support',
  'Dedicated account manager', 'Technical consulting', 'API consulting', 'Custom development', 'SLA',
];

export const INTEGRATIONS = [
  'Google Calendar', 'Google Meet', 'Zoom', 'Microsoft Outlook', 'WhatsApp Business API',
  'Razorpay', 'Stripe', 'Cashfree', 'Webhooks', 'REST API',
];

export const DEPLOYMENTS = [
  { name: 'Cloud', description: 'Managed multi-tenant cloud. Fastest to launch, maintained and scaled by us.' },
  { name: 'Dedicated Instance', description: 'An isolated instance for your organization with dedicated resources.' },
  { name: 'Private Cloud', description: 'Deployment inside your own cloud account for data-residency and control.' },
  { name: 'On-premise', description: 'Run within your own infrastructure.', badge: 'Coming Soon' },
];

export const CUSTOMIZATIONS = [
  { q: 'Separate calendars for every branch', a: 'Each location and department can run its own calendar with independent availability, staff, and services.' },
  { q: 'Custom approval workflow', a: 'Bookings can route through managers or department heads before confirmation, matching your approval hierarchy.' },
  { q: 'Own payment gateway', a: 'Connect your own Razorpay, Stripe, or Cashfree account so settlements flow directly to you.' },
  { q: 'Own WhatsApp Business API', a: 'Use your own WhatsApp Business API sender for booking confirmations and reminders.' },
  { q: 'Custom email templates', a: 'Email templates can be branded and tailored per organization or per location.' },
  { q: 'Dedicated SMTP', a: 'Send transactional email from your own SMTP for full deliverability control.' },
  { q: 'Role restrictions', a: 'Permissions are configurable per role so staff only see what they need.' },
  { q: 'API integration', a: 'REST APIs and webhooks let you connect Book A Sloth Enterprise to your internal systems.' },
  { q: 'ERP integration', a: 'We build integrations with your ERP as part of implementation.' },
  { q: 'CRM integration', a: 'Booking and customer data can sync with your CRM through APIs and webhooks.' },
  { q: 'Staff hierarchy', a: 'Model department heads, managers, and staff with reporting relationships.' },
  { q: 'Custom reports', a: 'Reporting can be tailored to the metrics your organization tracks.' },
  { q: 'Booking migration', a: 'We migrate your existing bookings and customer data during onboarding.' },
];

export const WHY_CARDS = [
  { title: 'Built around your workflow', body: 'The platform is configured to how your organization already works, not the reverse.' },
  { title: 'Direct engineering support', body: 'You work with the team that builds the product, not a support tier.' },
  { title: 'Fast implementation', body: 'A structured onboarding gets you live without a drawn-out rollout.' },
  { title: 'Transparent communication', body: 'Clear scope, timelines, and status throughout the engagement.' },
  { title: 'Indian business workflows', body: 'GST invoicing, WhatsApp, and local payment gateways are first-class.' },
  { title: 'Modern APIs', body: 'REST APIs and webhooks for clean integration with your systems.' },
  { title: 'Scalable architecture', body: 'Designed for multiple locations, teams, and high booking volumes.' },
  { title: 'No unnecessary complexity', body: 'Configurable where you need it, simple everywhere else.' },
];

export const IMPLEMENTATION_STEPS = [
  { step: 'Discovery', detail: 'We map your locations, teams, services, and current tools.' },
  { step: 'Requirement Mapping', detail: 'We translate your workflow into a configuration and integration plan.' },
  { step: 'Proposal', detail: 'You receive a scoped plan with timelines and deliverables.' },
  { step: 'Implementation', detail: 'We configure calendars, roles, payments, and integrations.' },
  { step: 'Migration', detail: 'Existing bookings and customer data are migrated and verified.' },
  { step: 'Testing', detail: 'We validate flows across locations before launch.' },
  { step: 'Training', detail: 'Your teams are trained on day-to-day operations.' },
  { step: 'Launch', detail: 'You go live with support on standby.' },
];

export const FAQ = [
  { q: 'What is an enterprise appointment booking app?', a: 'An enterprise appointment booking app is scheduling software built for organizations with multiple teams, locations, and workflows. Book A Sloth Enterprise provides configurable calendars, role-based access, payments, and integrations as booking infrastructure for your organization.' },
  { q: 'Can we use our own domain?', a: 'Yes. Enterprise plans support custom domains and white-label booking pages so the experience carries your brand.' },
  { q: 'Can we use our own WhatsApp Business API?', a: 'Yes. You can connect your own WhatsApp Business API sender for confirmations, reminders, and updates.' },
  { q: 'Can we use our own Razorpay account?', a: 'Yes. Connect your own Razorpay, Stripe, or Cashfree account so payments settle directly to you.' },
  { q: 'Can staff have different permissions?', a: 'Yes. Permissions are role-based and configurable, with managers, department heads, and staff seeing only what they need.' },
  { q: 'Can every location have separate calendars?', a: 'Yes. Each location and department runs its own calendar with independent availability, staff, and services.' },
  { q: 'Can you migrate our existing data?', a: 'Yes. We migrate existing bookings and customer data as part of onboarding and verify it before launch.' },
  { q: 'Do you provide onboarding?', a: 'Yes. Enterprise engagements include dedicated onboarding, implementation, and training for your teams.' },
  { q: 'Can you build custom integrations?', a: 'Yes. We build integrations with your ERP, CRM, and internal systems using REST APIs and webhooks.' },
  { q: 'Do you offer SLAs?', a: 'Yes. Service-level agreements are available on enterprise plans, with priority support and a dedicated account manager.' },
  { q: 'Can we self-host?', a: 'Dedicated instance and private cloud deployments are available today; on-premise is on our roadmap.' },
  { q: 'Do you provide API documentation?', a: 'Yes. REST API documentation and webhook references are provided for your integration work.' },
  { q: 'Can we integrate our ERP?', a: 'Yes. ERP integration is scoped and built during implementation.' },
  { q: 'Does it support multiple languages?', a: 'Yes. Booking pages and communication can be configured for multiple languages.' },
  { q: 'Can we set approval workflows?', a: 'Yes. Bookings can route through managers or department heads before they are confirmed.' },
  { q: 'Do you support GST invoicing?', a: 'Yes. GST-compliant invoices and corporate invoicing are supported.' },
  { q: 'Can we book resources and equipment?', a: 'Yes. Resource and equipment booking prevents double-booking of rooms, devices, and shared assets.' },
  { q: 'How are reminders sent?', a: 'Reminders are automated over email, WhatsApp, and SMS to reduce no-shows.' },
  { q: 'Is our data secure?', a: 'Data is stored encrypted with audit logs, configurable permissions, backups, and data export.' },
  { q: 'How do we get started?', a: 'Request an enterprise consultation and our team maps your workflow, then proposes a scoped implementation plan.' },
];
