import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './src/pages/LandingPage';
import DashboardPage from './src/pages/DashboardPage';
import FirebaseTest from './src/components/FirebaseTest';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/test" element={<FirebaseTest />} />
    </Routes>
  );
};

export default App;
