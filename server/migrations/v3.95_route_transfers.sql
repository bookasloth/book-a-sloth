-- v3.95 — Razorpay Route per-booking transfers (DORMANT until Route go-live)
--
-- Additive schema for the Route split/hold/release layer (routeService.js). None
-- of it does anything while platform_settings.fee_only_mode = true (the current
-- state) — no host money moves. Safe to apply ahead of Route approval.
--
--   profiles.razorpay_route_account_id  — the host's Razorpay Route LINKED ACCOUNT
--     (acc_XXX). Null = host not onboarded for payouts.
--   profiles.razorpay_route_status      — none | created | active. Paid bookings +
--     payouts are gated on 'active' (account created AND KYC/bank done), not mere
--     existence — a 'created' account without bank details can't receive money.
--   bookings.route_transfer_id          — the Route transfer id (trf_XXX) created
--     on hold at capture.
--   bookings.route_payout_status        — none | held | released | reversed | failed.
--
-- The release cron (releaseDueRoutePayouts) scans route_payout_status='held';
-- the partial index keeps that scan cheap. Idempotent — safe to re-run on BOTH DBs.

alter table profiles  add column if not exists razorpay_route_account_id text;
alter table profiles  add column if not exists razorpay_route_status     text not null default 'none';
alter table bookings  add column if not exists route_transfer_id  text;
alter table bookings  add column if not exists route_payout_status text not null default 'none';

create index if not exists idx_bookings_route_held
  on bookings (completed_at)
  where route_payout_status = 'held';
