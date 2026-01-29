import React, { useState } from 'react';
import { PackingRecord, PACKAGE_COLUMNS } from '@types';
import { 
  X, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Calendar, 
  Package, 
  Truck, 
  Layers, 
  Info,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface ShipmentDetailModalProps {
  record: PackingRecord;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: PackingRecord) => void;
  onDelete: (id: string) => void;
  isDarkMode?: boolean;
}

const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDarkMode
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  // Calculate Total Packages dynamicallly for display
  const totalPackages = PACKAGE_COLUMNS.reduce((sum, col) => sum + (Number(record[col]) || 0), 0);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const handleConfirmDelete = () => {
    if (record.id) {
      onDelete(record.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-all"
        onClick={() => !showDeleteConfirm && onClose()}
      />

      {/* Main Modal */}
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 ${
         isDarkMode ? 'bg-slate-900/90 border border-slate-700 text-white' : 'bg-white/80 border border-white/60 text-slate-800'
      } backdrop-blur-xl`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between rounded-t-3xl ${
          isDarkMode ? 'border-slate-700/50 bg-slate-900/80' : 'border-white/50 bg-white/60'
        }`}>
          <div>
             <div className="flex items-center gap-3 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  ID: {record.id?.slice(-8) || 'N/A'}
                </span>
             </div>
             <h2 className="text-lg font-black leading-tight text-center sm:text-left">
               {record.Product} - {record.Shipment} - {record.Mode}
             </h2>
          </div>

          <div className="flex items-center gap-2">
             {/* Action Menu (Replaces Close Button) */}
             <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-full transition-all ${
                     isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-white/80 text-slate-500 hover:shadow-sm'
                  }`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 ${
                       isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/90 backdrop-blur-md border-white/60'
                    }`}>
                       <button 
                          onClick={() => {
                            onEdit(record);
                            setShowMenu(false);
                          }}
                          className={`w-full px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
                             isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                       >
                          <Edit2 className="w-4 h-4" />
                          Edit Record
                       </button>
                       <button 
                          onClick={handleDeleteClick}
                          className={`w-full px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
                             isDarkMode ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                       >
                          <Trash2 className="w-4 h-4" />
                          Delete
                       </button>
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">
           
           {/* Key Matrix */}
           <div className="grid grid-cols-3 gap-4 mx-auto max-w-lg">
              {/* Date */}
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                 isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
              }`}>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                 <p className="text-lg font-black">{record.Date.split('-').reverse().join('-')}</p>
              </div>

              {/* SI QTY */}
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                 isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
              }`}>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SI QTY</span>
                 <p className="text-lg font-black">{record['SI QTY']}</p>
              </div>

              {/* Total QTY */}
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                 isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/60'
              }`}>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total QTY</span>
                 <p className="text-lg font-black text-blue-500">{record.QTY.toLocaleString()}</p>
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
                 {PACKAGE_COLUMNS.some(col => (record[col] as number) > 0) ? (
                    <div className="grid grid-cols-4 gap-px bg-slate-200/50 dark:bg-slate-700">
                       {PACKAGE_COLUMNS.map(col => {
                          const val = record[col] as number;
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
           {record.Remark && (
              <div className={`p-4 rounded-xl border max-w-xl mx-auto ${
                  isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-amber-50/50 border-amber-100'
               }`}>
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Remark</h4>
                  <p className="font-medium text-sm leading-relaxed">{record.Remark}</p>
               </div>
           )}

        </div>
        
        {/* Footer info */}
        <div className={`px-8 py-4 border-t text-[10px] text-slate-400 font-medium flex justify-between ${
           isDarkMode ? 'border-slate-700/50' : 'border-white/50'
        }`}>
           <span>Created: {record.Timestamp ? new Date(record.Timestamp).toLocaleString('en-GB') : 'N/A'}</span>
           {record.id && <span>Ref: {record.id}</span>}
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
           <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200 rounded-3xl">
              <div className="max-w-md w-full text-center space-y-6 p-6">
                 <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-500 animate-bounce">
                    <Trash2 className="w-10 h-10" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black mb-2">Are you sure?</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                       This action will permanently delete this packing record. <br/>
                       This cannot be undone.
                    </p>
                 </div>
                 <div className="flex items-center justify-center gap-4 pt-2">
                    <button 
                       onClick={() => setShowDeleteConfirm(false)}
                       className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleConfirmDelete}
                       className="px-8 py-3 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20 active:scale-95 transition-all"
                    >
                       Yes, Delete it
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default ShipmentDetailModal;
