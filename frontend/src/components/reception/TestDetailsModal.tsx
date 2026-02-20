import { useState, useEffect } from "react";
import {
  X,
  Printer,
  User,
  Phone,
  Users,
  Info,
  AlertCircle,
  FlaskConical,
  Activity,
  Wallet,
  CreditCard,
  TrendingDown,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../../config";
import { toast } from "sonner";

interface TestRecord {
  uid: string;
  patient_name: string;
  test_name: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  test_status: string;
  test_uid: string;
}

interface TestItem {
  item_id: number;
  test_id: number;
  test_name: string;
  test_status: string;
  payment_status: string;
  total_amount: number;
  advance_amount: number;
  discount: number;
  due_amount: number;
  limb?: string | null;
  referred_by?: string | null;
  test_done_by?: string | null;
  assigned_test_date?: string | null;
}

interface FullTestDetails {
  test_id: number;
  test_uid: string;
  visit_date: string;
  assigned_test_date: string;
  patient_name: string;
  phone_number: string;
  gender: string;
  age: string;
  dob?: string | null;
  parents?: string | null;
  relation?: string | null;
  alternate_phone_no?: string | null;
  address?: string | null;
  limb?: string | null;
  test_name: string;
  referred_by?: string | null;
  test_done_by?: string | null;
  total_amount: number;
  advance_amount: number;
  discount: number;
  due_amount: number;
  payment_method: string;
  payment_status: string;
  test_status: string;
  test_items: TestItem[];
}

interface TestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestRecord | null;
  onPrint?: (test: TestRecord) => void;
}

