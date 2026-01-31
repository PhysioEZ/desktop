import { useState, useEffect } from 'react';
import { X, Check, Loader2, Clock } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { type Patient, usePatientStore } from '../../../store/usePatientStore';
import DatePicker from '../../ui/DatePicker';
import { AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';

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
    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [openEndPicker, setOpenEndPicker] = useState(false);

    useEffect(() => {
        if (isOpen && patient) {
            setFormData({
                treatment_days: patient.treatment_days?.toString() || '',
                treatment_time_slot: patient.treatment_time_slot || '',
                start_date: patient.start_date || '',
                end_date: patient.end_date || '',
                assigned_doctor: patient.assigned_doctor || '',
                discount_percentage: patient.discount_percentage?.toString() || '0',
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
            const costPerDay = parseFloat(patient.cost_per_day?.toString() || '0');
            const discountPct = parseFloat(formData.discount_percentage) || 0;

            if (costPerDay > 0) {
                const subtotal = costPerDay * days;
                newTotal = subtotal * (1 - (discountPct / 100));
            } else {
                newTotal = 600 * days * (1 - (discountPct / 100)); // Fallback
            }

            setNote(`New total will be roughly ₹${Math.round(newTotal).toLocaleString()} (${days} days)`);
        } else {
            setNote('');
        }

    }, [formData.treatment_days, formData.start_date, formData.discount_percentage, patient, isOpen]);

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

            const res = await authFetch(`${API_BASE_URL}/reception/edit_treatment_plan`, {
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
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
                            <p className="text-sm font-black text-[#006e1c] dark:text-[#88d99d] uppercase">{patient?.treatment_type || 'Custom'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Rate</p>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹{parseFloat(patient?.cost_per_day?.toString() || '0').toLocaleString()}</p>
                        </div>
                    </div>

                    {note && (
                        <div className="p-4 bg-[#ccebc4]/20 text-[#006e1c] dark:text-[#88d99d] rounded-2xl text-sm font-bold border border-[#ccebc4]/30 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#006e1c] animate-pulse" />
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
                            <div 
                                onClick={() => setOpenStartPicker(true)}
                                className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl cursor-pointer flex items-center justify-between hover:border-[#006e1c] transition-all"
                            >
                                <span className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                    {formData.start_date ? new Date(formData.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                                </span>
                                <Calendar size={16} className="text-[#43474e]" />
                            </div>
                            <AnimatePresence>
                                {openStartPicker && (
                                    <DatePicker 
                                        value={formData.start_date} 
                                        onChange={(date) => setFormData(prev => ({ ...prev, start_date: date }))} 
                                        onClose={() => setOpenStartPicker(false)} 
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider ml-1">End Date</label>
                            <div 
                                onClick={() => setOpenEndPicker(true)}
                                className="w-full px-4 py-3 bg-[#e0e2ec]/30 dark:bg-[#43474e]/30 border border-[#74777f] dark:border-[#8e918f] rounded-xl cursor-pointer flex items-center justify-between hover:border-[#006e1c] transition-all"
                            >
                                <span className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                                </span>
                                <Calendar size={16} className="text-[#43474e]" />
                            </div>
                            <AnimatePresence>
                                {openEndPicker && (
                                    <DatePicker 
                                        value={formData.end_date} 
                                        onChange={(date) => setFormData(prev => ({ ...prev, end_date: date }))} 
                                        onClose={() => setOpenEndPicker(false)} 
                                    />
                                )}
                            </AnimatePresence>
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
