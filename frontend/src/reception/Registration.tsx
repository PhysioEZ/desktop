import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Search, 
    Filter, 
    ChevronLeft,
    ChevronRight, 
    Search as SearchIcon, 
    RefreshCw,
    Phone,
    Stethoscope,
    FileText,
    X,
    Printer,
    Edit3,
    Check,
    RotateCcw,
    Clock,
    UserPlus,
    Mic,
    AlertCircle,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { format, parseISO, isValid } from 'date-fns';

const Registration = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // UI State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } >({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

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
        limit: 10,
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
                    limit: 10
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
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            showToast('An error occurred while updating status', 'error');
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

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'consulted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
            case 'closed': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
        }
    };

    return (
        <ReceptionLayout>
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <SearchIcon className="w-5 h-5 text-teal-600" />
                                Registration Management
                                {isSearching && <RefreshCw className="w-4 h-4 text-teal-500 animate-spin ml-2" />}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-1">Manage and view active patient registrations</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => navigate('/reception/registration/cancelled')}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <Trash2 size={14} className="text-rose-500" />
                                Cancelled History
                            </button>
                            <button 
                                onClick={() => { isFirstLoad.current = true; fetchRegistrations(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                            >
                                <RefreshCw size={14} className={isSearching ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, ID or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative md:w-32">
                                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <select 
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="consulted">Consulted</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="relative md:w-36">
                                    <select 
                                        value={referrerFilter}
                                        onChange={(e) => { setReferrerFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Referrers</option>
                                        {options.referred_by.map(ref => (
                                            <option key={ref} value={ref}>{ref}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative md:w-36">
                                    <select 
                                        value={conditionFilter}
                                        onChange={(e) => { setConditionFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Conditions</option>
                                        {options.conditions.map(cond => (
                                            <option key={cond} value={cond}>{cond}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 overflow-auto p-6 flex flex-col">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Inquiry & Referral</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Condition</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                                                    <p className="text-sm font-bold text-slate-400">Loading registrations...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : registrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <SearchIcon size={48} className="text-slate-400" />
                                                    <p className="text-sm font-bold text-slate-500">
                                                        {isSearching ? "Searching..." : "No registrations found"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        registrations.map((reg) => (
                                            <motion.tr 
                                                key={reg.registration_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                                onClick={() => fetchDetails(reg.registration_id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 font-black text-sm overflow-hidden">
                                                            {reg.patient_photo_path ? (
                                                                <img src={`${reg.patient_photo_path}`} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                reg.patient_name?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                                                {reg.patient_name || 'Unknown'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-bold text-slate-500">
                                                                    ID: #{reg.patient_uid || 'N/A'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                    <Phone size={10} />
                                                                    {reg.phone_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {reg.consultation_type}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        Ref: {reg.reffered_by}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                                        {reg.chief_complain}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                        ₹{reg.consultation_amount}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    {formatDateSafe(reg.created_at, 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={reg.status}
                                                        onChange={(e) => handleUpdateStatus(reg.registration_id, e.target.value)}
                                                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border focus:ring-0 cursor-pointer transition-all ${getStatusColor(reg.status)}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="consulted">Consulted</option>
                                                        <option value="closed">Closed</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
                                                        title="View Full Details"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {!isLoading && registrations.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <p className="text-xs text-slate-500 font-bold">
                                    Showing <span className="text-slate-800 dark:text-slate-100">{(currentPage - 1) * 10 + 1}</span> to <span className="text-slate-800 dark:text-slate-100">{Math.min(currentPage * 10, pagination.total)}</span> of <span className="text-slate-800 dark:text-slate-100">{pagination.total}</span> records
                                </p>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || isSearching}
                                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(pagination.total_pages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Simple logic to show only relevant page numbers if many
                                            if (pagination.total_pages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== pagination.total_pages) {
                                                if (pageNum === 2 || pageNum === pagination.total_pages - 1) return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-teal-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                                        disabled={currentPage === pagination.total_pages || isSearching}
                                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-slate-100 dark:border-slate-800"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                        Registration Details
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">View and manage patient registration</p>
                                </div>
                                <button 
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 lg:p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Patient Info Bar */}
                            <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {selectedRegistration.patient_name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">ID: #{selectedRegistration.registration_id}</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {formatDateSafe(selectedRegistration.created_at, 'yyyy-MM-dd HH:mm:ss')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => navigateToBill(selectedRegistration.registration_id)}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                                        title="Print Bill"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    {!isEditing ? (
                                        <button 
                                            onClick={startEditing}
                                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                        >
                                            <RotateCcw size={14} />
                                            Cancel
                                        </button>
                                    )}
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700 transition-all ${getStatusColor(selectedRegistration.status)}`}>
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
                                        className="p-2 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                                        title="Cancel Registration"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content Container */}
                            <div className="flex-1 overflow-auto p-8 pt-0 custom-scrollbar">
                                <div className="space-y-8">
                                    {/* Quick Actions - Most Important Section */}
                                    <div className="bg-white dark:bg-slate-800/50 p-6 lg:p-10 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm shadow-blue-500/5">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                                    Quick Actions
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Convert this registration into a specific department patient</p>
                                            </div>
                                            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-2">
                                                <AlertCircle size={14} className="text-amber-600" />
                                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">No existing patient found for this ID</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            <button className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-3xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group relative overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform relative z-10 shadow-sm shadow-blue-500/10">
                                                    <UserPlus size={24} />
                                                </div>
                                                <div className="relative z-10 text-left">
                                                    <span className="block text-xs font-black text-blue-800 dark:text-blue-300">Add to Physio</span>
                                                    <span className="block text-[9px] font-bold text-blue-500/70 mt-0.5 uppercase tracking-tighter">Physiotherapy Dept</span>
                                                </div>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                                            </button>

                                            <button className="flex items-center gap-4 p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-3xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all group relative overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform relative z-10 shadow-sm shadow-purple-500/10">
                                                    <Mic size={24} />
                                                </div>
                                                <div className="relative z-10 text-left">
                                                    <span className="block text-xs font-black text-purple-800 dark:text-purple-300">Add to Speech</span>
                                                    <span className="block text-[9px] font-bold text-purple-500/70 mt-0.5 uppercase tracking-tighter">Speech Therapy Dept</span>
                                                </div>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                                            </button>

                                            {/* Placeholder buttons to show how it will look when dynamic */}
                                            <div className="p-5 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 opacity-40">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                                                <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Personal Information */}
                                        <div className="bg-white dark:bg-slate-800/50 p-6 lg:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <FileText size={14} className="text-teal-600" />
                                                    Personal Information
                                                </h4>
                                                <FileText size={14} className="text-slate-300" />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-y-8">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editData.age || ''} 
                                                            onChange={(e) => setEditData({...editData, age: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.age || 'N/A'}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                                                    {isEditing ? (
                                                        <select 
                                                            value={editData.gender || ''} 
                                                            onChange={(e) => setEditData({...editData, gender: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.gender || 'N/A'}</p>
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editData.phone_number || ''} 
                                                            onChange={(e) => setEditData({...editData, phone_number: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.phone_number}</p>
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="email" 
                                                            value={editData.email || ''} 
                                                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.email || 'N/A'}</p>
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Address</label>
                                                    {isEditing ? (
                                                        <textarea 
                                                            value={editData.address || ''} 
                                                            onChange={(e) => setEditData({...editData, address: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[60px]"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.address || 'N/A'}</p>
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Remarks</label>
                                                    {isEditing ? (
                                                        <textarea 
                                                            value={editData.remarks || ''} 
                                                            onChange={(e) => setEditData({...editData, remarks: e.target.value})}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[80px]"
                                                        />
                                                    ) : (
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                            {selectedRegistration.remarks || 'No remarks provided.'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Clinical Details */}
                                        <div className="bg-white dark:bg-slate-800/50 p-6 lg:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Stethoscope size={14} className="text-rose-600" />
                                                    Clinical Details
                                                </h4>
                                                <Stethoscope size={14} className="text-slate-300" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-6 md:gap-x-8">
                                                <div className="col-span-full">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chief Complaint</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editData.chief_complain || ''} 
                                                            onChange={(e) => setEditData({...editData, chief_complain: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.chief_complain}</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inquiry Type</label>
                                                    {isEditing ? (
                                                        <select 
                                                            value={editData.consultation_type || ''} 
                                                            onChange={(e) => setEditData({...editData, consultation_type: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        >
                                                            <option value="">Select</option>
                                                            {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.consultation_type}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Referred By</label>
                                                    {isEditing ? (
                                                        <select 
                                                            value={editData.reffered_by || ''} 
                                                            onChange={(e) => setEditData({...editData, reffered_by: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        >
                                                            <option value="">Select</option>
                                                            {options.referred_by.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.reffered_by}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Consultation</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="number" 
                                                            value={editData.consultation_amount || ''} 
                                                            onChange={(e) => setEditData({...editData, consultation_amount: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-black">₹ {selectedRegistration.consultation_amount}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment</label>
                                                    {isEditing ? (
                                                        <select 
                                                            value={editData.payment_method || ''} 
                                                            onChange={(e) => setEditData({...editData, payment_method: e.target.value})}
                                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                        >
                                                            <option value="Cash">Cash</option>
                                                            <option value="Online">Online</option>
                                                            <option value="Card">Card</option>
                                                        </select>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">{selectedRegistration.payment_method}</p>
                                                    )}
                                                </div>

                                                <div className="col-span-full space-y-6 pt-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Doctor Notes</label>
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm text-slate-600 dark:text-slate-400 min-h-[80px] border border-slate-100 dark:border-slate-800">
                                                            {selectedRegistration.doctor_notes || 'No notes available.'}
                                                            <div className="mt-2 text-[9px] uppercase font-bold text-amber-500/60 flex items-center gap-1">
                                                                <AlertCircle size={10} />
                                                                Read-only: Managed by Clinical Department
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Prescription</label>
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm text-slate-600 dark:text-slate-400 min-h-[80px] border border-slate-100 dark:border-slate-800">
                                                            {selectedRegistration.prescription || 'No prescription available.'}
                                                            <div className="mt-2 text-[9px] uppercase font-bold text-amber-500/60 flex items-center gap-1">
                                                                <AlertCircle size={10} />
                                                                Read-only: Managed by Physician
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Follow up Date</label>
                                                        {isEditing ? (
                                                            <input 
                                                                type="date" 
                                                                value={editData.follow_up_date || ''} 
                                                                onChange={(e) => setEditData({...editData, follow_up_date: e.target.value})}
                                                                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedRegistration.follow_up_date || 'N/A'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                                {isEditing ? (
                                    <button
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-10 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                                        onClick={handleSaveDetails}
                                    >
                                        <Check size={16} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                ) : (
                                    <button
                                        className="px-8 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                        onClick={() => setIsDetailsModalOpen(false)}
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bill Modal */}
            <AnimatePresence>
                {isBillModalOpen && selectedRegistration && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBillModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-slate-100 dark:border-slate-800 h-[85vh]"
                        >
                            {/* Actions Header */}
                            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        Bill Preview
                                        <span className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                                            Invoice
                                        </span>
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handlePrintBill}
                                        className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 hover:opacity-90 transition-all"
                                    >
                                        <Printer size={16} />
                                        Print
                                    </button>
                                    <button 
                                        onClick={() => setIsBillModalOpen(false)}
                                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Printable Bill Area - Scaled for Preview */}
                            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-950/30 font-serif custom-scrollbar">
                                <div id="printable-bill" className="bg-white p-8 shadow-sm border border-slate-100 text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm]">
                                    {/* Bill Header */}
                                    <div className="flex justify-between items-start pb-6 mb-8 border-b-2 border-dashed border-slate-200">
                                        <div className="flex flex-col gap-3">
                                            <img src="https://prospine.in/admin/assets/images/manipal.png" alt="Logo" className="h-12 w-auto object-contain grayscale opacity-90" />
                                            <div>
                                                <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase">Consultation Bill</h1>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Date: {format(new Date(), 'dd-MM-yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-base font-black text-slate-900">{selectedRegistration.clinic_name || 'Prospine'}</h2>
                                            <p className="text-[10px] font-medium text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                                                {selectedRegistration.address_line_1}{selectedRegistration.address_line_2 ? `, ${selectedRegistration.address_line_2}` : ''}<br/>
                                                {selectedRegistration.city}<br/>
                                                Phone: {selectedRegistration.phone_primary}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Client & Payment Info */}
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Bill To</h4>
                                            <p className="text-base font-black text-slate-900">{selectedRegistration.patient_name}</p>
                                            <p className="text-[11px] font-medium text-slate-500 mt-1">{selectedRegistration.address || 'Address not provided'}</p>
                                            <p className="text-[11px] font-bold text-slate-800 mt-0.5">Contact: {selectedRegistration.phone_number}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1 w-full text-right">Invoice Details</h4>
                                            <div className="space-y-1 text-right w-full">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-[9px] font-bold text-slate-400">Receipt No:</span>
                                                    <span className="text-[11px] font-black text-slate-900">#REG-{selectedRegistration.registration_id}</span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span className="text-[9px] font-bold text-slate-400">Status:</span>
                                                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{selectedRegistration.status}</span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span className="text-[9px] font-bold text-slate-400">Method:</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase">{selectedRegistration.payment_method}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="mb-8">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-y border-slate-200">
                                                    <th className="py-3 px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                                    <th className="py-3 px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="py-4 px-4">
                                                        <span className="block text-[11px] font-black text-slate-900 uppercase">Consultation Fee</span>
                                                        <span className="block text-[9px] font-medium text-slate-500 mt-0.5 italic">Type: {selectedRegistration.consultation_type}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-xs font-black text-slate-900">₹ {parseFloat(selectedRegistration.consultation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-900">
                                                    <td className="py-6 px-4 text-right">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Amount Payable</span>
                                                    </td>
                                                    <td className="py-6 px-4 text-right">
                                                        <span className="text-xl font-black text-slate-900">₹ {parseFloat(selectedRegistration.consultation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-auto pt-8 border-t border-dashed border-slate-200 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Thank you for choosing ProSpine</p>
                                        <p className="text-[8px] font-medium text-slate-400 mt-1 italic">This is a system generated document and does not require a physical signature.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800 p-8 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 mx-auto flex items-center justify-center mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                {confirmModal.title}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                                {confirmModal.message}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150]" 
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
                            toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                            toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
                            'bg-teal-600/90 border-teal-500 text-white'
                        }`}>
                            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ReceptionLayout>
    );
};

export default Registration;
