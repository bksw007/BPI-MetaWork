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
       // Pastel neon effect
       if (color.includes('blue') || color.includes('powder')) return 'shadow-[0_0_15px_rgba(212,232,245,0.3)] border-powder-500/30';
       if (color.includes('emerald') || color.includes('mint')) return 'shadow-[0_0_15px_rgba(224,247,233,0.3)] border-mint-500/30';
       if (color.includes('lavender')) return 'shadow-[0_0_15px_rgba(232,213,255,0.3)] border-lavender-500/30';
       if (color.includes('peach')) return 'shadow-[0_0_15px_rgba(255,229,217,0.3)] border-peach-500/30';
       if (color.includes('amber') || color.includes('golden')) return 'shadow-[0_0_15px_rgba(255,216,155,0.3)] border-golden-500/30';
       return 'shadow-[0_0_15px_rgba(255,255,255,0.1)]';
     } else {
       // Pastel colored shadow
       if (color.includes('blue') || color.includes('powder')) return 'shadow-powder-200 shadow-lg';
       if (color.includes('emerald') || color.includes('mint')) return 'shadow-mint-200 shadow-lg';
       if (color.includes('lavender')) return 'shadow-lavender-200 shadow-lg';
       if (color.includes('peach')) return 'shadow-peach-200 shadow-lg';
       if (color.includes('amber') || color.includes('golden')) return 'shadow-golden-200 shadow-lg';
       return 'shadow-md';
     }
  };

  return (
    <div className={`rounded-xl p-6 flex items-start justify-between transition-all duration-300 ${
       isDarkMode 
         ? 'bg-slate-800/80 backdrop-blur-sm border border-lavender-200/30 text-white ' + getShadowClass() 
         : 'card-pastel ' + getShadowClass()
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