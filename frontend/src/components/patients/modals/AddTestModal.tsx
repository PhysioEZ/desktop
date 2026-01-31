import { useState, useEffect } from 'react';
import { X, Check, Loader2, IndianRupee, Calendar, Hourglass, ChevronDown, ChevronUp, Wallet, AlertCircle, FilePlus, Search, User, Activity, FlaskConical, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authFetch } from '../../../config';
import type { Patient } from '../../../store/usePatientStore';
import CustomSelect from '../../ui/CustomSelect';
import DatePicker from '../../ui/DatePicker';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

interface AddTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onSuccess: () => void;
}

interface FormOptions {
    referrers: string[];
    paymentMethods: Array<{ method_code: string; method_name: string }>;
    staffMembers: Array<{ staff_id: number; staff_name: string; job_title: string }>;
    testTypes: Array<{ test_type_id: number; test_name: string; test_code: string; default_cost: string | number; requires_limb_selection: boolean }>;
    limbTypes: Array<{ limb_type_id: number; limb_name: string; limb_code: string }>;
}

const AddTestModal = ({ isOpen, onClose, patient, onSuccess }: AddTestModalProps) => {
    const { user } = useAuthStore();
    const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedTests, setSelectedTests] = useState<Record<string, { checked: boolean; amount: string }>>({});
    const [otherTestName, setOtherTestName] = useState('');
    const [testLimb, setTestLimb] = useState('');
    const [testDoneBy, setTestDoneBy] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptNo, setReceiptNo] = useState('');
    const [totalAmount, setTotalAmount] = useState('0');
    const [advanceAmount, setAdvanceAmount] = useState('0');
    const [discountAmount, setDiscountAmount] = useState('0');
    const [dueAmount, setDueAmount] = useState('0');
    const [paymentSplits, setPaymentSplits] = useState<Record<string, number>>({});
    const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState('');
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [lastEditedMethod, setLastEditedMethod] = useState<string | null>(null);
    const [openVisitPicker, setOpenVisitPicker] = useState(false);
    const [openAssignedPicker, setOpenAssignedPicker] = useState(false);

    // Fetch Options
    useEffect(() => {
        const fetchOptions = async () => {
            if (!isOpen) return;
            setIsLoadingOptions(true);
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/form_options?branch_id=${user?.branch_id}`);
                const data = await res.json();
                if (data.status === 'success' || data.success) {
                    setFormOptions(data.data);
                }
            } catch (err) {
                console.error('Error fetching form options:', err);
                toast.error('Failed to load form options');
            } finally {
                setIsLoadingOptions(false);
            }
        };
        fetchOptions();
    }, [isOpen, user?.branch_id]);

    // Reset Form when patient changes or becomes open
    useEffect(() => {
        if (isOpen && patient) {
          setSelectedTests({});
          setOtherTestName('');
          setTestLimb('');
          setTestDoneBy('');
          setReferredBy(patient.reffered_by || (patient as any).referred_by || '');
          setVisitDate(new Date().toISOString().split('T')[0]);
          setAssignedDate(new Date().toISOString().split('T')[0]);
          setReceiptNo('');
          setTotalAmount('0');
          setAdvanceAmount('0');
          setDiscountAmount('0');
          setDueAmount('0');
          setPaymentSplits({});
          setPrimaryPaymentMethod('');
          setShowPaymentDetails(false);
          setLastEditedMethod(null);
        }
    }, [isOpen, patient]);

    // Calculate Total and Due
    useEffect(() => {
        let total = 0;
        Object.values(selectedTests).forEach((data) => {
            if (data.checked) {
                total += parseFloat(data.amount) || 0;
            }
        });
        setTotalAmount(total.toFixed(2));
    }, [selectedTests]);

    useEffect(() => {
        const total = parseFloat(totalAmount) || 0;
        const advance = parseFloat(advanceAmount) || 0;
        const discount = parseFloat(discountAmount) || 0;
        setDueAmount((total - advance - discount).toFixed(2));
    }, [totalAmount, advanceAmount, discountAmount]);

    const handleTestCheckChange = (testCode: string, checked: boolean) => {
        const test = formOptions?.testTypes.find(t => t.test_code === testCode);
        setSelectedTests(prev => ({
            ...prev,
            [testCode]: {
                checked,
                amount: prev[testCode]?.amount || (test?.default_cost?.toString() || '')
            }
        }));
    };

    const handleTestAmountChange = (testCode: string, amount: string) => {
        setSelectedTests(prev => ({
            ...prev,
            [testCode]: {
                ...prev[testCode],
                amount
            }
        }));
    };

    // Auto-calculate Payment Splits
    const updateSplitAmount = (methodCode: string, value: number) => {
        const totalAdvance = parseFloat(advanceAmount) || 0;
        const activeMethods = Object.keys(paymentSplits);
        
        if (activeMethods.length <= 1) {
            setPaymentSplits({ [methodCode]: totalAdvance });
            return;
        }

        const newSplits = { ...paymentSplits, [methodCode]: value };
        
        // Find method to adjust (the one that wasn't just edited and isn't the current one)
        // If there are many, we adjust the one that wasn't the last edited either
        const otherMethods = activeMethods.filter(m => m !== methodCode);
        const methodToAdjust = otherMethods.find(m => m !== lastEditedMethod) || otherMethods[0];

        if (methodToAdjust) {
            const sumOfOthers = activeMethods
                .filter(m => m !== methodToAdjust && m !== methodCode)
                .reduce((sum, m) => sum + (newSplits[m] || 0), 0);
            
            newSplits[methodToAdjust] = Math.max(0, totalAdvance - sumOfOthers - value);
        }

        setPaymentSplits(newSplits);
        setLastEditedMethod(methodCode);
    };

    const toggleSplitMethod = (methodCode: string) => {
        const totalAdvance = parseFloat(advanceAmount) || 0;
        const newSplits = { ...paymentSplits };
        
        if (newSplits[methodCode] !== undefined) {
            delete newSplits[methodCode];
            // If only one left, give it everything
            const remainingKeys = Object.keys(newSplits);
            if (remainingKeys.length === 1) {
                newSplits[remainingKeys[0]] = totalAdvance;
            }
        } else {
            // Adding a new method
            const currentTotal = Object.values(newSplits).reduce((a, b) => a + b, 0);
            newSplits[methodCode] = Math.max(0, totalAdvance - currentTotal);
            // If it's the first one, it gets everything
            if (Object.keys(newSplits).length === 1) {
                newSplits[methodCode] = totalAdvance;
            }
        }
        setPaymentSplits(newSplits);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const testNames = Object.entries(selectedTests)
            .filter(([_, data]) => data.checked)
            .map(([code]) => {
                const test = formOptions?.testTypes.find(t => t.test_code === code);
                return test?.test_name || code;
            });

        if (testNames.length === 0) {
            toast.error('Please select at least one test');
            return;
        }

        const testAmounts: Record<string, string> = {};
        Object.entries(selectedTests).forEach(([code, data]) => {
            if (data.checked) {
                const test = formOptions?.testTypes.find(t => t.test_code === code);
                testAmounts[test?.test_name || code] = data.amount;
            }
        });

        setIsSubmitting(true);

        try {
            const payload = {
                patient_id: patient?.patient_id, 
                patient_name: patient?.patient_name,
                age: patient?.patient_age || (patient as any).age,
                gender: patient?.patient_gender || (patient as any).gender,
                phone_number: patient?.patient_phone || (patient as any).phone_number,
                referred_by: referredBy,
                limb: testLimb,
                visit_date: visitDate,
                assigned_test_date: assignedDate,
                receipt_no: receiptNo,
                test_done_by: testDoneBy,
                test_names: testNames,
                test_amounts: testAmounts,
                other_test_name: otherTestName,
                total_amount: totalAmount,
                advance_amount: advanceAmount,
                discount: discountAmount,
                payment_method: showPaymentDetails ? 'split' : primaryPaymentMethod,
                payment_amounts: showPaymentDetails ? paymentSplits : { [primaryPaymentMethod]: parseFloat(advanceAmount) || 0 },
                branch_id: user?.branch_id,
                employee_id: user?.employee_id
            };

            const res = await authFetch(`${API_BASE_URL}/reception/test_submit`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success || data.status === 'success') {
                toast.success('Test added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(data.message || 'Failed to add test');
            }
        } catch (err: any) {
            toast.error(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !patient) return null;

    const labelClass = "block text-[10px] font-black text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest mb-1.5 ml-1";
    const inputClass = "w-full px-4 py-3 bg-[#f3f4f9] dark:bg-[#1a1c1e] border border-transparent focus:border-[#006e1c] dark:focus:border-[#88d99d] rounded-2xl outline-none transition-all text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#49454f]/40";
    
    // Safety check for gender/age/phone mapping
    const displayGender = patient?.patient_gender || (patient as any).gender || 'N/A';
    const displayAge = patient?.patient_age || (patient as any).age || 'N/A';
    const displayPhone = patient?.patient_phone || (patient as any).phone_number || 'N/A';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#f0f4f9] dark:bg-[#0b0c0d] w-full max-w-[1400px] max-h-[95vh] rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
            >
                {/* Header - Modern Integrated look */}
                <div className="px-8 py-6 flex items-center justify-between bg-white dark:bg-[#1a1c1e] border-b border-[#e0e2ec] dark:border-[#2c2d2e] relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#006e1c]/10 dark:bg-[#88d99d]/10 flex items-center justify-center">
                            <FilePlus className="text-[#006e1c] dark:text-[#88d99d]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a1c1e] dark:text-white uppercase tracking-tight">New Test Record</h2>
                            <p className="text-xs font-bold text-[#49454f] dark:text-[#8e918f]">Booking for <span className="text-[#006e1c] dark:text-[#88d99d]">{patient.patient_name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-all group">
                        <X size={20} className="text-[#49454f] dark:text-[#cac4d0] group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                        {/* LEFT COLUMN: Data Entry */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* SECTION: Patient Information */}
                            <div className="bg-white dark:bg-[#1a1c1e] rounded-[32px] p-6 border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-[#006e1c]/10 dark:bg-[#88d99d]/10 flex items-center justify-center text-[#006e1c] dark:text-[#88d99d]">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-[#1a1c1e] dark:text-[#e3e2e6]">Patient Profile</h3>
                                        <p className="text-[10px] font-bold text-[#49454f] dark:text-[#8e918f] uppercase tracking-tighter">Details verified from records</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className={labelClass}>Patient Name</p>
                                        <p className="px-1 text-base font-black text-[#1a1c1e] dark:text-white truncate">{patient.patient_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelClass}>Age / Gender</p>
                                        <p className="px-1 text-base font-black text-[#1a1c1e] dark:text-white">{displayAge}Y / {displayGender}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelClass}>Phone Number</p>
                                        <p className="px-1 text-base font-black text-[#1a1c1e] dark:text-white">{displayPhone}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelClass}>Patient ID</p>
                                        <p className="px-1 text-base font-black text-[#006e1c] dark:text-[#88d99d]">#{patient.patient_uid}</p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: Referral & Logistics */}
                            <div className="bg-white dark:bg-[#1a1c1e] rounded-[32px] p-6 border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-[#006e1c]/10 dark:bg-[#88d99d]/10 flex items-center justify-center text-[#006e1c] dark:text-[#88d99d]">
                                        <Activity size={20} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#1a1c1e] dark:text-[#e3e2e6]">Referral & Logistics</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className={labelClass}>Referred By Doctor *</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49454f] dark:text-[#8e918f] group-focus-within:text-[#006e1c] transition-colors">
                                                <Search size={16} />
                                            </div>
                                            <input 
                                                list="test_referrers" 
                                                value={referredBy}
                                                onChange={(e) => setReferredBy(e.target.value)}
                                                required 
                                                className={`${inputClass} pl-12`} 
                                                placeholder="Type or select doctor" 
                                            />
                                            <datalist id="test_referrers">
                                                {formOptions?.referrers.map((r: string) => <option key={r} value={r} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                    <CustomSelect 
                                        label="Limb Selection" 
                                        value={testLimb} 
                                        onChange={setTestLimb} 
                                        options={formOptions?.limbTypes.map((l: any) => ({ label: l.limb_name, value: l.limb_code })) || []} 
                                        placeholder="Not Applicable" 
                                    />
                                    <CustomSelect 
                                        label="Test Performed By *" 
                                        value={testDoneBy} 
                                        onChange={setTestDoneBy} 
                                        options={formOptions?.staffMembers?.map((s: any) => ({ label: s.staff_name, value: s.staff_name })) || []} 
                                        placeholder="Select Staff Member" 
                                    />
                                    <div className="space-y-1">
                                        <label className={labelClass}>Visit Date *</label>
                                        <div 
                                            onClick={() => setOpenVisitPicker(true)}
                                            className={`${inputClass} flex items-center gap-3 cursor-pointer group hover:border-[#006e1c]/40`}
                                        >
                                            <Calendar size={16} className="text-[#49454f] dark:text-[#8e918f] group-hover:text-[#006e1c] transition-colors" />
                                            <span className="text-sm font-bold">{new Date(visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <AnimatePresence>
                                            {openVisitPicker && (
                                                <DatePicker 
                                                    value={visitDate} 
                                                    onChange={setVisitDate} 
                                                    onClose={() => setOpenVisitPicker(false)} 
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>Assigned Test Date *</label>
                                        <div 
                                            onClick={() => setOpenAssignedPicker(true)}
                                            className={`${inputClass} flex items-center gap-3 cursor-pointer group hover:border-[#006e1c]/40`}
                                        >
                                            <Calendar size={16} className="text-[#49454f] dark:text-[#8e918f] group-hover:text-[#006e1c] transition-colors" />
                                            <span className="text-sm font-bold">{new Date(assignedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <AnimatePresence>
                                            {openAssignedPicker && (
                                                <DatePicker 
                                                    value={assignedDate} 
                                                    onChange={setAssignedDate} 
                                                    onClose={() => setOpenAssignedPicker(false)} 
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>Receipt / Reference No</label>
                                        <input type="text" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} className={inputClass} placeholder="Optional" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: Test Selection */}
                            <div className="bg-[#f8f9ff] dark:bg-[#111315] rounded-[32px] p-6 border border-[#e0e2ec] dark:border-[#43474e] shadow-inner">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-[#006e1c]/10 dark:bg-[#88d99d]/10 flex items-center justify-center text-[#006e1c] dark:text-[#88d99d]">
                                        <FlaskConical size={20} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#1a1c1e] dark:text-[#e3e2e6]">Select Lab Tests</h3>
                                </div>

                                {isLoadingOptions ? (
                                    <div className="flex items-center justify-center py-20 gap-3">
                                        <Loader2 className="animate-spin text-[#006e1c]" size={24} />
                                        <p className="text-sm font-bold text-[#49454f] uppercase tracking-widest">Accessing Catalogue...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {formOptions?.testTypes?.filter((t: any) => t.test_code !== 'other').map((test: any) => {
                                            const isSelected = selectedTests[test.test_code]?.checked;
                                            return (
                                                <div 
                                                    key={test.test_code} 
                                                    onClick={() => handleTestCheckChange(test.test_code, !isSelected)} 
                                                    className={`p-5 rounded-[24px] cursor-pointer transition-all border-2 flex flex-col gap-4 group relative overflow-hidden ${isSelected ? 'bg-[#006e1c] border-[#006e1c] shadow-[0_12px_24px_rgba(0,110,28,0.25)] scale-[1.02]' : 'bg-white dark:bg-[#1a1c1e] border-transparent hover:border-[#006e1c]/30 shadow-sm'}`}
                                                >
                                                    {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-2xl" />}
                                                    
                                                    <div className="flex items-center justify-between z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white text-[#006e1c]' : 'border-[#e0e2ec] dark:border-[#43474e] text-transparent'}`}>
                                                                <Check size={16} strokeWidth={4} />
                                                            </div>
                                                            <span className={`text-base font-black transition-colors ${isSelected ? 'text-white' : 'text-[#1a1c1e] dark:text-[#e3e2e6]'}`}>{test.test_name}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {isSelected ? (
                                                        <div className="relative z-10 animate-in slide-in-from-top-1 duration-200">
                                                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"><IndianRupee size={16} /></div>
                                                             <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                value={selectedTests[test.test_code]?.amount || ''} 
                                                                onClick={(e) => e.stopPropagation()} 
                                                                onChange={(e) => handleTestAmountChange(test.test_code, e.target.value)} 
                                                                className="w-full pl-9 pr-4 py-3 bg-white/15 border border-white/20 rounded-xl text-base font-black text-white outline-none focus:bg-white/20 placeholder:text-white/30" 
                                                                placeholder="0.00" 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] font-black text-[#49454f] dark:text-[#8e918f] uppercase tracking-widest pl-1 opacity-60">Standard Cost: ₹{parseFloat(test.default_cost).toLocaleString()}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Other Test Option */}
                                        {formOptions?.testTypes?.find((t: any) => t.test_code === 'other') && (
                                            <div className={`p-4 rounded-[24px] border-2 transition-all col-span-full ${selectedTests['other']?.checked ? 'bg-white dark:bg-[#1a1c1e] border-[#006e1c] shadow-lg scale-[1.01]' : 'bg-white/40 dark:bg-black/20 border-dashed border-[#e0e2ec] dark:border-[#43474e]'}`}>
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div onClick={() => handleTestCheckChange('other', !selectedTests['other']?.checked)} className="flex items-center gap-3 cursor-pointer">
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTests['other']?.checked ? 'bg-[#006e1c] border-[#006e1c] text-white' : 'border-[#e0e2ec] dark:border-[#43474e] text-transparent'}`}>
                                                            <Check size={16} strokeWidth={4} />
                                                        </div>
                                                        <span className="text-sm font-black text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-[0.2em]">{selectedTests['other']?.checked ? 'Custom Test Active' : 'Other / Custom Test'}</span>
                                                    </div>
                                                    {selectedTests['other']?.checked && (
                                                        <div className="flex-1 flex gap-4 animate-in zoom-in-95 duration-200">
                                                            <input type="text" value={otherTestName} onChange={(e) => setOtherTestName(e.target.value)} placeholder="Enter custom test name" className="flex-1 bg-[#f0f4f9] dark:bg-black/30 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-[#006e1c]/20" />
                                                            <div className="relative w-40">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49454f] dark:text-[#8e918f]"><IndianRupee size={16} /></div>
                                                                <input type="number" step="0.01" value={selectedTests['other']?.amount || ''} onChange={(e) => handleTestAmountChange('other', e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#f0f4f9] dark:bg-black/30 border-none rounded-2xl text-lg font-black text-right outline-none focus:ring-2 ring-[#006e1c]/20" placeholder="0.00" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Financial Summary & Actions (Sticky) */}
                        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-0">
                            {/* SECTION: Financial Summary */}
                            <div className="bg-[#006e1c] dark:bg-[#0c3b10] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                                
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                                        <Wallet size={16} /> Settlement Details
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {parseFloat(advanceAmount) > 0 && (
                                            <div className="relative group">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const newState = !showPaymentDetails;
                                                            setShowPaymentDetails(newState);
                                                            if (newState && Object.keys(paymentSplits).length === 0 && primaryPaymentMethod) {
                                                                setPaymentSplits({ [primaryPaymentMethod]: parseFloat(advanceAmount) || 0 });
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border cursor-pointer z-20 relative ${showPaymentDetails ? 'bg-white text-[#006e1c] border-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white border-white/5'}`}
                                                    >
                                                        {showPaymentDetails ? 'Split Mode' : 'Single Mode'} {showPaymentDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                    
                                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10 cursor-help transition-colors hover:text-white">
                                                        <Info size={14} />
                                                    </div>
                                                </div>
                                                
                                                {/* Tooltip */}
                                                <div className="absolute top-full mt-3 right-0 w-56 p-3 bg-[#0c3b10] border border-white/20 rounded-2xl text-[10px] font-bold text-white leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-50 pointer-events-none scale-95 group-hover:scale-100 origin-top-right">
                                                    {showPaymentDetails 
                                                        ? "Payment is currently split across multiple methods." 
                                                        : "Click to split this payment across methods like Cash, UPI, and Card."}
                                                    <div className="absolute bottom-full right-6 w-3 h-3 bg-[#0c3b10] rotate-45 translate-y-1.5 border-l border-t border-white/20" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Billable</p>
                                        <div className="text-4xl font-black tabular-nums">₹{parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Advance Received</p>
                                        <div className="relative group">
                                            <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                value={advanceAmount} 
                                                onChange={(e) => setAdvanceAmount(e.target.value)} 
                                                className="w-full pl-11 pr-5 py-3.5 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all text-xl font-black placeholder:text-white/20" 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Discount</p>
                                        <div className="relative group">
                                            <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                value={discountAmount} 
                                                onChange={(e) => setDiscountAmount(e.target.value)} 
                                                className="w-full pl-11 pr-5 py-3.5 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all text-xl font-black placeholder:text-white/20" 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>

                                    {!showPaymentDetails && parseFloat(advanceAmount) > 0 && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Payment Method</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {formOptions?.paymentMethods.map(m => (
                                                    <button
                                                        key={m.method_code}
                                                        type="button"
                                                        onClick={() => setPrimaryPaymentMethod(m.method_code)}
                                                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${primaryPaymentMethod === m.method_code ? 'bg-white text-[#006e1c] border-white shadow-lg' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                                                    >
                                                        {m.method_name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${parseFloat(dueAmount) > 0 ? 'bg-amber-400 text-amber-950' : 'bg-white text-[#006e1c]'}`}>
                                        {parseFloat(dueAmount) > 0 ? <AlertCircle size={24} strokeWidth={2.5} /> : <Check size={24} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Due Amount</p>
                                        <p className="text-2xl font-black tabular-nums transition-colors">₹{parseFloat(dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {showPaymentDetails && parseFloat(advanceAmount) > 0 && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-6"
                                        >
                                            <div className="space-y-3">
                                                {formOptions?.paymentMethods.map(m => {
                                                    const isChecked = paymentSplits[m.method_code] !== undefined;
                                                    return (
                                                        <div 
                                                            key={m.method_code} 
                                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isChecked ? 'bg-white text-[#1a1c1e] border-white' : 'bg-white/5 border-white/10'}`}
                                                        >
                                                            <div 
                                                                onClick={() => toggleSplitMethod(m.method_code)}
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isChecked ? 'bg-[#006e1c] border-[#006e1c] text-white' : 'border-white/30'}`}
                                                            >
                                                                {isChecked && <Check size={12} strokeWidth={4} />}
                                                            </div>
                                                            <span className="flex-1 text-[10px] font-black uppercase tracking-widest truncate">{m.method_name}</span>
                                                            {isChecked && (
                                                                <input 
                                                                    type="number" 
                                                                    value={paymentSplits[m.method_code] || ''} 
                                                                    onChange={(e) => updateSplitAmount(m.method_code, parseFloat(e.target.value) || 0)}
                                                                    className="w-20 bg-[#f3f4f9] border-none rounded-lg px-2 py-1.5 text-xs font-black text-right outline-none text-[#1a1c1e]"
                                                                    placeholder="0"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <div className="pt-2 flex justify-between items-center opacity-60">
                                                    <p className="text-[9px] font-black uppercase italic">Sum:</p>
                                                    <p className="text-sm font-black">₹{Object.values(paymentSplits).reduce((a, b) => a + b, 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* FINAL ACTIONS */}
                            <div className="flex flex-col gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-white rounded-[32px] font-black text-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 border border-[#e0e2ec] dark:border-white/10 group relative"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin text-[#006e1c]" size={28} />
                                            <span className="uppercase tracking-widest animate-pulse">Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-[#006e1c] text-white flex items-center justify-center">
                                                <Check size={20} strokeWidth={4} />
                                            </div>
                                            <span className="uppercase tracking-widest text-lg">Confirm and Save</span>
                                        </>
                                    )}
                                </button>
                                {parseFloat(advanceAmount) <= 0 && (
                                    <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest text-center px-4">
                                        <Hourglass size={14} strokeWidth={3} className="animate-spin-slow" />
                                        <span>Admin approval required for zero advance payment</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AddTestModal;

