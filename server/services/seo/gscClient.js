// gscClient.js — thin wrapper around googleapis' Search Console client for a
// single non-rotating service-account credential (GSC_SA_KEY + GSC_PROPERTY).
// Never throws on missing/malformed creds — callers no-op via isConfigured().
const { google } = require('googleapis');

let cached = null;

const isConfigured = () => !!(process.env.GSC_SA_KEY && process.env.GSC_PROPERTY);

const siteUrl = () => process.env.GSC_PROPERTY;

const getClient = () => {
  if (!isConfigured()) return null;
  if (cached) return cached;
  let credentials;
  try {
    credentials = JSON.parse(process.env.GSC_SA_KEY);
  } catch (err) {
    console.warn('[gscClient] GSC_SA_KEY is not valid JSON — skipping:', err.message);
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  cached = google.searchconsole({ version: 'v1', auth });
  return cached;
};

module.exports = { isConfigured, siteUrl, getClient };
