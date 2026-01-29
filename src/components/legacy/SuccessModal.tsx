import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  isDarkMode?: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "Record saved successfully!",
  isDarkMode = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div 
        className={`relative max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-mint-400 to-mint-500 p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Success!</h3>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {message}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full animate-pulse"
              style={{ 
                width: '100%',
                animation: 'shrink 3s linear forwards'
              }}
            />
          </div>
          <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Auto-closing in a moment...
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
            isDarkMode 
              ? 'text-white/70 hover:text-white hover:bg-white/10' 
              : 'text-white/70 hover:text-white hover:bg-white/20'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
