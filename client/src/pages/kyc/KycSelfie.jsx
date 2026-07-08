import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useKyc } from '../../context/KycContext';
import { uploadKycFile } from '../../services/api';
import { Card, Button } from '../../components/dashboard/ui';

export default function KycSelfie() {
  const { selfie, setSelfie } = useKyc();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [live, setLive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      toast.error('Could not access camera. Check browser permissions.');
    }
  }, []);

  // Cleanup: stop the camera when leaving the page so it doesn't stay live.
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) return toast.error('Capture failed, try again');
    stopCamera();
    setUploading(true);
    try {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const { data } = await uploadKycFile(file, 'selfie');
      setSelfie({ url: URL.createObjectURL(blob), key: data.key });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    setSelfie(null);
    startCamera();
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Live selfie</h2>
      <p className="mb-5 text-sm text-gray-500">Look straight at the camera in good light.</p>

      <div className="mx-auto mb-5 aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-gray-100">
        {selfie?.url ? (
          <img src={selfie.url} alt="Captured selfie" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
      </div>

      {!selfie?.key && !live && (
        <Button size="lg" full onClick={startCamera}><Camera className="h-4 w-4" /> Start camera</Button>
      )}
      {live && !selfie?.key && (
        <Button size="lg" full onClick={capture} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Capture'}
        </Button>
      )}
      {selfie?.key && (
        <Button size="lg" variant="outline" full onClick={retake}><RefreshCw className="h-4 w-4" /> Retake</Button>
      )}

      <div className="mt-4 flex gap-3">
        <Button type="button" size="lg" variant="outline" full onClick={() => navigate('/dashboard/kyc/flow/bank')}>Back</Button>
        <Button size="lg" full disabled={!selfie?.key} onClick={() => navigate('/dashboard/kyc/flow/documents')}>Continue</Button>
      </div>
    </Card>
  );
}
