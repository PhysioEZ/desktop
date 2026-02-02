import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { format } from 'date-fns';

const BillingDrawer = () => {
    const {
        selectedPatient,
        isDetailsModalOpen,
        closePatientDetails,
        patientDetails,
        isLoadingDetails
    } = usePatientStore();

    // Combine list data with detailed data
    const data: any = { ...selectedPatient, ...patientDetails };

    // Format Currency
    const fmt = (val: number | string | undefined) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(Number(val || 0));
    };

    return (
        <AnimatePresence>
            {isDetailsModalOpen && selectedPatient && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePatientDetails}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-[800px] bg-white dark:bg-[#0A0A0A] shadow-2xl z-[100] border-l border-gray-100 dark:border-[#2A2D2A] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-[#2A2D2A] bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    {data.patient_name}
                                </h2>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                    Patient ID: #{data.patient_id}
                                </p>
                            </div>
                            <button
                                onClick={closePatientDetails}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1C1C1C] transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">

                            {/* Patient Card */}
                            <div className="p-6 rounded-[24px] border border-emerald-100/50 bg-emerald-50/20 dark:border-emerald-900/30 dark:bg-emerald-900/5 space-y-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                                            {data.patient_name}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                                                {data.patient_age} Yrs • {data.patient_gender}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white dark:bg-white/10 shadow-sm ${data.status === 'active' || data.patient_status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                                {data.status || data.patient_status || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Assigned Doctor</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            Dr {data.assigned_doctor || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-emerald-100/50 dark:bg-emerald-900/30 w-full" />

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                                        <div className="font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                            {data.patient_phone || data.phone_number}
                                        </div>
                                    </div>
                                    <div className="sm:hidden">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Doctor</p>
                                        <div className="font-semibold text-base text-gray-900 dark:text-white">
                                            Dr {data.assigned_doctor || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Service Type</p>
                                        <div className="font-semibold text-base text-gray-900 dark:text-white">
                                            {data.service_type || 'General Consultation'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Overview */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Financial Overview</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                    {/* Total Billed */}
                                    <div className="p-5 rounded-[20px] border border-gray-100 dark:border-[#2A2D2A] bg-white dark:bg-[#121412] shadow-sm flex flex-col justify-between h-28">
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Billed</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {fmt(data.total_amount)}
                                        </p>
                                    </div>

                                    {/* Total Paid */}
                                    <div className="p-5 rounded-[20px] border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-sm flex flex-col justify-between h-28">
                                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid</p>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {fmt(data.total_paid || data.advance_payment)}
                                        </p>
                                    </div>

                                    {/* Outstanding Due */}
                                    <div className="p-5 rounded-[20px] border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 shadow-sm flex flex-col justify-between h-28">
                                        <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Outstanding Due</p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {data.due_amount ? fmt(data.due_amount) : fmt((Number(data.total_amount) - Number(data.total_paid || data.advance_payment || 0)))}
                                        </p>
                                    </div>

                                    {/* Paid Today */}
                                    <div className="p-5 rounded-[20px] border border-teal-100 dark:border-teal-900/30 bg-teal-50/30 dark:bg-teal-900/10 shadow-sm flex flex-col justify-between h-28">
                                        <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Paid Today</p>
                                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                            {fmt(data.has_payment_today || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History */}
                            <div className="pb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment History</h4>
                                    {data.payments && data.payments.length > 0 && (
                                        <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 dark:bg-[#1C1C1C] rounded-md text-gray-600 dark:text-gray-300">
                                            {data.payments.length} Transactions
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {isLoadingDetails ? (
                                        <div className="flex flex-col gap-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-20 w-full bg-gray-100 dark:bg-[#1C1C1C] rounded-[16px] animate-pulse" />
                                            ))}
                                        </div>
                                    ) : !data.payments || data.payments.length === 0 ? (
                                        <div className="p-10 text-center border-2 border-dashed border-gray-100 dark:border-[#2A2D2A] rounded-[24px]">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-[#1C1C1C] flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                <FileText size={24} />
                                            </div>
                                            <p className="text-xs font-semibold text-gray-400">No payment history found</p>
                                        </div>
                                    ) : (
                                        data.payments.map((payment: any) => (
                                            <div key={payment.payment_id || Math.random()} className="flex items-center gap-5 p-5 rounded-[20px] border border-gray-100 dark:border-[#2A2D2A] bg-white dark:bg-[#121412] hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                                    <FileText size={20} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                        {payment.notes || payment.payment_method || 'Payment Received'}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                                                        {format(new Date(payment.payment_date || payment.created_at), 'dd MMM yyyy • hh:mm a')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                        {fmt(payment.amount)}
                                                    </p>
                                                    <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                                                        Successful
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BillingDrawer;
