import { useState, useEffect } from "react";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import { type Patient, usePatientStore } from "../../../store/usePatientStore";
import { useThemeStore } from "../../../store/useThemeStore";
import { API_BASE_URL, authFetch } from "../../../config";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess: () => void;
}

const AttendanceModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: AttendanceModalProps) => {
  const { isDark } = useThemeStore();
  const { metaData } = usePatientStore();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isRemarksManual, setIsRemarksManual] = useState(false);
  const [markAsDue, setMarkAsDue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const costPerDay = patient?.cost_per_day || 0;
  const effectiveBalance = patient?.effective_balance || 0;
  const minRequired = Math.max(0, costPerDay - effectiveBalance);

  useEffect(() => {
    if (isOpen && patient) {
      setAmount(minRequired.toFixed(2));
      setPaymentMethod("");
      setRemarks("");
      setIsRemarksManual(false);
      setMarkAsDue(false);
      setError("");
    }
  }, [isOpen, patient, minRequired]);

  useEffect(() => {
    if (markAsDue) {
      setAmount("0");
      setPaymentMethod("");
    } else {
      setAmount(minRequired.toFixed(2));
    }
  }, [markAsDue, minRequired]);

  useEffect(() => {
    if (isRemarksManual) return;

    if (markAsDue) {
      setRemarks("Auto: Marked as Pending (Pay Later)");
    } else {
      const numAmount = parseFloat(amount) || 0;
      if (numAmount > 0) {
        setRemarks(`Auto: Payment of ₹${numAmount} received`);
      } else {
        setRemarks("Auto: Debited from Balance");
      }
    }
  }, [markAsDue, amount, isRemarksManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!markAsDue && parseFloat(amount) > 0 && !paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        patient_id: patient?.patient_id,
        payment_amount: amount,
        mode: paymentMethod, // Can be empty if amount is 0
        remarks: remarks,
        status: markAsDue ? "pending" : "present", // Explicitly set status
      };

      const res = await authFetch(`${API_BASE_URL}/reception/attendance`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success" || data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to mark attendance");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div
        className={`w-full max-w-4xl rounded-[32px] border transition-all duration-500 overflow-hidden ${
          isDark ? "bg-[#141619] border-white/10" : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-black/[0.03] dark:border-white/[0.03] flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-[#e3e2e6] tracking-tight">
                Mark Attendance
              </h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                ID #{patient.patient_id} • {patient.patient_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white border border-transparent hover:border-black/5 dark:hover:border-white/5"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 border border-rose-500/10 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Financial Summary & Toggle */}
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Payment Summary
                </label>
                <div className="p-8 bg-slate-50 dark:bg-white/[0.02] rounded-[32px] border border-black/[0.03] dark:border-white/[0.03] space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Daily Fees
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      ₹{costPerDay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Current Balance
                    </span>
                    <span
                      className={`text-base font-bold ${effectiveBalance >= 0 ? "text-emerald-500" : "text-rose-500"} tracking-tight`}
                    >
                      ₹{effectiveBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-black/[0.05] dark:border-white/[0.08] pt-6 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em]">
                        Amount to Pay
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 opacity-60">
                        Total required
                      </span>
                    </div>
                    <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                      ₹{minRequired.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Status Options
                </label>
                <div
                  className={`group p-6 rounded-3xl border transition-all cursor-pointer flex items-center gap-6 ${
                    markAsDue
                      ? "bg-rose-50 dark:bg-rose-500/5 border-rose-500/20"
                      : "bg-white dark:bg-white/[0.02] border-black/[0.05] dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                  onClick={() => setMarkAsDue(!markAsDue)}
                >
                  <div
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                      markAsDue
                        ? "bg-rose-500 border-rose-500 text-white"
                        : "border-slate-300 dark:border-white/10 text-transparent"
                    }`}
                  >
                    <Check size={20} strokeWidth={4} />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-[15px] font-bold ${markAsDue ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"} tracking-tight`}
                    >
                      Pay Later (Mark Pending)
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 opacity-70">
                      Mark as pending and add to dues
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Form */}
            <div className="flex flex-col h-full space-y-8">
              {!markAsDue ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                      Received Amount
                    </label>
                    <div className="relative group">
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                        ₹
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-14 pr-8 py-6 bg-slate-50 dark:bg-white/[0.03] border border-transparent focus:border-emerald-500/20 rounded-[28px] outline-none transition-all font-black text-3xl text-slate-900 dark:text-white tracking-tighter"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {metaData.payment_methods.map((method) => (
                        <button
                          key={method.method_id}
                          type="button"
                          onClick={() => setPaymentMethod(method.method_name)}
                          className={`px-6 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-[0.15em] border transition-all ${
                            paymentMethod === method.method_name
                              ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white scale-[1.02]"
                              : "bg-transparent border-black/[0.05] dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {method.method_name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-rose-500/[0.02] border border-dashed border-rose-500/10 rounded-[32px] text-center animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2 tracking-tight">
                    Pay Later Mode Active
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                    No payment will be recorded now. This amount will be added
                    to the patient's pending dues.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    setIsRemarksManual(true);
                  }}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.03] border border-transparent focus:border-emerald-500/20 rounded-[24px] outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 resize-none"
                  placeholder="Add any notes here..."
                  rows={markAsDue ? 4 : 2}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-6 rounded-[28px] font-black text-[13px] uppercase tracking-[0.3em] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 mt-4 ${
                  markAsDue
                    ? "bg-rose-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check size={22} strokeWidth={3} />
                    {markAsDue ? "Confirm Pay Later" : "Confirm Attendance"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;
