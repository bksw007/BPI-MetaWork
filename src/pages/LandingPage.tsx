import React from 'react';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import DashboardPreview from '../components/Landing/DashboardPreview';
import StatsShowcase from '../components/Landing/StatsShowcase';
import Footer from '../components/Landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <DashboardPreview />
      <StatsShowcase />
      <Footer />
    </div>
  );
};

export default LandingPage;
