import { useState, useEffect } from 'react';
import { X, Check, Loader2, IndianRupee, AlertCircle } from 'lucide-react';
import { type Patient, usePatientStore } from '../../../store/usePatientStore';
import { API_BASE_URL, authFetch } from '../../../config';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onSuccess: () => void;
}

const AttendanceModal = ({ isOpen, onClose, patient, onSuccess }: AttendanceModalProps) => {
    const { metaData } = usePatientStore();
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [remarks, setRemarks] = useState('');
    const [markAsDue, setMarkAsDue] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const costPerDay = patient?.cost_per_day || 0;
    const effectiveBalance = patient?.effective_balance || 0;
    const minRequired = Math.max(0, costPerDay - effectiveBalance);

    useEffect(() => {
        if (isOpen && patient) {
            setAmount(minRequired.toFixed(2));
            setPaymentMethod('');
            setRemarks('');
            setMarkAsDue(false);
            setError('');
        }
    }, [isOpen, patient, minRequired]);

    useEffect(() => {
        if (markAsDue) {
            setAmount('0');
            setPaymentMethod('');
            setRemarks('Marked as Due - Patient will pay later');
        } else {
            setAmount(minRequired.toFixed(2));
            setRemarks('');
        }
    }, [markAsDue, minRequired]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!markAsDue && parseFloat(amount) > 0 && !paymentMethod) {
            setError('Please select a payment method');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                patient_id: patient?.patient_id,
                payment_amount: amount,
                mode: paymentMethod, // Can be empty if amount is 0
                remarks: remarks,
                status: markAsDue ? 'pending' : 'present' // Explicitly set status
            };

            const res = await authFetch(`${API_BASE_URL}/reception/add_attendance.php`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.status === 'success' || data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Failed to mark attendance');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-md rounded-[24px] shadow-2xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Mark Attendance</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors text-[#43474e] dark:text-[#c4c7c5]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Summary Card */}
                    <div className="p-4 bg-[#f2f6fa] dark:bg-[#111315] rounded-xl border border-[#cce5ff] dark:border-[#0842a0] space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[#43474e] dark:text-[#c4c7c5]">Daily Cost</span>
                            <span className="font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">₹{costPerDay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#43474e] dark:text-[#c4c7c5]">Available Balance</span>
                            <span className={`font-bold ${effectiveBalance >= 0 ? 'text-[#006e1c] dark:text-[#88d99d]' : 'text-[#ba1a1a] dark:text-[#ffb4ab]'}`}>
                                ₹{effectiveBalance.toLocaleString()}
                            </span>
                        </div>
                        <div className="border-t border-[#cce5ff] dark:border-[#0842a0] pt-2 flex justify-between items-center">
                            <span className="text-sm font-black text-[#00639b] dark:text-[#a8c7fa]">Required</span>
                            <span className="text-lg font-black text-[#00639b] dark:text-[#a8c7fa]">₹{minRequired.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Mark as Due Checkbox */}
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f4f9] dark:hover:bg-[#1e2022] transition-colors cursor-pointer" onClick={() => setMarkAsDue(!markAsDue)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${markAsDue ? 'bg-[#ba1a1a] border-[#ba1a1a] text-white' : 'border-[#74777f] text-transparent'}`}>
                            <Check size={14} strokeWidth={4} />
                        </div>
                        <div className="flex-1">
                            <span className={`text-sm font-bold ${markAsDue ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#1a1c1e] dark:text-[#e3e2e6]'}`}>Mark as Due</span>
                            <p className="text-xs text-[#43474e] dark:text-[#c4c7c5]">Status will be 'Pending'</p>
                        </div>
                    </div>

                    {!markAsDue && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Payment Amount</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {metaData.payment_methods.map((method) => (
                                        <button
                                            key={method.method_id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.method_name)}
                                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                                                paymentMethod === method.method_name
                                                    ? 'bg-[#ccebc4] border-[#006e1c] text-[#002105] dark:bg-[#0c3b10] dark:border-[#88d99d] dark:text-[#ccebc4]'
                                                    : 'bg-transparent border-[#74777f] text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e]'
                                            }`}
                                        >
                                            {method.method_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Remarks</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all text-sm text-[#1a1c1e] dark:text-[#e3e2e6]"
                            placeholder="Optional notes..."
                            rows={2}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3.5 rounded-[18px] font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                            markAsDue 
                                ? 'bg-[#ffdad6] text-[#410002] dark:bg-[#93000a] dark:text-[#ffdad6]'
                                : 'bg-[#006e1c] text-white dark:bg-[#88d99d] dark:text-[#00390a]'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                {markAsDue ? 'Confirm Due' : 'Confirm Payment & Mark'}
                            </>
                        )}
                    </button>
                    
                    {markAsDue && (
                        <div className="flex items-center gap-2 justify-center text-[#ba1a1a] dark:text-[#ffb4ab]">
                            <AlertCircle size={14} />
                            <span className="text-xs font-medium">This will require admin approval</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AttendanceModal;
