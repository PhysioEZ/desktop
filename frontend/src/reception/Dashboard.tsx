import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { 
    Users, ClipboardList, TestTube2, Wallet, Calendar, Clock, ArrowUpRight, Phone, TrendingUp, AlertCircle, Camera, Loader2, X, RefreshCw, Check, UserPlus, FlaskConical, PhoneCall, Beaker
} from 'lucide-react';

// Types
interface DashboardData {
    registration: { today_total: number; pending: number; consulted: number; month_total: number; };
    inquiry: { total_today: number; quick: number; test: number; };
    patients: { today_attendance: number; total_ever: number; active: number; inactive: number; paid_today: number; new_month: number; };
    tests: { today_total: number; pending: number; completed: number; revenue_today: number; total_month: number; };
    collections: { reg_amount: number; treatment_amount: number; test_amount: number; today_total: number; today_dues: number; patient_dues: number; test_dues: number; month_total: number; };
    schedule: Array<{ id: number; patient_name: string; appointment_time: string; status: string; }>;
}

interface FormOptions {
    referrers: string[];
    paymentMethods: Array<{ method_code: string; method_name: string }>;
    staffMembers: Array<{ staff_id: number; staff_name: string; job_title: string }>;
    testTypes: Array<{ test_type_id: number; test_name: string; test_code: string; default_cost: string | number; requires_limb_selection: boolean }>;
    limbTypes: Array<{ limb_type_id: number; limb_name: string; limb_code: string }>;
    chiefComplaints: Array<{ complaint_code: string; complaint_name: string }>;
    referralSources: Array<{ source_code: string; source_name: string }>;
    consultationTypes: Array<{ consultation_code: string; consultation_name: string }>;
    inquiryServiceTypes: Array<{ service_code: string; service_name: string }>;
    timeSlots: Array<{ value: string; label: string; booked: boolean }>;
}

type ModalType = 'registration' | 'test' | 'inquiry' | 'test_inquiry' | null;

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

const ReceptionDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Form ref
    const formRef = useRef<HTMLFormElement>(null);
    
    // Photo
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Test form
    const [selectedTests, setSelectedTests] = useState<Record<string, { checked: boolean; amount: string }>>({});
    const [otherTestName, setOtherTestName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [dueAmount, setDueAmount] = useState('');
    
    // Registration form - appointment date for refreshing time slots
    const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchAll = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const [dashRes, optRes] = await Promise.all([
                fetch(`${API_BASE_URL}/reception/dashboard.php?branch_id=${user?.branch_id}`),
                fetch(`${API_BASE_URL}/reception/form_options.php?branch_id=${user?.branch_id}&appointment_date=${appointmentDate}`)
            ]);
            const dashData = await dashRes.json();
            const optData = await optRes.json();
            if (dashData.status === 'success') setData(dashData.data);
            if (optData.status === 'success') {
                setFormOptions(optData.data);
                const initialTests: Record<string, { checked: boolean; amount: string }> = {};
                optData.data.testTypes?.forEach((t: { test_code: string; default_cost: string | number }) => {
                    const cost = parseFloat(String(t.default_cost)) || 0;
                    initialTests[t.test_code] = { checked: false, amount: cost > 0 ? cost.toFixed(2) : '' };
                });
                setSelectedTests(initialTests);
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            setIsLoading(false); 
        }
    }, [user?.branch_id, appointmentDate]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Refresh time slots when appointment date changes (while modal is open)
    const handleAppointmentDateChange = async (newDate: string) => {
        setAppointmentDate(newDate);
        if (user?.branch_id) {
            try {
                const optRes = await fetch(`${API_BASE_URL}/reception/form_options.php?branch_id=${user.branch_id}&appointment_date=${newDate}`);
                const optData = await optRes.json();
                if (optData.status === 'success' && formOptions) {
                    setFormOptions({ ...formOptions, timeSlots: optData.data.timeSlots });
                }
            } catch (e) { console.error(e); }
        }
    };

    // Calculate totals
    useEffect(() => {
        let total = 0;
        Object.entries(selectedTests).forEach(([, test]) => {
            if (test.checked && test.amount) {
                const amt = parseFloat(test.amount);
                if (!isNaN(amt)) total += amt;
            }
        });
        setTotalAmount(total > 0 ? total.toFixed(2) : '');
    }, [selectedTests]);

    // Auto-calculate Due
    useEffect(() => {
        const total = parseFloat(totalAmount) || 0;
        const advance = parseFloat(advanceAmount) || 0;
        const discount = parseFloat(discountAmount) || 0;
        const due = total - advance - discount;
        setDueAmount(due > 0 ? due.toFixed(2) : (total > 0 ? '0.00' : ''));
    }, [totalAmount, advanceAmount, discountAmount]);

    const handleTestCheckChange = (testCode: string, checked: boolean) => setSelectedTests(prev => ({ ...prev, [testCode]: { ...prev[testCode], checked } }));
    const handleTestAmountChange = (testCode: string, amount: string) => setSelectedTests(prev => ({ ...prev, [testCode]: { ...prev[testCode], amount } }));

    // Photo handlers
    const startWebcam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { console.error(e); } };
    const stopWebcam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
    const openPhotoModal = () => { setShowPhotoModal(true); setPhotoCaptured(false); setTimeout(() => startWebcam(), 100); };
    const closePhotoModal = () => { stopWebcam(); setShowPhotoModal(false); setPhotoCaptured(false); };
    const capturePhoto = () => { if (videoRef.current && canvasRef.current) { const v = videoRef.current, c = canvasRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height); setPhotoCaptured(true); } };
    const retakePhoto = () => setPhotoCaptured(false);
    const usePhoto = () => { if (canvasRef.current) { setPhotoData(canvasRef.current.toDataURL('image/jpeg', 0.8)); closePhotoModal(); } };
    const removePhoto = () => setPhotoData(null);

    // Get time range (30-min slots)
    const getTimeRange = (timeStr: string) => {
        if (!timeStr) return '';
        const today = new Date().toISOString().split('T')[0];
        const start = new Date(`${today}T${timeStr}`);
        if (isNaN(start.getTime())) return timeStr;
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const startFmt = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const endFmt = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${startFmt} - ${endFmt}`;
    };

    const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
    const inputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";
    const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";
    const selectClass = inputClass;
    const closeModal = () => { 
        setActiveModal(null); 
        setAdvanceAmount(''); 
        setDiscountAmount(''); 
        setDueAmount(''); 
        setSubmitMessage(null);
        setPhotoData(null);
        // Reset test selections
        if (formOptions?.testTypes) {
            const initialTests: Record<string, { checked: boolean; amount: string }> = {};
            formOptions.testTypes.forEach((t) => {
                const cost = parseFloat(String(t.default_cost)) || 0;
                initialTests[t.test_code] = { checked: false, amount: cost > 0 ? cost.toFixed(2) : '' };
            });
            setSelectedTests(initialTests);
        }
    };

    const handleSubmit = async () => {
        if (!formRef.current || !user?.branch_id || !user?.employee_id) return;
        
        const formData = new FormData(formRef.current);
        const formObject: Record<string, string> = {};
        formData.forEach((value, key) => {
            formObject[key] = value.toString();
        });

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            let endpoint = '';
            let payload: Record<string, unknown> = {
                branch_id: user.branch_id,
                employee_id: user.employee_id
            };

            if (activeModal === 'registration') {
                endpoint = `${API_BASE_URL}/reception/registration_submit.php`;
                payload = {
                    ...payload,
                    patient_name: formObject.patient_name,
                    phone: formObject.phone,
                    email: formObject.email || '',
                    gender: formObject.gender,
                    age: formObject.age,
                    conditionType: formObject.conditionType,
                    conditionType_other: formObject.conditionType_other || '',
                    referralSource: formObject.referralSource,
                    referred_by: formObject.referred_by || '',
                    occupation: formObject.occupation || '',
                    address: formObject.address || '',
                    inquiry_type: formObject.inquiry_type,
                    appointment_date: formObject.appointment_date || null,
                    appointment_time: formObject.appointment_time || null,
                    amount: formObject.amount || '0',
                    payment_method: formObject.payment_method,
                    remarks: formObject.remarks || '',
                    patient_photo_data: photoData || ''
                };
            } else if (activeModal === 'test') {
                endpoint = `${API_BASE_URL}/reception/test_submit.php`;
                const testNames = Object.entries(selectedTests)
                    .filter(([, val]) => val.checked)
                    .map(([key]) => key);
                const testAmounts: Record<string, number> = {};
                Object.entries(selectedTests).forEach(([key, val]) => {
                    if (val.checked && val.amount) {
                        testAmounts[key] = parseFloat(val.amount) || 0;
                    }
                });
                payload = {
                    ...payload,
                    patient_name: formObject.patient_name,
                    age: formObject.age,
                    gender: formObject.gender,
                    dob: formObject.dob || null,
                    parents: formObject.parents || '',
                    relation: formObject.relation || '',
                    phone_number: formObject.phone_number || '',
                    alternate_phone_no: formObject.alternate_phone_no || '',
                    referred_by: formObject.referred_by || '',
                    limb: formObject.limb || null,
                    test_names: testNames,
                    test_amounts: testAmounts,
                    other_test_name: otherTestName,
                    visit_date: formObject.visit_date,
                    assigned_test_date: formObject.assigned_test_date,
                    test_done_by: formObject.test_done_by,
                    total_amount: parseFloat(totalAmount) || 0,
                    advance_amount: parseFloat(advanceAmount) || 0,
                    discount: parseFloat(discountAmount) || 0,
                    payment_method: formObject.payment_method
                };
            } else if (activeModal === 'inquiry') {
                endpoint = `${API_BASE_URL}/reception/inquiry_submit.php`;
                payload = {
                    ...payload,
                    patient_name: formObject.patient_name,
                    age: formObject.age,
                    gender: formObject.gender,
                    phone: formObject.phone,
                    inquiry_type: formObject.inquiry_type || null,
                    communication_type: formObject.communication_type || null,
                    referralSource: formObject.referralSource || 'self',
                    conditionType: formObject.conditionType || '',
                    conditionType_other: formObject.conditionType_other || '',
                    remarks: formObject.remarks || '',
                    expected_date: formObject.expected_date || null
                };
            } else if (activeModal === 'test_inquiry') {
                endpoint = `${API_BASE_URL}/reception/test_inquiry_submit.php`;
                payload = {
                    ...payload,
                    patient_name: formObject.patient_name,
                    test_name: formObject.test_name,
                    referred_by: formObject.referred_by || '',
                    phone_number: formObject.phone_number,
                    expected_visit_date: formObject.expected_visit_date || null
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setSubmitMessage({ type: 'success', text: result.message || 'Submitted successfully!' });
                // Refresh dashboard data
                const dashRes = await fetch(`${API_BASE_URL}/reception/dashboard.php?branch_id=${user.branch_id}`);
                const dashData = await dashRes.json();
                if (dashData.status === 'success') setData(dashData.data);
                // Close modal after brief delay
                setTimeout(() => closeModal(), 1500);
            } else {
                setSubmitMessage({ type: 'error', text: result.message || 'Submission failed' });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setSubmitMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <ReceptionLayout><div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div></div></ReceptionLayout>;

    const actionButtons = [
        { id: 'registration' as ModalType, label: 'New Registration', icon: UserPlus, color: 'teal', desc: 'Register a new patient' },
        { id: 'test' as ModalType, label: 'Book Test', icon: FlaskConical, color: 'blue', desc: 'Schedule a lab test' },
        { id: 'inquiry' as ModalType, label: 'New Inquiry', icon: PhoneCall, color: 'violet', desc: 'Record patient inquiry' },
        { id: 'test_inquiry' as ModalType, label: 'Test Inquiry', icon: Beaker, color: 'rose', desc: 'Record test inquiry' },
    ];

    const getModalColor = () => {
        switch(activeModal) {
            case 'registration': return { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', light: 'bg-teal-50 dark:bg-teal-900/30' };
            case 'test': return { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50 dark:bg-blue-900/30' };
            case 'inquiry': return { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', light: 'bg-violet-50 dark:bg-violet-900/30' };
            case 'test_inquiry': return { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50 dark:bg-rose-900/30' };
            default: return { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', light: 'bg-teal-50 dark:bg-teal-900/30' };
        }
    };

    const getModalTitle = () => {
        switch(activeModal) { case 'registration': return 'New Patient Registration'; case 'test': return 'Book Lab Test'; case 'inquiry': return 'New Patient Inquiry'; case 'test_inquiry': return 'Test Inquiry'; default: return ''; }
    };

    return (
        <ReceptionLayout>
            <motion.div 
                className="p-5 space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Dashboard Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Reception Dashboard</h1>
                        <p className="text-xs text-slate-500 font-medium">Real-time overview of your branch activity</p>
                    </div>
                    <motion.button
                        onClick={fetchAll}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 font-bold text-xs"
                    >
                        <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Syncing...' : 'Sync Now'}</span>
                    </motion.button>
                </div>

                {/* CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4"><ClipboardList className="w-4 h-4 text-indigo-600" /><span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Registration & Inquiry</span></div>
                        <div className="space-y-2 mb-4"><div className="flex justify-between items-center"><span className="text-sm text-slate-600 dark:text-slate-400">Today's Registrations</span><span className="text-lg font-bold text-slate-800 dark:text-slate-200">{data?.registration.today_total || 0}</span></div><div className="flex gap-4 pl-3 border-l-2 border-indigo-200"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-xs text-slate-500">Pending</span><span className="text-sm font-semibold text-amber-600">{data?.registration.pending || 0}</span></div><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span className="text-xs text-slate-500">Done</span><span className="text-sm font-semibold text-emerald-600">{data?.registration.consulted || 0}</span></div></div><div className="flex justify-between items-center text-xs text-slate-400 pt-1"><span>This Month</span><span className="font-medium">{data?.registration.month_total || 0}</span></div></div>
                        <div className="border-t border-dashed border-slate-200 pt-3"><div className="flex justify-between items-center"><div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-blue-500" /><span className="text-sm text-slate-600 dark:text-slate-400">Inquiries</span></div><span className="text-lg font-bold text-blue-600">{data?.inquiry.total_today || 0}</span></div><div className="flex gap-3 mt-1.5 text-xs"><span className="text-slate-500">Quick: <strong className="text-slate-700">{data?.inquiry.quick || 0}</strong></span><span className="text-slate-500">Test: <strong className="text-slate-700">{data?.inquiry.test || 0}</strong></span></div></div>
                    </motion.div>
                    
                    <motion.div variants={cardVariants} className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-200" /><span className="text-xs font-bold uppercase tracking-wide text-teal-100">Patients</span></div><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Today</span></div>
                        <div className="text-center py-3"><motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="text-5xl font-black">{data?.patients.today_attendance || 0}</motion.p><p className="text-xs text-teal-200 mt-1">attended today</p></div>
                        <div className="grid grid-cols-2 gap-2 mt-2"><div className="bg-white/10 rounded-lg p-2 text-center hover:bg-white/20 transition-colors"><p className="text-lg font-bold">{data?.patients.active || 0}</p><p className="text-[10px] text-teal-200">Active</p></div><div className="bg-white/10 rounded-lg p-2 text-center hover:bg-white/20 transition-colors"><p className="text-lg font-bold">{data?.patients.inactive || 0}</p><p className="text-[10px] text-teal-200">Inactive</p></div></div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/20 text-xs"><span className="text-teal-200">Total: <strong className="text-white">{data?.patients.total_ever || 0}</strong></span><span className="text-teal-200">Paid: <strong>{fmt(data?.patients.paid_today || 0)}</strong></span></div>
                    </motion.div>
                    
                    <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700"><TestTube2 className="w-4 h-4 text-rose-600" /><span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Lab Tests</span><span className="ml-auto text-2xl font-black text-slate-800 dark:text-slate-200">{data?.tests.today_total || 0}</span></div>
                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700"><div className="p-4 text-center bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><p className="text-3xl font-bold text-amber-500">{data?.tests.pending || 0}</p><p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">PENDING</p></div><div className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"><p className="text-3xl font-bold text-emerald-500">{data?.tests.completed || 0}</p><p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">DONE</p></div></div>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400">Revenue: <strong className="text-slate-700 dark:text-slate-300">{fmt(data?.tests.revenue_today || 0)}</strong></span><span className="text-slate-400">Month: {data?.tests.total_month || 0}</span></div>
                    </motion.div>
                    
                    <motion.div variants={cardVariants} className="bg-slate-900 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Collections</span></div>
                        <div className="mb-3"><p className="text-xs text-slate-500 mb-1">Today's Total</p><motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="text-3xl font-black text-emerald-400">{fmt(data?.collections.today_total || 0)}</motion.p></div>
                        <div className="space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-slate-500">Registration</span><span className="text-slate-300">{fmt(data?.collections.reg_amount || 0)}</span></div><div className="flex justify-between"><span className="text-slate-500">Treatment</span><span className="text-slate-300">{fmt(data?.collections.treatment_amount || 0)}</span></div><div className="flex justify-between"><span className="text-slate-500">Lab Tests</span><span className="text-slate-300">{fmt(data?.collections.test_amount || 0)}</span></div></div>
                        <div className="mt-3 pt-2 border-t border-slate-700 flex justify-between items-center"><div className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle className="w-3 h-3" /><span>Dues: {fmt(data?.collections.today_dues || 0)}</span></div><div className="flex items-center gap-1 text-slate-500 text-[10px]"><TrendingUp className="w-3 h-3" /><span>{fmt(data?.collections.month_total || 0)}</span></div></div>
                    </motion.div>
                </div>

                {/* QUICK ACTIONS - Horizontal Strip */}
                <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Quick Actions</h3>
                        <div className="flex gap-3">
                            {actionButtons.map((btn, idx) => {
                                const Icon = btn.icon;
                                const bgColors: Record<string, string> = { teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700', blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700', violet: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700', rose: 'from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700' };
                                return (
                                    <motion.button 
                                        key={btn.id} 
                                        onClick={() => setActiveModal(btn.id)} 
                                        className={`flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r ${bgColors[btn.color]} text-white shadow-sm hover:shadow-md transition-all`}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.08 }}
                                    >
                                        <Icon size={18} />
                                        <span className="font-semibold text-sm">{btn.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* SCHEDULE + WIDGETS */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Schedule - Left Column */}
                    <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Today's Schedule</h3></div>
                            <button onClick={() => navigate('/reception/schedule')} className="group/btn p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/btn:text-teal-600 transition-colors" />
                            </button>
                        </div>
                        <div className="p-3 max-h-[280px] overflow-y-auto space-y-2">
                            {!data?.schedule?.length ? <div className="text-center py-8 text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-xs">No appointments today</p></div> : data.schedule.slice(0, 6).map((s, idx) => (
                                <motion.div 
                                    key={s.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs hover:scale-[1.02] transition-transform cursor-pointer ${s.status.toLowerCase() === 'pending' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${s.status.toLowerCase() === 'pending' ? 'bg-amber-200 text-amber-700' : 'bg-emerald-200 text-emerald-700'}`}>{s.patient_name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0"><p className="font-semibold text-slate-700 truncate">{s.patient_name}</p><p className="text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{getTimeRange(s.appointment_time)}</p></div>
                                    <span className={`text-[9px] font-bold uppercase ${s.status.toLowerCase() === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>{s.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    {/* Recent Activity - Center */}
                    <motion.div variants={cardVariants} className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /><h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Activity</h3></div>
                            <div className="flex gap-2">
                                <span className="text-[10px] px-2 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 rounded-full font-medium">Live</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <motion.div 
                                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800"
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{data?.registration.today_total || 0}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Registrations</p>
                                </motion.div>
                                <motion.div 
                                    className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-900/20 rounded-xl p-4 text-center border border-violet-200 dark:border-violet-800"
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{data?.tests.today_total || 0}</p>
                                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">Tests Booked</p>
                                </motion.div>
                                <motion.div 
                                    className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800"
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{data?.patients.today_attendance || 0}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Attended</p>
                                </motion.div>
                            </div>
                            
                            {/* Mini progress bars */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Daily Target Progress</span>
                                        <span className="text-teal-600 dark:text-teal-400 font-bold">{Math.min(100, Math.round(((data?.collections.today_total || 0) / 50000) * 100))}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.round(((data?.collections.today_total || 0) / 50000) * 100))}%` }}
                                            transition={{ delay: 0.5, duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Appointments Completed</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{data?.registration.consulted || 0}/{data?.registration.today_total || 0}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(data?.registration.today_total || 0) > 0 ? Math.round(((data?.registration.consulted || 0) / (data?.registration.today_total || 1)) * 100) : 0}%` }}
                                            transition={{ delay: 0.6, duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Tests Completed</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">{data?.tests.completed || 0}/{data?.tests.today_total || 0}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(data?.tests.today_total || 0) > 0 ? Math.round(((data?.tests.completed || 0) / (data?.tests.today_total || 1)) * 100) : 0}%` }}
                                            transition={{ delay: 0.7, duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Pending Dues - Right Column */}
                    <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /><h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dues Alert</h3></div>
                        </div>
                        <div className="p-4">
                            <div className="text-center mb-4">
                                <motion.p 
                                    className="text-4xl font-black text-red-500"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring' }}
                                >
                                    {fmt(data?.collections.today_dues || 0)}
                                </motion.p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today's Pending Dues</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Patient Dues</span>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400">{fmt(data?.collections.patient_dues || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Test Dues</span>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{fmt(data?.collections.test_dues || 0)}</span>
                                </div>
                            </div>
                            
                            <motion.button 
                                className="w-full mt-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                View All Pending Dues →
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* MODAL */}
            {activeModal && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
                    <motion.div 
                        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl my-auto ${activeModal === 'registration' || activeModal === 'test' ? 'w-[95vw] max-w-[1100px]' : activeModal === 'inquiry' ? 'w-[600px] max-w-[90vw]' : 'w-[500px] max-w-[90vw]'}`}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${getModalColor().light} rounded-t-2xl`}>
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${getModalColor().bg} text-white`}
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {activeModal === 'registration' && <UserPlus size={20} />}{activeModal === 'test' && <FlaskConical size={20} />}{activeModal === 'inquiry' && <PhoneCall size={20} />}{activeModal === 'test_inquiry' && <Beaker size={20} />}
                                </motion.div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{getModalTitle()}</h2>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* REGISTRATION */}
                            {activeModal === 'registration' && (
                                <form ref={formRef} className="flex gap-8">
                                    <div className="flex-1 space-y-4">
                                        <input type="hidden" name="patient_photo_data" value={photoData || ''} />
                                        <div>
                                            <label className={labelClass}>Patient Name *</label>
                                            <div className="flex gap-2"><input type="text" name="patient_name" required className={inputClass} placeholder="Enter patient name" /><button type="button" onClick={openPhotoModal} className="shrink-0 w-10 h-10 flex items-center justify-center bg-teal-50 text-teal-600 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"><Camera size={18} /></button></div>
                                            {photoData && <div className="mt-2 relative inline-block"><img src={photoData} alt="" className="h-12 w-12 object-cover rounded-lg border" /><button type="button" onClick={removePhoto} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"><X size={10} /></button></div>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="e.g., 25 years" /></div>
                                            <div><label className={labelClass}>Gender *</label><select name="gender" required className={selectClass}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                        </div>
                                        <div><label className={labelClass}>Referred By *</label><input list="referrers" name="referred_by" required className={inputClass} placeholder="Type or select" /><datalist id="referrers">{formOptions?.referrers.map(r => <option key={r} value={r} />)}</datalist></div>
                                        <div><label className={labelClass}>Chief Complaint *</label><select name="conditionType" required className={selectClass}><option value="">Select</option>{formOptions?.chiefComplaints.map(c => <option key={c.complaint_code} value={c.complaint_code}>{c.complaint_name}</option>)}</select></div>
                                        <div><label className={labelClass}>Occupation</label><input type="text" name="occupation" className={inputClass} /></div>
                                        <div><label className={labelClass}>Phone *</label><input type="tel" name="phone" required maxLength={10} className={inputClass} placeholder="10 digits" /></div>
                                        <div><label className={labelClass}>Email</label><input type="email" name="email" className={inputClass} /></div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div><label className={labelClass}>Address</label><input type="text" name="address" className={inputClass} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Amount *</label><input type="number" name="amount" step="0.01" required className={inputClass} placeholder="₹" /></div>
                                            <div><label className={labelClass}>Payment Method *</label><select name="payment_method" required className={selectClass}><option value="">Select</option>{formOptions?.paymentMethods.map(m => <option key={m.method_code} value={m.method_code}>{m.method_name}</option>)}</select></div>
                                        </div>
                                        <div><label className={labelClass}>How did you hear?</label><select name="referralSource" className={selectClass}><option value="">Select</option>{formOptions?.referralSources.map(s => <option key={s.source_code} value={s.source_code}>{s.source_name}</option>)}</select></div>
                                        <div><label className={labelClass}>Consultation Type *</label><select name="inquiry_type" required className={selectClass}><option value="">Select</option>{formOptions?.consultationTypes.map(t => <option key={t.consultation_code} value={t.consultation_code}>{t.consultation_name}</option>)}</select></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Appointment Date</label><input type="date" name="appointment_date" className={inputClass} value={appointmentDate} onChange={(e) => handleAppointmentDateChange(e.target.value)} /></div>
                                            <div><label className={labelClass}>Time Slot *</label><select name="appointment_time" required className={selectClass}><option value="">Select</option>{formOptions?.timeSlots.map(t => <option key={t.value} value={t.value} disabled={t.booked} className={t.booked ? 'text-slate-400' : ''}>{t.label}{t.booked ? ' (Booked)' : ''}</option>)}</select></div>
                                        </div>
                                        <div><label className={labelClass}>Remarks</label><textarea name="remarks" className={`${inputClass} min-h-[60px]`} placeholder="Notes"></textarea></div>
                                    </div>
                                </form>
                            )}

                            {/* TEST FORM */}
                            {activeModal === 'test' && (
                                <form ref={formRef} className="space-y-5">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} /></div>
                                        <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="e.g., 25 years" /></div>
                                        <div><label className={labelClass}>Gender *</label><select name="gender" required className={selectClass}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                        <div><label className={labelClass}>DOB</label><input type="date" name="dob" className={inputClass} /></div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div><label className={labelClass}>Parents/Guardian</label><input type="text" name="parents" className={inputClass} /></div>
                                        <div><label className={labelClass}>Relation</label><input type="text" name="relation" className={inputClass} /></div>
                                        <div><label className={labelClass}>Phone</label><input type="tel" name="phone_number" maxLength={10} className={inputClass} /></div>
                                        <div><label className={labelClass}>Alt. Phone</label><input type="tel" name="alternate_phone_no" maxLength={10} className={inputClass} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Referred By *</label><input list="test_referrers" name="referred_by" required className={inputClass} placeholder="Type or select" /><datalist id="test_referrers">{formOptions?.referrers.map(r => <option key={r} value={r} />)}</datalist></div>
                                        <div><label className={labelClass}>Limb</label><select name="limb" className={selectClass}><option value="">Select Limb</option>{formOptions?.limbTypes.map(l => <option key={l.limb_code} value={l.limb_code}>{l.limb_name}</option>)}</select></div>
                                    </div>

                                    {/* TEST SELECTION */}
                                    <div>
                                        <label className={labelClass}>Select Tests & Enter Amount *</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                            {formOptions?.testTypes.filter(t => t.test_code !== 'other').map((test, idx) => {
                                                const testState = selectedTests[test.test_code];
                                                return (
                                                    <motion.div 
                                                        key={test.test_code} 
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${testState?.checked ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`} 
                                                        onClick={() => handleTestCheckChange(test.test_code, !testState?.checked)}
                                                    >
                                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                            <input type="checkbox" name="test_name[]" value={test.test_code} checked={testState?.checked || false} onChange={(e) => { e.stopPropagation(); handleTestCheckChange(test.test_code, e.target.checked); }} className="w-4 h-4 text-blue-600 rounded" />
                                                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{test.test_name}</span>
                                                        </label>
                                                        <input type="number" name={`test_amounts[${test.test_code}]`} min={0} step={0.01} value={testState?.amount || ''} disabled={!testState?.checked} onChange={(e) => { e.stopPropagation(); handleTestAmountChange(test.test_code, e.target.value); }} onClick={(e) => e.stopPropagation()} className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 transition-colors" placeholder="₹ Amount" />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                        {formOptions?.testTypes.filter(t => t.test_code === 'other').map(test => {
                                            const testState = selectedTests[test.test_code];
                                            return (
                                                <div key={test.test_code} className={`mt-3 p-3 border-2 rounded-xl transition-all ${testState?.checked ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" name="test_name[]" value={test.test_code} checked={testState?.checked || false} onChange={(e) => handleTestCheckChange(test.test_code, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{test.test_name}</span>
                                                        </label>
                                                        {testState?.checked && <input type="text" name="other_test_name" value={otherTestName} onChange={(e) => setOtherTestName(e.target.value)} placeholder="Enter Test Name" className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />}
                                                        <input type="number" name={`test_amounts[${test.test_code}]`} min={0} step={0.01} value={testState?.amount || ''} disabled={!testState?.checked} onChange={(e) => handleTestAmountChange(test.test_code, e.target.value)} className="w-32 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400" placeholder="₹ Amount" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Check a test to enable its amount field. Total updates automatically.</p>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div><label className={labelClass}>Date of Visit *</label><input type="date" name="visit_date" required className={inputClass} defaultValue={new Date().toISOString().split('T')[0]} /></div>
                                        <div><label className={labelClass}>Assigned Test Date *</label><input type="date" name="assigned_test_date" required className={inputClass} defaultValue={new Date().toISOString().split('T')[0]} /></div>
                                        <div><label className={labelClass}>Test Done By *</label><select name="test_done_by" required className={selectClass}><option value="">Select</option>{formOptions?.staffMembers.map(s => <option key={s.staff_id} value={s.staff_name}>{s.staff_name}</option>)}</select></div>
                                        <div><label className={labelClass}>Payment Method *</label><select name="payment_method" required className={selectClass}><option value="">Select</option>{formOptions?.paymentMethods.map(m => <option key={m.method_code} value={m.method_code}>{m.method_name}</option>)}</select></div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div><label className={labelClass}>Total Amount *</label><input type="number" name="total_amount" step="0.01" required className={inputClass} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></div>
                                        <div><label className={labelClass}>Advance Amount</label><input type="number" name="advance_amount" step="0.01" className={inputClass} value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Enter Advance" /></div>
                                        <div><label className={labelClass}>Discount</label><input type="number" name="discount" step="0.01" className={inputClass} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0" /></div>
                                        <div><label className={labelClass}>Due Amount</label><input type="number" name="due_amount" step="0.01" className={`${inputClass} bg-slate-100 font-semibold`} value={dueAmount} readOnly /></div>
                                    </div>
                                </form>
                            )}

                            {/* INQUIRY */}
                            {activeModal === 'inquiry' && (
                                <form ref={formRef} className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} /></div>
                                    <div><label className={labelClass}>Age *</label><input type="text" name="age" required className={inputClass} placeholder="e.g., 25 years" /></div>
                                    <div><label className={labelClass}>Gender *</label><select name="gender" required className={selectClass}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                    <div><label className={labelClass}>Inquiry Service *</label><select name="inquiry_type" required className={selectClass}><option value="">Select</option>{formOptions?.inquiryServiceTypes.map(s => <option key={s.service_code} value={s.service_code}>{s.service_name}</option>)}</select></div>
                                    <div><label className={labelClass}>How did you hear? *</label><select name="referralSource" required className={selectClass}><option value="">Select</option>{formOptions?.referralSources.map(s => <option key={s.source_code} value={s.source_code}>{s.source_name}</option>)}</select></div>
                                    <div><label className={labelClass}>Communication Type *</label><select name="communication_type" required className={selectClass}><option value="">Select</option><option value="by_visit">By Visit</option><option value="phone">Phone</option><option value="web">Web</option><option value="email">Email</option></select></div>
                                    <div><label className={labelClass}>Chief Complaint *</label><select name="conditionType" required className={selectClass}><option value="">Select</option>{formOptions?.chiefComplaints.map(c => <option key={c.complaint_code} value={c.complaint_code}>{c.complaint_name}</option>)}</select></div>
                                    <div><label className={labelClass}>Mobile No. *</label><input type="tel" name="phone" required maxLength={10} className={inputClass} /></div>
                                    <div><label className={labelClass}>Plan to Visit Date *</label><input type="date" name="expected_date" required className={inputClass} /></div>
                                    <div><label className={labelClass}>Remarks</label><textarea name="remarks" className={`${inputClass} min-h-[60px]`}></textarea></div>
                                </form>
                            )}

                            {/* TEST INQUIRY */}
                            {activeModal === 'test_inquiry' && (
                                <form ref={formRef} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Patient Name *</label><input type="text" name="patient_name" required className={inputClass} /></div>
                                        <div><label className={labelClass}>Test Name *</label><select name="test_name" required className={selectClass}><option value="">Select</option>{formOptions?.testTypes.map(t => <option key={t.test_code} value={t.test_code}>{t.test_name}</option>)}</select></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Referred By *</label><input list="referrers" name="referred_by" required className={inputClass} /></div>
                                        <div><label className={labelClass}>Mobile No. *</label><input type="tel" name="phone_number" required maxLength={10} className={inputClass} /></div>
                                    </div>
                                    <div><label className={labelClass}>Expected Visit Date *</label><input type="date" name="expected_visit_date" required className={inputClass} /></div>
                                </form>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                            {submitMessage ? (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${submitMessage.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                    {submitMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {submitMessage.text}
                                </div>
                            ) : <div />}
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                <motion.button 
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting} 
                                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm ${getModalColor().bg} ${getModalColor().hover} flex items-center gap-2 transition-colors disabled:opacity-50`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Submit'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Photo Modal */}
            {showPhotoModal && (
                <motion.div 
                    className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div 
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Capture Photo</h3>
                        <div className="mb-4 bg-black rounded-lg overflow-hidden aspect-video"><video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${photoCaptured ? 'hidden' : ''}`}></video><canvas ref={canvasRef} className={`w-full h-full object-cover ${photoCaptured ? '' : 'hidden'}`}></canvas></div>
                        {!photoCaptured ? <div className="flex justify-end gap-3"><button type="button" onClick={closePhotoModal} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button><button type="button" onClick={capturePhoto} className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"><Camera size={16} /> Capture</button></div> : <div className="flex justify-end gap-3"><button type="button" onClick={closePhotoModal} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button><button type="button" onClick={retakePhoto} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><RefreshCw size={16} /> Retake</button><button type="button" onClick={usePhoto} className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"><Check size={16} /> Use</button></div>}
                    </motion.div>
                </motion.div>
            )}
        </ReceptionLayout>
    );
};

export default ReceptionDashboard;
