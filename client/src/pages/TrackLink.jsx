// bookasloth.com/r/<code> — the cold-call WhatsApp "Visit website" button. Logs the
// click on the lead (so the caller sees who's looking), then lands on the homepage
// with the founder's referral so a signup is credited.
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trackLinkClick } from '../services/api';

const TARGET = '/?ref=sndatarkar';

export default function TrackLink() {
  const { code } = useParams();
  useEffect(() => {
    const go = () => window.location.replace(TARGET);
    const t = setTimeout(go, 1500);   // never strand the visitor on a slow API
    trackLinkClick(code).catch(() => {}).finally(() => { clearTimeout(t); go(); });
    return () => clearTimeout(t);
  }, [code]);
  return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Opening Book A Sloth…</div>;
}
