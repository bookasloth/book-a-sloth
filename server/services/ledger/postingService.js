/**
 * postingService.js — the ONLY JS write path into the ledger.
 * Wraps the atomic Postgres RPC post_journal_entry(jsonb).
 * Idempotency lives in the DB (UNIQUE (source_type, source_id)) — calling
 * post twice for the same event returns the same entry id, posts nothing new.
 */
'use strict';

const { supabaseAdmin } = require('../../config/supabase');

/**
 * @param {object} args
 * @param {string} args.sourceType  ORDER_PAYMENT | SUBSCRIPTION_PAYMENT | BANK_TRANSFER | ADJUSTMENT | REVERSAL | BACKFILL | BACKFILL_SETTLEMENT | SETTLEMENT | REFUND
 * @param {string} args.sourceId    uuid of the source record (booking, subscription payment, …)
 * @param {object} args.template    { description, lines } from journalTemplates
 * @param {string} [args.journalDate] ISO date (defaults to today, UTC, in the DB)
 * @param {string} [args.createdBy]   admin_users.id for manual entries
 * @returns {Promise<string>} journal entry uuid
 */
async function post({ sourceType, sourceId, template, journalDate = null, createdBy = null }) {
  const { data, error } = await supabaseAdmin.rpc('post_journal_entry', {
    p: {
      source_type: sourceType,
      source_id: sourceId,
      journal_date: journalDate,
      description: template.description,
      created_by: createdBy,
      lines: template.lines,
    },
  });
  if (error) throw new Error(`ledger posting failed (${sourceType}/${sourceId}): ${error.message}`);
  return data;
}

/**
 * Non-throwing variant for payment paths: a captured payment must never fail
 * because the ledger write failed. The reconciler cron self-heals misses.
 */
async function postSafe(args) {
  try {
    return await post(args);
  } catch (err) {
    console.error('LEDGER POSTING MISSED (reconciler will retry):', err.message);
    return null;
  }
}

module.exports = { post, postSafe };
