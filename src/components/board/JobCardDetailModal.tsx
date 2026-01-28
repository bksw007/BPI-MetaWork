import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Send, Paperclip, Clock, FileText, User, MessageSquare, History, 
  Loader2, Upload, Trash2, RotateCcw, CheckCircle2, AlertTriangle, 
  PlayCircle, MoreHorizontal, Calendar, Box, Truck, MapPin
} from 'lucide-react';
import { JobCard, JobStatus, Comment, Attachment, AuditLog, ProcessPhase } from '../../types/jobCard';
import { 
  addComment, 
  subscribeToComments, 
  uploadAttachment, 
  deleteAttachment, 
  subscribeToAuditLogs,
  updateJobCard,
  reverseJobCard,
  deleteJobCard
} from '../../services/jobCardService';
import EditJobCardForm from './EditJobCardForm';
import { SuccessAnimation } from '../common/SuccessAnimation';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface JobCardDetailModalProps {
  job: JobCard;
  onClose: () => void;
  onUpdateStatus: (status: JobStatus) => void;
  currentUser?: { id: string; name: string; avatar?: string };
}

// Simple debounce helper
function debounce(fn: Function, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}



// Standardized Phases for logic
const PHASE_ORDER: ProcessPhase[] = ['Picking', 'Packing', 'ProcessData', 'Storage'];
const PROGRESS_KEY_MAP: Record<string, ProcessPhase> = {
    'picking': 'Picking',
    'packing': 'Packing',
    'processData': 'ProcessData',
    'storage': 'Storage'
};

