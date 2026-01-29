import React, { useMemo, useState } from 'react';
import { JobCard } from '../../types/jobCard';
import { Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface GanttViewProps {
  jobs: JobCard[];
  isLoading: boolean;
}

const GanttView: React.FC<GanttViewProps> = ({ jobs, isLoading }) => {
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <Calendar size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">Timeline</h3>
                    <p className="text-sm text-slate-500 font-medium">Project schedule overview</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Month Navigation */}
                <div className="flex items-center bg-white/50 rounded-lg p-1 border border-white/40">
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-1 hover:bg-white rounded-md transition-colors text-slate-600"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center">
                        {monthName}
                    </span>
                    <button 
                         onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                         className="p-1 hover:bg-white rounded-md transition-colors text-slate-600"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Gantt Area */}
        <div className="flex-1 overflow-auto relative">
             <div className="min-w-[1200px]">
                 {/* Header Row */}
                 <div className="grid grid-cols-[300px_1fr] sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/30 w-fit min-w-full">
                     <div className="p-4 font-bold text-slate-600 text-sm border-r border-white/30 pl-8 sticky left-0 z-20 bg-white/90 backdrop-blur-md shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]">
                         Job Details
                     </div>
                     <div className="flex">
                         {calendarDays.map((day, index) => (
                             <div key={index} className="flex-1 min-w-[40px] text-center py-2 border-r border-slate-100/50">
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">{day.toLocaleString('default', { weekday: 'short' })}</div>
                                 <div className="text-sm font-bold text-slate-700">{day.getDate()}</div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Job Rows */}
                 <div className="divide-y divide-slate-100/50 w-fit min-w-full">
                     {jobs.map(job => (
                         <div key={job.id} className="grid grid-cols-[300px_1fr] group hover:bg-white/40 transition-colors w-full">
                             {/* Left: Job Info */}
                             <div className="p-4 border-r border-white/30 pl-8 sticky left-0 z-10 bg-white/60 backdrop-blur-md group-hover:bg-white/80 transition-colors shadow-[4px_0_16px_-4px_rgba(0,0,0,0.05)]">
                                 <div className="font-bold text-slate-800 truncate" title={job.title}>{job.title}</div>
                                 <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                         job.status === 'Allocated' ? 'bg-slate-200 text-slate-600' :
                                         job.status === 'OnProcess' ? 'bg-blue-100 text-blue-600' :
                                         job.status === 'Waiting' ? 'bg-orange-100 text-orange-600' :
                                         job.status === 'Complete' ? 'bg-green-100 text-green-600' :
                                         'bg-purple-100 text-purple-600'
                                     }`}>
                                         {job.status}
                                     </span>
                                     <span className="text-xs text-slate-400 font-mono">#{job.id.slice(-4)}</span>
                                 </div>
                             </div>

                             {/* Right: Timeline Bar */}
                             <div className="relative h-full min-h-[60px] flex items-center bg-slate-50/20">
                                 {/* Grid Lines */}
                                 <div className="absolute inset-0 flex pointer-events-none">
                                     {calendarDays.map((_, i) => (
                                         <div key={i} className="flex-1 border-r border-slate-100/30 h-full"></div>
                                     ))}
                                 </div>

                                 {/* Progress Bar (Real Position) */}
                                 {(() => {
                                     // Calculate Position
                                     const monthStart = calendarDays[0].getTime();
                                     const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).getTime(); // End of last day
                                     const totalMonthTime = monthEnd - monthStart;

                                     const jobStart = new Date(job.startDate).getTime();
                                     const jobEnd = new Date(job.dueDate).getTime();

                                     // 1. Check if job is visible in this month
                                     if (jobEnd < monthStart || jobStart > monthEnd) return null;

                                     // 2. Calculate clamped range
                                     const visibleStart = Math.max(jobStart, monthStart);
                                     const visibleEnd = Math.min(jobEnd, monthEnd);
                                     
                                     // 3. Convert to Percentage
                                     const left = ((visibleStart - monthStart) / totalMonthTime) * 100;
                                     const width = ((visibleEnd - visibleStart) / totalMonthTime) * 100;
                                     
                                     // Min width for visibility
                                     const finalWidth = Math.max(width, 1); // At least 1%

                                     return (
                                        <div 
                                            className="absolute h-8 rounded-lg shadow-sm border border-white/20 flex items-center px-3 text-xs font-bold text-white overflow-hidden hover:brightness-110 transition-all cursor-pointer group/bar"
                                            style={{
                                                left: `${left}%`,
                                                width: `${finalWidth}%`,
                                                background: job.status === 'Allocated' ? 'linear-gradient(to right, #64748b, #94a3b8)' : 
                                                            job.status === 'OnProcess' ? 'linear-gradient(to right, #3b82f6, #6366f1)' :
                                                            job.status === 'Waiting' ? 'linear-gradient(to right, #f97316, #fbbf24)' :
                                                            'linear-gradient(to right, #22c55e, #10b981)'
                                            }}
                                            title={`${new Date(job.startDate).toLocaleDateString()} - ${new Date(job.dueDate).toLocaleDateString()}`}
                                        >
                                            <span className="drop-shadow-sm truncate">{job.customer}</span>
                                            
                                            {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block whitespace-nowrap z-50">
                                                <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-lg">
                                                    Due: {new Date(job.dueDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                     );
                                 })()}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    </div>
  );
};

export default GanttView;
