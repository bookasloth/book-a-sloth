const express = require('express');
const router = express.Router();
const {
  isValidSlug,
  checkSlugAvailable,
  slugAvailableForUser,
  claimSlug,
  updateOnboardingStep,
  createRazorpayOrder,
  verifyRazorpayPayment,
  activatePlan,
  getOnboardingStatus,
} = require('../controllers/vendorOnboardingController');
const { protect } = require('../middleware/authMiddleware');
const { slugLimiter } = require('../middleware/security');

// ── Protected: Slug Availability Check (authed, history-backed, self-aware) ──
// POST /api/onboarding/slug-available
// Requires auth so we can exclude the caller's own name from "taken" checks.
// Uses usernameService.usernameOwner (history-backed) to match claimSlug's
// enforcement — live feedback and the write path now agree on what's taken.
router.post('/slug-available', protect, slugLimiter, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    res.json(await slugAvailableForUser(req.user.id, slug));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Protected: Claim Slug (step 2) ────────────────────────────────────────
// POST /api/onboarding/claim-slug
router.post('/claim-slug', protect, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    res.json(await claimSlug(req.user.id, slug));
  } catch (e) { res.status(400).json({ message: e.message }); }
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
        onboarding_step_completed: 6,
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
