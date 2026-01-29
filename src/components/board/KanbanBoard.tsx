import React, { useState, useEffect, useMemo } from 'react';
import { JobCard, JobStatus, ProcessPhase } from '@types/jobCard';
import KanbanColumn from './KanbanColumn';
import JobCardDetailModal from './JobCardDetailModal';
import { subscribeToJobCards, moveJobCard } from '@services/jobCardService';
import { Loader2, LayoutGrid, PlayCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

interface KanbanBoardProps {
  externalJobs?: JobCard[];
  externalIsLoading?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ externalJobs, externalIsLoading }) => {
  const [internalJobs, setLocalJobs] = useState<JobCard[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  
  // Use external data if provided, otherwise local state
  const jobs = externalJobs || internalJobs;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalLoading;

  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  
  const { user, userProfile } = useAuth();
  
  // Construct user object for services/modals
  const currentUser = {
      id: user?.uid || 'anonymous',
      name: userProfile?.displayName || user?.displayName || 'Unknown',
      avatar: userProfile?.photoURL || undefined
  };

  useEffect(() => {
    // If using external data, skip internal subscription
    if (externalJobs) {
        setInternalLoading(false);
        return;
    }

    let unsubscribe: (() => void) | undefined;
    
    const initializeSubscription = async () => {
      try {
        console.log("Initializing Firestore subscription...");
        unsubscribe = subscribeToJobCards(
          (updatedJobs) => {
            console.log("Jobs updated:", updatedJobs.length);
            setLocalJobs(updatedJobs);
            setInternalLoading(false);
          },
          (error) => {
            console.error("Subscription Error (Permission/Network):", error);
            // Permission denied or other critical error -> Fallback to Mock Data immediately
            if (isLoading) {
              console.warn("Falling back to Mock Data due to error.");
              setLocalJobs(MOCK_JOBS);
              setInternalLoading(false);
            }
          }
        );
      } catch (error) {
        console.error("Failed to start subscription:", error);
        setLocalJobs(MOCK_JOBS);
        setInternalLoading(false);
      }
    };

    initializeSubscription();

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timed out. Using Mock Data for preview.");
        setLocalJobs(MOCK_JOBS);
        setInternalLoading(false);
      }
    }, 3000);

    return () => {
      try {
        if (unsubscribe) unsubscribe();
      } catch (error) {
        console.warn("Error during Firestore unsubscribe (ignored):", error);
      }
      clearTimeout(timeoutId);
    };
  }, [externalJobs]);

  // Keep selectedJob in sync with real-time updates from Firestore
  useEffect(() => {
    if (selectedJob) {
      const updatedJob = jobs.find(j => j.id === selectedJob.id);
      if (updatedJob && (updatedJob.updatedAt !== selectedJob.updatedAt)) {
        setSelectedJob(updatedJob);
      }
    }
  }, [jobs, selectedJob?.id]);

  /* 
    Refactored Columns Configuration 
    Now explicitly defining 7 columns based on the new workflow.
  */
  const columns: { id: string; title: string; color: string; status?: JobStatus; phase?: ProcessPhase }[] = [
    { id: 'Allocated', title: 'Allocated', color: 'border-slate-400', status: 'Allocated' },
    { id: 'Picking', title: 'Picking', color: 'border-blue-500', status: 'OnProcess', phase: 'Picking' },
    { id: 'Packing', title: 'Packing', color: 'border-purple-500', status: 'OnProcess', phase: 'Packing' },
    { id: 'ProcessData', title: 'Data Process', color: 'border-pink-500', status: 'OnProcess', phase: 'ProcessData' },
    { id: 'Storage', title: 'Storage', color: 'border-indigo-500', status: 'OnProcess', phase: 'Storage' },
    { id: 'Waiting', title: 'Waiting JS', color: 'border-orange-500', status: 'Waiting' },
    { id: 'Complete', title: 'Finished', color: 'border-green-500', status: 'Complete' },
  ];

  const handleJobClick = (job: JobCard) => {
    setSelectedJob(job);
  };

  const handleJobMove = async (job: JobCard) => {
    console.log('Move job', job);
    
    let nextStatus: JobStatus = job.status;
    let nextPhase = job.currentPhase;

    if (job.status === 'Allocated') {
      nextStatus = 'OnProcess';
      nextPhase = 'Picking';
    } else if (job.status === 'OnProcess') {
        const phases: ProcessPhase[] = ['Picking', 'Packing', 'ProcessData', 'Storage'];
        const currentIdx = phases.indexOf(job.currentPhase || 'Picking');
        if (currentIdx < phases.length - 1) {
            nextPhase = phases[currentIdx + 1];
        } else {
            nextStatus = 'Waiting';
            nextPhase = undefined;
        }
    } else if (job.status === 'Waiting') nextStatus = 'Complete';
    else if (job.status === 'Complete') nextStatus = 'Report';
    else if (job.status === 'Report') return; // End

    try {
        await moveJobCard(job.id, nextStatus, nextPhase, currentUser.id);
    } catch (e) {
        console.error("Failed to move", e);
        // For mock data, we just update local state to simulate movement
        setLocalJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus, currentPhase: nextPhase } : j));
    }
  };

  const stats = useMemo(() => {
    return {
      allocated: jobs.filter(j => j.status === 'Allocated').length,
      onProcess: jobs.filter(j => j.status === 'OnProcess').length,
      waiting: jobs.filter(j => j.status === 'Waiting').length,
      highPriority: jobs.filter(j => j.priority === 'High' && j.status !== 'Report').length,
      dueToday: jobs.filter(j => {
         const due = new Date(j.dueDate);
         const today = new Date();
         return due.toDateString() === today.toDateString() && j.status !== 'Report';
      }).length
    };
  }, [jobs]);

  const handleUpdateStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
        let newPhase: ProcessPhase | undefined = undefined;
        if (newStatus === 'OnProcess') {
            newPhase = 'Picking';
        }
        await moveJobCard(jobId, newStatus, newPhase, currentUser.id);
    } catch (error) {
        console.error("Failed to update status", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats Header - Adjusted padding to exactly 50px as requested */}
      <div className="px-[50px] mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Allocated */}
            <div className="px-3 py-2 flex items-center justify-between bg-white/40 border border-white/30 shadow-sm backdrop-blur-2xl rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <LayoutGrid size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Allocated</span>
                </div>
                <span className="text-xl font-black text-slate-800">{stats.allocated}</span>
            </div>

            {/* On Processing */}
            <div className="px-3 py-2 flex items-center justify-between bg-white/40 border border-white/30 shadow-sm backdrop-blur-2xl rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <PlayCircle size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">On Process</span>
                </div>
                <span className="text-xl font-black text-slate-800">{stats.onProcess}</span>
            </div>

            {/* Waiting JS */}
            <div className="px-3 py-2 flex items-center justify-between bg-white/40 border border-white/30 shadow-sm backdrop-blur-2xl rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <Clock size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Waiting JS</span>
                </div>
                <span className="text-xl font-black text-slate-800">{stats.waiting}</span>
            </div>

            {/* High Priority */}
            <div className="px-3 py-2 flex items-center justify-between bg-white/40 border border-white/30 shadow-sm backdrop-blur-2xl rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <AlertTriangle size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">High Priority</span>
                </div>
                <span className="text-xl font-black text-red-600">{stats.highPriority}</span>
            </div>

            {/* Due Today */}
            <div className="px-3 py-2 flex items-center justify-between bg-white/40 border border-white/30 shadow-sm backdrop-blur-2xl rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <Calendar size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Due Today</span>
                </div>
                <span className="text-xl font-black text-orange-600">{stats.dueToday}</span>
            </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex-1 overflow-auto pb-0">
        <div className="flex h-full gap-4 w-fit min-w-full px-[50px]">
          {columns.map(col => {
             // Filter Logic:
             // If column has a specific 'phase', match both status and phase.
             // Otherwise, just match the status.
             const columnJobs = jobs.filter(j => {
                 if (col.phase) {
                     return j.status === col.status && j.currentPhase === col.phase;
                 }
                 return j.status === col.status;
             });

             return (
                <div key={col.id} className="h-full flex flex-col">
                    <KanbanColumn
                    status={col.id}
                    title={col.title}
                    color={col.color}
                    jobs={columnJobs}
                    onJobClick={handleJobClick}
                    />
                </div>
             );
          })}
        </div>
      </div>

       {/* Job Detail Modal */}
         {selectedJob && (
           <JobCardDetailModal 
              job={selectedJob} 
              onClose={() => setSelectedJob(null)} 
              onUpdateStatus={(status) => handleUpdateStatus(selectedJob.id, status)}
              currentUser={currentUser}
           />
         )}
    </div>
  );
};

