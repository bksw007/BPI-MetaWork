import React, { useState, useEffect, useMemo } from 'react';
import { PackingRecord } from './types';
import { fetchPackingData, submitPackingData } from './src/services/api';
import { generateSampleData } from './utils';
import Dashboard from './components/Dashboard';
import DataUploader from './components/DataUploader';
import DataTable from './components/DataTable';
import DataInputForm from './components/DataInputForm';
import { LayoutDashboard, Table, Upload, PackageCheck, Filter, X, Calendar, User, Package, Download, PlusCircle } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<PackingRecord[]>([]);
  const [view, setView] = useState<'dashboard' | 'table' | 'input'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const apiData = await fetchPackingData();
    if (apiData.length > 0) {
       setData(apiData);
    } else {
       // Fallback to sample data for demo if API fails or is empty, 
       // OR if user explicitly wants sample usage. 
       // For now, let's keep sample data only if completely empty?
       // Better to show empty state if real app. But let's fallback if API URL is missing.
       if (!import.meta.env.VITE_GOOGLE_SCRIPT_URL) {
         setData(generateSampleData());
       } else {
         setData([]);
       }
    }
    setIsLoading(false);
  };

  const handleDataLoaded = (newData: PackingRecord[]) => {
    setData(newData);
    setView('dashboard');
    resetFilters();
  };

  const handleAddRecord = async (record: PackingRecord) => {
    const success = await submitPackingData(record);
    if (success) {
      await loadData(); // Reload to get the new row with server-side timestamp
      setView('table');
      alert('Record saved successfully to Google Sheet!');
    } else {
      alert('Failed to save record to Google Sheet. Check console/network.');
      // Optionally add to local state anyway? No, better to force sync.
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
    const headers = Object.keys(filteredData[0]).filter(k => k !== 'id');
    const csvRows = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const val = row[header];
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-300">
      <aside className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-full md:w-64 flex-shrink-0 md:h-screen sticky top-0 z-10 flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
             <PackageCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">PackTrack</h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              view === 'dashboard' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setView('table')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              view === 'table' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <Table className="w-5 h-5" />
            Raw Data View
          </button>

          <button 
            onClick={() => setView('input')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              view === 'input' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Data Entry
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
           >
             {isDarkMode ? 'Light Mode' : 'Dark Mode'}
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {view === 'dashboard' ? 'Packing Overview' : view === 'table' ? 'Data Inspector' : 'New Packing Record'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {view === 'dashboard' ? 'Real-time summary of operations.' : view === 'table' ? 'Detailed view of records.' : 'Fill in the details for a new shipment.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></div>
              {isLoading ? 'Syncing...' : 'Last update: '}
              {!isLoading && <span className="font-bold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-GB')}</span>}
          </div>
        </header>

        {view !== 'input' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold mr-2 mb-2 md:mb-0">
              <Filter className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Filters</span>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="All">All Years</option>
                {filterOptions.years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>

            <div className="w-full md:w-40">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="All">All Months</option>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Customer</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="All">All Customers</option>
                {filterOptions.customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Product</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="All">All Products</option>
                {filterOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex gap-2 ml-auto w-full md:w-auto">
              <button onClick={exportToCSV} disabled={filteredData.length === 0} className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              {(selectedYear !== 'All' || selectedMonth !== 'All' || selectedCustomer !== 'All' || selectedProduct !== 'All') && (
                <button onClick={resetFilters} className="px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center justify-center gap-1 transition-colors">
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'dashboard' ? (
          <Dashboard data={filteredData} />
        ) : view === 'table' ? (
          <DataTable data={filteredData} />
        ) : (
          <DataInputForm 
            onSave={handleAddRecord} 
            onCancel={() => setView('dashboard')} 
            existingCustomers={filterOptions.customers}
            existingProducts={filterOptions.products}
          />
        )}
      </main>
    </div>
  );
};

export default App;