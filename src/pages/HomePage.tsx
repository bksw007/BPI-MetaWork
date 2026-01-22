import React from 'react';
import HomeHero from '../components/Landing/HomeHero';
import Features from '../components/Landing/Features';
import DashboardPreview from '../components/Landing/DashboardPreview';
import StatsShowcase from '../components/Landing/StatsShowcase';
import Footer from '../components/Landing/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HomeHero />
      <Features />
      <DashboardPreview />
      <StatsShowcase />
      <Footer />
    </div>
  );
};

export default HomePage;
