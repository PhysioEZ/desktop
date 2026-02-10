import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, ChevronLeft, ChevronRight,
    Users,
    RefreshCw,
    Bell,
    CheckCircle2,
    History,
    TrendingUp,
    X, // Add X icon for the close button
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { API_BASE_URL, authFetch } from '../config';
import { toast } from 'sonner';
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from '../components/Sidebar';
import DatePicker from '../components/ui/DatePicker';

interface AttendanceRecord {
    id: number;
    patient_name: string;
    treatment: string;
    progress_current: number;
    progress_total: number;
    status: 'Present' | 'Absent' | 'Pending';
}
interface AttendanceHistory {
    success: boolean;
    patient: {
        id: number;
        name: string;
        total_days: number;
        present_days: number;
        remaining_days: number;
    };
    attendance_history: {
        date: string; // e.g., "2026-02-01"
        status: 'present' | 'absent';
    }[];
}

const Attendance = () => {
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [attendanceCalendarMonth, setAttendanceCalendarMonth] = useState(new Date()); // State for calendar navigation
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        pending: 0
    });
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Present'>('All');
    const [treatmentFilter, setTreatmentFilter] = useState('All Treatments');

    // New state for attendance history side panel
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [selectedPatientHistory, setSelectedPatientHistory] = useState<AttendanceHistory | null>(null);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<Date | null>(null);
    const [selectedDateHistory, setSelectedDateHistory] = useState<AttendanceHistory['attendance_history']>([]);
    const [dateHistoryLoading, setDateHistoryLoading] = useState(false);

    // Notifications
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const notifRef = useRef<HTMLButtonElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const response = await authFetch(`${API_BASE_URL}/reception/attendance_data?date=${dateStr}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.data.stats);

                // Define the API record type
                interface ApiAttendanceRecord {
                    patient_id: number;
                    patient_name: string;
                    treatment_type: string;
                    attendance_count?: number;
                    treatment_days?: number;
                    attendance_id?: number;
                    status: string;
                }

                // Transform the API data to match our interface
                const transformedRecords: AttendanceRecord[] = data.data.attendance_records.map((record: ApiAttendanceRecord) => ({
                    id: record.patient_id,
                    patient_name: record.patient_name,
                    treatment: record.treatment_type.charAt(0).toUpperCase() + record.treatment_type.slice(1),
                    progress_current: record.attendance_count || 0,
                    progress_total: record.treatment_days || 0,
                    status: record.attendance_id ? (record.status === 'present' ? 'Present' : record.status.charAt(0).toUpperCase() + record.status.slice(1)) : 'Absent'
                }));

                setRecords(transformedRecords);
            } else {
                console.error('Failed to fetch attendance data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    const fetchAttendanceHistory = async (patientId: number) => {
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/get_attendance_history?patient_id=${patientId}`);
            const data = await response.json();

            if (data.success) {
                console.log(`Attendance history for patient ${patientId}:`, data);
                toast.success(`Fetched attendance history for ${data.patient.name}`);
                setSelectedPatientHistory(data); // Store the entire response
                setShowHistoryPanel(true);      // Open the side panel
                setSelectedHistoryDate(null);
                setSelectedDateHistory([]);
            } else {
                console.error('Failed to fetch attendance history:', data.message);
                toast.error('Failed to fetch attendance history');
            }
        } catch (error) {
            console.error('Error fetching attendance history:', error);
            toast.error('Error fetching attendance history');
        }
    };

    const fetchAttendanceHistoryForDate = async (patientId: number, date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setDateHistoryLoading(true);
        try {
            const response = await authFetch(
                `${API_BASE_URL}/reception/get_attendance_history?patient_id=${patientId}&date=${dateStr}`
            );
            const data = await response.json();
            if (data.success) {
                let history = Array.isArray(data.attendance_history) ? data.attendance_history : [];
                if (history.length > 0) {
                    history = history.filter((record: AttendanceHistory['attendance_history'][number]) => record.date === dateStr);
                } else if (selectedPatientHistory?.attendance_history) {
                    history = selectedPatientHistory.attendance_history.filter((record) => record.date === dateStr);
                }
                setSelectedDateHistory(history);
            } else {
                console.error('Failed to fetch date attendance history:', data.message);
                toast.error('Failed to fetch date history');
                setSelectedDateHistory([]);
            }
        } catch (error) {
            console.error('Error fetching date attendance history:', error);
            toast.error('Error fetching date history');
            setSelectedDateHistory([]);
        } finally {
            setDateHistoryLoading(false);
        }
    };

    const handleDateChange = (newDateString: string) => {
        const newDate = new Date(newDateString);
        if (!isNaN(newDate.getTime())) {
            setCurrentDate(newDate);
        } else {
            toast.error("Invalid date format received from DatePicker.");
        }
    };

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
            );
            const data = await res.json();
            if (data.success || data.status === "success") {
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error(err);
        }
    }, [user?.employee_id]);

    const prevMonth = () => {
        setAttendanceCalendarMonth((prevMonth) => subMonths(prevMonth, 1));
    };

    const nextMonth = () => {
        setAttendanceCalendarMonth((prevMonth) => addMonths(prevMonth, 1));
    };

    const isAttendanceDay = useCallback((day: Date) => {
        if (!selectedPatientHistory || !selectedPatientHistory.attendance_history) return false;
        return selectedPatientHistory.attendance_history.some((record) =>
            isSameDay(new Date(record.date), day) && record.status === 'present'
        );
    }, [selectedPatientHistory]);

    useEffect(() => {
        if (user?.employee_id) {
            fetchData(); // Load attendance data when component mounts
            fetchNotifs();
            const inv = setInterval(fetchNotifs, 30000);
            return () => clearInterval(inv);
        }
    }, [fetchData, fetchNotifs, user?.employee_id, currentDate]);

    // Calendar days generation
    const monthStart = startOfMonth(attendanceCalendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday as start of week
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Sunday as start of week
    const days = eachDayOfInterval({ start: startDate, end: endDate });

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
                            <div
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl border cursor-pointer transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/5" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"}`}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">{format(currentDate, 'dd MMM yyyy')}</span>
                                <Calendar size={16} className="text-emerald-500" />
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
                                {(() => {
                                    // Apply filters
                                    let filteredRecords = [...records];

                                    // Apply search filter
                                    if (search) {
                                        const searchTerm = search.toLowerCase();
                                        filteredRecords = filteredRecords.filter(record =>
                                            record.patient_name.toLowerCase().includes(searchTerm) ||
                                            record.id.toString().includes(searchTerm)
                                        );
                                    }

                                    // Apply status filter
                                    if (filter === 'Present') {
                                        filteredRecords = filteredRecords.filter(record =>
                                            record.status === 'Present'
                                        );
                                    }

                                    // Apply treatment filter
                                    if (treatmentFilter !== 'All Treatments') {
                                        filteredRecords = filteredRecords.filter(record =>
                                            record.treatment.toLowerCase().includes(treatmentFilter.toLowerCase())
                                        );
                                    }

                                    return filteredRecords.map((row) => {
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
                                                    <button
                                                        onClick={() => fetchAttendanceHistory(row.id)}
                                                        className="px-5 py-2.5 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95 shadow-lg shadow-emerald-500/10"
                                                    >
                                                        Check History
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Table Footer */}
                    <div className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                        {(() => {
                            // Apply filters to get count
                            let filteredRecords = [...records];

                            // Apply search filter
                            if (search) {
                                const searchTerm = search.toLowerCase();
                                filteredRecords = filteredRecords.filter(record =>
                                    record.patient_name.toLowerCase().includes(searchTerm) ||
                                    record.id.toString().includes(searchTerm)
                                );
                            }

                            // Apply status filter
                            if (filter === 'Present') {
                                filteredRecords = filteredRecords.filter(record =>
                                    record.status === 'Present'
                                );
                            }

                            // Apply treatment filter
                            if (treatmentFilter !== 'All Treatments') {
                                filteredRecords = filteredRecords.filter(record =>
                                    record.treatment.toLowerCase().includes(treatmentFilter.toLowerCase())
                                );
                            }

                            return (
                                <div className="text-sm font-medium text-slate-500">
                                    Showing <span className="text-slate-900 dark:text-white font-bold">{filteredRecords.length}</span> patient entries
                                </div>
                            );
                        })()}
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
            {showHistoryPanel && selectedPatientHistory && (
                <AnimatePresence>
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-[100] p-8 flex flex-col transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] border-l border-[#151515]" : "bg-white border-l border-gray-200"}`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Attendance Calendar</h3>
                            <button
                                onClick={() => setShowHistoryPanel(false)}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Patient Info Card */}
                        <div className={`p-6 rounded-2xl mb-8 transition-colors duration-300 ${isDark ? "bg-[#121212] border border-white/5" : "bg-emerald-50 border border-emerald-100"}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPatientHistory.patient.name}</h4>
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium dark:bg-emerald-900/50 dark:text-emerald-300">daily</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">ID: #{selectedPatientHistory.patient.id.toString().padStart(3, '0')}</p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedPatientHistory.patient.total_days}</div>
                                    <div className="text-xs text-slate-500">TOTAL</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedPatientHistory.patient.present_days}</div>
                                    <div className="text-xs text-slate-500">PRESENT</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-rose-500">{selectedPatientHistory.patient.remaining_days}</div>
                                    <div className="text-xs text-slate-500">REMAINING</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col gap-6">
                            {/* Calendar View */}
                            <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDark ? "bg-[#121212] border border-white/5" : "bg-slate-50 border border-slate-100"}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"><ChevronLeft size={16} /></button>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{format(attendanceCalendarMonth, 'MMMM yyyy')}</span>
                                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"><ChevronRight size={16} /></button>
                                </div>

                                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500 uppercase mb-4">
                                    <span>Sun</span>
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {days.map((day, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                if (!selectedPatientHistory) return;
                                                setSelectedHistoryDate(day);
                                                fetchAttendanceHistoryForDate(selectedPatientHistory.patient.id, day);
                                            }}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer
                                                ${!isSameMonth(day, attendanceCalendarMonth) ? 'opacity-30' : ''}
                                                ${isAttendanceDay(day) ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold' : 'text-slate-500'}
                                                ${selectedHistoryDate && isSameDay(day, selectedHistoryDate) ? 'ring-2 ring-emerald-400/60' : ''}`
                                            }
                                        >
                                            {format(day, 'd')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date History */}
                            <div className={`rounded-2xl p-6 transition-colors duration-300 flex-1 overflow-y-auto ${isDark ? "bg-[#121212] border border-white/5" : "bg-white border border-slate-100"}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Date History</h4>
                                    <span className="text-xs text-slate-500">
                                        {selectedHistoryDate ? format(selectedHistoryDate, 'dd MMM yyyy') : 'Select a date'}
                                    </span>
                                </div>

                                {dateHistoryLoading ? (
                                    <div className="h-24 flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                                        Loading...
                                    </div>
                                ) : selectedHistoryDate ? (
                                    selectedDateHistory.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedDateHistory.map((record, idx) => (
                                                <div
                                                    key={`${record.date}-${idx}`}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest ${record.status === 'present'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                                                        }`}
                                                >
                                                    <span>{format(new Date(record.date), 'dd MMM yyyy')}</span>
                                                    <span>{record.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500">No records for this date.</div>
                                    )
                                ) : (
                                    <div className="text-xs text-slate-500">Click a date to view history.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
            {showDatePicker && (
                <DatePicker
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    onClose={() => setShowDatePicker(false)}
                />
            )}
        </div>
    );
};

export default Attendance;
