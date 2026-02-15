import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";

interface RevertAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  patientName: string;
}

const RevertAttendanceModal = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
}: RevertAttendanceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#111315] w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>

              <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                Revert Attendance?
              </h3>
              <p className="text-sm font-medium text-center text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                You are about to remove today's attendance record for{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {patientName}
                </span>
                . Any funds debited for this session will be restored.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                  Confirm Revert
                </button>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-white/10 uppercase tracking-widest text-xs"
                >
                  Back to Safety
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RevertAttendanceModal;
