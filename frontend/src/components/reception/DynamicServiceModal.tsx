import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Clock,
  UserPlus,
  AlertCircle,
  Zap,
  Calendar,
  Check,
  Activity,
  CreditCard,
  Layout,
  Microscope,
  Bone,
  Stethoscope,
  HeartPulse,
  Syringe,
  Brain,
  Waves,
  Timer,
  Pill,
  Box,
  TrendingDown,
  CheckCircle2,
  Dna,
  FlaskConical,
  HandHelping,
  ShieldPlus,
  User,
  Plus,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../../config";
import { format, addDays } from "date-fns";
import CustomSelect from "../ui/CustomSelect";
import DatePicker from "../ui/DatePicker";
import { useRegistrationStore } from "../../store/useRegistrationStore";

interface FormField {
  id: string;
  type: "text" | "number" | "select" | "date" | "checkbox" | "heading";
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  colSpan: 1 | 2;
  options?: { label: string; value: string }[];
}

interface ServicePlan {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  rate: number;
  days: number;
}

interface ServiceTrack {
  id: string;
  name: string;
  buttonLabel: string;
  icon: string;
  themeColor: string;
  fields: FormField[];
  pricing: {
    enabled: boolean;
    model: "multi-plan" | "fixed-rate";
    plans: ServicePlan[];
    fixedRate: number;
  };
  scheduling: {
    enabled: boolean;
    slotInterval: number;
    slotCapacity: number;
    startTime: string;
    endTime: string;
  };
  permissions: {
    allowDiscount: boolean;
    maxDiscountPercent: number;
    requireDiscountApproval: boolean;
    allowedPaymentMethods: string[];
    allowSplitPayment: boolean;
  };
  isActive: boolean;
}

interface DynamicServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  track: ServiceTrack;
  onSuccess: () => void;
  isStacked?: boolean;
}

const AVAILABLE_ICONS = [
  { name: "Activity", icon: Activity },
  { name: "Zap", icon: Zap },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "Stethoscope", icon: Stethoscope },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "Syringe", icon: Syringe },
  { name: "Microscope", icon: Microscope },
  { name: "Dna", icon: Dna },
  { name: "FlaskConical", icon: FlaskConical },
  { name: "Brain", icon: Brain },
  { name: "HandHelping", icon: HandHelping },
  { name: "ShieldPlus", icon: ShieldPlus },
  { name: "Bone", icon: Bone },
  { name: "Waves", icon: Waves },
  { name: "Timer", icon: Timer },
  { name: "Pill", icon: Pill },
  { name: "Box", icon: Box },
  { name: "User", icon: User },
  { name: "Check", icon: Check },
  { name: "CreditCard", icon: CreditCard },
  { name: "Plus", icon: Plus },
  { name: "Eye", icon: Eye },
  { name: "UserPlus", icon: UserPlus },
];

