import React, { useState, useMemo } from 'react';
import { PackingRecord } from '@types';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface DataTableProps {
  data: PackingRecord[];
  isDarkMode?: boolean;
  onRowClick?: (record: PackingRecord) => void;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({ data, isDarkMode, onRowClick }) => {
  // Sorting State - Default by Date Ascending
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'Date', direction: 'asc' });

  // Get all unique keys from the first record to use as headers, filtering out ID and Timestamp
  const headers = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'Timestamp') : [];
  
  // Prioritize common headers and move Remark to the very end
  const prioritizedHeaders = ['Date', 'Shipment', 'Mode', 'Product', 'SI QTY', 'QTY'];
  const otherHeaders = headers.filter(h => !prioritizedHeaders.includes(h) && h !== 'Remark');
  const sortedHeaders = [...prioritizedHeaders, ...otherHeaders, ...(headers.includes('Remark') ? ['Remark'] : [])];

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      // If values are numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string compare
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /* Pagination Removed - Show All Records */
  const currentData = sortedData;

  // Helper to format ISO date (yyyy-mm-dd) back to dd/mm/yyyy for display
  const formatCell = (header: string, value: string | number) => {
    if (header === 'Date' && typeof value === 'string') {
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
      }
    }
    return value;
  };

  return (
    <div className="overflow-hidden flex flex-col h-[calc(100vh-270px)] transition-colors duration-300 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-white/40 border-slate-200/30">
              {sortedHeaders.map(header => (
                <th 
                  key={header} 
                  className={`p-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap sticky top-0 cursor-pointer transition-colors select-none group bg-sky-200/90 text-sky-900 hover:bg-sky-300/90 border-b border-sky-300 z-10 ${
                    header === 'Date' || header === 'Shipment' ? 'text-left pl-4' : 'text-center'
                  }`}
                  onClick={() => handleSort(header)}
                >
                  <div className={`flex items-center gap-1 ${header === 'Date' || header === 'Shipment' ? 'justify-start' : 'justify-center'}`}>
                    {header}
                    <span className="text-slate-400">
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {currentData.map((row) => (
              <tr 
                key={row.id} 
                className="transition-colors hover:bg-white/40 cursor-pointer"
                onClick={() => onRowClick && onRowClick(row)}
              >
                {sortedHeaders.map(header => (
                  <td key={`${row.id}-${header}`} className={`p-3 text-sm whitespace-nowrap text-slate-600 ${
                    header === 'Date' || header === 'Shipment' ? 'text-left pl-4' : 'text-center'
                  }`}>
                    {formatCell(header, row[header])}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
               <tr>
                 <td colSpan={sortedHeaders.length} className="p-8 text-center text-slate-400">
                   No data matching filters.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Count Only */}
      <div className="p-4 border-t flex justify-between items-center flex-shrink-0 border-slate-200/20 bg-white/10 backdrop-blur-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Total Records: {sortedData.length}
        </span>
      </div>
    </div>
  );
};

export default DataTable;