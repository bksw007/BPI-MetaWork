import React, { useMemo } from 'react';
import { PackingRecord, PACKAGE_GROUPS } from '../types';
import { aggregateData } from '../utils';
import StatsCard from './StatsCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Package, Truck, Calendar, Layers, Activity, Users, BarChart2, Box } from 'lucide-react';

interface DashboardProps {
  data: PackingRecord[];
  isDarkMode: boolean;
}

const COLORS = ['#A88AFF', '#FFB3BA', '#6EE7B7', '#FFD89B', '#F4C2C2', '#D4E8F5'];

const Dashboard: React.FC<DashboardProps> = ({ data, isDarkMode }) => {
  const { stats, timelineData, packageData, shipmentChartData, modeChartData, groupStats, ratioStats } = useMemo(() => aggregateData(data), [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Products (QTY)" 
          value={stats.totalItems.toLocaleString()} 
          icon={Layers} 
          color="bg-blue-500" 
          subValue="Total pieces packed"
          isDarkMode={isDarkMode}
        />
        <StatsCard 
          title="Packages Used" 
          value={stats.totalPackages.toLocaleString()} 
          icon={Package} 
          color="bg-emerald-500"
          subValue="Sum of all package columns"
          isDarkMode={isDarkMode}
        />
        <StatsCard 
          title="Top Customer" 
          value={stats.topCustomer} 
          icon={Users} 
          color="bg-indigo-500"
          subValue="Highest volume"
          isDarkMode={isDarkMode}
        />
        <StatsCard 
          title="Total Jobs (SI)" 
          value={stats.totalSI.toLocaleString()} 
          icon={Activity} 
          color="bg-amber-500"
          isDarkMode={isDarkMode}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Timeline */}
        <div className={`card-pastel p-6 transition-all duration-300 ${
           isDarkMode 
             ? 'bg-slate-800/80 backdrop-blur-sm border-lavender-200/30 shadow-[0_0_15px_rgba(232,213,255,0.15)]' 
             : 'shadow-powder-100/50'
        } lg:col-span-2`}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-powder-500" />
            Packing Volume Timeline
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day:'numeric'})} 
                  stroke={isDarkMode ? '#475569' : '#94a3b8'}
                />
                <YAxis tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}} stroke={isDarkMode ? '#475569' : '#94a3b8'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    borderColor: isDarkMode ? '#334155' : '#fff',
                    color: isDarkMode ? '#fff' : '#000',
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="qty" name="Products (QTY)" stroke="#A88AFF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="packages" name="Packages Used" stroke="#6EE7B7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mode Distribution */}
        <div className={`card-pastel p-6 transition-all duration-300 ${
           isDarkMode 
             ? 'bg-slate-800/80 backdrop-blur-sm border-lavender-200/30 shadow-[0_0_15px_rgba(232,213,255,0.15)]' 
             : 'shadow-lavender-100/50'
        }`}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-lavender-500" />
            Transport Mode
          </h3>
          <div className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Shipment/Customers (35% width approx = 1 of 3 cols) */}
        <div className={`card-pastel p-6 lg:col-span-1 transition-all duration-300 ${
           isDarkMode 
             ? 'bg-slate-800/80 backdrop-blur-sm border-lavender-200/30 shadow-[0_0_15px_rgba(232,213,255,0.15)]' 
             : 'shadow-powder-100/50'
        }`}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-powder-500" />
            Top Customers
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shipmentChartData} layout="vertical" margin={{top: 5, right: 0, left: 0, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis type="number" hide />
                <YAxis 
                   dataKey="name" 
                   type="category" 
                   width={60} 
                   tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                />
                <Tooltip 
                   cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} 
                   contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    borderColor: isDarkMode ? '#334155' : '#fff',
                    color: isDarkMode ? '#fff' : '#000',
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#A88AFF" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Dimensions Breakdown (Grouped) (65% width approx = 2 of 3 cols) */}
        <div className={`card-pastel p-6 lg:col-span-2 transition-all duration-300 ${
           isDarkMode 
             ? 'bg-slate-800/80 backdrop-blur-sm border-lavender-200/30 shadow-[0_0_15px_rgba(224,247,233,0.15)]' 
             : 'shadow-mint-100/50'
        }`}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-mint-500" />
            Package Type Usage
          </h3>
          <div className="h-96 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start">
             {Object.entries(PACKAGE_GROUPS).map(([groupName, columns]) => {
                const totalInGroup = groupStats[groupName] || 0;
                if (totalInGroup === 0) return null;

                const groupPackages = packageData.filter(pkg => columns.includes(pkg.name + " QTY") || columns.includes(pkg.name));
                if (groupPackages.length === 0) return null;

                return (
                  <div key={groupName} className="bg-lavender-50/50 dark:bg-slate-700/50 p-4 rounded-xl border border-lavender-200/50 dark:border-slate-600 h-full">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{groupName}</h4>
                        <span className="text-xs font-black px-2 py-1 bg-white dark:bg-slate-600 rounded text-slate-500 dark:text-slate-300">
                          Total: {totalInGroup.toLocaleString()}
                        </span>
                     </div>
                     <div className="space-y-3">
                       {groupPackages.map((pkg) => (
                         <div key={pkg.name} className="flex items-center group">
                           <div className="w-32 text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={pkg.name}>
                             {pkg.name}
                           </div>
                           <div className="flex-1 mx-3 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-mint-500 rounded-full group-hover:bg-mint-400 transition-colors"
                               style={{ width: `${(pkg.value / Math.max(...packageData.map(p => p.value))) * 100}%` }}
                             />
                           </div>
                           <div className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">
                             {pkg.value.toLocaleString()}
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                );
             })}
             
             {Object.values(groupStats).every(v => v === 0) && (
               <p className="text-center text-slate-400 py-10 col-span-2">No specific package data found.</p>
             )}
          </div>
        </div>
      </div>

      {/* Ratio Analysis Section */}
      <div className={`card-pastel p-6 transition-all duration-300 ${
           isDarkMode 
             ? 'bg-slate-800/80 backdrop-blur-sm border-lavender-200/30 shadow-[0_0_15px_rgba(255,216,155,0.15)]' 
             : 'shadow-golden-100/50'
        }`}>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
           <Activity className="w-5 h-5 text-golden-500" />
           Ratio Analysis (Product Capacity)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {Object.keys(PACKAGE_GROUPS).map(groupName => {
              const stat = ratioStats[groupName];
              if (!stat || stat.used === 0) return null;

              return (
                 <div key={groupName} className="bg-peach-50/50 dark:bg-slate-700/30 p-5 rounded-2xl border border-peach-200/50 dark:border-slate-600 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{groupName}</h4>
                      <div className="flex items-baseline gap-1 mt-1">
                         <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.maxCapacity.toLocaleString()}</span>
                         <span className="text-xs font-bold text-slate-400">units capacity</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-600">
                       <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Packages Used</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{stat.used.toLocaleString()}</span>
                       </div>
                       <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full mt-2">
                          <div className="bg-golden-400 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                       </div>
                       <p className="mt-2 text-[10px] text-slate-400 italic text-right">
                          Based on defined package ratios
                       </p>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
