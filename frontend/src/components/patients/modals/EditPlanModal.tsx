import { useState, useEffect } from "react";
import {
  X,
  Check,
  Loader2,
  Clock,
  Calendar,
  Users,
  IndianRupee,
  Calculator,
  FileText,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { type Patient, usePatientStore } from "../../../store/usePatientStore";
import DatePicker from "../../ui/DatePicker";
import { TimePicker } from "../../SharedPickers";
import { motion, AnimatePresence } from "framer-motion";

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess: () => void;
}

const EditPlanModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: EditPlanModalProps) => {
  const { metaData } = usePatientStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    treatment_days: "",
    treatment_time_slot: "",
    start_date: "",
    end_date: "",
    assigned_doctor: "",
    discount_amount: "0",
    remarks: "",
  });
  const [note, setNote] = useState("");
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Generate daily slots 9 AM to 8 PM
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9;
    const label = new Date(0, 0, 0, hour).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { value: label, label, booked: false };
  });

  useEffect(() => {
    if (isOpen && patient) {
      // Calculate current discount amount from percentage if needed,
      // but usually we want to start fresh or use stored discount_amount if available.
      // Backend stores discount_amount.
      setFormData({
        treatment_days: patient.treatment_days?.toString() || "",
        treatment_time_slot: patient.treatment_time_slot || "",
        start_date: patient.start_date || "",
        end_date: patient.end_date || "",
        assigned_doctor: patient.assigned_doctor || "",
        discount_amount: (
          parseFloat(patient.discount_amount?.toString() || "0") /
          (parseInt(patient.treatment_days?.toString() || "1") || 1)
        ).toFixed(0),
        remarks: "",
      });
      setNote("");
    }
  }, [isOpen, patient]);

  useEffect(() => {
    if (!isOpen || !patient) return;

    const days = parseInt(formData.treatment_days) || 0;
    const start = formData.start_date ? new Date(formData.start_date) : null;

    if (days > 0 && start) {
      const end = new Date(start);
      end.setDate(start.getDate() + days - 1);
      const endDateStr = end.toISOString().split("T")[0];
      if (endDateStr !== formData.end_date) {
        setFormData((prev) => ({ ...prev, end_date: endDateStr }));
      }
    }

    if (days > 0) {
      const costPerDay = parseFloat(patient.cost_per_day?.toString() || "0");
      const discountAmountPerSession =
        parseFloat(formData.discount_amount) || 0;
      const effectiveRate = Math.max(0, costPerDay - discountAmountPerSession);
      const newTotal = effectiveRate * days;

      setNote(
        `Projected total: ₹${Math.round(newTotal).toLocaleString()} over ${days} sessions`,
      );
    } else {
      setNote("");
    }
  }, [
    formData.treatment_days,
    formData.start_date,
    formData.discount_amount,
    patient,
    isOpen,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const costPerDay = parseFloat(patient?.cost_per_day?.toString() || "0");
      const discountAmountPerSession =
        parseFloat(formData.discount_amount) || 0;

      // Calculate percentage for backend compatibility
      const discountPct =
        costPerDay > 0 ? (discountAmountPerSession / costPerDay) * 100 : 0;

      const payload = {
        edit_plan_patient_id: patient?.patient_id,
        edit_treatment_days: formData.treatment_days,
        edit_time_slot: formData.treatment_time_slot,
        edit_start_date: formData.start_date,
        edit_end_date: formData.end_date,
        edit_assigned_doctor: formData.assigned_doctor,
        edit_discount_percentage: discountPct.toFixed(2),
        edit_remarks: formData.remarks,
      };

      const res = await authFetch(
        `${API_BASE_URL}/reception/edit_treatment_plan`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || "Failed to update plan");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const costPerDay = parseFloat(patient?.cost_per_day?.toString() || "0");
  const dAmnt = parseFloat(formData.discount_amount) || 0;
  const effectiveRate = Math.max(0, costPerDay - dAmnt);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050608]/60 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-white dark:bg-[#0c0d0f] rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-50" />

          <div className="px-10 pt-10 pb-6 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight">
                Modify Program
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Clinical Plan Adjustment
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/5"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-10 pb-10 space-y-6 overflow-y-auto custom-scrollbar max-h-[75vh]"
          >
            {/* Summary Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-7 rounded-[32px] bg-blue-600 dark:bg-blue-500/10 text-white dark:text-blue-400 border border-blue-500/20 relative overflow-hidden group">
                <Calculator
                  className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 group-hover:scale-125 transition-transform duration-700"
                  size={60}
                />
                <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                    Current Modality
                  </p>
                  <h4 className="text-xl font-black mb-1">
                    {patient?.treatment_type || "Custom Treatment"}
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest leading-none">
                      Day Rate: ₹{Math.round(effectiveRate).toLocaleString()}
                    </p>
                    {dAmnt > 0 && (
                      <p className="text-[10px] font-bold line-through opacity-40">
                        ₹{costPerDay.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {note && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-7 rounded-[32px] bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
                      Price Trajectory
                    </p>
                  </div>
                  <p className="text-base font-black leading-tight tracking-tight">
                    {note}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Clock size={10} className="text-blue-500" />
                  Sessions Duration
                </label>
                <input
                  type="number"
                  value={formData.treatment_days}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_days: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-lg text-slate-800 dark:text-white shadow-inner"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Clock size={10} className="text-emerald-500" />
                  Preferred Slot
                </label>
                <button
                  type="button"
                  onClick={() => setShowTimePicker(true)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] flex items-center justify-between hover:border-emerald-500/40 transition-all group shadow-inner"
                >
                  <span
                    className={`text-lg font-black ${formData.treatment_time_slot ? "text-slate-800 dark:text-white" : "text-slate-300"}`}
                  >
                    {formData.treatment_time_slot || "Select Time"}
                  </span>
                  <Clock
                    size={16}
                    className="text-slate-300 group-hover:text-emerald-500 transition-colors"
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Calendar size={10} className="text-indigo-500" />
                  Commencement
                </label>
                <button
                  type="button"
                  onClick={() => setOpenStartPicker(true)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] flex items-center justify-between hover:border-indigo-500/40 transition-all group"
                >
                  <span className="text-base font-black text-slate-800 dark:text-white">
                    {formData.start_date
                      ? new Date(formData.start_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "Select Date"}
                  </span>
                  <Calendar
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Calendar size={10} className="text-rose-500" />
                  Conclusion
                </label>
                <button
                  type="button"
                  onClick={() => setOpenEndPicker(true)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] flex items-center justify-between hover:border-rose-500/40 transition-all group"
                >
                  <span className="text-base font-black text-slate-800 dark:text-white">
                    {formData.end_date
                      ? new Date(formData.end_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "Select Date"}
                  </span>
                  <Calendar
                    size={16}
                    className="text-slate-300 group-hover:text-rose-500 transition-colors"
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Users size={10} className="text-amber-500" />
                  Lead Specialist
                </label>
                <div className="relative">
                  <select
                    value={formData.assigned_doctor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assigned_doctor: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-base text-slate-800 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-[#1a1c1e]">
                      Select Doctor
                    </option>
                    {metaData.doctors.map((d) => (
                      <option
                        key={d}
                        value={d}
                        className="bg-white dark:bg-[#1a1c1e]"
                      >
                        Dr. {d}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <Users size={14} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <IndianRupee size={10} className="text-rose-500" />
                  Privilege Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_amount: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-black text-lg text-slate-800 dark:text-white shadow-inner"
                    placeholder="₹"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    / Session
                  </div>
                </div>
                <p className="text-[8px] font-bold text-slate-400 px-2 tracking-wide">
                  Reduces the per-session rate
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                <FileText size={10} className="text-slate-500" />
                Modification Rationale
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-slate-500/10 outline-none transition-all font-bold text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-300 shadow-sm"
                placeholder="State the reason for plan adjustment..."
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-16 bg-[#121417] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[24px] font-black text-base uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
              ) : (
                <Check size={20} strokeWidth={4} />
              )}
              Update Program
            </button>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {openStartPicker && (
          <div className="fixed inset-0 z-[1230] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <DatePicker
              value={formData.start_date}
              onChange={(date: any) => {
                setFormData((prev) => ({
                  ...prev,
                  start_date: date,
                }));
                setOpenStartPicker(false);
              }}
              onClose={() => setOpenStartPicker(false)}
            />
          </div>
        )}
        {openEndPicker && (
          <div className="fixed inset-0 z-[1230] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <DatePicker
              value={formData.end_date}
              onChange={(date: any) => {
                setFormData((prev) => ({ ...prev, end_date: date }));
                setOpenEndPicker(false);
              }}
              onClose={() => setOpenEndPicker(false)}
            />
          </div>
        )}
        {showTimePicker && (
          <TimePicker
            value={formData.treatment_time_slot}
            onChange={(time: any) =>
              setFormData((prev) => ({ ...prev, treatment_time_slot: time }))
            }
            onClose={() => setShowTimePicker(false)}
            slots={timeSlots}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default EditPlanModal;
