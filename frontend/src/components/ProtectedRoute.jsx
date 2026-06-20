import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, isLibrarian } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'librarian' && !isLibrarian) return <Navigate to="/catalog" replace />;
  if (role === 'member' && isLibrarian)     return <Navigate to="/dashboard" replace />;

  return children;
}
