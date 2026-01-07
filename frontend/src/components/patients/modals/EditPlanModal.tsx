import { useState, useEffect } from 'react';
import { X, Check, Loader2, Clock } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { type Patient, usePatientStore } from '../../../store/usePatientStore';

interface EditPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null; // This should be the DETAILED patient object
    onSuccess: () => void;
}

const EditPlanModal = ({ isOpen, onClose, patient, onSuccess }: EditPlanModalProps) => {
    const { metaData } = usePatientStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        treatment_days: '',
        treatment_time_slot: '',
        start_date: '',
        end_date: '',
        assigned_doctor: '',
        discount_percentage: '0',
        remarks: ''
    });
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && patient) {
            setFormData({
                treatment_days: patient.treatment_days?.toString() || '',
                treatment_time_slot: patient.treatment_time_slot || '',
                start_date: patient.start_date || '',
                end_date: patient.end_date || '',
                assigned_doctor: patient.assigned_doctor || '',
                discount_percentage: patient.discount_percentage || '0',
                remarks: ''
            });
            setNote('');
        }
    }, [isOpen, patient]);

    // Auto-calculate End Date and Note
    useEffect(() => {
        if (!isOpen || !patient) return;

        const days = parseInt(formData.treatment_days) || 0;
        const start = formData.start_date ? new Date(formData.start_date) : null;

        // Calculate End Date
        if (days > 0 && start) {
            const end = new Date(start);
            end.setDate(start.getDate() + days - 1);
            const endDateStr = end.toISOString().split('T')[0];
            
            // Only update if different to avoid loop (though dependency array handles it)
            if (endDateStr !== formData.end_date) {
                setFormData(prev => ({ ...prev, end_date: endDateStr }));
            }
        }

        // Calculate Cost Note
        if (days > 0) {
            let newTotal = 0;
            const type = patient.treatment_type?.toLowerCase();
            const costPerDay = parseFloat(patient.cost_per_day?.toString() || '0');

            if (type === 'package') {
                newTotal = costPerDay * days; 
            } else if (type === 'daily') {
                newTotal = 600 * days; // Legacy logic? Or usage costPerDay? 
                // Legacy JS line 1284 hardcoded 600 for 'daily' and 1000 for 'advance'.
                // Ideally we should rely on costPerDay but legacy had hardcodes.
                // Let's stick to costPerDay if available, else fallback logic.
                // Actually legacy lines 1284/1287 hardcoded it.
                // But `costPerDay` on patient object reflects "current rate".
                // I'll filter logic:
                if (costPerDay > 0) newTotal = costPerDay * days;
                else newTotal = 600 * days; // Fallback
            } else {
                 if (costPerDay > 0) newTotal = costPerDay * days;
            }

            setNote(`New total will be roughly ₹${newTotal.toLocaleString()} (${days} days)`);
        } else {
            setNote('');
        }

    }, [formData.treatment_days, formData.start_date, patient, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                edit_plan_patient_id: patient?.patient_id,
                edit_treatment_days: formData.treatment_days,
                edit_time_slot: formData.treatment_time_slot,
                edit_start_date: formData.start_date,
                edit_end_date: formData.end_date,
                edit_assigned_doctor: formData.assigned_doctor,
                edit_discount_percentage: formData.discount_percentage,
                edit_remarks: formData.remarks
            };

            const res = await authFetch(`${API_BASE_URL}/reception/edit_treatment_plan.php`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                throw new Error(data.message || 'Failed to update plan');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-lg rounded-[24px] shadow-2xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Edit Current Plan</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors text-[#43474e] dark:text-[#c4c7c5]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {note && (
                        <div className="p-3 bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d] rounded-xl text-sm font-medium border border-[#ccebc4] dark:border-[#0c3b10]">
                            {note}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Days</label>
                            <input
                                type="number"
                                value={formData.treatment_days}
                                onChange={(e) => setFormData({...formData, treatment_days: e.target.value})}
                                className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Time Slot</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e]" size={16} />
                                <input
                                    type="time"
                                    value={formData.treatment_time_slot}
                                    onChange={(e) => setFormData({...formData, treatment_time_slot: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all font-bold text-[#1a1c1e] dark:text-[#e3e2e6]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all text-[#1a1c1e] dark:text-[#e3e2e6]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">End Date</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all text-[#1a1c1e] dark:text-[#e3e2e6]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Assigned Doctor</label>
                        <select
                            value={formData.assigned_doctor}
                            onChange={(e) => setFormData({...formData, assigned_doctor: e.target.value})}
                            className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all text-[#1a1c1e] dark:text-[#e3e2e6]"
                        >
                            <option value="">Select Doctor</option>
                            {metaData.doctors.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                     <div className="space-y-1">
                        <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">Discount (%)</label>
                        <input
                            type="number"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                            className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl focus:ring-2 focus:ring-[#006e1c] outline-none transition-all text-[#1a1c1e] dark:text-[#e3e2e6]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                         className="w-full py-3.5 bg-[#006e1c] dark:bg-[#88d99d] text-white dark:text-[#00390a] rounded-[18px] font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Check />}
                        Save Changes
                    </button>
                </form>
             </div>
        </div>
    );
};
export default EditPlanModal;
