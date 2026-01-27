import React from 'react';
import { RefreshCw, LayoutTemplate } from 'lucide-react';

interface UnifiedLoadingProps {
  /**
   * Mode of the loading screen:
   * - 'fullscreen': Replaces the entire page (absolute/fixed gradient background). Used for Page Transitions.
   * - 'modal': Overlay on top of existing content (backdrop blur). Used for Data Syncing.
   */
  mode?: 'fullscreen' | 'modal';
  isOpen?: boolean;
  message?: string;
}

const UnifiedLoading: React.FC<UnifiedLoadingProps> = ({ 
  mode = 'fullscreen', 
  isOpen = true, 
  message = 'Loading...' 
}) => {
  if (!isOpen) return null;

  // Common Spinner Component
  const Spinner = () => (
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <LayoutTemplate className="w-6 h-6 text-indigo-500 animate-pulse" />
      </div>
    </div>
  );

  // Standard Full Screen Loader (Used everywhere)
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[linear-gradient(135deg,#FFF5C3_10%,#9452A5_100%)] backdrop-blur-3xl">
      {/* Glass Card Container */}
      <div className="p-8 bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 flex flex-col items-center gap-6 animate-fade-in">
        <Spinner />
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-700">{message}</h3>
          <p className="text-slate-500 text-sm mt-1">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLoading;
