/**
 * kycController.js — host-facing KYC: submit, read own status, upload docs.
 *
 * SECURITY:
 *  - PAN / Aadhaar / account number are encrypted at rest (kycCrypto) and are
 *    NEVER returned raw. GET /me returns masked values only.
 *  - A host can only read/write their OWN submission (scoped by req.user.id).
 *  - Documents go to the PRIVATE 'kyc' bucket; only storage keys are stored.
 */
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { encrypt, maskPan, maskAadhaar, maskAccount, maskPhone, RE } = require('../utils/kycCrypto');

const KYC_BUCKET = 'kyc';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — KYC docs (scans/photos) are larger than avatars

// Magic-byte sniff — client mimetype/extension are attacker-controlled and never
// trusted. Selfie must be an image; PAN/Aadhaar docs may be image or PDF.
const sniff = (buf, allowPdf) => {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (allowPdf && buf.toString('ascii', 0, 4) === '%PDF') return { ext: 'pdf', mime: 'application/pdf' };
  return null;
};

// POST /api/kyc/upload?type=selfie|pan|aadhaar  (multipart field "file")
// Returns { key } — the private-bucket storage key to send back in POST /api/kyc.
const uploadKycFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const type = ['selfie', 'pan', 'aadhaar'].includes(req.query.type) ? req.query.type : null;
    if (!type) return res.status(400).json({ message: 'Invalid document type.' });

    const { size, buffer } = req.file;
    if (size > MAX_SIZE_BYTES) return res.status(400).json({ message: 'File size must be under 5MB' });

    const sniffed = sniff(buffer, type !== 'selfie'); // selfie = image only; docs allow PDF
    if (!sniffed) {
      return res.status(400).json({
        message: type === 'selfie'
          ? 'Selfie must be a JPG, PNG or WEBP image.'
          : 'Document must be a JPG, PNG, WEBP or PDF.',
      });
    }

    const rand = Math.random().toString(36).slice(2, 8);
    const key = `${req.user.id}/${type}_${Date.now()}_${rand}.${sniffed.ext}`;
    const { error } = await supabaseAdmin.storage
      .from(KYC_BUCKET)
      .upload(key, buffer, { contentType: sniffed.mime, upsert: true, contentDisposition: 'attachment' });
    if (error) return safeError(res, error, 500, 'Document upload failed. Please try again.');

    res.json({ key, type });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/kyc/me — own status + masked, non-sensitive fields. Never raw PII.
const getMyKyc = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions').select('*').eq('user_id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.json({ status: 'not_started' });

    res.json({
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
      has_selfie: !!data.selfie_url,
      has_pan_doc: !!data.pan_doc_url,
      has_aadhaar_doc: !!data.aadhaar_doc_url,
      review_note: data.review_note,
      reviewed_at: data.reviewed_at,
      created_at: data.created_at,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/kyc — create/replace the caller's submission. Sets status='pending'.
const submitKyc = async (req, res) => {
  try {
    const b = req.body || {};
    const errors = [];

    const fullName = String(b.full_name || '').trim();
    const email = String(b.email || '').trim();
    const phone = String(b.phone || '').replace(/\D/g, '');
    const pan = String(b.pan_number || '').trim().toUpperCase();
    const aadhaar = String(b.aadhaar_number || '').replace(/\D/g, '');

    if (!fullName) errors.push('Full name is required.');
    if (!RE.email.test(email)) errors.push('Valid email is required.');
    if (!RE.phone.test(phone)) errors.push('Valid phone number is required.');
    if (!RE.pan.test(pan)) errors.push('PAN must match ABCDE1234F.');
    if (!RE.aadhaar.test(aadhaar)) errors.push('Aadhaar must be 12 digits.');

    const holderName = String(b.holder_name || '').trim();
    const bankName = String(b.bank_name || '').trim();
    const account = String(b.account_number || '').replace(/\s/g, '');
    const ifsc = String(b.ifsc || '').trim().toUpperCase();
    const branch = String(b.branch || '').trim();
    const accountType = String(b.account_type || '').trim();

    if (!holderName) errors.push('Account holder name is required.');
    if (!bankName) errors.push('Bank name is required.');
    if (!/^[0-9]{6,18}$/.test(account)) errors.push('Valid account number is required.');
    if (!RE.ifsc.test(ifsc)) errors.push('IFSC must match ABCD0123456.');
    if (!['savings', 'current'].includes(accountType.toLowerCase())) errors.push('Account type must be savings or current.');

    // Document keys come from prior /upload calls. Enforce the key belongs to the
    // caller (keys are prefixed with the user id) so nobody can attach someone
    // else's uploaded document.
    const ownKey = (k) => typeof k === 'string' && k.startsWith(`${req.user.id}/`);
    if (!ownKey(b.selfie_url)) errors.push('Live selfie is required.');
    if (!ownKey(b.pan_doc_url)) errors.push('PAN document is required.');
    if (!ownKey(b.aadhaar_doc_url)) errors.push('Aadhaar document is required.');

    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const payload = {
      user_id: req.user.id,
      full_name: fullName,
      email,
      phone,
      pan_number: encrypt(pan),
      aadhaar_number: encrypt(aadhaar),
      holder_name: holderName,
      bank_name: bankName,
      account_number: encrypt(account),
      ifsc,
      branch,
      account_type: accountType.toLowerCase(),
      selfie_url: b.selfie_url,
      pan_doc_url: b.pan_doc_url,
      aadhaar_doc_url: b.aadhaar_doc_url,
      status: 'pending',
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    // One row per user (user_id UNIQUE) — upsert so re-submission after a
    // rejection overwrites and returns to 'pending'.
    const { error } = await supabaseAdmin
      .from('kyc_submissions').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;

    res.status(201).json({ status: 'pending' });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { uploadKycFile, getMyKyc, submitKyc };
