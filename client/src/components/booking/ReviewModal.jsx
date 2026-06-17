import { useState } from 'react';
import Modal from './Modal';
import { createReview } from '../../services/api';
import toast from 'react-hot-toast';

export default function ReviewModal({ open, booking, onClose, onDone, direction = 'guest_to_host' }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const isHostReviewing = direction === 'host_to_guest';
  const title = isHostReviewing ? 'Review your guest' : 'Leave a review';
  const subjectName = isHostReviewing
    ? (booking?.guest_name || 'your guest')
    : (booking?.['profiles!bookings_host_id_fkey']?.name || booking?.profiles?.name || 'your host');

  const submit = async () => {
    if (rating < 1) { toast.error('Pick a rating'); return; }
    setBusy(true);
    try {
      const { data } = await createReview({ booking_id: booking.id, rating, comment, direction });
      toast.success('Thanks for the review!');
      onDone?.(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-3">How was your experience with {subjectName}?</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`rate ${n}`} onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-[#FE5100]' : 'text-gray-300'}`}>★</button>
        ))}
      </div>
      <textarea className="fb-input mb-4" rows={3} placeholder="Optional comment"
        value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={submit} disabled={busy}
        className="w-full bg-[#FE5100] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </Modal>
  );
}
