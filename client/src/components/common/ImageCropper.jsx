import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../services/api';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * ImageCropper — horizontal layout, uploads via the backend (service-role)
 *
 * Props:
 *   aspect      - crop aspect ratio: 1 = square, 16/9, 3/1, etc.
 *   folder      - storage sub-folder: 'profiles' | 'covers' | 'services'
 *   currentUrl  - existing image URL shown before a new file is chosen
 *   onUploaded  - fn(url: string) called after successful upload
 *   onClose     - fn() to dismiss the modal
 *   label       - e.g. "Profile Photo"
 */
const ImageCropper = ({ aspect = 1, folder = 'uploads', currentUrl, onUploaded, onClose, label = 'Image' }) => {
  const canvasRef   = useRef(null);
  const fileRef     = useRef(null);
  const animRef     = useRef(null);

  const [imgEl, setImgEl]         = useState(null);
  const [scale, setScale]         = useState(1);
  const [offset, setOffset]       = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName]   = useState('');

  // Canvas dimensions: fixed height, width = height * aspect
  const CANVAS_H = 260;
  const CANVAS_W = Math.round(CANVAS_H * aspect);

  const draw = useCallback(() => {
    if (!imgEl || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(imgEl, offset.x, offset.y, imgEl.naturalWidth * scale, imgEl.naturalHeight * scale);
    // NOTE: the crop-area guide border is drawn via CSS on the <canvas> element
    // (see style below), NOT stroked onto the canvas — a canvas stroke gets baked
    // into the exported JPEG and would show a permanent border on every upload.
  }, [imgEl, scale, offset, CANVAS_W, CANVAS_H]);

  useEffect(() => { draw(); }, [draw]);

  const loadFile = (file) => {
    if (!ALLOWED.includes(file.type)) { toast.error('Only JPG, PNG, or WEBP allowed'); return; }
    if (file.size > MAX_SIZE)         { toast.error('File must be under 2 MB'); return; }
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const fitScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: (CANVAS_W - img.naturalWidth * fitScale) / 2, y: (CANVAS_H - img.naturalHeight * fitScale) / 2 });
      setImgEl(img);
    };
    img.src = url;
  };

  const onFileChange = (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); };

  // Drag handlers
  const startDrag = (x, y) => { setDragging(true); setDragStart({ x: x - offset.x, y: y - offset.y }); };
  const moveDrag  = (x, y) => { if (dragging) setOffset({ x: x - dragStart.x, y: y - dragStart.y }); };
  const endDrag   = () => setDragging(false);

  const handleSave = async () => {
    if (!canvasRef.current || !imgEl) return;
    setUploading(true);
    try {
      // Export the cropped canvas as a JPEG blob.
      const blob = await new Promise((resolve) =>
        canvasRef.current.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Failed to process image');

      // Upload via the backend (/api/upload/image), which writes with the
      // service-role key — so it bypasses Storage RLS and never depends on the
      // browser holding a fresh, same-project Supabase access token. The shared
      // API client also attaches auth and refreshes/retries on a 401.
      //
      // A direct browser -> Supabase Storage upload here failed with "new row
      // violates row-level security policy" whenever that token was stale or had
      // been minted against a different Supabase project than the client points
      // at (anon role has no INSERT policy on the 'images' bucket).
      const file = new File([blob], `${folder}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('image', file);

      const { data } = await uploadImage(fd, folder);

      onUploaded(data.url);
      toast.success(label + ' saved!');
      onClose();
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: Math.min(CANVAS_W + 300, 780) }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h3 className="font-semibold text-sm">Upload {label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body — horizontal layout */}
        <div className="flex flex-col sm:flex-row">
          {/* LEFT: Canvas / picker */}
          <div className="flex-shrink-0 bg-gray-950 flex items-center justify-center p-4"
            style={{ minHeight: CANVAS_H + 32 }}>
            {imgEl ? (
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ display:'block', maxWidth:'100%', cursor: dragging ? 'grabbing' : 'grab', borderRadius: 10, border: '2px solid rgba(99,102,241,0.9)' }}
                onMouseDown={e => startDrag(e.clientX, e.clientY)}
                onMouseMove={e => moveDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={endDrag}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300 transition-colors p-8"
                style={{ width: Math.min(CANVAS_W, 260), height: CANVAS_H }}
                onClick={() => fileRef.current?.click()}
              >
                {currentUrl ? (
                  <img src={currentUrl} alt="current" className="w-16 h-16 rounded-full object-cover mb-1 opacity-60"/>
                ) : (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                )}
                <span className="text-sm font-medium">Click to choose photo</span>
                <span className="text-xs opacity-60">JPG, PNG, WEBP · max 2 MB</span>
              </div>
            )}
          </div>

          {/* RIGHT: Controls */}
          <div className="flex-1 flex flex-col justify-between p-5 gap-4 min-w-0">
            <div className="space-y-4">
              {/* File info & change button */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Photo</p>
                {fileName ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span className="text-xs text-gray-600 truncate flex-1">{fileName}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No file selected</p>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn btn--outline mt-2 w-full py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {imgEl ? 'Choose different photo' : 'Choose photo'}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden" onChange={onFileChange}/>
              </div>

              {/* Zoom slider — only when image loaded */}
              {imgEl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Zoom</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                    <input type="range" min="0.1" max="3" step="0.02"
                      value={scale}
                      onChange={e => setScale(parseFloat(e.target.value))}
                      className="flex-1 accent-primary"/>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                    </svg>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Drag the photo to reposition it within the crop area.</p>
                </div>
              )}

              {/* Hint when no image */}
              {!imgEl && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">How it works</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>1. Choose a photo from your device</li>
                    <li>2. Drag to reposition</li>
                    <li>3. Use the zoom slider to fit</li>
                    <li>4. Click Save</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={onClose}
                className="btn btn--outline flex-1 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!imgEl || uploading}
                className="btn flex-1 bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
