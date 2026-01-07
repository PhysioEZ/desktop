import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface LogoutConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-[#ffdad6] dark:bg-[#93000a] text-[#ba1a1a] dark:text-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">Confirm Logout</h2>
                            <p className="text-sm text-[#43474e] dark:text-[#c4c7c5] mb-6">
                                Are you sure you want to log out of your account?
                            </p>
                            
                            <div className="flex gap-3 justify-center">
                                <button 
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#30333b] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={onConfirm}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors shadow-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LogoutConfirmation;
