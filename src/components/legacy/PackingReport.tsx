import React from 'react';
import { PackingRecord } from '@types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { aggregateData } from '@utils';

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

export const PackingReport = React.forwardRef((props: PackingReportProps, ref: React.ForwardedRef<HTMLDivElement>) => {
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
           @page { 
              size: A4; 
              margin-top: 0mm; 
              margin-bottom: 15mm; 
              margin-left: 7mm; 
              margin-right: 7mm;
           }
           .print-container { 
              padding-top: 15mm; 
              -webkit-print-color-adjust: exact; 
           }
           .page-break { page-break-before: always; }
           
           /* Ensure table header repeats on new pages */
           thead { display: table-header-group; }
           tr { break-inside: avoid; }
        `}
      </style>

      {/* --- PAGE 1: Summary & Charts --- */}
      <div className="flex flex-col h-[calc(100vh-25mm)] justify-between">
        
        {/* Header */}
        <div className="mb-4 border-b-2 border-slate-800 pb-2">
           <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-2">{reportTitle}</h1>
           <p className="text-lg text-slate-600 font-medium line-clamp-2 h-[3.5rem] leading-snug">{reportDescription}</p>
           <p className="text-sm text-slate-400 mt-2">Generated on: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
           {/* Timeline - LOCKED: Frame 260px / Chart 180px */}
           <div className="col-span-2 h-[260px] border rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <h3 className="text-lg font-bold mb-2 text-slate-700">Packing Volume Timeline</h3>
              <div className="h-[180px] w-full">
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
           </div>

           {/* Mode Distribution - LOCKED: Frame 220px / Chart 160px */}
           <div className="h-[220px] border rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <h3 className="text-lg font-bold mb-2 text-slate-700">Transport Mode</h3>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeChartData}
                      cx="45%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {modeChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '11px', right: 15 }}
                      formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Top Customers - LOCKED: Frame 220px / Chart 150px */}
           <div className="h-[220px] border rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <h3 className="text-lg font-bold mb-2 text-slate-700">Top Customers</h3>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shipmentChartData} layout="vertical" margin={{top: 5, right: 40, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                     <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} label={{ position: 'right', fontSize: 10 }}>
                        {shipmentChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

        </div>

        {/* --- ROW 2: Package Type Usage (Full Width) --- */}
        <div className="mb-4 p-2 border rounded-xl bg-slate-50">
          <h3 className="text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
             <span className="text-emerald-400">📦</span> Package Type Usage
          </h3>
          <div className="grid grid-cols-3 gap-3">
             {/* Col 1: Standard */}
             <div className="bg-white/50 p-2 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-slate-700 uppercase text-[10px]">Standard Package</h4>
                   <span className="bg-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm border text-slate-500">
                      Total: {packageData.filter(p => ['110x110x115', '110x110x90', '110x110x65', '80X120X115', '80X120X90', '80X120X65'].some(k => p.name.includes(k))).reduce((s,i)=>s+i.value,0)}
                   </span>
                </div>
                <div className="space-y-1">
                   {packageData.filter(p => ['110x110x115', '110x110x90', '110x110x65', '80X120X115', '80X120X90', '80X120X65'].some(k => p.name.includes(k))).map((pkg, idx) => (
                      <div key={idx} className="flex items-center text-[10px]">
                         <span className="w-20 font-medium text-slate-600 truncate mr-1" title={pkg.name}>{pkg.name.replace(' QTY','')}</span>
                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-1">
                            <div className="h-full bg-emerald-300 rounded-full" style={{ width: `${(pkg.value / Math.max(...packageData.map(p=>p.value))) * 100}%` }}></div>
                         </div>
                         <span className="font-bold text-slate-800 w-6 text-right">{pkg.value}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Col 2: Boxes */}
             <div className="bg-white/50 p-2 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-slate-700 uppercase text-[10px]">Boxes Package</h4>
                   <span className="bg-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm border text-slate-500">
                      Total: {packageData.filter(p => !['110x110x115', '110x110x90', '110x110x65', '80X120X115', '80X120X90', '80X120X65', 'WARP', 'UNIT', 'RETURNABLE'].some(k => p.name.includes(k))).reduce((s,i)=>s+i.value,0)}
                   </span>
                </div>
                <div className="space-y-1">
                   {packageData.filter(p => !['110x110x115', '110x110x90', '110x110x65', '80X120X115', '80X120X90', '80X120X65', 'WARP', 'UNIT', 'RETURNABLE'].some(k => p.name.includes(k))).map((pkg, idx) => (
                      <div key={idx} className="flex items-center text-[10px]">
                         <span className="w-20 font-medium text-slate-600 truncate mr-1" title={pkg.name}>{pkg.name.replace(' QTY','')}</span>
                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-1">
                            <div className="h-full bg-emerald-300 rounded-full" style={{ width: `${(pkg.value / Math.max(...packageData.map(p=>p.value))) * 100}%` }}></div>
                         </div>
                         <span className="font-bold text-slate-800 w-6 text-right">{pkg.value}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Col 3: Warp & Returnable */}
             <div className="flex flex-col gap-2">
                {/* Warp */}
                <div className="bg-white/50 p-2 rounded-lg border border-slate-100 flex-1">
                   <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-slate-700 uppercase text-[10px]">Warp Package</h4>
                      <span className="bg-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm border text-slate-500">
                         Total: {packageData.filter(p => p.name.includes('WARP') || p.name.includes('UNIT')).reduce((s,i)=>s+i.value,0)}
                      </span>
                   </div>
                   <div className="space-y-1">
                      {packageData.filter(p => p.name.includes('WARP') || p.name.includes('UNIT')).map((pkg, idx) => (
                         <div key={idx} className="flex items-center text-[10px]">
                            <span className="w-20 font-medium text-slate-600 truncate mr-1" title={pkg.name}>{pkg.name.replace(' QTY','')}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-1">
                               <div className="h-full bg-emerald-300 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                            <span className="font-bold text-slate-800 w-6 text-right">{pkg.value}</span>
                         </div>
                      ))}
                   </div>
                </div>
                {/* Returnable */}
                {packageData.some(p => p.name.includes('RETURNABLE')) && (
                   <div className="bg-white/50 p-2 rounded-lg border border-slate-100 flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <h4 className="font-bold text-slate-700 uppercase text-[10px]">Returnable</h4>
                      </div>
                      <div className="space-y-1">
                         {packageData.filter(p => p.name.includes('RETURNABLE')).map((pkg, idx) => (
                            <div key={idx} className="flex items-center text-[10px]">
                               <span className="w-20 font-medium text-slate-600 truncate mr-1" title={pkg.name}>{pkg.name.replace(' QTY','')}</span>
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-1">
                                  <div className="h-full bg-emerald-300 rounded-full" style={{ width: '100%' }}></div>
                               </div>
                               <span className="font-bold text-slate-800 w-6 text-right">{pkg.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* --- ROW 3: Ratio Analysis (Full Width) --- */}
        <div className="mb-4 p-2 border rounded-xl bg-slate-50">
           <h3 className="text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
             <span className="text-orange-400">📊</span> Ratio Analysis (Product Capacity)
           </h3>
           <div className={`grid gap-3 ${
              data.reduce((s, r) => s + calculateRatios(r).returnable, 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'
           }`}>
              {[
                 { 
                    name: 'STANDARD PACKAGE', 
                    titleColor: 'text-slate-600',
                    capacity: data.reduce((s, r) => s + calculateRatios(r).standard, 0),
                    used: data.reduce((s, r) => s + calculateRatios(r).standard / 1, 0) // Approximation based on ratio 1
                 },
                 { 
                    name: 'BOXES PACKAGE', 
                    titleColor: 'text-slate-600',
                    capacity: data.reduce((s, r) => s + calculateRatios(r).boxes, 0),
                    used: data.reduce((s, r) => s + calculateRatios(r).boxes / 3, 0) // Approximation based on avg ratio 3
                 },
                 { 
                    name: 'WARP PACKAGE', 
                    titleColor: 'text-slate-600',
                    capacity: data.reduce((s, r) => s + calculateRatios(r).warp, 0),
                    used: data.reduce((s, r) => s + calculateRatios(r).warp / 10, 0) // Approximation based on avg ratio 10
                 },
                 // Conditionally add Returnable if it has value
                 ...(data.reduce((s, r) => s + calculateRatios(r).returnable, 0) > 0 ? [{
                    name: 'RETURNABLE PACKAGE', 
                    titleColor: 'text-slate-600',
                    capacity: data.reduce((s, r) => s + calculateRatios(r).returnable, 0),
                    used: data.reduce((s, r) => s + calculateRatios(r).returnable / 2, 0) // Approximation based on avg ratio 2
                 }] : [])
              ].map((item, idx) => (
                 <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${item.titleColor}`}>{item.name}</h4>
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className="text-2xl font-black text-slate-800">{item.capacity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                       <span className="text-[10px] font-medium text-slate-400">units capacity</span>
                    </div>
                    
                    <div className="flex justify-between items-end mb-1 text-[10px] font-medium">
                       <span className="text-slate-500">Packages Used</span>
                       <span className="text-slate-900 font-bold">{item.used.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1 bg-orange-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-400 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-1 italic text-right">Based on defined package ratios</p>
                 </div>
              ))}
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
               <th className="p-2 border font-bold text-center text-slate-700 text-[10px]">Ratio<br/>Std</th>
               <th className="p-2 border font-bold text-center text-slate-700 text-[10px]">Ratio<br/>Box</th>
               <th className="p-2 border font-bold text-center text-slate-700 text-[10px]">Ratio<br/>Warp</th>
               <th className="p-2 border font-bold text-center text-slate-700 text-[10px]">Ratio<br/>Ret</th>
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
                    <td className="p-2 border text-center text-slate-600 font-mono text-[10px]">{standard.toFixed(1)}</td>
                    <td className="p-2 border text-center text-slate-600 font-mono text-[10px]">{boxes.toFixed(1)}</td>
                    <td className="p-2 border text-center text-slate-600 font-mono text-[10px]">{warp.toFixed(1)}</td>
                    <td className="p-2 border text-center text-slate-600 font-mono text-[10px]">{returnable.toFixed(1)}</td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
