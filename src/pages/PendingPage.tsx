import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PendingHero from '../components/Landing/PendingHero';
import Features from '../components/Landing/Features';
import DashboardPreview from '../components/Landing/DashboardPreview';
import StatsShowcase from '../components/Landing/StatsShowcase';
import PendingFooter from '../components/Landing/PendingFooter';

const PendingPage: React.FC = () => {
  const { isApproved } = useAuth();

  // Redirect approved users to Home, preventing back-button access
  if (isApproved) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen">
      <PendingHero />
      <Features />
      <DashboardPreview />
      <StatsShowcase />
      <PendingFooter />
    </div>
  );
};

export default PendingPage;
