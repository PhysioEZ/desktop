import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL, authFetch } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    format, startOfWeek, endOfWeek, eachDayOfInterval, 
    addWeeks, subWeeks, isToday, parse
} from 'date-fns';
import { 
    ChevronLeft, ChevronRight, Clock, X, Loader2, GripVertical, CheckCircle2, AlertCircle, RefreshCw, 
    Search, Bell, Moon, Sun, User, LogOut
} from 'lucide-react';
import { InlineDatePicker } from '../components/SharedPickers';
import KeyboardShortcuts, { type ShortcutItem } from '../components/KeyboardShortcuts';
import LogoutConfirmation from '../components/LogoutConfirmation';
import GlobalSearch from '../components/GlobalSearch';
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    type DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
interface Appointment {
    registration_id: string;
    patient_name: string;
    appointment_date: string; // YYYY-MM-DD
    appointment_time: string; // HH:MM:SS
    status: string;
    patient_uid: string | null;
}

interface Slot {
    time: string; // HH:MM
    label: string; // hh:mm AM/PM
    isBooked: boolean;
}

interface Notification {
    notification_id: number; message: string; link_url: string | null; is_read: number; created_at: string; time_ago: string;
}

interface PatientSearch {
    patient_id: number; patient_name: string; patient_uid: string | null; age: string; gender: string; phone_number: string; status: string;
}

// --- Animation ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// --- DND Components ---

const DraggableAppointment = ({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `appointment-${appointment.registration_id}`,
        data: { appointment }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : 1
    };

    const getStatusColors = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'consulted' || s === 'completed') return 'bg-[#ccebc4] text-[#0c200e] border-[#ccebc4]';
        if (s === 'pending') return 'bg-[#ffdad6] text-[#410002] border-[#ffdad6]';
        return 'bg-[#d0e4ff] text-[#001d36] border-[#d0e4ff]';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`group relative flex flex-col gap-1 p-3 rounded-[16px] shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-1 select-none border-l-4 ${getStatusColors(appointment.status)} ${isDragging ? 'opacity-50 scale-95' : 'bg-[#fdfcff] dark:bg-[#1a1c1e] border-[#e0e2ec] dark:border-[#43474e]'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-tight tracking-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
                        {appointment.patient_name}
                    </p>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                        {appointment.patient_uid || `#${appointment.registration_id}`}
                    </p>
                </div>
                <div {...listeners} className="p-1 opacity-30 group-hover:opacity-100 transition-opacity shrink-0">
                    <GripVertical size={14} />
                </div>
            </div>
            {/* Status Pill */}
             <div className="flex items-center gap-1 mt-1">
                 <div className={`w-2 h-2 rounded-full ${appointment.status === 'completed' ? 'bg-green-500' : appointment.status === 'pending' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                 <span className="text-[10px] font-medium opacity-60 uppercase text-[#1a1c1e] dark:text-[#e3e2e6]">{appointment.status}</span>
             </div>
        </div>
    );
};

const DroppableSlot = ({ id, day, time, children }: { id: string; day: Date; time: string; children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({ id, data: { day, time } });
    const isTodaySlot = isToday(day);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[100px] p-2 border-b border-r border-[#e0e2ec] dark:border-[#43474e] transition-colors ${
                isOver ? 'bg-[#ccebc4]/30 dark:bg-[#0c3b10]/30' : isTodaySlot ? 'bg-[#f0f4f8] dark:bg-[#1e1e1e]' : 'bg-[#fdfcff] dark:bg-[#111315]'
            }`}
        >
            {children}
        </div>
    );
};

