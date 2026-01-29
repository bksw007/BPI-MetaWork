import React, { useState, useEffect, useMemo } from 'react';
import UnifiedNavbar from '../components/UnifiedNavbar';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToJobCards } from '../services/jobCardService';
import { JobCard } from '../types/jobCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  FileText, Calendar, Download, TrendingUp, CheckCircle, Clock, 
  Filter, ChevronLeft, ChevronRight, PieChart, KanbanSquare, CalendarRange 
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ActivityReportPage: React.FC = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<JobCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date()); // For month filter

    useEffect(() => {
        const unsubscribe = subscribeToJobCards(
            (data) => {
                setJobs(data);
                setIsLoading(false);
            },
            (err) => console.error(err)
        );
        return () => unsubscribe();
    }, []);

    // --- FILTER LOGIC ---
    const filteredJobs = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        
        return jobs.filter(job => {
            // Filter by Completed Date (if available) or Updated At if status is Complete
            // Fallback to DueDate if neither (for projection)
            const refDate = job.status === 'Complete' || job.status === 'Report' 
                ? new Date(job.updatedAt) 
                : new Date(job.dueDate);
            
            return refDate >= startOfMonth && refDate <= endOfMonth;
        });
    }, [jobs, currentDate]);

    // --- STATS ---
    const stats = useMemo(() => {
        const completed = filteredJobs.filter(j => j.status === 'Complete' || j.status === 'Report').length;
        const total = filteredJobs.length;
        const onTime = filteredJobs.filter(j => {
             if (j.status !== 'Complete' && j.status !== 'Report') return false;
             // Simple check: Completed At (updatedAt) <= DueDate
             return new Date(j.updatedAt) <= new Date(j.dueDate);
        }).length;
        
        return {
            total,
            completed,
            pending: total - completed,
            onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 100
        };
    }, [filteredJobs]);

    // --- EXPORT ---
    const handleExport = () => {
        const data = filteredJobs.map(j => ({
            'ID': j.id,
            'Customer': j.customer,
            'Product': j.product,
            'Quantity': j.jobQty,
            'Status': j.status,
            'Start Date': new Date(j.startDate).toLocaleDateString(),
            'Due Date': new Date(j.dueDate).toLocaleDateString(),
            'Assignees': j.assignees.join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Activity Report");
        XLSX.writeFile(wb, `Activity_Report_${currentDate.toISOString().slice(0,7)}.xlsx`);
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-kanban overflow-hidden font-prompt">
            <UnifiedNavbar>
                <div className="flex items-center gap-1 mr-4">
                    <a href="/kanban" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-900 hover:text-orange-500 hover:bg-orange-50">
                        <KanbanSquare className="w-4 h-4" />
                        Kanban
                    </a>
                     {/* For Timeline, we just link to SmartBoard for now, unless we implement query param routing */}
                    <a href="/kanban?view=gantt" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-900 hover:text-orange-500 hover:bg-orange-50">
                        <CalendarRange className="w-4 h-4" />
                        Timeline
                    </a>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all bg-orange-50 text-orange-500">
                        <PieChart className="w-4 h-4" />
                        Report
                    </div>
                </div>
            </UnifiedNavbar>

            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* Header & Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">Monthly Performance</h1>
                            <p className="text-slate-500 mt-1">Overview of job completion and efficiency.</p>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white/50 transition-all hover:shadow-md hover:bg-white/50">
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="p-2 hover:bg-white/50 rounded-xl text-slate-500 hover:text-slate-700 transition-all active:scale-95"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center min-w-[140px]">
                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</span>
                                <span className="block text-base font-bold text-slate-800 leading-none mt-0.5">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="p-2 hover:bg-white/50 rounded-xl text-slate-500 hover:text-slate-700 transition-all active:scale-95"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-teal-200/50 hover:shadow-teal-300/50 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <Download size={18} /> Export Excel
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatsCard 
                            title="Total Jobs" 
                            value={stats.total} 
                            icon={<FileText size={18}/>} 
                            color="from-blue-400 to-blue-500" 
                        />
                        <StatsCard 
                            title="Completed" 
                            value={stats.completed} 
                            icon={<CheckCircle size={18}/>} 
                            color="from-green-400 to-green-500" 
                        />
                        <StatsCard 
                            title="Pending" 
                            value={stats.pending} 
                            icon={<Clock size={18}/>} 
                            color="from-orange-400 to-orange-500" 
                        />
                        <StatsCard 
                            title="On-Time Rate" 
                            value={`${stats.onTimeRate}%`} 
                            icon={<TrendingUp size={18}/>} 
                            color="from-purple-400 to-purple-500" 
                        />
                    </div>

                    {/* Charts Section */}
                    {/* Placeholder for now - can be expanded */}
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart className="text-slate-400" size={20} width={20} height={20}/> Daily Job Completion
                        </h3>
                        <div className="h-[300px] w-full flex items-center justify-center bg-white/30 rounded-2xl border-2 border-dashed border-slate-200/50 text-slate-400 font-semibold group hover:border-blue-300/50 transition-colors">
                            <span className="group-hover:scale-105 transition-transform duration-300">Chart Visualization Coming Soon</span>
                        </div>
                    </div>

                    {/* Detailed List */}
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm border border-white/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <div className="p-6 border-b border-white/20 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Job Detail List</h3>
                            <span className="text-xs font-semibold bg-white/50 text-slate-600 px-3 py-1 rounded-full border border-white/50 shadow-sm">
                                {filteredJobs.length} records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/50 text-slate-500 font-semibold uppercase text-xs border-b border-white/30">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-2xl">Job ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4 text-center">Qty</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right rounded-tr-2xl">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20">
                                    {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-white/60 transition-colors border-b border-white/20 last:border-0 group cursor-default">
                                            <td className="px-6 py-3.5 font-mono text-slate-500 group-hover:text-blue-600 transition-colors">#{job.id.slice(-6)}</td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-700">{job.customer}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{job.product}</td>
                                            <td className="px-6 py-3.5 text-center font-bold text-slate-800">{job.jobQty}</td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold shadow-sm ${
                                                    job.status === 'Complete' ? 'bg-green-100/80 text-green-700 border border-green-200' :
                                                    job.status === 'Report' ? 'bg-purple-100/80 text-purple-700 border border-purple-200' :
                                                    'bg-slate-100/80 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-mono text-slate-500">
                                                {new Date(job.dueDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                                                No jobs found for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white/40 backdrop-blur-md px-5 py-4 rounded-2xl shadow-sm border border-white/50 flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${color} text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
);

export default ActivityReportPage;
