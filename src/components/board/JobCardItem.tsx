import React from 'react';
import { Clock, MessageSquare, Paperclip, AlertCircle, MoreHorizontal } from 'lucide-react';
import { JobCard, JobStatus, ProcessPhase } from '../../types/jobCard';

interface JobCardItemProps {
  job: JobCard;
  onClick: (job: JobCard) => void;
}

const JobCardItem: React.FC<JobCardItemProps> = ({ job, onClick }) => {
  const isHighPriority = job.priority === 'High';
  const isDueSoon = new Date(job.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000); // Less than 24h

  // Shake Logic
  const [isShaking, setIsShaking] = React.useState(false);
  const prevUpdated = React.useRef(job.updatedAt);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
     const updateTime = new Date(job.updatedAt).getTime();
     const now = Date.now();
     const isVeryRecent = (now - updateTime) < 5000;

     // If it's a recent change (from modal), start delay -> shake
     if (isVeryRecent) {
         const delayTimer = setTimeout(() => {
             setIsShaking(true);
             const shakeTimer = setTimeout(() => setIsShaking(false), 2000);
             return () => clearTimeout(shakeTimer);
         }, 1000);
         return () => clearTimeout(delayTimer);
     } else {
         setIsShaking(false);
     }
  }, [job.updatedAt]);

  return (
    <>
    <style>
    {`
      @keyframes shake-card {
        0%, 100% { transform: translateX(0); }
        10%, 90% { transform: translateX(-6px) rotate(-2deg); }
        20%, 80% { transform: translateX(5px) rotate(2deg); }
        30%, 70% { transform: translateX(-4px) rotate(-1deg); }
        40%, 60% { transform: translateX(2px) rotate(1deg); }
        50% { transform: translateX(-1px); }
      }
      .animate-shake-card {
        animation: shake-card 1.2s cubic-bezier(.36,.07,.19,.97) both;
      }
    `}
    </style>
    <div 
      onClick={() => onClick(job)}
      className={`
        group relative p-4 mb-3 rounded-xl border transition-all duration-200 cursor-pointer
        bg-white/40 backdrop-blur-md
        hover:bg-white/60
        hover:shadow-lg hover:-translate-y-1
        ${isHighPriority ? 'border-l-4 border-l-red-400 border-t border-r border-b border-red-200/50' : 'border-white/40 shadow-sm'}
        ${isShaking ? 'animate-shake-card ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
    >
      {/* Header: ID and Priority */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">#{job.id.slice(-4)}</span>
        {isHighPriority && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
            <AlertCircle size={10} />
            HIGH
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="mb-3">
          <div className="mb-2">
              <h3 className="font-bold text-slate-800 text-sm leading-tight">
                  {job.product}
              </h3>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {job.consignee || '-'} <span className="text-slate-400 font-normal">By</span> {job.mode || '-'}
              </p>
          </div>
          
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 px-1 mt-1">
              <span>SI QTY : {job.siQty || 0}</span>
              <span>Product QTY : {job.jobQty || 0}</span>
          </div>
      </div>

      {/* Footer: Due Date & Assignees */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
        <div className="flex items-center gap-3">
           {/* Due Date (Left Edge) */}
           <div className={`flex items-center gap-1.5 text-xs font-bold ${
              isDueSoon ? 'text-orange-500' : 'text-slate-500'
           }`}>
              <Clock size={13} />
              <span>{new Date(job.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
           </div>

           {/* Stats (Next to Due Date) */}
           <div className="flex items-center gap-2 text-slate-300 pl-2 border-l border-slate-200">
              {(job.commentsCount > 0) && (
                <div className="flex items-center gap-1 text-[10px] hover:text-blue-500 transition-colors">
                  <MessageSquare size={12} />
                  <span>{job.commentsCount}</span>
                </div>
              )}
              {(job.attachments?.length > 0) && (
                <div className="flex items-center gap-1 text-[10px] hover:text-blue-500 transition-colors">
                  <Paperclip size={12} />
                  <span>{job.attachments.length}</span>
                </div>
              )}
           </div>
        </div>

        {/* Assignees (Right) */}
        <div className="flex items-center">
            {job.assignees && job.assignees.length > 0 ? (
               <div className="flex -space-x-2">
                  {job.assignees.slice(0, 3).map((assignee, idx) => {
                      const name = (assignee as any).name || (assignee as any);
                      const photoURL = (assignee as any).photoURL;
                      return (
                          <div key={idx} className="w-7 h-7 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm overflow-hidden" title={name}>
                              {photoURL ? (
                                  <img src={photoURL} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                  name.charAt(0).toUpperCase()
                              )}
                          </div>
                      );
                  })}
                  {job.assignees.length > 3 && (
                     <div className="w-7 h-7 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                        +{job.assignees.length - 3}
                     </div>
                  )}
               </div>
            ) : (
               <div className="flex items-center gap-1 text-slate-300">
                   <MoreHorizontal size={14} />
               </div>
            )}
        </div>
      </div>
    </div>
    </>
  );
};

export default JobCardItem;

