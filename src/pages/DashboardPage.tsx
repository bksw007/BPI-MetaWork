import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PackingRecord } from '../../types';
import UnifiedNavbar from '../components/UnifiedNavbar';
import Dashboard from '../../components/Dashboard';
import DataTable from '../../components/DataTable';
import DataInputForm from '../../components/DataInputForm';
import SuccessModal from '../../components/SuccessModal';
import UnifiedLoading from '../components/UnifiedLoading';
import { 
  LayoutDashboard, 
  Table, 
  PlusCircle, 
  Filter, 
  X, 
  Download, 
  RefreshCw,
  Home
} from 'lucide-react';
import { getPackingRecords, addPackingRecord, subscribeToPackingRecords } from '../services/firebaseService';

const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialView = searchParams.get('view') || 'dashboard';
  
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

  const handleAddRecord = async (record: PackingRecord) => {
    try {
      await addPackingRecord(record);
      setView('table');
      setSuccessMessage('Record saved successfully to Firebase!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Check console for details.');
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
    
    const standardCols = ['110x110x115 QTY', '110x110x90 QTY', '110x110x65 QTY', '80X120X115 QTY', '80X120X90 QTY', '80X120X65 QTY'];
    const boxesCols = ['42X46X68 QTY', '47X66X68 QTY', '53X53X58 QTY', '57X64X84 QTY', '68X74X86 QTY', '70X100X90 QTY', '27X27X22 QTY', '53X53X19 QTY'];
    const warpCols = ['WARP QTY', 'UNIT QTY'];
    const returnableCols = ['RETURNABLE QTY'];
    
    const ratioValues: Record<string, number> = {
      '110x110x115 QTY': 1, '110x110x90 QTY': 1, '110x110x65 QTY': 1,
      '80X120X115 QTY': 1, '80X120X90 QTY': 1, '80X120X65 QTY': 1,
      'RETURNABLE QTY': 2,
      '42X46X68 QTY': 3, '47X66X68 QTY': 3, '53X53X58 QTY': 3, '57X64X84 QTY': 3,
      '68X74X86 QTY': 3, '70X100X90 QTY': 3, '27X27X22 QTY': 30, '53X53X19 QTY': 30,
      'WARP QTY': 10, 'UNIT QTY': 1
    };
    
    const allHeaders = [...baseHeaders, ...calculatedHeaders];
    
    const csvRows = [
      allHeaders.join(','),
      ...filteredData.map(row => {
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
        
        const values = [
          row.Date,
          row.Shipment,
          row.Mode,
          row.Product,
          row['SI QTY'],
          row.QTY,
          totalPackages,
          standardTotal,
          boxesTotal,
          warpTotal,
          returnableTotal,
          ratioStandard.toFixed(2),
          ratioBoxes.toFixed(2),
          ratioWarp.toFixed(2),
          ratioReturnable.toFixed(2)
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
    link.setAttribute('href', url);
    link.setAttribute('download', `packing_export_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-peach-50 dark:from-slate-900 dark:to-slate-800 flex flex-col">
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

          <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-lavender-200 dark:border-slate-700 shadow-sm">
                 <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-golden-500' : 'bg-mint-500'} animate-pulse`}></div>
                 {isLoading ? 'Syncing...' : 'Last update: '}
                 {!isLoading && lastUpdated && <span className="font-bold text-slate-700 dark:text-slate-200">{lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
               </div>
               <button
                 onClick={loadData}
                 disabled={isLoading}
                 className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400 rounded-lg border border-lavender-200 dark:border-lavender-800 hover:bg-lavender-200 dark:hover:bg-lavender-900/50 transition-colors disabled:opacity-50"
               >
                 <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                 Refresh
               </button>
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

        {/* Filters */}
        {view !== 'input' && (
          <div className="card-pastel p-5 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold mr-2 mb-2 md:mb-0">
               <Filter className="w-4 h-4" />
               <span className="text-sm uppercase tracking-wider">Filters</span>
             </div>

             <div className="w-full md:w-32">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Year</label>
               <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-lavender-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-lavender-500 outline-none">
                 <option value="All">All Years</option>
                 {filterOptions.years.map(year => <option key={year} value={year}>{year}</option>)}
               </select>
             </div>

             <div className="w-full md:w-40">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Month</label>
               <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-lavender-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-lavender-500 outline-none">
                 <option value="All">All Months</option>
                 {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
             </div>

             <div className="w-full md:w-48">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Customer</label>
               <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-lavender-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-lavender-500 outline-none">
                 <option value="All">All Customers</option>
                 {filterOptions.customers.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>

             <div className="w-full md:w-48">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Product</label>
               <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-lavender-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-lavender-500 outline-none">
                 <option value="All">All Products</option>
                 {filterOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>

             <div className="flex gap-2 ml-auto w-full md:w-auto">
               <button onClick={exportToCSV} disabled={filteredData.length === 0} className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-lavender-200 dark:border-slate-700 hover:bg-lavender-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors">
                 <Download className="w-4 h-4" />
                 Export
               </button>
               {(selectedYear !== 'All' || selectedMonth !== 'All' || selectedCustomer !== 'All' || selectedProduct !== 'All') && (
                 <button onClick={resetFilters} className="px-4 py-2 text-sm font-bold text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/30 rounded-lg flex items-center justify-center gap-1 transition-colors">
                   <X className="w-4 h-4" />
                   Clear
                 </button>
               )}
             </div>
          </div>
        )}

        {/* Main Content */}
        {view === 'dashboard' ? (
          <Dashboard data={filteredData} isDarkMode={isDarkMode} />
        ) : view === 'table' ? (
          <DataTable data={filteredData} isDarkMode={isDarkMode} />
        ) : (
          <DataInputForm 
            onSave={handleAddRecord} 
            onCancel={() => updateView('dashboard')} 
            existingCustomers={filterOptions.customers}
            existingProducts={filterOptions.products}
            isDarkMode={isDarkMode}
          />
        )}
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
    </div>
  );
};

export default DashboardPage;
