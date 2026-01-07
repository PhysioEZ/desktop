import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL, authFetch } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import ChatModal from '../components/Chat/ChatModal'; // Integrated Chat
import { 
    Users, ClipboardList, TestTube2, Wallet, Calendar, Clock, 
    ArrowUpRight, AlertCircle, Camera, Loader2, 
    X, RefreshCw, Check, UserPlus, FlaskConical, PhoneCall, Beaker,
    Search, Bell, Plus, MessageCircle, LogOut, User,
    Moon, Sun, ChevronLeft, ChevronRight, Edit2, ChevronDown, ChevronUp
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';
import KeyboardShortcuts, { type ShortcutItem } from '../components/KeyboardShortcuts';
import LogoutConfirmation from '../components/LogoutConfirmation';
import GlobalSearch from '../components/GlobalSearch';

// Types
interface DashboardData {
    registration: { today_total: number; pending: number; consulted: number; month_total: number; };
    inquiry: { total_today: number; quick: number; test: number; };
    patients: { today_attendance: number; total_ever: number; active: number; inactive: number; paid_today: number; new_month: number; };
    tests: { today_total: number; pending: number; completed: number; revenue_today: number; total_month: number; };
    collections: { reg_amount: number; treatment_amount: number; test_amount: number; today_total: number; today_dues: number; patient_dues: number; test_dues: number; month_total: number; };
    schedule: Array<{ id: number; patient_name: string; appointment_time: string; status: string; }>;
}

interface Notification {
    notification_id: number; message: string; link_url: string | null; is_read: number; created_at: string; time_ago: string;
}

interface PatientSearch {
    patient_id: number; patient_name: string; patient_uid: string | null; age: string; gender: string; phone_number: string; status: string;
}

interface FormOptions {
    referrers: string[];
    paymentMethods: Array<{ method_code: string; method_name: string }>;
    staffMembers: Array<{ staff_id: number; staff_name: string; job_title: string }>;
    testTypes: Array<{ test_type_id: number; test_name: string; test_code: string; default_cost: string | number; requires_limb_selection: boolean }>;
    limbTypes: Array<{ limb_type_id: number; limb_name: string; limb_code: string }>;
    chiefComplaints: Array<{ complaint_code: string; complaint_name: string }>;
    referralSources: Array<{ source_code: string; source_name: string }>;
    consultationTypes: Array<{ consultation_code: string; consultation_name: string }>;
    inquiryServiceTypes: Array<{ service_code: string; service_name: string }>;
    timeSlots: Array<{ value: string; label: string; booked: boolean }>;
}

type ModalType = 'registration' | 'test' | 'inquiry' | 'test_inquiry' | null;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const DatePicker = ({ value, onChange, onClose }: any) => {
    const [currDate, setCurrDate] = useState(value ? new Date(value) : new Date());
    const [selected, setSelected] = useState(value ? new Date(value) : new Date());

    const getDays = () => {
        const y = currDate.getFullYear(), m = currDate.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const firstDay = new Date(y, m, 1).getDay();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));
        return days;
    };

    const handleDateClick = (date: Date) => {
        const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        setSelected(offsetDate);
    };

    const confirm = () => {
        onChange(selected.toISOString().split('T')[0]);
        onClose();
    };

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#ece6f0] dark:bg-[#2b2930] w-[320px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-4 pb-3 border-b border-[#79747e]/10">
                    <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide">Select date</p>
                    <div className="flex justify-between items-center mt-1">
                        <h2 className="text-3xl font-normal text-[#1d1b20] dark:text-[#e6e1e5]">
                            {selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h2>
                        <button className="text-[#49454f] dark:text-[#cac4d0] p-1 hover:bg-[#1d1b20]/10 rounded-full transition-colors"><Edit2 size={18} /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-3">
                    {/* Controls */}
                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-1 text-[#49454f] dark:text-[#cac4d0] font-bold text-sm cursor-pointer hover:bg-[#1d1b20]/10 px-2 py-1 rounded-full transition-colors">
                            {months[currDate.getMonth()]} {currDate.getFullYear()} <span className="text-[10px]">▼</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"><ChevronLeft size={20} /></button>
                            <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 text-center mb-2">
                        {weekDays.map(d => <span key={d} className="text-xs font-medium text-[#49454f] dark:text-[#cac4d0] w-8 h-8 flex items-center justify-center">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                        {getDays().map((d, i) => (
                            <div key={i} className="flex justify-center">
                                {d ? (
                                    <button 
                                        onClick={() => handleDateClick(d)}
                                        className={`w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors ${
                                            selected.toDateString() === d.toDateString() 
                                            ? 'bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72]' 
                                            : d.toDateString() === new Date().toDateString() 
                                                ? 'border border-[#6750a4] text-[#6750a4] dark:border-[#d0bcff] dark:text-[#d0bcff]' 
                                                : 'text-[#1d1b20] dark:text-[#e6e1e5] hover:bg-[#1d1b20]/10 dark:hover:bg-[#e6e1e5]/10'
                                        }`}
                                    >
                                        {d.getDate()}
                                    </button>
                                ) : <div className="w-9 h-9"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 p-3 pt-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">Cancel</button>
                    <button onClick={confirm} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">OK</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TimePicker = ({ value, onChange, onClose, slots }: any) => {
    const [selected, setSelected] = useState(value || '');

    const confirm = () => {
        onChange(selected);
        onClose();
    };

    const selectedLabel = slots?.find((s: any) => s.time === selected)?.label || '--:--';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#ece6f0] dark:bg-[#2b2930] w-[340px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-6 pb-4 border-b border-[#79747e]/10 pt-8 shrink-0">
                    <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide mb-1">Select time</p>
                    <div className="flex justify-center items-center bg-[#eaddff] dark:bg-[#4f378b] rounded-xl py-4 px-8 w-fit mx-auto mb-2">
                        <span className="text-5xl font-normal text-[#21005d] dark:text-[#eaddff] tracking-tight">{selectedLabel.replace(/ (AM|PM)/, '')}</span>
                        <div className="flex flex-col ml-3 gap-1">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes('AM') ? 'bg-[#21005d] text-[#eaddff]' : 'text-[#21005d] border border-[#21005d]/20'}`}>AM</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes('PM') ? 'bg-[#21005d] text-[#eaddff]' : 'text-[#21005d] border border-[#21005d]/20'}`}>PM</span>
                        </div>
                    </div>
                </div>

                {/* Body (Grid) */}
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-2">
                        {slots?.map((slot: any) => (
                            <button 
                                key={slot.time} 
                                disabled={slot.disabled}
                                onClick={() => setSelected(slot.time)}
                                className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                                    selected === slot.time
                                        ? 'bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72] border-[#6750a4] dark:border-[#d0bcff]'
                                        : slot.disabled 
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                            : 'bg-transparent border-[#79747e] text-[#49454f] dark:text-[#cac4d0] hover:bg-[#6750a4]/10'
                                }`}
                            >
                                <span className={slot.disabled ? 'line-through decoration-2' : ''}>
                                    {slot.label.split(' ')[0]} <span className="text-[10px]">{slot.label.split(' ')[1]}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                    {(!slots || slots.length === 0) && <p className="text-center text-slate-400 py-8">No slots available for this date.</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 p-4 pt-2 shrink-0 bg-[#ece6f0] dark:bg-[#2b2930]">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">Cancel</button>
                    <button onClick={confirm} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">OK</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ReceptionDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Header Logic (Search, Notifications, Profile)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PatientSearch[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLButtonElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form logic
    const formRef = useRef<HTMLFormElement>(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [showRegPayment, setShowRegPayment] = useState(false);
    const [showTestPayment, setShowTestPayment] = useState(false);
    
    // Test form Logic
    const [selectedTests, setSelectedTests] = useState<Record<string, { checked: boolean; amount: string }>>({});
    const [otherTestName, setOtherTestName] = useState('');

    const [totalAmount, setTotalAmount] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [dueAmount, setDueAmount] = useState('');
    
    // Split Payment States
    const [regPaymentSplits, setRegPaymentSplits] = useState<{[key: string]: number}>({});
    const [testPaymentSplits, setTestPaymentSplits] = useState<{[key: string]: number}>({});
    
    // Registration form
    const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState<'registration' | 'test_visit' | 'test_assigned' | 'inquiry' | 'test_inquiry' | null>(null);
    const [testVisitDate, setTestVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [testAssignedDate, setTestAssignedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointmentTime, setAppointmentTime] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    
    // Inquiry Dates
    const [inquiryDate, setInquiryDate] = useState(new Date().toISOString().split('T')[0]);
    const [testInquiryDate, setTestInquiryDate] = useState(new Date().toISOString().split('T')[0]);

    // Dropdown States (Controlled)
    const [regGender, setRegGender] = useState('');
    const [regSource, setRegSource] = useState('');
    const [regConsultType, setRegConsultType] = useState('');
    
    const [testGender, setTestGender] = useState('');
    const [testLimb, setTestLimb] = useState('');
    const [testDoneBy, setTestDoneBy] = useState('');

    const [inqGender, setInqGender] = useState('');
    const [inqService, setInqService] = useState('');
    const [inqSource, setInqSource] = useState('');
    const [inqCommType, setInqCommType] = useState('');
    const [inqComplaint, setInqComplaint] = useState('');

    const [tiTestName, setTiTestName] = useState('');
    const [regComplaint, setRegComplaint] = useState('');

    // UI State


    // Theme Logic
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    // --- LOGIC: FETCHING ---
    const fetchAll = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const [dashRes, optRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/reception/dashboard.php?branch_id=${user?.branch_id}`),
                authFetch(`${API_BASE_URL}/reception/form_options.php?branch_id=${user?.branch_id}&appointment_date=${appointmentDate}&service_type=physio`)
            ]);
            const dashData = await dashRes.json();
            const optData = await optRes.json();
            
            if (dashData.status === 'success') setData(dashData.data);
            if (optData.status === 'success') {
                setFormOptions(optData.data);
                const initialTests: Record<string, { checked: boolean; amount: string }> = {};
                optData.data.testTypes?.forEach((t: { test_code: string; default_cost: string | number }) => {
                    const cost = parseFloat(String(t.default_cost)) || 0;
                    initialTests[t.test_code] = { checked: false, amount: cost > 0 ? cost.toFixed(2) : '' };
                });
                setSelectedTests(initialTests);
            } else {
                console.error('Failed to load form options:', optData);
            }
        } catch (e) { console.error('Error fetching data:', e); } finally { setIsLoading(false); }
    }, [user?.branch_id, appointmentDate]);

    // Fetch Time Slots
    const fetchTimeSlots = useCallback(async (date: string) => {
        if (!user?.branch_id) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/get_slots.php?date=${date}`);
            const data = await res.json();
            if (data.success) {
                setTimeSlots(data.slots);
            }
        } catch (e) {
            console.error('Error fetching time slots:', e);
        }
    }, [user?.branch_id]);

    // Fetch time slots when appointment date changes
    useEffect(() => {
        if (appointmentDate) {
            fetchTimeSlots(appointmentDate);
        }
    }, [appointmentDate, fetchTimeSlots]);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/notifications.php?employee_id=${user?.employee_id || ''}`);
                const data = await res.json();
                if (data.success || data.status === 'success') {
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (err) { console.error(err); }
        };
        if(user?.employee_id) { fetchNotifs(); const inv = setInterval(fetchNotifs, 30000); return () => clearInterval(inv); }
    }, [user?.employee_id]);

    // Search Logic
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!user?.branch_id || searchQuery.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
        
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/search_patients.php?branch_id=${user.branch_id}&q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success) { setSearchResults(data.patients || []); setShowSearchResults(true); }
            } catch (err) { console.error(err); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, user?.branch_id]);

    useEffect(() => {
        fetchAll();
        // Click outside handler for popups
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node) && !(e.target as Element).closest('#notif-popup')) setShowNotifPopup(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfilePopup(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [fetchAll]);

    // Auto-focus first input when modal opens
    useEffect(() => {
        if (activeModal && formRef.current) {
            // Find first visible input, select, or textarea
            const inputs = formRef.current.querySelectorAll('input, select, textarea');
            for (let i = 0; i < inputs.length; i++) {
                const el = inputs[i] as HTMLElement;
                if (el.offsetParent !== null && !el.hasAttribute('disabled') && !el.hasAttribute('readonly')) {
                    setTimeout(() => el.focus(), 100);
                    break;
                }
            }
        }
    }, [activeModal]);

    // Global ESC Key Handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Priority Order (LIFOish)
                if (showGlobalSearch) setShowGlobalSearch(false);
                else if (showShortcuts) setShowShortcuts(false);
                else if (showLogoutConfirm) setShowLogoutConfirm(false);
                else if (showPhotoModal) closePhotoModal();
                else if (showChatModal) setShowChatModal(false);
                else if (showNotifPopup) setShowNotifPopup(false);
                else if (showProfilePopup) setShowProfilePopup(false);
                else if (activeModal) closeModal();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showGlobalSearch, showShortcuts, showLogoutConfirm, showPhotoModal, showChatModal, showNotifPopup, showProfilePopup, activeModal]);

    const handleAppointmentDateChange = async (newDate: string) => {
        setAppointmentDate(newDate);
        if (user?.branch_id) {
            try {
                const optRes = await authFetch(`${API_BASE_URL}/reception/form_options.php?branch_id=${user.branch_id}&appointment_date=${newDate}`);
                const optData = await optRes.json();
                if (optData.status === 'success' && formOptions) setFormOptions({ ...formOptions, timeSlots: optData.data.timeSlots });
            } catch (e) { console.error(e); }
        }
    };

    const handleTestCheckChange = (testCode: string, checked: boolean) => {
        setSelectedTests(prev => {
            const newState = { ...prev };
            if (!newState[testCode]) newState[testCode] = { checked: false, amount: '' };
            newState[testCode].checked = checked;
            // Auto fill default amount if checking
            if (checked && !newState[testCode].amount) {
                const test = formOptions?.testTypes?.find((t: any) => t.test_code === testCode);
                if (test && test.default_cost) newState[testCode].amount = String(test.default_cost);
            }
            return newState;
        });
    };

    const handleTestAmountChange = (testCode: string, amount: string) => {
        setSelectedTests(prev => {
            const newState = { ...prev };
            if (!newState[testCode]) newState[testCode] = { checked: false, amount: '' };
            newState[testCode].amount = amount;
            return newState;
        });
    };

    useEffect(() => {
        if (activeModal !== 'test') return;
        let total = 0;
        Object.values(selectedTests).forEach(t => { if (t.checked) total += parseFloat(t.amount) || 0; });
        setTotalAmount(total > 0 ? total.toFixed(2) : '');
        
        const adv = parseFloat(advanceAmount) || 0;
        const disc = parseFloat(discountAmount) || 0;
        const due = total - adv - disc;
        setDueAmount(due > 0 ? due.toFixed(2) : '0.00');
    }, [selectedTests, advanceAmount, discountAmount, activeModal]);



    // Scroll Lock for Modals
    useEffect(() => {
        if (activeModal || showChatModal || showPhotoModal || showDatePicker || showTimePicker) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activeModal, showChatModal, showPhotoModal, showDatePicker, showTimePicker]);

    // --- LOGIC: WEBCAM ---
    const startWebcam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { console.error(e); } };
    const stopWebcam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
    const openPhotoModal = () => { setShowPhotoModal(true); setPhotoCaptured(false); setTimeout(() => startWebcam(), 100); };
    const closePhotoModal = () => { stopWebcam(); setShowPhotoModal(false); setPhotoCaptured(false); };
    const capturePhoto = () => { if (videoRef.current && canvasRef.current) { const v = videoRef.current, c = canvasRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height); setPhotoCaptured(true); } };
    const retakePhoto = () => setPhotoCaptured(false);
    const usePhoto = () => { if (canvasRef.current) { setPhotoData(canvasRef.current.toDataURL('image/jpeg', 0.8)); closePhotoModal(); } };
    
    // --- LOGIC: SUBMIT ---
    const closeModal = () => { 
        setActiveModal(null); setAdvanceAmount(''); setDiscountAmount(''); setDueAmount(''); setSubmitMessage(null); setPhotoData(null);
        // Reset Dropdowns
        setRegGender(''); setRegSource(''); setRegConsultType('');
        setTestGender(''); setTestLimb(''); setTestDoneBy('');
        setInqGender(''); setInqService(''); setInqSource(''); setInqCommType(''); setInqComplaint('');
        setTiTestName('');
        setRegComplaint('');
        setRegPaymentSplits({}); setTestPaymentSplits({});

        if (formOptions?.testTypes) {
            const initialTests: Record<string, { checked: boolean; amount: string }> = {};
            formOptions.testTypes.forEach((t) => {
                const cost = parseFloat(String(t.default_cost)) || 0;
                initialTests[t.test_code] = { checked: false, amount: cost > 0 ? cost.toFixed(2) : '' };
            });
            setSelectedTests(initialTests);
        }
    };

    const handleSubmit = async () => {
        if (!formRef.current || !user?.branch_id || !user?.employee_id) return;
        const formData = new FormData(formRef.current);
        const formObject: Record<string, string> = {};
        formData.forEach((value, key) => { formObject[key] = value.toString(); });
        setIsSubmitting(true); setSubmitMessage(null);
        try {
            let endpoint = '';
            let payload: Record<string, unknown> = { branch_id: user.branch_id, employee_id: user.employee_id };

            if (activeModal === 'registration') {
                endpoint = `${API_BASE_URL}/reception/registration_submit.php`;
                const currentSum = Object.values(regPaymentSplits).reduce((a, b) => a + b, 0);
                const totalReq = parseFloat(formObject.amount) || 0;
                if (currentSum !== totalReq) {
                    setSubmitMessage({ type: 'error', text: `Payment split total (₹${currentSum}) does not match Consultation Amount (₹${totalReq})` });
                    setIsSubmitting(false); return;
                }
                payload = { ...payload, patient_name: formObject.patient_name, phone: formObject.phone, email: formObject.email || '', gender: formObject.gender, age: formObject.age, conditionType: formObject.conditionType, conditionType_other: formObject.conditionType_other || '', referralSource: formObject.referralSource, referred_by: formObject.referred_by || '', occupation: formObject.occupation || '', address: formObject.address || '', inquiry_type: formObject.inquiry_type, appointment_date: formObject.appointment_date || null, appointment_time: formObject.appointment_time || null, amount: formObject.amount || '0', payment_method: Object.keys(regPaymentSplits).join(','), payment_amounts: regPaymentSplits, remarks: formObject.remarks || '', patient_photo_data: photoData || '' };
            } else if (activeModal === 'test') {
                endpoint = `${API_BASE_URL}/reception/test_submit.php`;
                const testNames = Object.entries(selectedTests).filter(([, val]) => val.checked).map(([key]) => key);
                const testAmounts: Record<string, number> = {};
                Object.entries(selectedTests).forEach(([key, val]) => { if (val.checked && val.amount) testAmounts[key] = parseFloat(val.amount) || 0; });
                
                const currentSum = Object.values(testPaymentSplits).reduce((a, b) => a + b, 0);
                const totalReq = parseFloat(advanceAmount) || 0;
                if (currentSum !== totalReq) {
                    setSubmitMessage({ type: 'error', text: `Payment split total (₹${currentSum}) does not match Advance Amount (₹${totalReq})` });
                    setIsSubmitting(false); return;
                }
                
                payload = { ...payload, patient_name: formObject.patient_name, age: formObject.age, gender: formObject.gender, dob: formObject.dob || null, parents: formObject.parents || '', relation: formObject.relation || '', phone_number: formObject.phone_number || '', alternate_phone_no: formObject.alternate_phone_no || '', referred_by: formObject.referred_by || '', limb: formObject.limb || null, test_names: testNames, test_amounts: testAmounts, other_test_name: otherTestName, visit_date: formObject.visit_date, assigned_test_date: formObject.assigned_test_date, test_done_by: formObject.test_done_by, total_amount: parseFloat(totalAmount) || 0, advance_amount: parseFloat(advanceAmount) || 0, discount: parseFloat(discountAmount) || 0, payment_method: Object.keys(testPaymentSplits).join(','), payment_amounts: testPaymentSplits };
            } else if (activeModal === 'inquiry') {
                endpoint = `${API_BASE_URL}/reception/inquiry_submit.php`;
                payload = { ...payload, patient_name: formObject.patient_name, age: formObject.age, gender: formObject.gender, phone: formObject.phone, inquiry_type: formObject.inquiry_type || null, communication_type: formObject.communication_type || null, referralSource: formObject.referralSource || 'self', conditionType: formObject.conditionType || '', conditionType_other: formObject.conditionType_other || '', remarks: formObject.remarks || '', expected_date: formObject.expected_date || null };
            } else if (activeModal === 'test_inquiry') {
                endpoint = `${API_BASE_URL}/reception/test_inquiry_submit.php`;
                payload = { ...payload, patient_name: formObject.patient_name, test_name: formObject.test_name, referred_by: formObject.referred_by || '', phone_number: formObject.phone_number, expected_visit_date: formObject.expected_visit_date || null };
            }

            const response = await authFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.success) {
                setSubmitMessage({ type: 'success', text: result.message || 'Submitted successfully!' });
                const dashRes = await authFetch(`${API_BASE_URL}/reception/dashboard.php?branch_id=${user.branch_id}`);
                const dashData = await dashRes.json();
                if (dashData.status === 'success') setData(dashData.data);
                setTimeout(() => closeModal(), 1500);
            } else { setSubmitMessage({ type: 'error', text: result.message || 'Submission failed' }); }
        } catch (error) { console.error(error); setSubmitMessage({ type: 'error', text: 'An error occurred' }); } finally { setIsSubmitting(false); }
    };

    // Helper
    const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
    const getTimeRange = (timeStr: string) => {
        if (!timeStr) return '';
        const today = new Date().toISOString().split('T')[0];
        const start = new Date(`${today}T${timeStr}`);
        if (isNaN(start.getTime())) return timeStr;
        const end = new Date(start.getTime() + 30 * 60 * 1000); 
        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    const actionButtons = [
        { id: 'registration' as ModalType, label: 'Registration', icon: UserPlus, color: 'bg-[#ccebc4] text-[#0c200e] hover:bg-[#b0d8a4]' },
        { id: 'test' as ModalType, label: 'Book Test', icon: FlaskConical, color: 'bg-[#d0e4ff] text-[#001d36] hover:bg-[#b0d2ff]' },
        { id: 'inquiry' as ModalType, label: 'Inquiry', icon: PhoneCall, color: 'bg-[#eaddff] text-[#21005d] hover:bg-[#d0bcff]' },
        { id: 'test_inquiry' as ModalType, label: 'Test Inquiry', icon: Beaker, color: 'bg-[#ffdad6] text-[#410002] hover:bg-[#ffb4ab]' },
    ];
    
    // MD3 Styled Inputs
    const inputClass = "w-full px-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] border-b-2 border-[#74777f] dark:border-[#8e918f] focus:border-[#006e1c] dark:focus:border-[#88d99d] rounded-t-lg text-[#1a1c1e] dark:text-[#e3e2e6] text-base focus:outline-none transition-colors placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] focus:bg-[#dadae2] dark:focus:bg-[#50545c]";
    const labelClass = "block text-xs font-medium text-[#43474e] dark:text-[#c4c7c5] mb-1 px-1";

    // Keyboard Shortcuts with Grouping
    const shortcuts: ShortcutItem[] = [
        // General
        { keys: ['Alt', '/'], description: 'Keyboard Shortcuts', group: 'General', action: () => setShowShortcuts(prev => !prev) },

        // Modals
        { keys: ['Alt', 'R'], description: 'New Registration', group: 'Modals', action: () => setActiveModal('registration'), pageSpecific: true },
        { keys: ['Alt', 'T'], description: 'Book Test', group: 'Modals', action: () => setActiveModal('test'), pageSpecific: true },
        { keys: ['Alt', 'I'], description: 'New Inquiry', group: 'Modals', action: () => setActiveModal('inquiry'), pageSpecific: true },
        { keys: ['Alt', 'Shift', 'I'], description: 'Test Inquiry', group: 'Modals', action: () => setActiveModal('test_inquiry'), pageSpecific: true },
        { keys: ['Alt', 'C'], description: 'Toggle Chat', group: 'Modals', action: () => setShowChatModal(prev => !prev), pageSpecific: true },
        { keys: ['Alt', 'N'], description: 'Notifications', group: 'Modals', action: () => setShowNotifPopup(prev => !prev), pageSpecific: true },
        { keys: ['Alt', 'P'], description: 'Profile', group: 'Modals', action: () => setShowProfilePopup(prev => !prev), pageSpecific: true },
        { keys: ['Alt', 'S'], description: 'Global Search', group: 'Modals', action: () => setShowGlobalSearch(true) },
        { keys: ['Alt', 'L'], description: 'Logout', group: 'Actions', action: () => setShowLogoutConfirm(true) },
        
        // Actions
        { keys: ['Alt', 'W'], description: 'Toggle Theme', group: 'Actions', action: toggleTheme },
        { keys: ['Ctrl', 'R'], description: 'Reload Page', group: 'Actions', action: () => window.location.reload() },
        
        // Navigation
        { keys: ['Alt', '1'], description: 'Dashboard', group: 'Navigation', action: () => navigate('/reception/dashboard') },
        { keys: ['Alt', '2'], description: 'Schedule', group: 'Navigation', action: () => navigate('/reception/schedule') },
        { keys: ['Alt', '3'], description: 'Inquiry List', group: 'Navigation', action: () => navigate('/reception/inquiry') },
        { keys: ['Alt', '4'], description: 'Registration List', group: 'Navigation', action: () => navigate('/reception/registration') },
        { keys: ['Alt', '5'], description: 'Cancelled List', group: 'Navigation', action: () => navigate('/reception/registration/cancelled') },
        { keys: ['Alt', '6'], description: 'Patients List', group: 'Navigation', action: () => navigate('/reception/patients') },
    ];


    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans selection:bg-[#ccebc4] selection:text-[#0c200e] pb-24 transition-colors duration-300">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-40 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold">PE</div>
                            <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>PhysioEZ</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4">
                    {/* Search Bar */}
                    <div ref={searchRef} className="hidden md:flex items-center relative z-50">
                        <div 
                            className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300 cursor-pointer hover:bg-[#dadae2] dark:hover:bg-[#50545c]"
                            onClick={() => setShowGlobalSearch(true)}
                        >
                            <Search size={18} className="text-[#43474e] dark:text-[#c4c7c5] mr-2" />
                            <span className="text-sm text-[#43474e] dark:text-[#8e918f]">
                                {searchQuery || 'Search patients... (Alt + S)'}
                            </span>
                        </div>
                        {/* Search Results */}
                        <AnimatePresence>
                            {showSearchResults && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#fdfcff] rounded-[20px] shadow-xl border border-[#e0e2ec] overflow-hidden max-h-[400px] overflow-y-auto">
                                    {searchResults.map((p) => (
                                        <div key={p.patient_id} onClick={() => { setSearchQuery(''); setShowSearchResults(false); navigate(`/reception/patients`); /* Ideally navigate to specific patient */ }} className="p-3 hover:bg-[#e0e2ec] cursor-pointer border-b border-[#e0e2ec] last:border-0">
                                            <p className="font-bold text-[#1a1c1e]">{p.patient_name}</p>
                                            <p className="text-xs text-[#43474e]">{p.phone_number}</p>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && <div className="p-4 text-center text-[#43474e]">No patients found</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={fetchAll} disabled={isLoading} className={`p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors ${isLoading ? 'animate-spin' : ''}`}><RefreshCw size={22} strokeWidth={1.5} /></button>
                    
                    {/* Dark Mode Toggle */}
                    <button onClick={toggleTheme} className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors">
                        <Moon size={22} strokeWidth={1.5} className="block dark:hidden" />
                        <Sun size={22} strokeWidth={1.5} className="hidden dark:block" />
                    </button>
                    
                    {/* Notifications */}
                    <div className="relative">
                        <button ref={notifRef} onClick={() => { setShowNotifPopup(!showNotifPopup); setShowProfilePopup(false); }} className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative">
                            <Bell size={22} strokeWidth={1.5} />
                            {unreadCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-[#b3261e] rounded-full"></span>}
                        </button>
                         <AnimatePresence>
                            {showNotifPopup && (
                                <motion.div id="notif-popup" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden transition-colors">
                                    <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Notifications</div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {notifications.map(n => (
                                            <div key={n.notification_id} className={`p-3 border-b border-[#e0e2ec] dark:border-[#43474e] hover:bg-[#e0e2ec]/50 dark:hover:bg-[#43474e]/50 ${n.is_read === 0 ? 'bg-[#ccebc4]/20 dark:bg-[#ccebc4]/10' : ''}`}>
                                                <p className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">{n.message}</p>
                                                <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] mt-1">{n.time_ago}</p>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && <div className="p-4 text-center text-sm text-[#43474e] dark:text-[#c4c7c5]">No notifications</div>}
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
                    <button key={nav.label} onClick={() => { if (nav.label !== 'Dashboard') navigate(nav.path); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${nav.label === 'Dashboard' ? 'bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md' : 'bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]'}`}>{nav.label}</button>
                ))}
            </div>

            {/* --- MAIN CONTENT --- */}
            <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-8 mt-6">
                {/* Greeting & Quick Actions */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-[40px] leading-[48px] text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight transition-colors" style={{ fontFamily: 'serif' }}>
                            Hello, <span className="text-[#006e1c] dark:text-[#ccebc4] italic transition-colors">{user?.name || 'Receptionist'}</span>
                        </h2>
                        <p className="text-[#43474e] dark:text-[#c4c7c5] mt-1 text-lg transition-colors">Here's your daily branch overview</p>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto p-4 scrollbar-hide">
                        {actionButtons.map(btn => (
                            <button key={btn.id!} onClick={() => setActiveModal(btn.id)} className={`flex items-center gap-2 px-5 py-3 rounded-[16px] text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm border border-transparent ${btn.color}`}>
                                <btn.icon size={18} />
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* --- MASONRY GRID --- */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* 1. REGISTRATION CARD */}
                    <motion.div variants={itemVariants} className="bg-[#e0e2ec] dark:bg-[#43474e] dark:border dark:border-[#53565f] rounded-[28px] p-6 flex flex-col justify-between min-h-[220px] transition-colors duration-300">
                         <div className="flex justify-between items-start">
                             <div>
                                 <p className="text-[#43474e] dark:text-[#c4c7c5] font-medium mb-1 text-sm tracking-wide">REGISTRATION & INQUIRY</p>
                             </div>
                             <div className="p-2 bg-white dark:bg-[#1a1c1e] rounded-xl"><ClipboardList size={20} className="text-[#001d36] dark:text-[#d0e4ff]" /></div>
                         </div>
                         
                         <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] mb-1">Today's Registrations</p>
                                    <h4 className="text-4xl text-[#1a1c1e] dark:text-[#e3e2e6] font-normal" style={{ fontFamily: 'serif' }}>{data?.registration.today_total || 0}</h4>
                                </div>
                                <div className="text-right">
                                     <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] uppercase font-bold tracking-wider mb-1">This Month</p>
                                     <p className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{data?.registration.month_total || 0}</p>
                                </div>
                            </div>

                             <div className="flex gap-2 text-xs font-bold mb-4">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] rounded-full transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-[#410002] dark:bg-[#ffdad6]"></div>
                                    Pending: {data?.registration.pending}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ccebc4] dark:bg-[#0c3b10] text-[#0c200e] dark:text-[#ccebc4] rounded-full transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-[#0c200e] dark:bg-[#ccebc4]"></div>
                                    Done: {data?.registration.consulted}
                                </span>
                             </div>

                             <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5 text-[#006e1c] dark:text-[#88d99d]">
                                        <PhoneCall size={14} />
                                        <span className="font-bold text-sm">Inquiries</span>
                                    </div>
                                    <span className="font-black text-lg text-[#006e1c] dark:text-[#88d99d]">{data?.inquiry.total_today || 0}</span>
                                </div>
                                <div className="flex gap-4 text-xs text-[#43474e] dark:text-[#c4c7c5]">
                                    <span>Quick: <strong>{data?.inquiry.quick || 0}</strong></span>
                                    <span>Test: <strong>{data?.inquiry.test || 0}</strong></span>
                                </div>
                             </div>
                         </div>
                    </motion.div>

                    {/* 2. PATIENTS CARD */}
                    <motion.div variants={itemVariants} className="bg-[#ccebc4] dark:bg-[#203825] rounded-[28px] p-6 text-[#0c200e] dark:text-[#ccebc4] relative overflow-hidden group min-h-[220px] flex flex-col justify-between transition-colors duration-300">
                        <div className="relative z-10 flex justify-between items-start">
                             <div className="flex items-center gap-2">
                                <Users size={20} />
                                <span className="text-xs font-bold uppercase tracking-wider">Patients</span>
                             </div>
                             <span className="bg-[#ffffff]/60 dark:bg-[#000000]/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-[#ffffff]/20 uppercase">Today</span>
                        </div>
                        
                        <div className="relative z-10 text-center my-2">
                            <h3 className="text-6xl font-normal" style={{ fontFamily: 'serif' }}>{data?.patients.today_attendance || 0}</h3>
                            <p className="opacity-80 text-sm font-medium">attended today</p>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-3">
                            <div className="bg-[#ffffff]/40 dark:bg-[#000000]/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                                <p className="text-xl font-bold">{data?.patients.active || 0}</p>
                                <p className="text-[10px] font-bold uppercase opacity-60">Active</p>
                            </div>
                            <div className="bg-[#ffffff]/40 dark:bg-[#000000]/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                                <p className="text-xl font-bold">{data?.patients.inactive || 0}</p>
                                <p className="text-[10px] font-bold uppercase opacity-60">Inactive</p>
                            </div>
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-center mt-3 pt-2 border-t border-[#0c200e]/10 dark:border-[#ccebc4]/10 text-xs font-bold">
                            <span>Total: {data?.patients.total_ever || 0}</span>
                            <span>Paid: {fmt(data?.patients.paid_today || 0)}</span>
                        </div>

                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rotate-12"><Users size={200} /></div>
                    </motion.div>

                    {/* 3. LAB TESTS CARD */}
                    <motion.div variants={itemVariants} className="bg-[#fef7ff] dark:bg-[#1a1c1e] border border-[#cac4d0] dark:border-[#43474e] rounded-[28px] p-6 text-[#1d1b20] dark:text-[#e3e2e6] flex flex-col justify-between min-h-[220px] transition-colors duration-300">
                         <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-[#b3261e] dark:text-[#f2b8b5]">
                                <TestTube2 size={20} />
                                <h4 className="font-bold uppercase tracking-wider text-xs">Lab Tests</h4>
                            </div>
                            <span className="text-3xl font-normal" style={{ fontFamily: 'serif' }}>{data?.tests.today_total || 0}</span>
                         </div>
                         
                         <div className="flex gap-0 mb-4 bg-[#f5f5f5] dark:bg-[#30333b] rounded-xl overflow-hidden transition-colors">
                            <div className="flex-1 py-4 text-center border-r border-[#e0e0e0] dark:border-[#43474e]">
                                <div className="text-3xl font-bold text-[#e6a019] dark:text-[#ffb700]">{data?.tests.pending || 0}</div>
                                <div className="text-[10px] font-bold text-[#e6a019] dark:text-[#ffb700] uppercase tracking-wider mt-1">Pending</div>
                            </div>
                            <div className="flex-1 py-4 text-center">
                                <div className="text-3xl font-bold text-[#006e1c] dark:text-[#88d99d]">{data?.tests.completed || 0}</div>
                                <div className="text-[10px] font-bold text-[#006e1c] dark:text-[#88d99d] uppercase tracking-wider mt-1">Done</div>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 text-xs">
                             <div>
                                 <span className="block text-[#49454f] dark:text-[#c4c7c5]">Revenue</span>
                                 <span className="block text-lg font-bold">{fmt(data?.tests.revenue_today || 0)}</span>
                             </div>
                             <div className="text-right">
                                 <span className="block text-[#49454f] dark:text-[#c4c7c5]">Month Total</span>
                                 <span className="block text-lg font-bold">{data?.tests.total_month || 0}</span>
                             </div>
                         </div>
                    </motion.div>

                    {/* 4. COLLECTIONS CARD */}
                    <motion.div variants={itemVariants} className="bg-[#1a1c1e] dark:bg-black border border-transparent dark:border-[#43474e] rounded-[28px] p-6 text-white flex flex-col justify-between min-h-[220px] transition-colors duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/10 rounded-xl"><Wallet size={18} className="text-[#d0e4ff]" /></div>
                                <span className="text-[#c4c7c5] text-xs font-bold uppercase tracking-wider">Collections</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-[#c4c7c5] text-xs mb-1">Today's Total</p>
                            <div className="text-4xl font-normal text-[#ccebc4] font-mono">{fmt(data?.collections.today_total || 0)}</div>
                        </div>

                        <div className="space-y-1.5 text-xs border-t border-white/10 pt-3 mb-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[#c4c7c5]">Registration</span>
                                <span className="font-mono">{fmt(data?.collections.reg_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#c4c7c5]">Treatment</span>
                                <span className="font-mono">{fmt(data?.collections.treatment_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#c4c7c5]">Lab Tests</span>
                                <span className="font-mono">{fmt(data?.collections.test_amount || 0)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                            <div className="flex items-center gap-1.5 text-[#ffb4ab]">
                                <AlertCircle size={14} />
                                <span>Dues: <strong>{fmt(data?.collections.today_dues || 0)}</strong></span>
                            </div>
                            <div className="text-[#c4c7c5] font-mono text-[10px] opacity-70">
                                Total: {fmt(data?.collections.month_total || 0)}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* --- SCHEDULE & ACTIVITY ROW --- */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* SCHEDULE LIST */}
                    <motion.div variants={itemVariants} className="bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-[28px] p-6 lg:col-span-1 shadow-sm flex flex-col max-h-[400px] transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl text-[#1a1c1e] dark:text-[#e3e2e6] font-bold">Schedule</h3>
                                <p className="text-[#43474e] dark:text-[#c4c7c5] text-xs font-medium mt-1 flex items-center gap-1.5"><Calendar size={12} /> Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <button onClick={() => navigate('/reception/schedule')} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e0e2ec] dark:bg-[#30333b] hover:bg-[#dadae2] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] transition-colors"><ArrowUpRight size={16} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {!data?.schedule?.length ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center h-full opacity-50">
                                    <Clock size={48} className="text-[#e0e2ec] dark:text-[#43474e] mb-2" />
                                    <p className="text-[#43474e] dark:text-[#c4c7c5] text-sm">No appointments scheduled</p>
                                </div>
                            ) : (
                                data.schedule.map((user, i) => (
                                    <motion.div 
                                        key={user.id} 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: i * 0.05 }} 
                                        className="group flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-[#e0e2ec] dark:hover:border-[#43474e] hover:bg-[#f2f6fa] dark:hover:bg-[#30333b] transition-all"
                                    >
                                        <div className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-sm font-bold ${user.status.toLowerCase() === 'pending' ? 'bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6]' : 'bg-[#ccebc4] dark:bg-[#0c3b10] text-[#0c200e] dark:text-[#ccebc4]'}`}>
                                            {user.patient_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] truncate">{user.patient_name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] bg-white dark:bg-[#1e1e1e] border border-[#e0e2ec] dark:border-[#43474e] px-1.5 py-0.5 rounded text-[#43474e] dark:text-[#c4c7c5]">{getTimeRange(user.appointment_time).split('-')[0]}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${user.status.toLowerCase() === 'pending' ? 'text-[#b3261e] dark:text-[#ffb4ab]' : 'text-[#006e1c] dark:text-[#88d99d]'}`}>{user.status}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* ACTIVITY WIDGETS */}
                    <motion.div variants={containerVariants} className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* RECENT ACTIVITY (Black Card) */}
                        <motion.div variants={itemVariants} className="bg-[#1a1c1e] dark:bg-black rounded-[28px] p-6 text-white overflow-hidden relative group transition-colors duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 bg-white/10 rounded-xl"><Users size={16} className="text-[#ccebc4]" /></span>
                                    <h3 className="text-lg font-bold">Recent Activity</h3>
                                </div>
                                <span className="px-2 py-1 bg-[#ccebc4]/20 text-[#ccebc4] text-[10px] font-bold rounded-full border border-[#ccebc4]/20">Live</span>
                            </div>

                            {/* 3 Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="text-center p-2 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-2xl font-bold text-[#a8c7fa]">{data?.registration.today_total || 0}</p>
                                    <p className="text-[10px] text-[#c4c7c5] uppercase tracking-wide mt-1">Registrations</p>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-2xl font-bold text-[#d7cff9]">{data?.tests.today_total || 0}</p>
                                    <p className="text-[10px] text-[#c4c7c5] uppercase tracking-wide mt-1">Tests</p>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-2xl font-bold text-[#ccebc4]">{data?.patients.today_attendance || 0}</p>
                                    <p className="text-[10px] text-[#c4c7c5] uppercase tracking-wide mt-1">Attended</p>
                                </div>
                            </div>

                            {/* Progress Bars */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-[#c4c7c5]">Dues Recovered</span>
                                        <span className="font-bold text-[#ccebc4]">{fmt(data?.collections.treatment_amount || 0)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#ccebc4] rounded-full transition-all duration-1000" 
                                            style={{ 
                                                width: `${(data?.collections.today_total || 0) > 0 
                                                    ? Math.min(100, ((data?.collections.treatment_amount || 0) / (data?.collections.today_total || 1)) * 100) 
                                                    : 0}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-[#c4c7c5]">Appointments</span>
                                        <span className="font-bold text-[#a8c7fa]">
                                            {data?.registration.consulted || 0}/{(data?.registration.pending || 0) + (data?.registration.consulted || 0)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#a8c7fa] rounded-full transition-all duration-1000" 
                                            style={{ 
                                                width: `${((data?.registration.pending || 0) + (data?.registration.consulted || 0)) > 0 
                                                    ? Math.round(((data?.registration.consulted || 0) / ((data?.registration.pending || 0) + (data?.registration.consulted || 0))) * 100) 
                                                    : 0}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-[#c4c7c5]">Tests Completed</span>
                                        <span className="font-bold text-[#d7cff9]">{data?.tests.completed || 0}/{data?.tests.today_total || 0}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#d7cff9] rounded-full transition-all duration-1000" style={{ width: `${(data?.tests.today_total || 0) > 0 ? Math.round(((data?.tests.completed || 0) / (data?.tests.today_total || 1)) * 100) : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* DUES ALERT (Replaces Quick Stats) */}
                        <motion.div variants={itemVariants} className="bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#ffdad6] dark:border-[#93000a] rounded-[28px] p-6 text-[#410002] dark:text-[#ffdad6] flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={20} className="text-[#b3261e] dark:text-[#ffb4ab]" />
                                        <h3 className="text-lg font-bold">Dues Alert</h3>
                                    </div>
                                </div>
                                
                                <div className="text-center py-4">
                                    <h3 className="text-4xl font-black text-[#b3261e] dark:text-[#ffb4ab]">{fmt(data?.collections.today_dues || 0)}</h3>
                                    <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium mt-1">Today's Pending Dues</p>
                                </div>

                                <div className="space-y-2 mt-2">
                                    <div className="flex justify-between items-center bg-[#ffdad6]/30 dark:bg-[#93000a]/30 p-2 rounded-lg transition-colors">
                                        <span className="text-xs font-medium text-[#43474e] dark:text-[#c4c7c5]">Patient Dues</span>
                                        <span className="text-sm font-bold text-[#b3261e] dark:text-[#ffb4ab]">{fmt(data?.collections.patient_dues || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#ffdad6]/30 dark:bg-[#93000a]/30 p-2 rounded-lg transition-colors">
                                        <span className="text-xs font-medium text-[#43474e] dark:text-[#c4c7c5]">Test Dues</span>
                                        <span className="text-sm font-bold text-[#b3261e] dark:text-[#ffb4ab]">{fmt(data?.collections.test_dues || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="w-full py-3 mt-4 bg-[#ffdad6] dark:bg-[#93000a] hover:bg-[#ffb4ab] dark:hover:bg-[#ffb4ab]/80 text-[#410002] dark:text-[#ffdad6] rounded-xl text-sm font-bold transition-colors relative z-10 flex items-center justify-center gap-1 group">
                                View All Pending Dues <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                            
                            {/* Decorative muted background circle */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffdad6]/20 dark:bg-[#93000a]/20 rounded-bl-[100%] pointer-events-none transition-colors"></div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.main>

            {/* --- FAB --- */}
            <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-end">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowChatModal(true)} className="w-12 h-12 bg-[#e0e2ec] dark:bg-[#30333b] text-[#43474e] dark:text-[#c4c7c5] rounded-2xl shadow-lg flex items-center justify-center border border-[#74777f] dark:border-[#8e918f]"><MessageCircle size={24} /></motion.button>
                <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveModal('registration')} className="w-16 h-16 bg-[#ccebc4] hover:bg-[#b0d8a4] text-[#0c200e] rounded-[20px] shadow-xl flex items-center justify-center border border-[#b0d8a4]"><Plus size={32} /></motion.button>
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl overflow-hidden transition-colors duration-300">
                            <div className="px-8 py-6 border-b border-[#e0e2ec] dark:border-[#43474e] flex items-center justify-between bg-[#fdfcff] dark:bg-[#111315] sticky top-0 z-10 transition-colors"><div><h2 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6]" style={{ fontFamily: 'serif' }}>{activeModal === 'registration' && 'New Patient Registration'}{activeModal === 'test' && 'Book Lab Test'}{activeModal === 'inquiry' && 'New Inquiry'}{activeModal === 'test_inquiry' && 'Test Inquiry'}</h2><p className="text-sm text-[#43474e] dark:text-[#c4c7c5]">Enter details below</p></div><button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] flex items-center justify-center transition-colors"><X size={24} className="text-[#43474e] dark:text-[#c4c7c5]" /></button></div>
                            <div className="p-8">
                                {activeModal === 'registration' && (
                                    <form ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <input type="hidden" name="patient_photo_data" value={photoData || ''} />
                                        <div className="space-y-6">
                                            <div><label className={labelClass}>Patient Name *</label><div className="flex items-center gap-2"><input type="text" name="patient_name" required className={inputClass} placeholder="Full Name" /><button type="button" onClick={openPhotoModal} className="w-12 h-12 flex items-center justify-center bg-[#ccebc4] rounded-xl text-[#0c200e] hover:bg-[#b0d8a4] transition-colors"><Camera size={20} /></button></div>{photoData && <div className="mt-2 text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Photo captured</div>}</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="25" /></div>
                                                <div>
                                                    <CustomSelect label="Gender *" value={regGender} onChange={setRegGender} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} placeholder="Select" />
                                                    <input type="hidden" name="gender" value={regGender} />
                                                </div>
                                            </div>
                                            <div><label className={labelClass}>Referred By *</label><input list="referrers" name="referred_by" required className={inputClass} placeholder="Type or select" /><datalist id="referrers">{formOptions?.referrers.map((r: string) => <option key={r} value={r} />)}</datalist></div>
                                            <div>
                                                <CustomSelect 
                                                    label="Chief Complaint *" 
                                                    value={regComplaint} 
                                                    onChange={setRegComplaint} 
                                                    options={[
                                                        ...(formOptions?.chiefComplaints.map(c => ({ label: c.complaint_name, value: c.complaint_code })) || []),
                                                        { label: 'Other', value: 'other' }
                                                    ]} 
                                                    placeholder="Select Complaint" 
                                                />
                                                <input type="hidden" name="conditionType" value={regComplaint} />
                                                {regComplaint === 'other' && (
                                                    <div className="mt-2">
                                                        <input type="text" name="conditionType_other" className={inputClass} placeholder="Specify other complaint" />
                                                    </div>
                                                )}
                                            </div>
                                            <div><label className={labelClass}>Occupation</label><input type="text" name="occupation" className={inputClass} /></div>
                                            <div><label className={labelClass}>Phone No *</label><input type="tel" name="phone" required maxLength={10} className={inputClass} placeholder="1234567890" /></div>
                                            <div><label className={labelClass}>Email</label><input type="email" name="email" className={inputClass} placeholder="patient@example.com" /></div>
                                        </div>
                                        <div className="space-y-6">
                                            <div><label className={labelClass}>Address</label><input type="text" name="address" className={inputClass} placeholder="Full Address" /></div>
                                            <div><label className={labelClass}>Amount (₹) *</label><input type="number" name="amount" required className={inputClass} placeholder="0.00" /></div>
                                            <div>
                                                <div 
                                                    onClick={() => setShowRegPayment(!showRegPayment)}
                                                    className="flex items-center justify-between cursor-pointer p-3 bg-[#e8eaed] dark:bg-[#28282a] rounded-xl hover:bg-[#dadae2] dark:hover:bg-[#30333b] transition-colors mb-3"
                                                >
                                                    <label className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] cursor-pointer">Payment Method *</label>
                                                    <div className="flex items-center gap-2">
                                                        {Object.keys(regPaymentSplits).length > 0 && (
                                                            <span className="text-xs font-bold text-[#006e1c] dark:text-[#88d99d] bg-[#ccebc4] dark:bg-[#0c3b10] px-2 py-1 rounded-full">
                                                                {Object.keys(regPaymentSplits).length} selected
                                                            </span>
                                                        )}
                                                        {showRegPayment ? <ChevronUp size={20} className="text-[#43474e] dark:text-[#c4c7c5]" /> : <ChevronDown size={20} className="text-[#43474e] dark:text-[#c4c7c5]" />}
                                                    </div>
                                                </div>
                                                <AnimatePresence>
                                                {showRegPayment && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                    <div className="bg-[#f8f9fa] dark:bg-[#1e1e20] rounded-xl p-3 border border-[#e0e2ec] dark:border-[#43474e]">
                                                        <div className="space-y-2">
                                                            {formOptions?.paymentMethods.map(m => (
                                                                <div key={m.method_code} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${regPaymentSplits[m.method_code] !== undefined ? 'bg-white dark:bg-[#2c2c2e] shadow-sm border border-[#006e1c]' : 'bg-[#e8eaed] dark:bg-[#28282a] border border-transparent hover:border-[#006e1c]/30'}`}>
                                                                    <div 
                                                                        onClick={() => {
                                                                            const newSplits = { ...regPaymentSplits };
                                                                            if (newSplits[m.method_code] !== undefined) delete newSplits[m.method_code];
                                                                            else newSplits[m.method_code] = 0;
                                                                            setRegPaymentSplits(newSplits);
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                                                    >
                                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${regPaymentSplits[m.method_code] !== undefined ? 'bg-[#006e1c] border-[#006e1c]' : 'border-[#74777f]'}`}>
                                                                            {regPaymentSplits[m.method_code] !== undefined && <Check size={14} className="text-white" strokeWidth={3} />}
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">{m.method_name}</span>
                                                                    </div>
                                                                    {/* Only show input if multiple payment methods are selected */}
                                                                    {regPaymentSplits[m.method_code] !== undefined && Object.keys(regPaymentSplits).length > 1 && (
                                                                        <div className="flex items-center gap-1.5 bg-[#f0f0f0] dark:bg-[#3a3a3c] px-3 py-1.5 rounded-lg min-w-[120px]">
                                                                            <span className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5]">₹</span>
                                                                            <input 
                                                                                type="number" 
                                                                                value={regPaymentSplits[m.method_code] || ''} 
                                                                                onChange={(e) => setRegPaymentSplits({ ...regPaymentSplits, [m.method_code]: parseFloat(e.target.value) || 0 })}
                                                                                className="flex-1 bg-transparent border-none text-sm font-semibold text-right outline-none appearance-none text-[#1a1c1e] dark:text-[#e3e2e6]"
                                                                                placeholder="0.00"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-3 pt-2 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center">
                                                            <span className="text-[10px] font-black uppercase tracking-wide text-[#43474e] dark:text-[#c4c7c5]">
                                                                {Object.keys(regPaymentSplits).length === 1 ? 'Payment Method Selected' : 'Total Split'}
                                                            </span>
                                                            <span className="text-sm font-black text-[#006e1c] dark:text-[#88d99d]">
                                                                {Object.keys(regPaymentSplits).length === 1 
                                                                    ? `Will use Amount field` 
                                                                    : `₹${Object.values(regPaymentSplits).reduce((a, b) => a + b, 0).toLocaleString()}`
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Additional Fields Section */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className={labelClass}>Remarks</label>
                                                    <input type="text" name="remarks" className={inputClass} placeholder="Additional remarks..." />
                                                </div>
                                                <div>
                                                    <CustomSelect label="How did you hear?" value={regSource} onChange={setRegSource} options={formOptions?.referralSources.map(s => ({ label: s.source_name, value: s.source_code })) || []} placeholder="Select" />
                                                    <input type="hidden" name="referralSource" value={regSource} />
                                                </div>
                                                <div>
                                                    <CustomSelect label="Consultation Type *" value={regConsultType} onChange={setRegConsultType} options={formOptions?.consultationTypes.map(t => ({ label: t.consultation_name, value: t.consultation_code })) || []} placeholder="Select" />
                                                    <input type="hidden" name="inquiry_type" value={regConsultType} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Appointment Date</label>
                                                    <div onClick={() => { setActiveDateField('registration'); setShowDatePicker(true); }} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                        <span>{new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        <Calendar size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                    </div>
                                                    <input type="hidden" name="appointment_date" value={appointmentDate} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Time Slot *</label>
                                                    <div onClick={() => setShowTimePicker(true)} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                        <span>{timeSlots?.find((t: any) => t.time === appointmentTime)?.label || 'Select Time'}</span>
                                                        <Clock size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                    </div>
                                                    <input type="hidden" name="appointment_time" value={appointmentTime} />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                )}
                                {activeModal === 'test' && (
                                    <form ref={formRef} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} placeholder="Full Name" /></div>
                                            <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="25" /></div>
                                            <div>
                                                <CustomSelect label="Gender *" value={testGender} onChange={setTestGender} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} placeholder="Select" />
                                                <input type="hidden" name="gender" value={testGender} />
                                            </div>
                                            <div><label className={labelClass}>Date of Birth</label><input type="date" name="dob" className={inputClass} /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div><label className={labelClass}>Parents/Guardian</label><input type="text" name="parents" className={inputClass} placeholder="Name" /></div>
                                            <div><label className={labelClass}>Relation</label><input type="text" name="relation" className={inputClass} placeholder="e.g. Father" /></div>
                                            <div><label className={labelClass}>Phone</label><input type="tel" name="phone_number" maxLength={10} className={inputClass} placeholder="1234567890" /></div>
                                            <div><label className={labelClass}>Alt. Phone</label><input type="tel" name="alternate_phone_no" maxLength={10} className={inputClass} placeholder="Optional" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Referred By *</label><input list="test_referrers" name="referred_by" required className={inputClass} placeholder="Type or select" /><datalist id="test_referrers">{formOptions?.referrers.map((r: string) => <option key={r} value={r} />)}</datalist></div>
                                            <div>
                                                <CustomSelect label="Limb" value={testLimb} onChange={setTestLimb} options={formOptions?.limbTypes.map((l: any) => ({ label: l.limb_name, value: l.limb_code })) || []} placeholder="Select Limb" />
                                                <input type="hidden" name="limb" value={testLimb} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Select Tests *</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                                {formOptions?.testTypes?.filter((t: any) => t.test_code !== 'other').map((test: any) => (
                                                    <div key={test.test_code} onClick={() => handleTestCheckChange(test.test_code, !selectedTests[test.test_code]?.checked)} className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${selectedTests[test.test_code]?.checked ? 'border-[#006e1c] bg-[#ccebc4]/30 dark:bg-[#0c3b10]/30' : 'border-transparent bg-[#e0e2ec]/50 dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#30333b]'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTests[test.test_code]?.checked ? 'bg-[#006e1c] border-[#006e1c]' : 'border-[#43474e]'}`}>{selectedTests[test.test_code]?.checked && <Check size={10} className="text-white" />}</div>
                                                            <span className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6]">{test.test_name}</span>
                                                        </div>
                                                        {selectedTests[test.test_code]?.checked && (
                                                            <input type="number" step="0.01" value={selectedTests[test.test_code]?.amount || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => handleTestAmountChange(test.test_code, e.target.value)} className="w-full bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-2 py-1 text-sm outline-none" placeholder="Amount" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Other Test */}
                                            {formOptions?.testTypes?.filter((t: any) => t.test_code === 'other').map((test: any) => (
                                                <div key={test.test_code} className={`mt-3 p-3 border rounded-xl transition-all ${selectedTests[test.test_code]?.checked ? 'border-[#006e1c] bg-[#ccebc4]/30' : 'border-transparent bg-[#e0e2ec]/50 dark:bg-[#1a1c1e]'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div onClick={() => handleTestCheckChange(test.test_code, !selectedTests[test.test_code]?.checked)} className="flex items-center gap-2 cursor-pointer">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTests[test.test_code]?.checked ? 'bg-[#006e1c] border-[#006e1c]' : 'border-[#43474e]'}`}>{selectedTests[test.test_code]?.checked && <Check size={10} className="text-white" />}</div>
                                                            <span className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6]">{test.test_name}</span>
                                                        </div>
                                                        {selectedTests[test.test_code]?.checked && (
                                                            <>
                                                                <input type="text" value={otherTestName} onChange={(e) => setOtherTestName(e.target.value)} placeholder="Test Name" className="flex-1 bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-3 py-1.5 text-sm outline-none" />
                                                                <input type="number" step="0.01" value={selectedTests[test.test_code]?.amount || ''} onChange={(e) => handleTestAmountChange(test.test_code, e.target.value)} className="w-32 bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-3 py-1.5 text-sm outline-none" placeholder="Amount" />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className={labelClass}>Date of Visit *</label>
                                                <div onClick={() => { setActiveDateField('test_visit'); setShowDatePicker(true); }} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                    <span>{new Date(testVisitDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    <Calendar size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                </div>
                                                <input type="hidden" name="visit_date" value={testVisitDate} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Assigned Date *</label>
                                                <div onClick={() => { setActiveDateField('test_assigned'); setShowDatePicker(true); }} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                    <span>{new Date(testAssignedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    <Calendar size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                </div>
                                                <input type="hidden" name="assigned_test_date" value={testAssignedDate} />
                                            </div>
                                            <div>
                                                <CustomSelect label="Test Done By *" value={testDoneBy} onChange={setTestDoneBy} options={formOptions?.staffMembers?.map((s: any) => ({ label: s.staff_name, value: s.staff_name })) || []} placeholder="Select" />
                                                <input type="hidden" name="test_done_by" value={testDoneBy} />
                                            </div>
                                            <div><label className={labelClass}>Receipt No</label><input type="text" name="receipt_no" className={inputClass} placeholder="Optional" /></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#f2f6fa] dark:bg-[#1a1c1e] p-4 rounded-xl">
                                            <div><label className={labelClass}>Total Amount *</label><input type="number" name="total_amount" required className={`${inputClass} font-bold`} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></div>
                                            <div><label className={labelClass}>Advance</label><input type="number" name="advance_amount" className={inputClass} value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="0.00" /></div>
                                            <div><label className={labelClass}>Discount</label><input type="number" name="discount" className={inputClass} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0.00" /></div>
                                            <div><label className={labelClass}>Due Amount</label><input type="text" name="due_amount" readOnly className={`${inputClass} bg-transparent border border-[#ffdad6] text-[#b3261e] dark:text-[#ffb4ab] font-bold`} value={dueAmount} /></div>
                                        </div>

                                        {/* Payment Method Section - Moved to end */}
                                        <div>
                                            <div 
                                                onClick={() => setShowTestPayment(!showTestPayment)}
                                                className="flex items-center justify-between cursor-pointer p-3 bg-[#e8eaed] dark:bg-[#28282a] rounded-xl hover:bg-[#dadae2] dark:hover:bg-[#30333b] transition-colors mb-3"
                                            >
                                                <label className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] cursor-pointer">Payment Method *</label>
                                                <div className="flex items-center gap-2">
                                                    {Object.keys(testPaymentSplits).length > 0 && (
                                                        <span className="text-xs font-bold text-[#006e1c] dark:text-[#88d99d] bg-[#ccebc4] dark:bg-[#0c3b10] px-2 py-1 rounded-full">
                                                            {Object.keys(testPaymentSplits).length} selected
                                                        </span>
                                                    )}
                                                    {showTestPayment ? <ChevronUp size={20} className="text-[#43474e] dark:text-[#c4c7c5]" /> : <ChevronDown size={20} className="text-[#43474e] dark:text-[#c4c7c5]" />}
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                            {showTestPayment && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                <div className="bg-[#f8f9fa] dark:bg-[#1e1e20] rounded-xl p-3 border border-[#e0e2ec] dark:border-[#43474e]">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {formOptions?.paymentMethods.map(m => (
                                                            <div key={m.method_code} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${testPaymentSplits[m.method_code] !== undefined ? 'bg-white dark:bg-[#2c2c2e] shadow-sm border border-[#006e1c]' : 'bg-[#e8eaed] dark:bg-[#28282a] border border-transparent hover:border-[#006e1c]/30'}`}>
                                                                <div 
                                                                    onClick={() => {
                                                                        const newSplits = { ...testPaymentSplits };
                                                                        if (newSplits[m.method_code] !== undefined) delete newSplits[m.method_code];
                                                                        else newSplits[m.method_code] = 0;
                                                                        setTestPaymentSplits(newSplits);
                                                                    }}
                                                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                                                >
                                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${testPaymentSplits[m.method_code] !== undefined ? 'bg-[#006e1c] border-[#006e1c]' : 'border-[#74777f]'}`}>
                                                                        {testPaymentSplits[m.method_code] !== undefined && <Check size={14} className="text-white" strokeWidth={3} />}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">{m.method_name}</span>
                                                                </div>
                                                                {testPaymentSplits[m.method_code] !== undefined && Object.keys(testPaymentSplits).length > 1 && (
                                                                    <div className="flex items-center gap-1.5 bg-[#f0f0f0] dark:bg-[#3a3a3c] px-3 py-1.5 rounded-lg min-w-[120px]">
                                                                        <span className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5]">₹</span>
                                                                        <input 
                                                                            type="number" 
                                                                            value={testPaymentSplits[m.method_code] || ''} 
                                                                            onChange={(e) => setTestPaymentSplits({ ...testPaymentSplits, [m.method_code]: parseFloat(e.target.value) || 0 })}
                                                                            className="flex-1 bg-transparent border-none text-sm font-semibold text-right outline-none appearance-none text-[#1a1c1e] dark:text-[#e3e2e6]"
                                                                            placeholder="0.00"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 pt-2 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-wide text-[#43474e] dark:text-[#c4c7c5]">
                                                            {Object.keys(testPaymentSplits).length === 1 ? 'Payment Method Selected' : 'Advance Split'}
                                                        </span>
                                                        <span className="text-sm font-black text-[#006e1c] dark:text-[#88d99d]">
                                                            {Object.keys(testPaymentSplits).length === 1 
                                                                ? `Will use Advance field` 
                                                                : `₹${Object.values(testPaymentSplits).reduce((a, b) => a + b, 0).toLocaleString()}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>
                                        </div>

                                    </form>
                                )}
                                {(activeModal === 'inquiry' || activeModal === 'test_inquiry') && (
                                    <form ref={formRef} className="space-y-6">
                                        {activeModal === 'inquiry' && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} placeholder="Full Name" /></div>
                                                    <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="e.g. 25 years" /></div>
                                                    
                                                    <div>
                                                        <CustomSelect label="Gender *" value={inqGender} onChange={setInqGender} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} placeholder="Select" />
                                                        <input type="hidden" name="gender" value={inqGender} />
                                                    </div>
                                                    <div>
                                                        <CustomSelect label="Inquiry Service *" value={inqService} onChange={setInqService} options={formOptions?.inquiryServiceTypes.map(s => ({ label: s.service_name, value: s.service_code })) || []} placeholder="Select" />
                                                        <input type="hidden" name="inquiry_type" value={inqService} />
                                                    </div>
                                                    
                                                    <div>
                                                        <CustomSelect label="How did you hear? *" value={inqSource} onChange={setInqSource} options={formOptions?.referralSources.map(s => ({ label: s.source_name, value: s.source_code })) || []} placeholder="Select" />
                                                        <input type="hidden" name="referralSource" value={inqSource} />
                                                    </div>
                                                    <div>
                                                        <CustomSelect label="Communication Type *" value={inqCommType} onChange={setInqCommType} options={['Call', 'Walk-in', 'Email', 'Chat', 'Whatsapp'].map(v => ({ label: v, value: v }))} placeholder="Select" />
                                                        <input type="hidden" name="communication_type" value={inqCommType} />
                                                    </div>
                                                    
                                                    <div>
                                                        <CustomSelect label="Chief Complaint *" value={inqComplaint} onChange={setInqComplaint} options={formOptions?.chiefComplaints.map(c => ({ label: c.complaint_name, value: c.complaint_code })) || []} placeholder="Select" />
                                                        <input type="hidden" name="conditionType" value={inqComplaint} />
                                                        {inqComplaint === 'other' && (
                                                            <div className="mt-2">
                                                                <input type="text" name="conditionType_other" className={inputClass} placeholder="Specify other complaint" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div><label className={labelClass}>Mobile No. *</label><input type="tel" name="phone" required maxLength={10} className={inputClass} placeholder="1234567890" /></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelClass}>Plan to Visit Date *</label>
                                                        <div onClick={() => { setActiveDateField('inquiry'); setShowDatePicker(true); }} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                            <span>{new Date(inquiryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                            <Calendar size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                        </div>
                                                        <input type="hidden" name="expected_date" value={inquiryDate} />
                                                    </div>
                                                    <div><label className={labelClass}>Remarks</label><textarea name="remarks" className={`${inputClass} min-h-[50px] resize-none pt-3`} placeholder="Notes..."></textarea></div>
                                                </div>
                                            </>
                                        )}
                                        
                                        {activeModal === 'test_inquiry' && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} placeholder="Full Name" /></div>
                                                    <div>
                                                        <CustomSelect label="Test Name *" value={tiTestName} onChange={setTiTestName} options={formOptions?.testTypes.map(t => ({ label: t.test_name, value: t.test_code })) || []} placeholder="Select" />
                                                        <input type="hidden" name="test_name" value={tiTestName} />
                                                    </div>
                                                    
                                                    <div><label className={labelClass}>Referred By *</label><input list="ti_referrers" name="referred_by" required className={inputClass} placeholder="Type" /><datalist id="ti_referrers">{formOptions?.referrers.map(r => <option key={r} value={r} />)}</datalist></div>
                                                    <div><label className={labelClass}>Mobile No. *</label><input type="tel" name="phone_number" required maxLength={10} className={inputClass} /></div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Expected Visit Date *</label>
                                                    <div onClick={() => { setActiveDateField('test_inquiry'); setShowDatePicker(true); }} className={`${inputClass} cursor-pointer flex items-center justify-between`}>
                                                        <span>{new Date(testInquiryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        <Calendar size={18} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                    </div>
                                                    <input type="hidden" name="expected_visit_date" value={testInquiryDate} />
                                                </div>
                                            </>
                                        )}
                                    </form>
                                )}
                            </div>
                            <div className="p-6 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#111315] sticky bottom-0 z-10 transition-colors">{submitMessage ? <span className={`text-sm font-bold px-4 py-2 rounded-lg ${submitMessage.type === 'success' ? 'bg-[#ccebc4] text-[#0c200e]' : 'bg-[#ffdad6] text-[#410002]'}`}>{submitMessage.text}</span> : <span></span>}<div className="flex gap-4"><button onClick={closeModal} className="px-6 py-3 text-[#006e1c] dark:text-[#88d99d] font-bold hover:bg-[#ccebc4]/30 rounded-full transition-colors">Cancel</button><button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-[#006e1c] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-[#005313] transition-all disabled:opacity-50 flex items-center gap-2">{isSubmitting && <Loader2 size={18} className="animate-spin" />}Submit</button></div></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- PHOTO MODAL --- */}
            <AnimatePresence>{showPhotoModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4"><div className="bg-[#1a1c1e] p-4 rounded-[28px] w-full max-w-lg shadow-2xl"><h3 className="text-white text-lg font-bold mb-4 ml-2">Capture Photo</h3><div className="bg-black rounded-xl overflow-hidden aspect-video border border-[#43474e] relative"><video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${photoCaptured ? 'hidden' : ''}`}></video><canvas ref={canvasRef} className={`w-full h-full object-cover ${photoCaptured ? '' : 'hidden'}`}></canvas></div><div className="flex justify-end gap-3 mt-4"><button onClick={closePhotoModal} className="px-6 py-2 text-[#c4c7c5] font-bold hover:text-white transition-colors">Close</button>{!photoCaptured ? (<button onClick={capturePhoto} className="px-6 py-2 bg-[#d0e4ff] text-[#001d36] rounded-full font-bold hover:bg-[#b0d2ff]">Snap</button>) : (<><button onClick={retakePhoto} className="px-6 py-2 bg-[#43474e] text-white rounded-full font-bold hover:bg-[#5f6368]">Retake</button><button onClick={usePhoto} className="px-6 py-2 bg-[#ccebc4] text-[#0c200e] rounded-full font-bold hover:bg-[#b0d8a4]">Use Photo</button></>)}</div></div></motion.div>)}</AnimatePresence>
            
            {/* --- CHAT MODAL --- */}
            <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
            {/* --- DATE PICKER --- */}
            <AnimatePresence>
                {showDatePicker && (
                    <DatePicker 
                        value={
                            activeDateField === 'registration' ? appointmentDate :
                            activeDateField === 'test_visit' ? testVisitDate :
                            activeDateField === 'test_assigned' ? testAssignedDate :
                            activeDateField === 'inquiry' ? inquiryDate :
                            activeDateField === 'test_inquiry' ? testInquiryDate : ''
                        } 
                        onChange={(d: string) => {
                            if (activeDateField === 'registration') handleAppointmentDateChange(d);
                            else if (activeDateField === 'test_visit') setTestVisitDate(d);
                            else if (activeDateField === 'test_assigned') setTestAssignedDate(d);
                            else if (activeDateField === 'inquiry') setInquiryDate(d);
                            else if (activeDateField === 'test_inquiry') setTestInquiryDate(d);
                        }} 
                        onClose={() => setShowDatePicker(false)} 
                    />
                )}
            </AnimatePresence>
            {/* --- TIME PICKER --- */}
            <AnimatePresence>
                {showTimePicker && (
                    <TimePicker
                        value={appointmentTime}
                        onChange={(t: string) => setAppointmentTime(t)}
                        onClose={() => setShowTimePicker(false)}
                        slots={timeSlots}
                    />
                )}
            </AnimatePresence>
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
                onConfirm={() => {
                    logout();
                    navigate('/login');
                }} 
            />
            <GlobalSearch 
                isOpen={showGlobalSearch} 
                onClose={() => setShowGlobalSearch(false)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
            />
        </div>
    );
};

export default ReceptionDashboard;
