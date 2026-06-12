/**
 * aisensyService.js — AiSensy WhatsApp campaign API client.
 *
 * NO hardcoded API keys or campaign names. Everything comes from the
 * notification_providers / notification_events tables (passed in by the
 * notification engine).
 *
 * API: POST https://backend.aisensy.com/campaign/t1/api/v2
 * Docs: https://aisensy.com/tutorials/api-reference-docs
 */

const AISENSY_API_URL =
  process.env.AISENSY_API_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';

/** Normalise an Indian/intl phone into AiSensy destination format (digits, country code). */
const normalizePhone = (phone) => {
  if (!phone) return null;
  let p = String(phone).replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  // 10-digit local number → assume India
  if (/^\d{10}$/.test(p)) p = `91${p}`;
  return /^\d{11,15}$/.test(p) ? p : null;
};

/**
 * Send a WhatsApp campaign message.
 * @param {object} opts
 * @param {string} opts.apiKey        provider api_key (from DB)
 * @param {string} opts.campaignName  AiSensy campaign name (from DB)
 * @param {string} opts.destination   recipient phone
 * @param {string} opts.userName      recipient display name
 * @param {string[]} opts.templateParams ordered template variables
 * @returns {{ success: boolean, response?: object, error?: string }}
 */
const sendCampaign = async ({ apiKey, campaignName, destination, userName, templateParams = [] }) => {
  const phone = normalizePhone(destination);
  if (!apiKey)       return { success: false, error: 'AiSensy API key not configured' };
  if (!campaignName) return { success: false, error: 'Campaign name not configured for this event' };
  if (!phone)        return { success: false, error: `Invalid destination phone: ${destination}` };

  const body = {
    apiKey,
    campaignName,
    destination: phone,
    userName: userName || 'Customer',
    templateParams: templateParams.map(String),
  };

  try {
    const res = await fetch(AISENSY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

    if (!res.ok) {
      return { success: false, error: parsed?.errorMessage || parsed?.message || `HTTP ${res.status}`, response: parsed };
    }
    return { success: true, response: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Test connectivity: fires the campaign API with an obviously-invalid
 * destination so AiSensy validates the API key without messaging anyone.
 * A key/auth error means bad credentials; a destination/campaign error
 * means the key was accepted.
 */
const testConnection = async ({ apiKey }) => {
  if (!apiKey) return { ok: false, message: 'No API key configured' };
  try {
    const res = await fetch(AISENSY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, campaignName: '__connection_test__', destination: '0', userName: 'test', templateParams: [] }),
    });
    const text = await res.text();
    let parsed; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    const msg = (parsed?.errorMessage || parsed?.message || '').toLowerCase();
    if (msg.includes('api key') || msg.includes('apikey') || msg.includes('unauthor') || res.status === 401 || res.status === 403) {
      return { ok: false, message: parsed?.errorMessage || parsed?.message || 'Invalid API key' };
    }
    // Key accepted — the failure (if any) is about the fake campaign/destination
    return { ok: true, message: 'API key accepted by AiSensy' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};

module.exports = { sendCampaign, testConnection, normalizePhone, AISENSY_API_URL };
