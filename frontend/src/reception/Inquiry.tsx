import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, Trash2, Beaker, UserSquare, 
    RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronDown,
    MessageCircle, History as HistoryIcon, UserPlus, X, Save,
    Edit2, ClipboardList, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL, authFetch } from '../config';
import { format, parseISO } from 'date-fns';
import { type ShortcutItem } from '../components/KeyboardShortcuts';
import ReceptionLayout from '../components/Layout/ReceptionLayout';

type InquiryType = 'consultation' | 'test';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
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
                <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-4 pb-3 border-b border-[#79747e]/10">
                    <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide">Select date</p>
                    <div className="flex justify-between items-center mt-1">
                        <h2 className="text-3xl font-normal text-[#1d1b20] dark:text-[#e6e1e5]">
                            {selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h2>
                        <button className="text-[#49454f] dark:text-[#cac4d0] p-1 hover:bg-[#1d1b20]/10 rounded-full transition-colors"><Edit2 size={18} /></button>
                    </div>
                </div>
                <div className="p-3">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-1 text-[#49454f] dark:text-[#cac4d0] font-bold text-sm cursor-pointer hover:bg-[#1d1b20]/10 px-2 py-1 rounded-full transition-colors">
                            {months[currDate.getMonth()]} {currDate.getFullYear()} <span className="text-[10px]">▼</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"><ChevronLeft size={20} /></button>
                            <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"><ChevronRight size={20} /></button>
                        </div>
                    </div>
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
                <div className="flex justify-end gap-2 p-3 pt-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">Cancel</button>
                    <button onClick={confirm} className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors">OK</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Inquiry = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // State
    const [activeTab, setActiveTab ] = useState<InquiryType>('consultation');
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [, setIsUpdating] = useState(false);
    
    // UI State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Refs
    const localSearchInputRef = useRef<HTMLInputElement>(null);

    // Menu State
    const [menuState, setMenuState] = useState<{
        x: number; y: number; width: number;
        options: { label: string; value: string; color?: string }[];
        onSelect: (val: string) => void;
        activeValue: string;
    } | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
    const [options, setOptions] = useState<{
        complaints: any[]; sources: any[]; staff: any[]; tests: any[]; limbs: any[];
    }>({ complaints: [], sources: [], staff: [], tests: [], limbs: [] });

    // --- Page Specific Shortcuts ---
    const pageShortcuts: ShortcutItem[] = [
        { keys: ['Alt', 'C'], description: 'Consultation Tab', group: 'Inquiry', action: () => setActiveTab('consultation'), pageSpecific: true },
        { keys: ['Alt', 'T'], description: 'Diagnostic Tab', group: 'Inquiry', action: () => setActiveTab('test'), pageSpecific: true },
        { keys: ['Alt', 'F'], description: 'Focus Filter', group: 'Inquiry', action: () => localSearchInputRef.current?.focus(), pageSpecific: true },
        { keys: ['Alt', 'R'], description: 'Refresh List', group: 'Actions', action: () => fetchInquiries(), pageSpecific: true },
    ];

    // Handle Clicks Outside for Menu
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (menuState && !(e.target as Element).closest('#custom-menu') && !(e.target as Element).closest('.menu-trigger')) setMenuState(null);
    }, [menuState]);

    useEffect(() => { 
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, [handleClickOutside]);
    
    // Global escape handler is in Layout, but we might want one here for menu?
    // The Layout one handles global popups. Local popups like menu/delete modal need local handling or merging.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuState(null);
                setDeleteModal({ show: false, id: null });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const openMenu = (e: React.MouseEvent, options: any[], activeValue: string, onSelect: (val: string) => void, width: number = 200) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({ x: rect.left, y: rect.bottom + 8, width: width || rect.width, options, onSelect, activeValue });
    };

    // --- Data Fetching ---
    const fetchInquiries = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch', branch_id: user.branch_id, type: activeTab })
            });
            const data = await res.json();
            if (data.status === 'success') setInquiries(data.data);
        } catch (err) {
            console.error('Failed to fetch inquiries:', err);
            showToast('Failed to load inquiries', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user?.branch_id, activeTab]);

    const fetchOptions = useCallback(async () => {
        if (!user?.branch_id) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, { method: 'POST', body: JSON.stringify({ action: 'options', branch_id: user.branch_id }) });
            const data = await res.json();
            if (data.status === 'success') setOptions(data.data);
        } catch (err) { console.error('Failed to fetch options:', err); }
    }, [user?.branch_id]);

    useEffect(() => { fetchInquiries(); fetchOptions(); }, [fetchInquiries, fetchOptions]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        setIsUpdating(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', branch_id: user?.branch_id, type: activeTab, id, status: newStatus })
            });
            const data = await res.json();
            if (data.status === 'success') { showToast('Status updated successfully', 'success'); fetchInquiries(); }
            else { showToast('Failed to update status', 'error'); }
        } catch (err) { showToast('Error updating status', 'error'); } finally { setIsUpdating(false); }
    };

    const handleDeleteClick = (id: number) => { setDeleteModal({ show: true, id }); };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', branch_id: user?.branch_id, type: activeTab, id: deleteModal.id })
            });
            const data = await res.json();
            if (data.status === 'success') { showToast('Inquiry deleted successfully', 'success'); fetchInquiries(); }
        } catch (err) { showToast('Error deleting inquiry', 'error'); } finally { setDeleteModal({ show: false, id: null }); }
    };

    const getStatusStyle = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'visited') return 'bg-[#ccebc4] text-[#0c200e] border border-[#ccebc4]';
        if (s === 'cancelled') return 'bg-[#ffdad6] text-[#410002] border border-[#ffdad6]';
        return 'bg-[#e0e2ec] text-[#1a1c1e] dark:bg-[#43474e] dark:text-[#e3e2e6] border border-[#74777f]';
    };

    // --- Follow Up Logic ---
    const [followUpModal, setFollowUpModal] = useState<{ show: boolean; inquiry: any | null }>({ show: false, inquiry: null });
    const [followUpLogs, setFollowUpLogs] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');
    const [nextDate, setNextDate] = useState('');
    const [isSavingLog, setIsSavingLog] = useState(false);

    const openFollowUp = async (inquiry: any) => {
        setFollowUpModal({ show: true, inquiry });
        setFollowUpLogs([]); // Clear previous
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
                method: 'POST', body: JSON.stringify({ action: 'fetch_followups', inquiry_id: inquiry.inquiry_id, type: activeTab })
            });
            const data = await res.json();
            if (data.status === 'success') setFollowUpLogs(data.data);
        } catch (e) { console.error(e); }
    };

    const saveFollowUp = async () => {
        if (!newNote.trim()) return;
        setIsSavingLog(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
                method: 'POST', body: JSON.stringify({ 
                    action: 'add_followup', 
                    inquiry_id: followUpModal.inquiry.inquiry_id, 
                    type: activeTab,
                    note: newNote,
                    next_date: nextDate
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Follow-up added', 'success');
                setNewNote(''); setNextDate('');
                openFollowUp(followUpModal.inquiry); // Refresh logs
                fetchInquiries(); // Refresh main list (for next date update)
            }
        } catch (e) { showToast('Error saving log', 'error'); } 
        finally { setIsSavingLog(false); }
    };

    const handleRegister = (inquiry: any) => {
        const isTest = activeTab === 'test';
        
        const prefillData = {
            patient_name: inquiry.name,
            phone: isTest ? inquiry.mobile_number : inquiry.phone_number,
            age: inquiry.age,
            gender: inquiry.gender,
            address: inquiry.address,
            chief_complaint: inquiry.complaint,
            how_did_you_hear: inquiry.referral
        };

        navigate('/reception/dashboard', { 
            state: { 
                activeModal: isTest ? 'test' : 'registration', 
                prefillData 
            } 
        });
    };

    const openWhatsApp = (number: string) => {
        if (!number) return;
        window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
    };

    return (
        <ReceptionLayout pageSpecificShortcuts={pageShortcuts}>
            <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-4 md:px-8 max-w-[1800px] mx-auto space-y-6 mt-6 pb-20">
                 {/* Title & Controls */}
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-[40px] leading-[48px] text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight transition-colors" style={{ fontFamily: 'serif' }}>
                            Inquiry Management
                        </h2>
                        <p className="text-[#43474e] dark:text-[#c4c7c5] mt-1 text-lg transition-colors">Track, filter and update patient inquiries</p>
                    </div>
                    
                    <button onClick={() => fetchInquiries()} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ccebc4] dark:bg-[#0c3b10] text-[#0c200e] dark:text-[#ccebc4] hover:scale-105 active:scale-95 transition-all shadow-sm">
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                 </div>

                 {/* Filters & Tabs Block */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                     <div className="flex bg-[#e0e2ec] dark:bg-[#43474e] p-1 rounded-full">
                        <button 
                            onClick={() => setActiveTab('consultation')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'consultation' ? 'bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] shadow-sm' : 'text-[#43474e] dark:text-[#c4c7c5] hover:text-[#1a1c1e] dark:hover:text-[#e3e2e6]'}`}
                        >
                            <UserSquare size={16} /> Consultation
                        </button>
                        <button 
                            onClick={() => setActiveTab('test')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'test' ? 'bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] shadow-sm' : 'text-[#43474e] dark:text-[#c4c7c5] hover:text-[#1a1c1e] dark:hover:text-[#e3e2e6]'}`}
                        >
                            <Beaker size={16} /> Diagnostic
                        </button>
                     </div>

                     <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#43474e] dark:text-[#c4c7c5]" size={18} />
                            <input 
                                ref={localSearchInputRef}
                                type="text" 
                                value={localSearchQuery}
                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                placeholder="Filter list (Alt + F)..." 
                                className="w-full pl-12 pr-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] outline-none focus:ring-2 focus:ring-[#006e1c] transition-all"
                            />
                        </div>
                        <div className="relative w-48">
                            <button 
                                onClick={(e) => openMenu(e, [
                                    { label: 'All Statuses', value: '' },
                                    { label: 'Pending', value: 'pending' },
                                    { label: 'Visited', value: 'visited' },
                                    { label: 'Cancelled', value: 'cancelled' }
                                ], statusFilter, setStatusFilter)}
                                className="menu-trigger w-full pl-6 pr-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full text-[#1a1c1e] dark:text-[#e3e2e6] outline-none focus:ring-2 focus:ring-[#006e1c] flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <Filter size={16} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                    <span>{statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All Statuses'}</span>
                                </div>
                                <ChevronDown size={14} className="text-[#43474e] dark:text-[#c4c7c5]" />
                            </button>
                        </div>
                     </div>
                 </div>

                 {/* Table */}
                 <motion.div variants={itemVariants} className="bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-[28px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#e0e2ec]/50 dark:bg-[#43474e]/50 border-b border-[#e0e2ec] dark:border-[#43474e]">
                                    <th className="px-6 py-4 text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Patient Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">
                                        {activeTab === 'consultation' ? 'Referral & Complaint' : 'Diagnostic Detail'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Expected Visit</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e0e2ec] dark:divide-[#43474e]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 size={40} className="animate-spin text-[#006e1c] dark:text-[#88d99d]" />
                                                <p className="text-sm font-bold text-[#43474e] dark:text-[#c4c7c5]">Loading inquiries...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : inquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-50">
                                                <Search size={48} className="text-[#43474e] dark:text-[#c4c7c5]" />
                                                <p className="text-sm font-bold text-[#43474e] dark:text-[#c4c7c5]">No inquiries found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    inquiries
                                    .filter(item => {
                                        const query = localSearchQuery.toLowerCase();
                                        const matchesSearch = item.name.toLowerCase().includes(query) || 
                                                            (item.phone_number && item.phone_number.includes(query)) || 
                                                            (item.mobile_number && item.mobile_number.includes(query));
                                        const matchesStatus = statusFilter ? item.status === statusFilter : true;
                                        return matchesSearch && matchesStatus;
                                    })
                                    .map((inquiry) => (
                                        <motion.tr 
                                            key={inquiry.inquiry_id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-[#e0e2ec]/30 dark:hover:bg-[#43474e]/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold">
                                                        {inquiry.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] truncate max-w-[200px]">
                                                            {inquiry.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] bg-[#e0e2ec] dark:bg-[#43474e] px-1.5 py-0.5 rounded-md font-bold text-[#43474e] dark:text-[#c4c7c5]">
                                                                {inquiry.age}y / {inquiry.gender}
                                                            </span>
                                                            <button onClick={() => openWhatsApp(activeTab === 'consultation' ? inquiry.phone_number : inquiry.mobile_number)} className="text-[10px] text-[#006e1c] dark:text-[#88d99d] font-bold flex items-center gap-1 hover:underline">
                                                                <MessageCircle size={10} />
                                                                {activeTab === 'consultation' ? inquiry.phone_number : inquiry.mobile_number}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {activeTab === 'consultation' ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6] truncate max-w-[180px]">
                                                            {options.complaints.find(c => c.value === inquiry.chief_complain)?.label || inquiry.chief_complain || 'General Consultation'}
                                                        </p>
                                                        <p className="text-[11px] text-[#43474e] dark:text-[#c4c7c5] mt-0.5">
                                                            Ref: {inquiry.referred_by || options.sources.find(s => s.value === inquiry.referralSource)?.label || inquiry.referralSource}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-sm font-bold text-[#b3261e] dark:text-[#ffb4ab]">
                                                            {options.tests.find(t => t.value === inquiry.testname)?.label || inquiry.testname}
                                                        </p>
                                                        <p className="text-[11px] text-[#43474e] dark:text-[#c4c7c5] mt-0.5">
                                                            {inquiry.limb ? `Limb: ${options.limbs.find(l => l.value === inquiry.limb)?.label || inquiry.limb}` : 'Standard Study'}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                                    {format(parseISO(inquiry.expected_visit_date), 'MMM d, yyyy')}
                                                </p>
                                                {inquiry.next_followup_date && (
                                                    <p className="text-[10px] text-[#b3261e] dark:text-[#ffb4ab] font-bold mt-1 flex items-center gap-1">
                                                        <HistoryIcon size={10} /> Next: {format(parseISO(inquiry.next_followup_date), 'MMM d')}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => openMenu(e, [
                                                        { label: 'Pending', value: 'pending' },
                                                        { label: 'Visited', value: 'visited' },
                                                        { label: 'Cancelled', value: 'cancelled' }
                                                    ], inquiry.status, (val) => handleUpdateStatus(inquiry.inquiry_id, val), 140)}
                                                    className={`menu-trigger text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full outline-none transition-all flex items-center gap-2 ${getStatusStyle(inquiry.status)}`}
                                                >
                                                    {inquiry.status}
                                                    <ChevronDown size={12} className="opacity-50" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleRegister(inquiry)} className="p-2 text-[#006e1c] dark:text-[#88d99d] hover:bg-[#ccebc4]/20 rounded-full transition-all" title="Convert to Registration">
                                                        <UserPlus size={18} />
                                                    </button>
                                                    <button onClick={() => openFollowUp(inquiry)} className="p-2 text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-all" title="Follow Up History">
                                                        <HistoryIcon size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(inquiry.inquiry_id)} className="p-2 text-[#43474e] dark:text-[#c4c7c5] hover:text-[#b3261e] dark:hover:text-[#ffb4ab] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] rounded-full transition-all" title="Delete Inquiry">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                 </motion.div>

                 {/* Modals */}
                 <AnimatePresence>
                    {/* ... (Existing Menu & Delete Modals) ... */}
                    {/* Re-inserting them conceptually, actually I replaced the whole return Block, so I must include them */}
                    {menuState && (
                        <motion.div 
                            id="custom-menu"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="fixed z-[70] bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-xl shadow-xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden py-1"
                            style={{ top: menuState.y, left: menuState.x, width: menuState.width }}
                        >
                            {menuState.options.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { menuState.onSelect(opt.value); setMenuState(null); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] transition-colors ${
                                        menuState.activeValue === opt.value ? 'text-[#006e1c] dark:text-[#88d99d] bg-[#ccebc4]/20' : 'text-[#1a1c1e] dark:text-[#e3e2e6]'
                                    }`}
                                >
                                    {opt.label}
                                    {menuState.activeValue === opt.value && <CheckCircle2 size={14} />}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {deleteModal.show && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-[#e0e2ec] dark:border-[#43474e]">
                                <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">Delete Inquiry?</h3>
                                <p className="text-[#43474e] dark:text-[#c4c7c5] mb-6 text-sm">This action cannot be undone. Are you sure?</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setDeleteModal({ show: false, id: null })} className="px-4 py-2 rounded-full text-sm font-bold text-[#006e1c] dark:text-[#88d99d] hover:bg-[#ccebc4]/20 transition-colors">Cancel</button>
                                    <button onClick={confirmDelete} className="px-4 py-2 rounded-full text-sm font-bold bg-[#b3261e] dark:bg-[#ffb4ab] text-white dark:text-[#690005] hover:shadow-md transition-all">Delete</button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Follow Up Modal - Redesigned Timeline Style */}
                    <AnimatePresence>
                        {followUpModal.show && followUpModal.inquiry && (
                            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }} 
                                    onClick={() => setFollowUpModal({ show: false, inquiry: null })}
                                    className="absolute inset-0 bg-[#001f2a]/60 backdrop-blur-sm"
                                />
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                                    exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                                    className="relative bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-[#e0e2ec] dark:border-[#43474e] z-10"
                                >
                                    {/* Modal Header */}
                                    <div className="px-8 py-6 border-b border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e] flex items-start justify-between relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-3xl font-black text-[#1a1c1e] dark:text-[#e3e2e6]" style={{ fontFamily: 'serif' }}>Follow Up History</h3>
                                            <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] mt-1 flex items-center gap-2">
                                                Patient: <span className="text-[#006e1c] dark:text-[#88d99d] font-bold bg-[#ccebc4]/20 px-2 py-0.5 rounded-md">{followUpModal.inquiry.name}</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setFollowUpModal({ show: false, inquiry: null })} 
                                            className="relative z-10 p-2 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#ffdad6] hover:text-[#93000a] transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Content Area - Scrollable */}
                                    <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-gradient-to-b from-[#fdfcff] to-[#f0f4f9] dark:from-[#1a1c1e] dark:to-[#111315]">
                                        {/* Input Section */}
                                        <div className="bg-white dark:bg-[#1e1e20] p-1 rounded-[24px] mb-10 border border-[#e0e2ec] dark:border-[#43474e] shadow-lg">
                                            <div className="px-5 pt-4 pb-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5] flex items-center gap-2">
                                                    <Edit2 size={12} /> Add New Note
                                                </label>
                                            </div>
                                            <textarea 
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Type call outcome, patient request, or next steps..."
                                                className="w-full px-5 py-3 bg-white dark:bg-[#1e1e20] text-sm font-medium outline-none text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e]/50 dark:placeholder:text-[#8e918f]/50 resize-none h-24"
                                            />


                                            <div className="bg-[#f0f4f9] dark:bg-[#111315] p-2 rounded-[20px] flex items-center justify-between mt-2 mx-1 mb-1">
                                                <div className="flex items-center gap-2 px-3">
                                                    <span className="text-[10px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider">Next Call:</span>
                                                    <button 
                                                        onClick={() => setShowDatePicker(true)}
                                                        className="flex items-center gap-2 text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        {nextDate ? format(parseISO(nextDate), 'MMM d, yyyy') : <span className="text-[#43474e] dark:text-[#c4c7c5] font-normal">Select Date</span>}
                                                        <Calendar size={14} className="text-[#006e1c] dark:text-[#88d99d]" />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={saveFollowUp}
                                                    disabled={isSavingLog || !newNote.trim()}
                                                    className="px-6 py-2.5 bg-[#006e1c] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#005313] hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                                                >
                                                    {isSavingLog ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                                                    Save Note
                                                </button>
                                            </div>
                                        </div>

                    {showDatePicker && (
                        <DatePicker 
                            value={nextDate} 
                            onChange={setNextDate} 
                            onClose={() => setShowDatePicker(false)} 
                        />
                    )}

                                        {/* Timeline Section */}
                                        <div className="relative pb-10">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5] mb-8 flex items-center gap-2">
                                                <HistoryIcon size={12} /> Activity Timeline
                                            </h4>
                                            
                                            {followUpLogs.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                                                    <div className="w-20 h-20 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full flex items-center justify-center mb-4 text-[#43474e] dark:text-[#c4c7c5]">
                                                        <ClipboardList size={32} />
                                                    </div>
                                                    <p className="text-base font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">No logs yet</p>
                                                    <p className="text-sm text-[#43474e] dark:text-[#c4c7c5]">Start adding notes to track history.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-0 pl-6 border-l-[3px] border-[#e0e2ec] dark:border-[#43474e] ml-3">
                                                    {followUpLogs.map((log, idx) => (
                                                        <motion.div 
                                                            key={log.followup_id} 
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="relative pl-10 pb-10 last:pb-0"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <div className="absolute -left-[11px] top-0 w-[19px] h-[19px] rounded-full bg-[#006e1c] border-[4px] border-[#fdfcff] dark:border-[#1a1c1e] shadow-sm z-10 box-content"></div>
                                                            
                                                            {/* Card */}
                                                            <div className="relative group">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                     <div className="flex items-center gap-2 bg-white dark:bg-[#2c2c2e] px-2 py-1 rounded-lg border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
                                                                        <div className="w-5 h-5 rounded-full bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[9px] font-black text-[#006e1c] dark:text-[#ccebc4] uppercase">
                                                                            {(log.staff_name || 'Sy').substring(0, 2)}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{log.staff_name || 'System'}</span>
                                                                     </div>
                                                                     <span className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium">{format(parseISO(log.created_at), 'h:mm a')} • {format(parseISO(log.created_at), 'MMM d')}</span>
                                                                </div>

                                                                <div className="bg-white dark:bg-[#1e1e20] p-4 rounded-b-2xl rounded-tr-2xl border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
                                                                    <p className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6] leading-relaxed whitespace-pre-wrap">
                                                                        {log.note}
                                                                    </p>

                                                                    {log.next_followup_date && (
                                                                        <div className="mt-3 w-full bg-[#ccebc4]/30 dark:bg-[#0c3b10]/30 px-3 py-2 rounded-xl flex items-center justify-between border border-[#ccebc4] dark:border-[#0c3b10]">
                                                                            <span className="text-xs font-bold text-[#006e1c] dark:text-[#88d99d] flex items-center gap-2">
                                                                                <Calendar size={14} /> Scheduled next call
                                                                            </span>
                                                                            <span className="text-xs font-black text-[#006e1c] dark:text-[#88d99d]">
                                                                                {format(parseISO(log.next_followup_date), 'MMM d, yyyy')}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

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
                </AnimatePresence>
            </motion.main>
        </ReceptionLayout>
    );
};

export default Inquiry;
