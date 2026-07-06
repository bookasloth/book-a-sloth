'use strict';
const { supabaseAdmin } = require('../config/supabase');
const { buildTaxInvoiceHTML } = require('../services/invoiceHtml');

// Public, token-gated: the invoice's unguessable access_token authorises viewing
// (same model as product download tokens) so the emailed link works without login.
async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    const token = req.query.token;
    const { data: inv } = await supabaseAdmin
      .from('invoices').select('*').eq('id', id).maybeSingle();
    if (!inv) return res.status(404).send('Invoice not found');
    if (!token || token !== inv.access_token) return res.status(403).send('Not authorized');
    res.set('Content-Type', 'text/html; charset=utf-8').send(buildTaxInvoiceHTML(inv));
  } catch (e) {
    res.status(500).send('Could not render invoice');
  }
}

module.exports = { getInvoice };
