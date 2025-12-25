import { useState, useEffect, useCallback } from 'react';
import { 
    Search, 
    Filter, 
    Trash2, 
    Search as SearchIcon, Beaker, UserSquare, Phone, 
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { format, parseISO } from 'date-fns';

type InquiryType = 'consultation' | 'test';

const Inquiry = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab ] = useState<InquiryType>('consultation');
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Dropdown Options
    const [options, setOptions] = useState<{
        complaints: any[];
        sources: any[];
        staff: any[];
        tests: any[];
        limbs: any[];
    }>({ complaints: [], sources: [], staff: [], tests: [], limbs: [] });

    const fetchInquiries = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reception/inquiry.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch',
                    branch_id: user.branch_id,
                    type: activeTab,
                    search: searchQuery,
                    status: statusFilter
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setInquiries(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch inquiries:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.branch_id, activeTab, searchQuery, statusFilter]);

    const fetchOptions = useCallback(async () => {
        if (!user?.branch_id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/reception/inquiry.php?action=options&branch_id=${user.branch_id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setOptions(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch options:', err);
        }
    }, [user?.branch_id]);

    useEffect(() => {
        fetchInquiries();
        fetchOptions();
    }, [fetchInquiries, fetchOptions]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/reception/inquiry.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    branch_id: user?.branch_id,
                    type: activeTab,
                    id,
                    status: newStatus
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchInquiries();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/reception/inquiry.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    branch_id: user?.branch_id,
                    type: activeTab,
                    id
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchInquiries();
            }
        } catch (err) {
            console.error('Failed to delete inquiry:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'visited': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
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
                                Inquiry Management
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-1">Track and manage potential patient visits</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Tab Switcher */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setActiveTab('consultation')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                        activeTab === 'consultation' 
                                        ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <UserSquare size={14} />
                                    Consultation
                                </button>
                                <button
                                    onClick={() => setActiveTab('test')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                        activeTab === 'test' 
                                        ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Beaker size={14} />
                                    Diagnostic
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 md:w-48">
                                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="visited">Visited</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => fetchInquiries()}
                                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-teal-600 transition-all shadow-sm"
                            >
                                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                        {activeTab === 'consultation' ? 'Referral & Complaint' : 'Diagnostic Detail'}
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Expected Visit</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                                                <p className="text-sm font-bold text-slate-400">Loading inquiries...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : inquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <SearchIcon size={48} className="text-slate-400" />
                                                <p className="text-sm font-bold text-slate-500">No inquiries found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    inquiries.map((inquiry) => (
                                        <motion.tr 
                                            key={inquiry.inquiry_id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 font-black text-sm">
                                                        {inquiry.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                                                            {inquiry.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-bold text-slate-500">
                                                                {inquiry.age}y / {inquiry.gender}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
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
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                            {options.complaints.find(c => c.value === inquiry.chief_complain)?.label || inquiry.chief_complain || 'General Consultation'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            Ref: {inquiry.referred_by || options.sources.find(s => s.value === inquiry.referralSource)?.label || inquiry.referralSource}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                                                            {options.tests.find(t => t.value === inquiry.testname)?.label || inquiry.testname}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            {inquiry.limb ? `Limb: ${options.limbs.find(l => l.value === inquiry.limb)?.label || inquiry.limb}` : 'Standard Study'}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    {format(parseISO(inquiry.expected_visit_date), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    Logged: {format(parseISO(inquiry.created_at), 'HH:mm')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={inquiry.status}
                                                        onChange={(e) => handleUpdateStatus(inquiry.inquiry_id, e.target.value)}
                                                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border-none focus:ring-0 cursor-pointer transition-all ${getStatusColor(inquiry.status)}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="visited">Visited</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(inquiry.inquiry_id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                    title="Delete Inquiry"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ReceptionLayout>
    );
};

export default Inquiry;
