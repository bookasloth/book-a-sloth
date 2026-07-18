'use strict';
// Bolt 958 support bot — thin HTTP layer over botService. Public + unauthenticated;
// rate-limited at the route. On escalation it emails the support inbox (reusing the
// existing sendEmail util, same as contactController) so a human picks it up.

const { askBot, recordFeedback, getRecentMessages } = require('../services/botService');
const sendEmail = require('../utils/sendEmail');
const { safeError } = require('../utils/httpError');

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'bolt@bookasloth.in';
const MAX_QUESTION_LEN = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

// Fire the support handoff email. Best-effort: a mail failure must never turn a
// successful bot reply into an error for the user.
async function notifySupport({ question, conversationId, sessionRef }) {
  try {
    const history = await getRecentMessages(conversationId, 10);
    const transcript = history.length
      ? history.map((m) => `<p><strong>${esc(m.role)}:</strong> ${esc(m.content)}</p>`).join('')
      : `<p><strong>user:</strong> ${esc(question)}</p>`;
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: '[Bolt 958] Support escalation — a user needs a human',
      html: `
        <h2>Bolt 958 could not answer confidently</h2>
        <p>A visitor asked something the bot escalated (no confident doc match, or a
        sensitive topic). Please follow up over WhatsApp/email.</p>
        <p><strong>Question:</strong> ${esc(question)}</p>
        <p><strong>Conversation:</strong> ${esc(conversationId || '—')}</p>
        <p><strong>Session:</strong> ${esc(sessionRef || 'anonymous')}</p>
        <hr/>
        <h3>Transcript</h3>
        ${transcript}
      `,
    });
  } catch (err) {
    console.error('[bot] support escalation email failed:', err.message);
  }
}

exports.ask = async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    const conversationId = req.body?.conversationId || null;
    if (!question) return res.status(400).json({ message: 'Please enter a question.' });
    if (question.length > MAX_QUESTION_LEN) {
      return res.status(400).json({ message: 'That question is too long. Please shorten it.' });
    }
    if (conversationId && !UUID_RE.test(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation reference.' });
    }

    // Identity is best-effort: a logged-in user's id if the request carries one,
    // else anonymous. No auth is required (Phase 1 = public knowledge bot).
    const sessionRef = req.user?.id || null;

    const result = await askBot({ question, conversationId, sessionRef });

    if (result.escalate) {
      await notifySupport({ question, conversationId: result.conversationId, sessionRef });
    }

    return res.json({
      answer: result.answer,
      cited_sources: result.cited_sources,
      escalate: result.escalate,
      conversationId: result.conversationId,
      messageId: result.messageId,
    });
  } catch (err) {
    return safeError(res, err);
  }
};

exports.feedback = async (req, res) => {
  try {
    const { messageId, feedback } = req.body || {};
    if (!messageId || !UUID_RE.test(messageId)) {
      return res.status(400).json({ message: 'A valid messageId is required.' });
    }
    if (feedback !== 'up' && feedback !== 'down') {
      return res.status(400).json({ message: "feedback must be 'up' or 'down'." });
    }
    await recordFeedback(messageId, feedback);
    return res.json({ ok: true });
  } catch (err) {
    return safeError(res, err);
  }
};
