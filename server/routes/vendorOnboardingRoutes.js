const express = require('express');
const router = express.Router();
const {
  isValidSlug,
  checkSlugAvailable,
  sendOtpBothChannels,
  verifyOtp,
  createVendorAccount,
  updateOnboardingStep,
  createRazorpayOrder,
  verifyRazorpayPayment,
  activatePlan,
  getOnboardingStatus,
  getResumeStep,
} = require('../controllers/vendorOnboardingController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, authLimiter } = require('../middleware/security');

// ── Public: Step 1 - Username/Slug Availability Check ──────────────────────
// POST /api/onboarding/check-slug
router.post('/check-slug', async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug is required' });

    if (!isValidSlug(slug)) {
      return res.status(400).json({
        message: 'Slug must be lowercase, 3-60 chars, alphanumeric with hyphens only',
      });
    }

    const available = await checkSlugAvailable(slug);
    res.json({ available });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Public: Step 2 - Send OTP (Email + WhatsApp) ─────────────────────────
// POST /api/onboarding/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { slug, email, phone, name } = req.body;
    if (!slug || !email) {
      return res.status(400).json({ message: 'Slug and email are required' });
    }

    if (!isValidSlug(slug)) {
      return res.status(400).json({ message: 'Invalid slug' });
    }

    const available = await checkSlugAvailable(slug);
    if (!available) {
      return res.status(409).json({ message: 'Slug already taken' });
    }

    await sendOtpBothChannels(slug, email, phone, name);
    res.json({ message: 'OTPs sent to email and WhatsApp' });
  } catch (error) {
    console.error('send-otp error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ── Public: Step 2 - Verify OTP (Email or Phone) ──────────────────────────
// POST /api/onboarding/verify-otp
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { slug, channel, otp } = req.body;
    if (!slug || !channel || !otp) {
      return res.status(400).json({ message: 'Slug, channel, and OTP are required' });
    }

    if (!['email', 'phone'].includes(channel)) {
      return res.status(400).json({ message: 'Channel must be email or phone' });
    }

    await verifyOtp(slug, channel, otp);
    res.json({ message: 'OTP verified', verified: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ── Public: Step 3 - Create Account (Password Step) ────────────────────────
// POST /api/onboarding/create-account
router.post('/create-account', authLimiter, async (req, res) => {
  try {
    const { slug, email, password, name } = req.body;
    if (!slug || !email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const account = await createVendorAccount(slug, email, password, name);
    res.status(201).json({
      id: account.id,
      token: account.token,
      refresh_token: account.refresh_token,
      slug: account.slug,
      message: 'Account created successfully',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ── Protected: Step 3+ - Update Onboarding Step ───────────────────────────
// POST /api/onboarding/update-step
router.post('/update-step', protect, async (req, res) => {
  try {
    const { slug, step, data } = req.body;
    if (!slug || !step) {
      return res.status(400).json({ message: 'Slug and step are required' });
    }

    const vendorId = req.user.id;
    const profile = await updateOnboardingStep(vendorId, slug, step, data);
    res.json({ message: 'Step updated', step, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Protected: Get Onboarding Status ──────────────────────────────────────
// GET /api/onboarding/status
router.get('/status', protect, async (req, res) => {
  try {
    const status = await getOnboardingStatus(req.user.id);
    if (!status) {
      return res.status(404).json({ message: 'Onboarding not found' });
    }
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Protected: Create Razorpay Order ──────────────────────────────────────
// POST /api/onboarding/create-order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: 'Plan is required' });

    const planPrices = {
      explorer: 0,
      creator: 999,
      professional: 3650,
    };

    if (!planPrices.hasOwnProperty(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const amount = planPrices[plan];
    if (amount === 0) {
      // Free plan: activate immediately
      await activatePlan(req.user.id, plan);
      return res.json({
        plan,
        amount: 0,
        message: 'Free plan activated',
        skipPayment: true,
      });
    }

    const order = await createRazorpayOrder(req.user.id, plan, amount);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Protected: Verify Payment and Activate Plan ─────────────────────────
// POST /api/onboarding/verify-payment
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    if (!paymentId || !orderId) {
      return res.status(400).json({ message: 'Payment ID and Order ID are required' });
    }

    // Verify payment with Razorpay (binds order to this vendor, blocks replay,
    // checks the captured amount). Returns the stored order row.
    const order = await verifyRazorpayPayment(paymentId, orderId, req.user.id);

    // Activate the plan recorded ON THE ORDER — never a client-supplied plan.
    const profile = await activatePlan(req.user.id, order.plan);

    res.json({
      message: 'Payment verified and plan activated',
      plan: profile.plan,
      onboarding_completed: profile.onboarding_completed,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ── Protected: Mark Onboarding Complete ──────────────────────────────────
// POST /api/onboarding/mark-complete
router.post('/mark-complete', protect, async (req, res) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step_completed: 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Onboarding marked complete',
      onboarding_completed: profile.onboarding_completed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
