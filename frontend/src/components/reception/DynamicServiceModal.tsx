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
  <div className="space-y-2">
    <div className="flex items-center justify-between px-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </label>
    </div>
    <div
      className={`relative flex items-center bg-white dark:bg-white/5 border rounded-[20px] transition-all group ${
        disabled || readOnly
          ? "border-black/5 dark:border-white/5 opacity-60"
          : "border-black/5 dark:border-white/5 focus-within:border-emerald-500/50 shadow-sm hover:border-black/10 dark:hover:border-white/10"
      }`}
    >
      {Icon && (
        <div className="absolute left-4 text-slate-400">
          <Icon size={16} />
        </div>
      )}
      {prefix && (
        <span className="absolute left-4 text-[12px] font-black text-slate-400">
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
        className={`w-full bg-transparent px-5 py-4 text-[13px] font-bold outline-none ${
          Icon || prefix ? "pl-11" : ""
        } ${
          disabled || readOnly
            ? "cursor-not-allowed"
            : "text-slate-900 dark:text-white"
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
    // Cache check
    if (
      dynamicModalOptions &&
      dynamicModalOptions.employees.length > 0 &&
      dynamicModalOptions.paymentMethods.length > 0
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
        paymentMethods:
          dataPayments.status === "success" ? dataPayments.data : [],
        employees:
          dataOptions.status === "success" ? dataOptions.data.employees : [],
      };

      setOptions(newOptions);
      setDynamicModalOptions(newOptions);
    } catch (err) {
      console.error("Failed to fetch options:", err);
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
    const numDiscount = parseFloat(discount.toString()) || 0;
    const numAdvance = parseFloat(advance.toString()) || 0;

    const subtotal = numRate * numDays;
    const discountAmount = (subtotal * numDiscount) / 100;
    const effectiveAmount = subtotal - discountAmount;
    const pendingBalance = effectiveAmount - numAdvance;
    const totalDistributed = Object.values(paymentSplits).reduce(
      (sum, val) => sum + val,
      0,
    );
    const reconciliationError =
      numAdvance > 0 && Math.abs(totalDistributed - numAdvance) > 0.01;
    return {
      subtotal,
      discountAmount,
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
              track.pricing.model === "multi-plan" ? selectedPlanId : "fixed",
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
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="bg-white dark:bg-[#0F110F] w-full max-w-2xl h-full shadow-2xl overflow-hidden flex flex-col relative z-0 border border-black/5 dark:border-white/5 rounded-[40px] pointer-events-auto"
    >
      {/* Header */}
      <div className="shrink-0 p-10 flex items-center justify-between relative z-10 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group"
            style={{ backgroundColor: `${track.themeColor}15` }}
          >
            <div style={{ color: track.themeColor }}>
              <IconComponent name={track.icon} size={28} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#1a1c1e] dark:text-white tracking-tight">
              Convert to {track.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/5">
                {registration.registration_id}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: track.themeColor }}
                />
                {registration.patient_name}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-500 rounded-xl hover:scale-105 active:scale-95 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-10">
          {/* Status Banner */}
          {existingPatient ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-[28px] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h5 className="text-[12px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tighter">
                  Already Registered
                </h5>
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase mt-0.5">
                  ID: {existingPatient.patient_id}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded-[28px] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h5 className="text-[12px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-tighter">
                  Initialization Ready
                </h5>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase mt-0.5">
                  Confirm tracks for {registration.patient_name}
                </p>
              </div>
            </div>
          )}

          {/* 1. Treatment Planning */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Layout size={14} className="text-slate-400" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Treatment Plans
              </h4>
            </div>

            {track.pricing?.plans?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {track.pricing.plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanChange(plan.id)}
                      className={`group relative flex flex-col p-5 rounded-[24px] border transition-all text-left ${
                        isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-500/30"
                          : "border-black/5 dark:border-white/5 hover:border-black/10 bg-transparent"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-all ${
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-100 dark:bg-white/5 text-slate-400"
                        }`}
                      >
                        <IconComponent name={plan.icon} size={16} />
                      </div>
                      <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {plan.name}
                      </h4>
                      {isSelected && (
                        <div className="absolute top-5 right-5 text-indigo-500">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <PremiumInput
                label="Rate / Session"
                value={rate}
                onChange={(e: any) => setRate(e.target.value)}
                type="number"
                prefix="₹"
              />
              <PremiumInput
                label="Duration (Days)"
                value={days}
                onChange={(e: any) => setDays(e.target.value)}
                type="number"
              />
            </div>
          </div>

          {/* 2. Schedule */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Calendar size={14} className="text-slate-400" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Schedule Setup
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                  Start Date
                </label>
                <div
                  onClick={() => setOpenDatePicker(true)}
                  className="relative flex items-center bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[20px] px-4 py-3.5 cursor-pointer hover:border-black/10 shadow-sm transition-all"
                >
                  <span className="text-[12px] font-bold text-slate-900 dark:text-white">
                    {format(new Date(startDate), "MMM dd, yyyy")}
                  </span>
                  <AnimatePresence>
                    {openDatePicker && (
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        onClose={() => setOpenDatePicker(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2 opacity-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                  End Date
                </label>
                <div className="relative flex items-center bg-slate-100 dark:bg-white/5 border border-black/5 rounded-[20px] px-4 py-3.5">
                  <span className="text-[12px] font-bold text-slate-400">
                    {endDate
                      ? format(new Date(endDate), "MMM dd, yyyy")
                      : "N/A"}
                  </span>
                </div>
              </div>

              {track.scheduling?.enabled && (
                <div className="col-span-2">
                  <CustomSelect
                    label="Preferred Time Slot"
                    value={selectedSlot}
                    onChange={setSelectedSlot}
                    options={availableSlots}
                    placeholder={isLoadingSlots ? "Querying..." : "Choose Slot"}
                    className="!py-3.5 !rounded-[20px] !bg-slate-50 dark:!bg-white/5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Finance */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <TrendingDown size={14} className="text-slate-400" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Financial Distribution
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <PremiumInput
                label="Discount %"
                value={discount}
                onChange={(e: any) => setDiscount(e.target.value)}
                type="number"
                disabled={!track.permissions?.allowDiscount}
              />
              <PremiumInput
                label="Advance Paid"
                value={advance}
                onChange={(e: any) => setAdvance(e.target.value)}
                type="number"
                prefix="₹"
              />
            </div>

            {/* Bill Summary Card */}
            <div className="p-6 rounded-[28px] border-2 border-dashed border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between">
              <div>
                <h6 className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">
                  Net Billing
                </h6>
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  ₹{billing.effectiveAmount.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <h6 className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest">
                  Pending
                </h6>
                <span className="text-2xl font-black text-rose-500 tracking-tighter">
                  ₹{billing.pendingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {parseFloat(advance) > 0 && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                  Payment Split
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                        <button
                          key={method.method_code}
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
                                  billing.numAdvance - billing.totalDistributed,
                                ),
                              });
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            isSelected
                              ? "bg-white dark:bg-white/10 border-emerald-500/30 shadow-md"
                              : "border-black/5 dark:border-white/5 bg-transparent"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"}`}
                          >
                            {isSelected ? (
                              <Check size={10} strokeWidth={4} />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {method.method_name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {parseFloat(discount) > 0 &&
              track.permissions?.requireDiscountApproval && (
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Clinical Authorization
                  </label>
                  <CustomSelect
                    label=""
                    value={authorizedBy}
                    onChange={setAuthorizedBy}
                    options={options.employees.map((e: any) => ({
                      value: e.employee_id.toString(),
                      label: `${e.first_name} ${e.last_name}`,
                    }))}
                    placeholder="Select Authorizing Lead"
                    className="!py-3.5 !rounded-[20px] !bg-slate-50 dark:!bg-white/5"
                  />
                </div>
              )}
          </div>

          {error && (
            <div className="bg-rose-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-rose-500/20">
              <AlertCircle size={16} />
              <p className="text-[10px] font-black uppercase tracking-wider">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 p-8 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-3 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          Dismiss
        </button>
        <button
          onClick={handleSave}
          disabled={
            isSaving || billing.reconciliationError || !!existingPatient
          }
          className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
        >
          {isSaving ? "Synchronizing..." : "Complete Setup"}
        </button>
      </div>
    </motion.div>
  );
};

export default DynamicServiceModal;
