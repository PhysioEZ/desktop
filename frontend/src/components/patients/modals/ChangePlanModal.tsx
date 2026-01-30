import { useState, useEffect } from 'react';
import { X, Loader2, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { type Patient, usePatientStore } from '../../../store/usePatientStore';

interface ChangePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null; // Detailed patient object
    onSuccess: () => void;
}

const ChangePlanModal = ({ isOpen, onClose, patient, onSuccess }: ChangePlanModalProps) => {
    const { metaData } = usePatientStore();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [planType, setPlanType] = useState('package');
    const [rateOrCost, setRateOrCost] = useState(''); // Holds Rate (Daily/Advance) or Total Package Cost
    const [days, setDays] = useState('');
    const [discount, setDiscount] = useState('0');
    const [advance, setAdvance] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [reason, setReason] = useState('');

    // Calculated State

    const [finalDue, setFinalDue] = useState(0);
    const [carryOverBalance, setCarryOverBalance] = useState(0);

    // Initial Setup
    useEffect(() => {
        if (isOpen && patient) {
            // Logic to carry over balance from current plan
            setCarryOverBalance(parseFloat(patient.effective_balance?.toString() || '0'));
            
            // Defatults
            setPlanType('package');
            setRateOrCost('30000'); // Default Package Cost
            setDays('21'); // Default Package Days
            setDiscount('0');
            setAdvance('');
            setPaymentMethod('');
            setReason('');
        }
    }, [isOpen, patient]);

    // Update fields when Type changes
    useEffect(() => {
        if (planType === 'package') {
            setRateOrCost('30000');
            setDays('21');
        } else if (planType === 'daily') {
            setRateOrCost('600');
            setDays('1'); // Usually undefined, but legacy logic used days for cost calc? Let's default to 1 for calculation visualization
        } else if (planType === 'advance') {
            setRateOrCost('1000');
            setDays('1');
        }
    }, [planType]);

    // Calculation Engine (Mirrors Legacy JS logic)
    useEffect(() => {
        const rateVal = parseFloat(rateOrCost) || 0;
const discountVal = parseFloat(discount) || 0;
        const advanceVal = parseFloat(advance) || 0;


        // 2. Net Base Cost (Discounted)
        // Legacy logic applies discount to the rate/package cost directly
        const netBaseCost = rateVal * (1 - (discountVal / 100));

        // 3. Final Due
        // Net Cost - CarryOver - NewAdvance
        // Example: Pkg 30k. Balance 5000 (Credit). Advance 0.
        // Due = 30000 - 5000 - 0 = 25000. Correct.
        // Example: Daily 600. Balance -500 (Due). Advance 600.
        // Due = 600 - (-500) - 600 = 600 + 500 - 600 = 500. 
        // Wait, if Balance is negative (Due), subtracting it adds to the new due.
        // 600 - (-500) = 1100.
        // This means "You owe 500 from old plan + 600 for today = 1100 total needed".
        // Minus Advance 600 -> Final Due 500.
        // This Logic holds up perfectly.
        
        const due = netBaseCost - carryOverBalance - advanceVal;
        setFinalDue(Math.max(0, due));

    }, [rateOrCost, days, discount, advance, planType, carryOverBalance]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (planType === 'package' && parseInt(days) <= 0) {
           alert('Package plans require valid treatment days');
           return;
        }
        if (parseFloat(advance) > 0 && !paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                old_patient_id: patient?.patient_id,
                master_patient_id: patient?.master_patient_id || '', // Need to ensure these fields exist in Patient object
                registration_id: patient?.registration_id,
                new_treatment_type: planType,
                new_total_amount: rateOrCost, // Legacy backend expects "rate" in this field name
                new_treatment_days: days,
                new_discount_percentage: discount,
                new_advance_payment: advance,
                change_plan_payment_method: paymentMethod,
                reason_for_change: reason
            };

            const res = await authFetch(`${API_BASE_URL}/reception/change_treatment_plan`, {
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
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-2xl rounded-[24px] shadow-2xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Change Treatment Plan</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors text-[#43474e] dark:text-[#c4c7c5]">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Current Status Snapshot */}
                    <div className="bg-[#f2f6fa] dark:bg-[#111315] rounded-xl p-4 border border-[#cce5ff] dark:border-[#0842a0]">
                        <h4 className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider mb-3">Current Plan Snapshot</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div>
                                <p className="text-xs text-[#43474e]">Current Balance</p>
                                <p className={`text-lg font-black ${carryOverBalance >= 0 ? 'text-[#006e1c]' : 'text-[#ba1a1a]'}`}>
                                    ₹{carryOverBalance.toLocaleString()}
                                </p>
                             </div>
                             <div>
                                <p className="text-xs text-[#43474e]">Consumed Days</p>
                                <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{patient.attendance_count || 0}</p>
                             </div>
                             <div>
                                <p className="text-xs text-[#43474e]">Type</p>
                                <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] capitalize">{patient.treatment_type}</p>
                             </div>
                             <div>
                                <p className="text-xs text-[#43474e]">Rate</p>
                                <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">₹{parseFloat(patient.cost_per_day?.toString()||'0').toLocaleString()}</p>
                             </div>
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-xs text-[#00639b] dark:text-[#a8c7fa] bg-[#cce5ff]/20 p-2 rounded-lg">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <p>Balance will be carried over. Positive balance counts as credit, negative balance adds to next due.</p>
                        </div>
                    </div>

                    <form id="changePlanForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* New Plan Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Select New Plan</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['package', 'daily', 'advance'].map((type) => (
                                    <label key={type} className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${planType === type ? 'bg-[#ccebc4] border-[#006e1c] text-[#002105]' : 'bg-transparent border-[#74777f] hover:bg-[#e0e2ec]'}`}>
                                        <input type="radio" name="planType" value={type} checked={planType === type} onChange={(e) => setPlanType(e.target.value)} className="hidden" />
                                        <span className="font-bold capitalize">{type}</span>
                                        <span className="text-[10px] opacity-70">
                                            {type === 'package' ? 'Fixed (30k)' : type === 'daily' ? 'Pay/Day (600)' : 'Adv. (1000)'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#43474e] uppercase">Rate / Cost</label>
                                <div className="relative">
                                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" />
                                    <input type="number" value={rateOrCost} onChange={(e) => setRateOrCost(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-[#e0e2ec]/30 rounded-lg border border-[#74777f] font-bold" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#43474e] uppercase">Days</label>
                                <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-3 py-2 bg-[#e0e2ec]/30 rounded-lg border border-[#74777f] font-bold" />
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="p-4 rounded-xl border border-[#74777f] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#43474e] uppercase">Discount %</label>
                                    <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full px-3 py-2 bg-[#e0e2ec]/30 rounded-lg border border-[#74777f] font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#43474e] uppercase">Additional Advance</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" />
                                        <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-[#e0e2ec]/30 rounded-lg border border-[#74777f] font-bold" placeholder={carryOverBalance < 0 ? `Cover ${-carryOverBalance}` : '0'} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Payment Method (Dynamic) */}
                            {parseFloat(advance) > 0 && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-[#43474e] uppercase">Payment Method</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {metaData.payment_methods.map(m => (
                                            <button type="button" key={m.method_id} onClick={() => setPaymentMethod(m.method_name)} className={`px-2 py-1 text-xs rounded border ${paymentMethod === m.method_name ? 'bg-[#006e1c] text-white border-[#006e1c]' : 'border-[#74777f] text-[#43474e]'}`}>
                                                {m.method_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Final Calculation */}
                            <div className="pt-2 border-t border-[#74777f] flex justify-between items-center">
                                <span className="text-sm font-bold text-[#1a1c1e]">Net Payable Now</span>
                                <span className="text-xl font-black text-[#ba1a1a]">₹{finalDue.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] uppercase">Reason</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 bg-[#e0e2ec]/30 rounded-lg border border-[#74777f]" rows={2} required />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                             className="w-full py-3.5 bg-[#006e1c] dark:bg-[#88d99d] text-white dark:text-[#00390a] rounded-[18px] font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                            Confirm & Change Plan
                        </button>
                    </form>
                </div>
             </div>
        </div>
    );
};
export default ChangePlanModal;
