import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isHost } from '../../utils/roleRoutes';

// Hosting/Traveling toggle for dual-capability accounts (unified identity).
// Phase 1: switches the persisted mode and navigates to the matching space.
// Rendered only when the user can host; a pure guest never sees it.
export default function ModeSwitch() {
  const { user, mode, setMode } = useAuth();
  const navigate = useNavigate();
  if (!isHost(user)) return null;

  const go = (m) => {
    setMode(m);
    navigate(m === 'hosting' ? '/dashboard' : '/user/my-bookings');
  };

  return (
    <div className="inline-flex rounded-full border border-gray-200 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => go('traveling')}
        className={`px-3 py-1 rounded-full transition-colors ${mode === 'traveling' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Traveling
      </button>
      <button
        type="button"
        onClick={() => go('hosting')}
        className={`px-3 py-1 rounded-full transition-colors ${mode === 'hosting' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Hosting
      </button>
    </div>
  );
}