const IconComponent = ({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) => {
  // @ts-ignore
  const Icon = AVAILABLE_ICONS.find((i) => i.name === name)?.icon || Activity;
  return <Icon size={size} />;
};

const PremiumInput = ({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
  disabled = false,
  readOnly = false,
  prefix = "",
  placeholder = "",
}: any) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between px-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </label>
    </div>
    <div
      className={`relative flex items-center bg-white dark:bg-white/[0.03] border rounded-xl transition-all duration-300 group overflow-hidden ${
        disabled || readOnly
          ? "border-transparent opacity-60 bg-gray-50/50 dark:bg-white/5 cursor-not-allowed"
          : "border-slate-100 dark:border-white/5 focus-within:border-emerald-500/50 focus-within:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.1)] ring-0 shadow-sm"
      }`}
    >
      {Icon && (
        <div className="absolute left-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
          <Icon size={16} strokeWidth={2.5} />
        </div>
      )}
      {prefix && (
        <span className="absolute left-4 text-[13px] font-black text-slate-300 group-focus-within:text-emerald-500/70 select-none transition-colors">
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
        className={`w-full bg-transparent px-4 py-3 text-[13px] font-bold outline-none placeholder:text-slate-300 dark:placeholder:text-slate-500 transition-all ${
          Icon || prefix ? "pl-10" : ""
        } ${
          disabled || readOnly
            ? "cursor-not-allowed text-slate-400"
            : "text-slate-800 dark:text-white"
        }`}
      />
    </div>
  </div>
);

const DynamicServiceModal = ({
  isOpen,
  onClose,
  registration,
  track,
  onSuccess,
  isStacked = false,
}: DynamicServiceModalProps) => {
  // State initialization
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [rate, setRate] = useState<string>("0");
  const [days, setDays] = useState<string>("1");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [discount, setDiscount] = useState<string>("0");
  const [advance, setAdvance] = useState<string>("0");
  const [paymentSplits, setPaymentSplits] = useState<Record<string, number>>(
    {},
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [authorizedBy, setAuthorizedBy] = useState<string>("");
  useEffect(() => {
    if (parseFloat(discount) === 0) setAuthorizedBy("");
  }, [discount]);
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<any>({
    paymentMethods: [],
    employees: [],
  });
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const {
    dynamicModalOptions,
    setDynamicModalOptions,
    serviceSlotsCache,
    setServiceSlotsCache,
  } = useRegistrationStore();

  const fetchOptions = useCallback(async () => {
    // Cache check - now branch sensitive
    if (
      dynamicModalOptions &&
      dynamicModalOptions.branchId === registration.branch_id &&
      dynamicModalOptions.employees.length > 0
    ) {
      setOptions(dynamicModalOptions);
      return;
    }

    try {
      const resOptions = await authFetch(
        `${API_BASE_URL}/reception/form_options?branch_id=${registration.branch_id}`,
      );
      const dataOptions = await resOptions.json();
      const resPayments = await authFetch(
        `${API_BASE_URL}/reception/get_payment_methods`,
      );
      const dataPayments = await resPayments.json();

      const newOptions = {
        branchId: registration.branch_id,
        paymentMethods:
          dataPayments.status === "success" ? dataPayments.data : [],
        employees:
          dataOptions.status === "success" ? dataOptions.data.employees : [],
      };

      setOptions(newOptions);
      setDynamicModalOptions(newOptions);
    } catch (err) {
      console.error("Failed to fetch options:", err);
      setError("System clinical registries are currently unavailable.");
    }
  }, [dynamicModalOptions, registration.branch_id, setDynamicModalOptions]);

  useEffect(() => {
    if (isOpen && track) {
      const firstPlan = track.pricing?.plans?.[0];
      if (firstPlan) {
        setSelectedPlanId(firstPlan.id);
        setRate(firstPlan.rate.toString());
        setDays(firstPlan.days.toString());
      } else if (track.pricing?.model === "fixed-rate") {
        setRate(track.pricing.fixedRate.toString());
      }
      fetchOptions();
    }
  }, [isOpen, track, fetchOptions]);

  const fetchSlots = useCallback(async () => {
    if (!track.scheduling?.enabled || !startDate) return;

    const cacheKey = `${startDate}-${track.name.toLowerCase().replace(/\s+/g, "_")}`;
    if (serviceSlotsCache && serviceSlotsCache[cacheKey]) {
      setAvailableSlots(serviceSlotsCache[cacheKey]);
      return;
    }

    setIsLoadingSlots(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_treatment_slots?date=${startDate}&service_type=${track.name.toLowerCase().replace(/\s+/g, "_")}`,
      );
      const data = await res.json();
      if (data.success) {
        const slots = [];
        const interval = track.scheduling.slotInterval || 60;
        const capacity = track.scheduling.slotCapacity || 1;
        const current = new Date(`1970-01-01T${track.scheduling.startTime}:00`);
        const end = new Date(`1970-01-01T${track.scheduling.endTime}:00`);
        while (current < end) {
          const timeStr = current.toTimeString().substring(0, 5);
          const bookedCount = data.booked[`${timeStr}:00`] || 0;
          slots.push({
            value: timeStr,
            label: `${current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${bookedCount}/${capacity})`,
            disabled: bookedCount >= capacity,
          });
          current.setMinutes(current.getMinutes() + interval);
        }
        setAvailableSlots(slots);
        setServiceSlotsCache(cacheKey, slots);
      }
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [startDate, track, serviceSlotsCache, setServiceSlotsCache]);

  useEffect(() => {
    if (isOpen && track.scheduling?.enabled && startDate) {
      fetchSlots();
    }
  }, [startDate, isOpen, track, fetchSlots]);

  const handlePlanChange = (planId: string) => {
    const plan = track.pricing.plans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlanId(planId);
      setRate(plan.rate.toString());
      setDays(plan.days.toString());
    }
  };

  const billing = useMemo(() => {
    const numRate = parseFloat(rate.toString()) || 0;
    const numDays = parseInt(days.toString()) || 0;
    const numDiscount = parseFloat(discount.toString()) || 0; // Now a fixed amount deduction from rate
    const numAdvance = parseFloat(advance.toString()) || 0;

    const effectiveRate = Math.max(0, numRate - numDiscount);
    const subtotal = numRate * numDays;
    const totalDiscount = numDiscount * numDays;
    const effectiveAmount = effectiveRate * numDays;
    const pendingBalance = effectiveAmount - numAdvance;

    const totalDistributed = Object.values(paymentSplits).reduce(
      (sum, val) => sum + val,
      0,
    );
    const reconciliationError =
      numAdvance > 0 && Math.abs(totalDistributed - numAdvance) > 0.01;

    return {
      subtotal,
      totalDiscount,
      effectiveRate,
      effectiveAmount,
      pendingBalance,
      totalDistributed,
      reconciliationError,
      numAdvance,
    };
  }, [rate, days, discount, advance, paymentSplits]);

  const endDate = useMemo(() => {
    const numDays = parseInt(days.toString()) || 0;
    if (!startDate || numDays <= 0) return "";
    try {
      return format(addDays(new Date(startDate), numDays - 1), "yyyy-MM-dd");
    } catch {
      return "";
    }
  }, [startDate, days]);

  useEffect(() => {
    const keys = Object.keys(paymentSplits);
    if (keys.length === 1) {
      const method = keys[0];
      setPaymentSplits({ [method]: billing.numAdvance });
    }
  }, [billing.numAdvance]);

  const existingPatient = useMemo(() => {
    if (!registration.existing_services || !track) return null;
    const trackSlug = track.name.toLowerCase().replace(/\s+/g, "_");
    return registration.existing_services.find(
      (s: any) => s.service_type === trackSlug,
    );
  }, [registration.existing_services, track]);

  const handleSave = async () => {
    setError(null);
    if (billing.reconciliationError) {
      setError(
        `Payment distribution (₹${billing.totalDistributed.toFixed(2)}) must match Advance Paid (₹${billing.numAdvance.toFixed(2)})`,
      );
      return;
    }
    if (track.scheduling?.enabled && !selectedSlot) {
      setError("Please select an available time slot");
      return;
    }
    if (
      parseFloat(discount) > 0 &&
      track.permissions?.requireDiscountApproval &&
      !authorizedBy
    ) {
      setError("Discount authorization required from a clinical lead");
      return;
    }

    setIsSaving(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/quick_add_patient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: registration.registration_id,
            serviceTrackId: track.id,
            serviceType: track.name.toLowerCase().replace(/\s+/g, "_"),
            treatmentType:
              track.pricing?.plans && track.pricing.plans.length > 0
                ? track.pricing.plans
                    .find((p: any) => p.id === selectedPlanId)
                    ?.name?.toLowerCase() || "daily"
                : track.name?.toLowerCase() || "fixed",
            treatmentDays: parseInt(days.toString()) || 0,
            totalCost: billing.effectiveAmount,
            advancePayment: billing.numAdvance,
            discount: parseFloat(discount.toString()) || 0,
            dueAmount: billing.pendingBalance,
            startDate,
            paymentMethod: Object.keys(paymentSplits).join(", "),
            paymentSplits: Object.entries(paymentSplits).map(
              ([method, amount]) => ({ method, amount }),
            ),
            treatment_time_slot: selectedSlot,
            discount_approved_by_employee_id: authorizedBy,
            customFields: {},
            isDynamic: true,
          }),
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to convert patient");
      }
    } catch (err) {
      setError("A network error occurred while synchronizing with server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[1090] ${isStacked ? "bg-transparent backdrop-blur-none pointer-events-none" : ""}`}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`fixed inset-y-0 z-[1100] bg-white dark:bg-[#0A0B0A] w-full max-w-5xl h-full shadow-2xl overflow-hidden flex flex-col border-l border-black/5 dark:border-white/5 pointer-events-auto ${isStacked ? "right-[680px] rounded-l-2xl border-r shadow-none" : "right-0 rounded-l-3xl"}`}
      >
        {/* Header */}
        <div className="shrink-0 p-6 flex items-center justify-between relative z-10 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#0A0B0A]/80 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden group border border-white dark:border-white/5"
              style={{
                backgroundColor: `${track.themeColor}10`,
                boxShadow: `inset 0 0 12px ${track.themeColor}10`,
              }}
            >
              <div style={{ color: track.themeColor }}>
                <IconComponent name={track.icon} size={22} />
              </div>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-lg font-black text-[#1a1c1e] dark:text-white tracking-tight uppercase">
                {track.name} Setup
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-slate-500 tracking-wider">
                  REG-{registration.registration_id}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  {registration.patient_name}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-all group"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          <div className="grid grid-cols-2 gap-8 py-8">
            {/* Left Column: Clinical Setup */}
            <div className="space-y-8">
              {/* Status Header */}
              {existingPatient ? (
                <div className="bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center relative z-10 shadow-sm shrink-0">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                    <h5 className="text-[12px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">
                      Pre-Existing Clinic Profile
                    </h5>
                    <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">
                      ID: #{existingPatient.patient_id}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-black/5 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-300 border border-black/5 shadow-inner shrink-0">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h5 className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      New Session Data
                    </h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Standard clinical entry
                    </p>
                  </div>
                </div>
              )}

              {/* Treatment Selection */}
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 px-2">
                  <Layout size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Protocol & Pricing
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {track.pricing?.plans?.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanChange(plan.id)}
                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                          isSelected
                            ? "bg-white dark:bg-white/5 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/10"
                            : "border-slate-100 dark:border-white/5 bg-slate-50/20 hover:bg-white dark:hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${isSelected ? "bg-emerald-500 text-white shadow-sm" : "bg-white dark:bg-white/5 text-slate-300"}`}
                        >
                          <IconComponent name={plan.icon} size={18} />
                        </div>
                        <div className="flex-1 text-left">
                          <h4
                            className={`text-[13px] font-black uppercase tracking-tight ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-500"}`}
                          >
                            {plan.name}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 block opacity-60 uppercase tracking-wider">
                            Clinical Model
                          </span>
                        </div>
                        {isSelected && (
                          <div className="text-emerald-500">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50/30 dark:bg-white/[0.01] p-6 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-inner">
                  <PremiumInput
                    label="Cost Per Day"
                    value={rate}
                    onChange={(e: any) => setRate(e.target.value)}
                    type="number"
                    prefix="₹"
                  />
                  <PremiumInput
                    label="No of days"
                    value={days}
                    onChange={(e: any) => setDays(e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              {/* Schedule Management */}
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 px-2">
                  <Calendar size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Time allocation
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">
                      Effective date
                    </label>
                    <div
                      onClick={() => setOpenDatePicker(true)}
                      className="flex items-center justify-center bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-500 shadow-sm transition-all text-center"
                    >
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                        {format(new Date(startDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-right block">
                      Projected end
                    </label>
                    <div className="flex items-center justify-center bg-slate-100/30 dark:bg-white/5 border border-transparent rounded-xl px-4 py-3 opacity-60 text-center">
                      <span className="text-[13px] font-bold text-slate-400">
                        {endDate
                          ? format(new Date(endDate), "MMM dd, yyyy")
                          : "---"}
                      </span>
                    </div>
                  </div>

                  {track.scheduling?.enabled && (
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Appointment slot
                      </label>
                      <CustomSelect
                        value={selectedSlot}
                        onChange={setSelectedSlot}
                        options={availableSlots}
                        placeholder={
                          isLoadingSlots ? "Syncing..." : "Choose slot"
                        }
                        className="!py-3 !rounded-xl !bg-white dark:!bg-white/5 !border-slate-100 dark:!border-white/10 !text-[13px] !font-bold shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Billing & Accounting */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 px-2">
                  <TrendingDown size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Accounting
                  </h4>
                </div>

                {/* Main Billing Card */}
                <div className="bg-[#121412] p-8 rounded-3xl shadow-lg text-white space-y-8 relative overflow-hidden border border-white/5">
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Gross
                      </span>
                      <div className="text-xl font-black tracking-tight">
                        ₹{billing.subtotal.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                        Waiver
                      </span>
                      <div className="text-xl font-black text-rose-400 tracking-tight">
                        -₹{billing.totalDiscount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Base Rate
                      </span>
                      <div className="text-sm font-bold text-slate-400 line-through">
                        ₹{parseFloat(rate).toLocaleString()}/day
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        Effective Rate
                      </span>
                      <div className="text-sm font-black text-emerald-400">
                        ₹{billing.effectiveRate.toLocaleString()}/day
                      </div>
                    </div>
                  </div>

                  <div className="pt-0 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">
                        Net Payable
                      </span>
                      <div className="text-4xl font-black text-emerald-400 tracking-tighter flex items-center gap-1.5">
                        <span className="text-sm opacity-50 text-white font-medium">
                          ₹
                        </span>
                        {billing.effectiveAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Due Balance
                      </span>
                      <span className="text-xl font-black text-white leading-none">
                        ₹{billing.pendingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${billing.pendingBalance > 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}
                    >
                      {billing.pendingBalance > 0 ? "Pending" : "Settled"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-slate-50/20 dark:bg-white/[0.01] p-6 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-inner">
                  <div className="space-y-4">
                    <PremiumInput
                      label="Discount (₹/Day)"
                      value={discount}
                      onChange={(e: any) => setDiscount(e.target.value)}
                      type="number"
                      prefix="₹"
                      disabled={!track.permissions?.allowDiscount}
                    />

                    {parseFloat(discount) > 0 &&
                      track.permissions?.requireDiscountApproval && (
                        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <CustomSelect
                            value={authorizedBy}
                            onChange={setAuthorizedBy}
                            options={options.employees.map((e: any) => ({
                              label: `${e.first_name} ${e.last_name}`,
                              value: e.employee_id.toString(),
                            }))}
                            label="Clinical Approval"
                            placeholder="Select Lead Clinician"
                          />
                          {options.employees.length === 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-lg">
                              <AlertCircle
                                size={12}
                                className="text-rose-500"
                              />
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                                Lead registry offline
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  <PremiumInput
                    label="Advance (₹)"
                    value={advance}
                    onChange={(e: any) => setAdvance(e.target.value)}
                    type="number"
                    prefix="₹"
                  />
                </div>

                {parseFloat(advance) > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Splits
                      </label>
                      <span
                        className={`text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm ${billing.reconciliationError ? "text-rose-500 bg-rose-50 border border-rose-100" : "text-emerald-500 bg-emerald-50 border border-emerald-100"}`}
                      >
                        ₹{billing.totalDistributed.toLocaleString()} / ₹
                        {billing.numAdvance.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {options.paymentMethods
                        .filter(
                          (m: any) =>
                            !track.permissions?.allowedPaymentMethods ||
                            track.permissions.allowedPaymentMethods.includes(
                              m.method_code,
                            ),
                        )
                        .map((method: any) => {
                          const isSelected =
                            paymentSplits[method.method_code] !== undefined;
                          return (
                            <div
                              key={method.method_code}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 shadow-sm ${isSelected ? "bg-white dark:bg-white/5 border-emerald-500/50" : "border-slate-50 dark:border-white/5 bg-slate-50/10"}`}
                            >
                              <button
                                onClick={() => {
                                  if (isSelected) {
                                    const ns = { ...paymentSplits };
                                    delete ns[method.method_code];
                                    setPaymentSplits(ns);
                                  } else {
                                    setPaymentSplits({
                                      ...paymentSplits,
                                      [method.method_code]: Math.max(
                                        0,
                                        billing.numAdvance -
                                          billing.totalDistributed,
                                      ),
                                    });
                                  }
                                }}
                                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-400 hover:bg-slate-300"}`}
                              >
                                {isSelected && (
                                  <Check size={12} strokeWidth={3} />
                                )}
                              </button>
                              <span className="flex-1 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                                {method.method_name}
                              </span>
                              {isSelected && (
                                <div className="w-48 relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    value={
                                      paymentSplits[method.method_code] || ""
                                    }
                                    onChange={(e) =>
                                      setPaymentSplits({
                                        ...paymentSplits,
                                        [method.method_code]:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full bg-slate-50 dark:bg-black/40 border-none outline-none py-1.5 px-6 text-[11px] font-black text-slate-900 dark:text-white rounded focus:ring-1 ring-emerald-500/20"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 p-5 rounded-2xl flex items-center gap-4 text-rose-600 mb-8 shadow-md mx-2"
            >
              <AlertCircle size={24} />
              <p className="text-[12px] font-bold uppercase tracking-tight leading-relaxed">
                {error}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-md flex items-center justify-end gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[12px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 dark:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {openDatePicker && (
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            onClose={() => setOpenDatePicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DynamicServiceModal;
