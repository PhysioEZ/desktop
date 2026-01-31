import { useState, useEffect } from 'react';
import { X, Check, Loader2, IndianRupee } from 'lucide-react';
import { usePatientStore } from '../../../store/usePatientStore';
import { API_BASE_URL, authFetch } from '../../../config';

interface PayDuesModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    currentDue: number;
    onSuccess: () => void;
}

const PayDuesModal = ({ isOpen, onClose, patientId, currentDue, onSuccess }: PayDuesModalProps) => {
    const { metaData } = usePatientStore();
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount(currentDue > 0 ? currentDue.toString() : '');
            setPaymentMethod('');
            setRemarks('');
            setError('');
        }
    }, [isOpen, currentDue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (!paymentMethod) {
            setError('Please select a payment method');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                patient_id: patientId,
                amount: amount,
                method: paymentMethod,
                remarks: remarks || 'Dues Payment'
            };

            const res = await authFetch(`${API_BASE_URL}/reception/add_payment`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            // Note: The legacy JS used JSON.stringify(payload)
            
            const data = await res.json();
            if (data.status === 'success' || data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Payment failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-md rounded-[24px] shadow-2xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Pay Dues</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors text-[#43474e] dark:text-[#c4c7c5]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="p-4 bg-[#f2f6fa] dark:bg-[#111315] rounded-xl flex justify-between items-center border border-[#cce5ff] dark:border-[#0842a0]">
                        <span className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5]">Current Due</span>
                        <span className="text-xl font-black text-[#ba1a1a] dark:text-[#ffb4ab]">₹{currentDue.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Amount to Pay</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                             {metaData.payment_methods.map((method, idx) => (
                                 <button
                                     key={method.method_id || idx}
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
                        className="w-full py-3.5 bg-[#006e1c] dark:bg-[#88d99d] text-white dark:text-[#00390a] rounded-[18px] font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PayDuesModal;
