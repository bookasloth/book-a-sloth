-- v3.60 — Service Category INTEGRITY (composite-FK model)
--
-- Makes cross-profession service pairings unrepresentable:
--   * service_categories.primary_category must be a real profession (FK → categories.slug)
--   * services stores the (primary_category, category) PAIR with a composite FK
--     → service_categories(primary_category, slug); ON UPDATE CASCADE repoints
--     services when an admin renames a slug; ON DELETE RESTRICT backstops the
--     app-side "in use" 409.
--   * CHECK closes the MATCH SIMPLE hole (composite FK ignores rows where any
--     column is NULL): category and primary_category are NULL together or set together.
-- Also adds SEO columns (description, icon) for the /services landing pages.
--
-- PRE-REQ: categories.slug is UNIQUE (v3.21) — FK target.
-- Run AFTER on both DBs: node server/scripts/seedServiceCategories.js (gap-fills descriptions)

BEGIN;

-- 0a) Remove unusable orphan buckets (profession typo rows) --------------------
DELETE FROM service_categories sc
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = sc.primary_category);

-- 0b) services.primary_category + backfill -------------------------------------
ALTER TABLE services ADD COLUMN IF NOT EXISTS primary_category text;

-- Stamp from the host's current profession where the pair is valid
UPDATE services s
SET primary_category = p.primary_category
FROM profiles p
WHERE s.host_id = p.id
  AND s.category IS NOT NULL
  AND s.primary_category IS NULL
  AND EXISTS (
    SELECT 1 FROM service_categories sc
    WHERE sc.primary_category = p.primary_category AND sc.slug = s.category
  );

-- Anything left categorised but unpaired is stale (host changed profession,
-- old v3.53-era value, deleted category) → clear, host re-picks on next edit.
UPDATE services SET category = NULL, primary_category = NULL
WHERE category IS NOT NULL AND primary_category IS NULL;

-- 1) Professions must be real ---------------------------------------------------
ALTER TABLE service_categories
  ADD CONSTRAINT fk_sc_primary FOREIGN KEY (primary_category)
  REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 2) The pair is the only representable link ------------------------------------
ALTER TABLE services
  ADD CONSTRAINT fk_services_category FOREIGN KEY (primary_category, category)
  REFERENCES service_categories(primary_category, slug)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE services ADD CONSTRAINT chk_category_pair
  CHECK ((category IS NULL) = (primary_category IS NULL));

CREATE INDEX IF NOT EXISTS idx_services_prof_cat
  ON services(primary_category, category) WHERE category IS NOT NULL;

-- 3) SEO fields ------------------------------------------------------------------
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS icon text;

COMMIT;
