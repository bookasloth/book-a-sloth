'use strict';
// Bolt 958 support bot — thin HTTP layer over botService. Public + unauthenticated;
// rate-limited at the route. On escalation it emails the support inbox (reusing the
// existing sendEmail util, same as contactController) so a human picks it up.

const { askBot, askBotStream, recordFeedback, getRecentMessages, redactPii } = require('../services/botService');
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
    // PII-redact before it hits the support inbox. The transcript comes from
    // getRecentMessages (bot_messages), which is already stored redacted; the raw
    // question passed here is not, so redact it explicitly.
    const q = redactPii(question);
    const history = await getRecentMessages(conversationId, 10);
    const transcript = history.length
      ? history.map((m) => `<p><strong>${esc(m.role)}:</strong> ${esc(m.content)}</p>`).join('')
      : `<p><strong>user:</strong> ${esc(q)}</p>`;
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: '[Bolt 958] Support escalation — a user needs a human',
      html: `
        <h2>Bolt 958 could not answer confidently</h2>
        <p>A visitor asked something the bot escalated (no confident doc match, or a
        sensitive topic). Please follow up over WhatsApp/email.</p>
        <p><strong>Question:</strong> ${esc(q)}</p>
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
      // Fire-and-forget: the user must NOT wait on the internal support email.
      // A slow/hanging SMTP handshake was blocking the whole HTTP response (the
      // reply is already computed here). notifySupport swallows its own errors,
      // so an unhandled rejection can't escape; Render is long-running so the
      // background send completes after we respond.
      notifySupport({ question, conversationId: result.conversationId, sessionRef });
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

// Streaming twin of ask(). Same validation + escalation email; streams the answer
// to the browser over Server-Sent Events so it types out live.
//   event: delta  data: { text }        — one or more, the answer as it's produced
//   event: done   data: { escalate, cited_sources, followups, conversationId, messageId }
//   event: error  data: { message }     — on a hard failure
exports.askStream = async (req, res) => {
  const question = String(req.body?.question || '').trim();
  const conversationId = req.body?.conversationId || null;
  if (!question) return res.status(400).json({ message: 'Please enter a question.' });
  if (question.length > MAX_QUESTION_LEN) {
    return res.status(400).json({ message: 'That question is too long. Please shorten it.' });
  }
  if (conversationId && !UUID_RE.test(conversationId)) {
    return res.status(400).json({ message: 'Invalid conversation reference.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // don't let a proxy (nginx/Render) buffer the stream
  });
  const sse = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const sessionRef = req.user?.id || null;
    const result = await askBotStream({
      question, conversationId, sessionRef,
      onDelta: (text) => sse('delta', { text }),
    });

    if (result.escalate) {
      // Fire-and-forget — the user must not wait on the internal support email.
      notifySupport({ question, conversationId: result.conversationId, sessionRef });
    }

    sse('done', {
      escalate: result.escalate,
      cited_sources: result.cited_sources,
      followups: result.followups || [],
      conversationId: result.conversationId,
      messageId: result.messageId,
    });
    res.end();
  } catch (err) {
    console.error('[bot] stream failed:', err.message);
    sse('error', { message: 'Something went wrong. Please try again.' });
    res.end();
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
