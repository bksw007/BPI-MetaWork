import React from 'react';
import { JobCard, JobStatus } from '@types/jobCard';
import JobCardItem from './JobCardItem';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: JobStatus | string;
  title: string;
  jobs: JobCard[];
  color: string;
  onJobClick: (job: JobCard) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  status, 
  title, 
  jobs, 
  color, 
  onJobClick
}) => {
  return (
    <div className="flex flex-col min-w-[280px] w-full md:w-[280px] h-full max-h-full">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-xl bg-white/50 backdrop-blur-sm border-b-2 ${color}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <span className="bg-white/60 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
           {jobs.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30 rounded-b-xl border border-slate-100 custom-scrollbar">
        {jobs.length > 0 ? (
            jobs.map(job => (
            <JobCardItem 
              key={job.id} 
              job={job} 
              onClick={onJobClick} 
            />
          ))
        ) : (
          <div className="h-20 flex items-center justify-center border border-dashed border-slate-200/50 rounded-xl m-2 bg-white/30 backdrop-blur-sm">
            <span className="text-slate-300 text-xs font-medium">No jobs</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

