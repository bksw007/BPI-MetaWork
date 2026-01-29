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

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subValue }) => {
  // Get subtle icon color based on the color prop
  const getIconColor = () => {
    if (color.includes('blue') || color.includes('powder') || color.includes('sky')) return 'text-sky-400';
    if (color.includes('emerald') || color.includes('mint') || color.includes('green')) return 'text-emerald-400';
    if (color.includes('lavender') || color.includes('violet') || color.includes('purple')) return 'text-violet-400';
    if (color.includes('peach') || color.includes('rose') || color.includes('pink')) return 'text-rose-400';
    if (color.includes('amber') || color.includes('golden') || color.includes('orange')) return 'text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className="rounded-2xl p-5 flex items-start justify-between transition-all duration-300 bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      <div>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-700">{value}</h3>
        {subValue && <p className="text-xs mt-1 text-slate-400">{subValue}</p>}
      </div>
      <div className={`p-2.5 rounded-xl bg-white/50 border border-white/60 ${getIconColor()}`}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default StatsCard;