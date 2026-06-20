import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadImage } from "../services/api";
import BackButton from "../components/common/BackButton";
import ImageCropper from "../components/common/ImageCropper";
import FeatureGate from "../components/common/FeatureGate";
import UsernameField from "../components/dashboard/UsernameField";
import CategoriesSection from "../components/dashboard/CategoriesSection";
import toast from "react-hot-toast";
import {
  getColorsForPlan,
  canUseCustomHex,
  getContrastColor,
  getPlanBorderColor,
  DEFAULT_THEME_COLOR,
  isValidHex,
  FREE_COLORS,
  CREATOR_COLORS,
} from "../utils/themeUtils";

// ─── Minimal plan label for display ─────────────────────────────────────────
const PLAN_LABEL = { explorer: 'Explorer', creator: 'Creator', professional: 'Professional' };

// ─── Social platform config ──────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram',  placeholder: 'https://instagram.com/yourhandle', type: 'url' },
  { key: 'youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@yourchannel', type: 'url' },
  { key: 'linkedin',  label: 'LinkedIn',   placeholder: 'https://linkedin.com/in/you',      type: 'url' },
  { key: 'facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/yourpage',    type: 'url' },
  { key: 'twitter',   label: 'X (Twitter)',placeholder: 'https://x.com/yourhandle',         type: 'url' },
  { key: 'whatsapp',  label: 'WhatsApp',   placeholder: 'https://wa.me/919876543210',       type: 'url' },
  { key: 'website',   label: 'Website',    placeholder: 'https://yourwebsite.com',           type: 'url' },
  { key: 'github',    label: 'GitHub',     placeholder: 'https://github.com/you',            type: 'url' },
  { key: 'email',     label: 'Public Email',placeholder: 'hello@you.com',                   type: 'email' },
];

// ─── Color Swatch ────────────────────────────────────────────────────────────
const Swatch = ({ color, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(color.hex)}
    title={color.name}
    className="relative w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
    style={{
      backgroundColor: color.hex,
      borderColor: selected ? '#111827' : 'transparent',
      boxShadow: selected ? '0 0 0 2px #111827' : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
    }}
  >
    {selected && (
      <span className="absolute inset-0 flex items-center justify-center">
        <svg style={{ color: getContrastColor(color.hex) }} className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )}
  </button>
);

