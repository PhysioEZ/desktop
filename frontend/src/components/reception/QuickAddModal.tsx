import { useState, useEffect, useMemo } from 'react';
import { 
    X, Clock, UserPlus, AlertCircle, Zap, Package, Calendar, IndianRupee, Hash, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authFetch } from '../../config';
import { format, addDays } from 'date-fns';
import CustomSelect from '../ui/CustomSelect';
import DatePicker from '../ui/DatePicker';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: any;
    type: 'physio' | 'speech';
    onSuccess: () => void;
}

const QuickAddModal = ({ isOpen, onClose, registration, type, onSuccess }: QuickAddModalProps) => {
    const isPhysio = type === 'physio';
    
    // Form State
    const [treatmentType, setTreatmentType] = useState<'daily' | 'advance' | 'package'>('daily');
    const [costPerDay, setCostPerDay] = useState<number>(isPhysio ? 750 : 500);
    const [days, setDays] = useState<number>(10);
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [timeSlot, setTimeSlot] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [advancePayment, setAdvancePayment] = useState<number>(0);
    
    // Split Payment State
    const [paymentSplits, setPaymentSplits] = useState<{[key: string]: number}>({});
    
    const [approverId, setApproverId] = useState<string>('');
    
    // UI State
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [options, setOptions] = useState<any>({
        paymentMethods: [],
        employees: []
    });
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const existingPatient = useMemo(() => {
        if (!registration.existing_services) return null;
        return registration.existing_services.find((s: any) => s.service_type === (isPhysio ? 'physio' : 'speech_therapy'));
    }, [registration.existing_services, isPhysio]);

    // Calculations
    const calculations = useMemo(() => {
        const subtotal = costPerDay * days;
        const discountAmt = (subtotal * discount) / 100;
        const totalAmount = subtotal - discountAmt;
        const due = totalAmount - advancePayment;

        return {
            subtotal,
            discountAmt,
            totalAmount,
            due
        };
    }, [costPerDay, days, discount, advancePayment]);

    const endDate = useMemo(() => {
        if (!startDate || days <= 0) return null;
        return format(addDays(new Date(startDate), days - 1), 'yyyy-MM-dd');
    }, [startDate, days]);

    // Handle Type Defaults
    useEffect(() => {
        if (!isOpen) return;

        if (isPhysio) {
            if (treatmentType === 'daily') {
                setCostPerDay(750);
                setDays(1);
            } else if (treatmentType === 'advance') {
                setCostPerDay(1200);
                setDays(1);
            } else if (treatmentType === 'package') {
                setCostPerDay(2000);
                setDays(20);
            }
        } else {
            // Speech
            if (treatmentType === 'package') {
                setCostPerDay(423.08);
                setDays(26);
            } else {
                setCostPerDay(500);
                setDays(1);
                if (treatmentType === 'advance') {
                    setTreatmentType('daily');
                }
            }
        }
    }, [treatmentType, isPhysio, isOpen]);

    // Reset approver if discount is 0
    useEffect(() => {
        if (discount === 0) {
            setApproverId('');
        }
    }, [discount]);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen]);

    // Sync split amount if only one method is selected
    useEffect(() => {
        const keys = Object.keys(paymentSplits);
        if (keys.length === 1) {
            const method = keys[0];
            setPaymentSplits({ [method]: advancePayment });
        }
    }, [advancePayment]);

    // Re-fetch slots when date changes
    useEffect(() => {
        if (isOpen && startDate) {
            fetchSlots();
        }
    }, [startDate, isOpen]);

    const fetchOptions = async () => {
        setIsLoadingOptions(true);
        try {
            const resOptions = await authFetch(`${API_BASE_URL}/reception/form_options?branch_id=${registration.branch_id}`);
            const dataOptions = await resOptions.json();
            
            const resPayments = await authFetch(`${API_BASE_URL}/reception/get_payment_methods`);
            const dataPayments = await resPayments.json();

            setOptions({
                paymentMethods: dataPayments.status === 'success' ? dataPayments.data : [],
                employees: dataOptions.status === 'success' ? dataOptions.data.employees : []
            });
        } catch (err) {
            console.error('Failed to fetch options:', err);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
            const serviceType = isPhysio ? 'physio' : 'speech_therapy';
            const res = await authFetch(`${API_BASE_URL}/reception/get_treatment_slots?date=${startDate}&service_type=${serviceType}`);
            const data = await res.json();
            
            if (data.success) {
                const capacity = isPhysio ? 10 : 1;
                const slots = generateTimeSlots(serviceType);
                setTimeSlots(slots.map(s => {
                    const bookedCount = data.booked[`${s.time}:00`] || 0;
                    return {
                        value: s.time,
                        label: `${s.label} (${bookedCount}/${capacity} booked)`,
                        disabled: bookedCount >= capacity
                    };
                }));
            }
        } catch (err) {
            console.error('Failed to fetch slots:', err);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const generateTimeSlots = (serviceType: string) => {
        const slots = [];
        let start, end, interval;

        if (serviceType === 'physio') {
            start = new Date('1970-01-01T09:00:00');
            end = new Date('1970-01-01T19:00:00');
            interval = 90; 
        } else {
            start = new Date('1970-01-01T15:00:00');
            end = new Date('1970-01-01T19:00:00');
            interval = 60;
        }

        while (start < end) {
            const time = start.toTimeString().substring(0, 5); 
            const label = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            slots.push({ time, label });
            start.setMinutes(start.getMinutes() + interval);
        }
        return slots;
    };

    const handleSave = async () => {
        setError(null);
        const splitTotal = Object.values(paymentSplits).reduce((a, b) => a + b, 0);
        if (advancePayment > 0 && Math.abs(splitTotal - advancePayment) > 0.01) {
            setError(`Payment split total (₹${splitTotal}) must match advance payment (₹${advancePayment})`);
            return;
        }
        if (!timeSlot) {
            setError('Please select a time slot');
            return;
        }
        if (discount > 0 && !approverId) {
            setError('Discount approval required');
            return;
        }

        setIsSaving(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/quick_add_patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationId: registration.registration_id,
                    serviceType: isPhysio ? 'physio' : 'speech_therapy',
                    treatmentType,
                    treatmentDays: days,
                    totalCost: calculations.totalAmount,
                    advancePayment,
                    discount,
                    dueAmount: calculations.due,
                    startDate,
                    paymentMethod: Object.keys(paymentSplits).join(', '),
                    paymentSplits: Object.entries(paymentSplits).map(([method, amount]) => ({ method, amount })),
                    treatment_time_slot: timeSlot,
                    discount_approved_by_employee_id: approverId
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Failed to add patient');
            }
        } catch (err: any) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#1c1b1f]/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="bg-[#fef7ff] dark:bg-[#141218] w-full max-w-5xl max-h-[95vh] rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-[#eaddff] dark:border-[#49454f]"
                >
                    {/* M3 Header */}
                    <div className="px-8 py-6 flex justify-between items-center bg-[#fef7ff] dark:bg-[#141218]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#006a6a] flex items-center justify-center text-white shadow-lg shadow-[#006a6a]/20">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-[#1c1b1f] dark:text-[#e6e1e5] tracking-tight">
                                    Convert to {isPhysio ? 'Physio' : 'Speech'} Patient
                                </h2>
                                <p className="text-[13px] text-[#49454f] dark:text-[#cac4d0] font-medium">
                                    Patient: <span className="text-[#006a6a] dark:text-[#80d4d4]">{registration.patient_name}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 flex items-center justify-center hover:bg-[#1c1b1f]/8 dark:hover:bg-[#e6e1e5]/8 rounded-full transition-all text-[#49454f] dark:text-[#cac4d0]"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {existingPatient ? (
                        <div className="mx-8 mb-4 p-4 bg-[#ccebc4]/20 border border-[#ccebc4] rounded-2xl flex items-center gap-3 text-[#006e1c] font-black text-sm shadow-sm ring-1 ring-[#ccebc4]/50">
                            <CheckCircle2 size={18} />
                            <span>This patient is already registered for {isPhysio ? 'Physiotherapy' : 'Speech Therapy'}. (Patient ID: {existingPatient.patient_id})</span>
                        </div>
                    ) : (
                        <div className="mx-8 mb-4 p-4 bg-[#ffefc2]/30 border border-[#dec650] rounded-2xl flex items-center gap-3 text-[#675402] font-black text-sm shadow-sm ring-1 ring-[#675402]/20">
                            <AlertCircle size={18} />
                            <span>⚠️ No patient found for this Registration ID. You can add them.</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-10">
                            {/* Material Cards for Treatment Types */}
                            <section>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#006a6a] mb-4 block px-2">Treatment Plan</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'daily', title: 'Daily Session', desc: 'Standard pay-per-day', icon: <Clock size={20} />, activeColor: 'bg-[#d8e3f4] text-[#111d2d] border-[#006a6a]' },
                                        { id: 'advance', title: 'Advance Care', desc: 'Premium priority', icon: <Zap size={20} />, activeColor: 'bg-[#f4e0f0] text-[#2d1127] border-[#9c427c]' },
                                        { id: 'package', title: 'RSDT Package', desc: '20 sessions complete', icon: <Package size={20} />, activeColor: 'bg-[#ffedcf] text-[#2d1f11] border-[#8a5100]' }
                                    ].filter(p => isPhysio || p.id !== 'advance').map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setTreatmentType(p.id as any)}
                                            className={`group relative flex flex-col p-5 rounded-2xl border-2 transition-all text-left ${treatmentType === p.id ? `${p.activeColor} ring-2 ring-offset-2 ring-[#006a6a]/20` : 'border-[#cac4d0] dark:border-[#49454f] bg-transparent hover:bg-[#1c1b1f]/5 dark:hover:bg-[#e6e1e5]/5'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${treatmentType === p.id ? 'bg-white/40' : 'bg-[#1c1b1f]/8 dark:bg-[#e6e1e5]/8'}`}>
                                                {p.icon}
                                            </div>
                                            <h4 className="text-sm font-bold mb-1 opacity-90">{p.title}</h4>
                                            <p className="text-xs opacity-70 font-medium">{p.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* M3 Form Column - Schedule */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 px-2">
                                        <Calendar size={16} className="text-[#006a6a]" />
                                        <h3 className="text-sm font-bold text-[#1c1b1f] dark:text-[#e6e1e5]">Schedule Configuration</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10 transition-colors group-focus-within:text-[#006a6a]">Rate / Day</span>
                                            <div className="relative">
                                                <IndianRupee size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454f]" />
                                                <input 
                                                    type="number" 
                                                    value={costPerDay} 
                                                    onChange={(e) => setCostPerDay(Number(e.target.value))}
                                                    className="w-full pl-9 pr-4 py-3 bg-transparent border border-[#79747e] dark:border-[#938f99] rounded-xl text-sm font-medium focus:ring-1 ring-[#006a6a] border-[#006a6a] outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="relative group">
                                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10">Total Days</span>
                                            <div className="relative">
                                                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454f]" />
                                                <input 
                                                    type="number" 
                                                    value={days} 
                                                    onChange={(e) => setDays(Number(e.target.value))}
                                                    className="w-full pl-9 pr-4 py-3 bg-transparent border border-[#79747e] dark:border-[#938f99] rounded-xl text-sm font-medium focus:ring-1 ring-[#006a6a] outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10 transition-colors group-hover:text-[#006a6a]">Start From</span>
                                            <div 
                                                onClick={() => setOpenDatePicker(true)}
                                                className="w-full px-4 py-3 bg-transparent border border-[#79747e] dark:border-[#938f99] rounded-xl text-sm font-medium hover:border-[#006a6a] cursor-pointer flex items-center justify-between group transition-all"
                                            >
                                                <span>{format(new Date(startDate), 'dd MMM yyyy')}</span>
                                                <Calendar size={16} className="text-[#49454f] group-hover:text-[#006a6a] transition-colors" />
                                            </div>
                                            <AnimatePresence>
                                                {openDatePicker && (
                                                    <DatePicker 
                                                        value={startDate} 
                                                        onChange={setStartDate} 
                                                        onClose={() => setOpenDatePicker(false)} 
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="relative group">
                                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10 opacity-60">End Date</span>
                                            <div className="w-full px-4 py-3 bg-[#1c1b1f]/5 dark:bg-[#e6e1e5]/5 border border-[#79747e]/30 dark:border-[#938f99]/30 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed flex items-center justify-between">
                                                <span>{endDate ? format(new Date(endDate), 'dd MMM yyyy') : 'N/A'}</span>
                                                <Calendar size={16} className="text-[#49454f]" />
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <CustomSelect 
                                                label="Available Time Slot"
                                                value={timeSlot}
                                                onChange={setTimeSlot}
                                                options={timeSlots}
                                                placeholder={isLoadingSlots ? "Fetching availability..." : "Choose a slot"}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#006a6a] px-2 block">Payment Distribution</span>
                                        <div className="p-1 rounded-2xl border border-[#cac4d0] dark:border-[#49454f] overflow-hidden bg-white/40 dark:bg-black/10">
                                            <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                                                {(options.paymentMethods || []).map((m: any) => (
                                                    <div key={m.method_code} className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${paymentSplits[m.method_code] !== undefined ? 'bg-[#006a6a]/8 border border-[#006a6a]/20' : 'hover:bg-[#1c1b1f]/5 dark:hover:bg-[#e6e1e5]/5'}`}>
                                                        <label className="flex items-center gap-3 cursor-pointer flex-1 group">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={!!paymentSplits[m.method_code]} 
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            const currentTotal = Object.values(paymentSplits).reduce((a, b) => a + b, 0);
                                                                            const remaining = Math.max(0, advancePayment - currentTotal);
                                                                            setPaymentSplits(p => ({ ...p, [m.method_code]: remaining }));
                                                                        } else {
                                                                            const newSplits = { ...paymentSplits };
                                                                            delete newSplits[m.method_code];
                                                                            setPaymentSplits(newSplits);
                                                                        }
                                                                    }}
                                                                    className="peer appearance-none w-5 h-5 rounded-md border-2 border-[#79747e] checked:bg-[#006a6a] checked:border-[#006a6a] transition-all cursor-pointer"
                                                                />
                                                                <span className="absolute left-1.5 opacity-0 peer-checked:opacity-100 flex items-center justify-center text-white text-[10px]">✓</span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-[#1c1b1f] dark:text-[#e6e1e5]">{m.method_name}</span>
                                                        </label>
                                                        {paymentSplits[m.method_code] !== undefined && (
                                                            <div className="relative w-36 ml-4 animate-in fade-in slide-in-from-right-2 duration-200">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#006a6a]">₹</span>
                                                                <input 
                                                                    type="number"
                                                                    value={paymentSplits[m.method_code] || ''}
                                                                    onChange={(e) => setPaymentSplits(p => ({ ...p, [m.method_code]: parseFloat(e.target.value) || 0 }))}
                                                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#1c1b1f] border border-[#006a6a] rounded-lg text-sm font-bold text-right outline-none ring-2 ring-[#006a6a]/10"
                                                                    placeholder="0.00"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-4 py-3 bg-[#f7f2fa] dark:bg-[#1c1b1f]/40 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-[#49454f] uppercase tracking-wider">Split Reconciliation</span>
                                                <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${Math.abs(Object.values(paymentSplits).reduce((a, b) => a + b, 0) - advancePayment) < 0.1 ? 'bg-[#e7f4e8] text-[#1e4620]' : 'bg-[#fceeee] text-[#8c1d18]'}`}>
                                                    ₹{Object.values(paymentSplits).reduce((a, b) => a + b, 0).toFixed(2)} / ₹{advancePayment.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* M3 Form Column - Billing */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 px-2">
                                        <IndianRupee size={16} className="text-[#006a6a]" />
                                        <h3 className="text-sm font-bold text-[#1c1b1f] dark:text-[#e6e1e5]">Billing Summary</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="relative group opacity-80">
                                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10">Calculated Subtotal</span>
                                            <div className="relative">
                                                <IndianRupee size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454f]" />
                                                <input 
                                                    type="text" 
                                                    value={calculations.subtotal.toFixed(2)} 
                                                    readOnly
                                                    className="w-full pl-9 pr-4 py-3 bg-[#1c1b1f]/5 dark:bg-[#e6e1e5]/5 border border-[#79747e]/30 dark:border-[#938f99]/30 rounded-xl text-sm font-bold cursor-not-allowed outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10">Discount %</span>
                                                <input 
                                                    type="number" 
                                                    value={discount} 
                                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-transparent border border-[#79747e] dark:border-[#938f99] rounded-xl text-sm font-bold focus:ring-1 ring-[#006a6a] outline-none text-right"
                                                    min="0" max="100"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-[#fef7ff] dark:bg-[#141218] text-[#49454f] dark:text-[#cac4d0] z-10 transition-colors group-focus-within:text-[#006a6a]">Advance Paid</span>
                                                <input 
                                                    type="number" 
                                                    value={advancePayment} 
                                                    onChange={(e) => setAdvancePayment(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-transparent border border-[#006a6a] ring-1 ring-[#006a6a] rounded-xl text-sm font-bold outline-none text-right"
                                                />
                                            </div>
                                        </div>

                                        <CustomSelect 
                                            label="Authorized Discount By"
                                            value={approverId}
                                            onChange={setApproverId}
                                            options={options.employees.map((e: any) => ({
                                                value: e.employee_id.toString(),
                                                label: `${e.first_name} ${e.last_name}`
                                            }))}
                                            disabled={discount === 0}
                                            placeholder={discount > 0 ? "Select Approver" : "Not Required"}
                                        />

                                        <div className="p-6 rounded-[24px] bg-[#006a6a]/5 border-2 border-dashed border-[#006a6a]/30 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-[#49454f] uppercase tracking-widest">Effective Amount</span>
                                                <span className="text-sm font-bold text-[#1c1b1f]">₹{calculations.totalAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-t border-[#006a6a]/10">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-[#8c1d18]">Pending Balance</span>
                                                    <span className="text-[10px] text-[#49454f] font-medium italic">Amount to be collected later</span>
                                                </div>
                                                <span className="text-2xl font-black text-[#8c1d18] tracking-tighter">₹{calculations.due.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-bold flex items-center gap-3 border border-[#ba1a1a]/20"
                                        >
                                            <AlertCircle size={16} /> {error}
                                        </motion.div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* M3 Footer Actions */}
                    <div className="px-8 py-6 flex justify-end gap-3 bg-[#fef7ff] dark:bg-[#141218]">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#006a6a] hover:bg-[#006a6a]/8 transition-all"
                        >
                            Dismiss
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isLoadingOptions || !!existingPatient}
                            className="px-8 py-2.5 bg-[#006a6a] hover:bg-[#005a5a] text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl shadow-[#006a6a]/20 transition-all disabled:opacity-38 disabled:shadow-none"
                        >
                            {(isSaving || isLoadingOptions) ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={18} />}
                            {isSaving ? 'Synchronizing...' : (existingPatient ? 'Already Registered' : `Finalize & Add Patient`)}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QuickAddModal;
