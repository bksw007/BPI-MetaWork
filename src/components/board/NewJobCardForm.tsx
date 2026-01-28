import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Info, ChevronDown, Sparkles, Plus } from 'lucide-react';

interface NewJobCardFormProps {
  onSave: (record: any) => Promise<void> | void;
  onCancel: () => void;
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

interface GlassSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
  placeholder?: string;
  isDarkMode?: boolean;
}

const GlassSelect: React.FC<GlassSelectProps> = ({ 
  label, name, value, onChange, options, placeholder, isDarkMode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (option: string) => {
    const syntheticEvent = {
      target: { name, value: option }
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full px-4 h-[42px] rounded-xl font-medium transition-all outline-none pr-10 
           bg-white/20 border border-white/20 shadow-sm text-left flex items-center
           focus:ring-2 focus:ring-[#818cf8]/50 focus:border-transparent"
      >
         <span className={value ? "text-slate-700 text-sm" : "text-slate-400 text-sm"}>
            {value || placeholder || "Select..."}
         </span>
         <ChevronDown 
             className={`w-4 h-4 text-slate-500 absolute right-4 top-[13px] transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180' : ''}`} 
         />
      </button>
      
      {isOpen && (
         <div className={`absolute z-20 w-full mt-1.5 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-200 ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
         }`}>
            {options.map((opt) => (
               <button
                  key={opt}
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

const NewJobCardForm: React.FC<NewJobCardFormProps> = ({
  onSave,
  onCancel,
  existingCustomers = ['FMT', 'Panasonic', 'Hoei'],
  existingProducts = ['Inverter', 'Tempresure control', 'Solder', 'Switch'],
  isDarkMode
}) => {
  // Pre-defined lists as requested
  const consigneeOptions = ['FAP', 'FEA NJ', 'FEE', 'FEI', 'FEID', 'FETW'];
  const modeOptions = ['AIR', 'SEA', 'COURIER', 'TRUCK'];
  const assigneesOptions = ['User A', 'User B', 'User C']; // Mock list for now

  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    customer: '',
    product: '',
    consignee: '',
    mode: '',
    siQty: 0,
    jobQty: 0, // Total Product QTY
    priority: 'Standard',
    assignees: [] as string[],
    remark: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Pass raw data to parent, parent handles title generation
    await onSave({
        ...formData,
        // Map legacy fields if parent still expects them, or just send new structure
        Date: formData.startDate,
        QTY: formData.jobQty,
        Product: formData.product,
        Shipment: formData.customer // temporarily mapping customer to Share field if needed, but better to send clean data
    });
    setIsSaving(false);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-0">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Shipment Date</label>
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
            <GlassSelect 
                label="Transport Mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
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
              
              {/* Row 2, Col 1: Assigned (Below SI QTY) */}
              <div className="col-span-1 space-y-0">
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
                 <div className="w-full bg-white/20 border border-white/20 rounded-xl h-[42px] px-2 flex items-center shadow-sm">
                    {/* Mock Avatar List */}
                    <div className="flex -space-x-2 overflow-hidden items-center mr-2">
                         {['U1', 'U2', 'U3'].map((user, i) => (
                             <div key={user} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white text-[10px] font-bold text-white
                                ${i === 0 ? 'bg-indigo-400' : i === 1 ? 'bg-pink-400' : 'bg-teal-400'}
                             `}>
                                 {user}
                             </div>
                         ))}
                    </div>
                    <button type="button" className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-slate-600 transition-colors ml-auto">
                        <Plus size={16} />
                    </button>
                 </div>
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


        <div className="md:col-span-2 flex items-center gap-3 pt-2 mt-2">
             <button 
                 type="submit"
                 disabled={isSaving}
                 className="flex-1 bg-[#818cf8] hover:bg-[#6366f1] text-white font-bold h-[42px] px-6 rounded-xl shadow-[0_4px_20px_-2px_rgba(129,140,248,0.5)] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
             >
                  {isSaving ? (
                    'Creating...'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Create Job Card
                    </span>
                  )}
              </button>
             <button 
                 type="button" 
                 onClick={onCancel}
                 className="bg-white/20 hover:bg-white/50 text-slate-700 font-bold h-[42px] px-6 rounded-xl border border-white/20 transition-all text-sm"
             >
                 Cancel
             </button>
        </div>
      </form>
    </div>
  );
};

export default NewJobCardForm;
