import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  isDarkMode?: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen, 
  message = "Syncing data...",
  isDarkMode = false 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className={`max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden transform transition-all ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-lavender-400 to-lavender-500 p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-white">Syncing Data</h3>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className={`w-5 h-5 ${isDarkMode ? 'text-lavender-400' : 'text-lavender-600'}`} />
            <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {message}
            </p>
          </div>
          
          {/* Loading Dots */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-lavender-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-lavender-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-lavender-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Syncing with Firebase...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
