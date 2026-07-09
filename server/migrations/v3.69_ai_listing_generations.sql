-- v3.69_ai_listing_generations.sql — usage log for "Write with Bolt" AI listing autofill.
-- Idempotent. Apply on BOTH DBs (prod Mumbai ayjhlwyzszykqtnaktpb + staging Tokyo xwvciqkayammbvsidqig).
-- No RLS: only the service_role (server) reads/writes this; it bypasses RLS.

CREATE TABLE IF NOT EXISTS ai_listing_generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL,                       -- groups a generate + its regenerations
  service_id  UUID REFERENCES services(id) ON DELETE SET NULL,
  plan_slug   TEXT NOT NULL,                        -- plan at time of use (audit)
  model       TEXT NOT NULL,                        -- 'haiku' | 'sonnet'
  kind        TEXT NOT NULL DEFAULT 'generate' CHECK (kind IN ('generate','regenerate')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast quota-window counts per host (only generate rows consume quota).
CREATE INDEX IF NOT EXISTS ai_gen_host_created_idx
  ON ai_listing_generations (host_id, created_at DESC);
