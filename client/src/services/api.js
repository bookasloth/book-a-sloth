import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  // SECURITY: Admin routes ONLY use the isolated 'bas_admin' session.
  // There is NO fallback to the vendor/user session.
  // A vendor token sent to an admin route will be rejected server-side.
  const isAdminRoute = config.url?.startsWith('/admin') || config.url?.startsWith('/admin-auth');
  const key     = isAdminRoute ? 'bas_admin' : 'user';
  const session = JSON.parse(localStorage.getItem(key) || 'null');
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

// BUG-08 fixed: intercept 401s, try to refresh the token, retry once, else logout
import supabase from './supabaseClient';
let isRefreshing = false;
let refreshQueue = [];

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // SECURITY: Admin route 401 → clear admin session, redirect to admin login.
      // Never attempt Supabase token refresh for admin routes.
      const isAdminRoute = original.url?.startsWith('/admin') || original.url?.startsWith('/admin-auth');
      if (isAdminRoute) {
        localStorage.removeItem('bas_admin');
        window.location.href = '/hello-sloth';
        return Promise.reject(error);
      }

      // Vendor/user 401 → try Supabase token refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API.request(original);
        });
      }
      isRefreshing = true;
      try {
        const stored = JSON.parse(localStorage.getItem('user'));
        if (stored?.refresh_token) {
          const { data, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: stored.refresh_token,
          });
          if (!refreshError && data.session) {
            const updated = {
              ...stored,
              token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            };
            localStorage.setItem('user', JSON.stringify(updated));
            const newToken = data.session.access_token;
            refreshQueue.forEach((p) => p.resolve(newToken));
            refreshQueue = [];
            original.headers.Authorization = `Bearer ${newToken}`;
            return API.request(original);
          }
        }
      } catch (_) {
        // fall through to logout
      } finally {
        isRefreshing = false;
      }
      localStorage.removeItem('user');
      refreshQueue.forEach((p) => p.reject(new Error('Session expired')));
      refreshQueue = [];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const registerVendor   = (data)         => API.post('/auth/register/vendor', data);
export const registerUser     = (data)         => API.post('/auth/register/user', data);
export const loginUser        = (data)         => API.post('/auth/login', data);
export const getMe            = ()             => API.get('/auth/me');
export const updateMe         = (data)         => API.put('/auth/me', data);
export const getGoogleAuthUrl = ()             => API.get('/auth/google');
// Vendor Google auth (public): one consent screen = identity + calendar scopes
export const getVendorGoogleUrl = (intent = 'login') => API.get('/auth/google/vendor', { params: { intent } });
export const sendOtp          = (data)         => API.post('/auth/send-otp', data);
export const verifyOtp        = (data)         => API.post('/auth/verify-otp', data);
// Phone-primary user login
export const loginWithPhone   = (data)         => API.post('/auth/login-phone', data);
export const verifyOtpLogin   = (data)         => API.post('/auth/verify-otp-login', data);
export const setUserPassword  = (data)         => API.post('/auth/set-password', data);
export const forgotPassword   = (data)         => API.post('/auth/forgot-password', data);
export const resetPassword    = (data)         => API.post('/auth/reset-password', data);

// ── Newsletter (public) — backend route /email/subscribe is PENDING.
// Caller treats this best-effort: on failure it still captures the lead
// client-side (mirrors the /lp client-only lead pattern).
export const subscribeNewsletter = (email)     => API.post('/email/subscribe', { email });

// ── Email preferences (public, signed-token gated) ────────────
export const getUnsubscribeStatus = (token)    => API.get('/email/unsubscribe', { params: { token } });
export const unsubscribeEmail     = (token)    => API.post('/email/unsubscribe', { token });
export const resubscribeEmail     = (token)    => API.post('/email/resubscribe', { token });

// ── Admin Auth (separate endpoint — /hello-sloth login) ───────
// Single-step login: username/email + password -> isolated admin session token.
export const adminLoginUser   = (data)         => API.post('/admin-auth/login', data);
export const adminChangePassword = (data)      => API.post('/admin-auth/change-password', data);
export const adminGetMe       = ()             => API.get('/admin-auth/me');
// 2FA (TOTP) — pending_token from login travels in the body, not the auth header.
export const admin2faSetup    = (data)         => API.post('/admin-auth/2fa-setup', data);
export const admin2faConfirm  = (data)         => API.post('/admin-auth/2fa-confirm', data);
export const admin2faVerify   = (data)         => API.post('/admin-auth/2fa-verify', data);

