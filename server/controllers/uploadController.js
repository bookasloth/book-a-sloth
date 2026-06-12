const { supabaseAdmin } = require('../config/supabase');
const path = require('path');

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// POST /api/upload/image
// Accepts multipart/form-data with field "image"
// Returns { url: 'https://...' }
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const { mimetype, size, buffer, originalname } = req.file;

    if (!ALLOWED_TYPES.includes(mimetype)) {
      return res.status(400).json({ message: 'Only JPG, JPEG, PNG, and WEBP files are allowed' });
    }
    if (size > MAX_SIZE_BYTES) {
      return res.status(400).json({ message: 'File size must be under 2MB' });
    }

    const ext = path.extname(originalname).toLowerCase() || '.jpg';
    const folder = req.query.folder || 'uploads';
    // Works for both vendor (protect → req.user) and admin (requireAdmin → req.admin) sessions.
    const uploaderId = req.user?.id || req.admin?.id || 'admin';
    const filename = `${folder}/${uploaderId}_${Date.now()}${ext}`;

    // Upload to Supabase Storage (bucket: 'images')
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(500).json({ message: 'Image upload failed: ' + error.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filename);

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('uploadImage error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadImage };
