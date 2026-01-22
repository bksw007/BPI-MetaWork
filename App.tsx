import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './src/components/ProtectedRoute';

// Pages
import LoginPage from './src/pages/LoginPage';
import LandingPage from './src/pages/LandingPage';
import UserProfilePage from './src/pages/UserProfilePage';
import DashboardPage from './src/pages/DashboardPage';
import FirebaseTest from './src/components/FirebaseTest';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Root Route - Redirect to landing */}
        <Route path="/" element={<Navigate to="/pending" replace />} />

        {/* Public Landing Page - accessible to everyone including pending users */}
        <Route path="/pending" element={<LandingPage />} />

        {/* Login Page - redirect if already logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />

        {/* Protected Routes (Approved Users Only) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />

        {/* Utility Routes */}
        <Route path="/test" element={<FirebaseTest />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
