import { useState, useEffect } from "react";
import {
    X,
    Edit3,
    Printer,
    User,
    Calendar,
    Phone,
    MapPin,
    Users,
    Info,
    ChevronDown,
    Clock,
    DollarSign,
    Plus,
    FlaskConical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestRecord {
    uid: string;
    patient_name: string;
    test_name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'Paid' | 'Partial' | 'Unpaid';
    test_status: 'Completed' | 'Pending' | 'Cancelled';
}

interface TestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    test: TestRecord | null;
    onPrint?: (test: TestRecord) => void;
}

const TestDetailsModal = ({ isOpen, onClose, test, onPrint }: TestDetailsModalProps) => {
    const [testStatus, setTestStatus] = useState<string>("");
    const [paymentStatus, setPaymentStatus] = useState<string>("");
    const [addPaymentAmount, setAddPaymentAmount] = useState<string>("");

    useEffect(() => {
        if (test) {
            setTestStatus(test.test_status);
            setPaymentStatus(test.payment_status);
        }
    }, [test]);

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring" as any, damping: 25, stiffness: 300 }
        }
    };

    if (!test) return null;

    // Mock patient data to match image requirements
    const patientData = {
        age: "15 MONTH",
        gender: "Male",
        phone: "9801896012",
        altPhone: "N/A",
        address: "NAUGACHIA",
        dob: "N/A",
        guardian: "N/A",
        relation: "N/A"
    };

    const financialSummary = {
        discount: 0,
        finalDue: test.due_amount,
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                    {/* Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-white dark:bg-[#0A0B0A] w-full max-w-7xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden relative z-10 border border-black/5 dark:border-white/5 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-[#1a1c1e] dark:text-white tracking-tight">Test Details</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">View and manage test information</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20 text-xs font-bold transition-all hover:bg-teal-100 dark:hover:bg-teal-500/20">
                                    <Edit3 size={16} />
                                    EDIT
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body - Two Column Layout */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="flex flex-col lg:flex-row gap-8">

                                {/* Left Column: Patient & Financial Summary */}
                                <div className="w-full lg:w-1/3 space-y-6">
                                    {/* Patient Information Card */}
                                    <div className="bg-white dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[24px] p-6 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Patient Information</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal details and contact info</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <User size={10} /> PATIENT NAME
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{test.patient_name}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Info size={10} /> AGE
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{patientData.age}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Users size={10} /> GENDER
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.gender}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Phone size={10} /> PHONE NUMBER
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.phone}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Phone size={10} /> ALT PHONE
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.altPhone}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <MapPin size={10} /> ADDRESS
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.address}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Calendar size={10} /> DATE OF BIRTH
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.dob}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Users size={10} /> PARENT/GUARDIAN
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">{patientData.guardian}</p>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    <Info size={10} /> RELATION
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patientData.relation}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Summary Card - Dark Mode Branding */}
                                    <div className="bg-[#0c4a48] dark:bg-[#0c4a48]/80 text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                    <DollarSign size={20} />
                                                </div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">Financial Summary</h4>
                                            </div>
                                            <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-md tracking-wider">Grand Total</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-8 relative z-10">
                                            <div>
                                                <label className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest mb-1 block">Total Amount</label>
                                                <p className="text-xl font-black tracking-tight">₹{test.total_amount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest mb-1 block text-right">Total Discount</label>
                                                <p className="text-xl font-black tracking-tight text-right">₹{financialSummary.discount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest mb-1 block">Total Paid</label>
                                                <p className="text-xl font-black tracking-tight text-emerald-400">₹{test.paid_amount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest mb-1 block text-right">Final Due</label>
                                                <p className="text-xl font-black tracking-tight text-right text-rose-300">₹{financialSummary.finalDue.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Abstract background shape */}
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                                    </div>
                                </div>

                                {/* Right Column: Test Workflows */}
                                <div className="w-full lg:w-2/3 space-y-6">
                                    <div className="bg-slate-50/50 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-sm">
                                        {/* Test Item Header */}
                                        <div className="p-5 flex items-center justify-between bg-white dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                                                    <FlaskConical size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{test.test_name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Item #1</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${test.test_status === 'Completed' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                                    test.test_status === 'Pending' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                        'bg-rose-100 text-rose-600 border-rose-200'
                                                    }`}>
                                                    {test.test_status}
                                                </span>
                                                <button className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400">
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Test Item Details */}
                                        <div className="p-8 space-y-8">
                                            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                                <div className="space-y-1">
                                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <FlaskConical size={10} /> TEST NAME
                                                    </label>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{test.test_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Clock size={10} /> TIME
                                                    </label>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">N/A</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Calendar size={10} /> ASSIGNED DATE
                                                    </label>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">2026-02-17</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <User size={10} /> PERFORMED BY
                                                    </label>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Sayan</p>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Users size={10} /> REFERRED BY
                                                    </label>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">DR RAKESH MISHRA MD[PED]</p>
                                                </div>
                                            </div>

                                            {/* Financial Details Mini-Grid */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <DollarSign size={14} className="text-teal-500" />
                                                    <h5 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Financial Details</h5>
                                                </div>
                                                <div className="grid grid-cols-5 gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-inner">
                                                    <div className="text-center md:text-left">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                                                        <span className="text-xs font-bold font-mono">₹{test.total_amount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-center md:text-left">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Discount</span>
                                                        <span className="text-xs font-bold font-mono">₹0.00</span>
                                                    </div>
                                                    <div className="text-center md:text-left">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paid</span>
                                                        <span className="text-xs font-bold font-mono text-emerald-500">₹{test.paid_amount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-center md:text-left">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Due</span>
                                                        <span className="text-xs font-bold font-mono text-rose-500">₹{test.due_amount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-center md:text-right">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Method</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">upi-hdfc</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Workflow Controls */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Test Status</label>
                                                        <div className="relative group">
                                                            <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white">
                                                                {testStatus}
                                                                <ChevronDown size={14} className="opacity-40" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Payment Status</label>
                                                        <div className="relative group">
                                                            <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white">
                                                                {paymentStatus}
                                                                <ChevronDown size={14} className="opacity-40" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Add Payment</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Amount"
                                                                    value={addPaymentAmount}
                                                                    onChange={(e) => setAddPaymentAmount(e.target.value)}
                                                                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-xs font-black outline-none focus:border-teal-500/50 transition-all"
                                                                />
                                                            </div>
                                                            <button className="px-5 py-3 bg-[#0c4a48] text-white rounded-xl text-xs font-black shadow-lg hover:bg-[#0a3d3c] transition-all flex items-center gap-2">
                                                                <Plus size={16} strokeWidth={3} />
                                                                ADD
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-2 ml-1">
                                                            <Clock size={10} className="opacity-50" />
                                                            Updates 'Paid' and 'Due' amounts.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-black/5 dark:border-white/5 flex justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                CLOSE
                            </button>
                            <button
                                onClick={() => test && onPrint?.(test)}
                                className="px-8 py-3 rounded-xl bg-teal-600 text-white text-xs font-black shadow-xl shadow-teal-500/10 hover:bg-teal-700 transition-all flex items-center gap-2"
                            >
                                <Printer size={16} />
                                PRINT BILL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TestDetailsModal;
