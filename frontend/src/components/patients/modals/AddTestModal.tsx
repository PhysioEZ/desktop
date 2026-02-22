import { useState, useEffect } from "react";
import {
  X,
  Check,
  Loader2,
  IndianRupee,
  Calendar,
  Wallet,
  FilePlus,
  Search,
  Activity,
  FlaskConical,
  CreditCard,
  Banknote,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../../../config";
import type { Patient } from "../../../store/usePatientStore";
import CustomSelect from "../../ui/CustomSelect";
import DatePicker from "../../ui/DatePicker";
import { useAuthStore } from "../../../store/useAuthStore";
import { toast } from "sonner";

interface AddTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess: () => void;
}

interface FormOptions {
  referrers: string[];
  paymentMethods: Array<{ method_code: string; method_name: string }>;
  staffMembers: Array<{
    staff_id: number;
    staff_name: string;
    job_title: string;
  }>;
  testTypes: Array<{
    test_type_id: number;
    test_name: string;
    test_code: string;
    default_cost: string | number;
    requires_limb_selection: boolean;
  }>;
  limbTypes: Array<{
    limb_type_id: number;
    limb_name: string;
    limb_code: string;
  }>;
}

const getMethodIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("cash")) return Banknote;
  if (n.includes("card") || n.includes("pos")) return CreditCard;
  return Wallet;
};

const AddTestModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: AddTestModalProps) => {
  const { user } = useAuthStore();
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedTests, setSelectedTests] = useState<
    Record<string, { checked: boolean; amount: string }>
  >({});
  const [otherTestName, setOtherTestName] = useState("");
  const [testLimb, setTestLimb] = useState("");
  const [testDoneBy, setTestDoneBy] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [assignedDate, setAssignedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [totalAmount, setTotalAmount] = useState("0");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<Record<string, number>>(
    {},
  );

  const [openVisitPicker, setOpenVisitPicker] = useState(false);
  const [openAssignedPicker, setOpenAssignedPicker] = useState(false);

  // Fetch Options
  useEffect(() => {
    const fetchOptions = async () => {
      if (!isOpen) return;
      setIsLoadingOptions(true);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/form_options?branch_id=${user?.branch_id}`,
        );
        const data = await res.json();
        if (data.status === "success" || data.success) {
          setFormOptions(data.data);
          // Do not select a payment method by default
        }
      } catch (err) {
        toast.error("Failed to load options");
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [isOpen, user?.branch_id]);

  // Reset Form
  useEffect(() => {
    if (isOpen && patient) {
      setSelectedTests({});
      setOtherTestName("");
      setTestLimb("");
      setTestDoneBy("");
      setReferredBy(patient.reffered_by || (patient as any).referred_by || "");
      setVisitDate(new Date().toISOString().split("T")[0]);
      setAssignedDate(new Date().toISOString().split("T")[0]);
      setTotalAmount("0");
      setAdvanceAmount("");
      setDiscountAmount("");
      setDueAmount("");
      setPrimaryPaymentMethod("");
      setShowPaymentDetails(false);
      setPaymentSplits({});
    }
  }, [isOpen, patient, formOptions]);

  // Sync back from splits to total paid
  useEffect(() => {
    if (showPaymentDetails) {
      const splitTotal = Object.values(paymentSplits).reduce(
        (a, b) => a + (b || 0),
        0,
      );
      // Update advance amount string, but we don't set hasManualPaidEntry here
      // as it's a programmatic sync in split mode
      setAdvanceAmount(splitTotal > 0 ? splitTotal.toString() : "");
    }
  }, [paymentSplits, showPaymentDetails]);

  // Calculations
  useEffect(() => {
    let total = 0;
    Object.values(selectedTests).forEach((data) => {
      if (data.checked) total += parseFloat(data.amount) || 0;
    });
    setTotalAmount(total.toFixed(2));
  }, [selectedTests]);

  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advanceAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const diff = total - advance - discount;
    setDueAmount(diff === 0 ? "" : diff.toFixed(0));

    // If not in split mode, keep splits in sync with advance
    if (!showPaymentDetails && primaryPaymentMethod) {
      setPaymentSplits({ [primaryPaymentMethod]: advance });
    }
  }, [
    totalAmount,
    advanceAmount,
    discountAmount,
    showPaymentDetails,
    primaryPaymentMethod,
  ]);

  const handleTestCheckChange = (testCode: string, checked: boolean) => {
    const test = formOptions?.testTypes.find((t) => t.test_code === testCode);
    setSelectedTests((prev) => ({
      ...prev,
      [testCode]: {
        checked,
        amount: prev[testCode]?.amount || test?.default_cost?.toString() || "0",
      },
    }));
  };

  const toggleSplitMethod = (methodCode: string) => {
    setPaymentSplits((prev) => {
      const next = { ...prev };
      if (next[methodCode] !== undefined) {
        // If we remove a method, add its value back to the primary method to keep total constant
        if (
          methodCode !== primaryPaymentMethod &&
          next[primaryPaymentMethod] !== undefined
        ) {
          next[primaryPaymentMethod] += next[methodCode] || 0;
        }
        delete next[methodCode];
      } else {
        next[methodCode] = 0;
      }
      return next;
    });
  };

  const updateSplitAmount = (methodCode: string, amount: number) => {
    setPaymentSplits((prev) => {
      const next = { ...prev };
      const oldVal = next[methodCode] || 0;
      const diff = amount - oldVal;

      next[methodCode] = amount;

      // Auto-balance logic: if editing a secondary method, take/add from primary
      if (
        methodCode !== primaryPaymentMethod &&
        next[primaryPaymentMethod] !== undefined
      ) {
        next[primaryPaymentMethod] = Math.max(
          0,
          (next[primaryPaymentMethod] || 0) - diff,
        );
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEntries = Object.entries(selectedTests).filter(
      ([_, data]) => data.checked,
    );
    if (selectedEntries.length === 0) {
      toast.error("Choose at least one test");
      return;
    }

    if (!testDoneBy) {
      toast.error("Choose who performed the test");
      return;
    }

    // Validate splits if shown
    if (showPaymentDetails) {
      const splitTotal = Object.values(paymentSplits).reduce(
        (a, b) => a + b,
        0,
      );
      if (Math.abs(splitTotal - (parseFloat(advanceAmount) || 0)) > 0.01) {
        toast.error(
          `Split amounts (₹${splitTotal}) must match total paid (₹${advanceAmount || 0})`,
        );
        return;
      }
    } else {
      if ((parseFloat(advanceAmount) || 0) > 0 && !primaryPaymentMethod) {
        toast.error("Please select a payment method for the paid amount");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const testNames = selectedEntries.map(([code]) => {
        const test = formOptions?.testTypes.find((t) => t.test_code === code);
        return test?.test_name || code;
      });

      const testAmounts: Record<string, string> = {};
      selectedEntries.forEach(([code, data]) => {
        const test = formOptions?.testTypes.find((t) => t.test_code === code);
        testAmounts[test?.test_name || code] = data.amount;
      });

      const payload = {
        patient_id: patient?.patient_id,
        referred_by: referredBy,
        limb: testLimb,
        visit_date: visitDate,
        assigned_test_date: assignedDate,
        test_done_by: testDoneBy,
        test_names: testNames,
        test_amounts: testAmounts,
        other_test_name: otherTestName,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        discount: discountAmount,
        payment_method: showPaymentDetails ? "split" : primaryPaymentMethod,
        payment_amounts: paymentSplits,
        branch_id: user?.branch_id,
        employee_id: user?.employee_id,
      };

      const res = await authFetch(`${API_BASE_URL}/reception/test_submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.status === "success") {
        toast.success("Test added successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to save record");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !patient) return null;

  const labelClass =
    "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1";
  const inputClass =
    "w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 focus:border-emerald-500/40 dark:focus:border-emerald-500/20 rounded-[24px] outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600";

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
            className="relative w-full max-w-[1400px] h-[90vh] bg-white dark:bg-[#0c0d0f] rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col"
          >
            {/* Liquid Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50" />

            {/* Header */}
            <div className="px-10 py-8 flex justify-between items-center bg-white/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-[24px] bg-emerald-500/10 text-emerald-500 shadow-inner">
                  <FilePlus size={28} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Add Test
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Register New Test
                    </p>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                      {patient.patient_name} (ID: {patient.patient_uid})
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-[20px] bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/5"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar space-y-10">
                <div className="grid grid-cols-12 gap-8">
                  {/* Left: Diagnostics Selection */}
                  <div className="col-span-5 space-y-6">
                    <div className="flex justify-between items-end px-2">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-3">
                          <FlaskConical
                            size={12}
                            strokeWidth={2.5}
                            className="text-emerald-500"
                          />
                          Diagnostics
                        </h4>
                      </div>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        Pick Required Tests
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {isLoadingOptions ? (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
                          <Loader2
                            className="animate-spin text-emerald-500"
                            size={32}
                          />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Loading...
                          </p>
                        </div>
                      ) : (
                        formOptions?.testTypes.map((test) => {
                          const isSelected =
                            selectedTests[test.test_code]?.checked;
                          return (
                            <button
                              key={test.test_code}
                              type="button"
                              onClick={() =>
                                handleTestCheckChange(
                                  test.test_code,
                                  !isSelected,
                                )
                              }
                              className={`group relative px-3 py-2.5 rounded-xl border transition-all duration-300 flex flex-col gap-1.5 text-left ${
                                isSelected
                                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                                  : "bg-white dark:bg-white/[0.01] border-slate-100 dark:border-white/5 hover:border-emerald-500/20"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-50 dark:bg-white/5 text-slate-400"}`}
                                >
                                  <FlaskConical size={12} />
                                </div>
                                {isSelected && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white scale-110 shadow-lg shadow-emerald-500/20">
                                    <Check size={8} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-xs font-black transition-colors leading-tight ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}
                                >
                                  {test.test_name}
                                </p>
                                <p className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                  ₹
                                  {parseFloat(
                                    String(test.default_cost),
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: General Info */}
                  <div className="col-span-7 h-full">
                    <div className="h-full p-6 rounded-[24px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-6 flex flex-col">
                      <div className="flex items-center gap-4 px-2">
                        <Activity
                          className="text-emerald-500"
                          size={16}
                          strokeWidth={2.5}
                        />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                          General Info
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Doctor</label>
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                            />
                            <input
                              list="test_referrers"
                              value={referredBy}
                              onChange={(e) => setReferredBy(e.target.value)}
                              className={`${inputClass} pl-14`}
                              placeholder="Doctor Name"
                            />
                            <datalist id="test_referrers">
                              {formOptions?.referrers.map((r) => (
                                <option key={r} value={r} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <CustomSelect
                          label="Done By"
                          value={testDoneBy}
                          onChange={setTestDoneBy}
                          options={
                            formOptions?.staffMembers.map((s) => ({
                              label: s.staff_name,
                              value: s.staff_name,
                            })) || []
                          }
                          placeholder="Select Staff"
                        />

                        <div className="col-span-2 space-y-4">
                          <label className={labelClass}>Date Details</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setOpenVisitPicker(true)}
                              className={`${inputClass} !py-3 flex items-center justify-between group`}
                            >
                              <span
                                className={
                                  visitDate
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-300"
                                }
                              >
                                {visitDate
                                  ? new Date(visitDate).toLocaleDateString(
                                      "en-IN",
                                      { day: "2-digit", month: "short" },
                                    )
                                  : "Visit"}
                              </span>
                              <Calendar
                                size={14}
                                className="text-slate-300 group-hover:text-emerald-500 transition-colors"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenAssignedPicker(true)}
                              className={`${inputClass} !py-3 flex items-center justify-between group`}
                            >
                              <span
                                className={
                                  assignedDate
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-300"
                                }
                              >
                                {assignedDate
                                  ? new Date(assignedDate).toLocaleDateString(
                                      "en-IN",
                                      { day: "2-digit", month: "short" },
                                    )
                                  : "Execution"}
                              </span>
                              <Calendar
                                size={14}
                                className="text-slate-300 group-hover:text-emerald-500 transition-colors"
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {openVisitPicker && (
                              <DatePicker
                                value={visitDate}
                                onChange={setVisitDate}
                                onClose={() => setOpenVisitPicker(false)}
                              />
                            )}
                            {openAssignedPicker && (
                              <DatePicker
                                value={assignedDate}
                                onChange={setAssignedDate}
                                onClose={() => setOpenAssignedPicker(false)}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settlement & Billing Section */}
                <div className="w-full">
                  <div className="p-6 rounded-[32px] bg-[#121417] text-white shadow-xl relative overflow-hidden group border border-white/5">
                    {/* Background decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                            <Wallet size={16} strokeWidth={2.5} />
                          </div>
                          <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">
                            Billing Overview
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const next = !showPaymentDetails;
                            setShowPaymentDetails(next);
                            if (next && primaryPaymentMethod) {
                              setPaymentSplits({
                                [primaryPaymentMethod]:
                                  parseFloat(advanceAmount) || 0,
                              });
                            }
                          }}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-3 ${
                            showPaymentDetails
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                          }`}
                        >
                          {showPaymentDetails
                            ? "Split Payment"
                            : "Single Method"}
                          {showPaymentDetails ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-8 p-6 bg-white/[0.02] rounded-[24px] border border-white/[0.05]">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block">
                            Total
                          </p>
                          <span className="text-2xl font-black tracking-tighter text-white">
                            ₹{parseFloat(totalAmount).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest block px-1">
                            Paid Amount
                          </label>
                          <div className="relative">
                            <IndianRupee
                              size={12}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                            />
                            <input
                              type="number"
                              value={advanceAmount}
                              onChange={(e) => {
                                setAdvanceAmount(e.target.value);
                              }}
                              readOnly={showPaymentDetails}
                              className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-[16px] outline-none focus:border-emerald-500/40 transition-all text-lg font-black text-white ${showPaymentDetails ? "opacity-50 cursor-not-allowed" : ""}`}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest block px-1">
                            Discount
                          </label>
                          <div className="relative">
                            <IndianRupee
                              size={12}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                            />
                            <input
                              type="number"
                              value={discountAmount}
                              onChange={(e) =>
                                setDiscountAmount(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-[16px] outline-none focus:border-emerald-500/40 transition-all text-lg font-black text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-center">
                          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">
                            Dues
                          </span>
                          <span
                            className={`text-2xl font-black ${parseFloat(dueAmount) > 0 ? "text-rose-400" : "text-emerald-400"}`}
                          >
                            ₹{(parseFloat(dueAmount) || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="w-full">
                        {!showPaymentDetails ? (
                          <div className="space-y-3">
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] px-1">
                              Payment Method
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {formOptions?.paymentMethods.map((m) => {
                                const Icon = getMethodIcon(m.method_name);
                                const isSelected =
                                  primaryPaymentMethod === m.method_code;
                                return (
                                  <button
                                    key={m.method_code}
                                    type="button"
                                    onClick={() =>
                                      setPrimaryPaymentMethod(
                                        m.method_code === primaryPaymentMethod
                                          ? ""
                                          : m.method_code,
                                      )
                                    }
                                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border transition-all ${
                                      isSelected
                                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/10"
                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <Icon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                      {m.method_name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] px-1">
                              Distribution
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {formOptions?.paymentMethods.map((m) => {
                                const isChecked =
                                  paymentSplits[m.method_code] !== undefined;
                                return (
                                  <div
                                    key={m.method_code}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isChecked ? "bg-white/10 border-emerald-500/20" : "bg-white/5 border-white/5 opacity-40"}`}
                                  >
                                    <div
                                      onClick={() =>
                                        toggleSplitMethod(m.method_code)
                                      }
                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10"}`}
                                    >
                                      {isChecked && (
                                        <Check size={10} strokeWidth={4} />
                                      )}
                                    </div>
                                    <span className="flex-1 text-[10px] font-black uppercase tracking-wider opacity-60">
                                      {m.method_name}
                                    </span>
                                    {isChecked && (
                                      <input
                                        type="number"
                                        value={
                                          paymentSplits[m.method_code] === 0
                                            ? ""
                                            : paymentSplits[m.method_code] || ""
                                        }
                                        onChange={(e) =>
                                          updateSplitAmount(
                                            m.method_code,
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="w-48 bg-emerald-500/5 border-none rounded-lg px-3 py-1.5 text-xs font-black text-right outline-none text-emerald-400"
                                        placeholder="0"
                                        autoFocus
                                      />
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
                </div>
              </div>

              {/* Footer Bar */}
              <div className="px-10 py-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 opacity-40">
                  <History size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Audit logging active
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl shadow-emerald-500/10 flex items-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isSubmitting ? (
                    <Loader2
                      className="animate-spin"
                      size={16}
                      strokeWidth={3}
                    />
                  ) : (
                    <ShieldCheck size={16} strokeWidth={3} />
                  )}
                  <span>Save & Print Invoice</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTestModal;
