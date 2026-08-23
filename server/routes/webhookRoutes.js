'use strict';
// Public provider webhooks (signature/secret-gated in the controllers).
// Mounted at /api/webhooks. The Resend route needs the RAW body for Svix
// verification — see the express.raw mount in server.js.
const express = require('express');
const router = express.Router();
const { handleResendWebhook } = require('../controllers/resendWebhookController');

router.post('/resend', handleResendWebhook);

module.exports = router;
