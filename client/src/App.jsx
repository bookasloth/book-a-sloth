import { Suspense, useState, useMemo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import lazyWithRetry from './utils/lazyWithRetry';

// lazyWithRetry wraps React.lazy: it retries transient chunk-fetch failures and,
// on a stale-chunk-after-deploy 404, does a one-shot full reload to pull the
// fresh build — instead of throwing an unrecoverable white screen.
const lazy = lazyWithRetry;

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
const Support        = lazy(() => import('./pages/Support'));
const Contact        = lazy(() => import('./pages/Contact'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const Terms          = lazy(() => import('./pages/Terms'));
const Refund         = lazy(() => import('./pages/Refund'));
const Unsubscribe    = lazy(() => import('./pages/Unsubscribe'));
const About          = lazy(() => import('./pages/About'));
const Careers        = lazy(() => import('./pages/Careers'));
const JobDetail      = lazy(() => import('./pages/JobDetail'));

// Paid-traffic landing pages (/lp/*) — own header/footer, global nav hidden
const TopmateVsBookASloth = lazy(() => import('./pages/lp/TopmateVsBookASloth'));
const CalendlyAlternative  = lazy(() => import('./pages/lp/CalendlyAlternative'));

// Vendor Google auth (Google-only signup/login)
const BeASloth       = lazy(() => import('./pages/BeASloth'));
const HostLogin      = lazy(() => import('./pages/HostLogin'));
const Changelog      = lazy(() => import('./pages/Changelog'));
const Pricing        = lazy(() => import('./pages/Pricing'));
const Blog           = lazy(() => import('./pages/Blog'));
const BlogPost       = lazy(() => import('./pages/BlogPost'));
const GoogleAuthDone = lazy(() => import('./pages/GoogleAuthDone'));

// Vendor Onboarding (Google-first 7-step flow)
const GoogleStart     = lazy(() => import('./pages/onboarding/GoogleStart'));
const SlugClaim       = lazy(() => import('./pages/onboarding/SlugClaim'));
const AboutYouStep    = lazy(() => import('./pages/onboarding/AboutYouStep'));
const CategoryStep    = lazy(() => import('./pages/onboarding/CategoryStep'));
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
const Transactions = lazy(() => import('./pages/Transactions'));
const Feedback     = lazy(() => import('./pages/Feedback'));

// Service Module v2
const ServicesList = lazy(() => import('./pages/services/ServicesList'));
const AddService   = lazy(() => import('./pages/services/AddService'));
const EditService  = lazy(() => import('./pages/services/EditService'));

// Customer (guest) pages
const CustomerBookings = lazy(() => import('./pages/CustomerBookings'));
const CustomerProfile  = lazy(() => import('./pages/CustomerProfile'));
const CustomerReviews  = lazy(() => import('./pages/CustomerReviews'));
const ReviewPage       = lazy(() => import('./pages/ReviewPage'));
const Loyalty          = lazy(() => import('./pages/Loyalty'));

// Public host / service pages
const HostProfile     = lazy(() => import('./pages/HostProfile'));
const ServiceBooking  = lazy(() => import('./pages/ServiceBooking'));
const ServiceDetail   = lazy(() => import('./pages/ServiceDetail'));
const ProductPurchase = lazy(() => import('./pages/ProductPurchase'));

// Admin — Dashboard
const SuperDashboard = lazy(() => import('./pages/admin/SuperDashboard'));

// Admin — Core
const AdminUsers    = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPaymentSettings = lazy(() => import('./pages/admin/AdminPaymentSettings'));

// Admin — People
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'));
const AdminKYC       = lazy(() => import('./pages/admin/AdminKYC'));

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
const AdminBlockedIps = lazy(() => import('./pages/admin/AdminBlockedIps'));

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

function DashboardWrapper({ children }) {
  return <HostRoute><DashboardLayout>{children}</DashboardLayout></HostRoute>;
}

// SECURITY: AdminWrapper does NOT use ProtectedRoute (which checks vendor/user session).
// AdminLayout has its own isolated guard that checks the 'bas_admin' session only.
// A vendor/user with no admin session is redirected to /hello-sloth, not /login.
function AdminWrapper({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  const location = useLocation();
  const { user } = useAuth();

  // Full-bleed pages (error / offline) flip this on via ChromeContext so the
  // global Navbar + Footer drop — even the catch-all 404, whose URL is unknown
  // ahead of time and so can't be matched by a pathname prefix.
  const [chromeHidden, setChromeHidden] = useState(false);
  const chromeValue = useMemo(() => ({ setChromeHidden }), []);

  const hideNavbar =
    chromeHidden ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/super-dashboard') ||
    location.pathname.startsWith('/vendor-register') ||
    location.pathname.startsWith('/lp') ||
    location.pathname === '/hello-sloth';

  const hideFooter = hideNavbar || !!user; // public/app boundary AND only when logged out

  return (
    <ChromeContext.Provider value={chromeValue}>
      <ScrollToTop />
      <Toaster position="top-right" />
      <AnalyticsBridge />
      {/* Keep error / offline pages a clean single card — consent is still
          surfaced on every normal page. */}
      {!chromeHidden && (
        <ConsentBanner variant={location.pathname.startsWith('/lp') ? 'slim' : 'full'} />
      )}
      {!hideNavbar && <Navbar />}
      <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          {/* Paid-traffic landing pages — own header/footer, nav hidden */}
          <Route path="/lp/topmate-vs-bookasloth" element={<TopmateVsBookASloth />} />
          <Route path="/lp/calendly-alternative" element={<CalendlyAlternative />} />
          {/* Unknown /lp/* slug → home (friendlier than a bare 404 for ad traffic) */}
          <Route path="/lp/*" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/help" element={<Help />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:jobSlug" element={<JobDetail />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
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
          <Route path="/vendor-register/:slug/category" element={<CategoryStep />} />
          <Route path="/vendor-register/:slug/whatsapp" element={<WhatsAppStep />} />
          <Route path="/vendor-register/:slug/plan"     element={<PlansStep />} />
          <Route path="/vendor-register/:slug/live"     element={<ExploreWithBolt />} />

          {/* Admin login */}
          <Route path="/hello-sloth" element={<AdminLogin />} />

          {/* Vendor dashboard */}
          <Route path="/dashboard" element={<DashboardWrapper><Dashboard /></DashboardWrapper>} />
          <Route path="/dashboard/bookings" element={<DashboardWrapper><Bookings /></DashboardWrapper>} />
          <Route path="/dashboard/earnings" element={<DashboardWrapper><Earnings /></DashboardWrapper>} />
          <Route path="/dashboard/services" element={<DashboardWrapper><ServicesList /></DashboardWrapper>} />
          <Route path="/dashboard/service/add-new" element={<DashboardWrapper><AddService /></DashboardWrapper>} />
          <Route path="/dashboard/service/edit/:id" element={<DashboardWrapper><EditService /></DashboardWrapper>} />
          <Route path="/dashboard/service/view/:id" element={<DashboardWrapper><EditService /></DashboardWrapper>} />
          <Route path="/dashboard/availability" element={<DashboardWrapper><Availability /></DashboardWrapper>} />
          <Route path="/dashboard/profile" element={<DashboardWrapper><ProfileSetup /></DashboardWrapper>} />
          <Route path="/dashboard/products" element={<DashboardWrapper><Products /></DashboardWrapper>} />
          <Route path="/dashboard/upgrade" element={<DashboardWrapper><UpgradePlan /></DashboardWrapper>} />
          <Route path="/dashboard/payments/payouts" element={<DashboardWrapper><Payouts /></DashboardWrapper>} />
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
          <Route path="/admin/services/featured" element={<AdminWrapper><AdminServices /></AdminWrapper>} />

          {/* Operations */}
          <Route path="/admin/addons" element={<AdminWrapper><AdminAddons /></AdminWrapper>} />
          <Route path="/admin/plans" element={<AdminWrapper><AdminPlans /></AdminWrapper>} />
          <Route path="/admin/professions" element={<AdminWrapper><AdminCategories /></AdminWrapper>} />
          <Route path="/admin/explore"     element={<AdminWrapper><AdminExplore /></AdminWrapper>} />

          {/* People */}
          <Route path="/admin/providers/:status" element={<AdminWrapper><AdminProviders /></AdminWrapper>} />
          <Route path="/admin/users" element={<AdminWrapper><AdminUsers /></AdminWrapper>} />
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

          {/* System — Staff & Roles, Audit Logs (M1) */}
          <Route path="/admin/staff" element={<AdminWrapper><AdminStaff /></AdminWrapper>} />
          <Route path="/admin/system/audit" element={<AdminWrapper><AdminAudit /></AdminWrapper>} />
          <Route path="/admin/system/reserved" element={<AdminWrapper><AdminReservedSlugs /></AdminWrapper>} />
          <Route path="/admin/security/blocked-ips" element={<AdminWrapper><AdminBlockedIps /></AdminWrapper>} />

          {/* Marketing & performance insights — now a SuperDashboard tab; keep old path as redirect */}
          <Route path="/admin/insights" element={<Navigate to="/super-dashboard/insights" replace />} />

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

          {/* Support / Contact — placeholders; MUST precede the /:profileSlug catch-all */}
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/get-in-touch" element={<Contact />} />

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

          {/* Backward-compat: old flat guest paths → /user/* (in-flight emails, bookmarks). */}
          <Route path="/my-bookings" element={<Navigate to="/user/my-bookings" replace />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
          <Route path="/reviews" element={<Navigate to="/user/reviews" replace />} />
          <Route path="/loyalty" element={<Navigate to="/user/loyalty" replace />} />

          {/* Unknown URL → branded 404 (same component as the /404 route). */}
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </Suspense>
      </RouteErrorBoundary>
      {!hideFooter && <Footer />}
    </ChromeContext.Provider>
  );
}

export default App;
