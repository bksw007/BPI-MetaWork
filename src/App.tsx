import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from '@components/ProtectedRoute';

// Pages
import LoginPage from '@pages/LoginPage';
import HomePage from '@pages/HomePage';
import PendingPage from '@pages/PendingPage';
import UserProfilePage from '@pages/UserProfilePage';
import AdminProfilePage from '@pages/AdminProfilePage';
import DashboardPage from '@pages/DashboardPage';
import KanbanBoardPage from '@pages/KanbanBoardPage';
import ActivityReportPage from '@pages/ActivityReportPage';
import FirebaseTest from '@components/FirebaseTest';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Root Route - Redirect to pending */}
        <Route path="/" element={<Navigate to="/pending" replace />} />

        {/* Public Landing Page (Pending) - accessible to everyone */}
        <Route path="/pending" element={<PendingPage />} />

        {/* Login Page - redirect if already logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />

        {/* Protected Routes (Approved Users Only) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/kanban" element={
          <ProtectedRoute>
            <KanbanBoardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <ActivityReportPage />
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
