import React, { useState, useEffect } from 'react';
import UnifiedNavbar from '@components/UnifiedNavbar';
import KanbanBoard from '@components/board/KanbanBoard';
import GanttView from '@components/board/GanttView';
import { KanbanSquare, Plus, Sparkles, LayoutGrid, CalendarRange } from 'lucide-react';
import NewJobCardForm from '@components/board/NewJobCardForm';
import { createJobCard, subscribeToJobCards } from '@services/jobCardService';
import { JobCard } from '@types/jobCard';

import { useAuth } from '@contexts/AuthContext';

import { useSearchParams } from 'react-router-dom';

const KanbanBoardPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { user, userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // View State - Initialize from URL param or default to 'kanban'
  const initialView = searchParams.get('view') === 'gantt' ? 'gantt' : 'kanban';
  const [viewMode, setViewMode] = useState<'kanban' | 'gantt'>(initialView);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data Subscription (Hoisted)
  useEffect(() => {
    console.log("Initializing KanbanBoardPage Subscription...");
    const unsubscribe = subscribeToJobCards(
      (data) => {
        setJobs(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Subscription failed:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCreateJob = async (record: any) => {
    try {
        const jobData = {
          title: `${record.product} - ${record.consignee} - ${record.mode}`,
          customer: record.customer,
          product: record.product,
          consignee: record.consignee,
          mode: record.mode,
          siQty: record.siQty,
          jobQty: record.jobQty,
          startDate: record.startDate,
          dueDate: record.dueDate,
          priority: record.priority,
          assignees: record.assignees,
          remark: record.remark
        };
        
        const userId = user?.uid || 'anonymous';
        await createJobCard(jobData, userId);
        setShowAddModal(false);
    } catch (error) {
        console.error("Failed to create job", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-kanban overflow-hidden">
      {/* Unified Navigation Header */}
      <UnifiedNavbar>
         <div className="flex items-center gap-1 mr-4">
            <button 
                onClick={() => {
                    setViewMode('kanban');
                    setSearchParams({ view: 'kanban' });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'kanban' 
                    ? 'bg-orange-50 text-orange-500' 
                    : 'text-slate-900 hover:text-orange-500 hover:bg-orange-50'
                }`}
            >
                <KanbanSquare className="w-4 h-4" />
                Kanban
            </button>
            <button 
                onClick={() => {
                    setViewMode('gantt');
                    setSearchParams({ view: 'gantt' });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'gantt' 
                    ? 'bg-orange-50 text-orange-500' 
                    : 'text-slate-900 hover:text-orange-500 hover:bg-orange-50'
                }`}
            >
                <CalendarRange className="w-4 h-4" />
                Timeline
            </button>
            <a href="/report" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-900 hover:text-orange-500 hover:bg-orange-50`}>
                <LayoutGrid className="w-4 h-4" />
                Report
            </a>
         </div>
      </UnifiedNavbar>

      <main className="flex-1 min-h-0 flex flex-col pt-6 pb-0">
        {/* Board Title Area - Adjusted padding to exactly 50px as requested */}
        <div className="px-[50px] mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                            {viewMode === 'kanban' ? 'Kanban Board' : 'Project Timeline'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Manage packing jobs efficiently.</p>
                    </div>
                </div>

                {/* Add Job Button - Pastel & Glass Theme */}
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:bg-white/60 hover:-translate-y-0.5 active:scale-95 transition-all ring-1 ring-white/40"
                >
                    <Plus size={18} />
                    Create New Job
                </button>
            </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 min-h-0">
             {viewMode === 'kanban' ? (
                 <KanbanBoard externalJobs={jobs} externalIsLoading={isLoading} />
             ) : (
                 <div className="h-full px-[50px] pb-6">
                     <GanttView jobs={jobs} isLoading={isLoading} />
                 </div>
             )}
        </div>
      </main>

      {/* Create Job Modal */}
      {showAddModal && (
          <div 
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200"
             onClick={() => setShowAddModal(false)}
          >
            <div 
               className="bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] border border-white/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-300"
               onClick={(e) => e.stopPropagation()}
            >
              {/* Header Section with Page Background */}
              <div className="bg-gradient-kanban px-8 py-6 relative border-b border-white/10">
                <button 
                   onClick={() => setShowAddModal(false)}
                   className="absolute right-6 top-6 p-2 hover:bg-white/20 rounded-full text-slate-600 transition-colors"
                >
                   <Plus className="rotate-45" size={24} />
                </button>

                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/40 shadow-sm">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                   </div>
                   <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight">Create New Job</h2>
                </div>
              </div>

              {/* Form Content Section */}
              <div className="p-8">
                <NewJobCardForm 
                  onSave={handleCreateJob}
                  onCancel={() => setShowAddModal(false)}
                  isDarkMode={false}
                />
              </div>
            </div>
          </div>
       )}
    </div>
  );
};

export default KanbanBoardPage;