// ── Admin: Operations Center ──────────────────────────────────
export const adminOpsSummary  = ()             => API.get('/admin/ops/summary');

// ── Admin: image upload (badges, branding, CMS) ───────────────
// Sends multipart/form-data; the request interceptor attaches the bas_admin token.
export const adminUploadImage = (file, folder = 'badges') => {
  const fd = new FormData();
  fd.append('image', file);
  return API.post(`/admin/upload/image?folder=${encodeURIComponent(folder)}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Appearance — navbar logo ──────────────────────────────────
export const getAppearance         = ()            => API.get('/appearance');            // public
export const adminGetAppearance    = ()            => API.get('/admin/appearance');
export const adminUpdateAppearance = (data)        => API.put('/admin/appearance', data);

// ── Admin: Staff & Roles (Super Admin only) ───────────────────
export const adminListRoles        = ()            => API.get('/admin/roles');
export const adminListStaff        = ()            => API.get('/admin/staff');
export const adminGetStaff         = (id)          => API.get(`/admin/staff/${id}`);
export const adminCreateStaff      = (data)        => API.post('/admin/staff', data);
export const adminUpdateStaff      = (id, data)    => API.put(`/admin/staff/${id}`, data);
export const adminSetStaffActive   = (id, active)  => API.patch(`/admin/staff/${id}/status`, { is_active: active });
export const adminResetStaffPass   = (id, data)    => API.post(`/admin/staff/${id}/reset-password`, data || {});

// ── Admin: Audit log ──────────────────────────────────────────
export const adminAuditLogs    = (params)      => API.get('/admin/audit', { params });
export const adminAuditActions = ()            => API.get('/admin/audit/actions');

// ── Financial ledger (P1) ──
export const adminFinanceSummary      = ()            => API.get('/admin/finance/summary');
export const adminFinanceAccounts     = ()            => API.get('/admin/finance/accounts');
export const adminFinanceJournals     = (params)      => API.get('/admin/finance/journals', { params });
export const adminFinanceJournal      = (id)          => API.get(`/admin/finance/journals/${id}`);
export const adminFinanceLedger       = (accountId, params) => API.get(`/admin/finance/ledger/${accountId}`, { params });
export const adminFinanceAdjustment   = (data)        => API.post('/admin/finance/adjustment', data);
export const adminFinanceReversal     = (data)        => API.post('/admin/finance/reversal', data);
export const adminFinanceBankTransfer = (data)        => API.post('/admin/finance/bank-transfer', data);

// Admin — Payout approval
export const adminGetPayouts     = (status)         => API.get('/admin/payouts', { params: status ? { status } : {} });
export const adminApprovePayout  = (id)             => API.post(`/admin/payouts/${id}/approve`);
export const adminRejectPayout   = (id, reason)     => API.post(`/admin/payouts/${id}/reject`, { reason });
export const adminMarkPayoutPaid = (id, reference)  => API.post(`/admin/payouts/${id}/pay`, { payment_reference: reference });

// ── Vendor Onboarding (Google-first flow) ─────────────────────
// Removed in onboarding reshape (server endpoints deleted):
//   sendOnboardingOtp, verifyOnboardingOtp, createVendorAccount, checkSlugAvailable
export const checkOnboardingSlug  = (slug)             => API.post('/onboarding/slug-available', { slug });
export const claimOnboardingSlug  = (slug)             => API.post('/onboarding/claim-slug', { slug });
export const updateOnboardingStep = (data)             => API.post('/onboarding/update-step', data);
export const getOnboardingStatus  = ()                 => API.get('/onboarding/status');
export const whatsappSendOtp      = (phone)            => API.post('/whatsapp/send-otp', { phone });
export const whatsappVerifyOtp    = (phone, otp)       => API.post('/whatsapp/verify-otp', { phone, otp });
export const activateFreePlan     = ()                 => API.post('/onboarding/activate-free');
export const advanceToLive        = ()                 => API.post('/onboarding/advance-to-live');
export const markOnboardingComplete = ()               => API.post('/onboarding/mark-complete');

// ── Categories / professions ──────────────────────────────────
export const getCategories       = ()        => API.get('/categories');
export const suggestCategory     = (label)   => API.post('/categories/suggest', { label });
export const adminListCategories = (params)  => API.get('/admin/categories', { params });
export const adminCreateCategory = (data)    => API.post('/admin/categories', data);
export const adminUpdateCategory = (id, data) => API.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id)      => API.delete(`/admin/categories/${id}`);
export const hostGetCategories      = ()         => API.get('/host/categories');
export const hostUpdateCategories   = (payload)  => API.put('/host/categories', payload);
export const adminSetUserCategories = (id, data) => API.patch(`/admin/users/${id}/categories`, data);

// ── Host ──────────────────────────────────────────────────────
export const getHostProfile   = (username)       => API.get(`/host/${username}`);
export const getServiceBySlug = (username, slug) => API.get(`/host/${username}/${slug}`);
export const updateProfile    = (data)           => API.put('/host/profile', data);
// Permanent username (gated: WhatsApp-verified, max 2/365d, 6-month gap).
export const changeUsername   = (username)       => API.put('/host/username', { username });
export const checkUsername    = (slug)           => API.get(`/username/check/${encodeURIComponent(slug)}`);
export const createService    = (data)           => API.post('/host/services', data);
export const getMyServices    = ()               => API.get('/host/services');
export const updateService    = (id, data)       => API.put(`/host/services/${id}`, data);
export const deleteService    = (id)             => API.delete(`/host/services/${id}`);
export const setAvailability  = (data)           => API.put('/host/availability', data);
export const getAvailability  = ()               => API.get('/host/availability');
export const searchVendors    = (q)              => API.get('/host/search', { params: { q } });

// ── Bookings ──────────────────────────────────────────────────
export const createBooking     = (data)            => API.post('/bookings', data);
export const getHostBookings   = ()                => API.get('/bookings/host');
export const getGuestBookings  = ()                => API.get('/bookings/guest');
export const cancelBooking     = (id)              => API.put(`/bookings/${id}/cancel`);
export const completeBooking   = (id)              => API.put(`/bookings/${id}/complete`);
export const rescheduleBooking = (id, data)        => API.put(`/bookings/${id}/reschedule`, data);
export const getBookedSlots    = (host_id, date)   => API.get('/bookings/slots', { params: { host_id, date } });
// v2.5: server-computed availability (working hours − bookings − Google busy − blocked dates)
export const getAvailableSlots = (host_id, service_id, date) =>
  API.get('/bookings/available-slots', { params: { host_id, service_id, date } });

// ── Payments ──────────────────────────────────────────────────
export const createPaymentOrder   = (data) => API.post('/payment/create-order', data);
export const verifyPayment        = (data) => API.post('/payment/verify', data);
export const subscribePlan        = (data) => API.post('/payment/subscribe', data);
export const verifySubscription   = (data) => API.post('/payment/verify-subscription', data);
// Auto-renewing subscriptions (Razorpay Subscriptions)
export const createSubscription   = (data) => API.post('/payment/subscription/create', data);
export const syncSubscription     = ()     => API.post('/payment/subscription/sync');
export const cancelSubscription   = ()     => API.post('/payment/subscription/cancel');
export const createProductOrder   = (data) => API.post('/payment/create-product-order', data);
export const verifyProductPayment = (data) => API.post('/payment/verify-product', data);

// ── Reviews ───────────────────────────────────────────────────
export const createReview       = (data)      => API.post('/reviews', data);
export const getReceivedReviews = ()          => API.get('/reviews/received');
export const getHostReviews     = (username)  => API.get(`/reviews/${username}`);
export const getBookingReview   = (id)        => API.get(`/reviews/booking/${id}`);

// ── Vendor feedback ──────────────────────────────────────────
export const submitFeedback  = (data)   => API.post('/feedback', data);
export const getMyFeedback   = ()       => API.get('/feedback/mine');

// ── Upload ────────────────────────────────────────────────────
export const uploadImage = (formData, folder = 'uploads') =>
  API.post(`/upload/image?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Uploads a single product file (field "file") to the products bucket.
// Returns { data: { url, name, size } }.
export const uploadProductFile = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post('/upload/product-file', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Vendor dashboard ──────────────────────────────────────────
export const getTransactions    = (params)    => API.get('/vendor/transactions', { params });
export const getPayoutBalance   = ()          => API.get('/vendor/payout/balance');
export const getPayoutRequests  = ()          => API.get('/vendor/payout/requests');
export const requestPayout      = (data)      => API.post('/vendor/payout/request', data);
export const toggleService      = (id)        => API.put(`/vendor/services/${id}/toggle`);

// ── Digital Products ──────────────────────────────────────────
export const createProduct       = (data)     => API.post('/products', data);
export const getMyProducts       = ()         => API.get('/products/mine/all');
export const updateProduct       = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct       = (id)       => API.delete(`/products/${id}`);
export const getHostProducts     = (username) => API.get(`/products/host/${username}`);
export const getProduct          = (id)       => API.get(`/products/${id}`);
export const downloadProduct     = (token)    => API.get(`/products/download/${token}`);
export const freeDownloadProduct = (data)     => API.post('/products/free-download', data);

// ── Admin ─────────────────────────────────────────────────────
export const adminGetStats       = ()          => API.get('/admin/stats');
export const adminGetInsights    = ()          => API.get('/admin/insights/kpis');
export const adminGetProviderPlanAnalytics = () => API.get('/admin/provider-plan-analytics');
export const adminGetUsers       = (params)    => API.get('/admin/users', { params });
export const adminGetUser        = (id)        => API.get(`/admin/users/${id}`);
export const adminUpdateUser     = (id, data)  => API.put(`/admin/users/${id}`, data);
export const adminDeleteUser     = (id)        => API.delete(`/admin/users/${id}`);
export const adminGetBookings    = (params)    => API.get('/admin/bookings', { params });
export const adminUpdateBooking  = (id, data)  => API.put(`/admin/bookings/${id}`, data);
export const adminDeleteBooking  = (id)        => API.delete(`/admin/bookings/${id}`);
export const adminGetServices    = ()          => API.get('/admin/services');
export const adminDeleteService  = (id)        => API.delete(`/admin/services/${id}`);
export const adminUpdateServiceSeo  = (id, data) => API.put(`/admin/services/${id}/seo`, data);
export const adminUpdateProviderSeo = (id, data) => API.put(`/admin/providers/${id}/seo`, data);
export const adminGetSettings    = ()          => API.get('/admin/settings');
export const adminUpdateSettings = (data)      => API.put('/admin/settings', data);

// ── Admin: Notification System ───────────────────────────────
export const adminGetNotifProvider    = ()         => API.get('/admin/notifications/provider');
export const adminUpdateNotifProvider = (data)     => API.put('/admin/notifications/provider', data);
export const adminTestNotifProvider   = ()         => API.post('/admin/notifications/provider/test');
export const adminGetNotifEvents      = ()         => API.get('/admin/notifications/events');
export const adminUpdateNotifEvent    = (id, data) => API.put(`/admin/notifications/events/${id}`, data);
export const adminTestNotifSend       = (data)     => API.post('/admin/notifications/test-send', data);
export const adminGetNotifLogs        = (params)   => API.get('/admin/notifications/logs', { params });
export const adminRetryNotifLog       = (id)       => API.post(`/admin/notifications/logs/${id}/retry`);

// ── Admin: Badge System ──────────────────────────────────────
export const adminGetBadgeMeta     = ()           => API.get('/admin/badges/meta');
export const adminListBadges       = (params)     => API.get('/admin/badges', { params });
export const adminGetBadge         = (id)         => API.get(`/admin/badges/${id}`);
export const adminCreateBadge      = (data)       => API.post('/admin/badges', data);
export const adminUpdateBadge      = (id, data)   => API.put(`/admin/badges/${id}`, data);
export const adminBadgeStatus      = (id, status) => API.patch(`/admin/badges/${id}/status`, { status });
export const adminPreviewBadge     = (id)         => API.get(`/admin/badges/${id}/preview`);
export const adminPreviewRules     = (data)       => API.post('/admin/badges/preview', data);
export const adminRunBadgeEval     = ()           => API.post('/admin/badges/evaluate');
export const adminVendorBadges     = (vendorId)         => API.get(`/admin/vendors/${vendorId}/badges`);
export const adminAssignBadge      = (vendorId, data)   => API.post(`/admin/vendors/${vendorId}/badges`, data);
export const adminRevokeBadge      = (vendorId, badgeId, reason) => API.delete(`/admin/vendors/${vendorId}/badges/${badgeId}`, { data: { reason } });

// ── Admin: Subscription Plans ────────────────────────────────
export const adminListPlans    = ()         => API.get('/admin/plans');
export const adminCreatePlan   = (data)     => API.post('/admin/plans', data);
export const adminUpdatePlan   = (id, data) => API.put(`/admin/plans/${id}`, data);
export const adminArchivePlan  = (id)       => API.patch(`/admin/plans/${id}/archive`);
export const adminRestorePlan  = (id)       => API.patch(`/admin/plans/${id}/restore`);
export const adminClonePlan    = (id)       => API.post(`/admin/plans/${id}/clone`);
export const adminReorderPlans = (order)    => API.patch('/admin/plans/reorder', { order });
export const adminAssignPlan   = (data)     => API.post('/admin/plans/assign', data);

// ── Admin: payment (Razorpay) settings ────────────────────────
export const adminGetRazorpay    = ()     => API.get('/admin/settings/payment/razorpay');
export const adminUpdateRazorpay = (data) => API.put('/admin/settings/payment/razorpay', data);
export const adminTestRazorpay   = (data) => API.post('/admin/settings/payment/razorpay/test', data);
export const getPublicPlans    = ()         => API.get('/plans');

// ── Admin: Email Communication Engine ────────────────────────
export const adminEmailTemplates   = (params)   => API.get('/admin/email/templates', { params });
export const adminEmailTemplate    = (id)       => API.get(`/admin/email/templates/${id}`);
export const adminEmailCreate      = (data)     => API.post('/admin/email/templates', data);
export const adminEmailUpdate      = (id, data) => API.put(`/admin/email/templates/${id}`, data);
export const adminEmailDuplicate   = (id)       => API.post(`/admin/email/templates/${id}/duplicate`);
export const adminEmailArchive     = (id)       => API.patch(`/admin/email/templates/${id}/archive`);
export const adminEmailPreview     = (id, data) => API.post(`/admin/email/templates/${id}/preview`, { data });
export const adminEmailTest        = (id, to)   => API.post(`/admin/email/templates/${id}/test`, { to });
export const adminEmailLogs        = (params)   => API.get('/admin/email/logs', { params });
export const adminEmailLog         = (id)       => API.get(`/admin/email/logs/${id}`);
export const adminEmailRetry       = (id)       => API.post(`/admin/email/logs/${id}/retry`);
export const adminEmailSettings    = ()         => API.get('/admin/email/settings');
export const adminEmailSaveSettings= (data)     => API.put('/admin/email/settings', data);
export const adminEmailEvents      = ()         => API.get('/admin/email/events');

// ── Admin: Campaigns (Phase 1: email) ────────────────────────
export const adminCampContacts     = (params)   => API.get('/admin/campaigns/contacts', { params });
export const adminCampSyncContacts = ()         => API.post('/admin/campaigns/contacts/sync');
export const adminCampSuppress     = (id, data) => API.patch(`/admin/campaigns/contacts/${id}`, data);
export const adminCampSegments     = ()         => API.get('/admin/campaigns/segments');
export const adminCampSegPreview   = (definition, channel = 'email') => API.post('/admin/campaigns/segments/preview', { definition, channel });
export const adminCampaigns        = ()         => API.get('/admin/campaigns');
export const adminCampCreate       = (data)     => API.post('/admin/campaigns', data);
export const adminCampGet          = (id)       => API.get(`/admin/campaigns/${id}`);
export const adminCampUpdate       = (id, data) => API.put(`/admin/campaigns/${id}`, data);
export const adminCampLaunch       = (id)       => API.post(`/admin/campaigns/${id}/launch`);
// WhatsApp template registry (AiSensy approved templates + variable mapping)
export const adminCampWaTemplates  = ()         => API.get('/admin/campaigns/wa-templates');
export const adminCampWaCreate     = (data)     => API.post('/admin/campaigns/wa-templates', data);
export const adminCampWaUpdate     = (id, data) => API.put(`/admin/campaigns/wa-templates/${id}`, data);

// ── Public: Badge Showcase ───────────────────────────────────
export const getVendorBadges       = (username)         => API.get(`/vendors/${username}/badges`);
export const getVendorBadgeDetail  = (username, badgeId) => API.get(`/vendors/${username}/badges/${badgeId}`);

export default API;

// ── Service Module v2 ─────────────────────────────────────────
export const svcCreate              = (data)                   => API.post('/services', data);
export const svcGetAll              = ()                       => API.get('/services');
export const svcGetById             = (id)                     => API.get(`/services/${id}`);
export const svcUpdate              = (id, data)               => API.put(`/services/${id}`, data);
export const svcDelete              = (id)                     => API.delete(`/services/${id}`);
export const svcDuplicate           = (id)                     => API.post(`/services/${id}/duplicate`);
export const svcToggle              = (id)                     => API.put(`/services/${id}/toggle`);
export const svcGetPublic           = (slug)                   => API.get(`/services/public/${slug}`);
// Clean URL: resolves service by both profileSlug + serviceSlug (validates vendor ownership)
export const svcGetPublicByProfile  = (profileSlug, serviceSlug) => API.get(`/services/public/${profileSlug}/${serviceSlug}`);

// ── Explore (public) ──────────────────────────────────────────
export const getExploreVendors    = (params) => API.get('/explore',            { params });
export const getExploreFeatured   = ()        => API.get('/explore/featured');
export const getExploreCategories = ()        => API.get('/explore/categories');
export const getExploreCollections= ()        => API.get('/explore/collections');
export const getExploreSponsored  = (keyword) => API.get('/explore/sponsored', { params: { keyword } });

// ── Explore (admin) ───────────────────────────────────────────
export const adminGetExploreFeatured        = ()         => API.get('/admin/explore/featured');
export const adminCreateExploreFeatured     = (data)     => API.post('/admin/explore/featured', data);
export const adminUpdateExploreFeatured     = (id, data) => API.put(`/admin/explore/featured/${id}`, data);
export const adminDeleteExploreFeatured     = (id)       => API.delete(`/admin/explore/featured/${id}`);

export const adminGetExploreCollections     = ()         => API.get('/admin/explore/collections');
export const adminCreateExploreCollection   = (data)     => API.post('/admin/explore/collections', data);
export const adminUpdateExploreCollection   = (id, data) => API.put(`/admin/explore/collections/${id}`, data);
export const adminAddToExploreCollection    = (id, data) => API.post(`/admin/explore/collections/${id}/vendors`, data);
export const adminRemoveFromExploreCollection = (id, vendorId) => API.delete(`/admin/explore/collections/${id}/vendors/${vendorId}`);

export const adminGetExploreBoosts          = ()         => API.get('/admin/explore/boosts');
export const adminCreateExploreBoost        = (data)     => API.post('/admin/explore/boosts', data);
export const adminRevokeExploreBoost        = (id)       => API.delete(`/admin/explore/boosts/${id}`);

export const adminGetExploreVerified        = ()         => API.get('/admin/explore/verified');
export const adminGrantExploreVerified      = (data)     => API.post('/admin/explore/verified', data);
export const adminRevokeExploreVerified     = (id)       => API.delete(`/admin/explore/verified/${id}`);

export const adminGetExploreKeywords        = ()         => API.get('/admin/explore/keywords');
export const adminCreateExploreKeyword      = (data)     => API.post('/admin/explore/keywords', data);
export const adminRevokeExploreKeyword      = (id)       => API.delete(`/admin/explore/keywords/${id}`);

// ── Feature flags ─────────────────────────────────────────────
export const getFeatureFlags    = ()             => API.get('/feature-flags');
export const adminGetFeatures   = ()             => API.get('/admin/features');
export const adminToggleFeature = (key, enabled) => API.patch(`/admin/features/${key}`, { enabled });
export const adminCreateFeature = (payload)      => API.post('/admin/features', payload);
// ── Admin: Feedback ──────────────────────────────────────────
export const adminListFeedback   = (params)   => API.get('/admin/feedback', { params });
export const adminUpdateFeedback = (id, data) => API.patch(`/admin/feedback/${id}`, data);
// ── Reschedule fee ────────────────────────────────────────────
export const createRescheduleFeeOrder = (bookingId) => API.post('/payment/reschedule-fee/create-order', { booking_id: bookingId });
