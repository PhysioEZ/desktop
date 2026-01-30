import { useState, useEffect } from 'react';
import { X, Check, Loader2, IndianRupee } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import type { Patient } from '../../../store/usePatientStore';

interface AddTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onSuccess: () => void;
}

const AddTestModal = ({ isOpen, onClose, patient, onSuccess }: AddTestModalProps) => {
    const [totalAmount, setTotalAmount] = useState<string>('');
    const [advanceAmount, setAdvanceAmount] = useState<string>('');
    const [dueAmount, setDueAmount] = useState<string>('0.00');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && patient) {
            setTotalAmount('');
            setAdvanceAmount('');
            setDueAmount('0.00');
            setError('');
        }
    }, [isOpen, patient]);

    // Calculate Due
    useEffect(() => {
        const total = parseFloat(totalAmount) || 0;
        const advance = parseFloat(advanceAmount) || 0;
        setDueAmount((total - advance).toFixed(2));
    }, [totalAmount, advanceAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                test_patient_id: patient?.patient_id,
                test_patient_name: patient?.patient_name,
                test_phone_number: patient?.patient_phone,
                test_age: patient?.patient_age,
                total_amount: totalAmount,
                advance_amount: advanceAmount,
                due_amount: dueAmount
            };

            const res = await authFetch(`${API_BASE_URL}/reception/add_test_for_patient`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Failed to add test');
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
            <div className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-md rounded-[24px] shadow-2xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Add Test</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors text-[#43474e] dark:text-[#c4c7c5]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Total Amount</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Advance / Paid</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                value={advanceAmount}
                                onChange={(e) => setAdvanceAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-[#f2f6fa] dark:bg-[#111315] rounded-xl flex justify-between items-center border border-[#cce5ff] dark:border-[#0842a0]">
                        <span className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5]">Balance Due</span>
                        <span className={`text-xl font-black ${parseFloat(dueAmount) > 0 ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#006e1c] dark:text-[#88d99d]'}`}>
                            ₹{parseFloat(dueAmount).toLocaleString('en-IN')}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-[#006e1c] dark:bg-[#88d99d] text-white dark:text-[#00390a] rounded-[18px] font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Save Test
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTestModal;
