import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Video, MapPin, Repeat, Loader2 } from 'lucide-react';
import { saveOnboardingDetails, getOnboardingStatus, activateFreePlan } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';
import WhatsAppVerify from '../../components/whatsapp/WhatsAppVerify';
import LivePreviewCard from './LivePreviewCard';
import { personaLabelForSlug } from './personas';

const BOOKING_TYPES = [
  { id: 'online_only',  label: 'Online',      Icon: Video },
  { id: 'offline_only', label: 'In person',   Icon: MapPin },
  { id: 'both',         label: 'Both',        Icon: Repeat },
];

const PreviewStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const { user } = useAuth();

  const [bookingType, setBookingType] = useState(null);
  const [tagline, setTagline]         = useState('');
  const [waPhoneUi, setWaPhoneUi]     = useState({ country: '', number: '' });
  const [waVerified, setWaVerified]   = useState(false);
  const [saving, setSaving]           = useState(false);

  // Persona / photo / name are already on the profile — hydrate once so the
  // preview reflects what's actually stored, not what AuthContext happens to
  // have cached. Falls back gracefully to whatever we do have.
  const [profileSnap, setProfileSnap] = useState(null);
  useEffect(() => {
    let alive = true;
    getOnboardingStatus()
      .then(({ data }) => { if (alive) setProfileSnap(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const displayName = profileSnap?.name || user?.name || '';
  const photoUrl    = profileSnap?.profileImage || user?.profile_image || null;
  const personaLabel = useMemo(
    () => personaLabelForSlug(profileSnap?.primaryCategory),
    [profileSnap?.primaryCategory],
  );

  const canContinue = bookingType && !saving;

  const persist = async ({ whatsappSkipped } = {}) => {
    setSaving(true);
    try {
      await saveOnboardingDetails({
        booking_type: bookingType,
        tagline: tagline.trim() || undefined,
        ...(whatsappSkipped ? { whatsapp_skipped: true } : {}),
      });
      // Paywall deferred: every host goes live on the free plan and adds their
      // first service on the next screen. Upgrades live in the dashboard,
      // surfaced after first-booking value — not as a wall before it. (The /plan
      // screen still exists as a resume/upgrade entry, just not a forced step.)
      await activateFreePlan();
      navigate(`/vendor-register/${slug}/live`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save — try again.');
      setSaving(false);
    }
  };

  const handleWaVerified = () => {
    // Just mark verified — do NOT auto-advance. Auto-persisting here yanked the
    // host to the next step mid-form (e.g. before they finished the tagline).
    setWaVerified(true);
    toast.success('WhatsApp verified.');
  };

  const handleContinue = () => {
    if (!bookingType) {
      toast.error('Pick how you meet clients.');
      return;
    }
    persist({ whatsappSkipped: !waVerified });
  };

  if (!ready) {
    return (
      <>
        <ProgressBar current={3} total={4} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const waNumber = waPhoneUi.number ? `${waPhoneUi.country}${waPhoneUi.number.replace(/[^\d]/g, '')}` : '';

  return (
    <>
      <ProgressBar current={3} total={4} />
      <div className="app-container py-6 sm:py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">

            {/* ── Left: form ─────────────────────────────────────────── */}
            <div>
              <button
                onClick={() => navigate(`/vendor-register/${slug}/category`)}
                className="text-sm text-gray-500 hover:text-gray-800 mb-3 inline-block"
              >
                ← Back
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                Fill in a few details
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Watch your page take shape as you type.
              </p>

              {/* Tagline */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  One-line tagline <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value.slice(0, 120))}
                  placeholder="e.g. Helping first-time founders find product-market fit"
                  className="fb-input w-full"
                  maxLength={120}
                />
                <p className="mt-1 text-xs text-gray-400">{tagline.length}/120</p>
              </div>

              {/* Booking type */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">How do you meet clients?</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKING_TYPES.map(({ id, label, Icon }) => {
                    const on = bookingType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setBookingType(id)}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border-2 transition text-xs font-medium ${
                          on ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary/50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp (optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  WhatsApp updates <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/40">
                  <WhatsAppVerify
                    onVerified={handleWaVerified}
                    onPhoneChange={setWaPhoneUi}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  You can add or verify later from your dashboard.
                </p>
              </div>

              {/* Continue */}
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                    Saving…
                  </span>
                ) : waVerified ? 'Continue →' : 'Continue without WhatsApp →'}
              </button>
            </div>

            {/* ── Right: live preview ─────────────────────────────────── */}
            <aside className="lg:sticky lg:top-24">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                Live preview
              </p>
              <LivePreviewCard
                displayName={displayName}
                slug={slug}
                personaLabel={personaLabel}
                bookingType={bookingType}
                whatsappNumber={waVerified ? waNumber : ''}
                tagline={tagline}
                photoUrl={photoUrl}
              />
              <p className="mt-3 text-xs text-gray-400 text-center">
                Photo, bio, and services can be edited anytime after you publish.
              </p>
            </aside>

          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewStep;