const TestDetailsModal = ({
  isOpen,
  onClose,
  test,
  onPrint,
}: TestDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [fullDetails, setFullDetails] = useState<FullTestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FullTestDetails>>({});

  useEffect(() => {
    if (isOpen && test?.uid) {
      fetchDetails();
    } else if (!isOpen) {
      setFullDetails(null);
      setIsEditing(false);
    }
  }, [isOpen, test]);

  const fetchDetails = async () => {
    if (!test?.uid) return;
    setIsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?action=fetch_details&test_id=${test.uid}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "fetch_details", test_id: test.uid }),
        },
      );
      const res = await response.json();
      if (res.success) {
        setFullDetails(res.data);
      } else {
        toast.error(res.message || "Failed to fetch details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    itemId: number | null,
    newStatus: string,
    type: "test" | "payment",
  ) => {
    if (!fullDetails) return;
    const toastId = toast.loading(`Updating ${type} status...`);
    try {
      const body: any = {
        action: type === "test" ? "update_item" : "update_item", // The backend handler handles both
        item_id: itemId,
        test_id: fullDetails.test_id,
      };

      if (type === "test") body.test_status = newStatus;
      else body.payment_status = newStatus;

      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({ ...body, action: "update_item" }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} updated`,
          {
            id: toastId,
          },
        );
        fetchDetails();
      } else {
        toast.error(res.message || "Update failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  const handleAddPayment = async (itemId: number | null, amount: number) => {
    if (!fullDetails) return;
    if (amount <= 0) return toast.error("Enter a valid amount");

    const toastId = toast.loading("Recording payment...");
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({
          action: "add_payment",
          test_id: fullDetails.test_id,
          item_id: itemId,
          amount,
          method: "cash",
        }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Payment recorded", { id: toastId });
        fetchDetails();
      } else {
        toast.error(res.message || "Payment failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  const handleSaveMetadata = async () => {
    if (!fullDetails) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving changes...");
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({
          action: "update_metadata",
          test_id: fullDetails.test_id,
          ...editedData,
        }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Changes saved", { id: toastId });
        setIsEditing(false);
        setEditedData({});
        fetchDetails();
      } else {
        toast.error(res.message || "Save failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!test) return null;

  const data =
    fullDetails ||
    ({
      patient_name: test?.patient_name || "Unknown",
      test_uid: test?.test_uid || "UNKNOWN-UID",
      phone_number: test?.uid || "N/A", // dummy
      age: "N/A",
      gender: "N/A",
      referred_by: "N/A",
      due_amount: test?.due_amount || 0,
      total_amount: test?.total_amount || 0,
      advance_amount: test?.paid_amount || 0,
      discount: 0,
      test_items: [],
    } as any);

  const walletBalance =
    parseFloat(String(data.advance_amount || 0)) -
    parseFloat(String(data.total_amount || 0)) +
    parseFloat(String(data.discount || 0));

  const patientData = {
    age:
      fullDetails?.age || (test?.uid ? String(test.uid).split("-")[0] : "N/A"), // Just a fallback
    gender: fullDetails?.gender || "N/A",
    phone: fullDetails?.phone_number || "N/A",
    address: fullDetails?.address || "N/A",
    dob: fullDetails?.dob || "N/A",
    guardian: fullDetails?.parents || "N/A",
    relation: fullDetails?.relation || "N/A",
  };

  const TabButton = ({
    icon: Icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-l-4 group ${
        active
          ? "bg-white/5 border-emerald-400 text-white"
          : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
      }`}
    >
      <Icon
        className={`w-5 h-5 transition-colors ${
          active
            ? "text-emerald-400"
            : "text-slate-500 group-hover:text-slate-300"
        }`}
      />
      <span className="font-bold tracking-wide text-sm">{label}</span>
      {active && (
        <motion.div
          layoutId="tabconfig"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
        />
      )}
    </button>
  );

  const DetailField = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value?: string | null;
    icon: React.ElementType;
  }) => (
    <div className="group">
      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
        <Icon size={14} strokeWidth={2} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pl-0.5">
        {value || "—"}
      </div>
    </div>
  );

  const StatCard = ({
    label,
    value,
    subtext,
    icon: Icon,
    color = "emerald",
  }: {
    label: string;
    value: string;
    subtext?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    color?: "emerald" | "rose" | "blue" | "amber" | "indigo" | "cyan";
  }) => {
    const colorClasses = {
      emerald: "bg-emerald-500/10 text-emerald-600",
      rose: "bg-rose-500/10 text-rose-600",
      blue: "bg-blue-500/10 text-blue-600",
      amber: "bg-amber-500/10 text-amber-600",
      indigo: "bg-indigo-500/10 text-indigo-600",
      cyan: "bg-cyan-500/10 text-cyan-600",
    };

    return (
      <div className="flex items-start gap-4 p-2 transition-all hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl cursor-default">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.emerald}`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            {label}
          </p>
          <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
            {value}
          </h4>
          {subtext && (
            <p
              className={`text-[10px] font-bold mt-1 ${color === "rose" ? "text-rose-500" : "text-emerald-500"}`}
            >
              {subtext}
            </p>
          )}
        </div>
      </div>
    );
  };

  const QuickAction = ({
    icon: Icon,
    label,
    onClick,
    variant = "default",
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    variant?: "default" | "primary" | "danger";
  }) => {
    const styles = {
      default:
        "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:bg-white/10",
      primary:
        "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg",
      danger:
        "bg-white dark:bg-white/5 text-rose-500 border-slate-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10",
    };

    return (
      <button
        onClick={onClick}
        className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${styles[variant]}`}
      >
        <Icon size={14} strokeWidth={2.5} />
        <span>{label}</span>
      </button>
    );
  };

  const SectionHeader = ({
    title,
    icon: Icon,
  }: {
    title: string;
    icon: React.ElementType;
  }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
        {title}
      </h3>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{
              x: "100%",
              opacity: 0,
              transition: { duration: 0.3, ease: "anticipate" },
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:w-[95%] md:w-[85%] lg:w-[75%] max-w-7xl h-[100dvh] sm:h-[95vh] sm:mr-4 sm:rounded-3xl bg-[#f8fafc] dark:bg-[#0b1120] shadow-2xl flex flex-col overflow-hidden border border-black/5 dark:border-white/5"
          >
            {/* Header Area */}
            <div className="px-8 py-6 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0b1120] z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <FlaskConical size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {test.test_name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      ID: {test.test_uid}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 block" />
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        test.test_status === "Completed"
                          ? "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : test.test_status === "Pending"
                            ? "bg-amber-100/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : "bg-rose-100/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                      }`}
                    >
                      {test.test_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <QuickAction
                  icon={Printer}
                  label="Print Bill"
                  onClick={() => test && onPrint?.(test)}
                  variant="primary"
                />
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                >
                  <X size={20} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Split Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar - Navigation & Summary */}
              <div className="w-64 lg:w-80 border-r border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a] hidden md:flex flex-col z-10">
                {/* Patient Mini Profile */}
                <div className="p-6 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-inner ring-4 ring-indigo-500/20 shrink-0">
                      {patientData.gender.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1 truncate">
                        {patientData.gender}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        Referred By: {patientData.guardian}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-white dark:bg-white/[0.02] rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Age/Gender
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                        {patientData.age} • {patientData.gender}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-white/[0.02] rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Contact
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                        {patientData.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 py-4 flex flex-col gap-1">
                  <TabButton
                    icon={Activity}
                    label="Overview"
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                  />
                  <TabButton
                    icon={FlaskConical}
                    label="Test Items"
                    active={activeTab === "test_items"}
                    onClick={() => setActiveTab("test_items")}
                  />
                  <TabButton
                    icon={CreditCard}
                    label="Financials"
                    active={activeTab === "financials"}
                    onClick={() => setActiveTab("financials")}
                  />
                </div>
              </div>

              {/* Main Scrolling Content Area */}
              <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1120] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent relative">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Accessing Records...
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 lg:p-10 space-y-8"
                      >
                        {/* Panel 1: Financials */}
                        <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                          <div className="flex items-center gap-2 mb-6 opacity-50">
                            <Wallet size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">
                              Financial Overview
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCard
                              label="Total Amount"
                              value={`₹${parseFloat(String(data.total_amount || 0)).toLocaleString()}`}
                              icon={Activity}
                              color="blue"
                            />
                            <StatCard
                              label="Total Paid"
                              value={`₹${parseFloat(String(data.advance_amount || 0)).toLocaleString()}`}
                              icon={Wallet}
                              color="emerald"
                            />
                            <StatCard
                              label="Effective Balance"
                              value={`₹${walletBalance.toLocaleString()}`}
                              icon={TrendingDown}
                              color={walletBalance < 0 ? "rose" : "emerald"}
                              subtext={
                                walletBalance < 0
                                  ? "Outstanding Dues"
                                  : "Available Credit"
                              }
                            />
                            <StatCard
                              label="Current Due"
                              value={`₹${parseFloat(String(data.due_amount || 0)).toLocaleString()}`}
                              icon={AlertCircle}
                              color={data.due_amount > 0 ? "rose" : "emerald"}
                              subtext={
                                data.due_amount > 0
                                  ? "Payment Required"
                                  : "All Clear"
                              }
                            />
                          </div>
                        </div>

                        {/* Quick Identification */}
                        <div className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <SectionHeader
                              title="Quick Identification"
                              icon={User}
                            />
                            <button
                              onClick={() => setIsEditing(!isEditing)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                            >
                              <Edit size={14} />
                              {isEditing ? "Viewing" : "Edit Details"}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {isEditing ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                                    value={
                                      editedData.patient_name ??
                                      data.patient_name
                                    }
                                    onChange={(e) =>
                                      setEditedData((prev) => ({
                                        ...prev,
                                        patient_name: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    Phone
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                                    value={
                                      editedData.phone_number ??
                                      data.phone_number
                                    }
                                    onChange={(e) =>
                                      setEditedData((prev) => ({
                                        ...prev,
                                        phone_number: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    Age
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                                    value={editedData.age ?? data.age}
                                    onChange={(e) =>
                                      setEditedData((prev) => ({
                                        ...prev,
                                        age: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    Referred By
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                                    value={
                                      editedData.referred_by ?? data.referred_by
                                    }
                                    onChange={(e) =>
                                      setEditedData((prev) => ({
                                        ...prev,
                                        referred_by: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <DetailField
                                  label="Full Name"
                                  value={data.patient_name}
                                  icon={User}
                                />
                                <DetailField
                                  label="Contact"
                                  value={data.phone_number || data.phone}
                                  icon={Phone}
                                />
                                <DetailField
                                  label="Age / Gender"
                                  value={`${data.age} • ${data.gender}`}
                                  icon={Info}
                                />
                                <DetailField
                                  label="Referred By"
                                  value={data.referred_by}
                                  icon={Users}
                                />
                              </>
                            )}
                          </div>
                          {isEditing && (
                            <div className="mt-8 flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditedData({});
                                }}
                                className="px-6 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveMetadata}
                                disabled={isSaving}
                                className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase shadow-lg shadow-emerald-500/20"
                              >
                                {isSaving ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {activeTab === "test_items" && (
                      <motion.div
                        key="test_items"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 lg:p-10 space-y-6"
                      >
                        <SectionHeader
                          title="Recorded Test Items"
                          icon={FlaskConical}
                        />

                        <div className="grid grid-cols-1 gap-4">
                          {data.test_items?.length > 0 ? (
                            data.test_items.map((item: TestItem) => (
                              <div
                                key={item.item_id}
                                className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <FlaskConical size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                      {item.test_name}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Amount: ₹
                                        {parseFloat(
                                          String(item.total_amount),
                                        ).toLocaleString()}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-slate-300 block" />
                                      <span
                                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                          item.test_status === "completed"
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-amber-100 text-amber-600"
                                        }`}
                                      >
                                        {item.test_status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 flex-wrap">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      Update Status
                                    </span>
                                    <select
                                      className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold"
                                      value={item.test_status}
                                      onChange={(e) =>
                                        handleUpdateStatus(
                                          item.item_id,
                                          e.target.value,
                                          "test",
                                        )
                                      }
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="in-progress">
                                        In Progress
                                      </option>
                                      <option value="completed">
                                        Completed
                                      </option>
                                      <option value="cancelled">
                                        Cancelled
                                      </option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      Payment
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs font-black uppercase ${item.payment_status === "paid" ? "text-emerald-500" : "text-rose-500"}`}
                                      >
                                        {item.payment_status}
                                      </span>
                                      {item.payment_status !== "paid" && (
                                        <button
                                          onClick={() => {
                                            const amt = prompt(
                                              `Enter payment amount for ${item.test_name} (Max: ₹${item.due_amount})`,
                                            );
                                            if (amt)
                                              handleAddPayment(
                                                item.item_id,
                                                parseFloat(amt),
                                              );
                                          }}
                                          className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                        >
                                          <Wallet size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center text-slate-400">
                              <FlaskConical
                                size={32}
                                className="mx-auto mb-4 opacity-20"
                              />
                              <p className="text-sm font-bold uppercase tracking-widest">
                                No detailed items found
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "financials" && (
                      <motion.div
                        key="financials"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 lg:p-10 space-y-8"
                      >
                        <SectionHeader
                          title="Financial Summary"
                          icon={CreditCard}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                              Split Details
                            </h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                <span className="text-sm font-semibold text-slate-500">
                                  Gross Total
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                  ₹
                                  {parseFloat(
                                    String(data.total_amount),
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                <span className="text-sm font-semibold text-slate-500">
                                  Advance Paid
                                </span>
                                <span className="text-sm font-black text-emerald-500">
                                  ₹
                                  {parseFloat(
                                    String(data.advance_amount),
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                <span className="text-sm font-semibold text-slate-500">
                                  Discount Applied
                                </span>
                                <span className="text-sm font-black text-indigo-500">
                                  ₹
                                  {parseFloat(
                                    String(data.discount || 0),
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-4">
                                <span className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">
                                  Balance Due
                                </span>
                                <span
                                  className={`text-xl font-black ${data.due_amount > 0 ? "text-rose-500" : "text-emerald-500"}`}
                                >
                                  ₹
                                  {parseFloat(
                                    String(data.due_amount),
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0f172a] rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                            <div>
                              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <CreditCard
                                  size={24}
                                  className="text-emerald-400"
                                />
                              </div>
                              <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                                Quick Payment
                              </h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Record a direct payment against this test order.
                                This will be automatically distributed across
                                pending items.
                              </p>
                            </div>

                            <div className="mt-8 space-y-4">
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500">
                                  ₹
                                </span>
                                <input
                                  id="quick-pay-input"
                                  type="number"
                                  placeholder="0.00"
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-8 pr-4 py-4 text-xl font-black outline-none focus:border-emerald-500/50 transition-all"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const input = document.getElementById(
                                    "quick-pay-input",
                                  ) as HTMLInputElement;
                                  const val = parseFloat(input.value);
                                  if (val > 0) handleAddPayment(null, val);
                                }}
                                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                              >
                                Record Payment
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TestDetailsModal;
