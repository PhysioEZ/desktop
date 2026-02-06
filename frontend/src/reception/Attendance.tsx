import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, ChevronLeft, ChevronRight,
    LayoutGrid, Calendar, Phone, Users, Banknote,
    MessageSquare, PieChart, LifeBuoy,
    Moon, Sun, MessageCircle, LogOut, User,
    RefreshCw,
    Bell,
    CheckCircle2,
    CalendarRange,
    TestTube2,
    FileText,
    History,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from '../config';
import { toast } from 'sonner';
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from '../components/Sidebar';

interface AttendanceRecord {
    id: number;
    patient_name: string;
    treatment: string;
    progress_current: number;
    progress_total: number;
    status: 'Present' | 'Absent' | 'Pending';
}

interface Notification {
    notification_id: number;
    message: string;
    link_url: string | null;
    is_read: number;
    created_at: string;
    time_ago: string;
}

const Attendance = () => {
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

    // State
    const [currentDate] = useState(new Date());
    const [stats] = useState({
        total: 99,
        present: 15,
        pending: 84
    });
    const [records] = useState<AttendanceRecord[]>([
        { id: 455, patient_name: 'Aayat', treatment: 'Daily', progress_current: 2, progress_total: 15, status: 'Absent' },
        { id: 433, patient_name: 'Abdhes sahu', treatment: 'Daily', progress_current: 8, progress_total: 8, status: 'Absent' },
        { id: 443, patient_name: 'Abha singh', treatment: 'Daily', progress_current: 15, progress_total: 15, status: 'Absent' },
        { id: 413, patient_name: 'Abhishek kumar', treatment: 'Daily', progress_current: 13, progress_total: 15, status: 'Absent' },
        { id: 419, patient_name: 'Abhishek Nathani', treatment: 'Daily', progress_current: 10, progress_total: 10, status: 'Absent' }
    ]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Present'>('All');
    const [treatmentFilter, setTreatmentFilter] = useState('All Treatments');

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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 ${isDark ? "bg-[#1C1C1C]" : "bg-emerald-50"}`}>
                            <Users size={22} />
                        </div>
                        <span className="font-semibold tracking-[0.2em] text-[10px] uppercase text-slate-500">PhysioEZ Core</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                            Daily <br />
                            <span className={`italic ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Attendance</span>
                        </h1>
                        <p className="text-slate-500 text-base leading-relaxed max-w-xs">
                            Track patient visits and treatment progress for {format(currentDate, 'dd MMMM yyyy')}.
                        </p>
                    </div>
                </div>

                {/* Vertical Stats Stack */}
                <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">

                    {/* Stat 1: Total Patients */}
                    <div className={`p-8 rounded-[32px] border transition-all duration-300 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-blue-100 shadow-sm"}`}>
                        <div className="flex items-center gap-3 opacity-60 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Users size={20} strokeWidth={2} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Patients</span>
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
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Check-in Status</span>
                        </div>
                        <div className={`p-8 rounded-[32px] border flex flex-col gap-6 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
                            <div className="flex justify-between items-center border-b pb-6 border-dashed border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-3xl font-medium text-emerald-600 dark:text-emerald-400">{stats.present}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">Checked In</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                    <CheckCircle2 size={22} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-3xl font-medium text-rose-500">{stats.pending}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">Pending Arrival</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                                    <History size={22} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
            </div>

            {/* === MAIN CONTENT (Right Panel) === */}
            <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-8 lg:p-12 gap-8">

                {/* Global Header */}
                <div className="flex justify-between items-end shrink-0">
                    <div>
                        <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Attendance Tracker</h2>
                        <p className="text-slate-500 text-base mt-1">Monitor daily clinical attendance</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchData} className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${loading ? "animate-spin" : ""}`}>
                            <RefreshCw size={20} className="text-slate-500" />
                        </button>
                        <div className="relative">
                            <button ref={notifRef} onClick={() => setShowNotifPopup(!showNotifPopup)} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all hover:scale-105 ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} relative text-slate-500`}>
                                <Bell size={20} strokeWidth={2} />
                                {unreadCount > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col shadow-sm transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60"}`}>

                    {/* Toolbar Row */}
                    <div className={`flex flex-col xl:flex-row items-center justify-between gap-6 p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                        <div className="flex items-center gap-4 w-full xl:w-auto">
                            {/* Filter Switcher */}
                            <div className={`flex p-1 rounded-2xl border ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-100 border-slate-200"}`}>
                                <button
                                    onClick={() => setFilter('All')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'All'
                                        ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('Present')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'Present'
                                        ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    Present
                                </button>
                            </div>

                            {/* Search */}
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border flex-1 xl:w-72 transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-emerald-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-emerald-500/30 shadow-inner focus-within:shadow-sm"}`}>
                                <Search size={18} className="opacity-30" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search patient..."
                                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Treatment Filter */}
                            <select
                                value={treatmentFilter}
                                onChange={(e) => setTreatmentFilter(e.target.value)}
                                className={`appearance-none px-6 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] outline-none cursor-pointer ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-50 border-slate-100"}`}
                            >
                                <option>All Treatments</option>
                                <option>Physiotherapy</option>
                                <option>Rehabilitation</option>
                            </select>

                            {/* Date Display */}
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
                                <Calendar size={16} className="text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-widest">{format(currentDate, 'dd MMM yyyy')}</span>
                                <CalendarRange size={16} className="opacity-20 cursor-pointer hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className={`flex items-center px-10 py-5 border-b text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 ${isDark ? "bg-white/[0.02]" : "bg-slate-50/50"}`}>
                        <div className="w-[10%]">Track ID</div>
                        <div className="flex-1">Patient</div>
                        <div className="w-[15%]">Treatment</div>
                        <div className="w-[20%]">Progress</div>
                        <div className="w-[15%] text-center">Status</div>
                        <div className="w-[12%] text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                                <RefreshCw size={32} className="animate-spin" />
                                <p className="text-xs font-bold uppercase tracking-widest">Loading attendance...</p>
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-white/5 divide-slate-100">
                                {records.map((row) => {
                                    const progressPercent = (row.progress_current / row.progress_total) * 100;
                                    return (
                                        <div key={row.id} className="flex items-center px-10 py-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer">
                                            <div className="w-[10%] font-mono text-xs opacity-40 font-bold uppercase tracking-widest">
                                                #{row.id.toString().padStart(3, '0')}
                                            </div>
                                            <div className="flex-1 font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors uppercase tracking-wide">
                                                {row.patient_name}
                                            </div>
                                            <div className="w-[15%] text-xs font-bold uppercase tracking-widest text-blue-500">
                                                {row.treatment}
                                            </div>
                                            <div className="w-[20%] flex items-center gap-4">
                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold opacity-40 whitespace-nowrap">{row.progress_current}/{row.progress_total}</span>
                                            </div>
                                            <div className="w-[15%] flex justify-center">
                                                <span className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${row.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                                    {row.status}
                                                </span>
                                            </div>
                                            <div className="w-[12%] text-right">
                                                <button className="px-5 py-2.5 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95 shadow-lg shadow-emerald-500/10">
                                                    Check History
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Table Footer */}
                    <div className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                        <div className="text-sm font-medium text-slate-500">
                            Showing <span className="text-slate-900 dark:text-white font-bold">{records.length}</span> patient entries
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

export default Attendance;
