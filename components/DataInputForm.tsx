import React, { useState, useEffect, useRef } from 'react';
import { PackingRecord, PACKAGE_COLUMNS } from '../types';
import { Save, ArrowLeft, CheckCircle2, Package, Info, ChevronRight, Calendar as CalendarIcon, ChevronDown, Table } from 'lucide-react';

interface DataInputFormProps {
  onSave: (record: PackingRecord) => Promise<void> | void;
  onCancel: () => void;
  existingCustomers?: string[];
  existingProducts?: string[];
  isDarkMode?: boolean;
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
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none pr-10 focus:ring-2 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-lavender-500 placeholder-slate-500' 
              : 'bg-lavender-50/50 border-lavender-200/50 text-slate-900 focus:bg-white focus:ring-lavender-500'
          }`}
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
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-blue-400' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
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
  isDarkMode
}) => {
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [formData, setFormData] = useState<Partial<PackingRecord>>({
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
      id: `record-${Date.now()}`
    };
    await onSave(finalRecord);
    setIsSaving(false);
  };

  if (step === 'review') {
    // ... (Review UI remains mostly the same, omitted for brevity if unchanged logic, but standard practice is to include)
    // Re-implementing Review UI to ensure no code loss
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="bg-gradient-to-r from-lavender-500 to-lavender-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Review Information</h3>
                <p className="text-blue-100 text-sm">Please double check the details before saving.</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Shipment Summary
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Date</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {formData.Date?.split('-').reverse().join('-')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Customer</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Shipment}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Product</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Product}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Mode</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Mode}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">SI QTY</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData["SI QTY"]}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Total Product QTY</span>
                    <span className={`font-black text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{formData.QTY?.toLocaleString()}</span>
                  </div>
                  {formData.Remark && (
                     <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500 text-sm">Remark</span>
                       <span className={`font-bold truncate max-w-[200px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Remark}</span>
                     </div>
                  )}
                </div>
              </div>

              {/* Packages Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Packaging Usage
                </h4>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
                    <span className="text-sm text-slate-500 font-medium">Total Packages</span>
                    <span className={`text-xl font-black ${isDarkMode ? 'text-mint-400' : 'text-mint-600'}`}>{totalPackages}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PACKAGE_COLUMNS.filter(col => (formData[col] as number) > 0).map(col => (
                    <div key={col} className={`p-3 rounded-lg border flex justify-between items-center ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate mr-2" title={col}>{col.replace(' QTY', '')}</span>
                      <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData[col]}</span>
                    </div>
                  ))}
                  {PACKAGE_COLUMNS.every(col => (formData[col] as number) === 0) && (
                    <div className="col-span-2 py-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg italic">
                      No packages specified.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setStep('edit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-bold transition-colors ${
                   isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back to Edit
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-lavender-500 to-lavender-600 text-white rounded-xl font-bold hover:from-lavender-600 hover:to-lavender-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      
      {/* Paste Modal Overlay */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Paste Data from Excel</h3>
            <p className="text-xs text-slate-500 mb-4">Copy your data columns from Excel (Name and Value) and paste them here.</p>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className={`w-full h-48 p-4 rounded-xl border text-sm font-mono focus:ring-2 outline-none resize-none ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              placeholder={`Example:\nPALLET 110x110x115\t21\nPALLET 110x110x90\t6`}
              autoFocus
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteData}
                className="px-6 py-2 text-sm font-bold text-white bg-mint-500 hover:bg-mint-600 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Process Data
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleReview} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left: General Info */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className={`p-6 rounded-2xl shadow-sm border h-full ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Info className="w-4 h-4 text-blue-600" />
                Shipment Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Shipment Date</label>
                  <div className="relative">
                    <input 
                      type="date" name="Date" required
                      value={formData.Date} onChange={handleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 cursor-pointer ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-lavender-500' 
                          : 'bg-lavender-50/50 border-lavender-200/50 text-slate-900 focus:bg-white focus:ring-lavender-500'
                      }`}
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
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-lavender-500' 
                          : 'bg-lavender-50/50 border-lavender-200/50 text-slate-900 focus:bg-white focus:ring-lavender-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Total Product QTY</label>
                    <input 
                      type="number" name="QTY" min="0" required
                      value={formData.QTY} onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 ${
                         isDarkMode 
                           ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-lavender-500' 
                           : 'bg-lavender-50/50 border-lavender-200/50 text-slate-900 focus:bg-white focus:ring-lavender-500'
                      }`}
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
                      className={`w-full px-4 py-3 border rounded-xl font-medium transition-all outline-none resize-none text-sm focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-lavender-500 placeholder-slate-500' 
                          : 'bg-lavender-50/50 border-lavender-200/50 text-slate-900 focus:bg-white focus:ring-lavender-500'
                      }`}
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Package Details */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className={`p-6 rounded-2xl shadow-sm border h-full ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-sm font-black flex items-center gap-2 uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-blue-200 border border-slate-600 hover:text-white' 
                        : 'bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}
                   >
                     <Table className="w-4 h-4" />
                     Batch Entry
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
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
                        className={`w-full px-4 py-2.5 border rounded-xl font-bold transition-all outline-none text-sm focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-mint-500 placeholder-slate-600' 
                              : 'bg-mint-50/50 border-mint-200/50 text-slate-900 focus:bg-white focus:ring-mint-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-black group-focus-within:hidden">PCS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`flex items-center justify-end gap-4 p-4 mt-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
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