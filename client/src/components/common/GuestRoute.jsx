import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Role wall for guest-space routes (/user/*). Auth is owned by ProtectedRoute;
// this only enforces role: a host/superadmin has no guest space, so send them to
// their dashboard.
const GuestGate = ({ children }) => {
  const { user } = useAuth();
  const isHost = user?.role === 'host' || user?.role === 'superadmin';
  if (isHost) return <Navigate to="/dashboard" replace />;
  return children;
};

const GuestRoute = ({ children }) => (
  <ProtectedRoute>
    <GuestGate>{children}</GuestGate>
  </ProtectedRoute>
);

export default GuestRoute;