const JobCardDetailModal: React.FC<JobCardDetailModalProps> = ({ 
  job, 
  onClose, 
  onUpdateStatus,
  currentUser = { id: 'demo-user', name: 'Demo User', avatar: 'DU' }
}) => {
  if (!job) return null;

  // --- STATE ---
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Done!!");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localProgress, setLocalProgress] = useState(job.phaseProgress);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>(job.attachments || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMounted = useRef(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    isMounted.current = true;
    const unsubComments = subscribeToComments(job.id, (data) => {
        if (isMounted.current) setComments(data);
    });
    const unsubLogs = subscribeToAuditLogs(job.id, (data) => {
        if (isMounted.current) setAuditLogs(data);
    });
    
    return () => {
      isMounted.current = false;
      unsubComments();
      unsubLogs();
    };
  }, [job.id]);

  const lastInteraction = useRef(0);
  const pendingSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from Firestore only when NOT actively dragging/syncing AND not recently interacted
  useEffect(() => {
    const timeSinceInteraction = Date.now() - lastInteraction.current;
    
    // If syncing or interacted within last 2 seconds, ignore Firestore updates to prevent snap-back
    if (isSyncing || timeSinceInteraction < 2000) {
        return;
    }

    // Comparison check: Only update if server has NEWER or DIFFERENT progress 
    // This prevents race conditions where an old prop value (e.g. 98%) overwrites local 100%
    const shouldUpdate = !localProgress || 
        Object.keys(job.phaseProgress || {}).some(key => {
            const serverVal = job.phaseProgress?.[key as keyof typeof job.phaseProgress] || 0;
            const localVal = localProgress?.[key as keyof typeof localProgress] || 0;
            return serverVal !== localVal; // Update if any phase is different
        });

    if (shouldUpdate) {
        console.log('🔄 Syncing from server:', job.phaseProgress);
        setLocalProgress(job.phaseProgress);
    }
  }, [job.phaseProgress, isSyncing]);

  // Use a Ref to provide the absolute latest props to the async sync function
  const latestContext = useRef({ job, currentUser });
  useEffect(() => {
    latestContext.current = { job, currentUser };
  }, [job, currentUser]);

  // --- HANDLERS ---
  const handleSuccessAndClose = (msg: string = "Done!!") => {
      if (!isMounted.current) return;
      setSuccessMessage(msg);
      setShowSuccess(true);
      setTimeout(() => {
          if (isMounted.current) {
              setShowSuccess(false);
              onClose();
          }
      }, 700);
  };

  const handleReverseStatus = async () => {
    setConfirmReverse(true);
  };

  const handleConfirmReverse = async () => {
    try {
        await reverseJobCard(job, currentUser.id);
        handleSuccessAndClose("REVERSED !!"); 
    } catch (error) {
        console.error("Failed to reverse:", error);
    } finally {
        setConfirmReverse(false);
    }
  };

  const handleDelete = async () => {
      setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
      await deleteJobCard(job.id, currentUser.id);
      handleSuccessAndClose("DELETED !!");
  };

  const handleEdit = () => {
      setIsEditing(true);
      setIsMenuOpen(false);
  };

  const handleSaveEdit = async (updates: Partial<JobCard>) => {
      try {
          await updateJobCard(job.id, updates, currentUser.id);
          setIsEditing(false); 
      } catch (error) {
          console.error("Failed to update job:", error);
          alert("Failed to update job. Please try again.");
      }
  };

  const performSync = async (phase: string, value: number, newProgress: any) => {
    console.log('🔍 performSync:', { phase, value, newProgress });
    setIsSyncing(true);
    const { job: currentJob, currentUser: activeUser } = latestContext.current;
    
    try {
        const updates: any = { 
            phaseProgress: newProgress,
            updatedAt: new Date().toISOString()
        };

        let shouldClose = false;

        // Auto-Move Logic based on Plan
        if (value === 100) {
            console.log('✅ Value = 100, checking phase...', phase);
            if (phase === 'picking') updates.currentPhase = 'Packing';
            else if (phase === 'packing') updates.currentPhase = 'ProcessData';
            else if (phase === 'processData') updates.currentPhase = 'Storage';
            else if (phase === 'storage') {
                console.log('🚀 Moving to Waiting status');
                updates.status = 'Waiting';
                updates.currentPhase = undefined;
                shouldClose = true;
            }
        }

        await updateJobCard(currentJob.id, updates, activeUser.id);

        if (shouldClose) {
            handleSuccessAndClose("DONE !!");
        } else if (updates.currentPhase) {
            handleSuccessAndClose("MOVE !!");
        }
    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        setIsSyncing(false);
    }
  };

  const debouncedSave = useMemo(
    () => {
        return (phase: string, value: number, newProgress: any) => {
            if (pendingSyncRef.current) clearTimeout(pendingSyncRef.current);
            
            // If hitting 100%, flush IMMEDIATELY for snappy workflow
            if (value === 100) {
                performSync(phase, value, newProgress);
            } else {
                pendingSyncRef.current = setTimeout(() => {
                    performSync(phase, value, newProgress);
                }, 600);
            }
        };
    },
    [] // Stable dependencies, uses ref context
  );

  const handleUpdateProgress = (phase: keyof typeof job.phaseProgress, value: number) => {
    if (job.status !== 'OnProcess') {
        console.warn('⚠️ Job is not in OnProcess status');
        return;
    }

    lastInteraction.current = Date.now();
    const currentProgress = localProgress || { picking: 0, packing: 0, processData: 0, storage: 0 };
    
    const currentPhaseStr = job.currentPhase || 'Picking';
    const activePhaseIndex = PHASE_ORDER.indexOf(currentPhaseStr);
    const targetPhaseIndex = PHASE_ORDER.indexOf(PROGRESS_KEY_MAP[phase as string]);

    console.log('📊 Updating Progress:', { phase, value, activePhaseIndex, targetPhaseIndex });
    
    let finalValue = value;
    // Rule: If sliding a phase that is AFTER the current column's phase, lock it at 90%
    if (activePhaseIndex !== -1 && targetPhaseIndex > activePhaseIndex && finalValue > 90) {
        finalValue = 90;
    }
    
    const newProgress = { ...currentProgress, [phase]: finalValue };
    
    // Update UI immediately (Optimistic)
    setLocalProgress(newProgress);
    
    // Schedule server sync
    debouncedSave(phase, finalValue, newProgress);
  };
  
  const handleStatusChangeWithAnim = async (newStatus: JobStatus) => {
      try {
          await onUpdateStatus(newStatus);
          const msg = (newStatus === 'Complete' || newStatus === 'Report') ? "DONE !!" : "MOVE !!";
          handleSuccessAndClose(msg);
      } catch (error) {
          console.error("Status update error:", error);
      }
  };

  const handleWaitingInput = async (field: 'jobsheetNo' | 'referenceNo', value: string) => {
      await updateJobCard(job.id, { [field]: value }, currentUser.id);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment(job.id, currentUser.id, {
        content: commentText,
        userName: currentUser.name,
        userAvatar: currentUser.avatar
      });
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large (Max 10MB)'); return; }

    setIsUploading(true);
    try {
      const newAttachment = await uploadAttachment(job.id, file, currentUser.id, currentUser.name);
      setAttachments(prev => [...prev, newAttachment]);
    } catch (e) { console.error(e); alert('Upload failed'); } 
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm(`Delete "${attachment.name}"?`)) return;
    try {
      await deleteAttachment(job.id, attachment, currentUser.id);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (e) { console.error(e); }
  };

  // --- UI HELPERS ---
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Allocated': return 'from-slate-500 to-slate-600 bg-gradient-to-r text-white shadow-slate-200';
      case 'OnProcess': return 'from-blue-500 to-indigo-600 bg-gradient-to-r text-white shadow-blue-200';
      case 'Waiting': return 'from-orange-400 to-amber-500 bg-gradient-to-r text-white shadow-orange-200';
      case 'Complete': return 'from-green-500 to-emerald-600 bg-gradient-to-r text-white shadow-green-200';
      case 'Report': return 'from-purple-500 to-violet-600 bg-gradient-to-r text-white shadow-purple-200';
      default: return 'bg-slate-500 text-white';
    }
  };

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const canFinishWaiting = job.jobsheetNo && job.referenceNo;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl h-[90vh] bg-white/60 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 flex flex-col overflow-hidden relative">
        {showSuccess && <SuccessAnimation message={successMessage} />}
        
        <ConfirmDialog 
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Job?"
            message="Are you sure you want to permanently delete this job? This action cannot be undone."
            confirmLabel="Delete Permanently"
            isDanger
        />

        <ConfirmDialog 
            isOpen={confirmReverse}
            onClose={() => setConfirmReverse(false)}
            onConfirm={handleConfirmReverse}
            title="Reverse Status?"
            message="This will reset all progress in the current stage. Are you sure you want to continue?"
            confirmLabel="Reverse Status"
            isDanger
        />
        
        {/* 1. Header (Fixed) */}
        <div className="flex-none px-8 py-5 border-b border-white/30 bg-white/40 flex justify-between items-start z-20 backdrop-blur-md">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-lg ${getStatusColor(job.status)}`}>
                    {job.status}
                 </span>
                 <span className="text-slate-400 font-mono text-xs">#{job.id.slice(-6)}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight drop-shadow-sm">
                {job.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-md border border-white/20">
                    <User size={12} className="text-blue-500" /> {job.customer}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-md border border-white/20">
                    <Box size={12} className="text-purple-500" /> {job.product}
                  </span>
              </div>
           </div>
           
           {/* Menu & Close Section */}
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all shadow-sm border border-slate-200/50"
              >
                <MoreHorizontal size={20} />
              </button>
              
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-200/50"
              >
                <X size={20} />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                          <FileText size={16} /> Edit Job
                      </button>
                      
                      <div className="h-px bg-slate-100 my-0.5" />

                      {job.status === 'Allocated' ? (
                          <button 
                            onClick={handleDelete}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                              <Trash2 size={16} /> Delete Job
                          </button>
                      ) : (
                          <button 
                            onClick={handleReverseStatus}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                          >
                              <RotateCcw size={16} /> Reverse Status
                          </button>
                      )}
                  </div>
              )}
           </div>
        </div>

        {/* 2. Scrollable Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth">
           <div className="flex flex-col gap-8 p-8 pb-32">
               
               {isEditing ? (
                   <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm">
                       <EditJobCardForm 
                           job={job}
                           onSave={handleSaveEdit}
                           onCancel={() => setIsEditing(false)}
                           onDelete={handleDelete}
                           isDarkMode={false}
                       />
                   </div>
               ) : (
                   <>
              
              {/* SECTION: ACTION STAGE (Hero) */}
              <div id="action-stage" className="relative group">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl -z-10 blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                 <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl relative overflow-hidden">
                    {/* Decorative Background Icon */}
                    <div className="absolute -right-10 -top-10 text-slate-900/5 rotate-12 pointer-events-none">
                       <PlayCircle size={200} />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                                <span className="w-8 h-1 bg-slate-400 rounded-full"></span> Current Stage Action
                            </span>
                            {isSyncing && (
                                <span className="flex items-center gap-1.5 text-[10px] text-blue-500 animate-pulse normal-case font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 italic">
                                   Saving to cloud...
                                </span>
                            )}
                        </h2>

                        {/* Status-Specific Controls */}
                        {job.status === 'Allocated' && (
                            <div className="text-center py-4">
                               <p className="text-slate-500 mb-6 max-w-md mx-auto">This job has been allocated and is ready to start. Click the button below to move to the operation phase.</p>
                               <button 
                                 onClick={() => handleStatusChangeWithAnim('OnProcess')}
                                 className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                               >
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>
                                  <span className="relative flex items-center gap-2">
                                     Let's Start Operation <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                                  </span>
                               </button>
                            </div>
                        )}
                        {job.status === 'OnProcess' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    {(() => {
                                        const currentIdx = PHASE_ORDER.indexOf(job.currentPhase || 'Picking');
                                        
                                        return (
                                            <>
                                                <SliderControl 
                                                    label="1. Picking" icon={<Box size={14}/>}
                                                    value={localProgress?.picking || 0} 
                                                    onChange={(v: number) => handleUpdateProgress('picking', v)}
                                                    disabled={currentIdx > 0 || job.status !== 'OnProcess'}
                                                    color="text-blue-600" trackColor="bg-blue-500"
                                                />
                                                <SliderControl 
                                                    label="2. Packing" icon={<Box size={14}/>}
                                                    value={localProgress?.packing || 0} 
                                                    onChange={(v: number) => handleUpdateProgress('packing', v)}
                                                    disabled={currentIdx > 1 || job.status !== 'OnProcess' || currentIdx < 1}
                                                    color="text-purple-600" trackColor="bg-purple-500"
                                                />
                                                <SliderControl 
                                                    label="3. Data Process" icon={<FileText size={14}/>}
                                                    value={localProgress?.processData || 0} 
                                                    onChange={(v: number) => handleUpdateProgress('processData', v)}
                                                    disabled={currentIdx > 2 || job.status !== 'OnProcess' || currentIdx < 2}
                                                    color="text-pink-600" trackColor="bg-pink-500"
                                                />
                                                <SliderControl 
                                                    label="4. Storage" icon={<Truck size={14}/>}
                                                    value={localProgress?.storage || 0} 
                                                    onChange={(v: number) => handleUpdateProgress('storage', v)}
                                                    disabled={currentIdx > 3 || job.status !== 'OnProcess' || currentIdx < 3}
                                                    color="text-indigo-600" trackColor="bg-indigo-500"
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {job.status === 'Waiting' && (
                            <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-900">Waiting for Documents</h3>
                                        <p className="text-orange-700/70 text-sm mt-1">Please fill in the official documents reference numbers to complete this job.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-orange-800 ml-1">Jobsheet No.</label>
                                        <input 
                                            type="text" 
                                            defaultValue={job.jobsheetNo}
                                            onBlur={(e) => handleWaitingInput('jobsheetNo', e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-orange-200 bg-white focus:ring-2 focus:ring-orange-400 outline-none font-bold text-slate-700" 
                                            placeholder="Ex. JS-2024-001"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-orange-800 ml-1">Reference No.</label>
                                        <input 
                                            type="text" 
                                            defaultValue={job.referenceNo}
                                            onBlur={(e) => handleWaitingInput('referenceNo', e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-orange-200 bg-white focus:ring-2 focus:ring-orange-400 outline-none font-bold text-slate-700"
                                            placeholder="Ex. REF-999" 
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleStatusChangeWithAnim('Complete')}
                                    disabled={!canFinishWaiting}
                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Finish Job
                                </button>
                            </div>
                        )}

                        {job.status === 'Complete' && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Job Completed!</h3>
                                <p className="text-slate-500 mb-6">Great job! This job is done. You can now report and archive it.</p>
                                <button 
                                    onClick={() => handleStatusChangeWithAnim('Report')}
                                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg"
                                >
                                    Report & Archive
                                </button>
                            </div>
                        )}
                        
                        {/* Reverse Button (Bottom Right of Hero) */}

                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Info & Timeline (Scrollable) */}
                  <div className="lg:col-span-2 space-y-8">
                      
                      {/* SECTION: JOB INFO */}
                      <div id="job-info" className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
                          <SectionHeader title="Job Information" icon={<FileText size={16}/>} />
                          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                              <InfoItem label="Start Date" value={new Date(job.startDate).toLocaleDateString()} icon={<Calendar size={14}/>} />
                              <InfoItem label="Due Date" value={new Date(job.dueDate).toLocaleDateString()} icon={<Clock size={14}/>} highlight color="text-orange-600"/>
                              <InfoItem label="Quantity" value={`${job.jobQty} Units`} icon={<Box size={14}/>} />
                              <InfoItem label="Priority" value={job.priority} icon={<AlertTriangle size={14}/>} isBadge badgeColor={job.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} />
                              <InfoItem label="Consignee" value={job.consignee || '-'} icon={<User size={14}/>} />
                              <InfoItem label="Mode" value={job.mode || '-'} icon={<Truck size={14}/>} />
                              <InfoItem label="Destination" value="-" icon={<MapPin size={14}/>} />
                              <InfoItem label="SI Qty" value={job.siQty || '-'} icon={<Box size={14}/>} />
                              <div className="flex flex-col gap-1">
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider"><User size={14}/> Assignees</span>
                                  <div className="flex -space-x-2 mt-1">
                                      {job.assignees && job.assignees.length > 0 ? (
                                          job.assignees.map((a, i) => {
                                              const name = (a as any).name || (a as any);
                                              const photo = (a as any).photoURL;
                                              return (
                                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden" title={name}>
                                                      {photo ? (
                                                          <img src={photo} alt={name} className="w-full h-full object-cover" />
                                                      ) : (
                                                          name?.charAt(0).toUpperCase() || '?'
                                                      )}
                                                  </div>
                                              );
                                          })
                                      ) : (
                                          <span className="text-sm font-bold text-slate-400 italic">Unassigned</span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* SECTION: TIMELINE */}
                      <div id="timeline" className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
                          <SectionHeader title="Activity Timeline" icon={<History size={16}/>} />
                          <div className="pl-4 border-l-2 border-slate-200/60 space-y-8 py-2">
                             {auditLogs.map(log => (
                                 <div key={log.id} className="relative group">
                                     <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-400 shadow-sm group-hover:scale-125 transition-transform" />
                                     <div>
                                         <p className="text-sm font-bold text-slate-700">
                                            {log.action === 'move' ? `Status: ${log.newValue?.status || '-'}` : log.action.toUpperCase()}
                                         </p>
                                         <p className="text-xs text-slate-500 mt-0.5">{log.details || 'Updated record'}</p>
                                         <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium bg-slate-100/50 w-fit px-2 py-0.5 rounded-md">
                                             <User size={10} /> {log.performedBy}
                                             <span className="w-1 h-1 rounded-full bg-slate-300"/>
                                             <span>{new Date(log.timestamp).toLocaleString()}</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {auditLogs.length === 0 && <p className="text-sm text-slate-400 italic">No history yet.</p>}
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Files & Comments (Sticky-ish?) */}
                  <div className="space-y-8">
                       {/* SECTION: ATTACHMENTS */}
                       <div id="files" className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
                           <SectionHeader title="Attachments" icon={<Paperclip size={16}/>} count={attachments.length} />
                           
                           {/* File List */}
                           <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                               {attachments.map(file => (
                                   <div key={file.id} className="flex items-center justify-between p-3 bg-white/60 hover:bg-white rounded-xl border border-transparent hover:border-blue-200 transition-all group">
                                       <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                                                {file.type.split('/')[1] || 'FILE'}
                                            </div>
                                            <div className="min-w-0">
                                                <a href={file.url} target="_blank" className="block text-sm font-bold text-slate-700 truncate hover:text-blue-600 hover:underline">{file.name}</a>
                                                <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                       </div>
                                       <button onClick={() => handleDeleteAttachment(file)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                           <Trash2 size={16} />
                                       </button>
                                   </div>
                               ))}
                           </div>

                           {/* Upload Button */}
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             disabled={isUploading}
                             className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                           >
                             {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                             Upload File
                           </button>
                       </div>

                       {/* SECTION: COMMENTS */}
                       <div id="comments" className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm flex flex-col h-[500px]">
                            <SectionHeader title="Discussion" icon={<MessageSquare size={16}/>} count={comments.length} />
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                            {c.userAvatar || c.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-sm text-slate-600">
                                                <p className="font-bold text-slate-800 text-xs mb-1">{c.userName}</p>
                                                {c.content}
                                            </div>
                                            <span className="text-[10px] text-slate-400 ml-2">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && <div className="text-center text-slate-400 text-xs py-10">No messages yet.</div>}
                            </div>

                            <div className="relative">
                                <input 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                                    placeholder="Write a message..."
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
                                />
                                <button 
                                    onClick={handleSubmitComment}
                                    disabled={!commentText.trim() || isSubmitting}
                                    className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                       </div>
                  </div>
              </div>
                   </>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const SectionHeader = ({ title, icon, count }: { title: string, icon: React.ReactNode, count?: number }) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100/50">
        <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-600">{icon}</div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex-1">{title}</h3>
        {count !== undefined && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{count}</span>}
    </div>
);

const InfoItem = ({ label, value, icon, highlight, color, isBadge, badgeColor }: any) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">{icon} {label}</span>
        {isBadge ? (
            <span className={`w-fit px-2.5 py-1 rounded-md text-xs font-bold ${badgeColor}`}>{value}</span>
        ) : (
            <span className={`font-bold ${highlight ? 'text-lg ' + (color || 'text-slate-800') : 'text-sm text-slate-700'}`}>{value}</span>
        )}
    </div>
);

const SliderControl = ({ label, value, onChange, disabled, color, trackColor, icon }: any) => (
    <div className={`relative ${disabled ? 'pointer-events-none' : ''}`}>
        <div className="flex justify-between items-end mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${disabled ? 'text-slate-500' : 'text-slate-600'}`}>
                {icon} {label}
            </span>
            <span className={`text-xl font-black ${color}`}>{value}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
            <div 
                className={`h-full absolute top-0 left-0 rounded-full ${trackColor} shadow-sm transition-all duration-300 ease-out`}
                style={{ width: `${value}%` }}
            />
            <input 
                type="range" min="0" max="100" value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))}
                className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={disabled}
            />
        </div>
        {disabled && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                </div>
            </div>
        )}
    </div>
);

// Helper Arrow Icon
const ArrowRight = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
);

export default JobCardDetailModal;
