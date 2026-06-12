import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import DashboardLayout from './components/common/DashboardLayout';
import AdminLayout from './components/common/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// ── Route-level lazy loading ──────────────────────────────────────────────────
// Layout / guard components stay eager (always needed, small).
// Every page component is lazy — only downloaded when the route is visited.

// Public pages
const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const VendorSignup   = lazy(() => import('./pages/VendorSignup'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// Vendor Google auth (Google-only signup/login)
const BeASloth       = lazy(() => import('./pages/BeASloth'));
const VendorLogin    = lazy(() => import('./pages/VendorLogin'));
const GoogleAuthDone = lazy(() => import('./pages/GoogleAuthDone'));

// Vendor Onboarding (10-step flow)
const SlugClaim        = lazy(() => import('./pages/onboarding/SlugClaim'));
const OtpVerify        = lazy(() => import('./pages/onboarding/OtpVerify'));
const PasswordStep     = lazy(() => import('./pages/onboarding/PasswordStep'));
const VendorTypeStep   = lazy(() => import('./pages/onboarding/VendorTypeStep'));
const CategoryStep     = lazy(() => import('./pages/onboarding/CategoryStep'));
const BookingTypeStep  = lazy(() => import('./pages/onboarding/BookingTypeStep'));
const CalendarStep     = lazy(() => import('./pages/onboarding/CalendarStep'));
const ProfileStep      = lazy(() => import('./pages/onboarding/ProfileStep'));
const FirstServiceStep = lazy(() => import('./pages/onboarding/FirstServiceStep'));
const PlansStep        = lazy(() => import('./pages/onboarding/PlansStep'));
const ExploreWithBolt  = lazy(() => import('./pages/onboarding/ExploreWithBolt'));

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

// Service Module v2
const ServicesList = lazy(() => import('./pages/services/ServicesList'));
const AddService   = lazy(() => import('./pages/services/AddService'));
const EditService  = lazy(() => import('./pages/services/EditService'));

// Customer (guest) pages
const CustomerBookings = lazy(() => import('./pages/CustomerBookings'));

// Public host / service pages
const HostProfile     = lazy(() => import('./pages/HostProfile'));
const ServiceBooking  = lazy(() => import('./pages/ServiceBooking'));
const ServiceDetail   = lazy(() => import('./pages/ServiceDetail'));
const ProductPurchase = lazy(() => import('./pages/ProductPurchase'));

// Admin — Dashboard
const SuperDashboard = lazy(() => import('./pages/admin/SuperDashboard'));
const AdminOverview  = lazy(() => import('./pages/admin/AdminOverview'));

// Admin — Core
const AdminUsers    = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Admin — People
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'));
const AdminKYC       = lazy(() => import('./pages/admin/AdminKYC'));

// Admin — Finance
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminEarnings     = lazy(() => import('./pages/admin/AdminEarnings'));
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

// Admin — Platform
const AdminAppearance    = lazy(() => import('./pages/admin/AdminAppearance'));
const AdminMenuBuilder   = lazy(() => import('./pages/admin/AdminMenuBuilder'));
const AdminFooterBuilder = lazy(() => import('./pages/admin/AdminFooterBuilder'));
const AdminCommunication = lazy(() => import('./pages/admin/AdminCommunication'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminBadges        = lazy(() => import('./pages/admin/AdminBadges'));
const BadgeShowcase      = lazy(() => import('./pages/BadgeShowcase'));

// Admin — Operations
const AdminPlans  = lazy(() => import('./pages/admin/AdminPlans'));
const AdminAddons = lazy(() => import('./pages/admin/AdminAddons'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));

// Admin — System (M1: RBAC foundation)
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));

// ── Fallback shown while a route chunk downloads ──────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-[#FE5100] border-t-transparent rounded-full animate-spin" />
  </div>
);

function DashboardWrapper({ children }) {
  return <ProtectedRoute><DashboardLayout>{children}</DashboardLayout></ProtectedRoute>;
}

// SECURITY: AdminWrapper does NOT use ProtectedRoute (which checks vendor/user session).
// AdminLayout has its own isolated guard that checks the 'bas_admin' session only.
// A vendor/user with no admin session is redirected to /hello-sloth, not /login.
function AdminWrapper({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === '/' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/super-dashboard') ||
    location.pathname.startsWith('/vendor-register') ||
    location.pathname === '/hello-sloth';

  return (
    <>
      <Toaster position="top-right" />
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Customers never register — accounts are created automatically
              during booking (phone OTP). Old signup URL redirects home. */}
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/vendor/signup" element={<VendorSignup />} />

          {/* Vendor auth — Google-only */}
          <Route path="/be-a-sloth" element={<BeASloth />} />
          <Route path="/login-as-vendor" element={<VendorLogin />} />
          <Route path="/auth/google/done" element={<GoogleAuthDone />} />

          {/* Vendor Onboarding (10-step flow) */}
          <Route path="/vendor-register" element={<SlugClaim />} />
          <Route path="/vendor-register/:slug/verify" element={<OtpVerify />} />
          <Route path="/vendor-register/:slug/password" element={<PasswordStep />} />
          <Route path="/vendor-register/:slug/type" element={<VendorTypeStep />} />
          <Route path="/vendor-register/:slug/category" element={<CategoryStep />} />
          <Route path="/vendor-register/:slug/booking-type" element={<BookingTypeStep />} />
          <Route path="/vendor-register/:slug/calendar" element={<CalendarStep />} />
          <Route path="/vendor-register/:slug/profile" element={<ProfileStep />} />
          <Route path="/vendor-register/:slug/first-service" element={<FirstServiceStep />} />
          <Route path="/vendor-register/:slug/plans" element={<PlansStep />} />
          <Route path="/vendor-register/:slug/explore" element={<ExploreWithBolt />} />

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
          <Route path="/admin/services/categories" element={<AdminWrapper><AdminServices /></AdminWrapper>} />
          <Route path="/admin/services/featured" element={<AdminWrapper><AdminServices /></AdminWrapper>} />

          {/* Operations */}
          <Route path="/admin/addons" element={<AdminWrapper><AdminAddons /></AdminWrapper>} />
          <Route path="/admin/plans" element={<AdminWrapper><AdminPlans /></AdminWrapper>} />
          <Route path="/admin/professions" element={<AdminWrapper><AdminCategories /></AdminWrapper>} />

          {/* People */}
          <Route path="/admin/providers/:status" element={<AdminWrapper><AdminProviders /></AdminWrapper>} />
          <Route path="/admin/users" element={<AdminWrapper><AdminUsers /></AdminWrapper>} />
          <Route path="/admin/kyc/:status" element={<AdminWrapper><AdminKYC /></AdminWrapper>} />

          {/* Finance */}
          <Route path="/admin/finance/transactions" element={<AdminWrapper><AdminTransactions /></AdminWrapper>} />
          <Route path="/admin/finance/earnings" element={<AdminWrapper><AdminEarnings /></AdminWrapper>} />
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

          {/* Platform */}
          <Route path="/admin/platform/appearance" element={<AdminWrapper><AdminAppearance /></AdminWrapper>} />
          <Route path="/admin/platform/menu" element={<AdminWrapper><AdminMenuBuilder /></AdminWrapper>} />
          <Route path="/admin/platform/footer" element={<AdminWrapper><AdminFooterBuilder /></AdminWrapper>} />
          <Route path="/admin/platform/communication" element={<AdminWrapper><AdminCommunication /></AdminWrapper>} />
          <Route path="/admin/notifications" element={<AdminWrapper><AdminNotifications /></AdminWrapper>} />
          <Route path="/admin/badges" element={<AdminWrapper><AdminBadges /></AdminWrapper>} />

          {/* System — Staff & Roles, Audit Logs (M1) */}
          <Route path="/admin/staff" element={<AdminWrapper><AdminStaff /></AdminWrapper>} />
          <Route path="/admin/system/audit" element={<AdminWrapper><AdminAudit /></AdminWrapper>} />

          {/* General settings */}
          <Route path="/admin/settings" element={<AdminWrapper><AdminSettings /></AdminWrapper>} />

          {/* Public host/service pages — specific before dynamic */}
          <Route path="/:profileSlug/badges" element={<BadgeShowcase />} />
          <Route path="/:profileSlug/product/:productId" element={<ProductPurchase />} />
          <Route path="/:profileSlug/booking/:serviceSlug" element={<ServiceBooking />} />
          <Route path="/:profileSlug/:serviceSlug" element={<ServiceDetail />} />
          <Route path="/:profileSlug" element={<HostProfile />} />

          {/* Guests land here after login — dedicated read-only bookings list
              (no longer the vendor Dashboard). */}
          <Route path="/my-bookings" element={<ProtectedRoute><CustomerBookings /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
