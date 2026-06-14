-- ============================================================
-- v3.0 — Discovery Events (Explore foundation: data capture)
-- ------------------------------------------------------------
-- Captures search intent + profile/service views from main go-live so the
-- DEFERRED Explore feature launches on real history instead of a cold start.
-- This is the ONLY part of Explore built now; the rest (index, ranking,
-- self-serve checkout, pricing, admin, the public page) is built ~3–4 months
-- later on top of this data.
--
-- Spec:  docs/superpowers/specs/2026-06-14-explore-foundation-design.md
-- Apply: Supabase SQL Editor → New Query, or MCP apply_migration.
-- Safe to re-run (IF NOT EXISTS throughout).
-- ============================================================

CREATE TABLE IF NOT EXISTS discovery_events (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL CHECK (event_type IN ('search', 'view', 'click')),
  surface       TEXT,        -- home_search | profile | service | category_chip | (future: explore_grid, sponsored_search, …)
  vendor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- keep history if a vendor is deleted
  query         TEXT,        -- raw search text (searches only)
  category      TEXT,
  result_count  INT,         -- searches: how many matches; result_count = 0 → unmet demand
  source        TEXT,        -- referer / path
  session_id    TEXT,        -- anon first-party session id (x-sloth-sid); no PII
  user_id       UUID,        -- set only if the request was authenticated
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_events_created ON discovery_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_events_vendor  ON discovery_events (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_events_type    ON discovery_events (event_type, created_at DESC);
-- Powers "top searches" + "zero-result searches" rollups when Explore is built.
CREATE INDEX IF NOT EXISTS idx_discovery_events_query   ON discovery_events (query) WHERE query IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────
-- Internal analytics table. No policies = deny-all for anon/authenticated.
-- The service role (supabaseAdmin) bypasses RLS and is the only writer/reader.
ALTER TABLE discovery_events ENABLE ROW LEVEL SECURITY;
