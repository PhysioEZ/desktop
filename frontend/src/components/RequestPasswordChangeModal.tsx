import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';

interface RequestPasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const RequestPasswordChangeModal: React.FC<RequestPasswordChangeModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(reason);
        setReason(''); // Reset reason after submit
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center">
                                        <Shield size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Password Change</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-[#43474e] dark:text-[#c4c7c5] mb-6">
                                Please provide a reason for requesting a password change. Your request will be reviewed by an administrator.
                            </p>

                            <div className="mb-6">
                                <label htmlFor="reason" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Reason for Request
                                </label>
                                <textarea
                                    id="reason"
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 text-[#1a1c1e] dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-400"
                                    placeholder="e.g., Suspicious activity, Forgot old password..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#30333b] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!reason.trim()}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RequestPasswordChangeModal;
