import { Suspense, useState, useMemo, useEffect } from 'react';
import { Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import ChromeContext from './context/ChromeContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import DashboardLayout from './components/common/DashboardLayout';
import AdminLayout from './components/common/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import HostRoute from './components/common/HostRoute';
import GuestRoute from './components/common/GuestRoute';
import GuestLayout from './components/common/GuestLayout';
import AnalyticsBridge from './components/common/AnalyticsBridge';
import ConsentBanner from './components/common/ConsentBanner';
import ScrollToTop from './components/common/ScrollToTop';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';
import { useAuth } from './context/AuthContext';
import { KycProvider } from './context/KycContext';
import { captureReferral } from './services/api';
import lazyWithRetry from './utils/lazyWithRetry';

// lazyWithRetry wraps React.lazy: it retries transient chunk-fetch failures and,
// on a stale-chunk-after-deploy 404, does a one-shot full reload to pull the
// fresh build — instead of throwing an unrecoverable white screen.
const lazy = lazyWithRetry;

// Floating chat bubble — not first-paint content. Lazy so its ~585 lines + the
// Markdown renderer stay off the initial bundle on every page.
const BotWidget = lazy(() => import('./components/common/BotWidget'));

// ── Route-level lazy loading ──────────────────────────────────────────────────
// Layout / guard components stay eager (always needed, small).
// Every page component is lazy — only downloaded when the route is visited.

// Public pages
const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const VendorSignup   = lazy(() => import('./pages/VendorSignup'));
const ErrorPage      = lazy(() => import('./pages/ErrorPage'));
const Offline        = lazy(() => import('./pages/Offline'));
const Help           = lazy(() => import('./pages/Help'));
const HelpDocs       = lazy(() => import('./pages/HelpDocs'));
const HelpDoc        = lazy(() => import('./pages/HelpDoc'));
const Support        = lazy(() => import('./pages/Support'));
const Contact        = lazy(() => import('./pages/Contact'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const Terms          = lazy(() => import('./pages/Terms'));
const Refund         = lazy(() => import('./pages/Refund'));
const GuestTerms     = lazy(() => import('./pages/GuestTerms'));
const HostAgreement  = lazy(() => import('./pages/HostAgreement'));
const HostFees       = lazy(() => import('./pages/HostFees'));
const EarningsCalculator = lazy(() => import('./pages/EarningsCalculator'));
const Unsubscribe    = lazy(() => import('./pages/Unsubscribe'));
const About          = lazy(() => import('./pages/About'));
const Careers        = lazy(() => import('./pages/Careers'));
const JobDetail      = lazy(() => import('./pages/JobDetail'));
const Enterprise     = lazy(() => import('./pages/Enterprise'));

// Paid-traffic landing pages (/lp/*) — own header/footer, global nav hidden
const TopmateVsBookASloth = lazy(() => import('./pages/lp/TopmateVsBookASloth'));
const CalendlyAlternative  = lazy(() => import('./pages/lp/CalendlyAlternative'));
const SetmoreAlternative   = lazy(() => import('./pages/lp/SetmoreAlternative'));
const AcuityAlternative    = lazy(() => import('./pages/lp/AcuityAlternative'));
const SimplybookAlternative = lazy(() => import('./pages/lp/SimplybookAlternative'));
const ZohoBookingsAlternative = lazy(() => import('./pages/lp/ZohoBookingsAlternative'));

// Vendor Google auth (Google-only signup/login)
const BeASloth       = lazy(() => import('./pages/BeASloth'));
const InviteLanding  = lazy(() => import('./pages/InviteLanding'));
const HostLogin      = lazy(() => import('./pages/HostLogin'));
const Changelog      = lazy(() => import('./pages/Changelog'));
const Pricing        = lazy(() => import('./pages/Pricing'));
const Blog           = lazy(() => import('./pages/Blog'));
const Search         = lazy(() => import('./pages/Search'));
const WallOfLove     = lazy(() => import('./pages/WallOfLove'));
const BlogPost       = lazy(() => import('./pages/BlogPost'));
const Moments        = lazy(() => import('./pages/Moments'));
const MomentPage     = lazy(() => import('./pages/MomentPage'));
const OgCard         = lazy(() => import('./pages/OgCard'));
const HostOgCard     = lazy(() => import('./pages/HostOgCard'));
const GoogleAuthDone = lazy(() => import('./pages/GoogleAuthDone'));

// Vendor Onboarding (Google-first 7-step flow)
const GoogleStart     = lazy(() => import('./pages/onboarding/GoogleStart'));
const SlugClaim       = lazy(() => import('./pages/onboarding/SlugClaim'));
const AboutYouStep    = lazy(() => import('./pages/onboarding/AboutYouStep'));
const CategoryStep    = lazy(() => import('./pages/onboarding/CategoryStep'));
const PersonaStep     = lazy(() => import('./pages/onboarding/PersonaStep'));
const PreviewStep     = lazy(() => import('./pages/onboarding/PreviewStep'));
const WhatsAppStep    = lazy(() => import('./pages/onboarding/WhatsAppStep'));
const PlansStep       = lazy(() => import('./pages/onboarding/PlansStep'));
const ExploreWithBolt = lazy(() => import('./pages/onboarding/ExploreWithBolt'));

// Admin login
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

// Vendor dashboard
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Bookings    = lazy(() => import('./pages/Bookings'));
const Earnings    = lazy(() => import('./pages/Earnings'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Availability = lazy(() => import('./pages/Availability'));
const Products    = lazy(() => import('./pages/Products'));
const UpgradePlan = lazy(() => import('./pages/UpgradePlan'));
const Payouts     = lazy(() => import('./pages/Payouts'));
const ReferEarn   = lazy(() => import('./pages/ReferEarn'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Feedback     = lazy(() => import('./pages/Feedback'));

// Studio Client CRM ("Host 360") — Studio+ only, gated server-side.
const ClientsList  = lazy(() => import('./pages/ClientsList'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));

// KYC (host identity verification)
const KycHome      = lazy(() => import('./pages/kyc/KycHome'));
const KycFlow      = lazy(() => import('./pages/kyc/KycFlow'));
const KycStart     = lazy(() => import('./pages/kyc/KycStart'));
const KycBank      = lazy(() => import('./pages/kyc/KycBank'));
const KycSubmitted = lazy(() => import('./pages/kyc/KycSubmitted'));

// Service Module v2
const ServicesList = lazy(() => import('./pages/services/ServicesList'));
const AddService   = lazy(() => import('./pages/services/AddService'));
const EditService  = lazy(() => import('./pages/services/EditService'));

// Customer (guest) pages
const CustomerBookings = lazy(() => import('./pages/CustomerBookings'));
const CustomerProfile  = lazy(() => import('./pages/CustomerProfile'));
const CustomerReviews  = lazy(() => import('./pages/CustomerReviews'));
const ReviewPage       = lazy(() => import('./pages/ReviewPage'));
const ManageBooking    = lazy(() => import('./pages/ManageBooking'));
const Loyalty          = lazy(() => import('./pages/Loyalty'));

// Public host / service pages
const HostProfile     = lazy(() => import('./pages/HostProfile'));
const ServiceBooking  = lazy(() => import('./pages/ServiceBooking'));
const ServiceDetail   = lazy(() => import('./pages/ServiceDetail'));
const ProductPurchase = lazy(() => import('./pages/ProductPurchase'));

// Admin — Dashboard
const SuperDashboard = lazy(() => import('./pages/admin/SuperDashboard'));

// Admin — Core
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPaymentSettings = lazy(() => import('./pages/admin/AdminPaymentSettings'));

// Admin — People
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'));
const AdminKYC       = lazy(() => import('./pages/admin/AdminKYC'));
const AdminKycOverview = lazy(() => import('./pages/admin/AdminKycOverview'));
const Host360List    = lazy(() => import('./pages/admin/Host360List'));
const Host360Detail  = lazy(() => import('./pages/admin/Host360Detail'));

// Admin — Finance
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminPayouts      = lazy(() => import('./pages/admin/AdminPayouts'));
const AdminRefunds      = lazy(() => import('./pages/admin/AdminRefunds'));

// Admin — Content
const AdminPages        = lazy(() => import('./pages/admin/AdminPages'));
const AdminBlogs        = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminNewsletter   = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminFAQ          = lazy(() => import('./pages/admin/AdminFAQ'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));

// Admin — Support
const AdminTickets   = lazy(() => import('./pages/admin/AdminTickets'));
const AdminDisputes  = lazy(() => import('./pages/admin/AdminDisputes'));
const AdminReviews   = lazy(() => import('./pages/admin/AdminReviews'));
const AdminFeedback  = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminBotSupport = lazy(() => import('./pages/admin/AdminBotSupport'));

// Admin — Platform
const AdminAppearance    = lazy(() => import('./pages/admin/AdminAppearance'));
const AdminMenuBuilder   = lazy(() => import('./pages/admin/AdminMenuBuilder'));
const AdminFooterBuilder = lazy(() => import('./pages/admin/AdminFooterBuilder'));
const AdminCommunication = lazy(() => import('./pages/admin/AdminCommunication'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminCampaigns     = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminBadges        = lazy(() => import('./pages/admin/AdminBadges'));
const BadgeShowcase      = lazy(() => import('./pages/BadgeShowcase'));
const Explore         = lazy(() => import('./pages/Explore'));
const ServicesDirectory  = lazy(() => import('./pages/services/ServicesDirectory'));
const ProfessionServices = lazy(() => import('./pages/services/ProfessionServices'));
const ProfessionLanding  = lazy(() => import('./pages/for/ProfessionLanding'));
const FeaturePage = lazy(() => import('./pages/features/FeaturePage'));

// Admin — Operations
const AdminPlans  = lazy(() => import('./pages/admin/AdminPlans'));
const AdminAddons = lazy(() => import('./pages/admin/AdminAddons'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminServiceCategories = lazy(() => import('./pages/admin/AdminServiceCategories'));
const AdminExplore    = lazy(() => import('./pages/admin/AdminExplore'));

// Admin — System (M1: RBAC foundation)
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const AdminReservedSlugs = lazy(() => import('./pages/admin/AdminReservedSlugs'));
const AdminReferrals = lazy(() => import('./pages/admin/AdminReferrals'));
const AdminInviteLinks = lazy(() => import('./pages/admin/AdminInviteLinks'));
const AdminBlockedIps = lazy(() => import('./pages/admin/AdminBlockedIps'));

// Admin — Departments (org placeholder shells)
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminDepartment = lazy(() => import('./pages/admin/AdminDepartment'));

// Admin — Platform Control
const AdminFeatureStatus = lazy(() => import('./pages/admin/AdminFeatureStatus'));

// Admin — Finance (P1: double-entry ledger)
const AdminFinanceDashboard = lazy(() => import('./pages/admin/AdminFinanceDashboard'));
const AdminJournal = lazy(() => import('./pages/admin/AdminJournal'));
const AdminLedger  = lazy(() => import('./pages/admin/AdminLedger'));

// ── Fallback shown while a route chunk downloads ──────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-[#FE5100] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Refer & Earn attribution: a host who arrived via ?ref=<username> had it stashed
// in localStorage (AuthContext). Once they're an authed host, POST it once — the
// server write-once-guards, so re-fires are harmless — then clear it.
function useReferralCapture() {
  const { user } = useAuth();
  useEffect(() => {
    const ref = localStorage.getItem('bas_ref');
    if (!ref || !user?.is_host) return;
    captureReferral({ ref }).catch(() => {}).finally(() => localStorage.removeItem('bas_ref'));
  }, [user?.is_host]);
}

function DashboardWrapper({ children }) {
  useReferralCapture();
  return <HostRoute><DashboardLayout>{children}</DashboardLayout></HostRoute>;
}

// SECURITY: AdminWrapper does NOT use ProtectedRoute (which checks vendor/user session).
// AdminLayout has its own isolated guard that checks the 'bas_admin' session only.
// A vendor/user with no admin session is redirected to /hello-sloth, not /login.
function AdminWrapper({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function BookingRedirect() {
  const { profileSlug } = useParams();
  return <Navigate to={`/${profileSlug}`} replace />;
}

// /blogs/* is a common mistype of the canonical /blog/* — keep the link alive.
// In production Vercel 301s these before the app ever loads (client/vercel.json);
// this covers what that cannot — local dev, and in-app <Link> navigation, which
// never reaches the server. Both are needed.
function BlogsRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/blog/${slug}` : '/blog'} replace />;
}

function App() {
  const location = useLocation();
  const { user } = useAuth();

  // Full-bleed pages (error / offline) flip this on via ChromeContext so the
  // global Navbar + Footer drop — even the catch-all 404, whose URL is unknown
  // ahead of time and so can't be matched by a pathname prefix.
  const [chromeHidden, setChromeHidden] = useState(false);
  // 'default' → normal footer rules; 'minimal' → a not-found error state asked
  // for the stripped footer, forced on even when it would normally be hidden.
  const [footerMode, setFooterMode] = useState('default');
  const chromeValue = useMemo(() => ({ setChromeHidden, setFooterMode }), []);

  const hideNavbar =
    chromeHidden ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/super-dashboard') ||
    location.pathname.startsWith('/vendor-register') ||
    location.pathname.startsWith('/lp') ||
    location.pathname.startsWith('/for/') ||
    location.pathname.startsWith('/features') ||
    location.pathname === '/hello-sloth';

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/login-as-vendor' ||
    location.pathname === '/be-a-sloth';

  // Guest booking page (/:profileSlug/booking/:serviceSlug) gets a stripped-down
  // footer — CTA band + legal bar only, no link columns — so checkout stays focused.
  const isBookingPage = /^\/[^/]+\/booking\/[^/]+\/?$/.test(location.pathname);

  const hideFooter = (hideNavbar || !!user || isAuthPage) && !isBookingPage;

  // Support bot rides along on public + host surfaces, but not admin, onboarding,
  // auth, or the stripped error/offline chrome.
  const hideBot =
    chromeHidden ||
    isAuthPage ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/super-dashboard') ||
    location.pathname.startsWith('/vendor-register') ||
    location.pathname === '/hello-sloth';

  return (
    <ChromeContext.Provider value={chromeValue}>
      <ScrollToTop />
      <Toaster position="top-right" />
      {/* Boundary wraps the whole chrome, not just <Routes>: a throw in Navbar,
          ConsentBanner or AnalyticsBridge is ABOVE the route content and would
          otherwise unmount the entire tree into a blank white screen. resetKey
          clears the error when the user navigates to a different path. */}
      <RouteErrorBoundary resetKey={location.pathname}>
      <AnalyticsBridge />
      {/* Keep error / offline pages a clean single card — consent is still
          surfaced on every normal page. */}
      {!chromeHidden && (
        <ConsentBanner variant={location.pathname.startsWith('/lp') ? 'slim' : 'full'} />
      )}
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          {/* Paid-traffic landing pages — own header/footer, nav hidden */}
          <Route path="/lp/topmate-vs-bookasloth" element={<TopmateVsBookASloth />} />
          <Route path="/lp/calendly-alternative" element={<CalendlyAlternative />} />
          <Route path="/lp/setmore-alternative" element={<SetmoreAlternative />} />
          <Route path="/lp/acuity-alternative" element={<AcuityAlternative />} />
          <Route path="/lp/simplybook-alternative" element={<SimplybookAlternative />} />
          <Route path="/lp/zoho-bookings-alternative" element={<ZohoBookingsAlternative />} />
          {/* Unknown /lp/* slug → home (friendlier than a bare 404 for ad traffic) */}
          <Route path="/lp/*" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/invite/:slug" element={<InviteLanding />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help/docs" element={<HelpDocs />} />
          <Route path="/help/docs/:slug" element={<HelpDoc />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wall-of-love" element={<WallOfLove />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/moments/:slug" element={<MomentPage />} />
          {/* Render target for the OG card generator, not a page for humans.
              noindex + absent from the sitemap and prerender lists. */}
          <Route path="/og/blog/:slug" element={<OgCard />} />
          <Route path="/og/host/:username" element={<HostOgCard />} />
          <Route path="/blogs" element={<BlogsRedirect />} />
          <Route path="/blogs/:slug" element={<BlogsRedirect />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:jobSlug" element={<JobDetail />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/guest-terms" element={<GuestTerms />} />
          <Route path="/host-agreement" element={<HostAgreement />} />
          <Route path="/host-fees" element={<HostFees />} />
          <Route path="/earnings-calculator" element={<EarningsCalculator />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* Customers never register — accounts are created automatically
              during booking (phone OTP). Old signup URL redirects home. */}
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/vendor/signup" element={<VendorSignup />} />

          {/* Vendor auth — Google-only */}
          <Route path="/be-a-sloth" element={<BeASloth />} />
          {/* Host login door (Google-only) — also the Google-callback error target. */}
          <Route path="/login-as-vendor" element={<HostLogin />} />
          <Route path="/auth/google/done" element={<GoogleAuthDone />} />

          {/* Vendor Onboarding (Google-first 7-step flow) */}
          <Route path="/vendor-register" element={<GoogleStart />} />
          <Route path="/vendor-register/:slug/claim"    element={<SlugClaim />} />
          <Route path="/vendor-register/:slug/about"    element={<AboutYouStep />} />
          <Route path="/vendor-register/:slug/category" element={<PersonaStep />} />
          <Route path="/vendor-register/:slug/category/all" element={<CategoryStep />} />
          <Route path="/vendor-register/:slug/preview" element={<PreviewStep />} />
          <Route path="/vendor-register/:slug/whatsapp" element={<WhatsAppStep />} />
          <Route path="/vendor-register/:slug/plan"     element={<PlansStep />} />
          <Route path="/vendor-register/:slug/live"     element={<ExploreWithBolt />} />

          {/* Admin login */}
          <Route path="/hello-sloth" element={<AdminLogin />} />

          {/* Vendor dashboard */}
          <Route path="/dashboard" element={<DashboardWrapper><Dashboard /></DashboardWrapper>} />
          <Route path="/dashboard/bookings" element={<DashboardWrapper><Bookings /></DashboardWrapper>} />
          <Route path="/dashboard/clients" element={<DashboardWrapper><ClientsList /></DashboardWrapper>} />
          <Route path="/dashboard/clients/:id" element={<DashboardWrapper><ClientDetail /></DashboardWrapper>} />
          <Route path="/dashboard/earnings" element={<DashboardWrapper><Earnings /></DashboardWrapper>} />
          <Route path="/dashboard/services" element={<DashboardWrapper><ServicesList /></DashboardWrapper>} />
          <Route path="/dashboard/service/add-new" element={<DashboardWrapper><AddService /></DashboardWrapper>} />
          <Route path="/dashboard/service/edit/:id" element={<DashboardWrapper><EditService /></DashboardWrapper>} />
          <Route path="/dashboard/service/view/:id" element={<DashboardWrapper><EditService /></DashboardWrapper>} />
          <Route path="/dashboard/availability" element={<DashboardWrapper><Availability /></DashboardWrapper>} />
          <Route path="/dashboard/profile" element={<DashboardWrapper><ProfileSetup /></DashboardWrapper>} />
          <Route path="/dashboard/kyc" element={<DashboardWrapper><KycHome /></DashboardWrapper>} />
          {/* KycProvider sits OUTSIDE DashboardWrapper on purpose: DashboardLayout
              renders pages inside PageTransition (keyed on pathname), so a provider
              below it would remount — and lose every field — on each step. */}
          <Route path="/dashboard/kyc/flow" element={<KycProvider><DashboardWrapper><KycFlow /></DashboardWrapper></KycProvider>}>
            <Route index element={<Navigate to="start" replace />} />
            <Route path="start" element={<KycStart />} />
            <Route path="bank" element={<KycBank />} />
            <Route path="submitted" element={<KycSubmitted />} />
          </Route>
          <Route path="/dashboard/products" element={<DashboardWrapper><Products /></DashboardWrapper>} />
          <Route path="/dashboard/upgrade" element={<DashboardWrapper><UpgradePlan /></DashboardWrapper>} />
          <Route path="/dashboard/payments/payouts" element={<DashboardWrapper><Payouts /></DashboardWrapper>} />
          <Route path="/dashboard/referrals" element={<DashboardWrapper><ReferEarn /></DashboardWrapper>} />
          <Route path="/dashboard/payments/transactions" element={<DashboardWrapper><Transactions /></DashboardWrapper>} />
          <Route path="/dashboard/feedback" element={<DashboardWrapper><Feedback /></DashboardWrapper>} />

          {/* Super Dashboard (main admin entry) */}
          <Route path="/super-dashboard" element={<AdminWrapper><SuperDashboard /></AdminWrapper>} />
          <Route path="/super-dashboard/:view" element={<AdminWrapper><SuperDashboard /></AdminWrapper>} />

          {/* Legacy /admin root -> redirect */}
          <Route path="/admin" element={<Navigate to="/super-dashboard" replace />} />

          {/* Operations — Bookings */}
          <Route path="/admin/bookings" element={<AdminWrapper><AdminBookings /></AdminWrapper>} />
          <Route path="/admin/bookings/:filter" element={<AdminWrapper><AdminBookings /></AdminWrapper>} />

          {/* Operations — Services */}
          <Route path="/admin/services" element={<AdminWrapper><AdminServices /></AdminWrapper>} />
          <Route path="/admin/services/categories" element={<AdminWrapper><AdminServiceCategories /></AdminWrapper>} />

          {/* Operations */}
          <Route path="/admin/addons" element={<AdminWrapper><AdminAddons /></AdminWrapper>} />
          <Route path="/admin/plans" element={<AdminWrapper><AdminPlans /></AdminWrapper>} />
          <Route path="/admin/referrals" element={<AdminWrapper><AdminReferrals /></AdminWrapper>} />
          <Route path="/admin/invite-links" element={<AdminWrapper><AdminInviteLinks /></AdminWrapper>} />
          <Route path="/admin/professions" element={<AdminWrapper><AdminCategories /></AdminWrapper>} />
          <Route path="/admin/explore"     element={<AdminWrapper><AdminExplore /></AdminWrapper>} />

          {/* People */}
          <Route path="/admin/host360" element={<AdminWrapper><Host360List /></AdminWrapper>} />
          <Route path="/admin/host360/:hostId" element={<AdminWrapper><Host360Detail /></AdminWrapper>} />
          <Route path="/admin/providers" element={<AdminWrapper><AdminProviders /></AdminWrapper>} />
          <Route path="/admin/providers/:status" element={<AdminWrapper><AdminProviders /></AdminWrapper>} />
          <Route path="/admin/kyc" element={<AdminWrapper><AdminKycOverview /></AdminWrapper>} />
          <Route path="/admin/kyc/:status" element={<AdminWrapper><AdminKYC /></AdminWrapper>} />

          {/* Finance */}
          <Route path="/admin/finance/transactions" element={<AdminWrapper><AdminTransactions /></AdminWrapper>} />
          <Route path="/admin/finance/payouts" element={<AdminWrapper><AdminPayouts /></AdminWrapper>} />
          <Route path="/admin/finance/refunds" element={<AdminWrapper><AdminRefunds /></AdminWrapper>} />

          {/* Content */}
          <Route path="/admin/content/pages" element={<AdminWrapper><AdminPages /></AdminWrapper>} />
          <Route path="/admin/content/blogs" element={<AdminWrapper><AdminBlogs /></AdminWrapper>} />
          <Route path="/admin/content/newsletter" element={<AdminWrapper><AdminNewsletter /></AdminWrapper>} />
          <Route path="/admin/content/faq" element={<AdminWrapper><AdminFAQ /></AdminWrapper>} />
          <Route path="/admin/content/testimonials" element={<AdminWrapper><AdminTestimonials /></AdminWrapper>} />

          {/* Support */}
          <Route path="/admin/support/tickets" element={<AdminWrapper><AdminTickets /></AdminWrapper>} />
          <Route path="/admin/support/disputes" element={<AdminWrapper><AdminDisputes /></AdminWrapper>} />
          <Route path="/admin/support/reviews" element={<AdminWrapper><AdminReviews /></AdminWrapper>} />
          <Route path="/admin/feedback" element={<AdminWrapper><AdminFeedback /></AdminWrapper>} />
          <Route path="/admin/support/bolt" element={<AdminWrapper><AdminBotSupport /></AdminWrapper>} />
          <Route path="/admin/support/bolt/:page" element={<AdminWrapper><AdminBotSupport /></AdminWrapper>} />

          {/* Platform */}
          <Route path="/admin/platform/appearance" element={<AdminWrapper><AdminAppearance /></AdminWrapper>} />
          <Route path="/admin/platform/menu" element={<AdminWrapper><AdminMenuBuilder /></AdminWrapper>} />
          <Route path="/admin/platform/footer" element={<AdminWrapper><AdminFooterBuilder /></AdminWrapper>} />
          <Route path="/admin/platform/communication" element={<AdminWrapper><AdminCommunication /></AdminWrapper>} />
          <Route path="/admin/notifications" element={<AdminWrapper><AdminNotifications /></AdminWrapper>} />
          <Route path="/admin/campaigns" element={<AdminWrapper><AdminCampaigns /></AdminWrapper>} />
          <Route path="/admin/badges" element={<AdminWrapper><AdminBadges /></AdminWrapper>} />

          {/* Finance — double-entry ledger (P1) */}
          <Route path="/admin/finance" element={<AdminWrapper><AdminFinanceDashboard /></AdminWrapper>} />
          <Route path="/admin/finance/journal" element={<AdminWrapper><AdminJournal /></AdminWrapper>} />
          <Route path="/admin/finance/ledger" element={<AdminWrapper><AdminLedger /></AdminWrapper>} />

          {/* System — bare /admin/system has no page; send it to the dashboard */}
          <Route path="/admin/system" element={<Navigate to="/super-dashboard" replace />} />

          {/* System — Staff & Roles, Audit Logs (M1) */}
          <Route path="/admin/staff" element={<AdminWrapper><AdminStaff /></AdminWrapper>} />
          <Route path="/admin/system/audit" element={<AdminWrapper><AdminAudit /></AdminWrapper>} />
          <Route path="/admin/system/reserved" element={<AdminWrapper><AdminReservedSlugs /></AdminWrapper>} />
          <Route path="/admin/security/blocked-ips" element={<AdminWrapper><AdminBlockedIps /></AdminWrapper>} />

          {/* Marketing & performance insights — now a SuperDashboard tab; keep old path as redirect */}
          <Route path="/admin/insights" element={<Navigate to="/super-dashboard/insights" replace />} />

          {/* Departments — index grid + per-department hub pages */}
          <Route path="/admin/dept" element={<AdminWrapper><AdminDepartments /></AdminWrapper>} />
          <Route path="/admin/dept/:dept" element={<AdminWrapper><AdminDepartment /></AdminWrapper>} />

          {/* Platform Control */}
          <Route path="/admin/features" element={<AdminWrapper><AdminFeatureStatus /></AdminWrapper>} />

          {/* General settings */}
          <Route path="/admin/settings" element={<AdminWrapper><AdminSettings /></AdminWrapper>} />
          <Route path="/admin/settings/payment" element={<AdminWrapper><AdminPaymentSettings /></AdminWrapper>} />

          {/* Explore page */}
          <Route path="/explore" element={<Explore />} />

          {/* Services directory — public SEO (profession-scoped listing pages) */}
          <Route path="/services" element={<ServicesDirectory />} />
          <Route path="/services/:profession" element={<ProfessionServices />} />

          {/* Profession marketing landing pages (/for/:profession) — sell BAS per profession */}
          <Route path="/for/:profession" element={<ProfessionLanding />} />

          {/* Feature marketing pages (/features/:slug) — own header/footer, nav hidden */}
          <Route path="/features/:slug" element={<FeaturePage />} />

          {/* Support / Contact — placeholders; MUST precede the /:profileSlug catch-all */}
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/get-in-touch" element={<Contact />} />
          <Route path="/enterprise" element={<Enterprise />} />

          {/* Branded error pages — config-driven (see config/errorCatalog.js).
              One <ErrorPage> component renders all of them; adding a code = a
              catalog entry + a <Route> here + the segment in reservedSegments.js.
              Static paths out-rank the /:profileSlug catch-all in RR v6, but they
              MUST precede it (and be reserved) so a user can't claim "/404". */}
          <Route path="/400" element={<ErrorPage code={400} />} />
          <Route path="/401" element={<ErrorPage code={401} />} />
          <Route path="/403" element={<ErrorPage code={403} />} />
          <Route path="/404" element={<ErrorPage code={404} />} />
          <Route path="/405" element={<ErrorPage code={405} />} />
          <Route path="/408" element={<ErrorPage code={408} />} />
          <Route path="/409" element={<ErrorPage code={409} />} />
          <Route path="/410" element={<ErrorPage code={410} />} />
          <Route path="/413" element={<ErrorPage code={413} />} />
          <Route path="/415" element={<ErrorPage code={415} />} />
          <Route path="/422" element={<ErrorPage code={422} />} />
          <Route path="/429" element={<ErrorPage code={429} />} />
          <Route path="/500" element={<ErrorPage code={500} />} />
          <Route path="/502" element={<ErrorPage code={502} />} />
          <Route path="/503" element={<ErrorPage code={503} />} />
          <Route path="/504" element={<ErrorPage code={504} />} />
          {/* /maintenance is a friendly alias for the 503 maintenance page. */}
          <Route path="/maintenance" element={<ErrorPage code={503} />} />
          {/* /offline — reachable now; the Service Worker will serve it from
              cache in a follow-up branch. */}
          <Route path="/offline" element={<Offline />} />

          {/* Public host/service pages — specific before dynamic */}
          <Route path="/:profileSlug/badges" element={<BadgeShowcase />} />
          <Route path="/:profileSlug/product/:productId" element={<ProductPurchase />} />
          <Route path="/:profileSlug/booking" element={<BookingRedirect />} />
          <Route path="/:profileSlug/booking/:serviceSlug" element={<ServiceBooking />} />
          <Route path="/:profileSlug/:serviceSlug" element={<ServiceDetail />} />
          <Route path="/:profileSlug" element={<HostProfile />} />

          {/* Guest (customer) space — /user/* . A host hitting these is bounced to
              /dashboard by GuestRoute; a guest hitting /dashboard/* is bounced here.
              GuestLayout wraps them in the traveler shell (persistent tab bar). */}
          <Route element={<GuestRoute><GuestLayout /></GuestRoute>}>
            <Route path="/user/my-bookings" element={<CustomerBookings />} />
            <Route path="/user/profile" element={<CustomerProfile />} />
            <Route path="/user/reviews" element={<CustomerReviews />} />
            <Route path="/user/loyalty" element={<Loyalty />} />
          </Route>

          {/* Leave a review for one completed booking (booking-completed email CTA).
              Shared + ownership-checked: either party to a booking may use it, so it
              stays role-agnostic and top-level — NOT under /user. */}
          <Route path="/review/:bookingId" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

          {/* Public, token-authorized guest self-service (MF3 #516). No auth guard —
              the signed manage-booking token IS the auth. Reachable by an anonymous
              (no-session) guest from their confirmation link / email. */}
          <Route path="/manage-booking/:token" element={<ManageBooking />} />

          {/* Backward-compat: old flat guest paths → /user/* (in-flight emails, bookmarks). */}
          <Route path="/my-bookings" element={<Navigate to="/user/my-bookings" replace />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
          <Route path="/reviews" element={<Navigate to="/user/reviews" replace />} />
          <Route path="/loyalty" element={<Navigate to="/user/loyalty" replace />} />

          {/* Unknown URL → branded 404 (same component as the /404 route). */}
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </Suspense>
      {footerMode === 'minimal'
        ? !chromeHidden && <Footer variant="minimal" />
        : !hideFooter && <Footer variant={isBookingPage ? 'minimal' : 'full'} />}
      </RouteErrorBoundary>
      {!hideBot && <Suspense fallback={null}><BotWidget /></Suspense>}
    </ChromeContext.Provider>
  );
}

export default App;
