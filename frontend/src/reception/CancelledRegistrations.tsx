import React, { useState, useEffect } from 'react';
import { 
    Search, RefreshCw, ChevronLeft, ChevronRight,
    User, Phone, Trash2, 
    DollarSign, CheckCircle2, History, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
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
    const { user } = useAuthStore();
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
                    limit: pagination.limit
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

    return (
        <ReceptionLayout>
            <div className="p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Trash2 className="text-rose-500" size={28} />
                            Cancelled Registrations
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Manage and refund cancelled patient registrations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/reception/registration')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <History size={16} className="text-teal-600" />
                            Active Registrations
                        </button>
                        <button 
                            onClick={() => fetchRegistrations()}
                            className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-800">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Consultation Fee</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Refund</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                <AnimatePresence mode='popLayout'>
                                    {registrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-400">
                                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                        <Trash2 size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">No Cancelled Registrations</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Found for this branch</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        registrations.map((reg) => (
                                            <motion.tr 
                                                key={reg.registration_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{reg.patient_name}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-500">ID: #{reg.registration_id}</span>
                                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                                    <Phone size={10} />
                                                                    {reg.phone_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹ {parseFloat(reg.consultation_amount).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {reg.refund_status === 'initiated' ? (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">
                                                            Closed
                                                        </span>
                                                    ) : (
                                                        <select 
                                                            value={reg.status}
                                                            onChange={(e) => handleUpdateStatus(reg.registration_id, e.target.value)}
                                                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-bold py-1 px-2 focus:ring-2 focus:ring-teal-500/20"
                                                        >
                                                            <option value="closed">Closed</option>
                                                            <option value="pending">Re-open (Pending)</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        reg.refund_status === 'initiated' 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        {reg.refund_status === 'initiated' ? 'Refunded' : 'Not Refunded'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 text-right">
                                                        {reg.refund_status !== 'initiated' && parseFloat(reg.consultation_amount) > 0 ? (
                                                            <button 
                                                                onClick={() => openRefundModal(reg)}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                                                            >
                                                                < DollarSign size={12} />
                                                                Refund
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                disabled
                                                                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold cursor-not-allowed border border-slate-200 dark:border-slate-700"
                                                            >
                                                                {reg.refund_status === 'initiated' ? 'Completed' : 'No Payment'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Page {pagination.page} of {pagination.total_pages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => fetchRegistrations(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={() => fetchRegistrations(pagination.page + 1)}
                                disabled={pagination.page >= pagination.total_pages}
                                className="p-2 text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Initiate Refund</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Registration #{selectedForRefund.registration_id}</p>
                                </div>
                                <button 
                                    onClick={() => setIsRefundModalOpen(false)}
                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:text-rose-500 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleInitiateRefund} className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Refund Amount (₹)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="number" 
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            max={selectedForRefund.consultation_amount}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">Max refund: ₹ {selectedForRefund.consultation_amount}</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason for Refund</label>
                                    <textarea 
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="e.g. Patient requested cancellation..."
                                        rows={3}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isProcessingRefund}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-teal-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-teal-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                    {isProcessingRefund ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Confirm & Process Refund
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ReceptionLayout>
    );
};

export default CancelledRegistrations;
