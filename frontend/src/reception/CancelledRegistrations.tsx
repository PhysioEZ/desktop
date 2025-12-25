import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, RefreshCw, ChevronLeft, ChevronRight,
    User, Phone, Trash2, 
    DollarSign, CheckCircle2, History, X,
    Bell, Moon, Sun, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

interface RegistrationRecord {
    registration_id: number;
    patient_name: string;
    phone_number: string;
    consultation_amount: string;
    status: string;
    refund_status: string;
    created_at: string;
    address: string;
}

const CancelledRegistrations: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    
    // Header & UI State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Page State
    const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    
    // Refund Modal State
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedForRefund, setSelectedForRefund] = useState<RegistrationRecord | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLButtonElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Theme & Click Outside Effects
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

    const fetchRegistrations = async (page = 1) => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reception/registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch',
                    branch_id: user.branch_id,
                    search,
                    status: 'closed',
                    page,
                    limit: 12 // Using 12 for grid
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setRegistrations(result.data || []);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.branch_id) {
            fetchRegistrations(1);
        }
    }, [search, user?.branch_id]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reception/registration.php?action=update_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            const result = await response.json();
            if (result.status === 'success') {
                fetchRegistrations();
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleInitiateRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedForRefund || !refundAmount || !user?.branch_id) return;

        setIsProcessingRefund(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reception/registration.php?action=refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registration_id: selectedForRefund.registration_id,
                    refund_amount: refundAmount,
                    refund_reason: refundReason,
                    branch_id: user.branch_id
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setIsRefundModalOpen(false);
                setSelectedForRefund(null);
                setRefundAmount('');
                setRefundReason('');
                fetchRegistrations();
            }
        } catch (error) {
            console.error('Refund error:', error);
        } finally {
            setIsProcessingRefund(false);
        }
    };

    const openRefundModal = (reg: RegistrationRecord) => {
        setSelectedForRefund(reg);
        setRefundAmount(reg.consultation_amount);
        setIsRefundModalOpen(true);
    };

    // Shared Header
    const Header = () => (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcff]/90 dark:bg-[#111315]/90 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300 h-16">
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/reception/dashboard')}>
                     <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold shadow-sm">PS</div>
                     <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>ProSpine</h1>
                 </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
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
    );

    const NavChips = () => (
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
    );

    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
            <Header />
            <NavChips />

            <div className="max-w-[1600px] mx-auto p-6 pt-36">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight mb-1 flex items-center gap-3" style={{ fontFamily: 'serif' }}>
                            Cancelled
                        </h1>
                        <p className="text-base text-[#43474e] dark:text-[#c4c7c5] font-medium">Manage and refund cancelled patient registrations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/reception/registration')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2022] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-[16px] text-sm font-bold border border-transparent hover:border-[#74777f] transition-all"
                        >
                            <History size={16} />
                            Active Listings
                        </button>
                        <button 
                            onClick={() => fetchRegistrations()}
                            className="p-2.5 bg-[#ccebc4] text-[#002105] rounded-[16px] hover:bg-[#b0f2a0] transition-all"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                 {/* Filters */}
                 <div className="bg-[#f0f4f9] dark:bg-[#1e2022] rounded-[24px] p-2 mb-8 flex items-center">
                    <div className="relative flex-1 w-full bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[20px] shadow-sm px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-[#006e1c] dark:focus-within:border-[#88d99d] transition-all">
                        <Search className="text-[#43474e] dark:text-[#c4c7c5]" size={20} />
                        <input type="text" placeholder="Search by name, phone or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-base w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] font-medium" />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                         <div className="w-12 h-12 border-4 border-[#ffb4ab] border-t-transparent rounded-full animate-spin mb-4" />
                         <p className="text-base font-bold text-[#43474e] dark:text-[#c4c7c5]">Loading cancelled list...</p>
                     </div>
                ) : registrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                         <div className="w-20 h-20 bg-[#ffdad6] dark:bg-[#93000a] rounded-full flex items-center justify-center mb-6 text-[#410002] dark:text-[#ffdad6]"><Trash2 size={32} /></div>
                         <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">No Cancelled Registrations</h3>
                         <p className="text-[#43474e] dark:text-[#c4c7c5] mt-2">Found for this branch</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {registrations.map((reg, idx) => (
                            <motion.div 
                                key={reg.registration_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                className="group bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[24px] border border-[#ffdad6] dark:border-[#93000a] p-5 hover:shadow-xl hover:border-[#ffb4ab] dark:hover:border-[#ffb4ab] transition-all relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-12 h-12 rounded-[16px] bg-[#ffdad6] dark:bg-[#93000a] flex items-center justify-center text-[#410002] dark:text-[#ffdad6]">
                                             <User size={24} />
                                         </div>
                                         <div>
                                              <h3 className="font-bold text-[#1a1c1e] dark:text-[#e3e2e6] text-lg leading-tight line-clamp-1">{reg.patient_name}</h3>
                                              <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium flex items-center gap-1 mt-0.5"><Phone size={10} /> {reg.phone_number}</p>
                                         </div>
                                     </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="p-3 bg-[#fff8f7] dark:bg-[#201a1a] rounded-[16px] flex justify-between items-center border border-[#ffdad6] dark:border-[#524343]">
                                        <div className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wide">Consultation Fee</div>
                                        <div className="text-lg font-black text-[#1a1c1e] dark:text-[#e3e2e6]">₹{parseFloat(reg.consultation_amount).toLocaleString('en-IN')}</div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <div className={`flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${reg.refund_status === 'initiated' ? 'bg-[#ccebc4]/30 text-[#006e1c] border-[#ccebc4]' : 'bg-[#e0e2ec]/30 text-[#43474e] border-[#e0e2ec]'}`}>
                                            {reg.refund_status === 'initiated' ? 'Refunded' : 'Not Refunded'}
                                        </div>
                                        <div className="flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-[#ffdad6]/30 text-[#93000a] border-[#ffdad6]">
                                            Cancelled
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-[#ffdad6] dark:border-[#93000a] flex justify-between items-center">
                                    {/* Action Buttons */}
                                    {reg.refund_status === 'initiated' ? (
                                        <div className="text-[10px] font-bold text-[#ba1a1a] dark:text-[#ffb4ab] border border-[#ffdad6] dark:border-[#93000a] px-3 py-1.5 rounded-full bg-[#ffdad6]/10">
                                            Closed (Refunded)
                                        </div>
                                    ) : (
                                        <select 
                                            value={reg.status}
                                            onChange={(e) => handleUpdateStatus(reg.registration_id, e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] focus:ring-0 cursor-pointer hover:underline outline-none"
                                        >
                                            <option value="closed">Keep Closed</option>
                                            <option value="pending">Re-open</option>
                                        </select>
                                    )}

                                    {reg.refund_status !== 'initiated' && parseFloat(reg.consultation_amount) > 0 && (
                                        <button 
                                            onClick={() => openRefundModal(reg)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#ba1a1a] text-white rounded-[12px] text-xs font-bold hover:bg-[#93000a] transition-all shadow-md shadow-red-900/20"
                                        >
                                            <DollarSign size={14} /> Refund
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                
                {/* Pagination (Floating) */}
                {!isLoading && registrations.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1c1e] dark:bg-[#e3e2e6] text-white dark:text-[#1a1c1e] px-4 py-2 rounded-full shadow-2xl z-30 flex items-center gap-4">
                        <button 
                            onClick={() => fetchRegistrations(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-bold tracking-widest">{pagination.page} / {pagination.total_pages}</span>
                        <button 
                            onClick={() => fetchRegistrations(pagination.page + 1)}
                            disabled={pagination.page >= pagination.total_pages}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Refund Modal */}
            <AnimatePresence>
                {isRefundModalOpen && selectedForRefund && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRefundModalOpen(false)}
                            className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden relative z-10 border border-[#e0e2ec] dark:border-[#43474e]"
                        >
                            <div className="px-6 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f2f6fa] dark:bg-[#111315]">
                                <div>
                                    <h3 className="text-lg font-black text-[#1a1c1e] dark:text-[#e3e2e6]">Initiate Refund</h3>
                                    <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] font-bold uppercase tracking-widest mt-0.5">#{selectedForRefund.registration_id}</p>
                                </div>
                                <button 
                                    onClick={() => setIsRefundModalOpen(false)}
                                    className="p-2 hover:bg-[#ffdad6] text-[#43474e] hover:text-[#ba1a1a] rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleInitiateRefund} className="p-6 space-y-6">
                                <div>
                                    <label className="text-[11px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest block mb-2">Refund Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1c1e] dark:text-[#e3e2e6] font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            max={selectedForRefund.consultation_amount}
                                            required
                                            className="w-full pl-8 pr-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] border-none rounded-[16px] text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6] focus:ring-2 focus:ring-[#006e1c] outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#006e1c] dark:text-[#88d99d] font-bold mt-2 uppercase tracking-wide">Max: ₹ {selectedForRefund.consultation_amount}</p>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest block mb-2">Reason</label>
                                    <textarea 
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Reason for cancellation..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] border-none rounded-[16px] text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6] focus:ring-2 focus:ring-[#006e1c] outline-none transition-all resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isProcessingRefund}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#006e1c] text-white rounded-[16px] text-sm font-bold shadow-lg hover:bg-[#005313] disabled:opacity-50 transition-all"
                                >
                                    {isProcessingRefund ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Confirm Refund
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CancelledRegistrations;
