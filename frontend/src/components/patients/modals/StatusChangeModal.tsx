import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Power, Ban, CheckCircle2, AlertOctagon, Loader2 } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { usePatientStore } from '../../../store/usePatientStore';
import { toast } from 'sonner';

interface StatusChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    currentStatus: string;
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active', icon: Power, color: '#16a34a', desc: 'Patient is currently undergoing treatment.' },
    { value: 'inactive', label: 'Inactive', icon: Ban, color: '#64748b', desc: 'Patient is temporarily not visiting.' },
    { value: 'completed', label: 'Completed', icon: CheckCircle2, color: '#3b82f6', desc: 'Treatment plan successfully finished.' },
    { value: 'cancelled', label: 'Cancelled', icon: AlertOctagon, color: '#ef4444', desc: 'Treatment stopped before completion.' },
];

const StatusChangeModal = ({ isOpen, onClose, patientId, currentStatus }: StatusChangeModalProps) => {
    const { updateLocalPatientStatus } = usePatientStore();
    const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus.toLowerCase()); // Ensure lowercase match
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (selectedStatus === currentStatus.toLowerCase()) return;
        
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'toggle_status',
                    patient_id: patientId,
                    status: selectedStatus
                }),
            });
            const data = await res.json();
            
            if (data.success) {
                updateLocalPatientStatus(patientId, selectedStatus);
                toast.success(`Status updated to ${selectedStatus}`);
                onClose();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Network error updating status');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden border border-[#e0e2ec] dark:border-[#43474e]"
            >
                <div className="px-6 py-4 flex justify-between items-start border-b border-[#e0e2ec] dark:border-[#43474e]">
                    <div>
                        <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Change Status</h3>
                        <p className="text-xs text-[#43474e] dark:text-[#c4c7c5]">Select new status for this patient</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X size={20} className="text-[#43474e] dark:text-[#c4c7c5]" />
                    </button>
                </div>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedStatus === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedStatus(opt.value)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${
                                    isSelected 
                                        ? 'border-[#006e1c] bg-[#ccebc4]/20 dark:bg-[#00390a]/20' 
                                        : 'border-[#e0e2ec] dark:border-[#43474e] hover:border-[#74777f] dark:hover:border-[#8e918f]'
                                }`}
                            >
                                <div className={`p-3 rounded-full ${isSelected ? 'bg-[#006e1c] text-white' : 'bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5]'}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${isSelected ? 'text-[#006e1c] dark:text-[#88d99d]' : 'text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-wide'}`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] font-medium mt-0.5">{opt.desc}</p>
                                </div>
                                {isSelected && <Check size={20} className="ml-auto text-[#006e1c] dark:text-[#88d99d]" />}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 pt-4 bg-[#f0f4f9] dark:bg-[#1e2022]">
                    <button
                        onClick={handleUpdate}
                        disabled={isLoading || selectedStatus === currentStatus.toLowerCase()}
                        className="w-full py-3.5 rounded-xl bg-[#006e1c] dark:bg-[#88d99d] text-white dark:text-[#00390a] font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Check />}
                        Update Status
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default StatusChangeModal;
