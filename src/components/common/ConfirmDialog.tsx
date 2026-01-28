import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white border border-white/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">{title}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-8">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
                isDanger 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
