import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Check,
  Activity,
  Zap,
  Clock,
  ShieldCheck,
  Hash,
  Calendar,
  CreditCard,
  Layout,
  ArrowRight,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { type Patient, usePatientStore } from "../../../store/usePatientStore";
import { motion } from "framer-motion";

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess: () => void;
}

const AVAILABLE_ICONS: any = {
  Activity,
  Zap,
  Clock,
  Calendar,
  Check,
  CreditCard,
  Layout,
  ShieldCheck,
};

const IconComponent = ({
  name,
  size = 20,
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const Icon = AVAILABLE_ICONS[name] || Activity;
  return <Icon size={size} className={className} style={style} />;
};

const labelClass =
  "block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5 px-1";
const inputClass =
  "w-full px-5 py-3 bg-white/80 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200 dark:border-white/5 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-[18px] outline-none transition-all text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm";

const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
  prefix = "",
  placeholder = "",
  themeColor,
  disabled = false,
  readOnly = false,
  ...props
}: any) => (
  <div className="space-y-1 w-full group">
    <label
      className={labelClass}
      style={{ color: value ? "#0d9488" : undefined }}
    >
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400"
        />
      )}
      {prefix && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300 dark:text-slate-600">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`${inputClass} ${Icon || prefix ? "pl-12" : "px-5"}`}
        style={{ borderColor: themeColor && value ? themeColor : undefined }}
        {...props}
        onKeyDown={(e) => {
          if (type === "number" && ["-", "e", "E"].includes(e.key)) {
            e.preventDefault();
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
      />
    </div>
  </div>
);

const ChangePlanModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: ChangePlanModalProps) => {
  const { metaData, patientDetails } = usePatientStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [rateOrCost, setRateOrCost] = useState("");
  const [days, setDays] = useState("");
  const [discount, setDiscount] = useState("0");
  const [advance, setAdvance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // Primary method for single mode
  const [reason, setReason] = useState("");
  const [finalDue, setFinalDue] = useState(0);
  const [carryOverBalance, setCarryOverBalance] = useState(0);

  // Split Payment State
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<Record<string, number>>(
    {},
  );

  const darkTealBase = "#042626";

  useEffect(() => {
    if (isOpen && patient) {
      setCarryOverBalance(
        parseFloat(patient.effective_balance?.toString() || "0"),
      );

      // Auto-fill existing patient plan data immediately
      const currentRate = patient.cost_per_day?.toString() || "";
      const currentDays = patient.treatment_days?.toString() || "";
      const totalDisc = parseFloat(patient.discount_amount?.toString() || "0");
      const daysForDisc = patient.treatment_days || 1;
      const currentDisc = Math.round(totalDisc / daysForDisc).toString();

      setRateOrCost(currentRate);
      setDays(currentDays);
      setDiscount(currentDisc);
      setAdvance("");
      setPaymentMethod("");
      setReason("");

      const fetchTrack = async () => {
        try {
          let trackId = patient.service_track_id;
          if (!trackId) {
            if (patient.service_type?.toLowerCase() === "physio") trackId = 2;
            else if (patient.service_type?.toLowerCase() === "heart")
              trackId = 3;
          }
          if (!trackId) throw new Error("No service track ID found");
          const res = await authFetch(
            `${API_BASE_URL}/admin/services?id=${trackId}`,
          );
          const data = await res.json();
          if (data.status === "success") {
            setSelectedTrack(data.data);
            if (data.data.pricing?.plans?.length > 0) {
              const target =
                data.data.pricing.plans.find(
                  (p: any) =>
                    p.id === patient.treatment_type ||
                    p.name === patient.treatment_type,
                ) || data.data.pricing.plans[0];
              setSelectedPlanId(target.id);

              // If patient data was missing, use plan defaults
              if (!currentRate) setRateOrCost(target.rate.toString());
              if (!currentDays) setDays(target.days.toString());
            } else if (data.data.pricing?.model === "fixed-rate") {
              if (!currentRate)
                setRateOrCost(data.data.pricing.fixedRate.toString());
              if (!currentDays) setDays("1");
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchTrack();
    }
  }, [isOpen, patient]);

  useEffect(() => {
    // New Logic: Discount is Flat Amount Per Session
    // Total = (Rate - Discount) * Days
    const r = parseFloat(rateOrCost) || 0;
    const d = parseFloat(discount) || 0;
    const n = parseInt(days) || 0;

    // Ensure discount doesn't exceed rate
    const effectiveRate = Math.max(0, r - d);
    const totalCost = effectiveRate * n;

    // Net Payable = Total Cost - CarryOver - Advance
    setFinalDue(totalCost - carryOverBalance - (parseFloat(advance) || 0));
  }, [rateOrCost, days, discount, advance, selectedPlanId, carryOverBalance]);

  // Sync simple payment mode to splits
  useEffect(() => {
    if (!showPaymentDetails && paymentMethod) {
      setPaymentSplits({ [paymentMethod]: parseFloat(advance) || 0 });
    }
  }, [advance, paymentMethod, showPaymentDetails]);

  // Sync split total back to advance amount
  useEffect(() => {
    if (showPaymentDetails) {
      const total = Object.values(paymentSplits).reduce(
        (a, b) => a + (b || 0),
        0,
      );
      setAdvance(total > 0 ? total.toString() : "");
    }
  }, [paymentSplits, showPaymentDetails]);

  const toggleSplitMethod = (methodName: string) => {
    setPaymentSplits((prev) => {
      const next = { ...prev };
      if (next[methodName] !== undefined) {
        delete next[methodName];
      } else {
        next[methodName] = 0;
      }
      return next;
    });
  };

  const updateSplitAmount = (methodName: string, amount: number) => {
    setPaymentSplits((prev) => ({
      ...prev,
      [methodName]: Math.max(0, amount),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim())
      return alert("Audit Remarks are compulsory for system changes.");
    if (parseFloat(advance) > 0) {
      if (!showPaymentDetails && !paymentMethod)
        return alert("Select payment method");
      if (showPaymentDetails) {
        const splitTotal = Object.values(paymentSplits).reduce(
          (a, b) => a + b,
          0,
        );
        if (Math.abs(splitTotal - parseFloat(advance)) > 1) {
          return alert(
            `Split amounts (${splitTotal}) must match Advance Paid (${advance})`,
          );
        }
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        old_patient_id: patient?.patient_id,
        master_patient_id: patient?.master_patient_id || "",
        registration_id: patient?.registration_id,
        new_treatment_type: selectedPlanId || "fixed",
        new_treatment_days: days || "1",
        new_total_amount:
          (parseFloat(rateOrCost) || 0) - (parseFloat(discount) || 0),

        new_advance_payment: advance,
        change_plan_payment_method: showPaymentDetails
          ? "split"
          : paymentMethod,
        payment_amounts: paymentSplits, // For backend split logic
        reason_for_change: reason,
        new_track_id: patient?.service_track_id || selectedTrack?.id,
        action: "change_plan",
      };
      const res = await authFetch(`${API_BASE_URL}/reception/treatment_plans`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if ((await res.json()).success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const lastUpdate = patientDetails?.history?.[0]; // Assuming history is newest first

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="relative bg-white dark:bg-[#0c0d0f] w-full max-w-6xl rounded-[32px] shadow-[0_32px_128px_rgba(15,23,42,0.2)] border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="relative flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div
            className="w-[350px] flex flex-col pt-10 px-6 relative z-10 shrink-0 overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: darkTealBase }}
          >
            <div className="space-y-6 pb-10">
              <div className="space-y-5 px-2">
                <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center">
                  <IconComponent
                    name={selectedTrack?.icon || "Layout"}
                    size={32}
                    style={{ color: darkTealBase }}
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white leading-tight tracking-tight uppercase">
                    {patient.patient_name}
                  </h2>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[9px] font-black text-white/60 border border-white/10 uppercase tracking-widest">
                      {patient.patient_uid}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-2">
                  Operational Check
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Plan",
                      value: patient.treatment_type,
                      icon: Activity,
                      color: "text-orange-400",
                    },
                    {
                      label: "Sessions",
                      value: `${patient.attendance_count || 0} Finished`,
                      icon: Calendar,
                      color: "text-teal-400",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-white/5 border border-white/5"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}
                      >
                        <s.icon size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-white/30 uppercase mb-0.5">
                          {s.label}
                        </p>
                        <p className="text-xs font-black text-white capitalize">
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-[28px] bg-orange-50 dark:bg-orange-500/10 shadow-xl text-center border border-orange-200/50 dark:border-orange-500/20">
                  <p className="text-[8px] font-black text-orange-400 dark:text-orange-300 uppercase tracking-widest mb-1">
                    Total Balance
                  </p>
                  <h3
                    className={`text-3xl font-black tracking-tighter ${carryOverBalance >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-500"}`}
                  >
                    ₹{Math.abs(carryOverBalance).toLocaleString()}
                    <span className="text-[9px] ml-1 opacity-40 font-black tracking-widest text-orange-400 dark:text-orange-300">
                      {carryOverBalance < 0 ? "DUE" : "CR"}
                    </span>
                  </h3>
                </div>

                {/* History Card */}
                <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-teal-400" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest uppercase">
                      Last Activity
                    </p>
                  </div>
                  {lastUpdate ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase mb-1">
                          Updated On
                        </p>
                        <p className="text-xs font-black text-white/80">
                          {new Date(
                            lastUpdate.created_at || lastUpdate.updated_at,
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            lastUpdate.created_at || lastUpdate.updated_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[8px] font-bold text-teal-400/60 uppercase mb-1.5">
                          Change Log
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/40 line-through truncate max-w-[80px]">
                            {patient.treatment_type}
                          </span>
                          <ArrowRight
                            size={10}
                            className="text-teal-500 shrink-0"
                          />
                          <span className="text-[10px] font-black text-teal-400 truncate">
                            {lastUpdate.title || "Plan Updated"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-white/20 italic">
                      No recent modifications found in system logs.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0c0d0f] shrink">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-teal-50/60 via-white dark:via-[#0c0d0f] to-orange-50/60 dark:opacity-20" />
              <div className="absolute top-1/2 -right-40 w-[800px] h-[800px] blur-[180px] opacity-[0.1] dark:opacity-[0.05] rounded-full bg-orange-400" />
              <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] blur-[150px] opacity-[0.08] dark:opacity-[0.04] rounded-full bg-teal-400" />
            </div>

            <div className="relative z-10 flex flex-col h-full overflow-y-auto p-12 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="flex justify-between items-center mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <Zap size={16} fill="currentColor" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                        Pick New Plan
                      </h3>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-1">
                      Select strategy & update sessions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-lg border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-all"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {selectedTrack?.pricing?.plans?.map(
                    (plan: any, i: number) => {
                      const active = selectedPlanId === plan.id;
                      const isCurrent = patient.treatment_type === plan.id;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setRateOrCost(plan.rate.toString());
                            setDays(plan.days.toString());
                          }}
                          className={`relative group p-7 rounded-[36px] border text-left transition-all duration-300 ${active ? "bg-white dark:bg-white/5 border-teal-500 dark:border-teal-400 ring-4 ring-teal-500/10 shadow-2xl scale-[1.02]" : "bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm opacity-100"}`}
                        >
                          {isCurrent && (
                            <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/30 text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest shadow-sm">
                              Current Plan
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-8">
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-teal-500 text-white shadow-2xl shadow-teal-500/40" : "bg-white text-slate-300 shadow-inner"}`}
                            >
                              <IconComponent
                                name={plan.icon || "Clock"}
                                size={24}
                              />
                            </div>
                            {active && (
                              <motion.div
                                layoutId="check"
                                className="w-5 h-5 rounded-full bg-orange-500 border-4 border-white shadow-lg shadow-orange-500/40"
                              />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4
                              className={`text-base font-black uppercase tracking-tight ${active ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                            >
                              {plan.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-2xl font-black tracking-tighter ${active ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-800"}`}
                              >
                                ₹{plan.rate.toLocaleString()}
                              </p>
                              <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {plan.days} Sessions
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <FormInput
                      label="Price / Session"
                      value={rateOrCost}
                      onChange={(e: any) => {
                        const val = parseFloat(e.target.value);
                        setRateOrCost(isNaN(val) ? "" : Math.max(0, val).toString());
                      }}
                      type="number"
                      prefix="₹"
                      min="0"
                    />
                    <FormInput
                      label="Total Sessions"
                      value={days}
                      onChange={(e: any) => {
                        const val = parseInt(e.target.value);
                        setDays(isNaN(val) ? "" : Math.max(0, val).toString());
                      }}
                      type="number"
                      icon={Hash}
                      min="0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FormInput
                      label="Discount (₹/Session)"
                      value={discount}
                      onChange={(e: any) => {
                        const val = parseFloat(e.target.value);
                        setDiscount(isNaN(val) ? "" : Math.max(0, val).toString());
                      }}
                      type="number"
                      prefix="-"
                      placeholder="Flat deduction"
                      min="0"
                    />
                    <FormInput
                      label="Advance Paid"
                      value={advance}
                      onChange={(e: any) => {
                        const val = parseFloat(e.target.value);
                        setAdvance(isNaN(val) ? "" : Math.max(0, val).toString());
                      }}
                      type="number"
                      prefix="₹"
                      min="0"
                    />
                  </div>

                  {/* Payment Section */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                        Payment Details
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentDetails(!showPaymentDetails);
                          if (!showPaymentDetails && paymentMethod) {
                            // Switch to split: init with current
                            setPaymentSplits({
                              [paymentMethod]: parseFloat(advance) || 0,
                            });
                          } else {
                            // Switch to single: pick first active or reset
                            const keys = Object.keys(paymentSplits);
                            if (keys.length > 0) setPaymentMethod(keys[0]);
                          }
                        }}
                        className="flex items-center gap-1 text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                      >
                        {showPaymentDetails ? "Single Mode" : "Split Mode"}
                        {showPaymentDetails ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </button>
                    </div>

                    {!showPaymentDetails ? (
                      <div className="flex gap-4 flex-wrap">
                        {metaData.payment_methods.map((m, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPaymentMethod(m.method_name)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${paymentMethod === m.method_name ? "bg-teal-600 dark:bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105" : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"}`}
                          >
                            {m.method_name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 p-5 rounded-[24px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        {metaData.payment_methods.map((m) => {
                          const active =
                            paymentSplits[m.method_name] !== undefined;
                          return (
                            <div
                              key={m.method_name}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? "bg-white dark:bg-white/5 border-teal-500 dark:border-teal-400 shadow-sm" : "bg-white/40 dark:bg-white/[0.01] border-slate-100 dark:border-white/5 opacity-60"}`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleSplitMethod(m.method_name)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${active ? "bg-teal-500 border-teal-500 text-white" : "bg-white border-slate-300"}`}
                              >
                                {active && <Check size={12} strokeWidth={3} />}
                              </button>
                              <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                {m.method_name}
                              </span>
                              {active && (
                                <input
                                  type="number"
                                  min="0"
                                  onKeyDown={(e) => {
                                    if (["-", "e", "E"].includes(e.key))
                                      e.preventDefault();
                                  }}
                                  value={paymentSplits[m.method_name] || ""}
                                  onChange={(e) =>
                                    updateSplitAmount(
                                      m.method_name,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="w-20 bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-bold text-right outline-none text-slate-800"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center p-4 bg-teal-50/50 dark:bg-teal-500/5 rounded-2xl border border-teal-100 dark:border-teal-500/20 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                      Net Rate / Session
                    </span>
                    <span className="text-xl font-black text-teal-700 dark:text-teal-400 tracking-tight">
                      ₹
                      {(
                        (parseFloat(rateOrCost) || 0) -
                        (parseFloat(discount) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>

                  {/* Simplified Financial Breakdown */}
                  <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>Plan Value</span>
                      <span>
                        ₹
                        {(
                          ((parseFloat(rateOrCost) || 0) -
                            (parseFloat(discount) || 0)) *
                          (parseInt(days) || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>Wallet Balance</span>
                      <span
                        className={`${carryOverBalance > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"}`}
                      >
                        {carryOverBalance > 0 ? "- " : "+ "}₹
                        {Math.abs(carryOverBalance).toLocaleString()}
                      </span>
                    </div>
                    {(parseFloat(advance) || 0) > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>Advance Paid</span>
                        <span className="text-emerald-500 dark:text-emerald-400">
                          - ₹{parseFloat(advance).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-slate-200 dark:bg-white/5 w-full my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Final Due
                      </span>
                      <span
                        className={`text-xl font-black tracking-tighter ${finalDue > 0 ? "text-slate-800 dark:text-white" : "text-emerald-500 dark:text-emerald-400"}`}
                      >
                        ₹{finalDue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="p-8 rounded-[40px] bg-white/90 dark:bg-white/[0.03] backdrop-blur-2xl border border-teal-500/10 dark:border-white/5 flex flex-col md:flex-row gap-8 justify-between items-center shadow-3xl group overflow-hidden transition-all">
                      <div className="space-y-1 text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] leading-none">
                          Net Payable
                        </p>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white">
                          ₹{finalDue.toLocaleString()}
                        </h2>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !reason.trim()}
                        className={`w-full md:w-auto px-8 py-3.5 rounded-[22px] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl ${!reason.trim() ? "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed" : "bg-teal-600 text-white hover:scale-105 active:scale-98 shadow-teal-500/40"}`}
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Zap size={16} fill="currentColor" />
                        )}
                        <span>
                          {!reason.trim() ? "Locked" : "Save Changes"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3 px-2">
                      <Clock size={12} className="text-teal-500" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Audit Remarks{" "}
                        <span className="text-rose-500 ml-1 text-[10px]">
                          * Compulsory
                        </span>
                      </p>
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e: any) => setReason(e.target.value)}
                      placeholder="Audit logic: why is this modification being performed?"
                      className="w-full px-7 py-5 bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm border border-slate-100 dark:border-white/5 rounded-[32px] outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[110px] focus:border-teal-500 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-white/5 shadow-sm transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default ChangePlanModal;
