import { useState, useEffect } from 'react';
import { 
    X, Loader2, AlertTriangle, Check, 
    Activity, Zap, Clock, ShieldCheck, Hash, Calendar, CreditCard, Layout
} from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { type Patient, usePatientStore } from '../../../store/usePatientStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChangePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onSuccess: () => void;
}

const AVAILABLE_ICONS: any = {
    Activity, Zap, Clock, Calendar, Check, CreditCard, Layout, ShieldCheck
};

const IconComponent = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
    const Icon = AVAILABLE_ICONS[name] || Activity;
    return <Icon size={size} className={className} />;
};

const OutlinedInput = ({ label, value, onChange, type = 'text', icon: Icon, prefix = '', placeholder = '', themeColor = '#006e1c', disabled = false, readOnly = false }: any) => (
    <div className="relative group w-full">
        <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#1a1c1e] transition-colors z-10" style={{ color: themeColor }}>
            {label}
        </span>
        <div className={`relative flex items-center border rounded-xl transition-all ${disabled || readOnly ? 'bg-[#1c1b1f]/5 border-[#79747e]/30' : 'border-[#79747e] dark:border-[#938f99] focus-within:ring-2 shadow-sm'}`}
             style={{ borderColor: !disabled && !readOnly ? undefined : undefined }}>
            {Icon && <Icon size={16} className="absolute left-3.5 text-[#49454f] dark:text-[#cac4d0]" />}
            {prefix && <span className="absolute left-3.5 text-sm font-bold text-[#49454f] dark:text-[#cac4d0]">{prefix}</span>}
            <input 
                type={type}
                value={value ?? ''}
                onChange={onChange}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-full bg-transparent px-4 py-3 text-sm font-bold outline-none rounded-xl ${Icon || prefix ? 'pl-9' : ''} ${disabled || readOnly ? 'text-[#49454f]/60' : 'text-[#1c1b1f] dark:text-[#e3e2e6]'}`}
            />
        </div>
    </div>
);

const ChangePlanModal = ({ isOpen, onClose, patient, onSuccess }: ChangePlanModalProps) => {
    const { metaData } = usePatientStore();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [selectedTrack, setSelectedTrack] = useState<any>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [rateOrCost, setRateOrCost] = useState(''); 
    const [days, setDays] = useState('');
    const [discount, setDiscount] = useState('0');
    const [advance, setAdvance] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [reason, setReason] = useState('');

    const [finalDue, setFinalDue] = useState(0);
    const [carryOverBalance, setCarryOverBalance] = useState(0);

    const themeColor = selectedTrack?.themeColor || '#006e1c';

    useEffect(() => {
        if (isOpen && patient) {
            setCarryOverBalance(parseFloat(patient.effective_balance?.toString() || '0'));
            
            const fetchTrack = async () => {
                try {
                    let trackId = patient.service_track_id;
                    if (!trackId) {
                        if (patient.service_type?.toLowerCase() === 'physio') trackId = 2;
                        else if (patient.service_type?.toLowerCase() === 'heart') trackId = 3;
                    }
                    if (!trackId) throw new Error('No service track ID found');
                    
                    const res = await authFetch(`${API_BASE_URL}/admin/services?id=${trackId}`);
                    const data = await res.json();
                    if (data.status === 'success') {
                        setSelectedTrack(data.data);
                        if (data.data.pricing?.plans?.length > 0) {
                             const currentPlan = data.data.pricing.plans.find((p: any) => p.id === patient.treatment_type);
                             const target = currentPlan || data.data.pricing.plans[0];
                             setSelectedPlanId(target.id);
                             setRateOrCost(target.rate.toString());
                             setDays(target.days.toString());
                        } else if (data.data.pricing?.model === 'fixed-rate') {
                            setRateOrCost(data.data.pricing.fixedRate.toString());
                            setDays('1');
                        }
                    }
                } catch (err) { console.error(err); }
            };
            fetchTrack();

            setDiscount('0');
            setAdvance('');
            setPaymentMethod('');
            setReason('');
        }
    }, [isOpen, patient]);

    useEffect(() => {
        const rateVal = parseFloat(rateOrCost) || 0;
        const daysVal = parseInt(days) || 0;
        const discountVal = parseFloat(discount) || 0;
        const advanceVal = parseFloat(advance) || 0;
        
        const subtotal = rateVal * daysVal;
        const netBaseCost = subtotal * (1 - (discountVal / 100));
        setFinalDue(netBaseCost - carryOverBalance - advanceVal);
    }, [rateOrCost, days, discount, advance, selectedPlanId, carryOverBalance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedPlan = selectedTrack?.pricing?.plans?.find((p: any) => p.id === selectedPlanId);
        const isPackage = selectedPlan ? (selectedPlan.days > 1) : (parseInt(days) > 1);
        
        if (isPackage && parseInt(days) <= 0) return alert('Package plans require valid treatment days');
        if (parseFloat(advance) > 0 && !paymentMethod) return alert('Please select a payment method');

        setIsLoading(true);
        try {
            const payload = {
                old_patient_id: patient?.patient_id,
                master_patient_id: patient?.master_patient_id || '',
                registration_id: patient?.registration_id,
                new_treatment_type: selectedPlanId || 'fixed',
                new_total_amount: rateOrCost,
                new_treatment_days: days,
                new_discount_percentage: discount,
                new_advance_payment: advance,
                change_plan_payment_method: paymentMethod,
                reason_for_change: reason,
                new_track_id: patient?.service_track_id || selectedTrack?.id,
                action: 'change_plan'
            };

            const res = await authFetch(`${API_BASE_URL}/reception/treatment_plans`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if(data.success) {
                onSuccess();
                onClose();
            } else {
                throw new Error(data.message || 'Failed to change plan');
            }
        } catch (err: any) { alert(err.message); }
        finally { setIsLoading(false); }
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#1c1b1f]/60 backdrop-blur-sm" />
            
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-[#fef7ff] dark:bg-[#141218] w-full max-w-4xl rounded-[32px] shadow-2xl border border-[#eaddff] dark:border-[#49454f] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="px-8 py-6 flex justify-between items-center border-b border-[#74777f]/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: themeColor }}>
                            <IconComponent name={selectedTrack?.icon || 'Layout'} size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#1c1b1f] dark:text-[#e3e2e6] tracking-tight">Change Treatment Plan</h3>
                            <p className="text-sm font-medium text-[#49454f] dark:text-[#cac4d0]">Modifying active services for <span style={{ color: themeColor }}>{patient.patient_name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#1c1b1f]/8 dark:hover:bg-[#e6e1e5]/8 rounded-full transition-colors text-[#49454f] dark:text-[#cac4d0]">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Snapshot Card */}
                    <div className="p-6 rounded-[24px] border border-[#dce2f9] bg-[#dce2f9]/20 dark:bg-[#dce2f9]/5">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={16} className="text-[#3f51b5]" />
                            <h4 className="text-[11px] font-bold text-[#3f51b5] uppercase tracking-widest">Active Plan Snapshot</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             <div>
                                <p className="text-[10px] uppercase font-bold text-[#49454f] tracking-wider mb-1">Balance</p>
                                <p className={`text-xl font-black ${carryOverBalance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                                    ₹{Math.abs(carryOverBalance).toLocaleString()}{carryOverBalance < 0 ? ' DR' : ''}
                                </p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-[#49454f] tracking-wider mb-1">Consumed</p>
                                <p className="text-base font-bold text-[#1c1b1f] dark:text-[#e3e2e6]">{patient.attendance_count || 0} Days</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-[#49454f] tracking-wider mb-1">Type</p>
                                <p className="text-base font-bold text-[#1c1b1f] dark:text-[#e3e2e6] capitalize">{patient.treatment_type}</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-[#49454f] tracking-wider mb-1">Rate</p>
                                <p className="text-base font-bold text-[#1c1b1f] dark:text-[#e3e2e6]">
                                    ₹{parseFloat((patient.treatment_type === 'package' ? patient.package_cost : patient.treatment_cost_per_day)?.toString() || '0').toLocaleString()}
                                </p>
                             </div>
                        </div>
                         <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-xl flex items-start gap-3 border border-white/20">
                            <AlertTriangle size={16} className="text-[#3f51b5] mt-1 shrink-0" />
                            <p className="text-xs font-medium text-[#49454f] dark:text-[#cac4d0] leading-relaxed">System will automatically reconcile the <span className="font-bold">₹{carryOverBalance.toLocaleString()}</span> carry-over balance into the new plan's accounting.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* New Plan Selection */}
                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <Zap size={16} style={{ color: themeColor }} />
                                <label className="text-sm font-bold text-[#1c1b1f] dark:text-[#e3e2e6]">Select New Plan Model</label>
                            </div>
                            
                            {selectedTrack?.pricing?.plans && selectedTrack.pricing.plans.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedTrack.pricing.plans.map((plan: any, idx: number) => {
                                        const isSelected = selectedPlanId === plan.id;
                                        return (
                                            <button 
                                                type="button"
                                                key={plan.id || idx} 
                                                onClick={() => {
                                                    setSelectedPlanId(plan.id);
                                                    setRateOrCost(plan.rate.toString());
                                                    setDays(plan.days.toString());
                                                }}
                                                className={`group relative flex items-center p-4 rounded-2xl border-2 transition-all transition-all text-left ${isSelected ? 'ring-2 ring-offset-2' : 'border-[#cac4d0] dark:border-[#49454f] hover:bg-white/40'}`}
                                                style={{ 
                                                    borderColor: isSelected ? themeColor : undefined,
                                                    backgroundColor: isSelected ? `${themeColor}08` : undefined,
                                                    boxShadow: isSelected ? `0 0 0 2px ${themeColor}10` : undefined
                                                }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isSelected ? 'bg-white/50' : 'bg-[#74777f]/10'}`} style={{ color: isSelected ? themeColor : '#74777f' }}>
                                                    <IconComponent name={plan.icon || 'Clock'} size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-[#1c1b1f] dark:text-[#e3e2e6] capitalize">{plan.name}</h4>
                                                    <p className="text-[11px] font-medium opacity-70">₹{plan.rate.toLocaleString()} / {plan.days} Sessions</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                                                        <Check size={12} className="text-white" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-4 bg-[#1c1b1f]/5 rounded-2xl border-2 border-dashed border-[#cac4d0] flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#74777f]">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold capitalize text-[#1c1b1f] dark:text-[#e3e2e6]">{selectedTrack?.name || 'Loading Track...'}</p>
                                        <p className="text-xs font-medium opacity-60">Fixed Rate Pricing Model</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Plan Metrics */}
                        <div className="grid grid-cols-2 gap-6">
                            <OutlinedInput label="Plan Rate / Cost" value={rateOrCost} onChange={(e:any) => setRateOrCost(e.target.value)} type="number" prefix="₹" themeColor={themeColor} />
                            <OutlinedInput label="Treatment Days" value={days} onChange={(e:any) => setDays(e.target.value)} type="number" icon={Hash} themeColor={themeColor} />
                        </div>

                        {/* Financial Overrides */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <OutlinedInput label="Discount %" value={discount} onChange={(e:any) => setDiscount(e.target.value)} type="number" themeColor={themeColor} placeholder="0" />
                                <OutlinedInput label="Additional Advance" value={advance} onChange={(e:any) => setAdvance(e.target.value)} type="number" prefix="₹" themeColor={themeColor} placeholder={carryOverBalance < 0 ? `Cover ${-carryOverBalance}` : '0'} />
                            </div>
                            
                            {/* Payment Methods */}
                            <AnimatePresence>
                                {parseFloat(advance) > 0 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                                        <div className="flex items-center gap-2 px-1">
                                            <CreditCard size={14} style={{ color: themeColor }} />
                                            <p className="text-[10px] font-black uppercase text-[#49454f] tracking-widest">Payment Method</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {metaData.payment_methods.map((m, idx) => (
                                                <button 
                                                    type="button" 
                                                    key={m.method_id || idx} 
                                                    onClick={() => setPaymentMethod(m.method_name)} 
                                                    className={`px-4 py-2 text-xs font-bold rounded-full border-2 transition-all ${paymentMethod === m.method_name ? 'text-white border-transparent' : 'border-[#cac4d0] text-[#49454f] hover:bg-white/40'}`}
                                                    style={{ backgroundColor: paymentMethod === m.method_name ? themeColor : undefined }}
                                                >
                                                    {m.method_name}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Final Billing Box */}
                            <div className="p-6 rounded-[24px] bg-[#006a6a]/5 dark:bg-[#006a6a]/10 border-2 border-dashed space-y-4" style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest">Carry Over Balance</span>
                                    <span className={`text-sm font-bold ${carryOverBalance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>₹{carryOverBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t" style={{ borderColor: `${themeColor}15` }}>
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-[#dc2626] dark:text-[#ffb4ab]">Net Payable Now</span>
                                        <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-medium italic">Pending amount after adjustments</span>
                                    </div>
                                    <span className="text-3xl font-black text-[#dc2626] dark:text-[#ffb4ab] tracking-tighter">₹{finalDue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Reason Field */}
                        <div className="relative group w-full">
                            <span className="absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#1a1c1e] transition-colors z-10" style={{ color: themeColor }}>
                                Reason for Change
                            </span>
                            <textarea 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)} 
                                className="w-full bg-transparent border border-[#79747e] dark:border-[#938f99] px-4 py-3 text-sm font-bold outline-none rounded-xl text-[#1c1b1f] dark:text-[#e3e2e6] min-h-[80px]" 
                                placeholder="Brief explanation for plan switch..."
                                required 
                            />
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 text-white rounded-[20px] font-black text-sm uppercase tracking-widest hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                style={{ backgroundColor: themeColor, boxShadow: `0 12px 24px -8px ${themeColor}60` }}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                {isLoading ? 'Processing Update...' : 'Confirm & Re-Initialize Plan'}
                            </button>
                        </div>
                    </form>
                </div>
             </motion.div>
        </div>
    );
};
export default ChangePlanModal;
