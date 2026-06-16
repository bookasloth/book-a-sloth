import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { whatsappSendOtp, whatsappVerifyOtp } from '../../services/api';
import CountryCodeSelect, { defaultDialCode } from './CountryCodeSelect';

const RESEND_SECONDS = 30;

const WhatsAppVerify = ({ initialPhone = '', initialCountry, onVerified, onPhoneChange }) => {
  const [screen, setScreen] = useState('number'); // 'number' | 'otp'
  const [country, setCountry] = useState(initialCountry || defaultDialCode());
  const [number, setNumber] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const fullPhone = `${country}${number.replace(/[^\d]/g, '')}`;

  useEffect(() => () => clearInterval(timerRef.current), []);
  useEffect(() => { onPhoneChange?.({ country, number }); }, [country, number]); // eslint-disable-line

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    setError('');
    if (number.replace(/[^\d]/g, '').length < 6) { setError('Enter a valid WhatsApp number.'); return; }
    setLoading(true);
    try {
      const { data } = await whatsappSendOtp(fullPhone);
      if (!data?.success) throw new Error(data?.message || 'Could not send OTP');
      toast.success('OTP sent to your WhatsApp.');
      setScreen('otp');
      startCooldown();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (otp.trim().length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      const { data } = await whatsappVerifyOtp(fullPhone, otp.trim());
      if (!data?.verified) { setError(data?.message || 'Invalid OTP.'); return; }
      onVerified?.(fullPhone);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'number') {
    return (
      <div>
        <label htmlFor="wa-number" className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp number</label>
        <div className="flex gap-2">
          <CountryCodeSelect value={country} onChange={setCountry} disabled={loading} />
          <input
            id="wa-number" type="tel" inputMode="numeric"
            className="fb-input flex-1" placeholder="98765 43210"
            value={number} disabled={loading}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ''))}
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
        <button
          onClick={handleSend} disabled={loading}
          className="btn bg-primary text-white w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
          Send OTP
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">Enter the code sent to <strong>{fullPhone}</strong>.</p>
      <label htmlFor="wa-otp" className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
      <input
        id="wa-otp" type="text" inputMode="numeric" maxLength={6}
        className="fb-input fb-input--otp w-full" placeholder="––––––"
        value={otp} disabled={loading}
        onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
      <button
        onClick={handleVerify} disabled={loading}
        className="btn bg-primary text-white w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
        Verify OTP
      </button>
      <div className="mt-3 text-center">
        <button
          onClick={handleSend} disabled={loading || cooldown > 0}
          className="text-primary text-sm font-medium hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppVerify;
