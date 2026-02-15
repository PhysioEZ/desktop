import { useState, useEffect } from "react";
import {
  X,
  Check,
  Loader2,
  Clock,
  Calendar,
  Users,
  Percent,
  Calculator,
  FileText,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { type Patient, usePatientStore } from "../../../store/usePatientStore";
import DatePicker from "../../ui/DatePicker";
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
    discount_percentage: "0",
    remarks: "",
  });
  const [note, setNote] = useState("");
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setFormData({
        treatment_days: patient.treatment_days?.toString() || "",
        treatment_time_slot: patient.treatment_time_slot || "",
        start_date: patient.start_date || "",
        end_date: patient.end_date || "",
        assigned_doctor: patient.assigned_doctor || "",
        discount_percentage: patient.discount_percentage?.toString() || "0",
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
      const discountPct = parseFloat(formData.discount_percentage) || 0;
      const subtotal = (costPerDay || 600) * days;
      const newTotal = subtotal * (1 - discountPct / 100);
      setNote(
        `Projected total: ₹${Math.round(newTotal).toLocaleString()} over ${days} sessions`,
      );
    } else {
      setNote("");
    }
  }, [
    formData.treatment_days,
    formData.start_date,
    formData.discount_percentage,
    patient,
    isOpen,
  ]);

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
          className="relative w-full max-w-4xl bg-white dark:bg-[#0c0d0f] rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-50" />

          <div className="px-12 pt-12 pb-8 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Modify Program
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Clinical Plan Adjustment
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/5"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-12 pb-12 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]"
          >
            {/* Summary Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-[36px] bg-blue-600 dark:bg-blue-500/10 text-white dark:text-blue-400 border border-blue-500/20 relative overflow-hidden group">
                <Calculator
                  className="absolute right-6 top-6 opacity-10 group-hover:scale-125 transition-transform duration-700"
                  size={80}
                />
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                    Current Modality
                  </p>
                  <h4 className="text-2xl font-black mb-1">
                    {patient?.treatment_type || "Custom Treatment"}
                  </h4>
                  <p className="text-sm font-bold opacity-80 uppercase tracking-widest leading-none">
                    Day Rate: ₹
                    {parseFloat(
                      patient?.cost_per_day?.toString() || "0",
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {note && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-[36px] bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                      Price Trajectory
                    </p>
                  </div>
                  <p className="text-lg font-black leading-tight">{note}</p>
                </motion.div>
              )}
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Clock size={12} className="text-blue-500" />
                  Sessions Duration
                </label>
                <input
                  type="number"
                  value={formData.treatment_days}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_days: e.target.value })
                  }
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-xl text-slate-800 dark:text-white shadow-inner"
                  placeholder="Enter days..."
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Clock size={12} className="text-emerald-500" />
                  Preferred Slot
                </label>
                <div className="relative group">
                  <input
                    type="time"
                    value={formData.treatment_time_slot}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        treatment_time_slot: e.target.value,
                      })
                    }
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-xl text-slate-800 dark:text-white shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Calendar size={12} className="text-indigo-500" />
                  Commencement
                </label>
                <button
                  type="button"
                  onClick={() => setOpenStartPicker(true)}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] flex items-center justify-between hover:border-indigo-500/40 transition-all group"
                >
                  <span className="text-lg font-black text-slate-800 dark:text-white">
                    {formData.start_date
                      ? new Date(formData.start_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "Select Date"}
                  </span>
                  <Calendar
                    size={20}
                    className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                  />
                </button>
                <AnimatePresence>
                  {openStartPicker && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <DatePicker
                        value={formData.start_date}
                        onChange={(date) => {
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
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Calendar size={12} className="text-rose-500" />
                  Conclusion
                </label>
                <button
                  type="button"
                  onClick={() => setOpenEndPicker(true)}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] flex items-center justify-between hover:border-rose-500/40 transition-all group"
                >
                  <span className="text-lg font-black text-slate-800 dark:text-white">
                    {formData.end_date
                      ? new Date(formData.end_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "Select Date"}
                  </span>
                  <Calendar
                    size={20}
                    className="text-slate-300 group-hover:text-rose-500 transition-colors"
                  />
                </button>
                <AnimatePresence>
                  {openEndPicker && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <DatePicker
                        value={formData.end_date}
                        onChange={(date) => {
                          setFormData((prev) => ({ ...prev, end_date: date }));
                          setOpenEndPicker(false);
                        }}
                        onClose={() => setOpenEndPicker(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Users size={12} className="text-amber-500" />
                  Lead Specialist
                </label>
                <select
                  value={formData.assigned_doctor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assigned_doctor: e.target.value,
                    })
                  }
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-lg text-slate-800 dark:text-white appearance-none cursor-pointer"
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
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <Percent size={12} className="text-emerald-500" />
                  Privilege Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: e.target.value,
                      })
                    }
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-xl text-slate-800 dark:text-white shadow-inner"
                    placeholder="0"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-bold">
                    %
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                <FileText size={12} className="text-slate-500" />
                Modification Rationale
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] focus:ring-4 focus:ring-slate-500/10 outline-none transition-all font-bold text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-300 shadow-sm"
                placeholder="State the reason for plan adjustment..."
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-20 bg-[#121417] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[32px] font-black text-lg uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} strokeWidth={3} />
              ) : (
                <Check size={24} strokeWidth={4} />
              )}
              Update Program
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditPlanModal;
