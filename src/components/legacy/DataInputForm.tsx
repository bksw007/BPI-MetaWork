import React, { useState, useEffect, useRef } from 'react';
import { PackingRecord, PACKAGE_COLUMNS } from '@types';
import { Save, ArrowLeft, CheckCircle2, Package, Info, ChevronRight, Calendar as CalendarIcon, ChevronDown, Table } from 'lucide-react';

interface DataInputFormProps {
  onSave: (record: PackingRecord) => Promise<void> | void;
  onCancel: () => void;
  existingCustomers?: string[];
  existingProducts?: string[];
  isDarkMode?: boolean;
  initialData?: PackingRecord;
}

/**
 * A Custom Select Component that allows selecting from a list OR typing a new value.
 */
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on input
  useEffect(() => {
    const filtered = options.filter(opt => 
      opt.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [value, options]);

  const handleSelect = (option: string) => {
    // Create a synthetic event to match the native input signature
    const syntheticEvent = {
      target: { name, value: option, type: 'text' }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">{label}</label>
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
          className="w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none pr-10 focus:ring-2 bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300 placeholder-slate-400"
        />
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 absolute right-4 top-3.5 transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && filteredOptions.length > 0 && (
        <div className={`absolute z-20 w-full mt-1 border rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 ${
           isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
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

const DataInputForm: React.FC<DataInputFormProps> = ({ 
  onSave, 
  onCancel, 
  existingCustomers = [], 
  existingProducts = [],
  isDarkMode,
  initialData
}) => {
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [formData, setFormData] = useState<Partial<PackingRecord>>(initialData || {
    Date: new Date().toISOString().split('T')[0],
    Shipment: '',
    Mode: '',
    Product: '',
    "SI QTY": 1,
    QTY: 0,
    Remark: '',
    ...PACKAGE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: 0 }), {})
  });
  
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  // Default Modes
  const modeOptions = ['SEA', 'AIR', 'TRUCK', 'COURIER'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePasteData = () => {
    if (!pasteContent.trim()) {
      setShowPasteModal(false);
      return;
    }

    const lines = pasteContent.trim().split('\n');
    const updates: Partial<PackingRecord> = {};

    lines.forEach(line => {
      // Split by tab
      const parts = line.split('\t');
      // If split by tab fails (length < 2), try splitting by multiple spaces
      const safeParts = parts.length >= 2 ? parts : line.trim().split(/\s{2,}/);
      
      if (safeParts.length < 2) return;

      const rawName = safeParts[0].trim().toUpperCase();
      const qty = parseInt(safeParts[safeParts.length - 1].replace(/,/g, '').trim(), 10) || 0;

      // Extract dimension pattern (e.g., 110x110x115, 27X27X22)
      const dimensionMatch = rawName.match(/(\d+X?\d+X?\d+)/i);
      const dimension = dimensionMatch ? dimensionMatch[1].toUpperCase() : null;

      // Special cases for WARP QTY
      if (rawName === 'PALLET' || rawName.startsWith('WOODEN CASE')) {
        updates['WARP QTY'] = (updates['WARP QTY'] as number || 0) + qty;
        return;
      }

      // Special case for UNIT
      if (rawName === 'UNIT' || rawName.trim() === 'UNIT') {
        updates['UNIT QTY'] = (updates['UNIT QTY'] as number || 0) + qty; // Accumulate if duplicate lines
        return;
      }

      // Special case for RETURNABLE
      if (rawName.startsWith('RETURNABLE')) {
        updates['RETURNABLE QTY'] = (updates['RETURNABLE QTY'] as number || 0) + qty;
        return;
      }

      // Find matching column by dimension
      if (dimension) {
        // PACKAGE_COLUMNS contains strings like "110x110x115 QTY"
        const matchingCol = PACKAGE_COLUMNS.find(col => {
          const colDimension = col.replace(' QTY', '').toUpperCase();
          // Check for exact match or potentially normalized match
          return colDimension === dimension || colDimension === dimension.replace(/X/g, 'x').toUpperCase();
        });
        
        if (matchingCol) {
          updates[matchingCol] = (updates[matchingCol] as number || 0) + qty;
        }
      }
    });

    setFormData(prev => ({ ...prev, ...updates }));
    setPasteContent('');
    setShowPasteModal(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  // Calculate Total Packages dynamicallly
  const totalPackages = PACKAGE_COLUMNS.reduce((sum, col) => sum + (Number(formData[col]) || 0), 0);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    const finalRecord: PackingRecord = {
      ...formData as PackingRecord,
      id: initialData?.id || `record-${Date.now()}`
    };
    await onSave(finalRecord);
    setIsSaving(false);
  };

  if (step === 'review') {
    // Re-implementing Review UI to ensure no code loss
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-all"
        />

        {/* Main Modal */}
        <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 ${
           isDarkMode ? 'bg-slate-900/90 border border-slate-700 text-white' : 'bg-white/80 border border-white/60 text-slate-800'
        } backdrop-blur-xl`}>
          
          {/* Header matching ShipmentDetailModal */}
          <div className={`px-6 py-4 border-b flex items-center justify-between rounded-t-3xl ${
            isDarkMode ? 'border-slate-700/50 bg-slate-900/80' : 'border-white/50 bg-white/60'
          }`}>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                     isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                   }`}>
                     NEW RECORD
                   </span>
                </div>
                <h2 className="text-lg font-black leading-tight text-center sm:text-left">
                  {formData.Product} - {formData.Shipment} - {formData.Mode}
                </h2>
             </div>
          </div>

          <div className="p-6 space-y-6 text-center">
             {/* Key Matrix */}
             <div className="grid grid-cols-3 gap-4 mx-auto max-w-lg">
                {/* Date */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                   isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
                }`}>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                   <p className="text-lg font-black">{formData.Date?.split('-').reverse().join('-')}</p>
                </div>

                {/* SI QTY */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                   isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
                }`}>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SI QTY</span>
                   <p className="text-lg font-black">{formData["SI QTY"]}</p>
                </div>

                {/* Total QTY */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                   isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
                }`}>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total QTY</span>
                   <p className="text-lg font-black text-blue-500">{formData.QTY?.toLocaleString()}</p>
                </div>
             </div>

             {/* Packaging Details */}
             <div className="mx-auto max-w-xl">
                <div className="flex items-center justify-center mb-3 gap-3">
                   <h3 className="text-sm font-bold flex items-center gap-2">
                      <Package className="w-4 h-4 text-mint-500" />
                      Packaging Breakdown
                   </h3>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      isDarkMode ? 'bg-mint-500/20 text-mint-400' : 'bg-mint-50 text-mint-600 border border-mint-100'
                   }`}>
                      TOTAL: {totalPackages}
                   </span>
                </div>

                <div className={`rounded-xl border overflow-hidden ${
                   isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-white/60 bg-white/30'
                }`}>
                   {PACKAGE_COLUMNS.some(col => (formData[col] as number) > 0) ? (
                      <div className="grid grid-cols-4 gap-px bg-slate-200/50 dark:bg-slate-700">
                         {PACKAGE_COLUMNS.map(col => {
                            const val = formData[col] as number;
                            if (val <= 0) return null;
                            return (
                               <div key={col} className={`p-3 flex flex-col items-center text-center gap-0.5 ${
                                  isDarkMode ? 'bg-slate-800' : 'bg-white/60 backdrop-blur-sm'
                               }`}>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate w-full">
                                     {col.replace(' QTY', '')}
                                  </span>
                                  <span className="text-base font-black">{val}</span>
                               </div>
                            );
                         })}
                      </div>
                   ) : (
                      <div className="p-6 text-center text-slate-400 italic text-xs">No packaging data.</div>
                   )}
                </div>
             </div>

             {/* Remark Section */}
             {formData.Remark && (
                <div className={`p-4 rounded-xl border max-w-xl mx-auto ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-amber-50/50 border-amber-100'
                 }`}>
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Remark</h4>
                    <p className="font-medium text-sm leading-relaxed">{formData.Remark}</p>
                 </div>
             )}
          </div>

          {/* Footer / Buttons */}
          <div className={`px-8 py-4 border-t flex flex-col sm:flex-row gap-4 ${
             isDarkMode ? 'border-slate-700/50 bg-slate-900/50' : 'border-white/50 bg-white/50'
          }`}>
             <button 
               onClick={() => setStep('edit')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-bold transition-colors ${
                  isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
               }`}
             >
               <ArrowLeft className="w-5 h-5" />
               Go Back
             </button>
             <button 
               onClick={handleConfirm}
               disabled={isSaving}
               className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-lavender-500 to-lavender-600 text-white rounded-xl font-black hover:from-lavender-600 hover:to-lavender-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSaving ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <Save className="w-5 h-5" />
               )}
               {isSaving ? 'Saving...' : 'Confirm & Save Record'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      
      {/* Paste Modal Overlay */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 ${
             isDarkMode ? 'bg-slate-900/80 border border-slate-700' : 'bg-white/70 border border-white/50'
          } backdrop-blur-2xl`}>
            
            <div className="flex items-center gap-3 mb-4">
               <div className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Table className="w-6 h-6" />
               </div>
               <div>
                  <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Batch Entry</h3>
                  <p className="text-xs font-medium text-slate-500">Paste your Excel data below</p>
               </div>
            </div>

            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className={`w-full h-48 p-4 rounded-xl border text-xs font-mono focus:ring-2 outline-none resize-none mb-6 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950/50 border-slate-700 text-slate-300 focus:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:bg-white focus:border-blue-300 focus:ring-blue-100'
              }`}
              placeholder={`Example Format:\nPALLET 110x110x115\t21\nBOX 27x27x30\t\t50\nUNIT\t\t\t10`}
              autoFocus
            />

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800 dark:text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteData}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 ${
                   isDarkMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-200'
                }`}
              >
                <Table className="w-4 h-4" />
                Process Data
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleReview} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left: General Info */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="p-6 rounded-2xl h-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-slate-700">
                <Info className="w-4 h-4 text-blue-600" />
                Shipment Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Shipment Date</label>
                  <div className="relative">
                    <input 
                      type="date" name="Date" required
                      value={formData.Date} onChange={handleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className="w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 cursor-pointer bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300"
                    />
                  </div>
                </div>

                <CreatableSelect 
                  label="Customer Name"
                  name="Shipment"
                  value={formData.Shipment || ''}
                  onChange={handleChange as any}
                  options={existingCustomers}
                  placeholder="Select or enter customer"
                  required
                  isDarkMode={isDarkMode}
                />

                <CreatableSelect 
                  label="Product Description"
                  name="Product"
                  value={formData.Product || ''}
                  onChange={handleChange as any}
                  options={existingProducts}
                  placeholder="Select or enter product"
                  required
                  isDarkMode={isDarkMode}
                />

                {/* Mode Full Width */}
                <div>
                   <CreatableSelect 
                    label="Mode"
                    name="Mode"
                    value={formData.Mode || ''}
                    onChange={handleChange as any}
                    options={modeOptions}
                    placeholder="Select transport mode"
                    required
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* SI QTY and Total QTY Side-by-Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">SI QTY</label>
                    <input 
                      type="number" name="SI QTY" min="1" required
                      value={formData["SI QTY"]} onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Total Product QTY</label>
                    <input 
                      type="number" name="QTY" min="0" required
                      value={formData.QTY} onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                   <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Remark</label>
                   <textarea
                      name="Remark"
                      rows={2}
                      value={formData.Remark || ''}
                      onChange={handleChange}
                       placeholder="Optional notes..."
                      className="w-full px-4 py-3 border rounded-xl font-medium transition-all outline-none resize-none text-sm focus:ring-2 bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300 placeholder-slate-400"
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Package Details */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="p-6 rounded-2xl h-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-wide text-slate-700">
                  <Package className="w-4 h-4 text-mint-600" />
                  Packaging Breakdown
                </h3>
                <div className="flex items-center gap-3">
                   <div className={`px-3 py-1.5 rounded-lg border text-xs font-black ${isDarkMode ? 'bg-slate-700 border-slate-600 text-mint-400' : 'bg-mint-50 border-mint-200 text-mint-700'}`}>
                      TOTAL: {totalPackages}
                   </div>
                   <button 
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95 text-white ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20' 
                        : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-blue-200'
                    }`}
                   >
                     <Table className="w-4 h-4" />
                     Batch Entry
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
                {PACKAGE_COLUMNS.map(col => (
                  <div key={col} className="group">
                    <label className="block text-[10px] font-black text-slate-500 mb-1 group-focus-within:text-emerald-600 transition-colors truncate uppercase tracking-tight" title={col}>
                      {col.replace(' QTY', '')}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" name={col} min="0"
                        value={formData[col]} onChange={handleChange}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border rounded-xl font-bold transition-all outline-none text-sm focus:ring-2 bg-sky-50/50 border-sky-100 text-slate-800 focus:bg-white focus:ring-sky-300 placeholder-slate-400"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-black group-focus-within:hidden">PCS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-4 p-4 mt-6 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <button 
                type="button" onClick={onCancel}
                className="px-6 py-3 text-slate-500 font-bold hover:text-red-500 transition-colors text-sm"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="px-10 py-3 bg-gradient-to-r from-lavender-600 to-peach-500 text-white rounded-xl font-black hover:from-lavender-700 hover:to-peach-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 text-sm uppercase tracking-widest"
              >
                Review Data
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};


export default DataInputForm;