import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Search, Filter, Trash2, Beaker, UserSquare, Phone, 
    RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronDown
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

const Inquiry = () => {
    const { user } = useAuthStore();
    
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
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry.php`, {
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
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry.php?action=options&branch_id=${user.branch_id}`);
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
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry.php`, {
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
            const res = await authFetch(`${API_BASE_URL}/reception/inquiry.php`, {
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

    return (
        <ReceptionLayout pageSpecificShortcuts={pageShortcuts}>
            <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-4 md:px-8 max-w-[1800px] mx-auto space-y-6 mt-6">
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

                 {/* Filters & Tabs */}
                 <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                     {/* Tab Switcher */}
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
                                                            <span className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] font-bold flex items-center gap-1">
                                                                <Phone size={10} />
                                                                {activeTab === 'consultation' ? inquiry.phone_number : inquiry.mobile_number}
                                                            </span>
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
                                                <p className="text-[11px] text-[#43474e] dark:text-[#c4c7c5] mt-0.5">
                                                    Logged: {format(parseISO(inquiry.created_at), 'HH:mm')}
                                                </p>
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
                                                <button 
                                                    onClick={() => handleDeleteClick(inquiry.inquiry_id)}
                                                    className="p-2 text-[#43474e] dark:text-[#c4c7c5] hover:text-[#b3261e] dark:hover:text-[#ffb4ab] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] rounded-full transition-all"
                                                    title="Delete Inquiry"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                 </motion.div>

                 {/* Page Specific Modals */}
                 <AnimatePresence>
                    {/* Custom Menu Portal */}
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

                    {/* Delete Confirmation Modal */}
                    {deleteModal.show && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-[#e0e2ec] dark:border-[#43474e]"
                            >
                                <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">Delete Inquiry?</h3>
                                <p className="text-[#43474e] dark:text-[#c4c7c5] mb-6 text-sm">
                                    This action cannot be undone. Are you sure you want to proceed?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setDeleteModal({ show: false, id: null })}
                                        className="px-4 py-2 rounded-full text-sm font-bold text-[#006e1c] dark:text-[#88d99d] hover:bg-[#ccebc4]/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmDelete}
                                        className="px-4 py-2 rounded-full text-sm font-bold bg-[#b3261e] dark:bg-[#ffb4ab] text-white dark:text-[#690005] hover:shadow-md transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {toast && (
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
                            <div className={`px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#ccebc4] text-[#0c200e]' : 'bg-[#ffdad6] text-[#410002]'}`}>
                                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span className="font-bold text-sm">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.main>
        </ReceptionLayout>
    );
};

export default Inquiry;
