import React from 'react';
import { Clock, MessageSquare, Paperclip, AlertCircle, MoreHorizontal } from 'lucide-react';
import { JobCard, JobStatus, ProcessPhase } from '../../types/jobCard';

interface JobCardItemProps {
  job: JobCard;
  onClick: (job: JobCard) => void;
  onMove?: (job: JobCard) => void; 
}

const JobCardItem: React.FC<JobCardItemProps> = ({ job, onClick, onMove }) => {
  const isHighPriority = job.priority === 'High';
  const isDueSoon = new Date(job.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000); // Less than 24h

  const getPhaseColor = (phase?: ProcessPhase) => {
    switch (phase) {
      case 'Picking': return 'bg-blue-100 text-blue-700';
      case 'Packing': return 'bg-purple-100 text-purple-700';
      case 'ProcessData': return 'bg-pink-100 text-pink-700';
      case 'Storage': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div 
      onClick={() => onClick(job)}
      className={`
        group relative p-4 mb-3 rounded-xl border transition-all duration-200 cursor-pointer
        bg-white/40 backdrop-blur-md
        hover:bg-white/60
        hover:shadow-lg hover:-translate-y-1
        ${isHighPriority ? 'border-l-4 border-l-red-400 border-t border-r border-b border-red-200/50' : 'border-white/40 shadow-sm'}
      `}
    >
      {/* Header: ID and Priority */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">#{job.id.slice(-4)}</span>
        {isHighPriority && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
            <AlertCircle size={10} />
            HIGH
          </span>
        )}
      </div>

      {/* Main Content */}
      <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{job.title}</h3>
      <p className="text-xs text-slate-500 mb-3">{job.customer}</p>

      {/* Tags / Phase */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
          {job.product}
        </span>
        {job.currentPhase && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getPhaseColor(job.currentPhase)}`}>
            {job.currentPhase}
          </span>
        )}
      </div>

      {/* Footer: Stats & Due Date */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3 text-slate-400">
          {(job.commentsCount > 0) && (
            <div className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors">
              <MessageSquare size={14} />
              <span>{job.commentsCount}</span>
            </div>
          )}
          {(job.attachments?.length > 0) && (
            <div className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors">
              <Paperclip size={14} />
              <span>{job.attachments.length}</span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 text-xs font-medium ${isDueSoon ? 'text-orange-500' : 'text-slate-400'}`}>
          <Clock size={14} />
          <span>{new Date(job.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
      
      {/* Quick Actions (Appear on Hover) */}
      {onMove && (
         <button 
           onClick={(e) => { e.stopPropagation(); onMove(job); }}
           className="absolute top-2 right-2 p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
         >
           <MoreHorizontal size={16} />
         </button>
      )}
    </div>
  );
};

export default JobCardItem;