// MOCK DATA for Preview (Fallback)
const MOCK_JOBS: JobCard[] = [
  {
    id: 'JOB-2024-001',
    title: 'Urgent Shipment to Japan',
    customer: 'Toyota Motors',
    product: 'Car Parts',
    jobQty: 150,
    status: 'Allocated',
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    priority: 'High',
    assignees: [{ uid: 'U1', name: 'Demo User' }],
    version: 1,
    attachments: [],
    commentsCount: 2,
    phaseProgress: { picking: 0, packing: 0, processData: 0, storage: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'JOB-2024-002',
    title: 'Electronics Setup',
    customer: 'Sony',
    product: 'Console',
    jobQty: 80,
    status: 'OnProcess',
    currentPhase: 'Packing',
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: 'Standard',
    assignees: [{ uid: 'U2', name: 'Other User' }],
    version: 1,
    attachments: [{id: '1', name: 'Invoice.pdf', url: '#', type: 'pdf', size: 1024, uploadedBy: 'Admin', uploadedAt: new Date().toISOString()}],
    commentsCount: 0,
    phaseProgress: { picking: 100, packing: 45, processData: 0, storage: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
   {
    id: 'JOB-2024-003',
    title: 'Waiting for Confirmation',
    customer: 'Honda',
    product: 'Engine Parts',
    jobQty: 12,
    status: 'Waiting',
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    priority: 'Standard',
    assignees: [{ uid: 'U1', name: 'Demo User' }],
    version: 1,
    attachments: [],
    commentsCount: 5,
    phaseProgress: { picking: 100, packing: 100, processData: 100, storage: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default KanbanBoard;
