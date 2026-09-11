# CRM Lists — cold contact pool (engagement-gated pipeline)

**Date:** 2026-09-11
**Branch:** `feat/crm-lists`
**Status:** design approved (Option B), pending spec review → implementation plan

---

## 1. Problem

Founder has bulk cold contact data (name, phone, email, website, business, …) from
scraping/exports. Today the only way in is the generic admin importer
(`/import/commit`, [adminCrmController.js:318](../../../server/controllers/adminCrmController.js)),
which drops raw rows into `leads` **instantly and permanently** — every imported cold
prospect lands *in the sales pipeline*. The Topmate import (#990) did exactly this:
~123 cold, un-opted-in prospects now sit in the pipeline alongside real, engaged leads.

That is backwards. The pipeline should hold **earned** contacts (someone replied or took
an action). Cold data should live in a holding area you can cold-email *from*, and a
contact should enter the pipeline **only on engagement**.

## 2. Goal

- **Lists** = named cold pools. Store bulk data here. Cold-email from here.
- **Pipeline** (`/admin/sales`) = earned contacts only.
- **Promote**: cold → pipeline, automatically on reply/action, or manually.
- **Demote**: pipeline → cold (back to origin list), manually. One-time backfill demotes
  the existing Topmate leads.
- Reuse the existing identity / dedupe / send / opt-out / lifecycle machinery — build no
  parallel stack.

## 3. Model decision — one store, one flag (Option B)

Rejected **Option A** (a separate cold-contact store): cold email needs identity, dedupe,
opt-out, unsubscribe, suppression and send-logging, all of which are built around
`leads` + `campaigns` + `sendGate`. A separate store means rebuilding that entire stack
for cold contacts, plus dedupe across two stores. Not worth it.

**Option B:** cold contacts *are* `leads`, distinguished by one orthogonal axis.

- `leads.status` stays the **within-pipeline lifecycle** (`new`→`contacted`→`replied`…,
  governed by `lifecycleRules.js`). Unchanged.
- New axis `leads.in_pipeline` (bool) answers "Lists or Pipeline?":
  - `false` = cold, shown under **Lists**, grouped by `list_id`.
  - `true`  = in the **Pipeline** board.
- `leads.list_id` = which list the contact belongs to. Survives promote *and* demote, so a
  demoted lead returns to its origin list.

The UI still shows two places; underneath it is one table + a flag. Nothing gets rebuilt.

## 4. Schema (migration `v3.155_crm_lists.sql` — next free number, verify at apply time; additive, idempotent)

```sql
CREATE TABLE IF NOT EXISTS public.lead_lists (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  source         text,                       -- 'topmate' | 'instagram' | 'linkedin' | 'manual' | …
  consent_basis  text,                       -- 'b2b_legitimate_interest' | 'opt_in' | … (send audit)
  description    text,
  created_by     text,                       -- admin actor
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;  -- service-role only (no policy)

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS list_id     uuid REFERENCES public.lead_lists(id),
  ADD COLUMN IF NOT EXISTS in_pipeline boolean NOT NULL DEFAULT true;   -- DEFAULT true = every EXISTING lead stays in the pipeline (zero behavior change on apply)

-- Lists view: cold rows by list.
CREATE INDEX IF NOT EXISTS idx_leads_cold ON public.leads (list_id) WHERE in_pipeline = false;
-- Pipeline scans gate on this.
CREATE INDEX IF NOT EXISTS idx_leads_in_pipeline ON public.leads (in_pipeline);
```

`DEFAULT true` is the safety hinge: applying the migration changes nothing until we
explicitly write `in_pipeline=false` (new imports) or run the Topmate backfill.

List counts (cold / promoted) are **derived by query**, not stored — no drift.
`ponytail:` add a cached count column only if the Lists index page measurably slows.

Run on **staging (Tokyo `xwvciqkayammbvsidqig`) → prod (Mumbai `ayjhlwyzszykqtnaktpb`)**.
Keep the code-side schema fallback (destructure-safe) until confirmed applied on both.

## 5. The `in_pipeline` gate (the whole risk surface)

Rule: **scan/aggregate reads gate `in_pipeline=true`; per-lead / identity reads do not.**
A cold lead must never surface on the board, get auto-worked by the lifecycle cron, or
count in pipeline metrics — but promote/demote/send/timeline still act on it directly.

**GATE (add `.eq('in_pipeline', true)`):**
- `leadService.listLeads` — board table + saved views ([leadService.js:389](../../../server/services/crm/leadService.js))
- `lifecycleEngine` — the every-15-min cron must not auto-advance cold leads
- `reportService` — pipeline metrics / LTV must exclude cold
- `followUpService` + `deskService` — no auto follow-up tasks / desk queue for cold
- `handoffService` cross-board — within-pipeline only

**NO GATE (per-lead or stage-agnostic — leave as-is):**
- `upsertLead`, `changeStatus`, `activity`, `timeline`, `attribution`, `webhookEvents`,
  `intentEvents`, `contactsService`, `kycOnboarding` — act on a specific lead id
- `messageService`, `sequenceService`, `touchGovernor` — the **send path**; cold email
  flows through these too, so they must stay stage-agnostic (identity/opt-out gated)

**Implementation task:** audit every `from('leads')` call in the 18 files that read it,
classify each as scan vs per-lead, and gate the scans. One guard per scan site.

## 6. Import (upgrade the generic path; #990 untouched)

- `/import/preview` — unchanged (validate rows).
- `/import/commit` — now **requires a target list** (`list_id`, or `list_name`+`source` to
  create one inline). Every imported row is written `in_pipeline=false`, `list_id=<list>`,
  `source=<list.source>`, via existing `upsertLead` (free dedupe/identity/merge). Generic
  import **no longer dumps into the pipeline.**
- Existing merge rule "never regress pipeline on re-sync" ([leadService.js:72](../../../server/services/crm/leadService.js))
  means re-importing a contact who is already engaged (in_pipeline=true) must **not** drag
  them back to cold. Import sets `in_pipeline=false` **only when creating** a lead, never on
  merge into an existing one.
- **#990 Topmate CLI script stays as-is** — a hand-run power tool with dataset-specific
  classification. It will be pointed at a "Topmate" list (set `list_id`, `in_pipeline=false`)
  rather than dropping into the pipeline; that is a small edit to its `upsertLead` opts, not
  a rewrite.

Column handling for v1 = **fixed columns** (name/phone/email/whatsapp/business/profession/
city/tags/source), same shape the generic importer already accepts. Mapping UI deferred
(see §11).

## 7. Cold send (reuse, build nothing)

Cold email from a list uses the **existing campaign engine** (`campaignAdminController`,
`sendGate`, `touchGovernor`): the campaign audience is simply the filter
`in_pipeline=false AND list_id=<list>`. That inherits, for free:
- opt-out / do-not-contact / email opt-out gates
- mandatory unsubscribe (HMAC, v3.7) in the email layout
- quiet hours (09–20 IST), governor cap (1/48h per subject)
- the `crm_admin_sends` master kill-switch (fail-closed)

`list.consent_basis` is recorded for audit (cold B2B = legitimate-interest + visible
unsubscribe + suppression). **Landmine:** a large cold blast overflows the Resend daily
cap → silently dropped; `email_logs` is the truth, `campaign_recipients.status` lies. Batch
cold sends and re-drive failed rows (see `docs` resend-daily-quota note).

## 8. Promote / Demote rules (`leadService` + `lifecycleRules`)

**Promote (cold → pipeline):**
- *Auto* — any inbound engagement (reply/action) that already auto-advances status to
  `replied` also sets `in_pipeline=true`. Hook the existing auto path
  ([leadService.js:192](../../../server/services/crm/leadService.js)): when the subject is
  cold, flip it in the same transaction and log `promoted_to_pipeline`.
- *Manual* — Promote button in a list. Sets `in_pipeline=true`, `status='new'` (enters
  Presale top) unless a reason sets otherwise. Logs activity + fires `handoffService`.

**Demote (pipeline → cold):**
- Manual only in v1. Sets `in_pipeline=false`, keeps `list_id` (falls back to an
  "Ungrouped" list if null). Does **not** touch `status` — a demoted lead simply stops
  matching the gated board query; re-promotion resumes its status. Logs `demoted_to_list`.
- **Safety guard:** block demote when `status ∈ MONEY/CONVERTED` (reuse the sets in
  `lifecycleRules`). A paying/converted customer must never fall into the cold pool.

## 9. Topmate backfill (one-time, after gate code is live)

Order matters: **deploy the `in_pipeline` gate first**, then backfill — otherwise demoted
leads (`in_pipeline=false`) still show on an un-gated board.

```sql
-- Move the wrongly-warm Topmate cold prospects out of the pipeline into a Topmate list.
INSERT INTO lead_lists (name, source, consent_basis, created_by)
  VALUES ('Topmate — cold', 'topmate', 'b2b_legitimate_interest', 'backfill')
  RETURNING id;  -- :topmate_list

UPDATE leads
   SET in_pipeline = false, list_id = :topmate_list, updated_at = now()
 WHERE attributes->>'source_dataset' = 'topmate'
   AND status NOT IN (/* MONEY/CONVERTED set — never demote a paying customer */);
```

## 10. UI

- **`/admin/sales/lists`** — index of lists (name, source, cold count, promoted count,
  created). "New list" + "Import CSV → list".
- **List detail** — the `SalesLeads` table filtered to `list_id` + `in_pipeline=false`, with
  bulk **Promote** and **Send cold campaign** actions. Reuse `SalesLeads.jsx` components
  (`TagChip`, table, bulk bar).
- **Pipeline board** (`/admin/sales/leads`) — add the `in_pipeline=true` gate; add a
  per-lead **Demote to list** action.

Design tokens / components per project rules (reuse `SalesLeads`, no new color/borders).

## 11. Out of scope (YAGNI — add when it hurts)

- **Column-mapping UI** (drag CSV header → field). v1 uses fixed columns; add mapping when a
  messy real-world CSV actually blocks an import.
- **Enrichment / profession inference** in the generic importer — that is #990's job for its
  dataset; the generic path stays dumb.
- **Auto-demote on going quiet** — manual demote + the Topmate backfill cover the stated
  need. Add a quiet-timeout auto-demote later if the pipeline clutters.
- **Per-list send analytics** beyond the existing campaign stats.

## 12. Testing

- `leadService` unit: manual promote flips `in_pipeline` + logs; demote flips + keeps
  `list_id`; **demote blocked on MONEY/CONVERTED status**.
- `lifecycleRules` unit: the no-demote set.
- import: `/import/commit` writes `in_pipeline=false` on create, does **not** regress an
  existing `in_pipeline=true` lead on merge.
- gate: a cold lead does not appear in `listLeads` default results nor in `reportService`
  pipeline counts.
- Server `npm test`, client `npm run build` + `npx vitest run` before any client PR
  (deploy gate = full client vitest).

## 13. Rollout order

1. Ship schema migration (both DBs) + gate code + promote/demote + Lists UI + import
   upgrade. `DEFAULT true` keeps the pipeline identical until step 3.
2. Verify gate on staging (cold test list does not leak into the board).
3. Run the Topmate backfill (prod) — the ~123 cold prospects move to the Topmate list.
