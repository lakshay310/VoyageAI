// src/components/layout/ProtectedRoute.jsx
// Wraps any page that requires the user to be logged in.
// If not authenticated, redirects to the login page.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show a loading screen while we verify the existing session (JWT check)
  if (loading) {
    return <LoadingSpinner message="Verifying your session..." />;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