// --- Main Component ---
const Schedule = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Header & Theme
    const [isDark, setIsDark] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PatientSearch[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    // Global Components State
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const notifRef = useRef<HTMLButtonElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // DND Sensors
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Date Logic
    const weekStartDate = startOfWeek(currentDate);
    const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStartDate, end: weekEnd });
    const timeSlots = Array.from({ length: 20 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = format(parse(time, 'HH:mm', new Date()), 'hh:mm a');
        return { time, label };
    });

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) { document.documentElement.classList.add('dark'); setIsDark(true); }
        else { document.documentElement.classList.remove('dark'); setIsDark(false); }
    }, []);

    const toggleTheme = () => {
        if (isDark) { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); setIsDark(false); }
        else { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); setIsDark(true); }
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node) && !(e.target as Element).closest('#notif-popup')) setShowNotifPopup(false);
        if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfilePopup(false);
    };
    useEffect(() => { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

    // Fetch Schedule
    const fetchSchedule = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/schedule.php?action=fetch&week_start=${weekStartStr}&branch_id=${user.branch_id}&employee_id=${user.employee_id}`);
            const data = await res.json();
            if (data.success) setAppointments(data.appointments);
        } catch (e) { showToast('Failed to load schedule', 'error'); } 
        finally { setIsLoading(false); }
    }, [user?.branch_id, user?.employee_id, weekStartStr]);

    useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/notifications.php?employee_id=${user?.employee_id || ''}`);
                const data = await res.json();
                if (data.success || data.status === 'success') { setNotifications(data.notifications || []); setUnreadCount(data.unread_count || 0); }
            } catch (err) { console.error(err); }
        };
        if(user?.employee_id) { fetchNotifs(); const inv = setInterval(fetchNotifs, 30000); return () => clearInterval(inv); }
    }, [user?.employee_id]);

    // Search Logic
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!user?.branch_id || searchQuery.length < 2) { setSearchResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/search_patients.php?branch_id=${user.branch_id}&q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success) { setSearchResults(data.patients || []); }
            } catch (err) { console.error(err); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, user?.branch_id]);
    
    // --- Shortcuts ---
    const shortcuts: ShortcutItem[] = [
        // General
        { keys: ['Alt', '/'], description: 'Keyboard Shortcuts', group: 'General', action: () => setShowShortcuts(prev => !prev) },
        { keys: ['Alt', 'S'], description: 'Global Search', group: 'General', action: () => setShowGlobalSearch(true) },
        { keys: ['Alt', 'W'], description: 'Toggle Theme', group: 'General', action: toggleTheme },
        { keys: ['Alt', 'N'], description: 'Notifications', group: 'General', action: () => { setShowNotifPopup(p => !p); setShowProfilePopup(false); } },
        { keys: ['Alt', 'P'], description: 'Profile', group: 'General', action: () => { setShowProfilePopup(p => !p); setShowNotifPopup(false); } },
        { keys: ['Alt', 'L'], description: 'Logout', group: 'Actions', action: () => setShowLogoutConfirm(true) },

        // Navigation
        { keys: ['Alt', '1'], description: 'Dashboard', group: 'Navigation', action: () => navigate('/reception/dashboard') },
        { keys: ['Alt', '2'], description: 'Schedule', group: 'Navigation', action: () => navigate('/reception/schedule') },
        { keys: ['Alt', '3'], description: 'Inquiry', group: 'Navigation', action: () => navigate('/reception/inquiry') },
        { keys: ['Alt', '4'], description: 'Registration', group: 'Navigation', action: () => navigate('/reception/registration') },
        { keys: ['Alt', '5'], description: 'Book Test', group: 'Navigation', action: () => navigate('/reception/tests') }, // Mapped to Tests page
        { keys: ['Alt', '6'], description: 'Patients', group: 'Navigation', action: () => navigate('/reception/patients') },

        // Schedule Controls

        { keys: ['Alt', 'ArrowLeft'], description: 'Previous Week', group: 'Schedule', action: () => setCurrentDate(d => subWeeks(d, 1)), pageSpecific: true },
        { keys: ['Alt', 'ArrowRight'], description: 'Next Week', group: 'Schedule', action: () => setCurrentDate(d => addWeeks(d, 1)), pageSpecific: true },
        { keys: ['Alt', 'T'], description: 'Go to Today', group: 'Schedule', action: () => setCurrentDate(new Date()), pageSpecific: true },
        { keys: ['Ctrl', 'R'], description: 'Refresh', group: 'Schedule', action: () => fetchSchedule(), pageSpecific: true },
    ];
    
    // Global Key Listener for Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Escape to close modals
           if (e.key === 'Escape') {
               if (showGlobalSearch) setShowGlobalSearch(false);
               else if (showShortcuts) setShowShortcuts(false);
               else if (showLogoutConfirm) setShowLogoutConfirm(false);
               else if (showRescheduleModal) setShowRescheduleModal(false);
           }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showGlobalSearch, showShortcuts, showLogoutConfirm, showRescheduleModal]);

    // --- Actions ---
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const appointment = active.data.current?.appointment as Appointment;
        const { day, time } = over.data.current as { day: Date; time: string };
        const newDate = format(day, 'yyyy-MM-dd');
        const newTime = time;
        if (appointment.appointment_date === newDate && appointment.appointment_time.startsWith(newTime)) return;
        
        setIsUpdating(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/schedule.php?action=reschedule`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registration_id: appointment.registration_id, new_date: newDate, new_time: newTime, branch_id: user?.branch_id, employee_id: user?.employee_id })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Rescheduled to ${format(day, 'MMM d')} at ${format(parse(time, 'HH:mm', new Date()), 'hh:mm a')}`, 'success');
                fetchSchedule();
            } else { showToast(data.message || 'Rescheduling failed', 'error'); }
        } catch (e) { showToast('Error during reschedule', 'error'); }
        finally { setIsUpdating(false); }
    };

    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-40 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/reception/dashboard')}>
                         <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold">PS</div>
                         <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>PysioEZ</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4">
                    {/* Search */}
                    {/* Search */}
                    <div className="hidden md:flex items-center relative z-50">
                        <div 
                            onClick={() => setShowGlobalSearch(true)}
                            className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300 cursor-pointer hover:bg-[#d0d3dc] dark:hover:bg-[#50545c]"
                        >
                            <Search size={18} className="text-[#43474e] dark:text-[#c4c7c5] mr-2" />
                            <span className="text-sm text-[#43474e] dark:text-[#8e918f] pointer-events-none">Search patients... (Alt + S)</span>
                        </div>
                    </div>

                    <button onClick={toggleTheme} className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors">
                        <Moon size={22} className="block dark:hidden" />
                        <Sun size={22} className="hidden dark:block" />
                    </button>

                    <div className="relative">
                        <button ref={notifRef} onClick={() => { setShowNotifPopup(!showNotifPopup); setShowProfilePopup(false); }} className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative">
                            <Bell size={22} />
                            {unreadCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-[#b3261e] rounded-full"></span>}
                        </button>
                         <AnimatePresence>
                            {showNotifPopup && (
                                <motion.div id="notif-popup" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden transition-colors">
                                    <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Notifications</div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {notifications.map(n => (
                                            <div key={n.notification_id} className={`p-3 border-b border-[#e0e2ec] dark:border-[#43474e] hover:bg-[#e0e2ec]/50 ${n.is_read === 0 ? 'bg-[#ccebc4]/20' : ''}`}>
                                                <p className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">{n.message}</p>
                                                <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] mt-1">{n.time_ago}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative" ref={profileRef}>
                        <div onClick={() => { setShowProfilePopup(!showProfilePopup); setShowNotifPopup(false); }} className="w-10 h-10 bg-[#ccebc4] dark:bg-[#0c3b10] rounded-full flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold border border-[#74777f] dark:border-[#8e918f] ml-1 overflow-hidden cursor-pointer hover:ring-2 ring-[#ccebc4] transition-colors">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <AnimatePresence>
                            {showProfilePopup && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors">
                                     <button onClick={() => navigate('/reception/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"><User size={18} /> Profile</button>
                                     <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"><LogOut size={18} /> Logout</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* --- NAVIGATION CHIPS --- */}
            <div className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide border-b border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e] transition-colors duration-300">
                {[
                    { label: 'Dashboard', path: '/reception/dashboard' },
                    { label: 'Schedule', path: '/reception/schedule' },
                    { label: 'Inquiry', path: '/reception/inquiry' },
                    { label: 'Registration', path: '/reception/registration' },
                    { label: 'Patients', path: '/reception/patients' },
                    { label: 'Billing', path: '/reception/billing' },
                    { label: 'Attendance', path: '/reception/attendance' },
                    { label: 'Tests', path: '/reception/tests' },
                    { label: 'Feedback', path: '/reception/feedback' },
                    { label: 'Reports', path: '/reception/reports' },
                    { label: 'Expenses', path: '/reception/expenses' },
                    { label: 'Support', path: '/reception/support' }
                ].map((nav) => (
                    <button key={nav.label} onClick={() => { if (nav.label !== 'Schedule') navigate(nav.path); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${nav.label === 'Schedule' ? 'bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md' : 'bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]'}`}>{nav.label}</button>
                ))}
            </div>

            {/* --- MAIN CONTENT --- */}
            <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-4 md:px-8 max-w-[1800px] mx-auto space-y-6 mt-6">
                 {/* Title & Controls */}
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-[40px] leading-[48px] text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight transition-colors" style={{ fontFamily: 'serif' }}>
                            Schedule
                        </h2>
                        <p className="text-[#43474e] dark:text-[#c4c7c5] mt-1 text-lg transition-colors">Manage appointments & time slots</p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#e0e2ec] dark:bg-[#43474e] p-1 rounded-full">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#fdfcff] dark:hover:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e3e2e6] transition-colors"><ChevronLeft size={20} /></button>
                        <div className="px-4 text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] min-w-[140px] text-center">
                            {format(weekStartDate, 'MMM d')} - {format(weekEnd, 'MMM d')}
                        </div>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#fdfcff] dark:hover:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e3e2e6] transition-colors"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={() => fetchSchedule()} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ccebc4] dark:bg-[#0c3b10] text-[#0c200e] dark:text-[#ccebc4] hover:scale-105 active:scale-95 transition-all shadow-sm">
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                 </div>



                 {/* Calendar Grid */}
                 <motion.div variants={itemVariants} className="bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-[28px] overflow-hidden shadow-sm relative min-h-[600px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfcff]/50 dark:bg-[#1a1c1e]/50 z-50">
                            <Loader2 size={40} className="animate-spin text-[#006e1c] dark:text-[#88d99d]" />
                            <p className="mt-4 text-sm font-bold text-[#43474e] dark:text-[#c4c7c5]">Loading Schedule...</p>
                        </div>
                    ) : null}
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[#e0e2ec] dark:bg-[#43474e] gap-[1px]">
                            {/* Header Row */}
                            <div className="bg-[#fdfcff] dark:bg-[#111315] p-4 flex flex-col items-center justify-center sticky top-0 z-30">
                                <Clock size={18} className="text-[#006e1c] dark:text-[#88d99d]" />
                            </div>
                            {days.map((day) => (
                                <div key={day.toString()} className={`bg-[#fdfcff] dark:bg-[#111315] p-3 flex flex-col items-center justify-center gap-1 sticky top-0 z-30 ${isToday(day) ? 'bg-[#ccebc4]/20' : ''}`}>
                                    <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-[#006e1c] dark:text-[#88d99d]' : 'text-[#43474e] dark:text-[#c4c7c5]'}`}>{format(day, 'EEE')}</span>
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${isToday(day) ? 'bg-[#006e1c] text-white' : 'text-[#1a1c1e] dark:text-[#e3e2e6]'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}

                            {/* Time Slots */}
                            {timeSlots.map(({ time, label }) => (
                                <div key={time} className="contents">
                                    <div className="bg-[#fdfcff] dark:bg-[#111315] p-3 flex items-center justify-center border-r-[1px] border-[#e0e2ec] dark:border-[#43474e]">
                                        <span className="text-xs font-medium text-[#43474e] dark:text-[#c4c7c5]">{label}</span>
                                    </div>
                                    {days.map((day) => {
                                        const dayStr = format(day, 'yyyy-MM-dd');
                                        const slotApps = appointments.filter(a => a.appointment_date === dayStr && a.appointment_time.startsWith(time));
                                        return (
                                            <DroppableSlot key={`${dayStr}-${time}`} id={`${dayStr}-${time}`} day={day} time={time}>
                                                {slotApps.map((app) => (
                                                    <DraggableAppointment key={app.registration_id} appointment={app} onClick={() => { setActiveAppointment(app); setShowRescheduleModal(true); }} />
                                                ))}
                                            </DroppableSlot>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </DndContext>
                    
                    {/* Updating Overlay */}
                    <AnimatePresence>
                        {isUpdating && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="bg-[#1a1c1e] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
                                    <Loader2 className="animate-spin" />
                                    <span className="text-sm font-bold">Updating Schedule...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </motion.div>
            </motion.main>
            
             {/* --- GLOBAL COMPONENTS --- */}
            <KeyboardShortcuts 
                shortcuts={shortcuts} 
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
                onToggle={() => setShowShortcuts(prev => !prev)}
            />
            <LogoutConfirmation 
                isOpen={showLogoutConfirm} 
                onClose={() => setShowLogoutConfirm(false)} 
                onConfirm={logout} 
            />
            <GlobalSearch 
                isOpen={showGlobalSearch} 
                onClose={() => setShowGlobalSearch(false)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
            />
            
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
                        <div className={`px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#ccebc4] text-[#0c200e]' : 'bg-[#ffdad6] text-[#410002]'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="font-bold text-sm">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

                {showRescheduleModal && activeAppointment && (
                    <RescheduleModal 
                        appointment={activeAppointment} 
                        onClose={() => setShowRescheduleModal(false)} 
                        onSuccess={() => { setShowRescheduleModal(false); fetchSchedule(); }} 
                        showToast={showToast} 
                    />
                )}
        </div>
    );
};

// --- Reschedule Modal Component ---
const RescheduleModal = ({ appointment, onClose, onSuccess, showToast }: any) => {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(appointment.appointment_date);
    const [selectedSlot, setSelectedSlot] = useState(appointment.appointment_time.slice(0, 5));
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!user?.branch_id) return;
            setIsLoadingSlots(true);
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/schedule.php?action=slots&date=${selectedDate}&branch_id=${user.branch_id}`);
                const data = await res.json();
                if (data.success) setSlots(data.slots);
            } catch (e) { console.error(e); } 
            finally { setIsLoadingSlots(false); }
        };
        fetchSlots();
    }, [selectedDate, user?.branch_id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/schedule.php?action=reschedule`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registration_id: appointment.registration_id, new_date: selectedDate, new_time: selectedSlot, branch_id: user?.branch_id, employee_id: user?.employee_id })
            });
            const data = await res.json();
            if (data.success) { showToast('Rescheduled successfully', 'success'); onSuccess(); }
            else { showToast(data.message || 'Failed', 'error'); }
        } catch (e) { showToast('Error', 'error'); } 
        finally { setIsSaving(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[28px] overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="bg-[#ccebc4] dark:bg-[#0c3b10] px-6 py-4 flex items-center justify-between shrink-0">
                     <div>
                         <h3 className="text-lg font-bold text-[#0c200e] dark:text-[#ccebc4]">Reschedule Appointment</h3>
                         <p className="text-xs text-[#0c200e]/70 dark:text-[#ccebc4]/70 font-medium">For {appointment.patient_name}</p>
                     </div>
                     <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#0c200e]/10 hover:bg-[#0c200e]/20 flex items-center justify-center transition-colors text-[#0c200e] dark:text-[#ccebc4]"><X size={18} /></button>
                </div>
                
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Left Panel: Date Picker */}
                    <div className="md:w-auto border-r border-[#e0e2ec] dark:border-[#43474e] bg-[#ece6f0] dark:bg-[#1e1e1e]">
                        <InlineDatePicker 
                            value={selectedDate} 
                            onChange={(d: string) => { setSelectedDate(d); setSelectedSlot(''); }} 
                            showActions={false}
                            className="h-full shadow-none rounded-none w-full md:w-[320px]"
                        />
                    </div>

                    {/* Right Panel: Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                             <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Available Slots</label>
                                    <span className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{format(new Date(selectedDate), 'EEEE, MMM do')}</span>
                                </div>
                                
                                {isLoadingSlots ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#006e1c]" size={32} /></div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.map(slot => (
                                            <button 
                                                key={slot.time} 
                                                disabled={slot.isBooked && (selectedDate !== appointment.appointment_date || slot.time !== appointment.appointment_time.slice(0,5))}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                                                    selectedSlot === slot.time 
                                                        ? 'bg-[#006e1c] text-white border-[#006e1c] shadow-md transform scale-105' 
                                                        : slot.isBooked && slot.time !== appointment.appointment_time.slice(0,5)
                                                            ? 'bg-[#e0e2ec]/50 text-[#43474e]/50 border-transparent cursor-not-allowed line-through'
                                                            : 'bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] border-[#74777f] dark:border-[#8e918f] hover:border-[#006e1c] hover:bg-[#ccebc4]/20'
                                                }`}
                                            >
                                                {slot.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!isLoadingSlots && slots.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-[#43474e]">
                                        <Clock size={48} className="opacity-20 mb-2" />
                                        <p className="text-sm font-medium">No slots available for this date</p>
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-end gap-2 bg-[#fdfcff] dark:bg-[#1a1c1e]">
                            <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-bold text-[#006e1c] dark:text-[#88d99d] hover:bg-[#ccebc4]/20 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving || !selectedSlot} className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#006e1c] text-white hover:bg-[#005313] shadow-md disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2">
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                Confirm Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Schedule;
