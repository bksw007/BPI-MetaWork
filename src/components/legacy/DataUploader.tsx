import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import { parseCSV } from '@utils';
import { PackingRecord } from '@types';

interface DataUploaderProps {
  onDataLoaded: (data: PackingRecord[]) => void;
  onCancel: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onDataLoaded, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        if (data.length === 0) {
          setError("No data found in file.");
        } else {
          onDataLoaded(data);
        }
      } catch (err) {
        setError("Failed to parse CSV. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Import Data</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8">
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-slate-700 font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-slate-400 mb-6">CSV files only (exported from Google Sheets)</p>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Select File
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Instructions</h4>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Open your Google Sheet.</li>
              <li>Go to <strong>File &gt; Download &gt; Comma Separated Values (.csv)</strong>.</li>
              <li>Upload the downloaded file here.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUploader;
