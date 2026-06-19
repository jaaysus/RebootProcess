import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { token, user } = useSelector((state) => state.user || {});
  const isAuthenticated = !!token;
  const userRole = user?.role;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
