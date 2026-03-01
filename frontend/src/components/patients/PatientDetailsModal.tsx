import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  User,
  Power,
  FilePlus,
  Edit,
  CreditCard,
  Calendar,
  Phone,
  AlertCircle,
  Wallet,
  Stethoscope,
  Activity,
  MapPin,
  Mail,
  Briefcase,
  Archive,
  Layout,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  History,
  Clock,
  Hash,
  FlaskConical,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { usePatientStore } from "../../store/usePatientStore";
import { formatDateSafe as format, parseDateSafe } from "../../utils/dateUtils";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../../config";
import PayDuesModal from "./modals/PayDuesModal";
import AddTestModal from "./modals/AddTestModal";
import EditPlanModal from "./modals/EditPlanModal";
import ChangePlanModal from "./modals/ChangePlanModal";
import StatusChangeModal from "./modals/StatusChangeModal";
import { toast } from "sonner";
import { printPatientStatement } from "../../utils/printToken";

const getPhotoUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace("admin/desktop/server/", "");
  return `${FILE_BASE_URL}/${cleanPath}`;
};

// --- COMPONENTS ---

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

const PatientDetailsModal = () => {
  const {
    selectedPatient,
    isDetailsModalOpen,
    closePatientDetails,
    patientDetails,
    isLoadingDetails,
    fetchPatientDetails,
    fetchPatients,
  } = usePatientStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [modals, setModals] = useState({
    payDues: false,
    addTest: false,
    editPlan: false,
    changePlan: false,
    statusChange: false,
  });

  const toggleModal = (key: keyof typeof modals, state: boolean) =>
    setModals((prev) => ({ ...prev, [key]: state }));

  const handleRefresh = () => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.patient_id);
      if (selectedPatient.branch_id) {
        fetchPatients(selectedPatient.branch_id, true);
      }
    }
  };

  const handlePrintBill = async () => {
    if (!selectedPatient?.patient_id) return;
    const toastId = toast.loading("Processing clinical statement...");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/tokens?action=get_data&patient_id=${selectedPatient.patient_id}`,
      );
      const json = await res.json();
      if (json.success || json.status === "success") {
        printPatientStatement(json.data);
        toast.success("Statement ready", { id: toastId });
      } else {
        toast.error(json.message || "Export failed", { id: toastId });
      }
    } catch {
      toast.error("System error", { id: toastId });
    }
  };

  const data = { ...selectedPatient, ...patientDetails };
  const dueAmount = parseFloat(String(data.due_amount || "0"));
  const walletBalance = parseFloat(String(data.effective_balance || "0"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patientData = data as any;

  if (!isDetailsModalOpen || !selectedPatient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 text-slate-800 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePatientDetails}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-[90rem] h-[90vh] bg-white dark:bg-[#0c0d0f] rounded-[32px] shadow-2xl flex overflow-hidden ring-1 ring-white/10"
        >
          {/* --- LEFT SIDEBAR (DARK) --- */}
          <div className="w-[340px] shrink-0 bg-[#0f1115] text-slate-300 flex flex-col border-r border-white/5 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Profile */}
            <div className="p-8 pb-4 relative z-10 text-center">
              <div className="w-32 h-32 mx-auto rounded-[32px] p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl mb-6 relative group">
                <div className="w-full h-full rounded-[26px] overflow-hidden bg-slate-800 relative">
                  {getPhotoUrl(data.patient_photo_path) ? (
                    <img
                      src={getPhotoUrl(data.patient_photo_path) || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                      <User size={48} strokeWidth={1} />
                    </div>
                  )}
                  <div
                    className={`absolute bottom-0 inset-x-0 h-1.5 ${data.patient_status === "active" ? "bg-emerald-500" : "bg-slate-500"}`}
                  />
                </div>
                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                      data.patient_status === "active"
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}
                  >
                    {data.patient_status}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                {data.patient_name}
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono mb-6">
                {data.patient_uid}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-0 space-y-2 pb-6">
              <TabButton
                icon={Layout}
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <TabButton
                icon={User}
                label="Profile Details"
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              />
              <TabButton
                icon={Stethoscope}
                label="Treatment Plan"
                active={activeTab === "treatment"}
                onClick={() => setActiveTab("treatment")}
              />
              <TabButton
                icon={CreditCard}
                label="Financials"
                active={activeTab === "financials"}
                onClick={() => setActiveTab("financials")}
              />
              <TabButton
                icon={Calendar}
                label="Attendance Log"
                active={activeTab === "attendance"}
                onClick={() => setActiveTab("attendance")}
              />
              <TabButton
                icon={Activity}
                label="Clinical Notes"
                active={activeTab === "clinical"}
                onClick={() => setActiveTab("clinical")}
              />
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/5 bg-[#0a0b0e] flex flex-col gap-3">
              {dueAmount > 0 && (
                <button
                  onClick={() => toggleModal("payDues", true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Pay Total: ₹
                  {(
                    dueAmount +
                    (walletBalance < 0 ? Math.abs(walletBalance) : 0)
                  ).toLocaleString()}
                </button>
              )}
              <button
                onClick={() => toggleModal("addTest", true)}
                className="w-full py-4 rounded-xl bg-white/5 text-emerald-400 border border-emerald-500/20 font-black uppercase text-xs tracking-widest hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
              >
                <FilePlus size={16} />
                Add Test
              </button>
            </div>
          </div>

          {/* --- MAIN CONTENT (LIGHT) --- */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0c0d0f] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-6 bg-white/80 dark:bg-[#0c0d0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-20 sticky top-0">
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  Patient Profile
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-sm font-medium text-slate-500 font-mono">
                    #{data.patient_id}
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <QuickAction
                  icon={Printer}
                  label="Print"
                  onClick={handlePrintBill}
                />
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingDetails}
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center justify-center border border-emerald-500/10"
                  title="Refresh Data"
                >
                  <RefreshCw
                    size={18}
                    className={isLoadingDetails ? "animate-spin" : ""}
                  />
                </button>
                <QuickAction
                  icon={CreditCard}
                  label="Change Plan"
                  onClick={() => toggleModal("changePlan", true)}
                />
                <QuickAction
                  icon={Edit}
                  label="Modify"
                  onClick={() => toggleModal("editPlan", true)}
                />
                <QuickAction
                  icon={Power}
                  label="Status"
                  onClick={() => toggleModal("statusChange", true)}
                  variant="danger"
                />
                <button
                  onClick={closePatientDetails}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center ml-2 border border-slate-200 dark:border-white/10"
                >
                  <X size={20} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              {isLoadingDetails ? (
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Quick Personal Info Strip */}
                      <div className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                        <SectionHeader
                          title="Quick Identification"
                          icon={User}
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Full Name
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Contact
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_phone || data.phone_number}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Age / Gender
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_age} Years • {data.patient_gender}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Condition
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_condition || "Active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
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
                            label="Treatment Consumed"
                            value={`₹${parseFloat(String(data.total_consumed || 0)).toLocaleString()}`}
                            icon={Activity}
                            color="blue"
                          />
                          <StatCard
                            label="Treatment Paid"
                            value={`₹${parseFloat(String(data.total_paid || 0)).toLocaleString()}`}
                            icon={Wallet}
                            color="emerald"
                          />
                          <StatCard
                            label="Effective Balance"
                            value={`₹${walletBalance.toLocaleString()}`}
                            icon={Wallet}
                            color={walletBalance < 0 ? "rose" : "emerald"}
                            subtext={
                              walletBalance < 0
                                ? "Outstanding Dues"
                                : "Available Credit"
                            }
                          />
                          <StatCard
                            label={
                              walletBalance < 0
                                ? "Current Arrears"
                                : "Plan Remaining"
                            }
                            value={`₹${dueAmount.toLocaleString()}`}
                            icon={AlertCircle}
                            color={
                              walletBalance < 0
                                ? "rose"
                                : dueAmount > 0
                                  ? "amber"
                                  : "emerald"
                            }
                            subtext={
                              walletBalance < 0
                                ? "Payment Required"
                                : dueAmount > 0
                                  ? "Upcoming Installments"
                                  : "All Clear"
                            }
                          />
                        </div>
                      </div>

                      {/* Panel 2: Treatment & Session */}
                      <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 opacity-50">
                          <Activity size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Session Details
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <StatCard
                            label="Cost / Day"
                            value={`₹${parseFloat(String(data.cost_per_day || 0)).toLocaleString()}`}
                            icon={CreditCard}
                            color="indigo"
                          />
                          <StatCard
                            label="Treatment Days"
                            value={`${data.attendance_count || 0}/${Math.max(data.treatment_days || 1, data.attendance_count || 1)}`}
                            icon={Calendar}
                            color="amber"
                            subtext={`${Math.round(((data.attendance_count || 0) / Math.max(data.treatment_days || 1, data.attendance_count || 1)) * 100)}% Complete`}
                          />
                          <StatCard
                            label="Session Time"
                            value={
                              data.treatment_time_slot
                                ? format(
                                    new Date(
                                      `2000-01-01T${data.treatment_time_slot}`,
                                    ),
                                    "hh:mm a",
                                  )
                                : "Not Set"
                            }
                            icon={Clock}
                            color="cyan"
                          />
                        </div>
                      </div>

                      {/* Panel 3: Test Financials (Separated from Treatment) */}
                      {(patientData.test_billed_amount > 0 ||
                        patientData.test_paid_amount > 0) && (
                        <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                          <div className="flex items-center gap-2 mb-6 opacity-50">
                            <FlaskConical size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">
                              Lab / Diagnostics Financials
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCard
                              label="Test Billed"
                              value={`₹${parseFloat(String(patientData.test_billed_amount || 0)).toLocaleString()}`}
                              icon={FlaskConical}
                              color="amber"
                            />
                            <StatCard
                              label="Test Paid"
                              value={`₹${parseFloat(String(patientData.test_paid_amount || 0)).toLocaleString()}`}
                              icon={Wallet}
                              color="blue"
                            />
                            <StatCard
                              label="Test Due"
                              value={`₹${Math.max(0, parseFloat(String(patientData.test_billed_amount || 0)) - parseFloat(String(patientData.test_paid_amount || 0))).toLocaleString()}`}
                              icon={AlertTriangle}
                              color={
                                Math.max(
                                  0,
                                  parseFloat(
                                    String(patientData.test_billed_amount || 0),
                                  ) -
                                    parseFloat(
                                      String(patientData.test_paid_amount || 0),
                                    ),
                                ) > 0
                                  ? "rose"
                                  : "emerald"
                              }
                              subtext={
                                Math.max(
                                  0,
                                  parseFloat(
                                    String(patientData.test_billed_amount || 0),
                                  ) -
                                    parseFloat(
                                      String(patientData.test_paid_amount || 0),
                                    ),
                                ) > 0
                                  ? "Diagnostics Pending"
                                  : "Lab Clear"
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Plan Progress & Quick Actions */}
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                              Plan Trajectory
                            </h3>
                            <p className="text-sm text-slate-500 max-w-md">
                              Patient is currently engaging with the{" "}
                              <strong className="text-emerald-500 font-bold text-lg">
                                {data.treatment_type}
                              </strong>{" "}
                              plan. <br /> Attendance consistency is tracked for
                              optimal recovery.
                            </p>
                            <div className="mt-8 flex gap-8">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Start Date
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                  {data.start_date
                                    ? format(data.start_date, "dd MMM yyyy")
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Renewal
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                  {data.end_date
                                    ? format(data.end_date, "dd MMM yyyy")
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="relative w-40 h-40 mr-2 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-800"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 70}
                                strokeDashoffset={
                                  2 *
                                  Math.PI *
                                  70 *
                                  (1 -
                                    (data.attendance_count || 0) /
                                      Math.max(
                                        data.treatment_days || 1,
                                        data.attendance_count || 1,
                                      ))
                                }
                                className="text-emerald-500 transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black text-slate-800 dark:text-white">
                                {data.attendance_count || 0}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                of{" "}
                                {Math.max(
                                  data.treatment_days || 1,
                                  data.attendance_count || 1,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity / Next Action */}
                        <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col relative overflow-hidden">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest">
                              Recent Activity
                            </h4>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                              <History size={16} />
                            </div>
                          </div>

                          <div className="space-y-4 flex-1">
                            {data.attendance?.slice(0, 3).map(
                              (
                                att: {
                                  date: string;
                                  attendance_date: string;
                                },
                                idx: number,
                              ) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3"
                                >
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                                  <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                      Attendance Marked
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-400">
                                      {format(
                                        att.date || att.attendance_date,
                                        "dd MMM, hh:mm a",
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                            {(!data.attendance ||
                              data.attendance.length === 0) && (
                              <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-bold text-slate-400">
                                  No recent activity
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveTab("attendance")}
                            className="w-full bg-white dark:bg-white/5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 hover:text-emerald-500 transition-colors mt-4"
                          >
                            View All
                          </button>
                        </div>
                      </div>

                      {/* Recent Tests */}
                      {data.tests && data.tests.length > 0 && (
                        <div className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                          <SectionHeader
                            title="Recent Tests"
                            icon={FlaskConical}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.tests
                              .slice(0, 3)
                              .map((t: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
                                    t.refund_status === "initiated"
                                      ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-60 grayscale"
                                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5"
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                                        {t.test_name}
                                      </h5>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {t.test_uid}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                          t.test_status === "completed"
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : t.test_status === "cancelled"
                                              ? "bg-rose-500/10 text-rose-500"
                                              : "bg-amber-500/10 text-amber-500"
                                        }`}
                                      >
                                        {t.test_status}
                                      </span>
                                      {t.refund_status === "initiated" && (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[8px] font-bold uppercase tracking-tighter animate-pulse">
                                          Refund Initiated
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] font-medium text-slate-400">
                                      {format(t.created_at, "dd MMM, yyyy")}
                                    </p>
                                    <p
                                      className={`text-xs font-black ${t.refund_status === "initiated" ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300"}`}
                                    >
                                      ₹
                                      {parseFloat(
                                        t.total_amount,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "profile" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Identity Panel */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-8 opacity-50">
                          <User size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Personal Identity
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                          <DetailField
                            label="Legal Name"
                            value={data.patient_name}
                            icon={User}
                          />
                          <DetailField
                            label="Date of Birth / Age"
                            value={`${data.patient_age} Years • ${data.patient_gender}`}
                            icon={Calendar}
                          />
                          <DetailField
                            label="Occupation"
                            value={data.occupation}
                            icon={Briefcase}
                          />
                          <DetailField
                            label="Registration ID"
                            value={`#${data.patient_id}`}
                            icon={Hash}
                          />
                        </div>
                      </div>

                      {/* Contact Panel */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-8 opacity-50">
                          <MapPin size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Contact Details
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                          <DetailField
                            label="Phone Number"
                            value={data.patient_phone || data.phone_number}
                            icon={Phone}
                          />
                          <DetailField
                            label="Email Address"
                            value={data.email}
                            icon={Mail}
                          />
                          <div className="md:col-span-2">
                            <DetailField
                              label="Residential Address"
                              value={data.address}
                              icon={MapPin}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clinical Panel */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-8 opacity-50">
                          <Activity size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Clinical Snapshot
                          </span>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                              Chief Complaint
                            </span>
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                              <p className="text-lg font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                "
                                {data.chief_complain ||
                                  "No specific complaint recorded."}
                                "
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailField
                              label="Lead Clinician"
                              value={
                                data.assigned_doctor?.replace(
                                  /^Dr\.\s*/i,
                                  "",
                                ) || "Unassigned"
                              }
                              icon={Stethoscope}
                            />
                            <DetailField
                              label="Referred By"
                              value={data.reffered_by || "Direct Walk-in"}
                              icon={UserPlus}
                            />
                            <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-white/5">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity
                                  size={12}
                                  className="text-emerald-500"
                                />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                  Current Status
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                {data.patient_condition ||
                                  "Patient is under active recovery observation."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "treatment" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Active Treatment Card */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <SectionHeader
                          title="Active Treatment"
                          icon={Stethoscope}
                        />

                        <h2 className="text-3xl font-black text-slate-800 dark:text-white capitalize mb-4">
                          {data.treatment_type || "No Plan Active"}
                        </h2>

                        <div className="flex items-baseline gap-2 mb-8">
                          <span className="text-4xl font-black text-emerald-500">
                            ₹
                            {parseFloat(
                              String(data.total_amount || "0"),
                            ).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Total Plan Value
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">
                              Progress: {data.attendance_count || 0}/
                              {Math.max(
                                data.treatment_days || 1,
                                data.attendance_count || 1,
                              )}{" "}
                              Sessions
                            </span>
                            <span className="text-emerald-500">
                              {Math.round(
                                ((data.attendance_count || 0) /
                                  Math.max(
                                    data.treatment_days || 1,
                                    data.attendance_count || 1,
                                  )) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, ((data.attendance_count || 0) / Math.max(data.treatment_days || 1, data.attendance_count || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                            <div className="flex flex-col">
                              <span>Start Date</span>
                              <span className="text-slate-800 dark:text-white mt-1">
                                {data.start_date
                                  ? format(data.start_date, "dd MMM yyyy")
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span>Renewal Date</span>
                              <span className="text-slate-800 dark:text-white mt-1">
                                {data.end_date
                                  ? format(data.end_date, "dd MMM yyyy")
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan History */}
                      <div className="space-y-4">
                        <SectionHeader title="Plan History" icon={History} />

                        {/* Archive Notice */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mb-6">
                          <AlertTriangle
                            size={18}
                            className="shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-bold leading-tight mb-1">
                              Archived Plan Records
                            </p>
                            <p className="text-[11px] font-medium opacity-80 leading-relaxed">
                              This section contains previous treatment plans
                              that have been completed or modified. These
                              records are for historical reference only.
                            </p>
                          </div>
                        </div>

                        {data.history?.map(
                          (
                            h: {
                              treatment_type: string;
                              start_date: string;
                              end_date: string;
                              total_amount: string | number;
                            },
                            i: number,
                          ) => (
                            <div
                              key={i}
                              className="p-6 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm"
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                  <Archive size={20} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {h.treatment_type}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {h.start_date} — {h.end_date}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-emerald-500">
                                  ₹
                                  {parseFloat(
                                    String(h.total_amount || "0"),
                                  ).toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase">
                                  Total Value
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                        {(!data.history || data.history.length === 0) && (
                          <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs">
                            No historical records found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "financials" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Compact Wallet Section */}
                      <div className="group relative bg-[#121417] rounded-[32px] p-8 shadow-xl overflow-hidden border border-white/5">
                        {/* Subtle Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Wallet size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">
                                  Financial Summary
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                    dueAmount > 0
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  }`}
                                >
                                  {dueAmount > 0 ? "Pending Dues" : "Paid Up"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">
                                Total Outstanding
                              </span>
                              <h3
                                className={`text-4xl font-black tracking-tighter ${
                                  dueAmount +
                                    (walletBalance < 0
                                      ? Math.abs(walletBalance)
                                      : 0) >
                                  0
                                    ? "text-rose-500"
                                    : "text-white"
                                }`}
                              >
                                ₹
                                {(
                                  dueAmount +
                                  (walletBalance < 0
                                    ? Math.abs(walletBalance)
                                    : 0)
                                ).toLocaleString()}
                              </h3>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">
                                Available Credit
                              </span>
                              <span
                                className={`text-xl font-black tracking-tight ${walletBalance < 0 ? "text-rose-500" : "text-emerald-400"}`}
                              >
                                {walletBalance < 0 ? "-" : ""}₹
                                {Math.abs(walletBalance).toLocaleString()}
                              </span>
                            </div>
                            <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">
                                Net Consumption
                              </span>
                              <span className="text-xl font-black text-slate-200 tracking-tight">
                                ₹
                                {Math.round(
                                  parseFloat(
                                    String(data.total_consumed || "0"),
                                  ),
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleModal("payDues", true)}
                            className="group relative w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#00390a] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 overflow-hidden"
                          >
                            <CreditCard size={16} strokeWidth={3} />
                            Pay Total: ₹
                            {(
                              dueAmount +
                              (walletBalance < 0 ? Math.abs(walletBalance) : 0)
                            ).toLocaleString()}
                            <ArrowRight
                              size={16}
                              strokeWidth={3}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Transaction Ledger */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <SectionHeader
                            title="Activity Ledger"
                            icon={History}
                          />
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                            {data.payments?.length || 0} Records
                          </div>
                        </div>

                        <div className="space-y-3">
                          {data.payments && data.payments.length > 0 ? (
                            data.payments
                              .slice()
                              .reverse()
                              .map((payment: any, idx: number) => (
                                <motion.div
                                  key={payment.payment_id || idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                      <CreditCard size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mb-0.5">
                                        {payment.payment_method ||
                                          payment.notes ||
                                          "Settlement"}
                                      </h4>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {format(
                                          payment.payment_date ||
                                            payment.created_at,
                                          "dd MMM yyyy • HH:mm",
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-xl font-black text-emerald-500 tracking-tight">
                                      ₹
                                      {parseFloat(
                                        String(payment.amount),
                                      ).toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Success
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                          ) : (
                            <div className="py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px] text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                No transactional data available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "attendance" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          Attendance Log
                        </h3>
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {data.attendance?.length || 0} Records
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.attendance
                          ?.slice()
                          .sort(
                            (
                              a: { date: string; attendance_date: string },
                              b: { date: string; attendance_date: string },
                            ) =>
                              (parseDateSafe(
                                b.date || b.attendance_date,
                              )?.getTime() || 0) -
                              (parseDateSafe(
                                a.date || a.attendance_date,
                              )?.getTime() || 0),
                          )
                          .map(
                            (
                              att: {
                                date: string;
                                attendance_date: string;
                                status: string;
                                remarks?: string;
                              },
                              idx: number,
                            ) => (
                              <div
                                key={idx}
                                className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col gap-3 group hover:border-emerald-200 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">
                                      {format(
                                        att.date || att.attendance_date,
                                        "dd MMM yyyy",
                                      )}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                      {format(
                                        att.date || att.attendance_date,
                                        "EEEE",
                                      )}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${att.status === "present" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
                                  >
                                    {att.status === "present" ? (
                                      <CheckCircle2 size={14} />
                                    ) : (
                                      <AlertTriangle size={14} />
                                    )}
                                  </div>
                                </div>
                                {att.remarks && (
                                  <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-start gap-2">
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex-1 leading-relaxed">
                                      <span className="font-bold uppercase tracking-wider block mb-0.5 opacity-60">
                                        Message
                                      </span>
                                      <span className="font-medium">
                                        {att.remarks}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "clinical" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4 p-6 rounded-[24px] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                        <AlertCircle size={24} />
                        <div>
                          <h4 className="font-bold text-sm">
                            Clinical Observations
                          </h4>
                          <p className="text-xs opacity-70">
                            Logs are immutable and recorded by assigned
                            doctors/staff.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(() => {
                          const raw = data.remarks || "";
                          const parts = raw.split(
                            /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/g,
                          );
                          const logs = [];
                          if (parts.length < 2)
                            return (
                              <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs">
                                No clinical logs available
                              </div>
                            );
                          for (let i = 1; i < parts.length; i += 2)
                            logs.push({ date: parts[i], msg: parts[i + 1] });
                          return logs.reverse().map((log, idx) => (
                            <div key={idx} className="flex gap-6">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/20" />
                                {idx !== logs.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-8">
                                <div className="p-6 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {format(
                                        log.date,
                                        "dd MMM yyyy • hh:mm a",
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    "{log.msg?.trim()}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {modals.payDues && (
        <PayDuesModal
          isOpen={modals.payDues}
          onClose={() => toggleModal("payDues", false)}
          patientId={selectedPatient.patient_id}
          currentDue={
            dueAmount + (walletBalance < 0 ? Math.abs(walletBalance) : 0)
          }
          walletBalance={walletBalance}
          onSuccess={handleRefresh}
        />
      )}
      {modals.addTest && (
        <AddTestModal
          isOpen={modals.addTest}
          onClose={() => toggleModal("addTest", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.editPlan && (
        <EditPlanModal
          isOpen={modals.editPlan}
          onClose={() => toggleModal("editPlan", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.changePlan && (
        <ChangePlanModal
          isOpen={modals.changePlan}
          onClose={() => toggleModal("changePlan", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.statusChange && (
        <StatusChangeModal
          isOpen={modals.statusChange}
          onClose={() => toggleModal("statusChange", false)}
          patientId={data.patient_id || 0}
          currentStatus={data.patient_status || "active"}
        />
      )}
    </AnimatePresence>
  );
};

export default PatientDetailsModal;
