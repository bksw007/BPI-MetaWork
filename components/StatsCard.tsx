import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subValue?: string;
  isDarkMode?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subValue, isDarkMode }) => {
  // Extract main color for shadow/glow (assuming standard tailwind colors, simple map or fallback)
  // Simple mapping based on the bg-class passed
  const getShadowClass = () => {
     if (isDarkMode) {
       // Neon effect: box-shadow with the specific color
       if (color.includes('blue')) return 'shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/30';
       if (color.includes('emerald')) return 'shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-500/30';
       if (color.includes('indigo')) return 'shadow-[0_0_15px_rgba(99,102,241,0.5)] border-indigo-500/30';
       if (color.includes('amber')) return 'shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-500/30';
       return 'shadow-[0_0_15px_rgba(255,255,255,0.1)]';
     } else {
       // Light mode colored shadow
       if (color.includes('blue')) return 'shadow-blue-200 shadow-lg';
       if (color.includes('emerald')) return 'shadow-emerald-200 shadow-lg';
       if (color.includes('indigo')) return 'shadow-indigo-200 shadow-lg';
       if (color.includes('amber')) return 'shadow-amber-200 shadow-lg';
       return 'shadow-md';
     }
  };

  return (
    <div className={`rounded-xl p-6 flex items-start justify-between transition-all duration-300 ${
       isDarkMode 
         ? 'bg-slate-800 border text-white ' + getShadowClass() 
         : 'bg-white border border-slate-100 ' + getShadowClass()
    } hover:-translate-y-1`}>
      <div>
        <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
        {subValue && <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};

export default StatsCard;