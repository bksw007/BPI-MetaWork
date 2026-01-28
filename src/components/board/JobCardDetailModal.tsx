import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Clock, FileText, User, MessageSquare, History, Loader2, Upload, Trash2, ArrowRight, RotateCcw, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import { JobCard, JobStatus, Comment, Attachment, AuditLog } from '../../types/jobCard';
import { 
  addComment, 
  subscribeToComments, 
  uploadAttachment, 
  deleteAttachment, 
  subscribeToAuditLogs,
  updateJobCard,
  reverseJobCard
} from '../../services/jobCardService';

interface JobCardDetailModalProps {
  job: JobCard;
  onClose: () => void;
  onUpdateStatus: (status: JobStatus) => void;
  currentUser?: { id: string; name: string; avatar?: string };
}

const JobCardDetailModal: React.FC<JobCardDetailModalProps> = ({ 
  job, 
  onClose, 
  onUpdateStatus,
  currentUser = { id: 'demo-user', name: 'Demo User', avatar: 'DU' }
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files' | 'history'>('details');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Real data states
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>(job.attachments || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  


  // Workflow Action Handlers
  const handleReverseStatus = async () => {
    if (confirm('Are you sure you want to reverse the status? Progress will be reset.')) {
        await reverseJobCard(job, currentUser.id);
        onClose(); // Close to refresh/avoid state mismatch
    }
  };

  const handleUpdateProgress = async (phase: keyof typeof job.phaseProgress, value: number) => {
    // 1. Update Local State (Optimistic) via parent refresh or local mutation? 
    // Ideally we update the DB and let the subscription update the prop `job`.
    // But for smooth slider, we update DB.
    
    // Construct new progress object
    const currentProgress = job.phaseProgress || { picking: 0, packing: 0, processData: 0, storage: 0 };
    const newProgress = { ...currentProgress, [phase]: value };
    
    await updateJobCard(job.id, { phaseProgress: newProgress }, currentUser.id);

    // Auto-Move Check: If Storage reaches 100%, move to Waiting
    if (phase === 'storage' && value === 100) {
        // Ensure other phases are done? The user said "Auto move...". 
        // Assuming strict sequential flow, others must be done.
        onUpdateStatus('Waiting');
    }
  };

  const handleWaitingInput = async (field: 'jobsheetNo' | 'referenceNo', value: string) => {
      await updateJobCard(job.id, { [field]: value }, currentUser.id);
  };

  const canFinishWaiting = job.jobsheetNo && job.referenceNo;

  // Subscribe to comments when tab is active
  useEffect(() => {
    if (activeTab === 'comments') {
      setIsLoadingComments(true);
      const unsubscribe = subscribeToComments(job.id, (newComments) => {
        setComments(newComments);
        setIsLoadingComments(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, job.id]);

  // Subscribe to audit logs when tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      setIsLoadingLogs(true);
      const unsubscribe = subscribeToAuditLogs(job.id, (newLogs) => {
        setAuditLogs(newLogs);
        setIsLoadingLogs(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, job.id]);

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
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const newAttachment = await uploadAttachment(job.id, file, currentUser.id, currentUser.name);
      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm(`Delete "${attachment.name}"?`)) return;
    
    try {
      await deleteAttachment(job.id, attachment, currentUser.id);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Allocated': return 'bg-slate-100 text-slate-700';
      case 'OnProcess': return 'bg-blue-100 text-blue-700';
      case 'Waiting': return 'bg-orange-100 text-orange-700';
      case 'Complete': return 'bg-green-100 text-green-700';
      case 'Report': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getActionLabel = (action: AuditLog['action']) => {
    switch (action) {
      case 'create': return 'Created JobCard';
      case 'update': return 'Updated JobCard';
      case 'move': return 'Changed Status';
      case 'delete': return 'Deleted JobCard';
      case 'comment': return 'Added Comment';
      default: return action;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white/50 backdrop-blur-2xl rounded-[30px] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/30 flex justify-between items-start bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className="text-slate-400 text-xs font-mono bg-white/50 px-1.5 py-0.5 rounded-md">#{job.id.slice(-6)}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-0.5">{job.title}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
               <span className="flex items-center gap-1"><User size={12} className="text-blue-400" /> {job.customer}</span>
               <span className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="flex items-center gap-1">{job.product}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400 shadow-sm backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* ACTION ZONE - Workflow Controls */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-white/20">
            {job.status === 'Allocated' && (
                <button 
                    onClick={() => onUpdateStatus('OnProcess')}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <PlayCircle size={20} fill="currentColor" className="text-white/20" />
                    Let's Go !!
                </button>
            )}

            {job.status === 'OnProcess' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Progress</h3>
                    
                    {/* 4 Steps Sliders with Logic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Picking */}
                        <SliderControl 
                            label="1. Picking" 
                            value={job.phaseProgress?.picking || 0} 
                            onChange={(v) => handleUpdateProgress('picking', v)}
                            color="text-blue-600"
                        />
                         {/* Packing - Locked if Picking < 90 */}
                        <SliderControl 
                            label="2. Packing" 
                            value={job.phaseProgress?.packing || 0} 
                            onChange={(v) => handleUpdateProgress('packing', v)}
                            disabled={(job.phaseProgress?.picking || 0) < 90}
                            color="text-purple-600"
                        />
                         {/* Data - Locked if Packing < 90 */}
                        <SliderControl 
                            label="3. Data Process" 
                            value={job.phaseProgress?.processData || 0} 
                            onChange={(v) => handleUpdateProgress('processData', v)}
                            disabled={(job.phaseProgress?.packing || 0) < 90}
                            color="text-pink-600"
                        />
                         {/* Storage - Locked if Data < 90 */}
                        <SliderControl 
                            label="4. Storage" 
                            value={job.phaseProgress?.storage || 0} 
                            onChange={(v) => handleUpdateProgress('storage', v)}
                            disabled={(job.phaseProgress?.processData || 0) < 90}
                            color="text-indigo-600"
                        />
                    </div>
                </div>
            )}

            {job.status === 'Waiting' && (
                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h4 className="font-bold text-orange-800 text-sm">Action Required</h4>
                            <p className="text-xs text-orange-600 mt-1">Please enter the Jobsheet No. and Reference No. to proceed.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <input 
                                    type="text" 
                                    placeholder="Jobsheet No."
                                    defaultValue={job.jobsheetNo}
                                    onBlur={(e) => handleWaitingInput('jobsheetNo', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Reference No."
                                    defaultValue={job.referenceNo}
                                    onBlur={(e) => handleWaitingInput('referenceNo', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onUpdateStatus('Complete')}
                        disabled={!canFinishWaiting}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={20} />
                        Finish Job
                    </button>
                </div>
            )}

            {job.status === 'Complete' && (
                 <button 
                    onClick={() => onUpdateStatus('Report')}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-base shadow-md hover:shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle2 size={20} className="text-green-400" />
                    Report Completed & Archive
                </button>
            )}
            
            {/* Reverse & Tools */}
            <div className="flex justify-end mt-2">
                 <button 
                    onClick={handleReverseStatus}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Reverse Status"
                 >
                    <RotateCcw size={12} /> Reverse Status
                 </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 bg-white/40 border-b border-white/20 backdrop-blur-sm">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<FileText size={14} />} label="Overview" />
          <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} icon={<MessageSquare size={14} />} label="Comments" count={job.commentsCount || comments.length} />
          <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<Paperclip size={14} />} label="Attachments" count={attachments.length} />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={14} />} label="History" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200/50">
          
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/50 border border-white/40 shadow-sm backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-5 tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Job Details
                  </h3>
                  <div className="space-y-4">
                    <DetailRow label="Due Date" value={new Date(job.dueDate).toLocaleDateString()} icon={<Clock size={14} className="text-orange-400"/>} />
                    <DetailRow label="Start Date" value={new Date(job.startDate).toLocaleDateString()} />
                    <DetailRow label="Quantity" value={`${job.jobQty} Units`} highlight />
                    <DetailRow label="Priority" value={job.priority} isBadge badgeColor={job.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/50 border border-white/40 shadow-sm backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-5 tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Progress
                  </h3>
                  <div className="space-y-5">
                     <ProgressBar label="Picking" progress={job.phaseProgress?.picking || 0} color="from-blue-400 to-blue-500" />
                     <ProgressBar label="Packing" progress={job.phaseProgress?.packing || 0} color="from-purple-400 to-purple-500" />
                     <ProgressBar label="Data Process" progress={job.phaseProgress?.processData || 0} color="from-pink-400 to-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1 space-y-6 mb-4 min-h-[200px]">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
                        {comment.userAvatar || comment.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/80 p-4 rounded-2xl rounded-tl-none border border-white/40 shadow-sm backdrop-blur-sm relative">
                           <div className="absolute -left-2 top-0 w-3 h-3 bg-white/80 [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-800">{comment.userName}</span>
                            <span className="text-xs text-slate-400 font-medium">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="relative mt-4">
                <input 
                  type="text" 
                  placeholder="Type your comment..." 
                  className="w-full pl-5 pr-14 py-4 bg-white border-none ring-1 ring-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all placeholder:text-slate-400"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  disabled={isSubmitting}
                />
                <button 
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
              />
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:bg-slate-50/50 hover:border-blue-400 transition-all cursor-pointer group bg-slate-50/20 backdrop-blur-sm ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all shadow-sm">
                  {isUploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
                </div>
                <p className="text-base font-semibold text-slate-700">
                  {isUploading ? 'Uploading...' : 'Drag & Drop files here'}
                </p>
                <p className="text-sm text-slate-400 mt-1">or <span className="text-blue-500 font-bold hover:underline">browse</span> to upload</p>
                <p className="text-xs text-slate-400 mt-4">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>

              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Paperclip size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">No attachments yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white/70 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${file.type.includes('pdf') ? 'bg-red-400' : 'bg-blue-400'}`}>
                          {file.type.includes('pdf') ? <FileText size={22} /> : <Paperclip size={22} />}
                        </div>
                        <div>
                           <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors hover:underline">{file.name}</a>
                           <p className="text-xs text-slate-400 font-medium mt-0.5">{formatFileSize(file.size)} • {file.uploadedBy}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAttachment(file)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

           {activeTab === 'history' && (
             <div className="animate-in slide-in-from-bottom-2 duration-300">
               {isLoadingLogs ? (
                 <div className="flex items-center justify-center h-32">
                   <Loader2 className="animate-spin text-blue-500" size={24} />
                 </div>
               ) : auditLogs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                   <History size={32} className="mb-2 opacity-50" />
                   <p className="text-sm">No history recorded yet.</p>
                 </div>
               ) : (
                 <div className="space-y-8 pl-6 border-l-2 border-slate-200 ml-3 py-2">
                   {auditLogs.map((log) => (
                     <div key={log.id} className="relative group">
                       <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white shadow-sm group-hover:scale-110 transition-transform" />
                       <div className="flex flex-col bg-white/50 p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-100">
                         <span className="text-sm font-bold text-slate-700">{getActionLabel(log.action)}</span>
                         {log.newValue && (
                           <span className="text-xs text-blue-500 mt-0.5 truncate max-w-xs">
                             {typeof log.newValue === 'string' ? log.newValue : JSON.stringify(log.newValue)}
                           </span>
                         )}
                         <span className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {log.performedBy} 
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {formatTimeAgo(log.timestamp)}
                         </span>
                       </div>
                     </div>
                   ))}
                   <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
                      <span className="text-xs text-slate-400 italic font-medium ml-1">End of history</span>
                   </div>
                 </div>
               )}
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const TabButton = ({ active, onClick, icon, label, count }: any) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-[3px] transition-all relative
      ${active 
        ? 'border-blue-500 text-blue-600 bg-blue-50/50' 
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}
    `}
  >
    {icon}
    {label}
    {count > 0 && (
       <span className={`px-1.5 py-0.5 rounded-full text-[9px] bg-slate-200 text-slate-600 ${active ? 'bg-blue-100 text-blue-700' : ''}`}>
         {count}
       </span>
    )}
  </button>
);

const DetailRow = ({ label, value, highlight, isBadge, badgeColor, icon }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
    <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
        {icon} {label}
    </span>
    {isBadge ? (
       <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
         {value}
       </span>
    ) : (
       <span className={`text-sm font-bold ${highlight ? 'text-slate-800 text-base' : 'text-slate-700'}`}>
         {value}
       </span>
    )}
  </div>
);

const ProgressBar = ({ label, progress, color }: any) => (
  <div>
    <div className="flex justify-between text-xs mb-2">
      <span className="text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="font-bold text-slate-700">{progress}%</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} shadow-sm transition-all duration-500`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const SliderControl = ({ label, value, onChange, disabled, color }: any) => (
    <div className={`transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-between mb-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${disabled ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
            <span className={`text-xs font-black ${disabled ? 'text-slate-400' : color}`}>{value}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-current" 
            style={{ accentColor: 'currentColor' }} 
        />
    </div>
);

export default JobCardDetailModal;
