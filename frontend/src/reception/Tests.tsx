import { useState, useEffect, useRef } from 'react';
import {
    Search,
    Calendar,
    ChevronDown,
    Eye,
    Receipt,
    XCircle,
    LayoutGrid,
    RefreshCw,
    Bell,
    Info,
    StickyNote,
    Filter,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    TestTube2,
    Users,
    ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/useAuthStore';
import TestDetailsModal from '../components/reception/TestDetailsModal';
import ThermalReceiptModal from '../components/reception/ThermalReceiptModal';

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

const Tests = () => {
    const { isDark } = useThemeStore();
    const { user } = useAuthStore();

    // State
    const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<TestRecord | null>(null);
    const [records] = useState<TestRecord[]>([
        { uid: '26021705', patient_name: 'ANAND KUMAR', test_name: 'EEG, NCV', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021704', patient_name: 'ABHI RAJ', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Pending' },
        { uid: '26021703', patient_name: 'MD ISHAN', test_name: 'BERA', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Pending' },
        { uid: '26021702', patient_name: 'RAVI KUMAR', test_name: 'EEG, BERA', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021701', patient_name: 'SHANVI KUMARI', test_name: 'NCV', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021609', patient_name: 'NAYAN KUMAR', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021608', patient_name: 'USHA SHARMA', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021607', patient_name: 'LAVELY KUMARI', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021606', patient_name: 'NEHA KUMARI', test_name: 'EEG', total_amount: 2300, paid_amount: 2300, due_amount: 0, payment_status: 'Partial', test_status: 'Completed' },
        { uid: '26021605', patient_name: 'PRIYANKA KUMARI', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021604', patient_name: 'MD ZAFIR', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Completed' },
        { uid: '26021603', patient_name: 'ROHIT KUMAR', test_name: 'EEG', total_amount: 2500, paid_amount: 2500, due_amount: 0, payment_status: 'Paid', test_status: 'Cancelled' },
    ]);

    const [stats] = useState({
        total: 383,
        completed: 379,
        pending: 4
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterTest, setFilterTest] = useState('All Tests');
    const [filterPayment, setFilterPayment] = useState('Payment');
    const [filterStatus, setFilterStatus] = useState('Status');
    const [showCancelled, setShowCancelled] = useState(false);

    // Dropdown Data
    const testOptions = [
        { label: 'All Tests', value: 'All Tests' },
        { label: 'BERA', value: 'BERA' },
        { label: 'EEG', value: 'EEG' },
        { label: 'EEG, BERA', value: 'EEG, BERA' },
        { label: 'EEG, NCV', value: 'EEG, NCV' },
        { label: 'NCV', value: 'NCV' },
    ];

    const paymentOptions = [
        { label: 'Payment', value: 'Payment' },
        { label: 'Partial', value: 'Partial' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Unpaid', value: 'Unpaid' },
    ];

    const statusOptions = [
        { label: 'Status', value: 'Status' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Completed', value: 'Completed' },
    ];

    // Filter Logic
    const filteredRecords = records.filter(record => {
        const matchesSearch = record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.uid.includes(searchTerm);
        const matchesTest = filterTest === 'All Tests' || record.test_name === filterTest;
        const matchesPayment = filterPayment === 'Payment' || record.payment_status === filterPayment;
        const matchesStatus = filterStatus === 'Status' || record.test_status === filterStatus;
        const matchesCancelled = showCancelled ? record.test_status === 'Cancelled' : record.test_status !== 'Cancelled';

        return matchesSearch && matchesTest && matchesPayment && matchesStatus && matchesCancelled;
    });

    // Custom Dropdown Component for Filters
    const FilterDropdown = ({
        value,
        onChange,
        options,
        icon: Icon
    }: {
        value: string,
        onChange: (v: string) => void,
        options: { label: string, value: string }[],
        icon?: any
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shadow-sm border shrink-0 ${isOpen
                        ? "border-teal-500 ring-2 ring-teal-500/10"
                        : isDark ? "bg-[#1A1C1A] text-white/70 border-white/5" : "bg-white text-gray-600 border-gray-100"
                        }`}
                >
                    {Icon && <Icon size={16} />}
                    <span className="text-xs font-bold tracking-tight">{value}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-[100] border ${isDark ? "bg-[#121412] border-white/5" : "bg-white border-gray-100"}`}
                        >
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${value === option.value
                                        ? "bg-blue-600 text-white"
                                        : isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Animation Variants
    const leftPanelEntrance = {
        hidden: { x: -100, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any, delay: 0.1 }
        }
    };

    const mainContentEntrance = {
        hidden: { y: 100, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any, delay: 0.2 }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'Pending': return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'Cancelled': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getPaymentColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'Partial': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Unpaid': return 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}>
            <Sidebar />

            {/* === STATS PANEL (Left Column) === */}
            <motion.div
                variants={leftPanelEntrance}
                initial="hidden"
                animate="visible"
                className={`hidden xl:flex w-[400px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"}`}
            >
                {/* Brand & Greeting */}
                <div className="space-y-10 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-[#4ADE80] ${isDark ? "bg-[#1C1C1C]" : "bg-green-50"}`}>
                            <TestTube2 size={18} />
                        </div>
                        <span className="font-bold tracking-widest text-xs uppercase text-gray-500">
                            Tests Explorer
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
                            Daily<br />
                            <span className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}>
                                Tests
                            </span>
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Monitor and manage lab registrations.
                        </p>
                    </div>
                </div>

                {/* --- STATS SECTION --- */}
                <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
                            <ClipboardList size={18} />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">
                                Overview
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className={`p-6 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}>
                                <p className="text-xs font-bold uppercase opacity-40 mb-1">Total Records</p>
                                <p className="text-4xl font-serif">{stats.total}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5`}>
                                    <p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Completed</p>
                                    <p className="text-2xl font-serif text-emerald-500">{stats.completed}</p>
                                </div>
                                <div className={`p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5`}>
                                    <p className="text-[10px] font-bold uppercase text-amber-500 mb-1">Pending</p>
                                    <p className="text-2xl font-serif text-amber-500">{stats.pending}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Quick Action */}
                <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold opacity-50">System Active</span>
                        </div>
                        <ArrowUpRight size={16} className="opacity-30" />
                    </div>
                </div>
            </motion.div>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <motion.div
                    variants={mainContentEntrance}
                    initial="hidden"
                    animate="visible"
                    className="p-6 lg:p-10 max-w-[1920px] mx-auto space-y-10"
                >
                    {/* HEADER SECTION (Search, Refresh, Filters) */}
                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center gap-4 bg-transparent backdrop-blur-sm sticky top-0 py-3 transition-all duration-300 z-[45]">
                        <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                            <FilterDropdown
                                value={filterTest}
                                onChange={setFilterTest}
                                options={testOptions}
                                icon={Filter}
                            />
                            <FilterDropdown
                                value={filterPayment}
                                onChange={setFilterPayment}
                                options={paymentOptions}
                                icon={Receipt}
                            />
                            <FilterDropdown
                                value={filterStatus}
                                onChange={setFilterStatus}
                                options={statusOptions}
                                icon={CheckCircle2}
                            />

                            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2" />

                            <button
                                onClick={() => setShowCancelled(!showCancelled)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shadow-sm border shrink-0 ${showCancelled
                                    ? "bg-rose-500 text-white border-rose-600"
                                    : isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                    }`}
                            >
                                <XCircle size={16} />
                                <span className="text-xs font-bold tracking-tight">Cancelled</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                            <div className="relative lg:w-[320px] xl:w-[400px]">
                                <div className={`flex items-center px-4 py-2.5 rounded-[24px] border transition-all ${isDark ? "bg-[#121412]/80 border-[#2A2D2A]" : "bg-white border-gray-100 shadow-xl shadow-black/[0.03]"}`}>
                                    <Search size={18} className="opacity-30" />
                                    <input
                                        type="text"
                                        placeholder="Search Patient..."
                                        className="bg-transparent border-none outline-none text-sm px-3 w-full placeholder:opacity-30"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black opacity-40 ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                                        <span className="text-[12px] opacity-60">⌥</span>
                                        <span>S</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shrink-0">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterTest('All Tests');
                                        setFilterPayment('Payment');
                                        setFilterStatus('Status');
                                        setShowCancelled(false);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10"
                                >
                                    <RefreshCw size={18} className="opacity-40" />
                                </button>
                                <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                                <button className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10">
                                    <Bell size={18} className="opacity-40" />
                                </button>
                                <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                                <button className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10 text-indigo-500">
                                    <Info size={19} />
                                </button>
                            </div>

                            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95">
                                <Calendar size={16} />
                                SCHEDULE
                            </button>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
                        <div className={`grid grid-cols-12 gap-4 px-8 py-5 border-b text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className="col-span-1">UID</div>
                            <div className="col-span-2">Patient</div>
                            <div className="col-span-2">Test Name</div>
                            <div className="col-span-1 text-right">Total</div>
                            <div className="col-span-1 text-right">Paid</div>
                            <div className="col-span-1 text-right">Due</div>
                            <div className="col-span-2 text-center">Payment</div>
                            <div className="col-span-1 text-center">Status</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <motion.div
                                        whileHover={{ backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0,0,0,0.01)" }}
                                        key={record.uid}
                                        className="grid grid-cols-12 gap-4 px-8 py-5 items-center transition-colors"
                                    >
                                        <div className="col-span-1 font-mono text-sm opacity-40">
                                            #{record.uid}
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">{record.patient_name}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-xs font-medium opacity-60">{record.test_name}</div>
                                        </div>
                                        <div className="col-span-1 text-right font-mono text-sm font-bold tracking-tight">
                                            ₹{record.total_amount.toLocaleString()}
                                        </div>
                                        <div className="col-span-1 text-right text-sm font-semibold text-emerald-500 tracking-tight">
                                            ₹{record.paid_amount.toLocaleString()}
                                        </div>
                                        <div className="col-span-1 text-right font-mono text-sm font-bold tracking-tight opacity-40">
                                            ₹{record.due_amount.toLocaleString()}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getPaymentColor(record.payment_status)}`}>
                                                {record.payment_status}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(record.test_status)}`}>
                                                {record.test_status}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedTest(record);
                                                    setIsModalOpen(true);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                                                title="View Details"
                                            >
                                                <Eye size={16} className="opacity-50" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setReceiptData(record);
                                                    setIsReceiptOpen(true);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${isDark ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-600 border border-teal-100"}`}
                                                title="Generate Bill"
                                            >
                                                <Receipt size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="text-gray-400 mb-2 font-bold uppercase tracking-widest text-xs">No records found</div>
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterTest('All Tests');
                                            setFilterPayment('Payment');
                                            setFilterStatus('Status');
                                            setShowCancelled(false);
                                        }}
                                        className="text-teal-600 hover:underline text-sm font-bold"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Test Details Modal */}
            <TestDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                test={selectedTest}
                onPrint={(data: TestRecord) => {
                    setReceiptData(data);
                    setIsReceiptOpen(true);
                }}
            />

            {/* Thermal Receipt Modal */}
            <ThermalReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                data={receiptData}
            />
        </div>
    );
};

export default Tests;
