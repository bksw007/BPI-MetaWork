import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SuccessAnimation = ({ message = "Done!!" }: { message?: string }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-4 animate-[bounce_0.3s_infinite]">
          <CheckCircle2 size={48} className="text-white" strokeWidth={4} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 drop-shadow-sm uppercase tracking-wider animate-pulse">
          {message}
        </h2>
      </div>
    </div>
  );
};
