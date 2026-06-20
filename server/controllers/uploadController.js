const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_FOLDERS = ['profiles', 'covers', 'services', 'branding'];

// Content-based image detection via magic bytes — the client-supplied mimetype
// and filename extension are both attacker-controlled, so they are never
// trusted. Rejects SVG/HTML/polyglots that could execute if served inline.
const sniffImage = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: '.png', mime: 'image/png' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  return null;
};

// POST /api/upload/image
// Accepts multipart/form-data with field "image"
// Returns { url: 'https://...' }
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const { size, buffer } = req.file;

    // Authorization: only vendors (hosts) and admins may upload — stops a guest
    // account being used as free file hosting. Admin sessions (req.admin) pass.
    if (!req.admin) {
      const { data: prof } = await supabaseAdmin
        .from('profiles').select('role').eq('id', req.user?.id).maybeSingle();
      if (!prof || prof.role !== 'host') {
        return res.status(403).json({ message: 'Only hosts can upload images.' });
      }
    }

    if (size > MAX_SIZE_BYTES) {
      return res.status(400).json({ message: 'File size must be under 2MB' });
    }

    // Validate by CONTENT, not the (spoofable) client mimetype/extension.
    const sniffed = sniffImage(buffer);
    if (!sniffed) {
      return res.status(400).json({ message: 'File content is not a valid JPG, PNG, or WEBP image.' });
    }

    // Allowlist the destination folder so a crafted ?folder= cannot place files
    // outside the intended prefixes within the bucket.
    const folder = ALLOWED_FOLDERS.includes(req.query.folder) ? req.query.folder : 'uploads';
    const uploaderId = req.user?.id || req.admin?.id || 'admin';
    // Random suffix prevents predictable-key overwrite (upsert is on).
    const filename = `${folder}/${uploaderId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${sniffed.ext}`;

    // Upload to Supabase Storage (bucket: 'images')
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: sniffed.mime,
        upsert: true,
      });

    if (error) {
      return safeError(res, error, 500, 'Image upload failed. Please try again.');
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filename);

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('uploadImage error:', error);
    safeError(res, error);
  }
};

module.exports = { uploadImage };
