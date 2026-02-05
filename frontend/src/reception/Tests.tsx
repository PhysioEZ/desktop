import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, ChevronLeft, ChevronRight,
    LayoutGrid, Calendar, Phone, Users, Banknote,
    MessageSquare, PieChart, LifeBuoy,
    Moon, Sun, MessageCircle, LogOut, User,
    RefreshCw,
    Bell,
    CheckCircle2,
    TestTube2,
    FileText,
    AlertCircle,
    Eye,
    Receipt,
    XCircle,
    TrendingUp,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from '../config';
import { toast } from 'sonner';
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from '../components/Sidebar';

interface TestRecord {
    uid: string;
    patient_name: string;
    test_name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'Paid' | 'Partial' | 'Unpaid';
    test_status: 'Completed' | 'Pending' | 'Cancelled';
}

interface Notification {
    notification_id: number;
    message: string;
    link_url: string | null;
    is_read: number;
    created_at: string;
    time_ago: string;
}

const Tests = () => {
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

    // State
    const [stats] = useState({
        total: 310,
        completed: 309,
        pending: 1
    });
    const [records] = useState<TestRecord[]>([
        { uid: '26020507', patient_name: 'MD SAMIM', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26020506', patient_name: 'MD MOHBASIR', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26020505', patient_name: 'SHASHIDHAR SINGH', test_name: 'EEG', total_amount: 2500, paid_amount: 1600, due_amount: 900, payment_status: 'Partial', test_status: 'Completed' },
        { uid: '26020504', patient_name: 'GYANDEEAP', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26020503', patient_name: 'SINTU KUMAR', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' }
    ]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [testFilter, setTestFilter] = useState('All Tests');

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const notifRef = useRef<HTMLButtonElement>(null);

    const fetchData = async () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
            );
            const data = await res.json();
            if (data.success || data.status === "success") {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error(err);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        console.log("Tests component mounted");
        if (user?.employee_id) {
            fetchNotifs();
            const inv = setInterval(fetchNotifs, 30000);
            return () => clearInterval(inv);
        }
    }, [fetchNotifs, user?.employee_id]);

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}>

            <Sidebar />

            {/* === LEFT PANEL (STATS) === */}
            <div className={`hidden xl:flex w-[450px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"}`}>

                <div className="space-y-12 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 ${isDark ? "bg-[#1C1C1C]" : "bg-blue-50"}`}>
                            <TestTube2 size={22} />
                        </div>
                        <span className="font-semibold tracking-[0.2em] text-[10px] uppercase text-slate-500">PhysioEZ Diagnostics</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                            Lab <br />
                            <span className={`italic ${isDark ? "text-blue-400" : "text-blue-600"}`}>Records</span>
                        </h1>
                        <p className="text-slate-500 text-base leading-relaxed max-w-xs">
                            Monitor diagnostic orders, payment statuses and test results.
                        </p>
                    </div>
                </div>

                {/* Vertical Stats Stack */}
                <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">

                    {/* Stat 1: Total Tests */}
                    <div className={`p-8 rounded-[32px] border transition-all duration-300 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-blue-100 shadow-sm"}`}>
                        <div className="flex items-center gap-3 opacity-60 mb-4 text-blue-500">
                            <Receipt size={20} strokeWidth={2} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                        </div>
                        <div>
                            <div className={`text-5xl font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                                {stats.total}
                            </div>
                        </div>
                    </div>

                    {/* Stat 2: Breakdown */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 opacity-40 px-2 group">
                            <TrendingUp size={14} className="group-hover:translate-y-[-2px] transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live Insights</span>
                        </div>
                        <div className={`p-8 rounded-[32px] border flex flex-col gap-6 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
                            <div className="flex justify-between items-center border-b pb-6 border-dashed border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-3xl font-medium text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">Tests Completed</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                    <CheckCircle2 size={22} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-3xl font-medium text-amber-500">{stats.pending}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">Awaiting Result</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                    <Clock size={22} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-blue-500/[0.02] to-transparent pointer-events-none" />
            </div>

            {/* === MAIN CONTENT (Right Panel) === */}
            <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-8 lg:p-12 gap-8">

                {/* Global Header */}
                <div className="flex justify-between items-end shrink-0">
                    <div>
                        <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Test Portal</h2>
                        <p className="text-slate-500 text-base mt-1">Manage diagnostic requests & billings</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchData} className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${loading ? "animate-spin" : ""}`}>
                            <RefreshCw size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col shadow-sm transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60"}`}>

                    {/* Toolbar Row */}
                    <div className={`flex flex-col xl:flex-row items-center justify-between gap-6 p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                        <div className="flex items-center gap-4 w-full xl:w-auto">
                            {/* Search */}
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border flex-1 xl:w-80 transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-blue-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-blue-500/30 shadow-inner focus-within:shadow-sm"}`}>
                                <Search size={18} className="opacity-30" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by ID or Patient Name..."
                                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                                />
                            </div>

                            <select
                                value={testFilter}
                                onChange={(e) => setTestFilter(e.target.value)}
                                className={`appearance-none px-6 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] outline-none cursor-pointer ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-50 border-slate-100"}`}
                            >
                                <option>All Tests</option>
                                <option>EEG</option>
                                <option>NCV</option>
                                <option>EMG</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                Create New Test Order
                            </button>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className={`flex items-center px-10 py-5 border-b text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 ${isDark ? "bg-white/[0.02]" : "bg-slate-50/50"}`}>
                        <div className="w-[10%]">UID</div>
                        <div className="flex-1">Patient Info</div>
                        <div className="w-[15%]">Amount</div>
                        <div className="w-[15%] text-center">Payment</div>
                        <div className="w-[15%] text-center">Status</div>
                        <div className="w-[12%] text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                                <RefreshCw size={32} className="animate-spin" />
                                <p className="text-xs font-bold uppercase tracking-widest">Updating data...</p>
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-white/5 divide-slate-100">
                                {records.map((row) => (
                                    <div key={row.uid} className="flex items-center px-10 py-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer">
                                        <div className="w-[10%] font-mono text-xs opacity-40 font-bold uppercase tracking-widest">
                                            #{row.uid}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors uppercase tracking-wide">
                                                {row.patient_name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                Test: {row.test_name}
                                            </div>
                                        </div>
                                        <div className="w-[15%]">
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">₹{row.total_amount}</div>
                                            {row.due_amount > 0 && <div className="text-[10px] font-bold text-rose-500 uppercase">Due: ₹{row.due_amount}</div>}
                                        </div>
                                        <div className="w-[15%] flex justify-center">
                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${row.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                                row.payment_status === 'Partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {row.payment_status}
                                            </span>
                                        </div>
                                        <div className="w-[15%] flex justify-center">
                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${row.test_status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                                row.test_status === 'Pending' ? 'bg-blue-500/10 text-blue-500 border-blue-500/10' : 'bg-slate-500/10 text-slate-500 border-slate-500/10'
                                                }`}>
                                                {row.test_status}
                                            </span>
                                        </div>
                                        <div className="w-[12%] text-right">
                                            <button className="px-5 py-2.5 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95 shadow-lg shadow-blue-500/10">
                                                View Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Table Footer */}
                    <div className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                        <div className="text-sm font-medium text-slate-500">
                            Showing <span className="text-slate-900 dark:text-white font-bold">{records.length}</span> lab records
                        </div>
                        <div className="flex items-center gap-3">
                            <button disabled className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all opacity-30 cursor-not-allowed ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}>
                                <ChevronLeft size={20} />
                            </button>
                            <button disabled className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all opacity-30 cursor-not-allowed ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Tests;
