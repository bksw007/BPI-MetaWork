import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Clock, Kanban, ClipboardList, FileBarChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PendingHero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isApproved, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-pastel opacity-60"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-peach-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mint-200/20 rounded-full blur-3xl"></div>

      {/* Fixed Pending Status Badge */}
      {isAuthenticated && !isApproved && (
        <div className="fixed top-20 left-4 z-50 animate-fade-in-down">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-md border border-amber-200 shadow-xl rounded-2xl ring-1 ring-amber-100">
            <div className="relative">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">สถานะ</span>
              <span className="text-sm font-bold text-amber-600 leading-none">รอการอนุมัติ</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Empty LEFT placeholder */}
            <div></div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                // Logged in (Pending) - Status badge handles info, no button needed here
                <></>
              ) : (
                // Not logged in (Guest)
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/login?mode=signup')}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6">
             <img src="/concept 2.1.png" alt="BPI MetaWork" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-800">
            BPI MetaWork
            <span className="block text-4xl md:text-5xl lg:text-6xl mt-2 bg-gradient-to-r from-lavender-500 via-peach-400 to-coral-400 bg-clip-text text-transparent">
              Professional Tracking
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            ระบบจัดการงานแพ็คแบบครบวงจร ติดตามความคืบหน้าแบบ <span className="whitespace-nowrap">Real-time</span>
            <span className="block mt-2 text-lg text-slate-500">
              พร้อมกระดานงาน รายงานการแพ็ค และ Analytics ที่ครอบคลุม
            </span>
          </p>

          {/* Stats preview with icons */}
          <div className="mt-24 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-lavender-200/50">
              <Kanban className="w-8 h-8 text-lavender-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Smart Board</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-peach-200/50">
              <ClipboardList className="w-8 h-8 text-peach-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Live Tracking</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-mint-200/50">
              <FileBarChart className="w-8 h-8 text-mint-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Packing Report</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PendingHero;
