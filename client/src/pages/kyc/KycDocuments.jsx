import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useKyc } from '../../context/KycContext';
import { uploadKycFile } from '../../services/api';
import { Card, Button } from '../../components/dashboard/ui';

const MAX = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

function DocSlot({ label, type, doc, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > MAX) return toast.error('File must be under 5MB');
    setBusy(true);
    try {
      const { data } = await uploadKycFile(file, type);
      onUploaded({ key: data.key, name: file.name });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 hover:border-primary">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${doc?.key ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : doc?.key ? <FileCheck2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className="block truncate text-xs text-gray-400">{doc?.name || 'JPG, PNG, WEBP or PDF · max 5MB'}</span>
      </span>
      <input type="file" accept={ACCEPT} className="hidden" onChange={pick} disabled={busy} />
    </label>
  );
}

export default function KycDocuments() {
  const { docs, setDocs, done, submit } = useKyc();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!done.documents) return toast.error('Upload both documents');
    setSubmitting(true);
    try {
      await submit();
      navigate('/dashboard/kyc/flow/submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Upload documents</h2>
      <p className="mb-5 text-sm text-gray-500">Clear photo or scan of each document.</p>
      <div className="space-y-3">
        <DocSlot label="PAN card" type="pan" doc={docs.pan} onUploaded={(d) => setDocs((s) => ({ ...s, pan: d }))} />
        <DocSlot label="Aadhaar card" type="aadhaar" doc={docs.aadhaar} onUploaded={(d) => setDocs((s) => ({ ...s, aadhaar: d }))} />
      </div>
      <div className="mt-6 flex gap-3">
        <Button type="button" size="lg" variant="outline" full onClick={() => navigate('/dashboard/kyc/flow/selfie')}>Back</Button>
        <Button size="lg" full disabled={!done.documents || submitting} onClick={onSubmit}>
          {submitting ? 'Submitting…' : 'Submit for verification'}
        </Button>
      </div>
    </Card>
  );
}
