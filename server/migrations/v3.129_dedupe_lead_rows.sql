-- v3.129 — One-time dedupe of fragmented lead rows (same host account split across
-- two `leads` rows). upsertLead stitches an incoming patch to ONE existing row by exact
-- phone→email, but never MERGES two existing rows that turn out to be the same person
-- (one holds the phone, the other the email). Result: 20 profile_ids carry 2 lead rows
-- each (verified prod 08-29). Phone/email-only dupes are negligible (1 each) and NOT
-- touched here — profile_id is the only unambiguous same-account key.
--
-- Merge rule per profile_id cluster:
--   • survivor = OLDEST row (min created_at) → keeps first-touch attribution + history
--   • survivor.status = the MOST-ADVANCED status in the cluster (never lose pipeline
--     progress; the advanced status may live on the row we delete)
--   • fill blank phone/email/name/owner_admin_id on the survivor from the loser
--   • converted_at = earliest non-null IF the winning status is a money state, else NULL
--   • reparent all 7 lead_id children (crm_messages, crm_sequence_enrollments,
--     lead_activities, lead_events, lead_follow_ups, lead_imports, lead_notes) → survivor
--   • delete the loser rows
-- Idempotent: once each profile_id has a single row, the cluster CTE is empty → no-op.
-- Independent of v3.128 (keys on profile_id, not status); run in either order.

BEGIN;

-- Survivor + merged values, one row per duplicated profile_id.
CREATE TEMP TABLE _dsurv ON COMMIT DROP AS
WITH adv AS (
  SELECT array['new','contacted','replied','qualified','demo',
               'paid','activated','won','sloth',
               'retained','ambassador','enterprised','champion']::text[] a
),
cl AS (
  SELECT profile_id FROM leads
  WHERE profile_id IS NOT NULL
  GROUP BY profile_id HAVING count(*) > 1
),
r AS (
  SELECT l.*, coalesce(array_position((SELECT a FROM adv), l.status), 0) AS rnk
  FROM leads l JOIN cl USING (profile_id)
)
SELECT
  r.profile_id,
  (array_agg(r.id     ORDER BY r.created_at ASC, r.id ASC))[1]                                              AS survivor_id,
  (array_agg(r.status ORDER BY r.rnk DESC, r.created_at ASC))[1]                                            AS best_status,
  (array_agg(r.phone  ORDER BY r.created_at ASC) FILTER (WHERE r.phone  IS NOT NULL AND r.phone  <> ''))[1] AS m_phone,
  (array_agg(r.email  ORDER BY r.created_at ASC) FILTER (WHERE r.email  IS NOT NULL AND r.email  <> ''))[1] AS m_email,
  (array_agg(r.name   ORDER BY r.created_at ASC) FILTER (WHERE r.name   IS NOT NULL AND r.name   <> ''))[1] AS m_name,
  (array_agg(r.owner_admin_id ORDER BY r.created_at ASC) FILTER (WHERE r.owner_admin_id IS NOT NULL))[1]    AS m_owner,
  min(r.converted_at) FILTER (WHERE r.converted_at IS NOT NULL)                                             AS m_converted
FROM r
GROUP BY r.profile_id;

-- loser → survivor map.
CREATE TEMP TABLE _dmap ON COMMIT DROP AS
SELECT l.id AS loser_id, s.survivor_id
FROM leads l JOIN _dsurv s USING (profile_id)
WHERE l.id <> s.survivor_id;

-- Fold merged fields + winning status onto the survivor.
UPDATE leads t SET
  status         = s.best_status,
  phone          = coalesce(t.phone, s.m_phone),
  email          = coalesce(t.email, s.m_email),
  name           = coalesce(t.name,  s.m_name),
  owner_admin_id = coalesce(t.owner_admin_id, s.m_owner),
  converted_at   = CASE WHEN s.best_status IN
                          ('paid','activated','won','sloth','retained','ambassador','enterprised','champion')
                        THEN s.m_converted ELSE NULL END,
  updated_at     = now()
FROM _dsurv s
WHERE t.id = s.survivor_id;

-- Reparent children (no unique constraint on lead_id anywhere → plain UPDATE is safe).
UPDATE crm_messages           c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE crm_sequence_enrollments c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE lead_activities        c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE lead_events            c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE lead_follow_ups        c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE lead_imports           c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;
UPDATE lead_notes             c SET lead_id = m.survivor_id FROM _dmap m WHERE c.lead_id = m.loser_id;

-- Drop the now-orphaned loser rows.
DELETE FROM leads WHERE id IN (SELECT loser_id FROM _dmap);

COMMIT;
