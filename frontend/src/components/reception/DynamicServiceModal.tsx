import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    X, Clock, UserPlus, AlertCircle, Zap, Calendar, Check, 
    Activity, CreditCard, Layout, Loader2, IndianRupee, Hash,
    Microscope, Bone, Stethoscope, HeartPulse, Syringe, Brain, Waves, Timer, Pill, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authFetch } from '../../config';
import { format, addDays } from 'date-fns';
import CustomSelect from '../ui/CustomSelect';

interface FormField {
    id: string;
    type: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'heading';
    label: string;
    description?: string;
    placeholder?: string;
    required: boolean;
    colSpan: 1 | 2;
    options?: { label: string; value: string }[];
}

interface ServicePlan {
    id: string;
    icon: string;
    name: string;
    subtitle: string;
    rate: number;
    days: number;
}

interface ServiceTrack {
    id: string;
    name: string;
    buttonLabel: string;
    icon: string;
    themeColor: string;
    fields: FormField[];
    pricing: {
        enabled: boolean;
        model: 'multi-plan' | 'fixed-rate';
        plans: ServicePlan[];
        fixedRate: number;
    };
    scheduling: {
        enabled: boolean;
        slotInterval: number;
        slotCapacity: number;
        startTime: string;
        endTime: string;
    };
    permissions: {
        allowDiscount: boolean;
        maxDiscountPercent: number;
        requireDiscountApproval: boolean;
        allowedPaymentMethods: string[];
        allowSplitPayment: boolean;
    };
    isActive: boolean;
}

interface DynamicServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: any;
    track: ServiceTrack;
    onSuccess: () => void;
}

const AVAILABLE_ICONS = [
    { name: 'Activity', icon: Activity },
    { name: 'Zap', icon: Zap },
    { name: 'Clock', icon: Clock },
    { name: 'Calendar', icon: Calendar },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'UserPlus', icon: UserPlus },
    { name: 'Layout', icon: Layout },
    { name: 'Microscope', icon: Microscope },
    { name: 'Bone', icon: Bone },
    { name: 'Stethoscope', icon: Stethoscope },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'Syringe', icon: Syringe },
    { name: 'Brain', icon: Brain },
    { name: 'Waves', icon: Waves },
    { name: 'Timer', icon: Timer },
    { name: 'Pill', icon: Pill },
    { name: 'Box', icon: Box }
];

const IconComponent = ({ name, size = 20 }: { name: string, size?: number }) => {
    // @ts-ignore
    const Icon = AVAILABLE_ICONS.find(i => i.name === name)?.icon || Activity;
    return <Icon size={size} />;
};

