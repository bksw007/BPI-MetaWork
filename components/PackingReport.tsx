import React from 'react';
import { PackingRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { aggregateData } from '../utils';

interface PackingReportProps {
  data: PackingRecord[];
  reportTitle: string;
  reportDescription: string;
}

const COLORS = ['#A88AFF', '#FFB3BA', '#6EE7B7', '#FFD89B', '#F4C2C2', '#D4E8F5'];

// Helper to format Date
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const PackingReport = React.forwardRef<HTMLDivElement, PackingReportProps>((props, ref) => {
  const { data, reportTitle, reportDescription } = props;
  
  // Aggregate data for charts
  const { timelineData, packageData, shipmentChartData, modeChartData, groupStats } = aggregateData(data);

  // Sort data by Date Ascending
  const sortedData = [...data].sort((a, b) => {
    return new Date(a.Date).getTime() - new Date(b.Date).getTime();
  });

  // Calculate Ratios Helper (duplicated logic from CSV export to be consistent)
  const calculateRatios = (row: PackingRecord) => {
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

    const calc = (cols: string[]) => cols.reduce((sum, col) => {
       const qty = Number(row[col]) || 0;
       const ratio = ratioValues[col] || 1;
       return sum + (qty / ratio);
    }, 0);

    const standard = calc(standardCols);
    const boxes = calc(boxesCols);
    const warp = calc(warpCols);
    const returnable = calc(returnableCols);
    
    // Calculate Total Packages
    const totalPackages = 
        standardCols.reduce((s, c) => s + (Number(row[c])||0), 0) +
        boxesCols.reduce((s, c) => s + (Number(row[c])||0), 0) +
        warpCols.reduce((s, c) => s + (Number(row[c])||0), 0) +
        returnableCols.reduce((s, c) => s + (Number(row[c])||0), 0);

    return { standard, boxes, warp, returnable, totalPackages };
  }

  return (
    <div ref={ref} className="w-full bg-white text-slate-900 font-sans print-container">
      <style type="text/css" media="print">
        {`
           @page { size: A4; margin: 20mm; }
           .page-break { page-break-before: always; }
           .print-container { -webkit-print-color-adjust: exact; }
        `}
      </style>

      {/* --- PAGE 1: Summary & Charts --- */}
      <div className="flex flex-col h-[calc(100vh-40mm)]">
        
        {/* Header */}
        <div className="mb-8 border-b-2 border-slate-800 pb-4">
           <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-2">{reportTitle}</h1>
           <p className="text-lg text-slate-600 font-medium">{reportDescription}</p>
           <p className="text-sm text-slate-400 mt-2">Generated on: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
           {/* Timeline */}
           <div className="col-span-2 h-[240px] border rounded-xl p-4 bg-slate-50">
              <h3 className="text-lg font-bold mb-4 text-slate-700">Packing Volume Timeline</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <YAxis tick={{fontSize: 10}} />
                  <Legend />
                  <Line type="monotone" dataKey="qty" name="Products (QTY)" stroke="#A88AFF" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="packages" name="Packages Used" stroke="#6EE7B7" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
           </div>

           {/* Mode Distribution */}
           <div className="h-[230px] border rounded-xl p-4 bg-slate-50">
              <h3 className="text-lg font-bold mb-4 text-slate-700">Transport Mode</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                    label
                  >
                    {modeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
           </div>

           {/* Top Customers */}
           <div className="h-[225px] border rounded-xl p-4 bg-slate-50">
              <h3 className="text-lg font-bold mb-4 text-slate-700">Top Customers</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shipmentChartData} layout="vertical" margin={{top: 5, right: 40, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                  <Bar dataKey="value" fill="#A88AFF" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} label={{ position: 'right', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* --- PAGE 2: Data Table --- */}
      <div className="page-break pt-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 border-l-4 border-blue-500 pl-4">Detailed Records</h2>
        
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
               <th className="p-2 border font-bold text-slate-700">Date</th>
               <th className="p-2 border font-bold text-slate-700">Shipment</th>
               <th className="p-2 border font-bold text-center text-slate-700">Mode</th>
               <th className="p-2 border font-bold text-slate-700">Product</th>
               <th className="p-2 border font-bold text-right text-slate-700">SI QTY</th>
               <th className="p-2 border font-bold text-right text-slate-700">PCS QTY</th>
               <th className="p-2 border font-bold text-right text-slate-700">Total Pack</th>
               <th className="p-2 border font-bold text-center text-slate-700">Ratio Analysis<br/><span className="text-[9px] font-normal text-slate-500">(Std / Box / Warp / Ret)</span></th>
            </tr>
          </thead>
          <tbody>
             {sortedData.map((row) => {
               const { standard, boxes, warp, returnable, totalPackages } = calculateRatios(row);
               return (
                 <tr key={row.id} className="border-b border-slate-200 break-inside-avoid">
                    <td className="p-2 border text-slate-600 whitespace-nowrap">{formatDate(row.Date)}</td>
                    <td className="p-2 border text-slate-800 font-medium">{row.Shipment}</td>
                    <td className="p-2 border text-center text-slate-600">{row.Mode}</td>
                    <td className="p-2 border text-slate-600 font-mono text-[10px]">{row.Product}</td>
                    <td className="p-2 border text-right text-slate-600">{Number(row['SI QTY']).toLocaleString()}</td>
                    <td className="p-2 border text-right text-slate-600">{Number(row.QTY).toLocaleString()}</td>
                    <td className="p-2 border text-right font-bold text-slate-700">{totalPackages.toLocaleString()}</td>
                    <td className="p-2 border text-center text-[10px] text-slate-500 font-mono">
                       {standard.toFixed(1)} / {boxes.toFixed(1)} / {warp.toFixed(1)} / {returnable.toFixed(1)}
                    </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
