import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Power,
  Ban,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { usePatientStore } from "../../../store/usePatientStore";
import { toast } from "sonner";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    icon: Power,
    color: "emerald",
    desc: "Patient is currently visiting for treatment.",
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: Ban,
    color: "slate",
    desc: "Patient has paused treatment for now.",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "blue",
    desc: "Treatment successfully finished.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: AlertOctagon,
    color: "rose",
    desc: "Treatment stopped before finishing.",
  },
];

const StatusChangeModal = ({
  isOpen,
  onClose,
  patientId,
  currentStatus,
}: StatusChangeModalProps) => {
  const { updateLocalPatientStatus } = usePatientStore();
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentStatus.toLowerCase(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus.toLowerCase()) return;

    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/patients`, {
        method: "POST",
        body: JSON.stringify({
          action: "toggle_status",
          patient_id: patientId,
          status: selectedStatus,
        }),
      });
      const data = await res.json();

      if (data.success) {
        updateLocalPatientStatus(patientId, selectedStatus);
        toast.success(`Status updated to ${selectedStatus}`);
        onClose();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Network error updating status");
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantStyles = (color: string, isSelected: boolean) => {
    const variants: Record<string, any> = {
      emerald: isSelected
        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
        : "hover:border-emerald-500/20",
      slate: isSelected
        ? "border-slate-500/40 bg-slate-500/5 text-slate-600 dark:text-slate-400"
        : "hover:border-slate-500/20",
      blue: isSelected
        ? "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400"
        : "hover:border-blue-500/20",
      rose: isSelected
        ? "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400"
        : "hover:border-rose-500/20",
    };
    return variants[color] || "";
  };

  const getIconBg = (color: string, isSelected: boolean) => {
    const variants: Record<string, any> = {
      emerald: isSelected
        ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
        : "bg-slate-100 dark:bg-white/5 text-slate-400",
      slate: isSelected
        ? "bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.4)]"
        : "bg-slate-100 dark:bg-white/5 text-slate-400",
      blue: isSelected
        ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
        : "bg-slate-100 dark:bg-white/5 text-slate-400",
      rose: isSelected
        ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
        : "bg-slate-100 dark:bg-white/5 text-slate-400",
    };
    return variants[color] || "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050608]/60 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0c0d0f] rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col"
          >
            {/* Liquid Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50" />

            {/* Header */}
            <div className="px-10 pt-10 pb-6 flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Update Status
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Set the current state for this patient
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/5"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-10 pb-10 space-y-6">
              {/* Specialized Options */}
              <div className="space-y-3">
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`group relative w-full flex items-center gap-4 p-5 rounded-[28px] border transition-all duration-300 ${getVariantStyles(opt.color, isSelected)} ${!isSelected ? "bg-white dark:bg-white/[0.01] border-slate-100 dark:border-white/5" : "shadow-[0_8px_32px_rgba(0,0,0,0.08)] scale-[1.02]"}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${getIconBg(opt.color, isSelected)}`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={isSelected ? 3 : 2.5}
                          className={
                            isSelected
                              ? "animate-pulse"
                              : "group-hover:scale-110 transition-transform"
                          }
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`text-xs font-black uppercase tracking-widest ${isSelected ? "" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-current border-transparent" : "border-slate-200 dark:border-white/10"}`}
                      >
                        {isSelected ? (
                          <Check
                            size={12}
                            strokeWidth={4}
                            className="text-white"
                          />
                        ) : (
                          <ChevronRight size={12} className="text-slate-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Logic */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Confirm your selection below
                  </p>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={
                    isLoading || selectedStatus === currentStatus.toLowerCase()
                  }
                  className="group relative w-full py-5 bg-[#121417] hover:bg-[#1a1d21] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-[#00390a] rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isLoading ? (
                    <>
                      <Loader2
                        className="animate-spin"
                        size={20}
                        strokeWidth={3}
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Check
                          size={18}
                          strokeWidth={3}
                          className="relative z-10"
                        />
                      </div>
                      Update Patient Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatusChangeModal;
