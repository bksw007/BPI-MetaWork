import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes for approved users only
 * - If not authenticated → redirect to /pending
 * - If authenticated but pending → redirect to /pending
 * - If authenticated and approved → render children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isApproved, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-pastel">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lavender-300 border-t-lavender-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/pending" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};

/**
 * PublicRoute - For login page, redirect only if approved user
 * - Pending users can still access login page
 * - Approved users get redirected to /home
 */
export const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isApproved, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-pastel">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lavender-300 border-t-lavender-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    if (isApproved) {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

