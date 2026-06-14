import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { updateOnboardingStep, uploadImage } from '../../services/api';
import ProgressBar from './ProgressBar';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — must match server (uploadRoutes multer limit)

const ProfileStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [profileImage, setProfileImage] = useState(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file after an error fires onChange again.
    e.target.value = '';
    if (!file) return;

    // Client-side guards with specific messages (mirror server rules).
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported format. Use JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`Image is ${mb}MB. Maximum allowed is 2MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file); // server multer field is "image"
      const { data } = await uploadImage(formData, 'vendor-profiles');
      setProfileImage(data.url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(resolveUploadError(error));
    } finally {
      setUploading(false);
    }
  };

  // Turn an upload failure into an actionable, contextual message.
  const resolveUploadError = (error) => {
    if (!error.response) {
      return 'Network issue — check your connection and try again.';
    }
    const { status, data } = error.response;
    // Server sends a JSON { message } for validation/storage errors — prefer it.
    if (data?.message) return data.message;
    if (status === 413) return 'Image is too large. Maximum allowed is 2MB.';
    if (status === 401) return 'Session expired. Please refresh and try again.';
    if (status >= 500) return 'Storage/server error. Please try again in a moment.';
    return 'Could not upload image. Please try a different file.';
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      await updateOnboardingStep({
        slug,
        step: 7,
        data: {
          profile_image: profileImage,
          bio,
        },
      });

      toast.success('Profile saved');
      navigate(`/vendor-register/${slug}/first-service`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateOnboardingStep({
        slug,
        step: 7,
        data: { profile_image: null, bio: '' },
      });

      navigate(`/vendor-register/${slug}/first-service`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={7} total={10} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete your profile</h1>
          <p className="text-gray-500 text-sm mb-6">
            A good profile photo and bio help you get booked faster.
          </p>

          {/* Profile Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Profile Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 mx-auto mb-3 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition overflow-hidden bg-gray-50"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" strokeWidth={2} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-center text-xs text-gray-500">
              {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
            </p>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">About You</label>
            <textarea
              className="fb-input resize-none"
              placeholder="Tell guests about yourself (max 160 chars)"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              {bio.length}/160 characters
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={loading || uploading}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-primary text-sm font-medium hover:underline"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileStep;
