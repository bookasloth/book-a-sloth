-- v3.134 — support chat image attachments.
-- One nullable column: a public Supabase Storage URL for an image the customer
-- (or agent) attaches to a message. Additive + schema-fallback safe: postMessage
-- only writes it when present, so a DB without this column keeps working.
-- (v3.133 was taken by the campaign composer branch — numbered v3.134 here.)
-- Applied on BOTH DBs (prod Mumbai + staging Tokyo) on 2026-08-30.
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
