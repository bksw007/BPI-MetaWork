import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Info, ChevronDown, Sparkles, Plus, Trash2 } from 'lucide-react';
import { JobCard, AppUser, Assignee } from '../../types/jobCard';
import { subscribeToUsers } from '../../services/jobCardService';

interface EditJobCardFormProps {
  job: JobCard;
  onSave: (updates: Partial<JobCard>) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => void;
  existingCustomers?: string[];
  existingProducts?: string[];
  isDarkMode?: boolean;
}

interface CreatableSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  isDarkMode?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({ 
  label, name, value, onChange, options, placeholder, required, isDarkMode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const filtered = options.filter(opt => 
      opt.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [value, options]);

  const handleSelect = (option: string) => {
    const syntheticEvent = {
      target: { name, value: option, type: 'text' }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative group">
        <input 
          type="text" 
          name={name} 
          required={required}
          placeholder={placeholder}
          value={value} 
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none pr-10 
            bg-white/20 border border-white/20 shadow-sm
            text-slate-700 text-sm placeholder:text-slate-400
            focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
        />
        <ChevronDown 
          className={`w-4 h-4 text-slate-500 absolute right-4 top-[13px] transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className={`absolute z-20 w-full mt-1.5 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-200 ${
           isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
           {filteredOptions.map((opt, idx) => (
             <button
                key={`${opt}-${idx}`}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors text-slate-700 hover:bg-sky-50 hover:text-sky-600"
             >
               {opt}
             </button>
           ))}
        </div>
      )}
    </div>
  );
};


const EditJobCardForm: React.FC<EditJobCardFormProps> = ({
  job,
  onSave,
  onCancel,
  onDelete,
  existingCustomers = ['FMT', 'Panasonic', 'Hoei'],
  existingProducts = ['Inverter', 'Tempresure control', 'Solder', 'Switch'],
  isDarkMode
}) => {
  // Pre-defined lists as requested
  const consigneeOptions = ['FAP', 'FEA NJ', 'FEE', 'FEI', 'FEID', 'FETW'];
  const modeOptions = ['AIR', 'SEA', 'COURIER', 'TRUCK'];

  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  
  useEffect(() => {
    const unsub = subscribeToUsers((users) => {
      setAvailableUsers(users);
    });
    return () => unsub();
  }, []);

  // Initial State filled from Job
  const [formData, setFormData] = useState({
    startDate: job.startDate.split('T')[0],
    dueDate: job.dueDate.split('T')[0],
    customer: job.customer || '',
    product: job.product || '',
    consignee: job.consignee || '',
    mode: job.mode || '',
    siQty: job.siQty || 0,
    jobQty: job.jobQty || 0, // Total Product QTY
    priority: job.priority || 'Standard',
    assignees: (job.assignees as any[])?.map(a => typeof a === 'string' ? { uid: a, name: a } : a) as Assignee[] || [],
    remark: job.description || '' // Map description to remark
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showAssigneeList, setShowAssigneeList] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update effect if job changes while open (e.g. from background subscription)
  useEffect(() => {
      setFormData({
        startDate: job.startDate.split('T')[0],
        dueDate: job.dueDate.split('T')[0],
        customer: job.customer || '',
        product: job.product || '',
        consignee: job.consignee || '',
        mode: job.mode || '',
        siQty: job.siQty || 0,
        jobQty: job.jobQty || 0,
        priority: job.priority || 'Standard',
        assignees: (job.assignees as any[])?.map(a => typeof a === 'string' ? { uid: a, name: a } : a) as Assignee[] || [],
        remark: job.description || ''
      });
  }, [job.id]); // Only re-run if ID changes to avoid reset bugs while typing

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const toggleAssignee = (user: AppUser) => {
      setFormData(prev => {
          const exists = prev.assignees.some(a => a.uid === user.uid || a.name === user.displayName);
          if (exists) {
              return { ...prev, assignees: prev.assignees.filter(a => a.uid !== user.uid && a.name !== user.displayName) };
          } else {
              if (prev.assignees.length >= 5) return prev; // Limit to 5
              return { 
                  ...prev, 
                  assignees: [...prev.assignees, { 
                      uid: user.uid, 
                      name: user.displayName, 
                      photoURL: user.photoURL 
                  }] 
              };
          }
      });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(true);
    
    setTimeout(async () => {
        try {
            await onSave({
                ...formData,
                startDate: formData.startDate,
                dueDate: formData.dueDate,
                description: formData.remark
            });
        } catch (error) {
            console.error("Failed to update", error);
            setIsSaving(false);
            setShowSuccess(false);
        }
    }, 700);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      {showSuccess && (
         <div className="absolute inset-0 z-50 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                 <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-4 animate-[bounce_0.5s_infinite]">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 drop-shadow-sm uppercase tracking-wider animate-pulse">
                    Saved!!
                    </h2>
                </div>
            </div>
         </div>
      )}
      <div className="mb-6 pb-4 border-b border-white/30">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-blue-500" size={20} /> Edit Job Details
          </h2>
          <p className="text-sm text-slate-500">Update the job information below.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-0">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date</label>
            <div className="relative">
                <input 
                  type="date" name="startDate" required
                  value={formData.startDate} onChange={handleChange}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none 
                    bg-white/20 border border-white/20 shadow-sm cursor-pointer
                    text-slate-700 text-sm
                    focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
                />
            </div>
          </div>

          <div className="space-y-0">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
            <div className="relative">
                <input 
                  type="date" name="dueDate" required
                  value={formData.dueDate} onChange={handleChange}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none 
                    bg-white/20 border border-white/20 shadow-sm cursor-pointer
                    text-slate-700 text-sm
                    focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
                />
            </div>
          </div>

          <div className="space-y-0">
            <CreatableSelect 
                label="Customer Name"
                name="customer"
                value={formData.customer}
                onChange={handleChange as any}
                options={existingCustomers}
                placeholder="Select Customer"
                required
                isDarkMode={isDarkMode}
            />
          </div>

          <div className="space-y-0">
            <CreatableSelect 
                label="Product Name"
                name="product"
                value={formData.product}
                onChange={handleChange as any}
                options={existingProducts}
                placeholder="Select Product"
                required
                isDarkMode={isDarkMode}
            />
          </div>

          <div className="space-y-0">
             <CreatableSelect 
                label="Consignee Name"
                name="consignee"
                value={formData.consignee}
                onChange={handleChange as any}
                options={consigneeOptions}
                placeholder="Select Consignee"
                required
                isDarkMode={isDarkMode}
            />
          </div>

          <div className="space-y-0">
            <CreatableSelect 
                label="Transport Mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange as any}
                options={modeOptions}
                placeholder="Select Mode"
                isDarkMode={isDarkMode}
            />
          </div>

          {/* Bottom Section: 4-Column Grid */}
          <div className="md:col-span-2 grid grid-cols-4 gap-4">
              {/* Row 1, Col 1: SI QTY */}
              <div className="col-span-1 space-y-0">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">SI QTY</label>
                <input 
                  type="number" name="siQty" min="0" required
                  value={formData.siQty} onChange={handleChange}
                  placeholder="SI QTY"
                  className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none 
                    bg-white/20 border border-white/20 shadow-sm
                    text-slate-700 text-sm placeholder:text-slate-400
                    focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
                />
              </div>

               {/* Row 1, Col 2: Total Product QTY (Moved here) */}
              <div className="col-span-1 space-y-0">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Product QTY</label>
                <input 
                  type="number" name="jobQty" min="1" required
                  value={formData.jobQty} onChange={handleChange}
                  placeholder="QTY"
                  className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none 
                    bg-white/20 border border-white/20 shadow-sm
                    text-slate-700 text-sm placeholder:text-slate-400
                    focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
                />
              </div>

              {/* Row 1, Col 3-4: Priority (Adjusted to span 2) */}
              <div className="col-span-2 space-y-0">
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                 <div className="bg-white/20 border border-white/20 p-1 rounded-xl flex gap-1 w-full h-[42px] items-center">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: 'Standard' }))}
                        className={`flex-1 py-1 px-4 rounded-lg text-sm font-bold transition-all h-full ${
                            formData.priority === 'Standard'
                            ? 'bg-[#bbf7d0] text-green-800 shadow-sm'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Normal
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: 'High' }))}
                        className={`flex-1 py-1 px-4 rounded-lg text-sm font-bold transition-all h-full ${
                            formData.priority === 'High'
                            ? 'bg-[#fed7aa] text-orange-900 shadow-sm'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        High
                    </button>
                 </div>
              </div>
              
              {/* Row 2, Col 1: Assigned (Functional) */}
              <div className="col-span-1 space-y-0 relative" ref={assigneeRef}>
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
                 <div className="w-full bg-white/20 border border-white/20 rounded-xl h-[42px] px-2 flex items-center shadow-sm relative">
                    {/* Selected Avatars */}
                    <div className="flex -space-x-2 overflow-hidden items-center mr-2">
                         {formData.assignees.length > 0 ? (
                            formData.assignees.map((assignee, i) => (
                              <div key={assignee.uid} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-indigo-400 overflow-hidden" title={assignee.name}>
                                  {assignee.photoURL ? (
                                      <img src={assignee.photoURL} alt={assignee.name} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                          {getInitials(assignee.name)}
                                      </div>
                                  )}
                              </div>
                            ))
                         ) : (
                             <span className="text-xs text-slate-400 ml-2">No one</span>
                         )}
                    </div>
                    
                    {/* Add Button */}
                    <button 
                        type="button" 
                        onClick={() => setShowAssigneeList(!showAssigneeList)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ml-auto ${showAssigneeList ? 'bg-indigo-100 text-indigo-600' : 'bg-white/40 hover:bg-white/60 text-slate-600'}`}
                    >
                        <Plus size={16} />
                    </button>
                 </div>

                  {showAssigneeList && (
                     <div className="absolute bottom-full mb-1.5 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 p-1">
                        <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Select User</div>
                        {availableUsers.length === 0 && (
                            <div className="text-[10px] text-slate-400 px-3 py-2 italic text-center">No approved users found.</div>
                        )}
                        {availableUsers.map(user => {
                            const isSelected = formData.assignees.some(a => a.uid === user.uid || a.name === user.displayName);
                            return (
                                <button
                                    key={user.uid}
                                    type="button"
                                    onClick={() => toggleAssignee(user)}
                                    className={`w-full text-left px-3 py-2 text-sm font-bold flex items-center justify-between rounded-lg transition-all ${
                                        isSelected ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {getInitials(user.displayName)}
                                            </div>
                                        )}
                                        {user.displayName}
                                    </div>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                </button>
                            );
                        })}
                     </div>
                 )}
              </div>

              {/* Row 2, Col 2-4: Remark (Span 3 - fills the rest) */}
              <div className="col-span-3 space-y-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remark</label>
                  <input
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange as any}
                    placeholder="Description (Optional)"
                    className="w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none 
                        bg-white/20 border border-white/20 shadow-sm
                        text-slate-700 text-sm placeholder:text-slate-400
                        focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
                  />
              </div>
          </div>


        <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t border-white/30 mt-4">
             {onDelete && job.status === 'Allocated' && (
                 <button 
                     type="button" 
                     onClick={onDelete}
                     className="bg-red-50 hover:bg-red-100 text-red-500 font-bold h-[48px] px-6 rounded-xl transition-all text-sm flex items-center gap-2"
                 >
                     <Trash2 size={16} /> Delete
                 </button>
             )}
             <button 
                 type="submit"
                 disabled={isSaving}
                 className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-[48px] px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
             >
                  {isSaving ? (
                    'Saving Changes...'
                  ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Changes
                    </>
                  )}
              </button>
             <button 
                 type="button" 
                 onClick={onCancel}
                 className="bg-white/50 hover:bg-red-50 hover:text-red-500 text-slate-700 font-bold h-[48px] px-6 rounded-xl border border-white/40 transition-all text-sm"
             >
                 Cancel
             </button>
        </div>
      </form>
    </div>
  );
};

export default EditJobCardForm;
