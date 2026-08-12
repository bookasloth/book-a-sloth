import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useKyc } from '../../context/KycContext';
import { Card, FormField, Input, Select, Button } from '../../components/dashboard/ui';

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function KycBank() {
  const { bank, setBank, address, setAddress } = useKyc();
  const navigate = useNavigate();
  const set = (k) => (e) => setBank((b) => ({ ...b, [k]: e.target.value }));
  const setAddr = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const next = (e) => {
    e.preventDefault();
    const ifsc = bank.ifsc.trim().toUpperCase();
    const acct = bank.account_number.replace(/\s/g, '');
    if (!bank.holder_name.trim()) return toast.error('Enter the account holder name');
    if (!bank.bank_name.trim()) return toast.error('Enter the bank name');
    if (!/^[0-9]{6,18}$/.test(acct)) return toast.error('Enter a valid account number');
    if (!IFSC.test(ifsc)) return toast.error('IFSC must look like ABCD0123456');
    const pin = (address.addr_postal_code || '').replace(/\s/g, '');
    if (!address.addr_street1.trim()) return toast.error('Enter your address line 1');
    if (!address.addr_city.trim()) return toast.error('Enter your city');
    if (!address.addr_state.trim()) return toast.error('Enter your state');
    if (!/^[0-9]{6}$/.test(pin)) return toast.error('PIN code must be 6 digits');
    setBank((b) => ({ ...b, ifsc, account_number: acct }));
    setAddress((a) => ({ ...a, addr_postal_code: pin }));
    navigate('/dashboard/kyc/flow/selfie');
  };

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-0.5 text-base font-semibold text-gray-900">Bank account</h2>
      <p className="mb-4 text-sm text-gray-500">Payouts are sent to this account after verification.</p>
      <form onSubmit={next} className="space-y-3">
        <FormField label="Account holder name" htmlFor="b-holder" required className="mb-0">
          <Input id="b-holder" value={bank.holder_name} onChange={set('holder_name')} placeholder="As per bank records" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Bank name" htmlFor="b-bank" required className="mb-0">
            <Input id="b-bank" value={bank.bank_name} onChange={set('bank_name')} placeholder="e.g. HDFC Bank" />
          </FormField>
          <FormField label="Branch" htmlFor="b-branch" className="mb-0">
            <Input id="b-branch" value={bank.branch} onChange={set('branch')} placeholder="Optional" />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Account number" htmlFor="b-acct" required className="mb-0">
            <Input id="b-acct" inputMode="numeric" value={bank.account_number} onChange={set('account_number')} placeholder="Account number" />
          </FormField>
          <FormField label="IFSC" htmlFor="b-ifsc" required hint="Format: ABCD0123456" className="mb-0">
            <Input id="b-ifsc" value={bank.ifsc} onChange={set('ifsc')} maxLength={11} className="uppercase" placeholder="HDFC0001234" />
          </FormField>
        </div>
        <FormField label="Account type" htmlFor="b-type" required className="mb-0">
          <Select id="b-type" value={bank.account_type} onChange={set('account_type')}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </Select>
        </FormField>

        <div className="pt-2">
          <h3 className="mb-0.5 text-sm font-semibold text-gray-900">Registered address</h3>
          <p className="mb-3 text-xs text-gray-500">Required to set up your payout account.</p>
          <div className="space-y-3">
            <FormField label="Address line 1" htmlFor="a-street1" required className="mb-0">
              <Input id="a-street1" value={address.addr_street1} onChange={setAddr('addr_street1')} placeholder="House / street" />
            </FormField>
            <FormField label="Address line 2" htmlFor="a-street2" className="mb-0">
              <Input id="a-street2" value={address.addr_street2} onChange={setAddr('addr_street2')} placeholder="Area / landmark (optional)" />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="City" htmlFor="a-city" required className="mb-0">
                <Input id="a-city" value={address.addr_city} onChange={setAddr('addr_city')} placeholder="City" />
              </FormField>
              <FormField label="State" htmlFor="a-state" required className="mb-0">
                <Input id="a-state" value={address.addr_state} onChange={setAddr('addr_state')} placeholder="State" />
              </FormField>
            </div>
            <FormField label="PIN code" htmlFor="a-pin" required hint="6 digits" className="mb-0">
              <Input id="a-pin" inputMode="numeric" maxLength={6} value={address.addr_postal_code} onChange={setAddr('addr_postal_code')} placeholder="560001" />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" size="lg" variant="outline" full onClick={() => navigate('/dashboard/kyc/flow/start')}>Back</Button>
          <Button type="submit" size="lg" full>Continue</Button>
        </div>
      </form>
    </Card>
  );
}