const OutlinedInput = ({ label, value, onChange, type = 'text', icon: Icon, disabled = false, readOnly = false, prefix = '', themeColor = '#6366f1', placeholder = '' }: any) => (
    <div className="relative group w-full">
        <span className={`absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#141218] transition-colors z-10`} style={{ color: !disabled && !readOnly ? themeColor : '#49454f' }}>
            {label}
        </span>
        <div className={`relative flex items-center border rounded-xl transition-all ${disabled || readOnly ? 'bg-[#1c1b1f]/5 dark:bg-[#e6e1e5]/5 border-[#79747e]/30' : 'border-[#79747e] dark:border-[#938f99] focus-within:ring-2 shadow-sm'}`} 
             style={{ borderColor: !disabled && !readOnly ? undefined : undefined }}>
            {Icon && <Icon size={16} className="absolute left-3.5 text-[#49454f] dark:text-[#cac4d0]" />}
            {prefix && <span className="absolute left-3.5 text-sm font-bold text-[#49454f] dark:text-[#cac4d0]">{prefix}</span>}
            <input 
                type={type}
                value={value ?? ''}
                onChange={onChange}
                onFocus={(e) => e.target.select()}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-full bg-transparent px-4 py-3 text-sm font-medium outline-none rounded-xl ${Icon || prefix ? 'pl-9' : ''} ${disabled || readOnly ? 'text-[#49454f]/60 cursor-not-allowed' : 'text-[#1c1b1f] dark:text-[#e3e2e6]'}`}
            />
        </div>
    </div>
);

const DynamicServiceModal = ({ isOpen, onClose, registration, track, onSuccess }: DynamicServiceModalProps) => {
    // Form State
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [rate, setRate] = useState<string>('0');
    const [days, setDays] = useState<string>('1');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [discount, setDiscount] = useState<string>('0');
    const [advance, setAdvance] = useState<string>('0');
    const [paymentSplits, setPaymentSplits] = useState<Record<string, number>>({});
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [authorizedBy, setAuthorizedBy] = useState<string>('');

    // UI & Options State
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [options, setOptions] = useState<any>({
        paymentMethods: [],
        employees: []
    });
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);

    // Initialize state when track changes
    useEffect(() => {
        if (isOpen && track) {
            const firstPlan = track.pricing?.plans?.[0];
            if (firstPlan) {
                setSelectedPlanId(firstPlan.id);
                setRate(firstPlan.rate.toString());
                setDays(firstPlan.days.toString());
            } else if (track.pricing?.model === 'fixed-rate') {
                setRate(track.pricing.fixedRate.toString());
            }
            fetchOptions();
        }
    }, [isOpen, track]);

    const fetchOptions = async () => {
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
        }
    };

    const fetchSlots = useCallback(async () => {
        if (!track.scheduling?.enabled || !startDate) return;
        setIsLoadingSlots(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/get_treatment_slots?date=${startDate}&service_type=${track.name.toLowerCase().replace(/\s+/g, '_')}`);
            const data = await res.json();
            if (data.success) {
                const slots = [];
                const interval = track.scheduling.slotInterval || 60;
                const capacity = track.scheduling.slotCapacity || 1;
                const current = new Date(`1970-01-01T${track.scheduling.startTime}:00`);
                const end = new Date(`1970-01-01T${track.scheduling.endTime}:00`);
                while (current < end) {
                    const timeStr = current.toTimeString().substring(0, 5);
                    const bookedCount = data.booked[`${timeStr}:00`] || 0;
                    slots.push({
                        value: timeStr,
                        label: `${current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${bookedCount}/${capacity})`,
                        disabled: bookedCount >= capacity
                    });
                    current.setMinutes(current.getMinutes() + interval);
                }
                setAvailableSlots(slots);
            }
        } catch (err) {
            console.error('Failed to fetch slots:', err);
        } finally {
            setIsLoadingSlots(false);
        }
    }, [startDate, track]);

    useEffect(() => {
        if (isOpen && track.scheduling?.enabled && startDate) {
            fetchSlots();
        }
    }, [startDate, isOpen, track, fetchSlots]);

    const handlePlanChange = (planId: string) => {
        const plan = track.pricing.plans.find(p => p.id === planId);
        if (plan) {
            setSelectedPlanId(planId);
            setRate(plan.rate.toString());
            setDays(plan.days.toString());
        }
    };

    const billing = useMemo(() => {
        const numRate = parseFloat(rate.toString()) || 0;
        const numDays = parseInt(days.toString()) || 0;
        const numDiscount = parseFloat(discount.toString()) || 0;
        const numAdvance = parseFloat(advance.toString()) || 0;

        const subtotal = numRate * numDays;
        const discountAmount = (subtotal * numDiscount) / 100;
        const effectiveAmount = subtotal - discountAmount;
        const pendingBalance = effectiveAmount - numAdvance;
        const totalDistributed = Object.values(paymentSplits).reduce((sum, val) => sum + val, 0);
        const reconciliationError = numAdvance > 0 && Math.abs(totalDistributed - numAdvance) > 0.01;
        return { subtotal, discountAmount, effectiveAmount, pendingBalance, totalDistributed, reconciliationError, numAdvance };
    }, [rate, days, discount, advance, paymentSplits]);

    const endDate = useMemo(() => {
        const numDays = parseInt(days.toString()) || 0;
        if (!startDate || numDays <= 0) return '';
        try { return format(addDays(new Date(startDate), numDays - 1), 'yyyy-MM-dd'); } catch { return ''; }
    }, [startDate, days]);

    useEffect(() => {
        const keys = Object.keys(paymentSplits);
        if (keys.length === 1) {
            const method = keys[0];
            setPaymentSplits({ [method]: billing.numAdvance });
        }
    }, [billing.numAdvance]);

    const existingPatient = useMemo(() => {
        if (!registration.existing_services || !track) return null;
        const trackSlug = track.name.toLowerCase().replace(/\s+/g, '_');
        return registration.existing_services.find((s: any) => s.service_type === trackSlug);
    }, [registration.existing_services, track]);

    const handleSave = async () => {
        setError(null);
        if (billing.reconciliationError) {
            setError(`Payment distribution (₹${billing.totalDistributed.toFixed(2)}) must match Advance Paid (₹${billing.numAdvance.toFixed(2)})`);
            return;
        }
        if (track.scheduling?.enabled && !selectedSlot) {
            setError('Please select an available time slot');
            return;
        }
        if (discount > 0 && track.permissions?.requireDiscountApproval && !authorizedBy) {
            setError('Discount authorization required from a clinical lead');
            return;
        }

        setIsSaving(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/quick_add_patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        registrationId: registration.registration_id,
                        serviceTrackId: track.id,
                        serviceType: track.name.toLowerCase().replace(/\s+/g, '_'),
                        treatmentType: track.pricing.model === 'multi-plan' ? selectedPlanId : 'fixed',
                        treatmentDays: parseInt(days.toString()) || 0,
                        totalCost: billing.effectiveAmount,
                        advancePayment: billing.numAdvance,
                        discount: parseFloat(discount.toString()) || 0,
                        dueAmount: billing.pendingBalance,
                        startDate,
                        paymentMethod: Object.keys(paymentSplits).join(', '),
                        paymentSplits: Object.entries(paymentSplits).map(([method, amount]) => ({ method, amount })),
                        treatment_time_slot: selectedSlot,
                        discount_approved_by_employee_id: authorizedBy,
                        customFields: formValues,
                        isDynamic: true
                    })
            });
            const data = await res.json();
            if (data.status === 'success') { onSuccess(); onClose(); } else { setError(data.message || 'Failed to convert patient'); }
        } catch (err) { setError('A network error occurred while synchronizing with server'); } finally { setIsSaving(false); }
    };

    if (!isOpen) return null;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#1c1b1f]/60 backdrop-blur-sm" />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 10 }} 
                    className="relative w-full max-w-5xl bg-[#fef7ff] dark:bg-[#141218] rounded-[28px] shadow-[0_24px_48px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[92vh] border border-[#eaddff] dark:border-[#49454f]" 
                    onClick={(e) => e.stopPropagation()}
                >
                    
                    {/* Header - M3 Style */}
                    <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: track.themeColor }}>
                                <IconComponent name={track.icon} size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-[#1c1b1f] dark:text-[#e6e1e5] tracking-tight">Convert to {track.name}</h2>
                                <p className="text-[13px] text-[#49454f] dark:text-[#cac4d0] font-medium">
                                    Patient: <span style={{ color: track.themeColor }}>{registration.patient_name}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#1c1b1f]/8 dark:hover:bg-[#e6e1e5]/8 rounded-full text-[#49454f] dark:text-[#cac4d0] transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Alert Banner */}
                    {existingPatient ? (
                        <div className="mx-8 mb-4 p-4 bg-[#ccebc4]/20 border border-[#ccebc4] rounded-2xl flex items-center gap-3 text-[#006e1c] font-black text-sm shadow-sm ring-1 ring-[#ccebc4]/50">
                            <Check size={18} strokeWidth={4} />
                            <span>This patient is already registered for {track.name}. (Patient ID: {existingPatient.patient_id})</span>
                        </div>
                    ) : (
                        <div className="mx-8 mb-4 p-4 bg-[#ffefc2]/30 border border-[#dec650] rounded-2xl flex items-center gap-3 text-[#675402] font-black text-sm shadow-sm ring-1 ring-[#675402]/20">
                            <AlertCircle size={18} />
                            <span>⚠️ No patient found for this Registration ID. You can add them.</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-10">
                            
                            {/* Plan Selection Section - M3 Style Cards */}
                            {track.pricing?.plans?.length > 0 && (
                                <section>
                                    <span className="text-[11px] font-bold uppercase tracking-widest mb-4 block px-2" style={{ color: track.themeColor }}>Treatment Plan</span>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {track.pricing.plans.map((plan) => {
                                            const isSelected = selectedPlanId === plan.id;
                                            return (
                                                <button
                                                    key={plan.id}
                                                    onClick={() => handlePlanChange(plan.id)}
                                                    className={`group relative flex flex-col p-5 rounded-2xl border-2 transition-all text-left ${isSelected ? `ring-2 ring-offset-2 border-[${track.themeColor}]` : 'border-[#cac4d0] dark:border-[#49454f] bg-transparent hover:bg-[#1c1b1f]/5 dark:hover:bg-[#e6e1e5]/5'}`}
                                                    style={{ 
                                                        borderColor: isSelected ? track.themeColor : undefined,
                                                        backgroundColor: isSelected ? `${track.themeColor}08` : undefined,
                                                        boxShadow: isSelected ? `0 0 0 2px ${track.themeColor}20` : undefined
                                                    }}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-white/40' : 'bg-[#1c1b1f]/8 dark:bg-[#e6e1e5]/8'}`} style={{ color: isSelected ? track.themeColor : '#49454f' }}>
                                                        <IconComponent name={plan.icon} size={20} />
                                                    </div>
                                                    <h4 className="text-sm font-bold mb-1 opacity-90 text-[#1c1b1f] dark:text-[#e3e2e6]">{plan.name}</h4>
                                                    <p className="text-xs opacity-70 font-medium text-[#49454f] dark:text-[#cac4d0]">{plan.subtitle}</p>
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: track.themeColor }}>
                                                            <Check size={12} className="text-white" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* LEFT: Configuration */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 px-2">
                                        <Calendar size={16} style={{ color: track.themeColor }} />
                                        <h3 className="text-sm font-bold text-[#1c1b1f] dark:text-[#e6e1e5]">Schedule Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <OutlinedInput label="Rate / Day" value={rate} onChange={(e:any) => setRate(e.target.value)} type="number" prefix="₹" themeColor={track.themeColor} />
                                        <OutlinedInput label="Total Days" value={days} onChange={(e:any) => setDays(e.target.value)} type="number" icon={Hash} themeColor={track.themeColor} />
                                        <OutlinedInput label="Start From" value={startDate} onChange={(e:any) => setStartDate(e.target.value)} type="date" themeColor={track.themeColor} />
                                        <OutlinedInput label="End Date" value={endDate} readOnly type="date" themeColor={track.themeColor} />
                                    </div>

                                    {track.scheduling?.enabled && (
                                        <div className="pt-2">
                                            <CustomSelect 
                                                label="Available Time Slot"
                                                value={selectedSlot}
                                                onChange={setSelectedSlot}
                                                options={availableSlots}
                                                placeholder={isLoadingSlots ? 'Fetching availability...' : 'Choose a slot'}
                                            />
                                        </div>
                                    )}

                                    {/* Payment Distribution */}
                                    {advance > 0 && (
                                        <div className="space-y-4 pt-4">
                                            <span className="text-[11px] font-bold uppercase tracking-widest px-2 block" style={{ color: track.themeColor }}>Payment Distribution</span>
                                            <div className="p-1 rounded-2xl border border-[#cac4d0] dark:border-[#49454f] overflow-hidden bg-white/40 dark:bg-black/10">
                                                <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                                                     {options.paymentMethods
                                                         .filter((m: any) => !track.permissions?.allowedPaymentMethods || track.permissions.allowedPaymentMethods.includes(m.method_code))
                                                         .map((method: any) => (
                                                         <div key={method.method_code} className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${paymentSplits[method.method_code] !== undefined ? 'bg-[#1c1b1f]/5 dark:bg-[#e6e1e5]/5 border border-[#006a6a]/20' : 'hover:bg-[#1c1b1f]/5 dark:hover:bg-[#e6e1e5]/5'}`}>
                                                             <label className="flex items-center gap-3 cursor-pointer flex-1 group">
                                                                 <div className="relative flex items-center">
                                                                     <input type="checkbox" checked={paymentSplits[method.method_code] !== undefined} onChange={(e) => {
                                                                         if (e.target.checked) {
                                                                             const current = Object.values(paymentSplits).reduce((a:number, b:number) => a+b, 0);
                                                                             setPaymentSplits({...paymentSplits, [method.method_code]: Math.max(0, billing.numAdvance - current)});
                                                                         } else {
                                                                             const ns = {...paymentSplits}; delete ns[method.method_code]; setPaymentSplits(ns);
                                                                         }
                                                                     }} className="peer appearance-none w-5 h-5 rounded-md border-2 border-[#79747e] checked:bg-[#006a6a] checked:border-[#006a6a] transition-all cursor-pointer" style={{ accentColor: track.themeColor }} />
                                                                     <span className="absolute left-1.5 opacity-0 peer-checked:opacity-100 flex items-center justify-center text-white text-[10px]">✓</span>
                                                                 </div>
                                                                 <span className="text-sm font-semibold text-[#1c1b1f] dark:text-[#e6e1e5] uppercase tracking-tight">{method.method_name}</span>
                                                             </label>
                                                             {paymentSplits[method.method_code] !== undefined && (
                                                                 <div className="relative w-36 ml-4 animate-in fade-in slide-in-from-right-2">
                                                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: track.themeColor }}>₹</span>
                                                                     <input 
                                                                         type="number" 
                                                                         value={paymentSplits[method.method_code]} 
                                                                         onChange={(e) => setPaymentSplits({...paymentSplits, [method.method_code]: parseFloat(e.target.value) || 0})} 
                                                                         className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#1c1b1f] border rounded-lg text-sm font-bold text-right outline-none ring-2 ring-transparent transition-all" 
                                                                         style={{ borderColor: track.themeColor }}
                                                                         autoFocus
                                                                         onFocus={(e) => e.target.select()}
                                                                     />
                                                                 </div>
                                                             )}
                                                         </div>
                                                     ))}
                                                 </div>
                                                <div className="px-4 py-3 bg-[#f7f2fa] dark:bg-[#1c1b1f]/40 border-t border-[#74777f]/10 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-wider">Split Reconciliation</span>
                                                    <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${!billing.reconciliationError ? 'bg-[#e7f4e8] text-[#1e4620]' : 'bg-[#fceeee] text-[#8c1d18]'}`}>
                                                        ₹{billing.totalDistributed.toFixed(2)} / ₹{billing.numAdvance.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* RIGHT: Billing Summary */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 px-2">
                                        <IndianRupee size={16} style={{ color: track.themeColor }} />
                                        <h3 className="text-sm font-bold text-[#1c1b1f] dark:text-[#e6e1e5]">Billing Summary</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="opacity-80">
                                            <OutlinedInput label="Calculated Subtotal" value={billing.subtotal.toFixed(2)} readOnly prefix="₹" themeColor={track.themeColor} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <OutlinedInput 
                                                label="Discount %" 
                                                value={discount} 
                                                onChange={(e:any) => {
                                                    const val = e.target.value;
                                                    const num = parseFloat(val);
                                                    if (val === '' || num <= (track.permissions?.maxDiscountPercent || 100)) {
                                                        setDiscount(val);
                                                    }
                                                }} 
                                                type="number" 
                                                disabled={!track.permissions?.allowDiscount}
                                                themeColor={track.themeColor}
                                                placeholder="0"
                                            />
                                            <div className="group">
                                                <OutlinedInput label="Advance Paid" value={advance} onChange={(e:any) => setAdvance(e.target.value)} type="number" prefix="₹" themeColor={track.themeColor} />
                                            </div>
                                        </div>
                                        
                                        <CustomSelect 
                                            label="Authorized Discount By"
                                            value={authorizedBy}
                                            onChange={setAuthorizedBy}
                                            options={options.employees.map((e:any) => ({ value: e.employee_id.toString(), label: `${e.first_name} ${e.last_name}` }))}
                                            disabled={discount === 0 || !track.permissions?.requireDiscountApproval}
                                            placeholder={discount > 0 && track.permissions?.requireDiscountApproval ? "Select Admin" : "Not Required"}
                                        />

                                        {/* Billing Box - M3 Dashed Style */}
                                        <div className="p-6 rounded-[24px] bg-[#006a6a]/5 dark:bg-[#006a6a]/10 border-2 border-dashed space-y-4" style={{ borderColor: `${track.themeColor}30`, backgroundColor: `${track.themeColor}05` }}>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest">Effective Amount</span>
                                                <span className="text-sm font-bold text-[#1c1b1f] dark:text-[#e3e2e6]">₹{billing.effectiveAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-t" style={{ borderColor: `${track.themeColor}15` }}>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-[#8c1d18] dark:text-[#ffb4ab]">Pending Balance</span>
                                                    <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-medium italic">Amount to be collected later</span>
                                                </div>
                                                <span className="text-2xl font-black text-[#8c1d18] dark:text-[#ffb4ab] tracking-tighter">₹{billing.pendingBalance.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-bold flex items-center gap-3 border border-[#ba1a1a]/20">
                                            <AlertCircle size={16} /> {error}
                                        </motion.div>
                                    )}
                                </section>
                            </div>

                        </div>
                    </div>

                    {/* Footer - M3 Actions */}
                    <div className="px-8 py-6 flex justify-end gap-3 bg-[#fef7ff] dark:bg-[#141218] border-t border-[#74777f]/10">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#1c1b1f]/8 transition-all" style={{ color: track.themeColor }}>
                            Dismiss
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || billing.reconciliationError || !!existingPatient} 
                            className="px-10 py-2.5 rounded-full font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-38 disabled:shadow-none" 
                            style={{ backgroundColor: track.themeColor, boxShadow: `0 8px 24px -6px ${track.themeColor}60` }}
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                            {isSaving ? 'Synchronizing...' : (existingPatient ? 'Already Registered' : `Finalize & Add Patient`)}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DynamicServiceModal;
