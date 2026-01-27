/**
 * UnifiedNavbar Design System (Official Preset)
 * ==========================================
 * 
 * 1. Container Specs:
 *    - Height: h-16 (64px)
 *    - Background: bg-white/30 (Glassmorphism)
 *    - Blur: backdrop-blur-md
 *    - Border: border-b border-white/20
 * 
 * 2. Menu Item Specs (Children & Standard):
 *    - Font: font-medium, text-sm
 *    - Default Text: text-slate-900 (Black)
 *    - Shape: rounded-lg
 *    - Padding: px-3 py-2
 * 
 * 3. Interaction States (Hover):
 *    - Text: hover:text-orange-500 (Pastel Orange Text)
 *    - Background: hover:bg-orange-50 (Pastel Orange BG)
 * 
 * 4. Active State (Selected):
 *    - Text: text-orange-500
 *    - Background: bg-orange-50
 * 
 * 5. Layout:
 *    - Divider: border-l border-slate-300 (Single black line)
 *    - Home/Logout: Always grouped at the right
 * 
 * Please adhere to these specs when adding new menu items.
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UnifiedNavbarProps {
  children?: React.ReactNode;
  showHome?: boolean; // Default true
  showLogout?: boolean; // Default true
}

const UnifiedNavbar: React.FC<UnifiedNavbarProps> = ({ 
  children, 
  showHome = true, 
  showLogout = true 
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/pending');
  };

  return (
    <header className="bg-white/30 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 flex-none transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/home')}>
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
               <img src="/concept 2.1.png" alt="BPI MetaWork" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            {/* Lighter font weight as requested */}
            <h1 className="text-xl font-medium text-slate-700 hidden sm:block tracking-tight">BPI MetaWork</h1>
          </div>

          {/* Menu Section */}
          <div className="flex items-center gap-2">
            
            {/* Custom Page Actions (Injected via children) */}
            {children}

            {/* Standard Navigation Group - Separated by divider if there are children */}
            <div className={`flex items-center gap-2 ${children ? 'ml-2 pl-2 border-l border-slate-300' : ''}`}>
              {showHome && (
                <Link 
                  to="/home" 
                  className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 rounded-lg transition-all font-medium text-sm"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              )}

              {showLogout && (
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UnifiedNavbar;
