/**
 * kycAdminController.js — admin review of host KYC submissions.
 * Gated by requireAdmin('kyc.view' | 'kyc.decide') in adminRoutes.
 * Sensitive numbers stay masked even for admins; verification is done by eye
 * against the document images (served as short-lived signed URLs).
 */
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { maskPan, maskAadhaar, maskAccount, maskPhone } = require('../utils/kycCrypto');

const KYC_BUCKET = 'kyc';

// GET /api/admin/kyc?status=pending|approved|rejected
const listKyc = async (req, res) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('id, user_id, full_name, email, phone, status, created_at, reviewed_at')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map((r) => ({ ...r, phone: maskPhone(r.phone) })));
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/admin/kyc/:id — masked identity + signed document URLs (60s).
const getKyc = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'KYC submission not found.' });

    const sign = async (key) => {
      if (!key) return null;
      const { data: s } = await supabaseAdmin.storage.from(KYC_BUCKET).createSignedUrl(key, 60);
      return s?.signedUrl || null;
    };

    res.json({
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      full_name: data.full_name,
      email: data.email,
      phone: maskPhone(data.phone),
      pan_number: maskPan(data.pan_number),
      aadhaar_number: maskAadhaar(data.aadhaar_number),
      holder_name: data.holder_name,
      bank_name: data.bank_name,
      account_number: maskAccount(data.account_number),
      ifsc: data.ifsc,
      branch: data.branch,
      account_type: data.account_type,
      selfie_url: await sign(data.selfie_url),
      pan_doc_url: await sign(data.pan_doc_url),
      aadhaar_doc_url: await sign(data.aadhaar_doc_url),
      review_note: data.review_note,
      reviewed_at: data.reviewed_at,
      created_at: data.created_at,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// PATCH /api/admin/kyc/:id  { status: 'approved'|'rejected', note? }
const decideKyc = async (req, res) => {
  try {
    const status = req.body?.status;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected.' });
    }
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions')
      .update({
        status,
        review_note: String(req.body?.note || '').trim() || null,
        reviewed_by: req.admin.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('id, status')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'KYC submission not found.' });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { listKyc, getKyc, decideKyc };
