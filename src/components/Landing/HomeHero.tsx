import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, UserPlus, LogOut, Kanban, ClipboardList, FileBarChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const HomeHero: React.FC = () => {
  // Force refresh
  const navigate = useNavigate();
  const { userProfile, logout, isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/pending');
  };

  // Fetch pending users count for admins
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchPendingCount = async () => {
      try {
        const db = getFirestore();
        const pendingQuery = query(collection(db, 'users'), where('status', '==', 'pending'));
        const snapshot = await getDocs(pendingQuery);
        setPendingCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };
    
    fetchPendingCount();
  }, [isAdmin]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-fresh opacity-90"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-peach-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mint-200/20 rounded-full blur-3xl"></div>

      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-20 h-16 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Left: Empty space for alignment */}
            <div></div>

            {/* Right: Navigation Menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2">

                <button
                  onClick={() => navigate('/profile')}
                  className="relative flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden md:inline">Profile</span>
                  {/* Red dot alert for pending users - Admin only */}
                  {isAdmin && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                  className="ml-2 flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 overflow-hidden drop-shadow-xl">
            <img src="/concept 2.1.png" alt="BPI MetaWork" className="w-full h-full object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-800">
            Welcome Back
            <span className="block text-4xl md:text-5xl lg:text-6xl mt-2 bg-gradient-to-r from-lavender-500 via-peach-400 to-coral-400 bg-clip-text text-transparent">
              {userProfile?.displayName || 'Team Member'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Ready to track your packing operations?
            <span className="block mt-2 text-lg text-slate-500">
              Access the dashboard to view real-time updates and reports.
            </span>
          </p>

          {/* Stats preview with icons */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <button 
              onClick={() => navigate('/smart-board')}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-lavender-200/50 hover:bg-white/80 hover:shadow-lg hover:border-lavender-300 transition-all cursor-pointer"
            >
              <Kanban className="w-8 h-8 text-lavender-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Smart Board</div>
            </button>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-peach-200/50">
              <ClipboardList className="w-8 h-8 text-peach-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Live Tracking</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-mint-200/50">
              <FileBarChart className="w-8 h-8 text-mint-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Packing Report</div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-indigo-200/50 hover:bg-white/80 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer"
            >
              <BarChart3 className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Packing Dashboard</div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
