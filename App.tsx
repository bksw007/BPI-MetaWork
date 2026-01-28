import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './src/components/ProtectedRoute';

// Pages
import LoginPage from './src/pages/LoginPage';
import HomePage from './src/pages/HomePage';
import PendingPage from './src/pages/PendingPage';
import UserProfilePage from './src/pages/UserProfilePage';
import AdminProfilePage from './src/pages/AdminProfilePage';
import DashboardPage from './src/pages/DashboardPage';
import KanbanBoardPage from './src/pages/KanbanBoardPage';
import ActivityReportPage from './src/pages/ActivityReportPage';
import FirebaseTest from './src/components/FirebaseTest';

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
