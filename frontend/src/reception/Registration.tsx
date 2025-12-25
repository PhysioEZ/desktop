import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    ChevronLeft, ChevronRight, Edit2, ChevronDown,
    RefreshCw, Phone, Stethoscope, FileText, X, Printer, Check, RotateCcw, Clock, UserPlus, Mic, AlertCircle, Trash2, CheckCircle2, Search,
    Bell, Moon, Sun, LogOut, User
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { format, parseISO, isValid } from 'date-fns';

const Registration = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    
    // UI State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } >({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    // Header State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [isDark, setIsDark] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLButtonElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Header Effects
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
        if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
        if (notifRef.current && !notifRef.current.contains(e.target as Node) && !(e.target as Element).closest('#notif-popup')) setShowNotifPopup(false);
        if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfilePopup(false);
    };
    useEffect(() => { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

    // Notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/reception/notifications.php?employee_id=${user?.employee_id || ''}`);
                const data = await res.json();
                if (data.success || data.status === 'success') { setNotifications(data.notifications || []); setUnreadCount(data.unread_count || 0); }
            } catch (err) { console.error(err); }
        };
        if(user?.employee_id) { fetchNotifs(); const inv = setInterval(fetchNotifs, 30000); return () => clearInterval(inv); }
    }, [user?.employee_id]);

    // Global Search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!user?.branch_id || globalSearchQuery.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/reception/search_patients.php?branch_id=${user.branch_id}&q=${encodeURIComponent(globalSearchQuery)}`);
                const data = await res.json();
                if (data.success) { setSearchResults(data.patients || []); setShowSearchResults(true); }
            } catch (err) { console.error(err); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [globalSearchQuery, user?.branch_id]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [referrerFilter, setReferrerFilter] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        total_pages: 1
    });

    const [options, setOptions] = useState<{
        referred_by: string[];
        conditions: string[];
        types: string[];
    }>({ referred_by: [], conditions: [], types: [] });

    const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial load ref to prevent multiple spinners
    const isFirstLoad = useRef(true);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Background scroll lock
    useEffect(() => {
        if (isDetailsModalOpen || isBillModalOpen || confirmModal.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isDetailsModalOpen, isBillModalOpen, confirmModal.isOpen]);

    const fetchRegistrations = useCallback(async () => {
        if (!user?.branch_id) return;
        
        // Show big loader only on first mount or when swapping pages for the first time
        if (isFirstLoad.current) setIsLoading(true);
        setIsSearching(true);

        try {
            const res = await fetch(`${API_BASE_URL}/reception/registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch',
                    branch_id: user.branch_id,
                    search: debouncedSearch,
                    status: statusFilter,
                    referred_by: referrerFilter,
                    condition: conditionFilter,
                    page: currentPage,
                    limit: 12
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setRegistrations(data.data || []);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch registrations:', err);
        } finally {
            setIsLoading(false);
            setIsSearching(false);
            isFirstLoad.current = false;
        }
    }, [user?.branch_id, debouncedSearch, statusFilter, referrerFilter, conditionFilter, currentPage]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    const fetchOptions = useCallback(async () => {
        if (!user?.branch_id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/reception/registration.php?action=options&branch_id=${user.branch_id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setOptions(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch options:', err);
        }
    }, [user?.branch_id]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        // Optimistic update
        setRegistrations(prev => prev.map(reg => 
            reg.registration_id === id ? { ...reg, status: newStatus } : reg
        ));

        try {
            const res = await fetch(`${API_BASE_URL}/reception/registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    id,
                    status: newStatus
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Registration status updated to ${newStatus}`, 'success');
                fetchRegistrations();
            } else {
                showToast(data.message || 'Failed to update status', 'error');
                fetchRegistrations(); // Revert on failure
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            showToast('An error occurred while updating status', 'error');
            fetchRegistrations(); // Revert on error
        }
    };

    const fetchDetails = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/reception/registration.php?action=details&id=${id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setSelectedRegistration(data.data);
                setIsEditing(false); // Reset edit mode when opening new details
                setIsDetailsModalOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch details:', err);
        }
    };

    const handleSaveDetails = async () => {
        if (!selectedRegistration) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reception/registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_details',
                    registration_id: selectedRegistration.registration_id,
                    ...editData
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setIsEditing(false);
                fetchDetails(selectedRegistration.registration_id);
                fetchRegistrations();
            }
        } catch (err) {
            console.error('Failed to save details:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = () => {
        setEditData({ ...selectedRegistration });
        setIsEditing(true);
    };

    const navigateToBill = (id: number) => {
        setIsBillModalOpen(true);
    };

    const handlePrintBill = () => {
        const printContent = document.getElementById('printable-bill');
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Print Bill</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>@media print { body { padding: 0 !important; } .no-print { display: none; } } body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }</style>');
        printWindow.document.write('</head><body class="p-10 bg-white">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Wait for Tailwind to process or images to load
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    };

    const formatDateSafe = (dateStr: string, formatPattern: string) => {
        if (!dateStr) return 'N/A';
        const date = parseISO(dateStr.replace(' ', 'T'));
        return isValid(date) ? format(date, formatPattern) : 'Invalid Date';
    };



    const getStatusColors = (status: string) => {
        const s = status?.toLowerCase()?.trim();
        switch (s) {
            case 'consulted': return 'bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d] border-[#ccebc4] dark:border-[#0c3b10]';
            case 'closed': return 'bg-[#ffdad6]/30 text-[#93000a] dark:text-[#ffb4ab] border-[#ffdad6] dark:border-[#93000a]';
            case 'pending': return 'bg-[#ffefc2]/30 text-[#675402] dark:text-[#dec650] border-[#ffefc2] dark:border-[#675402]';
            default: return 'bg-[#e0e2ec]/30 text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]';
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
            {/* --- TOP HEADER (Fixed) --- */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcff]/90 dark:bg-[#111315]/90 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300 h-16">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/reception/dashboard')}>
                         <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold shadow-sm">PS</div>
                         <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>ProSpine</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4">
                    {/* Global Search */}
                    <div ref={searchRef} className="hidden md:flex items-center relative z-50">
                        <div className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300">
                            <Search size={18} className="text-[#43474e] dark:text-[#c4c7c5] mr-2" />
                            <input type="text" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f]" />
                        </div>
                        <AnimatePresence>
                            {showSearchResults && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#fdfcff] rounded-[20px] shadow-xl border border-[#e0e2ec] overflow-hidden max-h-[400px] overflow-y-auto">
                                    {searchResults.map((p) => (
                                        <div key={p.patient_id} onClick={() => { setGlobalSearchQuery(''); setShowSearchResults(false); }} className="p-3 hover:bg-[#e0e2ec] cursor-pointer border-b border-[#e0e2ec] last:border-0">
                                            <p className="font-bold text-[#1a1c1e]">{p.patient_name}</p>
                                            <p className="text-xs text-[#43474e]">{p.phone_number}</p>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && <div className="p-4 text-center text-[#43474e]">No patients found</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={toggleTheme} className="p-2.5 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors">
                        <Moon size={20} className="block dark:hidden" />
                        <Sun size={20} className="hidden dark:block" />
                    </button>

                    <div className="relative">
                        <button ref={notifRef} onClick={() => { setShowNotifPopup(!showNotifPopup); setShowProfilePopup(false); }} className="p-2.5 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b3261e] rounded-full"></span>}
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
                                     <button onClick={() => { logout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"><LogOut size={18} /> Logout</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* --- NAVIGATION CHIPS (Fixed) --- */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-[#fdfcff]/90 dark:bg-[#111315]/90 backdrop-blur-md border-b border-[#e0e2ec] dark:border-[#43474e] h-14 flex items-center">
                <div className="flex gap-3 overflow-x-auto px-6 scrollbar-hide w-full h-full items-center">
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
                        <button key={nav.label} onClick={() => { if (nav.label !== 'Registration') navigate(nav.path); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${nav.label === 'Registration' ? 'bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md' : 'bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]'}`}>{nav.label}</button>
                    ))}
                </div>
            </div>

            {/* --- MAIN PAGE CONTENT --- */}
            <div className="max-w-[1600px] mx-auto p-6 pt-36">
                {/* Page Title & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight mb-1" style={{ fontFamily: 'serif' }}>Registration</h1>
                        <p className="text-base text-[#43474e] dark:text-[#c4c7c5] font-medium">Manage and monitor patient registrations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/reception/registration/cancelled')} className="flex items-center gap-2 px-5 py-2.5 bg-[#ffdad6] text-[#410002] rounded-[16px] text-sm font-bold hover:bg-[#ffb4ab] transition-all"><Trash2 size={18} /> Cancelled History</button>
                        <button onClick={() => { isFirstLoad.current = true; fetchRegistrations(); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#ccebc4] text-[#002105] rounded-[16px] text-sm font-bold hover:bg-[#b0f2a0] transition-all"><RefreshCw size={18} className={isSearching ? 'animate-spin' : ''} /> Refresh</button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[#f0f4f9] dark:bg-[#1e2022] rounded-[24px] p-2 mb-8 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[20px] shadow-sm px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-[#006e1c] dark:focus-within:border-[#88d99d] transition-all">
                        <Search className="text-[#43474e] dark:text-[#c4c7c5]" size={20} />
                        <input type="text" placeholder="Search by name, phone or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-base w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] font-medium" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                         <CustomSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} options={[{label:'All Status', value:''}, {label:'Pending', value:'pending'}, {label:'Consulted', value:'consulted'}, {label:'Closed', value:'closed'}]} placeholder="Status" className="min-w-[150px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold" />
                         <CustomSelect value={referrerFilter} onChange={(v) => { setReferrerFilter(v); setCurrentPage(1); }} options={[{label:'All Referrers', value:''}, ...options.referred_by.map(r => ({label:r, value:r}))]} placeholder="Referrer" className="min-w-[160px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold" />
                         <CustomSelect value={conditionFilter} onChange={(v) => { setConditionFilter(v); setCurrentPage(1); }} options={[{label:'All Conditions', value:''}, ...options.conditions.map(c => ({label:c, value:c}))]} placeholder="Condition" className="min-w-[160px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold" />
                    </div>
                </div>

                {/* Cards Grid */}
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                         <div className="w-12 h-12 border-4 border-[#006e1c] border-t-transparent rounded-full animate-spin mb-4" />
                         <p className="text-base font-bold text-[#43474e] dark:text-[#c4c7c5]">Loading registrations...</p>
                     </div>
                ) : registrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                         <div className="w-20 h-20 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full flex items-center justify-center mb-6 text-[#1a1c1e] dark:text-[#e3e2e6]"><Search size={32} /></div>
                         <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">No registrations found</h3>
                         <p className="text-[#43474e] dark:text-[#c4c7c5] mt-2">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {registrations.map((reg, idx) => (
                            <motion.div 
                                key={reg.registration_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                onClick={() => fetchDetails(reg.registration_id)}
                                className="group bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[24px] border border-[#e0e2ec] dark:border-[#43474e] p-5 hover:shadow-xl hover:border-[#ccebc4] dark:hover:border-[#005313] transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 z-10">
                                     <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColors(reg.status)} bg-opacity-30 hover:opacity-80 transition-opacity`}>
                                         <span className="pointer-events-none truncate max-w-[80px]">{reg.status}</span>
                                         <ChevronDown size={12} className="pointer-events-none opacity-70" />
                                         <select
                                            value={reg.status?.toLowerCase() || ''}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleUpdateStatus(reg.registration_id, e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                                         >
                                             <option value="pending">Pending</option>
                                             <option value="consulted">Consulted</option>
                                             <option value="closed">Closed</option>
                                         </select>
                                     </div>
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-[18px] bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[#002105] dark:text-[#ccebc4] font-black text-xl shadow-inner border border-[#ccebc4] dark:border-[#0c3b10] overflow-hidden">
                                        {reg.patient_photo_path ? <img src={`${reg.patient_photo_path}`} className="w-full h-full object-cover" alt="" /> : (reg.patient_name?.charAt(0) || '?')}
                                    </div>
                                    <div className="pt-0.5">
                                        <h3 className="font-bold text-lg text-[#1a1c1e] dark:text-[#e3e2e6] leading-tight line-clamp-1">{reg.patient_name}</h3>
                                        <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium mt-1 flex items-center gap-1"><Phone size={10} /> {reg.phone_number}</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-[#f0f4f9] dark:bg-[#30333b] rounded-md text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5]">#{reg.patient_uid || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between p-3 bg-[#f2f6fa] dark:bg-[#111315] rounded-[16px]">
                                        <div><p className="text-[10px] font-bold text-[#74777f] dark:text-[#8e918f] uppercase">Amount</p><p className="text-sm font-black text-[#1a1c1e] dark:text-[#e3e2e6]">₹{reg.consultation_amount}</p></div>
                                        <div className="text-right"><p className="text-[10px] font-bold text-[#74777f] dark:text-[#8e918f] uppercase">Date</p><p className="text-xs font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{formatDateSafe(reg.created_at, 'dd MMM')}</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                         <div className="p-2.5 border border-[#e0e2ec] dark:border-[#43474e] rounded-[12px]">
                                             <p className="text-[9px] font-bold text-[#74777f] dark:text-[#8e918f] uppercase mb-0.5">Type</p>
                                             <p className="text-xs font-bold text-[#1a1c1e] dark:text-[#e3e2e6] truncate">{reg.consultation_type}</p>
                                         </div>
                                         <div className="p-2.5 border border-[#e0e2ec] dark:border-[#43474e] rounded-[12px]">
                                             <p className="text-[9px] font-bold text-[#74777f] dark:text-[#8e918f] uppercase mb-0.5">Condition</p>
                                             <p className="text-xs font-bold text-[#1a1c1e] dark:text-[#e3e2e6] truncate" title={reg.chief_complain}>{reg.chief_complain || '-'}</p>
                                         </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-[#e0e2ec] dark:border-[#43474e]">
                                    <p className="text-[10px] font-medium text-[#43474e] dark:text-[#c4c7c5] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#74777f]"></span> Ref: {reg.reffered_by || 'Direct'}
                                    </p>
                                    <button className="w-8 h-8 rounded-full bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[#006e1c] dark:text-[#88d99d] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                
                {/* Pagination (Floating) */}
                {!isLoading && registrations.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1c1e] dark:bg-[#e3e2e6] text-white dark:text-[#1a1c1e] px-4 py-2 rounded-full shadow-2xl z-30 flex items-center gap-4">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || isSearching}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-bold tracking-widest">{currentPage} / {pagination.total_pages}</span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                            disabled={currentPage === pagination.total_pages || isSearching}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {isDetailsModalOpen && selectedRegistration && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailsModalOpen(false)}
                            className="absolute inset-0 bg-[#001f25]/50 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-6xl max-h-[95vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-[#e0e2ec] dark:border-[#43474e]"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                        Registration Details
                                    </h2>
                                    <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] mt-1">View and manage patient registration</p>
                                </div>
                                <button 
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 lg:p-1.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#e3e2e6] rounded-full hover:bg-[#ffdad6] hover:text-[#410002] transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Patient Info Bar */}
                            <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                        {selectedRegistration.patient_name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-[#43474e] dark:text-[#c4c7c5] text-xs font-medium">
                                        <span className="bg-[#e0e2ec] dark:bg-[#43474e] px-2 py-0.5 rounded text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5]">ID: #{selectedRegistration.registration_id}</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {formatDateSafe(selectedRegistration.created_at, 'yyyy-MM-dd HH:mm:ss')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => navigateToBill(selectedRegistration.registration_id)}
                                        className="p-2 text-[#43474e] dark:text-[#c4c7c5] hover:text-[#1a1c1e] dark:hover:text-[#e3e2e6] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-xl transition-all border border-[#e0e2ec] dark:border-[#43474e]"
                                        title="Print Bill"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    {!isEditing ? (
                                        <button onClick={startEditing} className="flex items-center gap-2 px-5 py-2 bg-[#006e1c] text-white rounded-full text-xs font-bold hover:bg-[#005313] transition-all shadow-md">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="flex items-center gap-2 px-5 py-2 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5] rounded-xl text-xs font-bold hover:bg-[#c4c7c5] dark:hover:bg-[#5b5e66] transition-all border border-[#74777f] dark:border-[#8e918f]"
                                        >
                                            <RotateCcw size={14} />
                                            Cancel
                                        </button>
                                    )}
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all ${getStatusColors(selectedRegistration.status)}`}>
                                        {selectedRegistration.status}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Cancel Registration?',
                                                message: 'Are you sure you want to cancel this registration? It will be moved to the Cancelled History for refund processing.',
                                                onConfirm: () => {
                                                    handleUpdateStatus(selectedRegistration.registration_id, 'closed');
                                                    setIsDetailsModalOpen(false);
                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                        className="p-2 text-[#b3261e] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/50 rounded-xl transition-all border border-[#e0e2ec] dark:border-[#43474e]"
                                        title="Cancel Registration"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content Container */}
                            <div className="flex-1 overflow-auto p-8 pt-0 custom-scrollbar">
                                <div className="space-y-8">
                                    {/* Quick Actions */}
                                    <div className="p-6 rounded-[24px] border border-[#d3e3fd] dark:border-[#0842a0] bg-[#ecf3fe] dark:bg-[#0842a0]/20">
                                        <div className="flex items-center justify-between mb-6">
                                            <div><h4 className="text-sm font-black text-[#041e49] dark:text-[#d3e3fd] uppercase tracking-widest flex items-center gap-2">Quick Actions</h4><p className="text-xs text-[#041e49]/70 dark:text-[#d3e3fd]/70 font-medium mt-1">Convert to department patient</p></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <button className="flex items-center gap-4 p-4 bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-2xl hover:shadow-md transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-[#d3e3fd] dark:bg-[#0842a0] flex items-center justify-center text-[#041e49] dark:text-[#d3e3fd] group-hover:scale-110 transition-transform"><UserPlus size={20} /></div>
                                                <div className="text-left"><span className="block text-xs font-black text-[#1a1c1e] dark:text-[#e3e2e6]">Add to Physio</span><span className="block text-[9px] font-bold text-[#43474e] dark:text-[#c4c7c5] mt-0.5 uppercase">Physiotherapy</span></div>
                                            </button>
                                            <button className="flex items-center gap-4 p-4 bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-2xl hover:shadow-md transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-[#ffd8e4] dark:bg-[#631a36] flex items-center justify-center text-[#31111d] dark:text-[#ffd8e4] group-hover:scale-110 transition-transform"><Mic size={20} /></div>
                                                <div className="text-left"><span className="block text-xs font-black text-[#1a1c1e] dark:text-[#e3e2e6]">Add to Speech</span><span className="block text-[9px] font-bold text-[#43474e] dark:text-[#c4c7c5] mt-0.5 uppercase">Speech Therapy</span></div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Personal Info */}
                                        <div className="p-6 rounded-[24px] border border-[#e0e2ec] dark:border-[#43474e] space-y-6">
                                            <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-[#006e1c]" /> Personal Information</h4></div>
                                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                                <div><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Age</label>{isEditing ? <input type="text" value={editData.age || ''} onChange={(e) => setEditData({...editData, age: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.age || 'N/A'}</p>}</div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Gender</label>
                                                    {isEditing ? <CustomSelect value={editData.gender || ''} onChange={(v) => setEditData({...editData, gender: v})} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} className="bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.gender || 'N/A'}</p>}
                                                </div>
                                                <div className="col-span-2"><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Phone</label>{isEditing ? <input type="text" value={editData.phone_number || ''} onChange={(e) => setEditData({...editData, phone_number: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.phone_number}</p>}</div>
                                                <div className="col-span-2"><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Email</label>{isEditing ? <input type="email" value={editData.email || ''} onChange={(e) => setEditData({...editData, email: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.email || 'N/A'}</p>}</div>
                                                <div className="col-span-2"><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Address</label>{isEditing ? <textarea value={editData.address || ''} onChange={(e) => setEditData({...editData, address: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none min-h-[60px]" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.address || 'N/A'}</p>}</div>
                                            </div>
                                        </div>
                                        {/* Clinical Info */}
                                        <div className="p-6 rounded-[24px] border border-[#e0e2ec] dark:border-[#43474e] space-y-6">
                                            <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest flex items-center gap-2"><Stethoscope size={14} className="text-[#b3261e]" /> Clinical Details</h4></div>
                                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                                <div className="col-span-2"><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Chief Complaint</label>{isEditing ? <input type="text" value={editData.chief_complain || ''} onChange={(e) => setEditData({...editData, chief_complain: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.chief_complain}</p>}</div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Inquiry Type</label>
                                                    {isEditing ? <CustomSelect value={editData.consultation_type || ''} onChange={(v) => setEditData({...editData, consultation_type: v})} options={[{label:'Select',value:''}, ...options.types.map(t => ({label:t,value:t}))]} className="bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.consultation_type}</p>}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Referred By</label>
                                                    {isEditing ? <CustomSelect value={editData.reffered_by || ''} onChange={(v) => setEditData({...editData, reffered_by: v})} options={[{label:'Select',value:''}, ...options.referred_by.map(r => ({label:r,value:r}))]} className="bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{selectedRegistration.reffered_by}</p>}
                                                </div>
                                                <div><label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Amount</label>{isEditing ? <input type="number" value={editData.consultation_amount || ''} onChange={(e) => setEditData({...editData, consultation_amount: e.target.value})} className="w-full px-3 py-1.5 bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm font-bold outline-none" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] font-black">₹ {selectedRegistration.consultation_amount}</p>}</div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Payment</label>
                                                    {isEditing ? <CustomSelect value={editData.payment_method || ''} onChange={(v) => setEditData({...editData, payment_method: v})} options={[{label:'Cash',value:'Cash'},{label:'Online',value:'Online'},{label:'Card',value:'Card'}]} className="bg-[#e0e2ec] dark:bg-[#43474e] rounded-lg text-sm" /> : <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] uppercase">{selectedRegistration.payment_method}</p>}
                                                </div>
                                                <div className="col-span-2 pt-2">
                                                    <label className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase block mb-1">Doctor Notes</label>
                                                    <div className="p-3 bg-[#e0e2ec]/50 dark:bg-[#43474e]/50 rounded-xl text-sm text-[#43474e] dark:text-[#c4c7c5] min-h-[60px]">{selectedRegistration.doctor_notes || 'No notes available.'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e] flex justify-end gap-3">
                                {isEditing ? (
                                    <button disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-[#006e1c] text-white rounded-full text-xs font-black shadow-lg hover:opacity-90 transition-all disabled:opacity-50" onClick={handleSaveDetails}><Check size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}</button>
                                ) : (
                                    <button className="px-8 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66] transition-all" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- BILL MODAL --- */}
            <AnimatePresence>
                {isBillModalOpen && selectedRegistration && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBillModalOpen(false)} className="absolute inset-0 bg-[#001f2a]/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative z-10 h-[85vh]">
                            {/* Bill Header */}
                            <div className="px-8 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                <h3 className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] flex items-center gap-2">Bill Preview <span className="text-[9px] bg-[#ccebc4] text-[#006e1c] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Invoice</span></h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={handlePrintBill} className="flex items-center gap-2 px-5 py-2 bg-[#006e1c] text-white rounded-full text-xs font-black shadow-lg hover:opacity-90 transition-all"><Printer size={16} /> Print</button>
                                    <button onClick={() => setIsBillModalOpen(false)} className="p-2 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#ffdad6] hover:text-[#93000a] rounded-full transition-all"><X size={18} /></button>
                                </div>
                            </div>
                            {/* Bill Content */}
                            <div className="flex-1 overflow-auto p-6 bg-[#f2f6fa] dark:bg-[#111315] font-serif custom-scrollbar">
                                <div id="printable-bill" className="bg-white p-10 shadow-sm text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm]">
                                    <div className="flex justify-between items-start pb-6 mb-8 border-b-2 border-slate-900">
                                        <div className="flex flex-col gap-3">
                                            <img src="https://prospine.in/admin/assets/images/manipal.png" alt="Logo" className="h-14 w-auto object-contain" />
                                            <div><h1 className="text-2xl font-black tracking-tighter uppercase">Consultation Bill</h1><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Date: {format(new Date(), 'dd-MM-yyyy')}</p></div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-lg font-black">{selectedRegistration.clinic_name || 'Prospine'}</h2>
                                            <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[250px] leading-relaxed">{selectedRegistration.address_line_1}{selectedRegistration.address_line_2 ? `, ${selectedRegistration.address_line_2}` : ''}<br/>{selectedRegistration.city}<br/>Phone: {selectedRegistration.phone_primary}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-10">
                                        <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Bill To</h4><p className="text-lg font-black text-slate-900">{selectedRegistration.patient_name}</p><p className="text-xs font-medium text-slate-500 mt-1">{selectedRegistration.address || 'Address not provided'}</p><p className="text-xs font-bold text-slate-800 mt-1">Contact: {selectedRegistration.phone_number}</p></div>
                                        <div className="flex flex-col items-end text-right"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1 w-full text-right">Invoice Details</h4><p className="text-xs font-bold text-slate-400">Receipt No: <span className="text-slate-900 font-black">#REG-{selectedRegistration.registration_id}</span></p><p className="text-xs font-bold text-slate-400 mt-1">Status: <span className="text-emerald-600 font-black uppercase">{selectedRegistration.status}</span></p><p className="text-xs font-bold text-slate-400 mt-1">Method: <span className="text-slate-900 font-black uppercase">{selectedRegistration.payment_method}</span></p></div>
                                    </div>
                                    <div className="mb-10">
                                        <table className="w-full text-left">
                                            <thead><tr className="bg-slate-50 border-y-2 border-slate-900"><th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">Description</th><th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">Amount</th></tr></thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr><td className="py-4 px-4"><span className="block text-sm font-bold text-slate-900 uppercase">Consultation Fee</span><span className="block text-xs font-medium text-slate-500 mt-1 italic">Type: {selectedRegistration.consultation_type}</span></td><td className="py-4 px-4 text-right"><span className="text-sm font-black text-slate-900">₹ {parseFloat(selectedRegistration.consultation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td></tr>
                                            </tbody>
                                            <tfoot><tr className="border-t-2 border-slate-900"><td className="py-4 px-4 text-right"><span className="text-[10px] font-black uppercase tracking-widest">Total Amount Payable</span></td><td className="py-4 px-4 text-right"><span className="text-2xl font-black text-slate-900">₹ {parseFloat(selectedRegistration.consultation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td></tr></tfoot>
                                        </table>
                                    </div>
                                    <div className="mt-auto pt-8 border-t border-dashed border-slate-300 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thank you for choosing ProSpine</p><p className="text-[9px] font-medium text-slate-400 mt-1 italic">System generated document.</p></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-[#001f2a]/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden relative z-10 border border-[#e0e2ec] dark:border-[#43474e] p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] mx-auto flex items-center justify-center mb-6"><AlertCircle size={32} /></div>
                            <h3 className="text-xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">{confirmModal.title}</h3>
                            <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] leading-relaxed mb-8">{confirmModal.message}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66] transition-all">Cancel</button>
                                <button onClick={confirmModal.onConfirm} className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-full text-xs font-bold hover:bg-[#93000a] transition-all shadow-md">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- TOASTS --- */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150]">
                        <div className={`px-4 py-3 rounded-full shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#006e1c] text-white' : toast.type === 'error' ? 'bg-[#ba1a1a] text-white' : 'bg-[#00639b] text-white'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span className="text-xs font-bold tracking-wide">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Registration;
