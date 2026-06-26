-- v3.44 — otp_codes composite primary key (email, type) (audit P1-9)
--
-- BEFORE: PRIMARY KEY (email) — exactly one OTP row per email, SHARED between
-- booking/login codes (type='booking') and password-reset codes
-- (type='password_reset'). Consequences:
--   * An unauthenticated POST /auth/send-otp for a victim's email clobbered an
--     in-flight password-reset code → reset silently failed ("Invalid reset code").
--   * otpStore.set reset locked_until/attempts to null, clearing the reset
--     brute-force lockout that resetPassword deliberately enforces.
--
-- FIX: make (email, type) the primary key so booking and reset codes live in
-- separate rows and never overwrite each other. Application code (otpStore.js,
-- authController forgotPassword/resetPassword) is updated to scope every
-- read/write/delete by `type`, and to upsert ON CONFLICT (email, type).
--
-- DEPLOY ORDER: this migration MUST be applied BEFORE deploying the matching
-- server build (the new code upserts ON CONFLICT (email,type)). The server code
-- keeps a fallback to ON CONFLICT (email) if the composite key is absent, so a
-- brief ordering gap degrades to the old single-row behaviour rather than erroring.

ALTER TABLE public.otp_codes ALTER COLUMN type SET DEFAULT 'booking';
UPDATE public.otp_codes SET type = 'booking' WHERE type IS NULL;
ALTER TABLE public.otp_codes ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.otp_codes DROP CONSTRAINT IF EXISTS otp_codes_pkey;
ALTER TABLE public.otp_codes ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (email, type);
