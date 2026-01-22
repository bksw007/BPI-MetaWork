import React from 'react';
import PendingHero from '../components/Landing/PendingHero';
import Features from '../components/Landing/Features';
import DashboardPreview from '../components/Landing/DashboardPreview';
import StatsShowcase from '../components/Landing/StatsShowcase';
import Footer from '../components/Landing/Footer';

const PendingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <PendingHero />
      <Features />
      <DashboardPreview />
      <StatsShowcase />
      <Footer />
    </div>
  );
};

export default PendingPage;
