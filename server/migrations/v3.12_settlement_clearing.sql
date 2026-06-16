-- v3.12_settlement_clearing.sql
-- Settlement Engine P2: configurable clearing window (days after a booking's
-- completion before the vendor's earning becomes withdrawable). Idempotent.

INSERT INTO platform_settings (key, value)
VALUES ('settlement_clearing_days', '7')
ON CONFLICT (key) DO NOTHING;
