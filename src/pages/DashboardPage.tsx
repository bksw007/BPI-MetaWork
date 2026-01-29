import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PackingRecord } from '@types';
import UnifiedNavbar from '@components/UnifiedNavbar';
import Dashboard from '@components/legacy/Dashboard';
import DataTable from '@components/legacy/DataTable';
import DataInputForm from '@components/legacy/DataInputForm';
import SuccessModal from '@components/legacy/SuccessModal';
import UnifiedLoading from '@components/UnifiedLoading';
import { 
  LayoutDashboard, 
  Table, 
  PlusCircle, 
  Filter, 
  X, 
  Download, 
  RefreshCw,
  Home,
  ChevronUp,
  ChevronDown,
  Printer 
} from 'lucide-react';
import { getPackingRecords, addPackingRecord, updatePackingRecord, deletePackingRecord, subscribeToPackingRecords } from '@services/firebaseService';
import ShipmentDetailModal from '@components/legacy/ShipmentDetailModal';
import { useReactToPrint } from 'react-to-print';
import { PackingReport } from '@components/legacy/PackingReport';

const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialView = searchParams.get('view') || 'dashboard';
  
  const componentRef = React.useRef<HTMLDivElement>(null);
  
  // Custom print styles
  const pageStyle = `
    @page {
      size: A4;
      margin: 7mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
      .page-break {
        page-break-before: always;
      }
    }
  `;

  // Updated to use contentRef directly as suggested by error logs for newer versions
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Packing_Report_${new Date().toISOString().split('T')[0]}`,
    pageStyle: pageStyle,
  });
  
  const [data, setData] = useState<PackingRecord[]>([]);
  const [view, setView] = useState<'dashboard' | 'table' | 'input'>(initialView as any);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');

  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PackingRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToPackingRecords((records) => {
      setData(records);
      setLastUpdated(new Date());
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiData = await getPackingRecords();
      setData(apiData.length > 0 ? apiData : []); 
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(`Failed to load data: ${error.message || 'Unknown error'}`);
      setData([]); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async (record: PackingRecord) => {
    try {
      if (selectedRecord && selectedRecord.id === record.id) {
        // Update existing record
        if (record.id) {
          await updatePackingRecord(record.id, record);
          setSuccessMessage('Record updated successfully!');
        }
      } else {
        // Add new record
        await addPackingRecord(record);
        setSuccessMessage('Record saved successfully!');
      }
      
      setView('table');
      setShowSuccessModal(true);
      setSelectedRecord(null); // Clear selection after save
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Check console for details.');
    }
  };

  const handleRowClick = (record: PackingRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleEditRecord = (record: PackingRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(false);
    setView('input');
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deletePackingRecord(id);
      setIsDetailModalOpen(false);
      setSelectedRecord(null);
      setSuccessMessage('Record deleted successfully.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record.');
    }
  };

  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const customers = new Set<string>();
    const products = new Set<string>();
    
    data.forEach(item => {
      const d = new Date(item.Date);
      if (!isNaN(d.getTime())) {
        years.add(d.getFullYear().toString());
      }
      if (item.Shipment) {
        customers.add(item.Shipment);
      }
      if (item.Product) {
        products.add(item.Product);
      }
    });

    return {
      years: Array.from(years).sort().reverse(),
      customers: Array.from(customers).sort(),
      products: Array.from(products).sort()
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const d = new Date(item.Date);
      const isDateValid = !isNaN(d.getTime());
      
      const matchYear = selectedYear === 'All' || (isDateValid && d.getFullYear().toString() === selectedYear);
      const matchMonth = selectedMonth === 'All' || (isDateValid && (d.getMonth() + 1).toString() === selectedMonth);
      const matchCustomer = selectedCustomer === 'All' || item.Shipment === selectedCustomer;
      const matchProduct = selectedProduct === 'All' || item.Product === selectedProduct;

      return matchYear && matchMonth && matchCustomer && matchProduct;
    });
  }, [data, selectedYear, selectedMonth, selectedCustomer, selectedProduct]);

  const resetFilters = () => {
    setSelectedYear('All');
    setSelectedMonth('All');
    setSelectedCustomer('All');
    setSelectedProduct('All');
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    // 1. Define Headers
    const baseHeaders = ['Date', 'Shipment', 'Mode', 'Product', 'SI QTY', 'QTY'];
    const calculatedHeaders = [
      'Total Packages', 
      'Standard Total', 
      'Boxes Total', 
      'Warp Total', 
      'Returnable Total',
      'Ratio Standard',
      'Ratio Boxes', 
      'Ratio Warp',
      'Ratio Returnable'
    ];

    // Define raw data columns to append (Standard + Boxes + Warp + Returnable + others if any)
    const standardCols = ['110x110x115 QTY', '110x110x90 QTY', '110x110x65 QTY', '80X120X115 QTY', '80X120X90 QTY', '80X120X65 QTY'];
    const boxesCols = ['42X46X68 QTY', '47X66X68 QTY', '53X53X58 QTY', '57X64X84 QTY', '68X74X86 QTY', '70X100X90 QTY', '27X27X22 QTY', '53X53X19 QTY'];
    const warpCols = ['WARP QTY', 'UNIT QTY'];
    const returnableCols = ['RETURNABLE QTY'];
    
    // Combine all specific package columns for raw data export
    const rawDataCols = [...standardCols, ...boxesCols, ...warpCols, ...returnableCols, 'Remark'];

    const ratioValues: Record<string, number> = {
      '110x110x115 QTY': 1, '110x110x90 QTY': 1, '110x110x65 QTY': 1,
      '80X120X115 QTY': 1, '80X120X90 QTY': 1, '80X120X65 QTY': 1,
      'RETURNABLE QTY': 2,
      '42X46X68 QTY': 3, '47X66X68 QTY': 3, '53X53X58 QTY': 3, '57X64X84 QTY': 3,
      '68X74X86 QTY': 3, '70X100X90 QTY': 3, '27X27X22 QTY': 30, '53X53X19 QTY': 30,
      'WARP QTY': 10, 'UNIT QTY': 1
    };
    
    // Final Headers: Base -> Calculated -> Raw Data
    const allHeaders = [...baseHeaders, ...calculatedHeaders, ...rawDataCols];
    
    // Sort data by Date Ascending for export
    const sortedExportData = [...filteredData].sort((a, b) => {
      return new Date(a.Date).getTime() - new Date(b.Date).getTime();
    });

    const csvRows = [
      allHeaders.join(','),
      ...sortedExportData.map(row => {
        // Calculations
        const standardTotal = standardCols.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
        const boxesTotal = boxesCols.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
        const warpTotal = warpCols.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
        const returnableTotal = returnableCols.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
        const totalPackages = standardTotal + boxesTotal + warpTotal + returnableTotal;
        
        const calcGroupRatio = (cols: string[]) => {
          return cols.reduce((sum, col) => {
            const qty = Number(row[col]) || 0;
            const ratio = ratioValues[col] || 1;
            return sum + (qty / ratio);
          }, 0);
        };
        
        const ratioStandard = calcGroupRatio(standardCols);
        const ratioBoxes = calcGroupRatio(boxesCols);
        const ratioWarp = calcGroupRatio(warpCols);
        const ratioReturnable = calcGroupRatio(returnableCols);
        
        // Format Date to dd-mm-yyyy
        let formattedDate = row.Date;
        const dateObj = new Date(row.Date);
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          formattedDate = `${day}-${month}-${year}`;
        }

        // Construct Row Values
        const values = [
          formattedDate, // base: Date (dd-mm-yyyy)
          row.Shipment,
          row.Mode,
          row.Product,
          row['SI QTY'] || 0,
          row.QTY || 0,
          totalPackages,       // calculated
          standardTotal,
          boxesTotal,
          warpTotal,
          returnableTotal,
          ratioStandard.toFixed(2),
          ratioBoxes.toFixed(2),
          ratioWarp.toFixed(2),
          ratioReturnable.toFixed(2),
          ...rawDataCols.map(col => {
             const val = row[col];
             if (col === 'Remark') return val || ''; // Keep Remark empty if null
             return val !== undefined && val !== '' ? val : 0; // Fill 0 for empty numbers
          })
        ];
        
        return values.map(val => {
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate Filename: packing_export_YYYY-MM-DD_HH-mm.csv
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `packing_export_${dateStr}_${timeStr}.csv`);
    link.click();
  };

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const updateView = (newView: 'dashboard' | 'table' | 'input') => {
    setView(newView);
    setSearchParams({ view: newView });
  };

  // Generate Report Description based on filters
  const reportDescription = useMemo(() => {
     const parts = [];
     if (selectedYear !== 'All') parts.push(`Year: ${selectedYear}`);
     if (selectedMonth !== 'All') {
       const monthLabel = months.find(m => m.value === selectedMonth)?.label;
       parts.push(`Month: ${monthLabel}`);
     }
     if (selectedCustomer !== 'All') parts.push(`Customer: ${selectedCustomer}`);
     if (selectedProduct !== 'All') parts.push(`Product: ${selectedProduct}`);
     
     if (parts.length === 0) return "Executive summary of all packing activities across all periods.";
     return `Summary report filtered by ${parts.join(', ')}.`;
  }, [selectedYear, selectedMonth, selectedCustomer, selectedProduct]);

  return (
    <div className="min-h-screen bg-[linear-gradient(109.6deg,rgba(112,246,255,0.15)_11.2%,rgba(221,108,241,0.10)_42%,rgba(229,106,253,0.25)_71.5%,rgba(123,183,253,0.40)_100.2%)] flex flex-col">
      {/* Header Navigation */}
      {/* Unified Navigation Header */}
      <UnifiedNavbar>
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => updateView('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'dashboard' 
                ? 'bg-orange-50 text-orange-500' 
                : 'text-slate-900 hover:text-orange-500 hover:bg-orange-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          
          <button
            onClick={() => updateView('table')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'table' 
                ? 'bg-orange-50 text-orange-500' 
                : 'text-slate-900 hover:text-orange-500 hover:bg-orange-50'
            }`}
          >
            <Table className="w-4 h-4" />
            History
          </button>

          <button
            onClick={() => updateView('input')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'input' 
                ? 'bg-orange-50 text-orange-500' 
                : 'text-slate-900 hover:text-orange-500 hover:bg-orange-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Add
          </button>
        </div>
      </UnifiedNavbar>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {view === 'dashboard' ? 'Packing Overview' : view === 'table' ? 'History Records' : 'New Packing Record'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {view === 'dashboard' ? 'Analytics of historical packing records.' : view === 'table' ? 'Database of all past shipments.' : 'Record a completed packing.'}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-red-200 rounded-full">
              <X className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Error Loading Data</h3>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1 text-red-600">Please check your Firebase configuration and permissions.</p>
            </div>
          </div>
        )}

        {/* Filters - Sleek Horizontal Chips */}
        {view !== 'input' && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Toggle Button */}
              <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isFilterExpanded 
                    ? 'bg-sky-500 text-white shadow-md' 
                    : 'bg-white/70 backdrop-blur-sm text-slate-600 hover:bg-white/90 border border-white/50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {isFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Active Filter Pills (always visible) */}
              {selectedYear !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                  {selectedYear}
                  <button onClick={() => setSelectedYear('All')} className="hover:text-sky-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedMonth !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {months.find(m => m.value === selectedMonth)?.label}
                  <button onClick={() => setSelectedMonth('All')} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCustomer !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium max-w-[150px] truncate">
                  {selectedCustomer}
                  <button onClick={() => setSelectedCustomer('All')} className="hover:text-violet-900 flex-shrink-0"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedProduct !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium max-w-[150px] truncate">
                  {selectedProduct}
                  <button onClick={() => setSelectedProduct('All')} className="hover:text-amber-900 flex-shrink-0"><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Clear All */}
              {(selectedYear !== 'All' || selectedMonth !== 'All' || selectedCustomer !== 'All' || selectedProduct !== 'All') && (
                <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              )}

              {/* Export Button */}
              <div className="ml-auto flex items-center gap-2">
                <button 
                  onClick={exportToCSV} 
                  disabled={filteredData.length === 0} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md text-slate-600 hover:bg-white/40 rounded-full text-xs font-semibold border border-white/30 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button 
                  onClick={handlePrint} 
                  disabled={filteredData.length === 0} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/80 backdrop-blur-md text-white hover:bg-indigo-600 rounded-full text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  PDF Report
                </button>
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {isFilterExpanded && (
              <div className="mt-3 p-4 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.06)] animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Year</label>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none transition-all"
                    >
                      <option value="All">All Years</option>
                      {filterOptions.years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Month</label>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none transition-all"
                    >
                      <option value="All">All Months</option>
                      {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer</label>
                    <select 
                      value={selectedCustomer} 
                      onChange={(e) => setSelectedCustomer(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none transition-all"
                    >
                      <option value="All">All Customers</option>
                      {filterOptions.customers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Product</label>
                    <select 
                      value={selectedProduct} 
                      onChange={(e) => setSelectedProduct(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none transition-all"
                    >
                      <option value="All">All Products</option>
                      {filterOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden Report Component for Printing 
            - Outer div: POSITIONS the content off-screen (left: 200vw) so user doesn't see it.
            - Inner div: The ACTUAL content to print. Ref is here. It has NO positioning styles (static), 
              so when react-to-print grabs it, it appears at (0,0) on the paper.
            - We use 200vw to ensure it doesn't trigger horizontal scroll if possible, or just far away.
        */}
        <div style={{ position: 'fixed', top: 0, left: '200vw' }}> 
          <div 
            ref={componentRef}
            style={{ 
              width: '794px', // A4 width @ 96 DPI
              minHeight: '1123px', // A4 height
              backgroundColor: 'white',
              // No position: fixed/absolute here!
            }}
          >
             <PackingReport 
                data={filteredData} 
                reportTitle="Packing Report"
                reportDescription={reportDescription} 
             />
          </div>
        </div>

        {/* Main Content */}
        {view === 'dashboard' ? (
          <Dashboard data={filteredData} isDarkMode={isDarkMode} />
        ) : view === 'input' ? (
          <DataInputForm 
            onSave={handleSaveRecord} 
            onCancel={() => {
              setView('table');
              setSelectedRecord(null);
            }} 
            existingCustomers={Array.from(filterOptions.customers)}
            existingProducts={Array.from(filterOptions.products)}
            isDarkMode={isDarkMode}
            initialData={selectedRecord || undefined}
          />
        ) : view === 'table' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <DataTable 
               data={filteredData} 
               isDarkMode={isDarkMode} 
               onRowClick={handleRowClick}
             />
          </div>
        ) : null}
      </main>

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
        isDarkMode={isDarkMode}
      />

      <UnifiedLoading 
        mode="fullscreen" 
        isOpen={isLoading} 
      />
      
      {/* Shipment Detail Modal */}
      {selectedRecord && (
        <ShipmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRecord(null); // Clear selection to prevent data leaking to Add form
          }}
          record={selectedRecord}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
};

export default DashboardPage;