// ─── Mini Profile Preview ────────────────────────────────────────────────────
const ProfilePreview = ({ form, themeColor }) => {
  const tc = isValidHex(themeColor) ? themeColor : DEFAULT_THEME_COLOR;
  const textOnTheme = getContrastColor(tc);
  const borderColor = getPlanBorderColor('explorer'); // preview always uses explorer

  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm w-full max-w-[240px] mx-auto text-xs select-none">
      {/* Cover */}
      <div className="h-16 relative" style={{ background: form.cover_image ? undefined : `linear-gradient(135deg, ${tc}33, ${tc}88)` }}>
        {form.cover_image && (
          <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      {/* Avatar */}
      <div className="flex justify-center -mt-7">
        <div className="w-14 h-14 rounded-xl border-2 overflow-hidden bg-gray-100 flex-shrink-0" style={{ borderColor }}>
          {form.profile_image
            ? <img src={form.profile_image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                {form.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
          }
        </div>
      </div>
      {/* Info */}
      <div className="px-3 pb-3 pt-1.5 text-center">
        <p className="font-bold text-gray-900 truncate">{form.name || 'Your Name'}</p>
        {(form.profession || form.tagline) && (
          <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: tc }}>
            {form.profession || form.tagline}
          </p>
        )}
        {form.bio && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{form.bio}</p>
        )}
        {/* CTA Preview */}
        <div className="mt-3 rounded-lg px-3 py-1.5 font-bold text-[10px]" style={{ background: tc, color: textOnTheme }}>
          Book a Session
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProfileSetup = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [cropper, setCropper] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // 'info' | 'social' | 'appearance' | 'integrations'

  const plan = user?.plan || 'explorer';
  const availableColors = getColorsForPlan(plan);
  const customHexAllowed = canUseCustomHex(plan);

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    tagline: "",
    profession: "",
    profile_image: "",
    cover_image: "",
    location: "",
    theme_color: DEFAULT_THEME_COLOR,
    reschedule_fee: 0,
    social_links: {
      instagram: "", youtube: "", linkedin: "", facebook: "",
      twitter: "", whatsapp: "", website: "", github: "", email: "",
    },
  });
  const [customHex, setCustomHex] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const sl = user.social_links || {};
      setForm({
        name:           user.name || "",
        username:       user.username || "",
        bio:            user.bio || "",
        tagline:        user.tagline || "",
        profession:     user.profession || "",
        profile_image:  user.profile_image || "",
        cover_image:    user.cover_image || "",
        location:       user.location || "",
        theme_color:    user.theme_color || DEFAULT_THEME_COLOR,
        reschedule_fee: Number(user.reschedule_fee ?? 0),
        social_links: {
          instagram: sl.instagram || "",
          youtube:   sl.youtube   || "",
          linkedin:  sl.linkedin  || "",
          facebook:  sl.facebook  || "",
          twitter:   sl.twitter   || "",
          whatsapp:  sl.whatsapp  || "",
          website:   sl.website   || "",
          github:    sl.github    || "",
          email:     sl.email     || "",
        },
      });
      if (user.theme_color) setCustomHex(user.theme_color);
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setDirty(true);
  };
  const handleSocialChange = (e) => {
    setForm({ ...form, social_links: { ...form.social_links, [e.target.name]: e.target.value } });
    setDirty(true);
  };
  const handleColorSelect = (hex) => {
    setForm(f => ({ ...f, theme_color: hex }));
    setDirty(true);
  };
  const handleCustomHex = (e) => {
    const v = e.target.value;
    setCustomHex(v);
    if (isValidHex(v)) {
      setForm(f => ({ ...f, theme_color: v }));
      setDirty(true);
    }
  };

  // Cover photo: plain upload — no crop/zoom/rotate. The image renders with
  // object-fit: cover everywhere, so editing UI is unnecessary complexity.
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use a JPG, PNG or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await uploadImage(fd, "covers");
      setForm(f => ({ ...f, cover_image: data.url }));
      setDirty(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await updateProfile(form);
      updateUser({ ...data, token: user.token, refresh_token: user.refresh_token });
      toast.success("Profile saved!");
      setDirty(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const tc = isValidHex(form.theme_color) ? form.theme_color : DEFAULT_THEME_COLOR;

  // ── Section tab helper ──
  const Tab = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setActiveSection(id)}
      className={`btn px-4 py-2 text-sm font-medium transition-colors ${
        activeSection === id
          ? 'bg-gray-900 text-white'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-5xl">
      <BackButton hasUnsavedChanges={dirty} />
      <h1 className="text-2xl font-bold mb-1">Creator Profile</h1>
      <p className="text-gray-500 text-sm mb-6">
        How guests discover and book you. Plan: <span className="font-semibold text-gray-700">{PLAN_LABEL[plan]}</span>
      </p>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
        <Tab id="info"         label="Profile Info" />
        <Tab id="categories"   label="Categories" />
        <Tab id="social"       label="Social Links" />
        <Tab id="appearance"   label="Appearance" />
        <Tab id="integrations" label="Integrations" />
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── SECTION: Profile Info ── */}
        {activeSection === 'info' && (
          <div className="space-y-5">
            {/* Images */}
            {cropper === "profile" && (
              <ImageCropper aspect={1} folder="profiles" currentUrl={form.profile_image}
                onUploaded={(url) => { setForm(f => ({ ...f, profile_image: url })); setDirty(true); setCropper(null); }}
                onClose={() => setCropper(null)} label="Profile Photo" />
            )}
            {/* Cover photo uses a plain file input — no editor */}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handleCoverFile} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl border-2 bg-gray-50 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderColor: getPlanBorderColor(plan) }}
                    onClick={() => setCropper("profile")}
                  >
                    {form.profile_image
                      ? <img src={form.profile_image} alt="" className="w-full h-full object-cover" />
                      : <svg className="w-6 h-6 m-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    }
                  </div>
                  <div>
                    <button type="button" onClick={() => setCropper("profile")}
                      className="btn btn--outline text-xs text-primary hover:underline px-3 py-1.5 block">
                      {form.profile_image ? "Change photo" : "Upload photo"}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">Border colour reflects your plan tier</p>
                  </div>
                </div>
              </div>
              <FeatureGate flag="cover_photo">
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Photo</label>
                  <div
                    className="rounded-xl border bg-gray-50 h-16 overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => !coverUploading && coverInputRef.current?.click()}
                  >
                    {coverUploading
                      ? <div className="flex items-center justify-center h-full text-xs text-gray-400">Uploading…</div>
                      : form.cover_image
                        ? <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
                        : <div className="flex items-center justify-center h-full text-xs text-gray-400">Click to upload cover photo</div>
                    }
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">JPG/PNG/WebP up to 2MB — shown full-width, auto-cropped to fit</p>
                </div>
              </FeatureGate>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ps-name" className="block text-sm font-medium mb-1">Creator Name</label>
                <input id="ps-name" type="text" name="name" required className="fb-input" value={form.name} onChange={handleChange} />
              </div>
              <UsernameField
                user={user}
                onChanged={(u) => updateUser({ ...user, username: u })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Creator Title</label>
                <input type="text" name="profession" placeholder="e.g. Founder and Developer" className="fb-input" value={form.profession} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" name="location" placeholder="e.g. Nagpur, Maharashtra" className="fb-input" value={form.location} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tagline</label>
              <input type="text" name="tagline" placeholder="Short one-liner about you" className="fb-input" value={form.tagline} onChange={handleChange} maxLength={100} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bio <span className="text-gray-400">({form.bio.length}/500)</span>
              </label>
              <textarea name="bio" rows={4} placeholder="Tell people about yourself..."
                className="fb-input resize-none" value={form.bio} onChange={handleChange} maxLength={500} />
            </div>
          </div>
        )}

        {/* ── SECTION: Categories ── */}
        {activeSection === 'categories' && (
          <CategoriesSection
            plan={plan}
            onSaved={(data) => updateUser({ ...user, primary_category: data.primary_category, categories: data.categories })}
          />
        )}

        {/* ── SECTION: Social Links ── */}
        {activeSection === 'social' && (
          <FeatureGate flag="social_links" fallback={
            <p className="text-sm text-gray-400">Social links are currently disabled.</p>
          }>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add your social profiles. Only filled links appear on your public page.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label htmlFor={`sl-${key}`} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input id={`sl-${key}`} type={type} name={key} placeholder={placeholder}
                      className="fb-input text-sm" value={form.social_links[key] || ''} onChange={handleSocialChange} />
                  </div>
                ))}
              </div>
            </div>
          </FeatureGate>
        )}

        {/* ── SECTION: Appearance & Branding ── */}
        {activeSection === 'appearance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: controls */}
            <div className="space-y-6">
              {/* Theme Color */}
              <FeatureGate flag="theme_colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Theme Color</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Applied to buttons, accents, and CTAs on your profile</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {PLAN_LABEL[plan]}
                    </span>
                  </div>

                  {/* Swatches */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableColors.map(color => (
                      <Swatch
                        key={color.hex}
                        color={color}
                        selected={form.theme_color === color.hex}
                        onClick={handleColorSelect}
                      />
                    ))}
                  </div>

                  {/* Pro custom hex */}
                  {customHexAllowed ? (
                    <FeatureGate flag="custom_hex_color">
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-8 h-8 rounded-lg border flex-shrink-0"
                          style={{ background: isValidHex(customHex) ? customHex : '#e5e7eb' }}
                        />
                        <input
                          type="text"
                          placeholder="#4F46E5"
                          maxLength={7}
                          className="fb-input text-sm font-mono flex-1"
                          value={customHex}
                          onChange={handleCustomHex}
                        />
                        <span className="text-xs text-gray-400">Custom</span>
                      </div>
                    </FeatureGate>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {plan === 'creator' ? '16 colours available. Upgrade to Pro for custom hex.' : 'Upgrade to Creator for more colours.'}
                    </p>
                  )}
                </div>
              </FeatureGate>

              {/* Profile Border Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Profile Photo Border</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-xl border-2 bg-white flex-shrink-0" style={{ borderColor: getPlanBorderColor(plan) }} />
                  <div>
                    <p className="text-xs text-gray-600">
                      Your border is <span className="font-semibold" style={{ color: getPlanBorderColor(plan) }}>
                        {plan === 'professional' ? 'Gold (Pro)' : plan === 'creator' ? 'Orange (Creator)' : 'Grey (Explorer)'}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Border updates automatically with your plan tier</p>
                  </div>
                </div>
              </div>

              {/* Upcoming Features */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Coming Soon</h3>
                <ul className="text-xs text-amber-700 space-y-0.5">
                  <li>• Gradient backgrounds</li>
                  <li>• Custom font selection</li>
                  <li>• Theme packs &amp; presets</li>
                  <li>• Dark mode profile</li>
                </ul>
              </div>
            </div>

            {/* Right: live preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Live Preview</h3>
              <ProfilePreview form={form} themeColor={tc} />
              <p className="text-center text-xs text-gray-400 mt-3">Updates as you type</p>

              {/* Booking CTA preview */}
              <div className="mt-5 rounded-2xl border p-4 bg-white">
                <p className="text-xs text-gray-400 mb-2 font-medium">Booking Button Preview</p>
                <button
                  type="button"
                  className="btn w-full py-2.5 font-bold text-sm transition-all"
                  style={{ background: tc, color: getContrastColor(tc) }}
                >
                  Book a Session
                </button>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Text auto-adjusts for readability (WCAG AA)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: Integrations ── */}
        {activeSection === 'integrations' && (
          <div className="space-y-5">
            {/* Google Calendar */}
            <FeatureGate flag="google_calendar">
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Google icon */}
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Google Calendar</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Auto-create Google Meet links for every confirmed online booking.
                      </p>
                      {user?.google_calendar_connected && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (user?.google_calendar_connected) {
                        toast('To disconnect, contact support or revoke access in your Google account settings.', { icon: 'ℹ️' });
                      } else {
                        // Trigger Google OAuth — same as Dashboard connect button
                        import('../services/api').then(({ getGoogleAuthUrl }) =>
                          getGoogleAuthUrl().then(({ data }) => { window.location.href = data.url; })
                        );
                      }
                    }}
                    className={`btn btn--outline flex-shrink-0 px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                      user?.google_calendar_connected
                        ? 'text-gray-500 hover:bg-gray-50'
                        : 'text-[#FE5100] hover:bg-[#FFF4EE]'
                    }`}
                  >
                    {user?.google_calendar_connected ? 'Connected ✓' : 'Connect'}
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-gray-400 space-y-1">
                  <p>• Works with online services only (not in-person)</p>
                  <p>• Guests receive the Meet link in their confirmation email</p>
                  <p>• Bookings appear on your Google Calendar automatically</p>
                </div>
              </div>
            </FeatureGate>

            {/* Reschedule fee */}
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Booking Policy</h3>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="reschedule_fee">Guest reschedule fee</label>
                <select
                  id="reschedule_fee"
                  className="fb-input"
                  value={form.reschedule_fee ?? 0}
                  onChange={(e) => { setForm({ ...form, reschedule_fee: Number(e.target.value) }); setDirty(true); }}
                >
                  <option value={0}>Free (₹0)</option>
                  <option value={10}>₹10 per reschedule (from the 2nd)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">The platform keeps this fee. The guest's first reschedule is always free.</p>
              </div>
            </div>

            {/* Coming soon integrations */}
            <div className="bg-gray-50 border border-dashed rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Coming Soon</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Zoom', desc: 'Auto-create Zoom meeting links', icon: '🎥' },
                  { name: 'Notion', desc: 'Log bookings to a Notion database', icon: '📝' },
                  { name: 'Razorpay Payouts', desc: 'Instant payout scheduling', icon: '💸' },
                  { name: 'WhatsApp Business', desc: 'Send reminders via WhatsApp', icon: '💬' },
                ].map(i => (
                  <div key={i.name} className="flex items-center gap-3 bg-white border rounded-xl p-3 opacity-60">
                    <span className="text-xl">{i.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{i.name}</p>
                      <p className="text-[10px] text-gray-400">{i.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save button — always visible */}
        <div className="mt-8 pt-5 border-t flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn flex-1 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ background: tc }}
          >
            {loading ? "Saving…" : "Save Profile"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="btn btn--outline px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
