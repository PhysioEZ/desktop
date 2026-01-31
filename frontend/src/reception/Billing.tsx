import { useState, useEffect } from 'react';
import { 
    Search, ChevronLeft, ChevronRight, 
    FileText, IndianRupee, AlertCircle, CheckCircle2,
    Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { API_BASE_URL, authFetch } from '../config';
import { toast } from 'sonner';
import PatientDetailsModal from '../components/patients/PatientDetailsModal';
import { usePatientStore } from '../store/usePatientStore';

interface BillingStat {
    label: string;
    value: number;
    subLabel?: string;
    icon: any;
    color: string;
    bg: string;
}

interface BillingRecord {
    patient_id: number;
    patient_name: string;
    phone_number: string;
    total_amount: string;
    total_paid: string;
    due_amount: number;
    status: string;
    has_payment_today: number;
    created_at: string;
    branch_id: number;
}

const Billing = () => {
    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [stats, setStats] = useState({
        today_collection: 0,
        range_billed: 0,
        range_paid: 0,
        range_due: 0
    });
    const [records, setRecords] = useState<BillingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showOnlyToday, setShowOnlyToday] = useState(false);
    
    // Using Patient Store for Details Modal
    const { openPatientDetails } = usePatientStore();

    // Data Fetching
    const fetchData = async () => {
        setLoading(true);
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        try {
            const res = await authFetch(`${API_BASE_URL}/reception/billing`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'fetch_overview',
                    startDate: start,
                    endDate: end,
                    search,
                    status: statusFilter,
                    paymentFilter: showOnlyToday ? 'today' : 'all'
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setStats(json.data.stats);
                setRecords(json.data.records);
            } else {
                toast.error(json.message || 'Failed to fetch billing data');
            }
        } catch (e) {
            console.error(e);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentMonth, search, statusFilter, showOnlyToday]);

    // Format Currency
    const formatCurrency = (val: number | string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    // Card Component
    const CheckStatCard = ({ stat }: { stat: BillingStat }) => (
        <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-[#1a1c1e] p-6 rounded-[24px] border border-[#e0e2ec] dark:border-[#43474e] shadow-sm relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                <stat.icon size={64} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wide">
                        {stat.label}
                    </span>
                </div>
                <h3 className="text-3xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight">
                    {formatCurrency(stat.value)}
                </h3>
                {stat.subLabel && (
                    <p className="text-xs font-medium text-[#43474e] dark:text-[#c4c7c5] mt-1 opacity-80">
                        {stat.subLabel}
                    </p>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight">
                        Billing Overview
                    </h1>
                    <p className="text-sm text-[#43474e] dark:text-[#c4c7c5] mt-1 font-medium">
                        Financial tracking for {format(currentMonth, 'MMMM yyyy')}
                    </p>
                </div>
                
                {/* Month Navigation */}
                <div className="flex items-center bg-white dark:bg-[#1a1c1e] rounded-full shadow-sm border border-[#e0e2ec] dark:border-[#43474e] p-1">
                    <button 
                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                        className="p-2 hover:bg-[#f0f4f9] dark:hover:bg-[#1e1f20] rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} className="text-[#43474e] dark:text-[#c4c7c5]" />
                    </button>
                    <div className="px-6 font-bold text-[#1a1c1e] dark:text-[#e3e2e6] min-w-[140px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </div>
                    <button 
                         onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                         disabled={currentMonth >= startOfMonth(new Date())}
                         className="p-2 hover:bg-[#f0f4f9] dark:hover:bg-[#1e1f20] rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight size={20} className="text-[#43474e] dark:text-[#c4c7c5]" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <CheckStatCard stat={{
                    label: "Today's Collection",
                    value: stats.today_collection,
                    icon: IndianRupee,
                    color: "text-emerald-600 dark:text-emerald-400",
                    bg: "bg-emerald-100 dark:bg-emerald-900/30",
                    subLabel: "Cash received today"
                }} />
                <CheckStatCard stat={{
                    label: "Total Billed",
                    value: stats.range_billed,
                    icon: FileText,
                    color: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-100 dark:bg-blue-900/30",
                    subLabel: `Generated in ${format(currentMonth, 'MMM')}`
                }} />
                 <CheckStatCard stat={{
                    label: "Total Paid",
                    value: stats.range_paid,
                    icon: CheckCircle2,
                    color: "text-violet-600 dark:text-violet-400",
                    bg: "bg-violet-100 dark:bg-violet-900/30",
                    subLabel: `Collected for ${format(currentMonth, 'MMM')} patients`
                }} />
                 <CheckStatCard stat={{
                    label: "Outstanding Due",
                    value: stats.range_due,
                    icon: AlertCircle,
                    color: "text-red-600 dark:text-red-400",
                    bg: "bg-red-100 dark:bg-red-900/30",
                    subLabel: `Pending for ${format(currentMonth, 'MMM')} patients`
                }} />
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-[#1a1c1e] rounded-[32px] border border-[#e0e2ec] dark:border-[#43474e] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Toolbar */}
                <div className="p-6 border-b border-[#e0e2ec] dark:border-[#43474e] flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#43474e] dark:text-[#c4c7c5]" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search patients by name, ID or phone..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#006e1c] dark:focus:ring-[#88d99d] transition-all text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e]/60"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => setShowOnlyToday(!showOnlyToday)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${
                                showOnlyToday 
                                ? 'bg-[#ccebc4] dark:bg-[#005313] text-[#002105] dark:text-[#ccebc4] border-transparent' 
                                : 'bg-transparent border-[#74777f] text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#f0f4f9] dark:hover:bg-[#1e1f20]'
                            }`}
                        >
                            <IndianRupee size={16} />
                            Paid Today
                        </button>

                         <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1c1e] border border-[#74777f] text-[#43474e] dark:text-[#c4c7c5] font-bold text-sm outline-none focus:ring-2 focus:ring-[#006e1c]"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f0f4f9] dark:bg-[#1e1f20] sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-right">Total Bill</th>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-right">Paid</th>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-right">Due</th>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e0e2ec] dark:divide-[#43474e]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20">
                                        <div className="flex items-center justify-center gap-2 text-[#43474e] dark:text-[#c4c7c5]">
                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0s' }} />
                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-[#43474e] dark:text-[#c4c7c5]">
                                        No billing records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                records.map((row) => {
                                    const bill = parseFloat(row.total_amount);
                                    const paid = parseFloat(row.total_paid);
                                    const due = bill - paid;
                                    
                                    return (
                                        <tr 
                                            key={row.patient_id} 
                                            className="hover:bg-[#f0f4f9]/50 dark:hover:bg-[#1e1f20]/50 transition-colors group cursor-pointer"
                                            onClick={() => openPatientDetails(row as any)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{row.patient_name}</span>
                                                    <span className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium">#{row.patient_id} • {row.phone_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-[#1a1c1e] dark:text-[#e3e2e6]">
                                                {formatCurrency(bill)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(paid)}
                                                {row.has_payment_today > 0 && (
                                                    <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                                                        <CheckCircle2 size={10} /> Paid Today
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {due > 0 ? (
                                                     <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(due)}</span>
                                                ) : (
                                                    <span className="text-[#43474e] dark:text-[#c4c7c5] opacity-50 font-bold">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${row.status === 'active' ? 'bg-[#ccebc4] dark:bg-[#005313] text-[#002105] dark:text-[#ccebc4]' : 
                                                      row.status === 'completed' ? 'bg-[#d0bcff] dark:bg-[#4f378b] text-[#1d192b] dark:text-[#eaddff]' : 
                                                      'bg-[#e2e2e6] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#c4c7c5]'
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-[#d0bcff]/20 rounded-full text-[#6750a4] dark:text-[#d0bcff] transition-colors">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PatientDetailsModal />
        </div>
    );
};

export default Billing;
