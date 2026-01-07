import { useState, useEffect } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../../config';
import { printToken } from '../../../utils/printToken';
import { toast } from 'sonner';

interface TokenPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number | null;
}

const TokenPreviewModal = ({ isOpen, onClose, patientId }: TokenPreviewModalProps) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [printing, setPrinting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && patientId) {
            fetchPreview();
        }
    }, [isOpen, patientId]);

    const fetchPreview = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/get_token_data.php?patient_id=${patientId}`);
            const json = await res.json();
            if (json.status === 'success' || json.success) {
                setData(json.data);
            } else {
                setError(json.message || 'Failed to load token data');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        setPrinting(true);
        try {
            // Generate Token
            const res = await authFetch(`${API_BASE_URL}/reception/generate_token.php`, {
                method: 'POST',
                body: JSON.stringify({ patient_id: patientId })
            });
            const json = await res.json();
            
            if (json.status === 'success' || json.success) {
                // Determine Data Source: 'generate_token.php' might return the FULL data needed for printing.
                // Legacy JS implied generate_token returns { success, data: { ... } }
                // Use the returned data if robust, or merge with preview data
                const printData = json.data || data; 
                printToken(printData);
                toast.success('Token generated & sent to printer');
                onClose();
            } else {
                toast.error(json.message || 'Failed to generate token');
            }
        } catch (e: any) {
             toast.error(e.message);
        } finally {
            setPrinting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-[#1a1c1e] w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white">Token Preview</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="p-6 text-center">
                    {loading ? (
                        <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
                    ) : error ? (
                         <div className="text-red-500 font-bold">{error}</div>
                    ) : data ? (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-sm font-bold uppercase text-gray-500">Next Token</p>
                                <p className="text-4xl font-black font-mono text-teal-700 dark:text-teal-400 my-2">{data.next_token_number || 'N/A'}</p>
                                <p className="text-xs text-gray-400">Total Visits: {data.visit_count}</p>
                            </div>
                            
                            <div className="text-left space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Patient</span>
                                    <span className="font-bold">{data.patient_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Doctor</span>
                                    <span className="font-bold">{data.assigned_doctor}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                                    <span>Due Amount</span>
                                    <span className={`font-bold ${data.due_amount > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{data.due_amount}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handlePrint} 
                                disabled={printing}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all mt-4"
                            >
                                {printing ? <Loader2 className="animate-spin" /> : <Printer size={18} />}
                                Confirm & Print
                            </button>
                        </div>
                    ) : null}
                </div>
             </div>
        </div>
    );
};
export default TokenPreviewModal;
