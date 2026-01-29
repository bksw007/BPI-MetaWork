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
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-prompt">
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
                            <h1 className="text-3xl font-black text-slate-800">Monthly Performance</h1>
                            <p className="text-slate-500 mt-1">Overview of job completion and efficiency.</p>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center min-w-[140px]">
                                <span className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Month</span>
                                <span className="block text-lg font-black text-slate-800 leading-none">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-600 transition-all active:scale-95"
                        >
                            <Download size={18} /> Export Excel
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatsCard 
                            title="Total Jobs" 
                            value={stats.total} 
                            icon={<FileText size={20}/>} 
                            color="bg-blue-500" 
                        />
                        <StatsCard 
                            title="Completed" 
                            value={stats.completed} 
                            icon={<CheckCircle size={20}/>} 
                            color="bg-green-500" 
                        />
                        <StatsCard 
                            title="Pending" 
                            value={stats.pending} 
                            icon={<Clock size={20}/>} 
                            color="bg-orange-400" 
                        />
                        <StatsCard 
                            title="On-Time Rate" 
                            value={`${stats.onTimeRate}%`} 
                            icon={<TrendingUp size={20}/>} 
                            color="bg-purple-500" 
                        />
                    </div>

                    {/* Charts Section */}
                    {/* Placeholder for now - can be expanded */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart className="text-slate-400" size={20} width={20} height={20}/> Daily Job Completion
                        </h3>
                        <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                            Chart Visualization Coming Soon
                        </div>
                    </div>

                    {/* Detailed List */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Job Detail List</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                                {filteredJobs.length} records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-2xl">Job ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4 text-center">Qty</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right rounded-tr-2xl">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-400">#{job.id.slice(-6)}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{job.customer}</td>
                                            <td className="px-6 py-4 text-slate-600">{job.product}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">{job.jobQty}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${
                                                    job.status === 'Complete' ? 'bg-green-100 text-green-600' :
                                                    job.status === 'Report' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                {new Date(job.dueDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
        <div className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
    </div>
);

export default ActivityReportPage;
