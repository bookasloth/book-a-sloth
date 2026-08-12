import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { submitKyc as apiSubmitKyc } from '../services/api';

/**
 * KycContext — single source of truth for the multi-step KYC flow.
 * Replaces the per-page local useState that discarded data on navigate().
 * Holds identity + bank fields, the captured selfie, the two document files,
 * and the private-bucket storage keys returned by the upload endpoint.
 */
const KycContext = createContext(null);

const EMPTY_PERSONAL = { full_name: '', email: '', phone: '', pan_number: '', aadhaar_number: '' };
const EMPTY_BANK = { holder_name: '', bank_name: '', account_number: '', ifsc: '', branch: '', account_type: 'savings' };
// Registered address — required for the Razorpay Route linked account.
const EMPTY_ADDRESS = { addr_street1: '', addr_street2: '', addr_city: '', addr_state: '', addr_postal_code: '', addr_country: 'IN' };

export function KycProvider({ children }) {
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);
  const [bank, setBank] = useState(EMPTY_BANK);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  // selfie: { blob, url (object URL for preview), key (storage key) }
  const [selfie, setSelfie] = useState(null);
  // docs: { pan: {file,key,name}, aadhaar: {file,key,name} }
  const [docs, setDocs] = useState({ pan: null, aadhaar: null });

  // Step completion — drives the guards. A step is done when its data is present.
  const done = useMemo(() => {
    const p = personal.full_name && personal.email && personal.phone && personal.pan_number && personal.aadhaar_number;
    const b = bank.holder_name && bank.bank_name && bank.account_number && bank.ifsc && bank.account_type
      && address.addr_street1 && address.addr_city && address.addr_state && address.addr_postal_code;
    return {
      personal: !!p,
      bank: !!b,
      selfie: !!selfie?.key,
      documents: !!(docs.pan?.key && docs.aadhaar?.key),
    };
  }, [personal, bank, address, selfie, docs]);

  const submit = useCallback(async () => {
    const { data } = await apiSubmitKyc({
      ...personal,
      ...bank,
      ...address,
      selfie_url: selfie?.key,
      pan_doc_url: docs.pan?.key,
      aadhaar_doc_url: docs.aadhaar?.key,
    });
    return data;
  }, [personal, bank, address, selfie, docs]);

  const value = useMemo(
    () => ({ personal, setPersonal, bank, setBank, address, setAddress, selfie, setSelfie, docs, setDocs, done, submit }),
    [personal, bank, address, selfie, docs, done, submit]
  );

  return <KycContext.Provider value={value}>{children}</KycContext.Provider>;
}

export function useKyc() {
  const ctx = useContext(KycContext);
  if (!ctx) throw new Error('useKyc must be used within KycProvider');
  return ctx;
}
