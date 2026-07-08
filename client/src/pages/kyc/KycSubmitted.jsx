import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../../components/dashboard/ui';

export default function KycSubmitted() {
  return (
    <Card className="flex flex-col items-center p-8 text-center">
      <CheckCircle2 className="mb-4 h-14 w-14 text-green-500" />
      <h2 className="mb-1 text-lg font-bold text-gray-900">Submitted for review</h2>
      <p className="mb-6 max-w-sm text-sm text-gray-500">
        Your KYC is under review. We'll notify you once it's approved — usually within 1–2 business days.
        Payouts unlock automatically after approval.
      </p>
      <Link to="/dashboard/kyc" className="w-full max-w-xs">
        <Button size="lg" full>Back to verification</Button>
      </Link>
    </Card>
  );
}
