import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Loader2,
  IndianRupee,
  Wallet,
  CreditCard,
  Banknote,
  History,
  AlertCircle,
} from "lucide-react";
import { usePatientStore } from "../../../store/usePatientStore";
import { API_BASE_URL, authFetch } from "../../../config";

interface PayDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  currentDue: number;
  walletBalance?: number;
  onSuccess: () => void;
}

const PayDuesModal = ({
  isOpen,
  onClose,
  patientId,
  currentDue,
  walletBalance = 0,
  onSuccess,
}: PayDuesModalProps) => {
  const { metaData } = usePatientStore();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(currentDue > 0 ? currentDue.toString() : "");
      setPaymentMethod("");
      setRemarks("");
      setError("");
    }
  }, [isOpen, currentDue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        patient_id: patientId,
        amount: amount,
        method: paymentMethod,
        remarks: remarks || "Dues Payment",
      };

      const res = await authFetch(`${API_BASE_URL}/reception/add_payment`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === "success" || data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Payment failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cash") || n.includes("cashier")) return Banknote;
    if (n.includes("card") || n.includes("pos")) return CreditCard;
    if (n.includes("online") || n.includes("upi") || n.includes("gpay"))
      return Wallet;
    return CreditCard;
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
            className="absolute inset-0 bg-[#050608]/60 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-white dark:bg-[#0c0d0f] rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col"
          >
            {/* Liquid Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50" />

            {/* Header */}
            <div className="px-10 pt-10 pb-6 flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Record Payment
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Transaction Ledger Entry
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/5"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              {/* Grid 1: Stats & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Status Card */}
                <div className="p-8 rounded-[36px] bg-[#121417] text-white relative overflow-hidden group border border-white/5 flex flex-col justify-center gap-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />

                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                      Patient Outstanding
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black tracking-tighter text-white">
                        ₹{currentDue.toLocaleString("en-IN")}
                      </span>
                      {currentDue > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-2" />
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 h-[1px] bg-white/5 w-full" />

                  <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Wallet size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                        Wallet Balance
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black tracking-tighter text-emerald-400">
                        ₹{walletBalance.toLocaleString("en-IN")}
                      </span>
                      {walletBalance > 0 && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-2">
                          Credit Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Payment Amount
                    </label>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter font-mono">
                      INR Currency
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 transition-transform group-focus-within:scale-110">
                      <IndianRupee size={22} strokeWidth={2.5} />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-22 pr-8 py-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-3xl text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Payment Methods */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">
                  Instrument Selection
                </label>{" "}
                <br />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {metaData.payment_methods.map((method, idx) => {
                    const Icon = getMethodIcon(method.method_name);
                    const isSelected = paymentMethod === method.method_name;
                    return (
                      <button
                        key={method.method_id || idx}
                        type="button"
                        onClick={() => setPaymentMethod(method.method_name)}
                        className={`group relative flex flex-col items-start gap-4 p-5 rounded-[28px] border transition-all duration-300 ${
                          isSelected
                            ? "bg-emerald-500/5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-[0_8px_32px_rgba(16,185,129,0.12)] -translate-y-1"
                            : "bg-white dark:bg-white/[0.01] border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-emerald-500/20 hover:-translate-y-0.5"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-emerald-500"}`}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight leading-none">
                          {method.method_name}
                        </span>
                        {isSelected && (
                          <motion.div
                            layoutId="activeMethod"
                            className="absolute top-4 right-4 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c0d0f] flex items-center justify-center"
                          >
                            <Check
                              size={8}
                              strokeWidth={4}
                              className="text-white"
                            />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid 3: Remarks & Submit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">
                    Ledger Notes
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700">
                      <History size={18} />
                    </div>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full pl-12 pr-6 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                      placeholder="Add a payment remark..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full h-[62px] bg-[#121417] hover:bg-[#1a1d21] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-[#00390a] rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isSubmitting ? (
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
                          size={20}
                          strokeWidth={3}
                          className="relative z-10"
                        />
                      </div>
                      Confirm Settle
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PayDuesModal;
